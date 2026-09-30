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
await build({entryPoints:['supabase/functions/generate-concept/index.ts'],bundle:true,format:'esm',platform:'node',outfile:join(temp,'edge.mjs'),plugins:[{name:'mock-db',setup(b){b.onResolve({filter:/website\.ts$/},()=>({path:'website',namespace:'website'}));b.onLoad({filter:/.*/,namespace:'website'},()=>({contents:`export function validatePublicWebsiteUrl(input){if(!input.includes('.'))throw new Error('Invalid website');return new URL(input.startsWith('http')?input:'https://'+input);} export class WebsiteReadError extends Error {} export async function readCompanyWebsite(input){ if(globalThis.websiteBlocked)throw new Error('blocked');return {url:'https://rimba.example',title:'Rimba Coffee',excerpt:'A coffee roaster.'}; }`,loader:'js'}));b.onResolve({filter:/https:\/\/esm.sh/},()=>({path:'mock',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const createClient=()=>globalThis.testDB;',loader:'js'}));}}]});
try {
 await import(pathToFileURL(join(temp,'edge.mjs')));
 const send=(body,method='POST')=>handler(new Request('https://test.invalid',{method,body:method==='POST'?body:undefined}));
 const generate=body=>send(JSON.stringify(body));
 assert.equal((await send('', 'OPTIONS')).status,200);
 assert.equal((await send('', 'GET')).status,200);
 assert.equal((await (await send('', 'GET')).json()).daily_limits_enforced,false);
 assert.equal(providerCalls,0);
 assert.equal((await send('x'.repeat(12001))).status,413);
 for(const raw of ['{','null','[]','{"brand":"X"}'])assert.equal((await send(raw)).status,400);
 for(const choice of [{edition:'icon',format:'clicker'},{edition:'constructor',format:'bricks'},{edition:'hero',format:'__proto__'}])assert.equal((await generate({brand:'rimba.com',...choice})).status,400);
 assert.equal(providerCalls,0);
 assert.equal((await generate({brand:'not-a-website'})).status,400);assert.equal(reservations,0);
 env.BRICK_GENERATION_ENABLED='false'; assert.equal((await generate({brand:'rimba.com'})).status,503);
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
 console.log('Backend contract passed: validation, disabled service, temporary waiver, restored rate limits, context, successful generation, edition/format cache separation, saved links, and legacy defaults.');
} finally { await rm(temp,{recursive:true,force:true}); }
