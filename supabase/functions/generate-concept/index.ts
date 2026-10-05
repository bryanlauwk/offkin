import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { parseSelection, designDirection, type Edition, type GiftFormat } from './options.ts';
import { readCompanyWebsite, validatePublicWebsiteUrl, WebsiteReadError } from './website.ts';
import { BRAND_PROMPT, IMAGE_PROMPT, PROMPT_VERSION, parseConceptMode, modeDesignDirection } from './prompt.ts';
const json = (data: unknown, status=200) => new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Cache-Control':'no-store'}});
const hash = async (s:string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
// Temporary owner-requested test waiver. Set BRICK_ENFORCE_DAILY_LIMITS=true to restore caps.
// Only an absent setting or explicit false bypasses quotas; unknown values fail closed.
const dailyLimitsEnforced = () => (Deno.env.get('BRICK_ENFORCE_DAILY_LIMITS') ?? 'false') !== 'false';
class Failure extends Error { constructor(public status:number, message:string){super(message);} }
Deno.serve(async req => {
 if(req.method==='OPTIONS')return json({});
 if(req.method==='GET'){
  const sourceCapabilities={prompt_version:PROMPT_VERSION,capabilities:{summary_only:true,electronic_story_scene:true}};
  const url=Deno.env.get('SUPABASE_URL'); const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!service)return json({ready:false,...sourceCapabilities,reason:'Backend configuration is missing.'},503);
  const db=createClient(url,service);
  const {error}=await db.from('brick_concepts').select('id,edition,format,interaction,source_url,source_title').limit(0);
  const enabled=Boolean(Deno.env.get('LOVABLE_API_KEY'))&&Deno.env.get('BRICK_GENERATION_ENABLED')==='true';
  return json({ready:!error&&enabled,daily_limits_enforced:dailyLimitsEnforced(),...sourceCapabilities,verification:'Configuration and schema only; website transport and AI providers need a live test. Electronic story scenes are unvalidated concept studies requiring physical, electrical, firmware, privacy/content and cost validation.',reason:error?'Concept storage setup is incomplete.':!enabled?'AI generation is not enabled.':'Ready for a generation test.'},!error&&enabled?200:503);
 }
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 try {
  const reader=req.body?.getReader(); const chunks:Uint8Array[]=[]; let total=0;
  if(reader) { try { while(true) { const {done,value}=await reader.read(); if(done)break; total+=value.byteLength; if(total>12000){await reader.cancel();return json({error:'Please shorten your brand brief.'},413);} chunks.push(value); } } finally { reader.releaseLock(); } }
  const bytesIn=new Uint8Array(total); let offset=0;for(const chunk of chunks){bytesIn.set(chunk,offset);offset+=chunk.byteLength;}
  const raw=new TextDecoder().decode(bytesIn); if(raw.length>3000) return json({error:'Please shorten your brand brief.'},400);
  let input; try{input=JSON.parse(raw);}catch{return json({error:'Invalid request.'},400);}
  if(!input || typeof input!=='object' || Array.isArray(input))return json({error:'Invalid request.'},400);
  if(input.summaryOnly!==undefined && typeof input.summaryOnly!=='boolean')return json({error:'Invalid story request.'},400);
  if(input.inspectWebsite!==undefined && typeof input.inspectWebsite!=='boolean')return json({error:'Invalid inspection request.'},400);
  const selection=parseSelection(input);
  if(!input.id && !selection)return json({error:'Choose a valid edition and format. Icon is available as a brick build or miniature.'},400);
  const url=Deno.env.get('SUPABASE_URL');const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!service)throw new Failure(503,'Concept generation is being connected. Please try again later.');
  const db=createClient(url,service);
  const deliver=async(row:{id:string;brand:string;title:string;story:string;image_path:string;edition?:Edition;format?:GiftFormat;interaction?:string;source_url?:string;source_title?:string})=>{
   const {data,error}=await db.storage.from('brick-concepts').createSignedUrl(row.image_path,3600);
   if(error||!data)throw new Failure(503,'The concept image is temporarily unavailable. Please retry.');
   return json({concept:{id:row.id,brand:row.brand,title:row.title,story:row.story,image:data.signedUrl,edition:row.edition||'everyday',format:row.format||'clicker',interaction:row.interaction||'',sourceUrl:row.source_url||'',sourceTitle:row.source_title||''}});
  };
  if(input.id){
   if(typeof input.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id))return json({error:'Invalid concept link.'},400);
   const {data,error}=await db.from('brick_concepts').select('id,brand,title,story,image_path,edition,format,interaction,source_url,source_title').eq('id',input.id).maybeSingle();
   if(error)throw new Failure(503,'Could not load this concept. Please retry.');
   return data?await deliver(data):json({error:'This concept could not be found.'},404);
  }
  const brand=typeof input.brand==='string'?input.brand.trim():'';
  const context=typeof input.context==='string'?input.context.trim():'';
  if(brand.length<2||brand.length>120||context.length>600)return json({error:'Enter a brand (2–120 characters) and a short brief (up to 600 characters).'},400);
  const mode=parseConceptMode(context);
  if(!mode)return json({error:'Choose mechanical or electronic concept mode.'},400);
  if(mode==='electronic'&&(selection!.edition!=='inside'||selection!.format!=='miniature'))return json({error:'Electronic story-scene studies require the Inside edition and Miniature format.'},400);
  const direction=modeDesignDirection(mode,designDirection(selection!));
  let websiteUrl: string;
  if(brand==='no-website'&&input.summaryOnly===true&&!input.inspectWebsite) websiteUrl='';
  else try { websiteUrl=validatePublicWebsiteUrl(brand).href; } catch(error) { return json({error:error instanceof Error?error.message:'Enter a public company website.'},400); }
  const key=Deno.env.get('LOVABLE_API_KEY');const enabled=Deno.env.get('BRICK_GENERATION_ENABLED')==='true';
  if(!input.inspectWebsite&&(!key||!enabled))throw new Failure(503,'Live generation is not available yet. Please try again later.');
  const cacheKey=await hash(JSON.stringify([PROMPT_VERSION,websiteUrl,context,Boolean(input.summaryOnly),selection!.edition,selection!.format]));
  const {data:cached,error:cacheError}=await db.from('brick_concepts').select('id,brand,title,story,image_path,edition,format,interaction,source_url,source_title').eq('cache_key',cacheKey).maybeSingle();
  if(cacheError)throw new Failure(503,'Concept generation is being set up. Please try again later.');
  if(cached&&!input.inspectWebsite)return await deliver(cached);
  if(dailyLimitsEnforced()) {
   // Platform-forwarded IP is an abuse hint; the atomic global cap bounds paid attempts.
   const client=await hash(service+':'+(req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown'));
   const {data:allowed,error:limitError}=await db.rpc('reserve_brick_generation',{client_key:client});
   if(limitError)throw new Failure(503,'Concept generation is temporarily unavailable.');
   if(!allowed)throw new Failure(429,'Today’s concept limit has been reached. Try again tomorrow.');
  }
  let website: {url:string;title:string;excerpt:string}|null=null;
  if(input.summaryOnly===true && !context)return json({needsContext:true,message:'Tell us what your business does so we can start with your story.'});
  try { if(input.summaryOnly!==true)website=await readCompanyWebsite(websiteUrl); }
  catch(error) {
   if(error instanceof WebsiteReadError && error.status===400)return json({error:error.message},400);
   if(!context)return json({needsContext:true,message:'We could not read that public website. Add a short business summary so we can create an accurate concept without guessing.'});
  }
  if(input.inspectWebsite===true)return json({website,verified:Boolean(website),verification:website?'Website text fetched without AI generation.':'Website could not be read; no AI generation was attempted.'});
  async function ai(path:string,body:unknown){
   if(req.signal.aborted)throw new Failure(499,'The request was cancelled.');
   const response=await fetch('https://ai.gateway.lovable.dev/v1/'+path,{method:'POST',headers:{'Authorization':`Bearer ${key}`,'Lovable-API-Key':key!,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.any([req.signal,AbortSignal.timeout(100000)])});
   if(!response.ok)throw new Failure(response.status===429?429:503,response.status===429?'The generator is busy. Please try again shortly.':'The generator is unavailable right now. Please try again later.');
   return await response.json();
  }
  const text=await ai('chat/completions',{model:Deno.env.get('BRICK_TEXT_MODEL')||'google/gemini-3-flash-preview',messages:[{role:'system',content:BRAND_PROMPT+'\n'+direction},{role:'user',content:JSON.stringify({brand,context,websiteEvidence:website,...selection})}],response_format:{type:'json_object'},max_tokens:1100});
  let design;try{design=JSON.parse(text.choices?.[0]?.message?.content||'');}catch{throw new Failure(502,'We could not resolve this brand. Add a short description and retry.');}
  if(design.needsContext===true)return json({needsContext:true,message:'Tell us what your brand does and its main colours so the concept feels like you.'});
  if(design.needsContext!==false||!['brand','title','story','interaction','design'].every(k=>typeof design[k]==='string'&&design[k].length>0&&design[k].length<=1500))throw new Failure(502,'Please add a short brand description and retry.');
  const result=await ai('images/generations',{model:Deno.env.get('BRICK_IMAGE_MODEL')||'openai/gpt-image-2',prompt:IMAGE_PROMPT+'\n'+direction+'\nDesign brief JSON:\n'+JSON.stringify(design)+'\nOriginal customer direction JSON (preserve exactWording verbatim, no added wording):\n'+JSON.stringify({context}),n:1,size:'1024x1024'});
  const b64=result.data?.[0]?.b64_json;
  if(typeof b64!=='string'||b64.length>14000000)throw new Failure(502,'The image could not be completed. Please retry.');
  const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
  const mime=bytes[0]===137&&bytes[1]===80?'image/png':bytes[0]===255&&bytes[1]===216?'image/jpeg':String.fromCharCode(...bytes.slice(8,12))==='WEBP'?'image/webp':null;
  if(!mime)throw new Failure(502,'The generator returned an unsupported image. Please retry.');
  const id=crypto.randomUUID();const imagePath=id+'.'+mime.split('/')[1];
  const {error:uploadError}=await db.storage.from('brick-concepts').upload(imagePath,bytes,{contentType:mime,upsert:false});
  if(uploadError)throw new Failure(503,'Could not save this concept. Please retry.');
  const row={id,cache_key:cacheKey,brand:design.brand.slice(0,120),title:design.title.slice(0,60),story:design.story.slice(0,300),image_path:imagePath,prompt_version:PROMPT_VERSION,edition:selection!.edition,format:selection!.format,interaction:design.interaction.slice(0,240),source_url:website?.url||'',source_title:website?.title||''};
  const {error:saveError}=await db.from('brick_concepts').insert(row);
  if(saveError){
   await db.storage.from('brick-concepts').remove([imagePath]);
   const {data:existing}=await db.from('brick_concepts').select('id,brand,title,story,image_path,edition,format,interaction,source_url,source_title').eq('cache_key',cacheKey).maybeSingle();
   if(existing)return await deliver(existing);
   throw new Failure(503,'Could not save this concept. Please retry.');
  }
  return await deliver(row);
 }catch(e){return json({error:e instanceof Failure?e.message:'The concept could not be completed. Please try again.'},e instanceof Failure?e.status:503);}
});
