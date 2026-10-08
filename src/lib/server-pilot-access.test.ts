// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { loadPilotAccess, pilotDigest, pilotExecution, publicPilotAccess, requestPilotDigest, type PilotAccess } from '../../supabase/functions/generate-concept/pilot-access';
import type { ProposalRequest, RevisionPlanRequest } from '../../supabase/functions/generate-concept/proposal';

const inviteId = '10000000-0000-4000-8000-000000000001';
const campaignId = '10000000-0000-4000-8000-000000000002';
const operationId = '10000000-0000-4000-8000-000000000003';
const worldId = '10000000-0000-4000-8000-000000000004';
const physicalId = '10000000-0000-4000-8000-000000000005';
const token = 'A'.repeat(43); // Unissued fixture.
const access: PilotAccess = { digest: 'a'.repeat(64), inviteId, campaignId, expiresAt: '2099-01-01T00:00:00Z', imagesRemaining: 5, plannersRemaining: 1 };
const world: ProposalRequest = { contractVersion: 'offkin-proposal-v10', stage: 'world', brand: 'no-website', context: { business: 'A fictional studio.' } };
beforeEach(() => vi.stubGlobal('crypto', webcrypto));
function db() {
  return { rpc: vi.fn(async (name: string, _parameters: Record<string, unknown>): Promise<{ data?: unknown; error?: unknown }> => {
    if (name === 'reserve_pilot_operation') return { data: { allowed: true, status: 'reserved', operation_id: operationId } };
    if (name === 'claim_pilot_dispatch') return { data: { allowed: true } };
    if (name === 'finish_pilot_operation') return { data: { ok: true } };
    return { data: { ready: true, invite_id: inviteId, campaign_id: campaignId, expires_at: access.expiresAt,
      remaining: { image_attempts: 5, planner_attempts: 1 } } };
  }) };
}
describe('private pilot authorization and operation adapter', () => {
  it('only hashes the dedicated header and never returns a raw token', async () => {
    expect(await requestPilotDigest(new Request(`https://example.invalid/?invite=${token}`, { headers: { authorization: `Bearer ${token}` } }))).toBeNull();
    const digest = await requestPilotDigest(new Request('https://example.invalid/', { headers: { 'x-offkin-invite': token } }));
    expect(digest).toMatch(/^[a-f0-9]{64}$/); expect(digest).toBe(await pilotDigest(token)); expect(digest).not.toContain(token);
  });
  it('maps database access to a bounded, sanitized frontend contract', async () => {
    const database = db(); const result = await loadPilotAccess(database, access.digest);
    expect(result).toEqual(access);
    expect(publicPilotAccess(result!)).toEqual({ version: 'offkin-pilot-v1', authorized: true,recovery_available:true,blocked_attempt:false, images_remaining: 5, planners_remaining: 1, expires_at: access.expiresAt });
    expect(database.rpc).toHaveBeenCalledWith('get_pilot_invite_access', { token_digest: access.digest });
  });
  it.each([
    { ready: false }, { invite_id: token }, { campaign_id: '' }, { expires_at: '2000-01-01T00:00:00Z' }, { expires_at: 'invalid' },
    { remaining: { image_attempts: 6, planner_attempts: 1 } }, { remaining: { image_attempts: 5, planner_attempts: 2 } },
    { remaining: { image_attempts: -1, planner_attempts: 1 } }, { remaining: { image_attempts: '5', planner_attempts: 1 } },
  ])('fails closed on invalid, expired or overbroad readiness data: %j', async patch => {
    const database = db(); database.rpc.mockResolvedValue({ data: { ready: true, invite_id: inviteId, campaign_id: campaignId, expires_at: access.expiresAt,
      remaining: { image_attempts: 5, planner_attempts: 1 }, ...patch } });
    expect(await loadPilotAccess(database, access.digest)).toBeNull();
  });
  it('authenticates exhausted invites without inventing another allowance', async () => {
    const database = db(); database.rpc.mockResolvedValue({ data: { ready: true, invite_id: inviteId, campaign_id: campaignId, expires_at: access.expiresAt,
      remaining: { image_attempts: 0, planner_attempts: 0 } } });
    expect(await loadPilotAccess(database, access.digest)).toMatchObject({ imagesRemaining: 0, plannersRemaining: 0 });
  });
  it('enforces source ownership independently of UUID knowledge', () => {
    const execution = pilotExecution(db(), access);
    expect(() => execution.assertSource({ pilot_invite_id: inviteId })).not.toThrow();
    expect(() => execution.assertSource({ pilot_invite_id: campaignId })).toThrow(/not part/);
    expect(() => execution.assertSource({})).toThrow(/not part/);
  });
  it('claims a canonical immutable request before either provider operation', async () => {
    const database = db(); const execution = pilotExecution(database, access);
    await expect(execution.claim('chat/completions')).rejects.toThrow(/No active/);
    expect(database.rpc).not.toHaveBeenCalled();
    await execution.reserve(world);
    const [name, params] = database.rpc.mock.calls[0];
    expect(name).toBe('reserve_pilot_operation');
    expect(params).toMatchObject({ token_digest: access.digest, operation_kind: 'asset', stage: 'world', source_world_id: null, source_physical_id: null, previous_asset_id: null });
    expect(params.request_fingerprint).toMatch(/^[a-f0-9]{64}$/); expect(params.operation_key).toBe(params.request_fingerprint);
    expect(JSON.stringify(params)).not.toContain(world.context.business);
    await execution.claim('chat/completions'); await execution.claim('images/generations');
    expect(database.rpc.mock.calls.slice(1)).toEqual([
      ['claim_pilot_dispatch', { operation_id: operationId, dispatch_kind: 'text' }],
      ['claim_pilot_dispatch', { operation_id: operationId, dispatch_kind: 'image' }],
    ]);
    await expect(execution.reserve(world)).rejects.toThrow(/already been reserved/);
  });
  it('reserves planning independently and never reserves an image for it', async () => {
    const database = db(); const execution = pilotExecution(database, access);
    const planner: RevisionPlanRequest = { contractVersion: 'offkin-proposal-v10', action: 'plan-revision', brand: 'no-website',
      context: world.context, instruction: 'Make the packaging blue.', sourceWorldId: worldId, sourcePhysicalId: physicalId };
    await execution.reserve(planner);
    expect(database.rpc.mock.calls[0][1]).toMatchObject({ operation_kind: 'planner', stage: null, source_world_id: worldId, source_physical_id: physicalId, previous_asset_id: null });
    await execution.claim('chat/completions');
    await execution.finish(new Response(JSON.stringify({ clarification: 'Which details?' })));
    expect(database.rpc).toHaveBeenLastCalledWith('finish_pilot_operation', { operation_id: operationId, result_id: null, failure_code: null,response_payload:{clarification:'Which details?'} });
  });
  it.each(['in_progress', 'completed', 'failed', 'consumed', 'denied'])('does not retry a %s reservation', async status => {
    const database = db(); database.rpc.mockResolvedValue({ data: { allowed: false, status, operation_id: operationId } });
    const execution = pilotExecution(database, access);
    await expect(execution.reserve(world)).rejects.toThrow();
    await expect(execution.claim('images/generations')).rejects.toThrow(/No active/);
    expect(database.rpc).toHaveBeenCalledTimes(1);
  });
  it('fails closed when authorization changes between reservation and dispatch', async () => {
    const database = db(); const execution = pilotExecution(database, access); await execution.reserve(world);
    database.rpc.mockResolvedValueOnce({ data: { allowed: false, reason: 'invite_revoked' } });
    await expect(execution.claim('chat/completions')).rejects.toThrow(/cannot be started safely/);
  });
  it('records failure without refunding or retrying unknown provider work', async () => {
    const database = db(); const execution = pilotExecution(database, access);
    await execution.reserve(world); await execution.claim('chat/completions'); await execution.fail(); await execution.fail();
    expect(database.rpc.mock.calls.map(([name]) => name)).toEqual(['reserve_pilot_operation', 'claim_pilot_dispatch', 'finish_pilot_operation']);
    expect(database.rpc.mock.calls[2][1]).toEqual({ operation_id: operationId, result_id: null, failure_code: 'provider_or_processing_failure',response_payload:null });
    await expect(execution.claim('images/generations')).rejects.toThrow(/No active/);
  });
  it('retains liability for a needs-context response after a paid text call', async () => {
    const database = db(); const execution = pilotExecution(database, access);
    await execution.reserve(world); await execution.claim('chat/completions');
    await execution.finish(new Response(JSON.stringify({ needsContext: true, message: 'More detail.' })));
    expect(database.rpc).toHaveBeenLastCalledWith('finish_pilot_operation', { operation_id: operationId, result_id: null, failure_code: 'incomplete_response',response_payload:null });
  });
  it('will not claim successful accounting when finalization is unavailable', async () => {
    const database = db(); const execution = pilotExecution(database, access); await execution.reserve(world);
    database.rpc.mockResolvedValueOnce({ error: new Error('Database unavailable') });
    await expect(execution.finish(new Response(JSON.stringify({ concept: { id: worldId } })))).rejects.toThrow(/accounting could not be confirmed/);
  });
});
