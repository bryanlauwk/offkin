import { CONSTRUCTION_INTENT_VERSION } from '../../supabase/functions/generate-concept/construction-intent';
import { makeProductPlan } from '../test/product-plan-fixture';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CUSTOMER_IDENTITY_VERSION, PROPOSAL_CAPABILITIES, type ProposalConcept, type ProposalRequest } from '../../supabase/functions/generate-concept/proposal';
import { ProposalConstructionNeededError, ProposalContextNeededError, planProposalRevision, requestProposalAsset, restoreProposalAsset, supportsProposalGeneration } from './proposal-api';
const availability=vi.hoisted(()=>({paused:false}));
vi.mock('./proposal-availability',async original=>({...await original<object>(),get PROPOSAL_GENERATION_PAUSED(){return availability.paused;}}));
const id='00000000-0000-4000-8000-000000000001';const world:ProposalRequest={contractVersion:'offkin-proposal-v10',stage:'world',brand:'no-website',customerIdentity:{version:CUSTOMER_IDENTITY_VERSION,name:'  Fable Finch 字 Café 🪁  '},constructionIntent:{version:CONSTRUCTION_INTENT_VERSION,action:'static'},context:{mode:'mechanical',interaction:'Display only',business:'Paper gifts',exactWording:'  字\nCafé 🪁 '}};
function concept(overrides:Partial<ProposalConcept>={}):ProposalConcept{return {...world,id,stageVersion:'proposal-assets-v1',brand:world.customerIdentity!.name,title:'Paper world',story:'A rich paper city.',design:'Many connected scenes',interaction:'Explore',worldElements:[{id:'house',label:'Paper house',description:'A proposed story home',kind:'proposal'}],sourceImageIds:[],productPlan:makeProductPlan(['house']),image:'https://images.example/world.png',sourceUrl:'',sourceTitle:'',...overrides};}
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status});
const readiness=()=>reply({ready:true,capabilities:PROPOSAL_CAPABILITIES});
beforeEach(()=>{availability.paused=false;vi.stubEnv('VITE_SUPABASE_URL','https://test.invalid');vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY','public-key');});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.restoreAllMocks();});
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

 it.each([undefined,'construction-intent-v0','construction-intent-v2'])('requires the exact construction-intent capability %j before sending a generation request',async version=>{
   const fetch=vi.fn(async(_url:string,_init:RequestInit)=>reply({ready:true,capabilities:{...PROPOSAL_CAPABILITIES,proposal_construction_intent_version:version}}));vi.stubGlobal('fetch',fetch);
   await expect(requestProposalAsset(world,new AbortController().signal)).rejects.toThrow(/not available/);expect(fetch).toHaveBeenCalledOnce();expect(fetch.mock.calls[0][1]).not.toHaveProperty('body');
 });
 it('requires an explicit matching action before generation even with a capable backend',async()=>{
   const fetch=vi.fn(async()=>readiness());vi.stubGlobal('fetch',fetch);
   await expect(requestProposalAsset({...world,constructionIntent:undefined},new AbortController().signal)).rejects.toThrow(/Choose a construction action/);
   await expect(requestProposalAsset({...world,context:{...world.context,interaction:'Turn automatically'}},new AbortController().signal)).rejects.toThrow();expect(fetch).not.toHaveBeenCalled();
 });
 it('rejects a response that loses the selected construction intent',async()=>{
   vi.stubGlobal('fetch',vi.fn(async(_url,init)=>init.method==='POST'?reply({concept:concept({constructionIntent:undefined})}):readiness()));
   await expect(requestProposalAsset(world,new AbortController().signal)).rejects.toThrow(/does not match your construction choice/);
 });
 it('restores pre-intent assets despite an unavailable new capability',async()=>{
   const fetch=vi.fn(async(_url:string,_init:RequestInit)=>reply({concept:concept({constructionIntent:undefined,productPlan:undefined})}));vi.stubGlobal('fetch',fetch);
   expect((await restoreProposalAsset(id,new AbortController().signal)).constructionIntent).toBeUndefined();expect(fetch).toHaveBeenCalledOnce();expect(JSON.parse(String(fetch.mock.calls[0][1].body))).toEqual({id});
 });

 it('holds new paid work without a request while saved restore remains available',async()=>{availability.paused=true;const fetch=vi.fn(async()=>reply({concept:concept()}));vi.stubGlobal('fetch',fetch);expect(await supportsProposalGeneration(new AbortController().signal)).toBe(false);await expect(requestProposalAsset(world,new AbortController().signal)).rejects.toThrow(/temporarily unavailable/);expect(fetch).not.toHaveBeenCalled();await restoreProposalAsset(id,new AbortController().signal);expect(fetch).toHaveBeenCalledOnce();});
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
 it('requires explicit product-plan support and a plan on new images but allows old restores',async()=>{
 const old={...PROPOSAL_CAPABILITIES};delete old.proposal_product_plan_version;
 vi.stubGlobal('fetch',vi.fn(async()=>reply({ready:true,capabilities:old})));expect(await supportsProposalGeneration(new AbortController().signal)).toBe(false);
 vi.stubGlobal('fetch',vi.fn(async(_url,init)=>init.method==='POST'?reply({concept:concept({productPlan:undefined})}):readiness()));await expect(requestProposalAsset(world,new AbortController().signal)).rejects.toThrow(/no construction plan/);
 const fetch=vi.fn(async()=>reply({concept:concept({productPlan:undefined})}));vi.stubGlobal('fetch',fetch);expect((await restoreProposalAsset(id,new AbortController().signal)).productPlan).toBeUndefined();
 });
 it('rejects a mismatched source, stage or returned context',async()=>{vi.stubGlobal('fetch',vi.fn(async(_url,init)=>init.method==='POST'?reply({concept:concept({context:{business:'Another customer'}})}):readiness()));await expect(requestProposalAsset(world,new AbortController().signal)).rejects.toThrow(/does not match/);});
 it('restores saved images without readiness or generation',async()=>{const fetch=vi.fn(async(_url:string,_init:RequestInit)=>reply({concept:concept()}));vi.stubGlobal('fetch',fetch);await restoreProposalAsset(id,new AbortController().signal);expect(fetch).toHaveBeenCalledOnce();expect(JSON.parse(String(fetch.mock.calls[0][1].body))).toEqual({id});});
 it('rejects wrong restored UUID and invalid images',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>reply({concept:concept({id:'00000000-0000-4000-8000-000000000002'})})));await expect(restoreProposalAsset(id,new AbortController().signal)).rejects.toThrow(/could not be opened/);});
 it('keeps cancellation effective before and after a provider response',async()=>{const abort=new AbortController();abort.abort();const fetch=vi.fn();vi.stubGlobal('fetch',fetch);await expect(requestProposalAsset(world,abort.signal)).rejects.toMatchObject({name:'AbortError'});expect(fetch).not.toHaveBeenCalled();});
 it('rejects revision output with invalid context keys',async()=>{vi.stubGlobal('fetch',vi.fn(async(_url,init)=>init.method==='POST'?reply({plan:{scope:'packaging',context:{business:'X',newCredential:'no'},summary:'Blue box'}}):readiness()));await expect(planProposalRevision({contractVersion:'offkin-proposal-v10',action:'plan-revision',instruction:'Blue package',brand:'no-website',context:world.context,sourceWorldId:id,sourcePhysicalId:'00000000-0000-4000-8000-000000000002'},new AbortController().signal)).rejects.toThrow();});
});
