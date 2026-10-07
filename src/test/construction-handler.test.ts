// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash, webcrypto } from 'node:crypto';
import { handleProposal, type ProposalRuntime, type ProposalDatabase } from '../../supabase/functions/generate-concept/proposal-handler';
import { CanvasFailure, type CanvasStoredRow } from '../../supabase/functions/generate-concept/canvas';
import { parseProposalManifest, restoreProposalRow, serializeProposalManifest, isProposalManifest, type ProposalRequest, type ProposalConcept } from '../../supabase/functions/generate-concept/proposal';
import { CONSTRUCTION_INTERACTION, CONSTRUCTION_ROLES, CONSTRUCTION_SEMANTICS, compileConstruction, constructionCanonical, type ConstructionBinding } from '../../supabase/functions/generate-concept/construction';
import { constructionFixture } from './construction-fixture';
import { makeProductPlan } from './product-plan-fixture';

const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS1sAAAAASUVORK5CYII=';
type Row=CanvasStoredRow&{cache_key?:string};
function harness(binding?:ConstructionBinding) {
  const state={rows:[] as Row[],blobs:new Map<string,Uint8Array>(),output:undefined as unknown,stage:'world',abortOnText:null as AbortController|null};
  const fixture=constructionFixture();
  const respond=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
  const runtime:ProposalRuntime={enabled:true,requireConstructionIntent:false,textModel:'mock-text',imageModel:'openai/gpt-image-2',construction:binding,
    hash:vi.fn(async text=>createHash('sha256').update(text).digest('hex')),reserve:vi.fn(async()=>{}),respond,
    deliver:async row=>respond({concept:restoreProposalRow(row,`https://private.invalid/${row.id}.png`)}),
    db:{from:()=>({select:()=>({eq:(field:string,value:unknown)=>({maybeSingle:async()=>({data:state.rows.find(r=>r[field]===value)||null})})}),insert:async(row:Row)=>{state.rows.push(row);return {};}}),storage:{from:()=>({download:async(path:string)=>{const bytes=state.blobs.get(path);return {data:bytes?{size:bytes.length,type:'image/png',arrayBuffer:async()=>Uint8Array.from(bytes).buffer}:undefined};},upload:async(path:string,bytes:Uint8Array)=>{state.blobs.set(path,bytes);return {};},remove:async(paths:string[])=>{paths.forEach(p=>state.blobs.delete(p));return {};}})}} as ProposalDatabase,
    ai:vi.fn(async(path,body)=>{
      if(path==='chat/completions'){
        const chosen=runtime.construction||fixture.binding;
        const output=state.output??{needsContext:false,brand:'Tesla study',title:'A dimensional energy story',story:'Untrusted model story about automatic lights.',interaction:'Invented automatic spring return',design:'HIDDEN_MODEL_ENGINEERING: add a motor, lights and automatic reset.',worldElements:chosen.source.elements,
          ...(state.stage==='world'||state.stage==='physical'?(runtime.construction?{constructionChoice:fixture.choice}:{productPlan:makeProductPlan(chosen.source.elements.map(e=>e.id))}):{})};
        state.abortOnText?.abort();return {choices:[{message:{content:JSON.stringify(output)}}]};
      }
      return {data:[{b64_json:png}]};
    })};
  const post=async(body:ProposalRequest,signal?:AbortSignal)=>{state.stage=body.stage;try{return await handleProposal(body,new Request('https://local.invalid/',{method:'POST',signal}),runtime);}catch(e){if(e instanceof CanvasFailure)return respond({error:e.message},e.status);throw e;}};
  const world:ProposalRequest={contractVersion:'offkin-proposal-v10',stage:'world',brand:'no-website',context:structuredClone((binding||fixture.binding).source.context)};
  const physical=(w:ProposalConcept):ProposalRequest=>({...world,stage:'physical',sourceWorldId:w.id,selectedElementIds:w.worldElements.map(e=>e.id),heroElementId:w.worldElements[0].id,replacements:[]});
  const generate=async(body:ProposalRequest)=>{const res=await post(body);const data=await res.json();expect(res.status,JSON.stringify(data)).toBe(200);expect(data.concept,JSON.stringify(data)).toBeDefined();return data.concept as ProposalConcept;};
  const calls=()=>vi.mocked(runtime.ai).mock.calls;
  const images=()=>calls().filter(([path])=>path.startsWith('images/'));
  const prompt=(index=0)=>{const body=images()[index]?.[1];return body instanceof FormData?String(body.get('prompt')):(body as {prompt:string})?.prompt;};
  return {state,runtime,post,world,physical,generate,calls,images,prompt};
}
beforeEach(()=>{vi.stubGlobal('crypto',webcrypto);});

