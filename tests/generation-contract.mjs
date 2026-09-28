// Isolated contract checks. No external model/database calls or paid generation.
import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const temp = await mkdtemp(join(tmpdir(), 'form-contract-'));
const env = { SUPABASE_URL:'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY:'test', LOVABLE_API_KEY:'test', BRICK_GENERATION_ENABLED:'true' };
let handler, cached = null, limit = true, providerCalls = 0;
globalThis.Deno = {env:{get:k=>env[k]},serve:fn=>{handler=fn;}};
globalThis.testDB = {
 from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:cached,error:null})})})}),
 rpc:async()=>({data:limit,error:null}),
 storage:{from:()=>({createSignedUrl:async()=>({data:{signedUrl:'https://test.invalid/image.png'},error:null})})},
};
globalThis.fetch = async()=>{providerCalls++;return new Response(JSON.stringify({choices:[{message:{content:'{"needsContext":true}'}}]}),{status:200});};
await build({entryPoints:['supabase/functions/generate-concept/index.ts'],bundle:true,format:'esm',platform:'node',outfile:join(temp,'edge.mjs'),plugins:[{name:'mock-db',setup(b){b.onResolve({filter:/https:\/\/esm.sh/},()=>({path:'mock',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const createClient=()=>globalThis.testDB;',loader:'js'}));}}]});
try {
 await import(pathToFileURL(join(temp,'edge.mjs')));
 const send=(body,method='POST')=>handler(new Request('https://test.invalid',{method,body:method==='POST'?body:undefined}));
 assert.equal((await send('', 'OPTIONS')).status,200);
 assert.equal((await send('', 'GET')).status,405);
 assert.equal((await send('{')).status,400);
 assert.equal((await send(JSON.stringify({brand:'X'}))).status,400);
 env.BRICK_GENERATION_ENABLED='false'; assert.equal((await send('{"brand":"NVIDIA"}')).status,503);
 env.BRICK_GENERATION_ENABLED='true'; limit=false; assert.equal((await send('{"brand":"NVIDIA"}')).status,429); assert.equal(providerCalls,0);
 limit=true; const context=await (await send('{"brand":"Unknown"}')).json();assert.equal(context.needsContext,true);assert.equal(providerCalls,1);
 cached={id:'test-id',brand:'NVIDIA',title:'Pixel Forge',story:'Computing, made tangible.',image_path:'test.png'};
 const hit=await (await send('{"brand":"NVIDIA"}')).json();assert.equal(hit.concept.title,'Pixel Forge');assert.equal(providerCalls,1);
 console.log('8 backend contract checks passed (mocked services; no live generation).');
} finally { await rm(temp,{recursive:true,force:true}); }
