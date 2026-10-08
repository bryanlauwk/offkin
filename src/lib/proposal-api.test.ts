import { forgetPilotInvite, setPilotInvite } from './pilot-access';
import { makeConceptPreview } from '../../supabase/functions/generate-concept/concept-preview';
import { makeProductPlan } from '../test/product-plan-fixture';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CUSTOMER_IDENTITY_VERSION, PROPOSAL_CAPABILITIES, type ProposalConcept, type ProposalRequest } from '../../supabase/functions/generate-concept/proposal';
import { ProposalConstructionNeededError, ProposalContextNeededError, planProposalRevision, requestProposalAsset, restoreProposalAsset, supportsProposalGeneration } from './proposal-api';
const availability=vi.hoisted(()=>({paused:false}));
vi.mock('./proposal-availability',async original=>({...await original<object>(),get PROPOSAL_GENERATION_PAUSED(){return availability.paused;}}));
const id='00000000-0000-4000-8000-000000000001';const world:ProposalRequest={contractVersion:'offkin-proposal-v10',stage:'world',brand:'no-website',customerIdentity:{version:CUSTOMER_IDENTITY_VERSION,name:'  Fable Finch 字 Café 🪁  '},context:{mode:'mechanical',interaction:'Display only',business:'Paper gifts',exactWording:'  字\nCafé 🪁 '}};
function concept(overrides:Partial<ProposalConcept>={}):ProposalConcept{return {...world,id,stageVersion:'proposal-assets-v1',brand:world.customerIdentity!.name,title:'Paper world',story:'A rich paper city.',design:'Many connected scenes',interaction:'Explore',worldElements:[{id:'house',label:'Paper house',description:'A proposed story home',kind:'proposal'}],sourceImageIds:[],conceptPreview:makeConceptPreview(['house'], 'house'),image:'https://images.example/world.png',sourceUrl:'',sourceTitle:'',...overrides};}
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status});
const access={version:'offkin-pilot-v1',authorized:true,images_remaining:5,planners_remaining:1,expires_at:'2099-01-01T00:00:00Z'};
const readiness=()=>reply({ready:true,capabilities:PROPOSAL_CAPABILITIES,pilot_access:access});
beforeEach(()=>{setPilotInvite('a'.repeat(43));availability.paused=false;vi.stubEnv('VITE_SUPABASE_URL','https://test.invalid');vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY','public-key');});
afterEach(()=>{forgetPilotInvite();vi.unstubAllEnvs();vi.unstubAllGlobals();vi.restoreAllMocks();});
describe('Proposal API fail-closed negotiation',()=>{
 it.each([undefined,'customer-brand-v0','customer-brand-v2'])('requires exact customer identity capability %j before generation',async version=>{
   const fetch=vi.fn(async()=>reply({ready:true,capabilities:{...PROPOSAL_CAPABILITIES,proposal_customer_identity_version:version}}));vi.stubGlobal('fetch',fetch);
   await expect(requestProposalAsset(world,new AbortController().signal)).rejects.toThrow(/not available/);expect(fetch).toHaveBeenCalledOnce();
 });
 it('rejects a saved section with a different or missing expected identity without generating',async()=>{
   const fetch=vi.fn(async()=>reply({concept:concept({customerIdentity:undefined,brand:'Legacy Paper'})}));vi.stubGlobal('fetch',fetch);
   await expect(restoreProposalAsset(id,new AbortController().signal,world.customerIdentity)).rejects.toThrow(/does not match this customer brand/);expect(fetch).toHaveBeenCalledOnce();
 });

 it('requires a separately supplied exact identity before any new-world network request',async()=>{
   const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
   await expect(requestProposalAsset({...world,customerIdentity:undefined,context:{...world.context,business:'Fable Finch brings the Sunbeam community together',brandIdentifiers:'The Sunbeam story'}},new AbortController().signal)).rejects.toThrow(/exact brand name/);expect(fetch).not.toHaveBeenCalled();
 });
 it.each([undefined,{version:CUSTOMER_IDENTITY_VERSION,name:'Unrelated Orchard'}] as const)('rejects response identity %j when a specific customer was requested',async customerIdentity=>{
   vi.stubGlobal('fetch',vi.fn(async(_url,init)=>init.method==='POST'?reply({concept:concept({customerIdentity,brand:customerIdentity?.name||'Legacy Paper'})}):readiness()));
   await expect(requestProposalAsset(world,new AbortController().signal)).rejects.toThrow(/does not match|incomplete/);
 });
 it('rejects a response display name that contradicts its declared identity',async()=>{
   vi.stubGlobal('fetch',vi.fn(async(_url,init)=>init.method==='POST'?reply({concept:concept({brand:'Unrelated Orchard'})}):readiness()));
   await expect(requestProposalAsset(world,new AbortController().signal)).rejects.toThrow(/does not match|incomplete/);
 });
 it('restores older no-identity assets without guessing their authority from the display name',async()=>{
   const fetch=vi.fn(async()=>reply({concept:concept({customerIdentity:undefined,brand:'Legacy Paper'})}));vi.stubGlobal('fetch',fetch);
   const restored=await restoreProposalAsset(id,new AbortController().signal);expect(restored.customerIdentity).toBeUndefined();expect(restored.brand).toBe('Legacy Paper');expect(fetch).toHaveBeenCalledOnce();
 });

 it.each([undefined,'concept-preview-v0','concept-preview-v2'])('requires the exact creative-preview capability %j before sending a generation request',async version=>{
   const fetch=vi.fn(async(_url:string,_init:RequestInit)=>reply({ready:true,capabilities:{...PROPOSAL_CAPABILITIES,proposal_concept_preview_version:version}}));vi.stubGlobal('fetch',fetch);
   await expect(requestProposalAsset(world,new AbortController().signal)).rejects.toThrow(/not available/);expect(fetch).toHaveBeenCalledOnce();expect(fetch.mock.calls[0][1]).not.toHaveProperty('body');
 });
 it('accepts a rich preview without construction intent, a ProductPlan or a mode constraint',async()=>{
   const context={...world.context,mode:'electronic' as const,interaction:'A proposed glow through the layered city; unverified'};
   const fetch=vi.fn(async(_url,init)=>init.method==='POST'?reply({concept:concept({context})}):readiness());vi.stubGlobal('fetch',fetch);
   const result=await requestProposalAsset({...world,context},new AbortController().signal);
   expect(result.conceptPreview?.status).toBe('unverified-visual-concept');expect(result.productPlan).toBeUndefined();expect(fetch).toHaveBeenCalledTimes(2);
 });
 it('rejects old construction-authority requests before sending them',async()=>{
   const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
   await expect(requestProposalAsset({...world,constructionIntent:{version:'construction-intent-v1',action:'static'}},new AbortController().signal)).rejects.toThrow(/later build proposal/);
   expect(fetch).not.toHaveBeenCalled();
 });
 it('fails closed on a manufacturing backend even if it advertises the same proposal version',async()=>{
   const fetch=vi.fn(async()=>reply({ready:true,capabilities:{...PROPOSAL_CAPABILITIES,proposal_generation_phase:'engineering',proposal_product_plan_version:'product-plan-v1'}}));vi.stubGlobal('fetch',fetch);
   await expect(requestProposalAsset(world,new AbortController().signal)).rejects.toThrow(/not available/);expect(fetch).toHaveBeenCalledOnce();
 });
 it('restores pre-intent assets despite an unavailable new capability',async()=>{
   const fetch=vi.fn(async(_url:string,_init:RequestInit)=>reply({concept:concept({constructionIntent:undefined,productPlan:undefined})}));vi.stubGlobal('fetch',fetch);
   expect((await restoreProposalAsset(id,new AbortController().signal)).constructionIntent).toBeUndefined();expect(fetch).toHaveBeenCalledOnce();expect(JSON.parse(String(fetch.mock.calls[0][1].body))).toEqual({id});
 });

 it('holds new paid work without a request while saved restore remains available',async()=>{availability.paused=true;forgetPilotInvite();const fetch=vi.fn(async()=>reply({concept:concept()}));vi.stubGlobal('fetch',fetch);expect(await supportsProposalGeneration(new AbortController().signal)).toBe(false);await expect(requestProposalAsset(world,new AbortController().signal)).rejects.toThrow(/temporarily unavailable/);expect(fetch).not.toHaveBeenCalled();await restoreProposalAsset(id,new AbortController().signal);expect(fetch).toHaveBeenCalledOnce();});
 it('reads readiness without transmitting the direction',async()=>{const fetch=vi.fn(async(_url:string,_init:RequestInit)=>readiness());vi.stubGlobal('fetch',fetch);expect(await supportsProposalGeneration(new AbortController().signal)).toBe(true);expect(fetch.mock.calls[0][1]).not.toHaveProperty('body');});
 it('never downgrades v10 to the v9 backend',async()=>{const fetch=vi.fn(async()=>reply({ready:true,capabilities:{canvas:true,canvas_contract_version:'offkin-canvas-v9'}}));vi.stubGlobal('fetch',fetch);await expect(requestProposalAsset(world,new AbortController().signal)).rejects.toThrow(/not available/);expect(fetch).toHaveBeenCalledOnce();});
 it('rechecks capabilities immediately before generation and preserves exact context',async()=>{const fetch=vi.fn(async(_url,init)=>init.method==='POST'?reply({concept:concept()}):readiness());vi.stubGlobal('fetch',fetch);const c=await requestProposalAsset(world,new AbortController().signal);expect(c.context.exactWording).toBe(world.context.exactWording);expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual(world);});
 it('keeps construction clarification separate from missing business facts',async()=>{
 const clarification='Should pressing the sun lift the scene or slide a panel?';
 const fetch=vi.fn(async(_url,init)=>init.method==='POST'?reply({needsConstruction:true,clarification}):readiness());vi.stubGlobal('fetch',fetch);
 const error=await requestProposalAsset(world,new AbortController().signal).catch(error=>error);
 expect(error).toBeInstanceOf(ProposalConstructionNeededError);expect(error).not.toBeInstanceOf(ProposalContextNeededError);expect(error.message).toBe(clarification);expect(fetch).toHaveBeenCalledTimes(2);
 });
 it.each([undefined,null,42,'','   ','x'.repeat(601)])('uses a safe construction fallback for invalid clarification %j',async clarification=>{
 vi.stubGlobal('fetch',vi.fn(async(_url,init)=>init.method==='POST'?reply({needsConstruction:true,clarification,message:'Do not route this into the business question.'}):readiness()));
 await expect(requestProposalAsset(world,new AbortController().signal)).rejects.toThrow(new ProposalConstructionNeededError('The physical construction needs a little more detail.'));
 });
 it('accepts a construction clarification at the exact length limit',async()=>{
 const clarification='x'.repeat(600);vi.stubGlobal('fetch',vi.fn(async(_url,init)=>init.method==='POST'?reply({needsConstruction:true,clarification}):readiness()));
 await expect(requestProposalAsset(world,new AbortController().signal)).rejects.toThrow(new ProposalConstructionNeededError(clarification));
 });
 it('requires the explicit construction flag and preserves factual-context errors',async()=>{
 vi.stubGlobal('fetch',vi.fn(async(_url,init)=>init.method==='POST'?reply({needsConstruction:'true',clarification:'A construction question',needsContext:true,message:'What does the business do?'}):readiness()));
 const error=await requestProposalAsset(world,new AbortController().signal).catch(error=>error);
 expect(error).toBeInstanceOf(ProposalContextNeededError);expect(error).not.toBeInstanceOf(ProposalConstructionNeededError);expect(error.message).toBe('What does the business do?');
 });
 it('requires explicit creative-preview support and metadata on every new image but preserves old restores',async()=>{
 const old={...PROPOSAL_CAPABILITIES};delete old.proposal_concept_preview_version;
 vi.stubGlobal('fetch',vi.fn(async()=>reply({ready:true,capabilities:old})));expect(await supportsProposalGeneration(new AbortController().signal)).toBe(false);
 vi.stubGlobal('fetch',vi.fn(async(_url,init)=>init.method==='POST'?reply({concept:concept({conceptPreview:undefined,productPlan:makeProductPlan(['house'])})}):readiness()));await expect(requestProposalAsset(world,new AbortController().signal)).rejects.toThrow(/no creative-preview metadata/);
 const fetch=vi.fn(async()=>reply({concept:concept({conceptPreview:undefined,productPlan:makeProductPlan(['house'])})}));vi.stubGlobal('fetch',fetch);expect((await restoreProposalAsset(id,new AbortController().signal)).productPlan).toBeDefined();
 });
 it('rejects a mismatched source, stage or returned context',async()=>{vi.stubGlobal('fetch',vi.fn(async(_url,init)=>init.method==='POST'?reply({concept:concept({context:{business:'Another customer'}})}):readiness()));await expect(requestProposalAsset(world,new AbortController().signal)).rejects.toThrow(/does not match/);});
 it('restores saved images without readiness or generation',async()=>{const fetch=vi.fn(async(_url:string,_init:RequestInit)=>reply({concept:concept()}));vi.stubGlobal('fetch',fetch);await restoreProposalAsset(id,new AbortController().signal);expect(fetch).toHaveBeenCalledOnce();expect(JSON.parse(String(fetch.mock.calls[0][1].body))).toEqual({id});});
 it('rejects wrong restored UUID and invalid images',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>reply({concept:concept({id:'00000000-0000-4000-8000-000000000002'})})));await expect(restoreProposalAsset(id,new AbortController().signal)).rejects.toThrow(/could not be opened/);});
 it('keeps cancellation effective before and after a provider response',async()=>{const abort=new AbortController();abort.abort();const fetch=vi.fn();vi.stubGlobal('fetch',fetch);await expect(requestProposalAsset(world,abort.signal)).rejects.toMatchObject({name:'AbortError'});expect(fetch).not.toHaveBeenCalled();});
 it('rejects revision output with invalid context keys',async()=>{vi.stubGlobal('fetch',vi.fn(async(_url,init)=>init.method==='POST'?reply({plan:{scope:'packaging',context:{business:'X',newCredential:'no'},summary:'Blue box'}}):readiness()));await expect(planProposalRevision({contractVersion:'offkin-proposal-v10',action:'plan-revision',instruction:'Blue package',brand:'no-website',context:world.context,sourceWorldId:id,sourcePhysicalId:'00000000-0000-4000-8000-000000000002'},new AbortController().signal)).rejects.toThrow();});
});