describe('local construction candidate through real handleProposal, mocked providers only',()=>{
 it('compiles world and physical using one text plus one image each, with zero correction',async()=>{
  const h=harness(constructionFixture().binding);const w=await h.generate(h.world);const p=await h.generate(h.physical(w));
  expect(h.calls().map(c=>c[0])).toEqual(['chat/completions','images/generations','chat/completions','images/edits']);
  expect(w.productPlan?.parts).toHaveLength(7);expect(p.productPlan?.assembly).toHaveLength(6);
  expect(p.productPlan?.actions[0].action).toContain('manually');expect(p.constructionOrigin).toEqual(w.constructionOrigin);
  expect(p.productPlan?.verificationGates.every(g=>g.status==='unverified')).toBe(true);
  expect(h.prompt()).not.toContain('HIDDEN_MODEL_ENGINEERING');expect(h.prompt()).not.toContain('Untrusted model story');
  expect(h.prompt()).toContain('large sun');expect(h.prompt()).toContain('charcoal solar-panel');
 });
 it.each(['Display only','Press the sun to drive a rocker lever; release for gravity reset','Press and reset automatically','Press with a spring return'])('rejects contradictory authored action %s before any provider',async interaction=>{
  const binding=constructionFixture().binding;binding.source.context.interaction=interaction;const h=harness(binding);
  const res=await h.post(h.world);expect(await res.json()).toMatchObject({needsConstruction:true,clarification:expect.stringContaining('manual reset')});expect(h.calls()).toHaveLength(0);expect(h.runtime.reserve).not.toHaveBeenCalled();
 });
 it('rejects explicitly electronic mode and a stale exact context with zero providers',async()=>{
  const b=constructionFixture().binding;b.source.context.mode='electronic';const h=harness(b);expect(await(await h.post(h.world)).json()).toHaveProperty('needsConstruction',true);expect(h.calls()).toHaveLength(0);
  const h2=harness(constructionFixture().binding);h2.world.context.style+=' Different';expect(await(await h2.post(h2.world)).json()).toHaveProperty('needsConstruction',true);expect(h2.calls()).toHaveLength(0);
 });
 it('does not accept client review flags, construction binding, action or product plan authority',async()=>{
  const h=harness();for(const key of ['construction','reviewed','constructionChoice','constructionOrigin']){const response=await h.post({...h.world,[key]:true});expect(response.status).toBe(400);}expect(h.calls()).toHaveLength(0);
 });
 it.each(['productPlan','constructionOrigin','joins','reviewed'])('rejects model %s override with zero images and no correction',async field=>{
  const f=constructionFixture(),h=harness(f.binding);h.state.output={needsContext:false,brand:'Tesla',title:'Story',story:'Story',interaction:'Proposed',design:'Proposed',worldElements:f.binding.source.elements,constructionChoice:f.choice,[field]:{}};
  expect(await(await h.post(h.world)).json()).toHaveProperty('needsConstruction',true);expect(h.images()).toHaveLength(0);expect(h.calls()).toHaveLength(1);
 });
 it('rejects model unknown appearance and graph fields, with no normalization or image',async()=>{
  const f=constructionFixture(),h=harness(f.binding);f.choice.appearances[0].appearanceId='invented';h.state.output={needsContext:false,brand:'Tesla',title:'Story',story:'Story',interaction:'Proposed',design:'Proposed',worldElements:f.binding.source.elements,constructionChoice:f.choice};
  expect(await(await h.post(h.world)).json()).toHaveProperty('needsConstruction',true);expect(h.images()).toHaveLength(0);
 });
 it('binds authoritative physical descriptions, replacements, hero and selected IDs before text',async()=>{
  for(const change of ['description','replacement','hero','selection']){
    const h=harness(constructionFixture().binding);const w=await h.generate(h.world);const req=h.physical(w);
    if(change==='description'){const m=parseProposalManifest(h.state.rows[0].story)!;m.worldElements[1].description='Different geometry meaning';h.state.rows[0].story=serializeProposalManifest(m);}
    if(change==='replacement')req.replacements=[{id:'sun',label:'New object',description:'A wind turbine instead of a sun'}];
    if(change==='hero')req.heroElementId='car';if(change==='selection')req.selectedElementIds=req.selectedElementIds!.slice(0,-1);
    const before=h.calls().length;const response=await h.post(req);expect(await response.json()).toHaveProperty('needsConstruction',true);expect(h.calls()).toHaveLength(before);
  }
 });
 it('inherits exact frozen plan and origin in supplements, even with no runtime binding',async()=>{
  const h=harness(constructionFixture().binding),w=await h.generate(h.world),p=await h.generate(h.physical(w));delete h.runtime.construction;
  for(const stage of ['details','packaging'] as const){const c=await h.generate({...h.world,stage,sourceWorldId:w.id,sourcePhysicalId:p.id});expect(c.productPlan).toEqual(p.productPlan);expect(c.constructionOrigin).toEqual(p.constructionOrigin);}
  expect(h.prompt(2)).not.toContain('HIDDEN_MODEL_ENGINEERING');expect(h.prompt(3)).not.toContain('Untrusted model story');
 });
 it('rejects model supplement origin/choice overrides and does not downgrade compiled physical lineage',async()=>{
  const h=harness(constructionFixture().binding),w=await h.generate(h.world),p=await h.generate(h.physical(w));delete h.runtime.construction;
  const before=h.calls().length;expect(await(await h.post(h.physical(w))).json()).toHaveProperty('needsConstruction',true);expect(h.calls()).toHaveLength(before);
  h.state.output={needsContext:false,brand:'Tesla',title:'Story',story:'Story',interaction:'Proposed',design:'Proposed',worldElements:w.worldElements,constructionOrigin:p.constructionOrigin};
  expect(await(await h.post({...h.world,stage:'details',sourceWorldId:w.id,sourcePhysicalId:p.id})).json()).toHaveProperty('needsConstruction',true);expect(h.images()).toHaveLength(2);
 });
 it('separates the complete binding in cache and restores completed hits without providers',async()=>{
  const h=harness(constructionFixture().binding),w=await h.generate(h.world);const before=h.calls().length;
  expect((await h.generate(h.world)).id).toBe(w.id);expect(h.calls()).toHaveLength(before);
  h.runtime.construction!.creative.roles[0].appearances[0].finish='Blue finish preserving the unchanged interfaces';
  const next=await h.generate(h.world);expect(next.id).not.toBe(w.id);expect(h.images()).toHaveLength(2);expect(next.productPlan?.parts[0].finish).toContain('Blue');
 });
 it('never sends source UUIDs, storage paths or private provenance digests into provider prompts',async()=>{
  const h=harness(constructionFixture().binding),w=await h.generate(h.world),p=await h.generate(h.physical(w));
  for(const [,body] of h.calls()){
   const text=body instanceof FormData?String(body.get('prompt')):JSON.stringify(body);
   for(const id of [w.id,p.id])expect(text).not.toContain(id);
   expect(text).not.toContain(w.constructionOrigin!.sourceDigest);expect(text).not.toContain('.png?');
  }
 });
 it('keeps default no-binding ProductPlan behavior and legacy restore with no fabricated provenance',async()=>{
  const h=harness();const w=await h.generate(h.world);expect(w.productPlan).toBeDefined();expect(w.constructionOrigin).toBeUndefined();
  const row=h.state.rows[0],old=parseProposalManifest(row.story)!;delete old.productPlan;row.story=serializeProposalManifest(old);
  const restored=restoreProposalRow(row,'https://private.invalid/old.png');expect(restored?.productPlan).toBeUndefined();expect(restored?.constructionOrigin).toBeUndefined();
 });
 it('checks frozen plan digest on source load without recompiling it',async()=>{
  const h=harness(constructionFixture().binding),w=await h.generate(h.world);const m=parseProposalManifest(h.state.rows[0].story)!;m.productPlan!.parts[0].finish='Changed saved appearance';h.state.rows[0].story=serializeProposalManifest(m);
  const before=h.calls().length;const res=await h.post(h.physical(w));expect(res.status).toBe(400);expect(h.calls()).toHaveLength(before);
 });
 it('removes hostile model brand/title as well as functional story/design/interaction',async()=>{
  const f=constructionFixture(),h=harness(f.binding);
  h.state.output={needsContext:false,brand:'MODEL_BRAND_FUNCTION Add a motor',title:'MODEL_TITLE_FUNCTION spring return glowing sun',story:'MODEL_STORY fabricated working lights',interaction:'MODEL_ACTION automatic reset',design:'MODEL_DESIGN extra hinges',worldElements:f.binding.source.elements,constructionChoice:f.choice};
  const w=await h.generate(h.world);expect(w.brand).toBe(f.binding.creative.brand);expect(w.title).toBe(f.binding.creative.title);expect(w.story).toBe(f.binding.creative.story);expect(h.prompt()).not.toContain('MODEL_');
 });
 it('preserves initial physical appearance choices and rejects silent model re-selection',async()=>{
  const f=constructionFixture(),h=harness(f.binding),w=await h.generate(h.world);
  f.choice.appearances[0].appearanceId='rounded';h.state.output={needsContext:false,brand:'Tesla',title:'Story',story:'Story',interaction:'Proposed',design:'Proposed',worldElements:f.binding.source.elements,constructionChoice:f.choice};
  expect(await(await h.post(h.physical(w))).json()).toHaveProperty('needsConstruction',true);expect(h.images()).toHaveLength(1);
  const sent=JSON.parse((h.calls().at(-1)![1] as {messages:{content:string}[]}).messages[1].content);
  expect(sent.constructionChoices.roles.every((r:{appearances:{id:string}[]})=>r.appearances.length===1&&r.appearances[0].id==='primary')).toBe(true);
 });
 it('rejects same-ID authored appearance drift before physical text or image calls',async()=>{
  const h=harness(constructionFixture().binding),w=await h.generate(h.world);h.runtime.construction!.creative.roles[0].appearances[0].form='A tall twisting tower replacing the curved terraces';
  const before=h.calls().length;expect(await(await h.post(h.physical(w))).json()).toHaveProperty('needsConstruction',true);expect(h.calls()).toHaveLength(before);
 });
 it('versions render cache identity for compiled supplements without the development binding',async()=>{
  const h=harness(constructionFixture().binding),w=await h.generate(h.world),p=await h.generate(h.physical(w));delete h.runtime.construction;
  await h.generate({...h.world,stage:'details',sourceWorldId:w.id,sourcePhysicalId:p.id});
  const cacheInputs=vi.mocked(h.runtime.hash).mock.calls.map(([text])=>{try{return JSON.parse(text);}catch{return null;}}).filter(v=>v?.request?.stage==='details');
  expect(cacheInputs[0].constructionIdentity.semantics).toBe(CONSTRUCTION_SEMANTICS);expect(cacheInputs[0].constructionIdentity.promptRevision).toBeTruthy();
  const original=constructionCanonical(cacheInputs[0]);cacheInputs[0].constructionIdentity.semantics+='next-compiler-revision';expect(await h.runtime.hash(original)).not.toBe(await h.runtime.hash(constructionCanonical(cacheInputs[0])));
 });
 it('restores archived origin shape without the live registry and refuses to reinterpret it for new images',async()=>{
  const h=harness(constructionFixture().binding),w=await h.generate(h.world),m=parseProposalManifest(h.state.rows[0].story)!;
  if(m.constructionOrigin?.version!=='construction-origin-v1')throw new Error('Expected authored-origin fixture');
  m.constructionOrigin.templateId='retired-press-family-v0';m.constructionOrigin!.choice.templateId='retired-press-family-v0';m.constructionOrigin!.compilerVersion='archived-compiler-v0';m.constructionOrigin!.compilerDigest='a'.repeat(64);
  h.state.rows[0].story=serializeProposalManifest(m);const restored=restoreProposalRow(h.state.rows[0],'https://private.invalid/saved.png');expect(restored?.productPlan).toEqual(w.productPlan);expect(restored?.constructionOrigin?.compilerVersion).toBe('archived-compiler-v0');
  const before=h.calls().length;expect(await(await h.post(h.physical(w))).json()).toHaveProperty('needsConstruction',true);expect(h.calls()).toHaveLength(before);
 });
 it('rejects source story omissions before providers and oversize compiled mappings before images',async()=>{
  const bad=constructionFixture().binding;bad.creative.roles.find(r=>r.role==='actuator')!.storyElementIds=[];const h=harness(bad);expect(await(await h.post(h.world)).json()).toHaveProperty('needsConstruction',true);expect(h.calls()).toHaveLength(0);
  const f=constructionFixture();f.binding.source.elements=Array.from({length:16},(_,i)=>({id:`s${String(i).padStart(2,'0')}${'x'.repeat(45)}`,label:'Boundary story',description:'A locally authored long-ID boundary fixture',kind:'proposal'}));f.binding.source.heroElementId=f.binding.source.elements[0].id;for(const role of f.binding.creative.roles)role.storyElementIds=f.binding.source.elements.map(e=>e.id);
  const large=harness(f.binding);expect(await(await large.post(large.world)).json()).toMatchObject({needsConstruction:true,clarification:expect.stringContaining('plan limits')});expect(large.calls()).toHaveLength(1);expect(large.images()).toHaveLength(0);
 });
 it('aborted text cannot trigger image or stale persistence',async()=>{
  const h=harness(constructionFixture().binding),controller=new AbortController();h.state.abortOnText=controller;
  expect((await h.post(h.world,controller.signal)).status).toBe(499);expect(h.images()).toHaveLength(0);expect(h.state.rows).toHaveLength(0);
 });
});

