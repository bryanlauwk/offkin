// Real edge handler against isolated fake provider/storage/database. No paid generation.
import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const temp = await mkdtemp(join(tmpdir(), 'brandkin-contract-'));
const env = { SUPABASE_URL:'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY:'test', LOVABLE_API_KEY:'test', BRICK_GENERATION_ENABLED:'true' };
let handler, limit = true, providerCalls = 0, ambiguous = true;
const rows = [], prompts = [];
globalThis.Deno = {env:{get:k=>env[k]},serve:fn=>{handler=fn;}};
globalThis.testDB = {
 from:()=>({select:()=>({eq:(key,value)=>({maybeSingle:async()=>({data:rows.find(row=>row[key]===value)||null,error:null})})}),insert:async row=>{rows.push(row);return {error:null};}}),
 rpc:async()=>({data:limit,error:null}),
 storage:{from:()=>({createSignedUrl:async()=>({data:{signedUrl:'https://test.invalid/image.png'},error:null}),upload:async()=>({error:null}),remove:async()=>({error:null})})},
};
globalThis.fetch = async(url,init)=>{
 providerCalls++; const body=JSON.parse(init.body);prompts.push(body);
 const data=url.endsWith('images/generations') ? {data:[{b64_json:Buffer.from([137,80,78,71]).toString('base64')}]} : {choices:[{message:{content:JSON.stringify(ambiguous ? {needsContext:true} : {needsContext:false,brand:'Rimba',title:'Coffee collectible',story:'A proposed brand story.',interaction:'Build and display.',design:'A substantial coffee stall.'})}}]};
 return new Response(JSON.stringify(data),{status:200});
};
await build({entryPoints:['supabase/functions/generate-concept/index.ts'],bundle:true,format:'esm',platform:'node',outfile:join(temp,'edge.mjs'),plugins:[{name:'mock-db',setup(b){b.onResolve({filter:/https:\/\/esm.sh/},()=>({path:'mock',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const createClient=()=>globalThis.testDB;',loader:'js'}));}}]});
try {
 await import(pathToFileURL(join(temp,'edge.mjs')));
 const send=(body,method='POST')=>handler(new Request('https://test.invalid',{method,body:method==='POST'?body:undefined}));
 const generate=body=>send(JSON.stringify(body));
 assert.equal((await send('', 'OPTIONS')).status,200);
 assert.equal((await send('', 'GET')).status,405);
 for(const raw of ['{','null','[]','{"brand":"X"}'])assert.equal((await send(raw)).status,400);
 for(const choice of [{edition:'icon',format:'clicker'},{edition:'constructor',format:'bricks'},{edition:'hero',format:'__proto__'}])assert.equal((await generate({brand:'Rimba',...choice})).status,400);
 assert.equal(providerCalls,0);
 env.BRICK_GENERATION_ENABLED='false'; assert.equal((await generate({brand:'Rimba'})).status,503);
 env.BRICK_GENERATION_ENABLED='true'; limit=false; assert.equal((await generate({brand:'Rimba'})).status,429); assert.equal(providerCalls,0);
 limit=true; assert.equal((await (await generate({brand:'Unknown'})).json()).needsContext,true); assert.equal(providerCalls,1);
 ambiguous=false;
 const first=await (await generate({brand:'Rimba',edition:'hero',format:'bricks'})).json();
 assert.equal(first.concept.edition,'hero');assert.equal(first.concept.format,'bricks');assert.equal(first.concept.interaction,'Build and display.');assert.equal(providerCalls,3);
 assert.match(prompts.at(-2).messages[0].content,/Edition: Hero/);assert.match(prompts.at(-1).prompt,/Object format: Brick build/);
 await generate({brand:'Rimba',edition:'hero',format:'bricks'});assert.equal(providerCalls,3);
 await generate({brand:'Rimba',edition:'inside',format:'bricks'});assert.equal(providerCalls,5);
 await generate({brand:'Rimba',edition:'hero',format:'miniature'});assert.equal(providerCalls,7);
 assert.equal(new Set(rows.map(r=>r.cache_key)).size,3);
 const restored=await (await generate({id:first.concept.id})).json();assert.equal(restored.concept.edition,'hero');assert.equal(restored.concept.format,'bricks');assert.equal(providerCalls,7);
 rows.push({id:'11111111-1111-1111-1111-111111111111',brand:'Legacy',title:'Old clicker',story:'Old story.',image_path:'old.png'});
 const old=await (await generate({id:rows.at(-1).id})).json();assert.equal(old.concept.edition,'everyday');assert.equal(old.concept.format,'clicker');
 console.log('Backend contract passed: validation, disabled service, rate limits, context, successful generation, edition/format cache separation, saved links, and legacy defaults.');
} finally { await rm(temp,{recursive:true,force:true}); }
