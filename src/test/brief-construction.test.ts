// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { assertBriefIntent, briefCanonical, briefSourceBinding, BRIEF_CONSTRUCTION_SEMANTICS, BRIEF_GEOMETRIES, BRIEF_PROFILES, BRIEF_FINISHES, compileBriefConstruction, isBriefConstructionOrigin, makeBriefOrigin, parseBriefVisualChoice, type BriefConstructionSource, type BriefVisualChoice } from '../../supabase/functions/generate-concept/brief-construction';
import { constructionInteraction, isConstructionIntent, type ConstructionIntent } from '../../supabase/functions/generate-concept/construction-intent';
import { productPlanIssues } from '../../supabase/functions/generate-concept/product-plan';
const hash=async(text:string)=>createHash('sha256').update(text).digest('hex');
function fixture(action:ConstructionIntent['action']='static'){
 const intent:ConstructionIntent={version:'construction-intent-v1',action};
 const source:BriefConstructionSource={brand:'no-website',context:{business:'Fictional Moonfern paper objects for adult collectors',interaction:constructionInteraction(intent),mode:'mechanical',style:'Lively folded forest shapes with lavender and moss colors'},elements:[{id:'paper-fox',label:'Folded fox',description:'A proposed fox-shaped paper-inspired collectible hero',kind:'proposal'},{id:'folded-grove',label:'Folded grove',description:'Dimensional forest folds and grouped leaf masses',kind:'proposal'}],heroElementId:'paper-fox',replacements:[]};
 const choice:BriefVisualChoice={version:'construction-visual-v1',parts:[{role:'body',storyElementIds:['folded-grove'],geometry:'organic',profile:'layered',finish:'matte',colors:['#778866']},{role:'hero',storyElementIds:['paper-fox'],geometry:'character',profile:'angular',finish:'selective-color',colors:['#9977AA']},...(action==='static'?[]:[{role:'retainer' as const,storyElementIds:[],geometry:'sculpted' as const,profile:'rounded' as const,finish:'matte' as const,colors:['#778866']}])]};
 return {intent,source,choice};
}
describe('wired per-brief construction grammar',()=>{
 it('treats typed intent as an explicit instruction, never a reviewed flag',()=>{
  expect(isConstructionIntent({version:'construction-intent-v1',action:'static'})).toBe(true);
  expect(isConstructionIntent({version:'construction-intent-v1',action:'static',reviewed:true})).toBe(false);
  for(const interaction of ['Display only and automatic lighting','Press with gravity reset','Press with spring return'])expect(()=>assertBriefIntent(fixture('press-reveal-manual-reset').intent,{mode:'mechanical',interaction})).toThrow();
 });
 it('compiles a genuinely static fictional object without inferred example motifs or moving assembly',()=>{
  const f=fixture(),{plan}=compileBriefConstruction(f.choice,f.intent,f.source);
  expect(plan.parts).toHaveLength(2);expect(plan.actions).toEqual([]);expect(plan.verificationGates).toHaveLength(5);
  expect(JSON.stringify(plan)).not.toMatch(/Tesla|sun|road|car\b|retainer|guide|capture|manual|reset|interaction-test/i);
  expect(plan.joins[0].id).toBe('hero-seat');expect(productPlanIssues(plan,f.source.elements.map(e=>e.id),{heroElementId:f.source.heroElementId,displayOnly:true})).toEqual([]);
 });
 it('compiles one meaningful press/reveal with declared insertion before closure and manual reset',()=>{
  const f=fixture('press-reveal-manual-reset'),{plan}=compileBriefConstruction(f.choice,f.intent,f.source);
  expect(plan.parts).toHaveLength(3);expect(plan.actions).toHaveLength(1);expect(plan.actions[0].response).toContain('reveals');expect(plan.actions[0].action).toContain('manually');
  expect(plan.assembly[0].partIds).toEqual(['body','hero']);expect(plan.assembly[1].partIds).toEqual(['body','hero','retainer']);expect(plan.verificationGates).toContainEqual({id:'interaction-test',status:'unverified'});
 });
 it('covers all 32 authored optional-module sets across the static and moving cores',()=>{
  let count=0;for(const action of ['static','press-reveal-manual-reset'] as const)for(let mask=0;mask<16;mask++){
   const f=fixture(action);for(const [i,role] of (['form-a','form-b','form-c','form-d'] as const).entries())if((mask>>i)&1)f.choice.parts.push({role,storyElementIds:[],geometry:'sculpted',profile:'asymmetric',finish:'satin',colors:['#ABCDEF']});
   const r=compileBriefConstruction(f.choice,f.intent,f.source);expect(productPlanIssues(r.plan,f.source.elements.map(e=>e.id))).toEqual([]);expect(r.plan.parts).toHaveLength((action==='static'?2:3)+mask.toString(2).replace(/0/g,'').length);count++;
  }expect(count).toBe(32);
 });
 it('accepts every finite artistic attribute combination independently of the interfaces',()=>{
  for(const geometry of BRIEF_GEOMETRIES)for(const profile of BRIEF_PROFILES)for(const finish of BRIEF_FINISHES){const f=fixture();f.choice.parts[1]={...f.choice.parts[1],geometry,profile,finish};const a=compileBriefConstruction(f.choice,f.intent,f.source),b=compileBriefConstruction(f.choice,f.intent,f.source);expect(briefCanonical(a)).toBe(briefCanonical(b));expect(a.plan.joins.map(j=>j.id)).toEqual(['hero-seat']);}
 });
 it.each(['method','action','assembly','form','reviewed','validation'])('rejects freeform functional/model approval key %s',key=>{
  const f=fixture();Object.assign(f.choice.parts[0],{[key]:'Add a tested spring and motor'});expect(()=>compileBriefConstruction(f.choice,f.intent,f.source)).toThrow();
 });
 it('rejects unsupported roles/geometry/colors and a moving retainer under static intent',()=>{
  for(const mutate of [(f:ReturnType<typeof fixture>)=>Object.assign(f.choice.parts[0],{role:'motor'}),(f:ReturnType<typeof fixture>)=>Object.assign(f.choice.parts[0],{geometry:'spring-return'}),(f:ReturnType<typeof fixture>)=>f.choice.parts[0].colors=['turn on LEDs'],(f:ReturnType<typeof fixture>)=>f.choice.parts.push({...f.choice.parts[0],role:'retainer'})]){const f=fixture();mutate(f);expect(()=>parseBriefVisualChoice(f.choice,f.intent)).toThrow();}
 });
 it('rejects omitted/invented story IDs and a lost selected hero rather than silently simplifying',()=>{
  for(const mutate of [(f:ReturnType<typeof fixture>)=>f.choice.parts[0].storyElementIds=[],(f:ReturnType<typeof fixture>)=>f.choice.parts[0].storyElementIds=['invented'],(f:ReturnType<typeof fixture>)=>f.choice.parts[1].storyElementIds=['folded-grove']]){const f=fixture();mutate(f);expect(()=>compileBriefConstruction(f.choice,f.intent,f.source)).toThrow();}
 });
 it('never drops a selection or truncates input to fit an oversized bounded choice',()=>{
  const f=fixture('press-reveal-manual-reset');f.source.elements=Array.from({length:16},(_,i)=>({id:`s${String(i).padStart(2,'0')}${'x'.repeat(45)}`,label:'Boundary form',description:'A synthetic dimensionless boundary fixture',kind:'proposal'}));f.source.heroElementId=f.source.elements[0].id;
  for(const role of ['form-a','form-b','form-c','form-d'] as const)f.choice.parts.push({...f.choice.parts[0],role});for(const p of f.choice.parts)p.storyElementIds=f.source.elements.map(e=>e.id);
  const before=briefCanonical(f);expect(()=>compileBriefConstruction(f.choice,f.intent,f.source)).toThrow();expect(briefCanonical(f)).toBe(before);
 });
 it('source binding covers intent, template and compiler identity rather than a bare brief hash',async()=>{
  const f=fixture(),digest=await hash(BRIEF_CONSTRUCTION_SEMANTICS),bound=JSON.parse(briefSourceBinding(f.source,f.intent,digest));
  expect(bound).toMatchObject({source:f.source,intent:f.intent,templateId:'static-sculpture-v1',templateRevision:'1',compilerVersion:'brief-construction-compiler-v1',compilerDigest:digest});
  expect(await hash(briefSourceBinding(f.source,f.intent,digest))).not.toBe(await hash(briefSourceBinding(f.source,f.intent,'a'.repeat(64))));
  expect(briefSourceBinding(f.source,f.intent,digest)).not.toBe(briefSourceBinding(f.source,fixture('press-reveal-manual-reset').intent,digest));
 });
 it('records model visuals as unverified proposals and keeps all manufacturing gates unverified',async()=>{
  const f=fixture(),r=compileBriefConstruction(f.choice,f.intent,f.source),origin=await makeBriefOrigin(r.plan,r.choice,f.intent,f.source,hash);
  expect(origin.kind).toBe('compiled-visual-proposal');expect(origin.evidence).toBe('unverified-design-proposal');expect(isBriefConstructionOrigin(origin)).toBe(true);expect(r.plan.verificationGates.every(g=>g.status==='unverified')).toBe(true);
  expect(isBriefConstructionOrigin({...origin,evidence:'engineering-approved'})).toBe(false);
 });
});