describe('construction compiler boundaries',()=>{
 it('has creative appearance independent from the mechanical graph',()=>{
  const f=constructionFixture(),a=compileConstruction(f.choice,f.binding);
  f.binding.creative.silhouette='An asymmetric folded ocean sculpture with a wave crest.';f.binding.creative.roles[1].appearances[0]={id:'primary',name:'Wave crest',form:'A broad folded blue ocean wave with deep dimensional surfaces.',finish:'Ocean blue'};
  const b=compileConstruction(f.choice,f.binding);expect(b.plan.joins).toEqual(a.plan.joins);expect(b.plan.assembly).toEqual(a.plan.assembly);expect(b.plan.parts[1].form).toContain('blue ocean');expect(b.plan.parts[1].form).not.toContain('sun');
 });
 it('compiles all 128 bounded appearance combinations deterministically and unverified',()=>{
  const f=constructionFixture();for(let mask=0;mask<128;mask++){const c=structuredClone(f.choice);c.appearances.forEach((a,i)=>a.appearanceId=(mask>>i)&1?'rounded':'primary');const one=compileConstruction(c,f.binding),two=compileConstruction(c,f.binding);expect(constructionCanonical(one)).toBe(constructionCanonical(two));expect(one.plan.verificationGates.every(g=>g.status==='unverified')).toBe(true);}
 });
 it('rejects origin without a frozen strict ProductPlan and rejects provenance statuses claiming approval',async()=>{
  const h=harness(constructionFixture().binding);await h.generate(h.world);const m=parseProposalManifest(h.state.rows[0].story)!;expect(isProposalManifest({...m,productPlan:undefined})).toBe(false);expect(isProposalManifest({...m,constructionOrigin:{...m.constructionOrigin,evidence:'approved'}})).toBe(false);
 });
});
