// @vitest-environment node
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { PILOT_ACCESS_VERSION, pilotDigest } from '../../supabase/functions/generate-concept/pilot-access';

// Intentionally does NOT mock the public hold or invite adapter.
const state = vi.hoisted(() => ({
  env: {} as Record<string, string>, rows: [] as Record<string, unknown>[],
  access: false, accessError: false, reserveAllowed: true, dispatchAllowed: true, finishAllowed: true, imagesRemaining: 5, signError:false,
  operations:new Map<string,Record<string,unknown>>(),blobs:new Map<string,Uint8Array>(),plannerOutput:null as unknown,finishAckLost:false,insertAckLost:false,
  calls: [] as string[], createClient: vi.fn(), query: vi.fn(), sign: vi.fn(), upload: vi.fn(),
  directWebsite: vi.fn(), fallbackWebsite: vi.fn(), rpc: vi.fn(),
}));
const inviteId = '10000000-0000-4000-8000-000000000001';
const campaignId = '10000000-0000-4000-8000-000000000002';
const savedId = '10000000-0000-4000-8000-000000000004';
const token = 'A'.repeat(43); // Nonissued fixture, never a real credential.
vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({ createClient: () => {
  state.createClient();
  return {
    rpc: async (name: string, params: Record<string, unknown>) => {
      state.rpc(name, params); state.calls.push(name);
      if (name === 'get_pilot_invite_access') return { error: state.accessError ? new Error('No migration') : null,
        data: state.access ? { ready: true, invite_id: inviteId, campaign_id: campaignId,
          expires_at: '2099-01-01T00:00:00Z', remaining: { image_attempts: state.imagesRemaining, planner_attempts: 1 } } : { ready: false } };
      if(name === 'get_pilot_operation') { const op=state.operations.get(String(params.request_fingerprint));return {data:op?{...op,status:op.status==='reserved'?'in_progress':op.status,allowed:false}:{status:'not_found',allowed:false}}; }
      if (name === 'reserve_pilot_operation') {
        const fingerprint=String(params.request_fingerprint);const existing=state.operations.get(fingerprint);
        if(existing)return {data:{...existing,status:existing.status==='reserved'?'in_progress':existing.status,allowed:false}};
        if(!state.reserveAllowed)return {data:{allowed:false,status:'denied'}};
        const op={allowed:true,status:'reserved',operation_id:crypto.randomUUID(),result_id:null,response_payload:null};state.operations.set(fingerprint,op);return {data:op};
      }
      if (name === 'claim_pilot_dispatch') return { data: { allowed: state.dispatchAllowed } };
      if (name === 'finish_pilot_operation') {
        if(state.finishAllowed){const op=[...state.operations.values()].find(op=>op.operation_id===params.operation_id);if(op)Object.assign(op,{status:params.failure_code?'failed':'completed',result_id:params.result_id,response_payload:params.response_payload});}
        return state.finishAckLost?{error:new Error('Finalization acknowledgement lost')}:{ data: { ok: state.finishAllowed } };
      }
      throw new Error('Unexpected RPC');
    },
    from: (table: string) => ({
      select: (fields: string) => {
        state.query(table, fields);
        return { limit: async () => ({ error: null }), eq: (field: string, value: unknown) => ({ maybeSingle: async () => ({ data: state.rows.find(row => row[field] === value) || null }) }) };
      },
      insert: async (row: Record<string, unknown>) => { state.rows.push(row); return { error: state.insertAckLost?new Error('Insert acknowledgement lost'):null }; },
    }),
    storage: { from: () => ({
      createSignedUrl: async (path: string) => { state.sign(path); return { data: { signedUrl: 'https://private.invalid/image' },error:state.signError?new Error('Signing unavailable'):null }; },
      upload: async (path:string,bytes:Uint8Array,...args:unknown[]) => { state.upload(path,bytes,...args);state.blobs.set(path,bytes);return { error: null }; },
      remove: async () => ({ error: null }),
      download: async (path:string) => { const bytes=state.blobs.get(path);return {data:bytes?{size:bytes.length,type:'image/png',arrayBuffer:async()=>Uint8Array.from(bytes).buffer}:null}; },
    }) },
  };
} }));
vi.mock('../../supabase/functions/generate-concept/website', async original => ({
  ...(await original<typeof import('../../supabase/functions/generate-concept/website')>()),
  readCompanyWebsite: (...args: unknown[]) => state.fallbackWebsite(...args),
  readCompanyWebsiteDirect: (...args: unknown[]) => state.directWebsite(...args),
}));
let handleRequest: (request: Request) => Promise<Response>;
const world = { contractVersion: 'offkin-proposal-v10', stage: 'world', brand: 'no-website',
  customerIdentity: { version: 'customer-brand-v1', name: 'Fixture Studio' }, context: { business: 'A fictional paper studio.' } };