describe('details refinement API response validation', () => {
  const physicalId = '00000000-0000-4000-8000-000000000002';
  const detailsId = '00000000-0000-4000-8000-000000000003';
  const refinement = { version: 'details-refinement-v1' as const, instruction: 'Keep the same slot and original surroundings in the action pair.' };
  const request: ProposalRequest = { ...world, stage: 'details', sourceWorldId: id, sourcePhysicalId: physicalId, detailsRefinement: refinement };
  const details = (patch: Partial<ProposalConcept> = {}) => concept({ id: detailsId, stage: 'details', sourceWorldId: id, sourcePhysicalId: physicalId, sourceImageIds: [physicalId], selectedElementIds: ['house'], heroElementId: 'house', replacements: [], detailsRefinement: refinement, ...patch });
  const planRequest = { contractVersion: 'offkin-proposal-v10' as const, action: 'plan-revision' as const, brand: world.brand, context: world.context, sourceWorldId: id, sourcePhysicalId: physicalId, instruction: refinement.instruction };
  it.each([undefined, 'details-refinement-v0', 'details-refinement-v2'])('requires exact details capability %j before sending paid work', async version => {
    const fetch = vi.fn(async () => reply({ ready: true, capabilities: { ...PROPOSAL_CAPABILITIES, proposal_details_refinement_version: version } })); vi.stubGlobal('fetch', fetch);
    await expect(requestProposalAsset(request, new AbortController().signal)).rejects.toThrow(/not available/);
    expect(fetch).toHaveBeenCalledOnce(); expect(fetch.mock.calls[0]).toHaveLength(2);
  });
  it('sends and receives the exact separate instruction with original physical context', async () => {
    const fetch = vi.fn(async (_url, init) => init.method === 'POST' ? reply({ concept: details() }) : readiness()); vi.stubGlobal('fetch', fetch);
    const result = await requestProposalAsset(request, new AbortController().signal);
    expect(result.detailsRefinement).toEqual(refinement); expect(result.context).toEqual(world.context);
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual(request);
  });
  it.each([undefined, { ...refinement, instruction: 'A changed instruction' }])('rejects an absent or changed instruction in a response: %j', detailsRefinement => {
    vi.stubGlobal('fetch', vi.fn(async (_url, init) => init.method === 'POST' ? reply({ concept: details({ detailsRefinement }) }) : readiness()));
    return expect(requestProposalAsset(request, new AbortController().signal)).rejects.toThrow(/does not match your details refinement/);
  });
  it('accepts a details plan without changing accepted packaging context', async () => {
    const context = { ...world.context, revisionNotes: 'Keep the new navy package.' };
    const plan = { scope: 'details', context, summary: 'Clarify the existing action.', detailsRefinement: refinement };
    vi.stubGlobal('fetch', vi.fn(async (_url, init) => init.method === 'POST' ? reply({ plan }) : readiness()));
    await expect(planProposalRevision({ ...planRequest, context }, new AbortController().signal)).resolves.toEqual({ plan });
  });
  it.each([
    { detailsRefinement: undefined }, { detailsRefinement: { ...refinement, instruction: 'Model rewrite' } },
    { context: { ...world.context, revisionNotes: 'New object' } }, { selectedElementIds: ['house'] },
    { scope: 'packaging' },
  ])('rejects modified details plan authority: %j', patch => {
    const plan = { scope: 'details', context: world.context, summary: 'Clarify the existing action.', detailsRefinement: refinement, ...patch };
    vi.stubGlobal('fetch', vi.fn(async (_url, init) => init.method === 'POST' ? reply({ plan }) : readiness()));
    return expect(planProposalRevision(planRequest, new AbortController().signal)).rejects.toThrow();
  });
});

