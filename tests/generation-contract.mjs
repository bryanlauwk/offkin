// Real edge handler against isolated fake provider/storage/database. No paid generation.
import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const temp = await mkdtemp(join(tmpdir(), 'brandkin-contract-'));
const env = { SUPABASE_URL:'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY:'test', LOVABLE_API_KEY:'test', BRICK_GENERATION_ENABLED:'true' };
let handler, limit = true, providerCalls = 0, ambiguous = true, reservations = 0;
const rows = [], prompts = [];
globalThis.Deno = {env:{get:k=>env[k]},serve:fn=>{handler=fn;}};
globalThis.testDB = {
 from:()=>({select:()=>({limit:async()=>({error:null}),eq:(key,value)=>({maybeSingle:async()=>({data:rows.find(row=>row[key]===value)||null,error:null})})}),insert:async row=>{rows.push(row);return {error:null};}}),
 rpc:async()=>{reservations++;return {data:limit,error:null};},
 storage:{from:()=>({createSignedUrl:async()=>({data:{signedUrl:'https://test.invalid/image.png'},error:null}),upload:async()=>({error:null}),remove:async()=>({error:null})})},
};
globalThis.fetch = async(url,init)=>{
 providerCalls++; const body=JSON.parse(init.body);prompts.push(body);
 const data=url.endsWith('images/generations') ? {data:[{b64_json:Buffer.from([137,80,78,71]).toString('base64')}]} : {choices:[{message:{content:JSON.stringify(ambiguous ? {needsContext:true} : {needsContext:false,brand:'rimba.com',title:'Coffee collectible',story:'A proposed brand story.',interaction:'Build and display.',design:'A substantial coffee stall.'})}}]};
 return new Response(JSON.stringify(data),{status:200});
};
await build({entryPoints:['supabase/functions/generate-concept/index.ts'],bundle:true,format:'esm',platform:'node',outfile:join(temp,'edge.mjs'),plugins:[{name:'mock-db',setup(b){b.onResolve({filter:/website\.ts$/},()=>({path:'website',namespace:'website'}));b.onLoad({filter:/.*/,namespace:'website'},()=>({contents:`export function validatePublicWebsiteUrl(input){if(!input.includes('.'))throw new Error('Invalid website');return new URL(input.startsWith('http')?input:'https://'+input);} export class WebsiteReadError extends Error {} export async function readCompanyWebsite(input){ globalThis.websiteReads=(globalThis.websiteReads||0)+1; if(globalThis.websiteBlocked)throw new Error('blocked');return {url:'https://rimba.example',title:'Rimba Coffee',excerpt:'A coffee roaster.'}; }`,loader:'js'}));b.onResolve({filter:/https:\/\/esm.sh/},()=>({path:'mock',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const createClient=()=>globalThis.testDB;',loader:'js'}));}}]});
try {
 await import(pathToFileURL(join(temp,'edge.mjs')));
 const send=(body,method='POST')=>handler(new Request('https://test.invalid',{method,body:method==='POST'?body:undefined}));
 const generate=body=>send(JSON.stringify(body));
 assert.equal((await send('', 'OPTIONS')).status,200);
 assert.equal((await send('', 'GET')).status,200);
 const ready=await (await send('', 'GET')).json();
 assert.equal(ready.ready,true);assert.equal(ready.daily_limits_enforced,false);
 assert.equal(ready.capabilities.electronic_story_scene,true);assert.equal(ready.capabilities.summary_only,true);
 assert.equal(ready.prompt_version,'offkin-cocreation-v8');
 assert.equal(ready.capabilities.cocreation,true);assert.equal(ready.capabilities.context_max_chars,6000);
 delete env.SUPABASE_SERVICE_ROLE_KEY;
 const unconfigured=await send('', 'GET');assert.equal(unconfigured.status,503);
 const unconfiguredData=await unconfigured.json();assert.equal(unconfiguredData.ready,false);assert.equal(unconfiguredData.prompt_version,ready.prompt_version);
 env.SUPABASE_SERVICE_ROLE_KEY='test';
 assert.equal(providerCalls,0);
 assert.equal((await send('x'.repeat(48001))).status,413);
 for(const raw of ['{','null','[]','{"brand":"X"}'])assert.equal((await send(raw)).status,400);
 for(const choice of [{edition:'icon',format:'clicker'},{edition:'constructor',format:'bricks'},{edition:'hero',format:'__proto__'}])assert.equal((await generate({brand:'rimba.com',...choice})).status,400);
 assert.equal(providerCalls,0);
 assert.equal((await generate({brand:'not-a-website'})).status,400);assert.equal(reservations,0);
 env.BRICK_GENERATION_ENABLED='false'; assert.equal((await generate({brand:'rimba.com'})).status,503);
 const disabledReadiness=await send('', 'GET');assert.equal(disabledReadiness.status,503);
 const disabledReadinessData=await disabledReadiness.json();assert.equal(disabledReadinessData.ready,false);assert.equal(disabledReadinessData.capabilities.electronic_story_scene,true);
 env.BRICK_GENERATION_ENABLED='true'; env.BRICK_ENFORCE_DAILY_LIMITS='true'; limit=false; assert.equal((await generate({brand:'rimba.com'})).status,429); assert.equal(providerCalls,0);
 limit=true; assert.equal((await (await generate({brand:'unknown.com'})).json()).needsContext,true); assert.equal(providerCalls,1);
 globalThis.websiteBlocked=true;
 const before=providerCalls; assert.equal((await (await generate({brand:'blocked.com'})).json()).needsContext,true); assert.equal(providerCalls,before);
 const inspectFailed=await (await generate({brand:'blocked.com',context:'A company summary.',inspectWebsite:true})).json();assert.equal(inspectFailed.verified,false);assert.equal(providerCalls,before);
 globalThis.websiteBlocked=false;
 ambiguous=false;
 const first=await (await generate({brand:'rimba.com',edition:'hero',format:'bricks'})).json();
 assert.equal(first.concept.sourceUrl,'https://rimba.example');assert.equal(first.concept.edition,'hero');assert.equal(first.concept.format,'bricks');assert.equal(first.concept.interaction,'Build and display.');assert.equal(providerCalls,3);
 assert.match(prompts.at(-2).messages[0].content,/Edition: Hero/);assert.match(prompts.at(-1).prompt,/Object format: Brick build/);
 await generate({brand:'rimba.com',edition:'hero',format:'bricks'});assert.equal(providerCalls,3);
 await generate({brand:'rimba.com',edition:'inside',format:'bricks'});assert.equal(providerCalls,5);
 await generate({brand:'rimba.com',edition:'hero',format:'miniature'});assert.equal(providerCalls,7);
 assert.equal(new Set(rows.map(r=>r.cache_key)).size,3);
 const restored=await (await generate({id:first.concept.id})).json();assert.equal(restored.concept.edition,'hero');assert.equal(restored.concept.format,'bricks');assert.equal(providerCalls,7);
 rows.push({id:'11111111-1111-1111-1111-111111111111',brand:'Legacy',title:'Old clicker',story:'Old story.',image_path:'old.png'});
 const old=await (await generate({id:rows.at(-1).id})).json();assert.equal(old.concept.edition,'everyday');assert.equal(old.concept.format,'clicker');
 const callsBeforeInspect=providerCalls;env.BRICK_GENERATION_ENABLED='false';
 assert.equal((await (await generate({brand:'https://rimba.com',inspectWebsite:true})).json()).website.title,'Rimba Coffee');assert.equal(providerCalls,callsBeforeInspect);env.BRICK_GENERATION_ENABLED='true';
 await generate({brand:'https://rimba.com/BrandA'});await generate({brand:'https://rimba.com/branda'});assert.equal(providerCalls,11);
 await generate({brand:'https://rimba.com/BrandA'});assert.equal(providerCalls,11);
 // Waiver does not reserve, reset, or delete quota history, even when stored caps are exhausted.
 const beforeWaiver=reservations;limit=false;
 for(const flag of [undefined,'false']) {
  if(flag===undefined)delete env.BRICK_ENFORCE_DAILY_LIMITS;else env.BRICK_ENFORCE_DAILY_LIMITS=flag;
  assert.equal((await (await send('', 'GET')).json()).daily_limits_enforced,false);
  const result=await generate({brand:'https://waived.example/'+String(flag)});
  assert.equal(result.status,200);assert.ok((await result.json()).concept);
  assert.equal(reservations,beforeWaiver);
 }
 env.BRICK_GENERATION_ENABLED='false';const callsBeforeDisabled=providerCalls;
 assert.equal((await generate({brand:'https://disabled.example'})).status,503);assert.equal(providerCalls,callsBeforeDisabled);
 env.BRICK_GENERATION_ENABLED='true';
 for(const flag of ['true','misspelled']) {
  env.BRICK_ENFORCE_DAILY_LIMITS=flag;
  assert.equal((await (await send('', 'GET')).json()).daily_limits_enforced,true);
  assert.equal((await generate({brand:'https://capped.example/'+flag})).status,429);
 }
 assert.equal(providerCalls,callsBeforeDisabled);
 // A confirmed summary skips all fetching, without permitting malformed websites or losing exact wording.
 delete env.BRICK_ENFORCE_DAILY_LIMITS;
 const readsBeforeSummary=globalThis.websiteReads;globalThis.websiteBlocked=true;
 const exactWording='  Made for YOU!\nSince 2020  ';
 const customerContext=JSON.stringify({business:'A print studio.',exactWording,placement:'On the base',interaction:'Display only'});
 const summaryResult=await (await generate({brand:'https://summary.example',context:customerContext,summaryOnly:true})).json();
 assert.ok(summaryResult.concept);assert.equal(summaryResult.concept.sourceUrl,'');assert.equal(globalThis.websiteReads,readsBeforeSummary);
 assert.equal(JSON.parse(prompts.at(-2).messages[1].content).context,customerContext);
 assert.ok(prompts.at(-1).prompt.includes(JSON.stringify({context:customerContext})));
 assert.equal((await generate({brand:'invalid',context:customerContext,summaryOnly:true})).status,400);
 assert.equal((await generate({brand:'https://summary.example',summaryOnly:'true'})).status,400);
 const callsBeforeEmpty=providerCalls;
 assert.equal((await (await generate({brand:'https://summary.example',summaryOnly:true})).json()).needsContext,true);assert.equal(providerCalls,callsBeforeEmpty);
 // Evidence modes cannot reuse one another's cached concept, in either insertion order.
 globalThis.websiteBlocked=false;
 for(const summaryFirst of [true,false]) {
  const request={brand:'https://mode-'+summaryFirst+'.example',context:'A business story.'};
  const a=await (await generate({...request,summaryOnly:summaryFirst})).json();
  const b=await (await generate({...request,summaryOnly:!summaryFirst})).json();
  assert.notEqual(a.concept.id,b.concept.id);
  assert.equal(Boolean(a.concept.sourceUrl),!summaryFirst);assert.equal(Boolean(b.concept.sourceUrl),summaryFirst);
 }
 // The explicit electronic mode is bounded to its own study direction; legacy requests stay mechanical.
 const storyRequest={brand:'no-website',edition:'inside',format:'miniature',summaryOnly:true};
 const electronicContext=JSON.stringify({mode:'electronic',business:'A coffee roaster.',exactWording,interaction:'One button, display and light'});
 const mechanicalContext=JSON.stringify({...JSON.parse(electronicContext),mode:'mechanical'});
 const beforeModeValidation=providerCalls;const reservationsBeforeModeValidation=reservations;
 for(const mode of ['Electronic','unknown',null,false,{}]) {
  assert.equal((await generate({...storyRequest,context:JSON.stringify({mode})})).status,400);
 }
 for(const choice of [{edition:'inside',format:'bricks'},{edition:'hero',format:'miniature'},{edition:'everyday',format:'clicker'},{edition:undefined,format:undefined}]) {
  assert.equal((await generate({...storyRequest,...choice,context:electronicContext})).status,400);
 }
 assert.equal((await generate({...storyRequest,context:'x'.repeat(601)})).status,400);
 assert.equal(providerCalls,beforeModeValidation);assert.equal(reservations,reservationsBeforeModeValidation);
 const electronicResult=await (await generate({...storyRequest,context:electronicContext})).json();
 assert.ok(electronicResult.concept);assert.equal(electronicResult.concept.edition,'inside');assert.equal(electronicResult.concept.format,'miniature');
 const electronicTextPrompt=prompts.at(-2).messages[0].content;const electronicImagePrompt=prompts.at(-1).prompt;
 for(const prompt of [electronicTextPrompt,electronicImagePrompt]) {
  assert.match(prompt,/Concept mode: electronic\./);assert.match(prompt,/Edition: Inside\./);assert.match(prompt,/Object format: Miniature\./);
  assert.match(prompt,/off-the-shelf ESP32-class controller/);assert.match(prompt,/unvalidated proposal requiring physical, electrical, firmware, privacy\/content and cost validation/);
  assert.match(prompt,/No promised Muse integration/);assert.match(prompt,/Electronics, firmware and cloud services are scoped and quoted separately/);
  assert.match(prompt,/art, technology and commercial usefulness/);assert.match(prompt,/at most one or two mechanical actions/);
  assert.match(prompt,/RM100–500 is an exploratory budget range/);assert.doesNotMatch(prompt,/minimum RM100/);
  assert.doesNotMatch(prompt,/Concept mode: mechanical\./);
 }
 assert.equal(JSON.parse(prompts.at(-2).messages[1].content).context,electronicContext);
 assert.ok(electronicImagePrompt.includes(JSON.stringify({context:electronicContext})));
 await generate({...storyRequest,context:electronicContext});assert.equal(providerCalls,beforeModeValidation+2);
 const electronicRestored=await (await generate({id:electronicResult.concept.id})).json();
 assert.equal(electronicRestored.concept.id,electronicResult.concept.id);assert.equal(providerCalls,beforeModeValidation+2);
 const mechanicalResult=await (await generate({...storyRequest,context:mechanicalContext})).json();
 assert.notEqual(mechanicalResult.concept.id,electronicResult.concept.id);assert.equal(providerCalls,beforeModeValidation+4);
 assert.match(prompts.at(-2).messages[0].content,/Concept mode: mechanical\..*No powered electronics/);
 assert.doesNotMatch(prompts.at(-2).messages[0].content,/Concept mode: electronic\./);
 assert.equal(rows.find(row=>row.id===electronicResult.concept.id).prompt_version,ready.prompt_version);
 const legacyContext=JSON.stringify({business:'A coffee roaster.'});
 await generate({...storyRequest,context:legacyContext});
 assert.match(prompts.at(-2).messages[0].content,/Concept mode: mechanical\./);
 // v8 explicitly negotiates the richer flat envelope; old requests keep their 600-character bound.
 const v8Request={...storyRequest,contractVersion:'offkin-cocreation-v8'};
 const beforeV8Validation=providerCalls, beforeV8Reservations=reservations;
 for(const body of [
  {...v8Request,contractVersion:'offkin-cocreation-v9',context:legacyContext},
  {...v8Request,contractVersion:null,context:legacyContext},
  {...v8Request,context:'x'.repeat(6001)},
  {...v8Request,context:JSON.stringify({business:'x'.repeat(6000)})},
  {...v8Request,context:JSON.stringify({business:'A studio.',uploadedLogo:'logo.png'})},
  {...v8Request,context:JSON.stringify({business:'A studio.',brandIdentifiers:['a mark']})},
  {...v8Request,context:JSON.stringify({business:'A studio.',scale:{width:100}})},
  {...v8Request,context:JSON.stringify({business:'A studio.',mode:'auto'})},
  {...v8Request,context:{business:'A studio.'}},
  {...v8Request,context:'A plain-text legacy brief'},
  {...v8Request,context:'null'}, {...v8Request,context:'[]'}, {...v8Request,context:'{}'},
  {...v8Request},
 ])assert.equal((await generate(body)).status,400);
 assert.equal(providerCalls,beforeV8Validation);assert.equal(reservations,beforeV8Reservations);
 const fullContext=JSON.stringify({mode:'mechanical',business:'A print studio. '+ 'A supplied detail. '.repeat(70),hiddenDetail:'We align the folds by hand.',angle:'The small ritual',item:'Scene in a frame',audience:'Our customers',exactWording,placement:'On the object',style:'Illustrated & surreal',interaction:'Slide to discover',scale:'Let the story decide',brandIdentifiers:'A folded paper silhouette'});
 assert.ok(fullContext.length>600&&fullContext.length<6000);
 const fullResult=await (await generate({...v8Request,context:fullContext})).json();
 assert.ok(fullResult.concept);assert.equal(fullResult.concept.sourceUrl,'');
 assert.equal(JSON.parse(prompts.at(-2).messages[1].content).context,fullContext);
 assert.ok(prompts.at(-1).prompt.includes(JSON.stringify({context:fullContext})));
 assert.match(prompts.at(-2).messages[0].content,/Reuse hidden internals, connectors/);
 assert.match(prompts.at(-1).prompt,/do not add a generic pedestal/);
 assert.match(prompts.at(-1).prompt,/Choose camera angle, framing, background, lighting/);
 for(const forbidden of ['warm ivory seamless studio background','Keep camera, lighting and framing consistent across brands','keep it palm-sized with one main scene','standard reusable, stable display base']) {
  assert.ok(!prompts.at(-2).messages[0].content.includes(forbidden));assert.ok(!prompts.at(-1).prompt.includes(forbidden));
 }
 const afterFull=providerCalls;
 await generate({...v8Request,context:fullContext});assert.equal(providerCalls,afterFull);
 await generate({...v8Request,context:fullContext.replace('Illustrated & surreal','Cinematic & atmospheric')});assert.equal(providerCalls,afterFull+2);
 // Unicode and escaped whitespace count as JavaScript code units, with enough bounded body room.
 const exactUnicode='  FOR YOU!\n异趣伙伴 ☕  ';
 for(const fill of ['x','界']) {
  const shape={business:'',exactWording:exactUnicode,scale:'Let the story decide'};
  const boundaryContext=JSON.stringify({...shape,business:fill.repeat(6000-JSON.stringify(shape).length)});
  assert.equal(boundaryContext.length,6000);
  const boundaryResult=await generate({...v8Request,context:boundaryContext});assert.equal(boundaryResult.status,200);
  assert.ok((await boundaryResult.json()).concept);
  assert.equal(JSON.parse(prompts.at(-2).messages[1].content).context,boundaryContext);
  assert.equal(JSON.parse(JSON.parse(prompts.at(-2).messages[1].content).context).exactWording,exactUnicode);
  const callsBeforeOverflow=providerCalls;
  assert.equal((await generate({...v8Request,context:boundaryContext+' '})).status,400);assert.equal(providerCalls,callsBeforeOverflow);
 }
 // Contract choice is part of cache identity and raw customer context is never persisted.
 const sameContext=JSON.stringify({business:'A studio with a folding ritual.'});
 const legacySame=await (await generate({...storyRequest,context:sameContext})).json();
 const v8Same=await (await generate({...v8Request,context:sameContext})).json();
 assert.notEqual(legacySame.concept.id,v8Same.concept.id);
 for(const row of rows){assert.equal(row.context,undefined);assert.equal(row.exactWording,undefined);}
 // The customer interaction survives into both prompts, including electronic exploration.
 const electronicV8=JSON.stringify({mode:'electronic',business:'A coffee roaster.',interaction:'Turn to reveal',style:'Bold & graphic',scale:'Let the story decide'});
 assert.equal((await generate({...v8Request,context:electronicV8})).status,200);
 assert.equal(JSON.parse(prompts.at(-2).messages[1].content).context,electronicV8);
 assert.match(prompts.at(-2).messages[0].content,/A button is optional, never a replacement for a selected turn, slide or display-only preference/);
 assert.match(prompts.at(-1).prompt,/do not force a button, display or LED/);
 // Website/identifier input matches the UI's 300-character boundary, without truncation.
 const websitePrefix='https://rimba.com/';
 const websiteAtLimit=websitePrefix+'a'.repeat(300-websitePrefix.length);
 assert.equal(websiteAtLimit.length,300);
 const beforeLongInspection=providerCalls;
 assert.equal((await generate({brand:websiteAtLimit,inspectWebsite:true})).status,200);
 assert.equal(providerCalls,beforeLongInspection);
 assert.equal((await generate({...v8Request,brand:websiteAtLimit,context:legacyContext})).status,200);
 assert.equal(JSON.parse(prompts.at(-2).messages[1].content).brand,websiteAtLimit);
 const callsBeforeLongRejection=providerCalls, readsBeforeLongRejection=globalThis.websiteReads, reservationsBeforeLongRejection=reservations;
 assert.equal((await generate({brand:websiteAtLimit+'a',inspectWebsite:true})).status,400);
 assert.equal((await generate({...v8Request,brand:websiteAtLimit+'a',context:legacyContext})).status,400);
 assert.equal(providerCalls,callsBeforeLongRejection);assert.equal(globalThis.websiteReads,readsBeforeLongRejection);assert.equal(reservations,reservationsBeforeLongRejection);
 console.log('Backend contract passed: v8 capability/version negotiation, 6000-character structured context and Unicode preservation, request bounds, legacy compatibility, optional electronics, disabled service, quota waiver/restoration, cache separation, private persisted results, and saved links.');
} finally { await rm(temp,{recursive:true,force:true}); }