const post = (body: unknown, headers: Record<string, string> = {}, url = 'https://edge.invalid/') => handleRequest(new Request(url, {
  method: 'POST', headers, body: JSON.stringify(body),
}));
function install() {
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('Deno', { serve: vi.fn(), env: { get: (key: string) => state.env[key] } });
}
beforeAll(async () => { install(); const path = '../../supabase/functions/generate-concept/index.ts'; handleRequest = (await import(path)).handleRequest; });
beforeEach(() => {
  install(); state.env = { SUPABASE_URL: 'https://db.invalid', SUPABASE_SERVICE_ROLE_KEY: 'mock-only', LOVABLE_API_KEY: 'mock-only',
    BRICK_GENERATION_ENABLED: 'true', BRICK_PROPOSAL_ENABLED: 'true', BRICK_ENFORCE_DAILY_LIMITS: 'false', FIRECRAWL_API_KEY: 'mock-only' };
  state.rows = []; state.access = false; state.accessError = false; state.reserveAllowed = true; state.dispatchAllowed = true; state.finishAllowed = true; state.imagesRemaining = 5; state.calls = [];state.signError=false;state.operations.clear();state.blobs.clear();state.plannerOutput=null;state.finishAckLost=false;state.insertAckLost=false;
  for (const fn of [state.createClient, state.query, state.sign, state.upload, state.directWebsite, state.fallbackWebsite, state.rpc]) fn.mockReset();
  state.directWebsite.mockResolvedValue({ url: 'https://fixture.example/', title: 'Fixture', excerpt: 'A fictional paper studio.' });
  state.fallbackWebsite.mockRejectedValue(new Error('Paid fallback forbidden'));
  vi.stubGlobal('fetch', vi.fn(async (url: string,init?:RequestInit) => {
    state.calls.push(url.endsWith('chat/completions') ? 'provider:text' : 'provider:image');
    if(url.endsWith('chat/completions')){const body=JSON.parse(String(init?.body));const direction=JSON.parse(body.messages[1].content);
      if(direction.instruction&&direction.currentProposal)return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(state.plannerOutput||{scope:'packaging',context:{revisionNotes:direction.instruction},summary:'Update packaging only.'})}}]}));
    }
    return new Response(JSON.stringify(url.endsWith('chat/completions') ? { choices: [{ message: { content: JSON.stringify({
      needsContext: false, brand: 'Fixture Studio', title: 'Paper world', story: 'A fictional paper world.', design: 'A layered collectible paper world.', interaction: 'Display only',
      worldElements: [{ id: 'paper-arch', label: 'Paper arch', description: 'A layered arch.', kind: 'proposal' }, { id: 'paper-river', label: 'Paper river', description: 'A folded river.', kind: 'proposal' }],
    }) } }] } : { data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS1sAAAAASUVORK5CYII=' }] }));
  }));
});
afterEach(() => vi.unstubAllGlobals());
const noExternalWork = () => {
  expect(fetch).not.toHaveBeenCalled(); expect(state.directWebsite).not.toHaveBeenCalled(); expect(state.fallbackWebsite).not.toHaveBeenCalled();
  expect(state.query).not.toHaveBeenCalled(); expect(state.sign).not.toHaveBeenCalled(); expect(state.upload).not.toHaveBeenCalled();
};