it('never accepts an old public capability response as private pilot authorization',async()=>{
  const fetch=vi.fn(async()=>reply({ready:true,capabilities:PROPOSAL_CAPABILITIES}));vi.stubGlobal('fetch',fetch);
  expect(await supportsProposalGeneration(new AbortController().signal)).toBe(false);expect(fetch).toHaveBeenCalledOnce();
});
it('authenticates readiness and paid requests in headers but leaves capability restores credential-free',async()=>{
  const fetch=vi.fn(async(_url,init)=>init.method==='POST'?reply({concept:concept()}):readiness());vi.stubGlobal('fetch',fetch);
  await requestProposalAsset(world,new AbortController().signal);expect(fetch.mock.calls[0][1].headers['x-offkin-invite']).toBe('a'.repeat(43));expect(fetch.mock.calls[1][1].headers['x-offkin-invite']).toBe('a'.repeat(43));
  expect(String(fetch.mock.calls[1][1].body)).not.toContain('a'.repeat(43));await restoreProposalAsset(id,new AbortController().signal);expect(fetch.mock.calls[2][1].headers).not.toHaveProperty('x-offkin-invite');
});
it('keeps paid actions disabled when a verified invite is exhausted or provider readiness is paused',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>reply({ready:false,capabilities:{...PROPOSAL_CAPABILITIES,proposal:false},pilot_access:{...access,images_remaining:0}})));
  expect(await supportsProposalGeneration(new AbortController().signal)).toBe(false);
});
it('recovers a saved image through an explicit no-spend header even when paid generation is paused',async()=>{
  const fetch=vi.fn(async(_url,init)=>init.method==='POST'?reply({concept:concept()}):reply({ready:false,capabilities:{...PROPOSAL_CAPABILITIES,proposal:false},pilot_access:{...access,images_remaining:0,recovery_available:true}}));vi.stubGlobal('fetch',fetch);
  await expect(requestProposalAsset(world,new AbortController().signal,true)).resolves.toMatchObject({id});
  expect(fetch.mock.calls[1][1].headers).toMatchObject({'x-offkin-recovery':'1','x-offkin-invite':'a'.repeat(43)});expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual(world);
});
it('never sends a recovery request to a backend without the explicit recovery contract',async()=>{
  const fetch=vi.fn(async()=>readiness());vi.stubGlobal('fetch',fetch);
  await expect(requestProposalAsset(world,new AbortController().signal,true)).rejects.toThrow(/not available/);expect(fetch).toHaveBeenCalledOnce();
});