describe('real public hold and private pilot endpoint boundary', () => {
  it('reports the anonymous hold even with every legacy provider flag enabled', async () => {
    const response = await handleRequest(new Request('https://edge.invalid/'));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ready: false, generation_paused: true, invite_access_ready: false,
      capabilities: { proposal: false }, pilot_access: { version: PILOT_ACCESS_VERSION, authorized: false } });
    expect(state.createClient).not.toHaveBeenCalled(); noExternalWork();
  });
  it.each([
    world, { ...world, stage: 'physical', sourceWorldId: savedId }, { ...world, action: 'plan-revision' },
    { brand: 'https://fixture.example' }, { brand: 'https://fixture.example', contractVersion: 'offkin-cocreation-v8' },
    { brand: 'https://fixture.example', contractVersion: 'offkin-canvas-v9', stage: 'world' },
    { brand: 'https://fixture.example', inspectWebsite: true }, { brand: 'https://fixture.example', summaryOnly: true },
    { id: savedId, inspectWebsite: true }, { id: savedId, contractVersion: 'offkin-proposal-v10' },
    { id: savedId, stage: 'world' }, { id: savedId, extra: 'ignored?' }, {},
  ])('denies every anonymous non-restore shape before external operations: %j', async body => {
    expect((await post(body)).status).toBe(503); expect(state.createClient).not.toHaveBeenCalled(); noExternalWork();
  });
  it('ignores query, body, authorization and client enablement attempts', async () => {
    const response = await post({ ...world, invite: token, enabled: true, generationMode: 'creative-preview' },
      { Authorization: `Bearer ${token}`, 'x-invite-token': token }, `https://edge.invalid/?invite=${token}&enabled=true`);
    expect(response.status).toBe(503); expect(state.createClient).not.toHaveBeenCalled(); noExternalWork();
  });
  it.each(['', 'A'.repeat(42), 'A'.repeat(44), ' '.repeat(43), 'a,b'])('rejects malformed dedicated header %s', async value => {
    expect((await post(world, { 'x-offkin-invite': value })).status).toBe(503); expect(state.createClient).not.toHaveBeenCalled(); noExternalWork();
  });
  it.each([false, true])('fails closed for denied credentials or missing migration (db error: %s)', async error => {
    state.accessError = error;
    expect((await post(world, { 'x-offkin-invite': token })).status).toBe(503);
    expect(state.rpc).toHaveBeenCalledWith('get_pilot_invite_access', { token_digest: await pilotDigest(token) });
    noExternalWork();
  });
  it('preserves exact ID-only restoration without an invite or enabled generation', async () => {
    delete state.env.LOVABLE_API_KEY; state.env.BRICK_GENERATION_ENABLED = 'false';
    state.rows.push({ id: savedId, brand: 'Old studio', title: 'Old preview', story: 'Saved story.', image_path: `${savedId}.png` });
    const response = await post({ id: savedId });
    expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ concept: { id: savedId } });
    expect(state.rpc).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled(); expect(state.fallbackWebsite).not.toHaveBeenCalled();
  });
  it.each([null, false, 0, '', 'not-a-uuid'])('rejects invalid exact restore IDs before a DB call: %j', async id => {
    expect((await post({ id })).status).toBe(400); expect(state.createClient).not.toHaveBeenCalled(); noExternalWork();
  });
  it('preserves OPTIONS, method rejection and bounded JSON parsing', async () => {
    expect((await handleRequest(new Request('https://edge.invalid/', { method: 'OPTIONS' }))).status).toBe(200);
    expect((await handleRequest(new Request('https://edge.invalid/', { method: 'DELETE' }))).status).toBe(405);
    for (const body of ['{', 'null', '[]']) expect((await handleRequest(new Request('https://edge.invalid/', { method: 'POST', body }))).status).toBe(400);
    expect((await handleRequest(new Request('https://edge.invalid/', { method: 'POST', body: 'x'.repeat(48001) }))).status).toBe(413);
    noExternalWork();
  });
  it('advertises only sanitized invite readiness after database validation', async () => {
    state.access = true;
    const response = await handleRequest(new Request('https://edge.invalid/', { headers: { 'x-offkin-invite': token } }));
    const body = await response.json();
    expect(response.status).toBe(200); expect(body).toMatchObject({ ready: true, capabilities: { proposal: true },
      pilot_access: { version: PILOT_ACCESS_VERSION, authorized: true, images_remaining: 5, planners_remaining: 1 } });
    expect(JSON.stringify(body)).not.toContain(token); expect(JSON.stringify(body)).not.toContain(inviteId);
    expect(fetch).not.toHaveBeenCalled(); expect(state.fallbackWebsite).not.toHaveBeenCalled();
  });
  it.each([{ brand: 'https://fixture.example', inspectWebsite: true }, { brand: 'https://fixture.example' },
    { ...world, inspectWebsite: true }, { ...world, summaryOnly: true }])('rejects legacy/inspection bypass even with an active invite: %j', async body => {
    state.access = true;
    expect((await post(body, { 'x-offkin-invite': token })).status).toBe(403); noExternalWork();
  });
  it.each(['exhausted', 'provider-paused'])('returns an honest successful status read for an authenticated but %s invite', async reason => {
    state.access = true;
    if(reason === 'exhausted') state.imagesRemaining = 0; else state.env.BRICK_GENERATION_ENABLED = 'false';
    const response = await handleRequest(new Request('https://edge.invalid/', { headers: { 'x-offkin-invite': token } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ready: reason==='exhausted', generation_paused: reason!=='exhausted', capabilities: { proposal: true },
      pilot_access: { authorized: true,recovery_available:true, images_remaining: reason === 'exhausted' ? 0 : 5 } });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('wraps each real preview provider call in an atomic reservation and dispatch claim', async () => {
    state.access = true;
    const response = await post(world, { 'x-offkin-invite': token });
    expect(response.status, JSON.stringify(await response.clone().json())).toBe(200);
    expect(state.calls).toEqual(['get_pilot_invite_access', 'reserve_pilot_operation', 'claim_pilot_dispatch', 'provider:text', 'claim_pilot_dispatch', 'provider:image', 'finish_pilot_operation']);
    expect(state.rows[0].pilot_invite_id).toBe(inviteId);
    expect(JSON.stringify(state.rows)).not.toContain(token);
    expect(JSON.stringify(vi.mocked(fetch).mock.calls)).not.toContain(token);
    expect(state.fallbackWebsite).not.toHaveBeenCalled();
  });
  it('requires budgeted saved research instead of an unmetered pilot website read', async () => {
    state.access = true;
    const response = await post({ ...world, brand: 'https://example.com' }, { 'x-offkin-invite': token });
    expect(response.status).toBe(403); expect(state.directWebsite).not.toHaveBeenCalled(); expect(state.fallbackWebsite).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled(); expect(state.query).not.toHaveBeenCalled();
    expect(state.rpc.mock.calls.map(call=>call[0])).toEqual(['get_pilot_invite_access']);
  });
  it('restores a same-invite completed cache entry without another reservation or provider call', async () => {
    state.access = true;
    const first = await post(world, { 'x-offkin-invite': token }); expect(first.status).toBe(200);
    const before = state.calls.length;
    const cached = await post(world, { 'x-offkin-invite': token }); expect(cached.status).toBe(200);
    expect(state.calls.slice(before)).toEqual(['get_pilot_invite_access','get_pilot_operation']); expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('rejects mismatched cache ownership rather than disclosing another invite’s result', async () => {
    state.access = true;
    expect((await post(world, { 'x-offkin-invite': token })).status).toBe(200);
    state.rows[0].pilot_invite_id = campaignId;
    const before = state.calls.length;
    expect((await post(world, { 'x-offkin-invite': token })).status).toBe(403);
    expect(state.calls.slice(before)).toEqual(['get_pilot_invite_access']); expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('rejects another invite’s source before downloading bytes or reserving generation', async () => {
    state.access = true;
    const first = await post(world, { 'x-offkin-invite': token }); const body = await first.json(); expect(first.status).toBe(200);
    state.rows[0].pilot_invite_id = campaignId;
    const before = state.calls.length;
    const physical = { ...world, stage: 'physical', sourceWorldId: body.concept.id,
      selectedElementIds: ['paper-arch', 'paper-river'], heroElementId: 'paper-arch', replacements: [] };
    expect((await post(physical, { 'x-offkin-invite': token })).status).toBe(403);
    expect(state.calls.slice(before)).toEqual(['get_pilot_invite_access']); expect(fetch).toHaveBeenCalledTimes(2);
  });
  it.each(['reserve', 'dispatch'])('does not contact providers when the database denies %s', async boundary => {
    state.access = true; state.reserveAllowed = boundary !== 'reserve'; state.dispatchAllowed = boundary !== 'dispatch';
    expect((await post(world, { 'x-offkin-invite': token })).status).toBe(boundary === 'reserve' ? 429 : 409);
    expect(fetch).not.toHaveBeenCalled(); expect(state.upload).not.toHaveBeenCalled();
  });
  it('recovers a saved image after signing fails, with accounting already complete', async () => {
    state.access=true;state.signError=true;
    expect((await post(world,{'x-offkin-invite':token})).status).toBe(503);
    expect([...state.operations.values()][0]).toMatchObject({status:'completed',result_id:state.rows[0].id});
    state.signError=false;const before=state.calls.length;
    expect((await post(world,{'x-offkin-invite':token,'x-offkin-recovery':'1'})).status).toBe(200);
    expect(state.calls.slice(before)).toEqual(['get_pilot_invite_access','get_pilot_operation']);expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('reconciles an owned saved row after finalization fails without refund or provider redispatch', async () => {
    state.access=true;state.finishAllowed=false;
    expect((await post(world,{'x-offkin-invite':token})).status).toBe(503);
    expect([...state.operations.values()][0].status).toBe('reserved');expect(state.rows).toHaveLength(1);
    state.finishAllowed=true;state.imagesRemaining=0;state.env.BRICK_GENERATION_ENABLED='false';delete state.env.LOVABLE_API_KEY;
    const before=state.calls.length;
    expect((await post(world,{'x-offkin-invite':token,'x-offkin-recovery':'1'})).status).toBe(200);
    expect(state.calls.slice(before)).toEqual(['get_pilot_invite_access','get_pilot_operation','finish_pilot_operation']);
    expect([...state.operations.values()][0]).toMatchObject({status:'completed',result_id:state.rows[0].id});expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('recovers when finalization committed but its acknowledgement was lost', async () => {
    state.access=true;state.finishAckLost=true;
    expect((await post(world,{'x-offkin-invite':token})).status).toBe(503);
    expect([...state.operations.values()][0].status).toBe('completed');
    const before=state.calls.length;
    expect((await post(world,{'x-offkin-invite':token,'x-offkin-recovery':'1'})).status).toBe(200);
    expect(state.calls.slice(before)).toEqual(['get_pilot_invite_access','get_pilot_operation']);expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('retains the uploaded image when an insert committed but its acknowledgement was lost', async () => {
    state.access=true;state.insertAckLost=true;
    expect((await post(world,{'x-offkin-invite':token})).status).toBe(200);
    expect(state.rows).toHaveLength(1);expect(state.blobs.has(String(state.rows[0].image_path))).toBe(true);
    expect([...state.operations.values()][0].status).toBe('completed');expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('never allocates or dispatches from a recovery cache miss, even with generation enabled', async () => {
    state.access=true;
    expect((await post(world,{'x-offkin-invite':token,'x-offkin-recovery':'1'})).status).toBe(409);
    expect(state.calls).toEqual(['get_pilot_invite_access','get_pilot_operation']);expect(fetch).not.toHaveBeenCalled();expect(state.operations.size).toBe(0);
    expect(state.directWebsite).not.toHaveBeenCalled();expect(state.fallbackWebsite).not.toHaveBeenCalled();
  });
  it('rejects a misspelled recovery mode rather than accidentally starting paid generation', async () => {
    state.access=true;
    expect((await post(world,{'x-offkin-invite':token,'x-offkin-recovery':'true'})).status).toBe(400);
    expect(state.rpc).not.toHaveBeenCalled();expect(fetch).not.toHaveBeenCalled();
  });
  async function baseline(){
    const generated=async(body:unknown)=>{const response=await post(body,{'x-offkin-invite':token});const data=await response.json();expect(response.status,JSON.stringify(data)).toBe(200);return data.concept;};
    const w=await generated(world);
    const p=await generated({...world,stage:'physical',sourceWorldId:w.id,selectedElementIds:['paper-arch','paper-river'],heroElementId:'paper-arch',replacements:[]});
    const d=await generated({...world,stage:'details',sourceWorldId:w.id,sourcePhysicalId:p.id});
    const pack=await generated({...world,stage:'packaging',sourceWorldId:w.id,sourcePhysicalId:p.id});
    return {contractVersion:'offkin-proposal-v10',action:'plan-revision',brand:'no-website',context:world.context,
      instruction:'Make only the packaging blue.',sourceWorldId:w.id,sourcePhysicalId:p.id,detailsId:d.id,packagingId:pack.id};
  }
  it('persists a completed planner response and replays the exact request after response loss', async () => {
    state.access=true;const request=await baseline();
    const first=await post(request,{'x-offkin-invite':token});const expected=await first.json();expect(first.status,JSON.stringify(expected)).toBe(200);
    const planning=[...state.operations.values()].find(op=>op.response_payload);expect(planning).toMatchObject({status:'completed',response_payload:expected});
    state.imagesRemaining=0;state.env.BRICK_GENERATION_ENABLED='false';delete state.env.LOVABLE_API_KEY;
    const before=state.calls.length;
    const recovered=await post(request,{'x-offkin-invite':token,'x-offkin-recovery':'1'});
    expect(recovered.status).toBe(200);expect(await recovered.json()).toEqual(expected);
    expect(state.calls.slice(before)).toEqual(['get_pilot_invite_access','get_pilot_operation']);expect(fetch).toHaveBeenCalledTimes(9);
  });
  it('does not use a changed recovery instruction as permission to run another planner', async () => {
    state.access=true;const request=await baseline();expect((await post(request,{'x-offkin-invite':token})).status).toBe(200);
    const before=state.calls.length;
    expect((await post({...request,instruction:'Now change the whole world.'},{'x-offkin-invite':token,'x-offkin-recovery':'1'})).status).toBe(409);
    expect(state.calls.slice(before)).toEqual(['get_pilot_invite_access','get_pilot_operation']);expect(fetch).toHaveBeenCalledTimes(9);
  });
  it('rejects a broad planner scope after the text call and before any revision image', async () => {
    state.access=true;const request=await baseline();state.plannerOutput={scope:'world',context:{business:'A changed story.'},summary:'Change the whole world.'};
    const response=await post(request,{'x-offkin-invite':token});
    expect(response.status).toBe(403);expect((await response.json()).error).toContain('no revision image');
    expect(fetch).toHaveBeenCalledTimes(9);expect(state.rows).toHaveLength(4);
  });
});

// A valid invitation cannot bypass the two-read discovery ledger by calling world generation directly.
it('rejects repeated website-only pilot worlds before cache, reads, reservations or provider dispatch', async () => {
  state.access = true;
  for (const body of [{...world,brand:'https://fixture.com/'}, {...world,brand:'https://fixture.com/',context:{}}, {...world,brand:'https://another.com/'}]) {
    expect((await post(body,{'x-offkin-invite':token})).status).toBe(403);
  }
  expect(state.rpc.mock.calls.map(call=>call[0])).toEqual(['get_pilot_invite_access','get_pilot_invite_access','get_pilot_invite_access']);
  noExternalWork();
});
