import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { parseSelection, designDirection, type Edition, type GiftFormat } from './options.ts';
import { readCompanyWebsite, readCompanyWebsiteDirect, validatePublicWebsiteUrl, WebsiteReadError } from './website.ts';
import { websiteReadMessage } from './website-contract.ts';
import { CANVAS_WORLD_PROMPT, CANVAS_PHYSICAL_PROMPT, canvasImagePrompt, BRAND_PROMPT, IMAGE_PROMPT, PROMPT_VERSION, parseConceptMode, modeDesignDirection, CO_CREATION_CONTRACT_VERSION, MAX_CONTEXT_CHARS, LEGACY_MAX_CONTEXT_CHARS, MAX_REQUEST_BYTES, isCoCreationContext } from './prompt.ts';
import { CANVAS_CONTRACT_VERSION, CANVAS_CAPABILITIES, CanvasFailure, validateCanvasRequest, canvasCacheInput, parseCanvasManifest, serializeCanvasManifest, restoreCanvasRow, selectWorldElements, parseCanvasDesign, isCanvasContext, type CanvasManifest, type CanvasStoredRow } from './canvas.ts';
import { PROPOSAL_CONTRACT_VERSION, PROPOSAL_CAPABILITIES, restoreProposalRow } from './proposal.ts';
import { handleProposal, supportsProposalModel } from './proposal-handler.ts';
import { providerCallTimeout } from './proposal-budget.ts';
import { serverGenerationHeld, SERVER_GENERATION_HOLD_MESSAGE, isRestoreOnlyRequest } from './server-generation-hold.ts';
import { requestPilotDigest, loadPilotAccess, publicPilotAccess, pilotExecution, PILOT_ACCESS_VERSION } from './pilot-access.ts';
const json = (data: unknown, status=200) => new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info, x-offkin-invite, x-offkin-recovery','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Cache-Control':'no-store'}});
const hash = async (s:string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
// Temporary owner-requested test waiver. Set BRICK_ENFORCE_DAILY_LIMITS=true to restore caps.
// Only an absent setting or explicit false bypasses quotas; unknown values fail closed.
const dailyLimitsEnforced = () => (Deno.env.get('BRICK_ENFORCE_DAILY_LIMITS') ?? 'false') !== 'false';
const proposalImageModel = () => Deno.env.get('BRICK_PROPOSAL_IMAGE_MODEL') || Deno.env.get('BRICK_IMAGE_MODEL') || 'openai/gpt-image-2';
// The new reference-conditioned route needs its own explicit, verified enablement.
const proposalEnabled = () => Deno.env.get('BRICK_PROPOSAL_ENABLED') === 'true' && supportsProposalModel(proposalImageModel());
class Failure extends Error { constructor(public status:number, message:string){super(message);} }
export async function handleRequest(req: Request) {
 if(req.method==='OPTIONS')return json({});
 if(req.method==='GET'){
  const held=serverGenerationHeld();
  const sourceCapabilities={prompt_version:PROMPT_VERSION,capabilities:{...CANVAS_CAPABILITIES,...PROPOSAL_CAPABILITIES,proposal:!held&&proposalEnabled(),summary_only:true,electronic_story_scene:true,cocreation:true,context_max_chars:MAX_CONTEXT_CHARS}};
  const paused=()=>json({ready:false,generation_paused:true,invite_access_ready:false,pilot_access:{version:PILOT_ACCESS_VERSION,authorized:false},daily_limits_enforced:dailyLimitsEnforced(),...sourceCapabilities,reason:SERVER_GENERATION_HOLD_MESSAGE,verification:'Server-enforced hold. No website or AI provider was contacted; saved-link restoration remains a separate read-only request.'},503);
  const url=Deno.env.get('SUPABASE_URL'); const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(held){
   const digest=await requestPilotDigest(req);
   if(!digest||!url||!service)return paused();
   try{
    const db=createClient(url,service);const access=await loadPilotAccess(db,digest);
    if(!access)return paused();
    const {error}=await db.from('brick_concepts').select('id,pilot_invite_id').limit(0);
    if(error)return paused();
    const ready=Boolean(Deno.env.get('LOVABLE_API_KEY'))&&Deno.env.get('BRICK_GENERATION_ENABLED')==='true'&&proposalEnabled();
    // A valid status read succeeds even when its remaining generation allowance
    // is zero. Clients must also require ready + exact generation capabilities.
    return json({ready,generation_paused:!ready,invite_access_ready:true,pilot_access:publicPilotAccess(access),...sourceCapabilities,capabilities:{...sourceCapabilities.capabilities,proposal:true},reason:ready?'Private pilot requests are available within this invitation’s remaining allowance; completed attempts can be recovered without another provider call.':'New generation is paused. Explicit saved-result recovery remains available.',verification:'Invite, campaign, configuration and schema checked. Provider quality still requires separately authorized live acceptance.'},200);
   }catch{return paused();}
  }
  if(!url||!service)return json({ready:false,...sourceCapabilities,reason:'Backend configuration is missing.'},503);
  const db=createClient(url,service);
  const {error}=await db.from('brick_concepts').select('id,cache_key,brand,title,story,image_path,prompt_version,edition,format,interaction,source_url,source_title').limit(0);
  const enabled=Boolean(Deno.env.get('LOVABLE_API_KEY'))&&Deno.env.get('BRICK_GENERATION_ENABLED')==='true';
  return json({ready:!error&&enabled,daily_limits_enforced:dailyLimitsEnforced(),...sourceCapabilities,verification:'Configuration and schema only; website transport and AI providers need a live test. Electronic story scenes are unvalidated concept studies requiring physical, electrical, firmware, privacy/content and cost validation.',reason:error?'Concept storage setup is incomplete.':!enabled?'AI generation is not enabled.':'Ready for a generation test.'},!error&&enabled?200:503);
 }
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 try {
  const reader=req.body?.getReader(); const chunks:Uint8Array[]=[]; let total=0;
  if(reader) { try { while(true) { const {done,value}=await reader.read(); if(done)break; total+=value.byteLength; if(total>MAX_REQUEST_BYTES){await reader.cancel();return json({error:'Please shorten your brand brief.'},413);} chunks.push(value); } } finally { reader.releaseLock(); } }
  const bytesIn=new Uint8Array(total); let offset=0;for(const chunk of chunks){bytesIn.set(chunk,offset);offset+=chunk.byteLength;}
  const raw=new TextDecoder().decode(bytesIn);
  let input; try{input=JSON.parse(raw);}catch{return json({error:'Invalid request.'},400);}
  if(!input || typeof input!=='object' || Array.isArray(input))return json({error:'Invalid request.'},400);
  // This boundary precedes database/cache/source reads and every website/provider
  // route, including legacy generation, revision planning and Firecrawl fallback.
  // A UUID mixed with generation fields is not a read-only restore request.
  const held=serverGenerationHeld();const restoring=isRestoreOnlyRequest(input);
  if(req.headers.has('x-offkin-recovery')&&req.headers.get('x-offkin-recovery')!=='1')return json({error:'Use the supported saved-result recovery request.'},400);
  const inviteDigest=held&&!restoring?await requestPilotDigest(req):null;
  if(held){
   if(restoring){
    if(typeof input.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id))return json({error:'Invalid concept link.'},400);
   }else if(!inviteDigest||Object.prototype.hasOwnProperty.call(input,'id'))return json({error:SERVER_GENERATION_HOLD_MESSAGE,generation_paused:true,invite_access_ready:false},503);
  }
  if(input.summaryOnly!==undefined && typeof input.summaryOnly!=='boolean')return json({error:'Invalid story request.'},400);
  if(input.inspectWebsite!==undefined && typeof input.inspectWebsite!=='boolean')return json({error:'Invalid inspection request.'},400);
  if(input.contractVersion!==undefined && input.contractVersion!==CO_CREATION_CONTRACT_VERSION && input.contractVersion!==CANVAS_CONTRACT_VERSION && input.contractVersion!==PROPOSAL_CONTRACT_VERSION)return json({error:'This co-creation contract is not supported.'},400);
  const canvas=input.contractVersion===CANVAS_CONTRACT_VERSION;
  const proposal=input.contractVersion===PROPOSAL_CONTRACT_VERSION;
  // Never silently reinterpret an unversioned canvas request as a legacy product request.
  if(!canvas && !proposal && input.stage!==undefined)return json({error:'This canvas contract is not supported.'},400);
  if(canvas && !input.id)validateCanvasRequest(input);
  const coCreation=input.contractVersion===CO_CREATION_CONTRACT_VERSION;
  const selection=parseSelection(input);
  if(!input.id && !canvas && !proposal && !selection)return json({error:'Choose a valid edition and format. Icon is available as a brick build or miniature.'},400);
  const url=Deno.env.get('SUPABASE_URL');const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!service)throw new Failure(503,'Concept generation is being connected. Please try again later.');
  const db=createClient(url,service);
  const pilot=held&&!restoring?await loadPilotAccess(db,inviteDigest!):null;
  if(held&&!restoring&&!pilot)return json({error:SERVER_GENERATION_HOLD_MESSAGE,generation_paused:true,invite_access_ready:false},503);
  // The pilot permits only v10 asset/planning requests. In particular, legacy
  // website inspection cannot reach its paid Firecrawl fallback through here.
  if(pilot&&(!proposal||input.inspectWebsite!==undefined||input.summaryOnly!==undefined))return json({error:'Only complete-proposal generation is available through this private pilot invitation.'},403);
  const recoveryOnly=Boolean(pilot)&&req.headers.get('x-offkin-recovery')==='1';
  const execution=pilot?pilotExecution(db,pilot,recoveryOnly):null;
  const deliver=async(row:CanvasStoredRow & {edition?:Edition;format?:GiftFormat})=>{
   const {data,error}=await db.storage.from('brick-concepts').createSignedUrl(row.image_path,3600);
   if(error||!data)throw new Failure(503,'The concept image is temporarily unavailable. Please retry.');
   if(row.prompt_version===PROPOSAL_CONTRACT_VERSION){
    const concept=restoreProposalRow(row,data.signedUrl);
    if(!concept)throw new Failure(503,'The saved proposal could not be opened safely. Please retry.');
    return json({concept});
   }
   if(row.prompt_version===CANVAS_CONTRACT_VERSION){
    const concept=restoreCanvasRow(row,data.signedUrl);
    if(!concept)throw new Failure(503,'The saved world could not be opened safely. Please retry.');
    return json({concept});
   }
   return json({concept:{id:row.id,brand:row.brand,title:row.title,story:row.story,image:data.signedUrl,edition:row.edition||'everyday',format:row.format||'clicker',interaction:row.interaction||'',sourceUrl:row.source_url||'',sourceTitle:row.source_title||''}});
  };
  if(input.id){
   if(typeof input.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id))return json({error:'Invalid concept link.'},400);
   const {data,error}=await db.from('brick_concepts').select('id,brand,title,story,image_path,edition,format,interaction,source_url,source_title,prompt_version').eq('id',input.id).maybeSingle();
   if(error)throw new Failure(503,'Could not load this concept. Please retry.');
   return data?await deliver(data):json({error:'This concept could not be found.'},404);
  }
  const key=Deno.env.get('LOVABLE_API_KEY');const enabled=Deno.env.get('BRICK_GENERATION_ENABLED')==='true';
  async function ai(path:string,body:unknown,timeoutMs?:number){
   if(req.signal.aborted)throw new Failure(499,'The request was cancelled.');
   const timeout=providerCallTimeout(timeoutMs);
   if(!timeout)throw new Failure(504,'The generation request ran out of time. Your brief and existing images are unchanged.');
   if(execution)await execution.claim(path);
   const multipart=body instanceof FormData;
   const headers:Record<string,string>={'Authorization':`Bearer ${key}`,'Lovable-API-Key':key!};
   // Fetch supplies the multipart boundary. A manually set Content-Type would corrupt it.
   if(!multipart)headers['Content-Type']='application/json';
   const response=await fetch('https://ai.gateway.lovable.dev/v1/'+path,{method:'POST',headers,body:multipart?body:JSON.stringify(body),signal:AbortSignal.any([req.signal,AbortSignal.timeout(timeout)])});
   if(!response.ok)throw new Failure(response.status===429?429:503,response.status===429?'The generator is busy. Please try again shortly.':'The generator is unavailable right now. Please try again later.');
   return await response.json();
  }
  if(proposal){
   try{
   const result=await handleProposal(input,req,{db,generationMode:'creative-preview',requireCustomerIdentity:true,enabled:recoveryOnly||(Boolean(key)&&enabled&&proposalEnabled()),textModel:Deno.env.get('BRICK_TEXT_MODEL')||'google/gemini-3-flash-preview',imageModel:recoveryOnly&&!supportsProposalModel(proposalImageModel())?'openai/gpt-image-2':proposalImageModel(),ai,hash,respond:json,deliver,
    ...(pilot?{cacheScope:pilot.inviteId,pilotInviteId:pilot.inviteId,assertSourceAccess:execution!.assertSource,readWebsite:readCompanyWebsiteDirect,recoveryOnly,
      beforeAssetSave:execution!.beforeAssetSave,completeAsset:execution!.completeAsset,completePlanner:execution!.completePlanner,recoverAsset:execution!.recoverAsset}:{}),
    reserve:async(request)=>{
     if(execution){
      if(!request)throw new Failure(503,'A complete pilot request is required.');
      const replay=await execution.reserve(request);
      if(replay&&'payload' in replay)return json(replay.payload);
      if(replay&&'assetId' in replay){
       const {data:row,error}=await db.from('brick_concepts').select('id,cache_key,brand,title,story,image_path,edition,format,interaction,source_url,source_title,prompt_version,pilot_invite_id').eq('id',replay.assetId).maybeSingle();
       if(error||!row)throw new Failure(503,'The completed pilot result could not be restored. No provider request was sent.');
       execution.assertSource(row);return deliver(row);
      }
      return;
     }
     if(!dailyLimitsEnforced())return;
     const client=await hash(service+':'+(req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown'));
     const {data:allowed,error:limitError}=await db.rpc('reserve_brick_generation',{client_key:client});
     if(limitError)throw new Failure(503,'Proposal generation is temporarily unavailable.');
     if(!allowed)throw new Failure(429,'Today’s generation limit has been reached. Completed proposal sections are saved.');
    }
   });
   if(execution)await execution.finish(result);
   return result;
   }catch(error){
    const counted=execution?await execution.fail():false;
    if(counted){
     const known=error instanceof Failure||error instanceof CanvasFailure;
     const message=known?error.message.slice(0,320):'The generation could not be completed.';
     throw new CanvasFailure(known?error.status:503,message+' This pilot attempt remains counted and will not be retried automatically.');
    }
    throw error;
   }
  }
  if(canvas){
   const request=validateCanvasRequest(input);
   const ensureActive=()=>{if(req.signal.aborted)throw new Failure(499,'The request was cancelled.');};
   ensureActive();
   if(!key||!enabled)throw new Failure(503,'Live generation is not available yet. Please try again later.');
   let sourceRow:CanvasStoredRow|null=null; let sourceWorld:CanvasManifest|null=null;
   if(request.stage==='physical'){
    const {data,error}=await db.from('brick_concepts').select('id,brand,title,story,image_path,interaction,source_url,source_title,prompt_version').eq('id',request.sourceWorldId).maybeSingle();
    if(error)throw new Failure(503,'Could not load the source world. Please retry.');
    if(!data)throw new Failure(404,'The source world could not be found.');
    sourceRow=data; sourceWorld=parseCanvasManifest(data.story);
    if(data.prompt_version!==CANVAS_CONTRACT_VERSION||!sourceWorld||sourceWorld.stage!=='world')throw new Failure(400,'Choose a saved v9 illustrated world before generating a physical study.');
   }
   const selectedElements=sourceWorld?selectWorldElements(request,sourceWorld):null;
   const context=sourceWorld?{...sourceWorld.context,...request.context}:request.context;
   if(!isCanvasContext(context))throw new Failure(400,'The combined world and physical brief exceeds the context limit. Please shorten it; nothing was truncated.');
   let websiteUrl='';
   if(request.stage==='world'&&request.brand!=='no-website'){
    try{websiteUrl=validatePublicWebsiteUrl(request.brand.trim()).href;}
    catch(error){return json({error:error instanceof Error?error.message:'Enter a public company website.'},400);}
   }
   // The stored source is the authority for an existing world, including its public evidence URL.
   if(sourceRow)websiteUrl=sourceRow.source_url||'';
   if(request.stage==='world'&&!websiteUrl&&!context.business?.trim())return json({needsContext:true,message:'Tell us what your business does so the world starts with real facts.'});
   const cacheKey=await hash(canvasCacheInput(request,websiteUrl,sourceWorld));
   const {data:cached,error:cacheError}=await db.from('brick_concepts').select('id,brand,title,story,image_path,edition,format,interaction,source_url,source_title,prompt_version').eq('cache_key',cacheKey).maybeSingle();
   if(cacheError)throw new Failure(503,'Concept generation is being set up. Please try again later.');
   ensureActive();
   if(cached)return await deliver(cached);
   let website:{url:string;title:string;excerpt:string}|null=null;
   if(request.stage==='world'&&websiteUrl){
    try{website=await readCompanyWebsite(websiteUrl);}
    catch(error){
     if(error instanceof WebsiteReadError&&error.status===400)return json({error:error.message},400);
     if(!context.business?.trim())return json({needsContext:true,message:'We could not read that website. Add factual business details to build the world without guessing.'});
    }
   }
   ensureActive();
   if(dailyLimitsEnforced()){
    const client=await hash(service+':'+(req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown'));
    const {data:allowed,error:limitError}=await db.rpc('reserve_brick_generation',{client_key:client});
    if(limitError)throw new Failure(503,'Concept generation is temporarily unavailable.');
    if(!allowed)throw new Failure(429,'Today’s concept limit has been reached. Try again tomorrow.');
   }
   const mode=context.mode||'mechanical';
   const userDirection={brand:request.brand,context,websiteEvidence:website,sourceWorld:sourceWorld?{id:request.sourceWorldId,brand:sourceRow!.brand,title:sourceRow!.title,...sourceWorld}:null,selectedElements,heroElementId:request.heroElementId||null};
   const text=await ai('chat/completions',{model:Deno.env.get('BRICK_TEXT_MODEL')||'google/gemini-3-flash-preview',messages:[{role:'system',content:(request.stage==='world'?CANVAS_WORLD_PROMPT:CANVAS_PHYSICAL_PROMPT)+'\nValidated mode: '+mode},{role:'user',content:JSON.stringify(userDirection)}],response_format:{type:'json_object'},max_tokens:6500});
   ensureActive();
   let output;try{output=JSON.parse(text.choices?.[0]?.message?.content||'');}catch{throw new Failure(502,'The world could not be completed. Please retry with your saved brief.');}
   if(output?.needsContext===true)return json({needsContext:true,message:'Add a little more factual detail about what the business does before generating this world.'});
   const design=parseCanvasDesign(output);
   // Never allow a generated response to rewrite the customer's selection metadata.
   if(selectedElements)design.worldElements=selectedElements;
   const manifest:CanvasManifest={contractVersion:CANVAS_CONTRACT_VERSION,stage:request.stage,story:design.story,design:design.design,context,worldElements:design.worldElements,...(request.stage==='physical'?{sourceWorldId:request.sourceWorldId,selectedElementIds:request.selectedElementIds,heroElementId:request.heroElementId,replacements:request.replacements||[]}: {})};
   const serializedManifest=serializeCanvasManifest(manifest);
   const result=await ai('images/generations',{model:Deno.env.get('BRICK_IMAGE_MODEL')||'openai/gpt-image-2',prompt:canvasImagePrompt(request.stage,mode)+'\nApproved design JSON:\n'+JSON.stringify(design)+'\nOriginal customer direction and source world JSON (exactWording remains authoritative):\n'+JSON.stringify(userDirection),n:1,size:'1024x1024'});
   ensureActive();
   const b64=result.data?.[0]?.b64_json;
   if(typeof b64!=='string'||b64.length>14000000)throw new Failure(502,'The image could not be completed. Please retry.');
   const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
   const mime=bytes[0]===137&&bytes[1]===80?'image/png':bytes[0]===255&&bytes[1]===216?'image/jpeg':String.fromCharCode(...bytes.slice(8,12))==='WEBP'?'image/webp':null;
   if(!mime)throw new Failure(502,'The generator returned an unsupported image. Please retry.');
   const id=crypto.randomUUID();const imagePath=id+'.'+mime.split('/')[1];
   const {error:uploadError}=await db.storage.from('brick-concepts').upload(imagePath,bytes,{contentType:mime,upsert:false});
   if(uploadError)throw new Failure(503,'Could not save this world. Please retry.');
   if(req.signal.aborted){await db.storage.from('brick-concepts').remove([imagePath]);throw new Failure(499,'The request was cancelled.');}
   // Existing text columns are sufficient. No public-table access, migration or policy change.
   const row={id,cache_key:cacheKey,brand:design.brand,title:design.title,story:serializedManifest,image_path:imagePath,prompt_version:CANVAS_CONTRACT_VERSION,edition:'inside' as const,format:'miniature' as const,interaction:design.interaction,source_url:website?.url||sourceRow?.source_url||'',source_title:website?.title||sourceRow?.source_title||''};
   const {error:saveError}=await db.from('brick_concepts').insert(row);
   if(saveError){
    await db.storage.from('brick-concepts').remove([imagePath]);
    const {data:existing}=await db.from('brick_concepts').select('id,brand,title,story,image_path,edition,format,interaction,source_url,source_title,prompt_version').eq('cache_key',cacheKey).maybeSingle();
    if(existing)return await deliver(existing);
    throw new Failure(503,'Could not save this world. Please retry.');
   }
   return await deliver(row);
  }
  const brand=typeof input.brand==='string'?input.brand.trim():'';
  if(input.context!==undefined && typeof input.context!=='string')return json({error:'The design direction must be text.'},400);
  // Preserve exact wording and whitespace; the versioned context limit must never silently truncate.
  const context=typeof input.context==='string'?input.context:'';
  const contextLimit=coCreation?MAX_CONTEXT_CHARS:LEGACY_MAX_CONTEXT_CHARS;
  if(brand.length<2||brand.length>300||context.length>contextLimit)return json({error:`Enter a website or brand identifier (2–300 characters) and a brief up to ${contextLimit} characters.`},400);
  if(coCreation&&!isCoCreationContext(context))return json({error:'Use a valid structured co-creation brief with text fields.'},400);
  const mode=parseConceptMode(context);
  if(!mode)return json({error:'Choose mechanical or electronic concept mode.'},400);
  if(mode==='electronic'&&(selection!.edition!=='inside'||selection!.format!=='miniature'))return json({error:'Electronic story-scene studies require the Inside edition and Miniature format.'},400);
  const direction=modeDesignDirection(mode,designDirection(selection!));
  let websiteUrl: string;
  if(brand==='no-website'&&input.summaryOnly===true&&!input.inspectWebsite) websiteUrl='';
  else try { websiteUrl=validatePublicWebsiteUrl(brand).href; } catch(error) { return json({error:error instanceof Error?error.message:'Enter a public company website.'},400); }
  if(!input.inspectWebsite&&(!key||!enabled))throw new Failure(503,'Live generation is not available yet. Please try again later.');
  const cacheKey=await hash(JSON.stringify([PROMPT_VERSION,input.contractVersion||'legacy',websiteUrl,context,Boolean(input.summaryOnly),selection!.edition,selection!.format]));
  const {data:cached,error:cacheError}=await db.from('brick_concepts').select('id,brand,title,story,image_path,edition,format,interaction,source_url,source_title,prompt_version').eq('cache_key',cacheKey).maybeSingle();
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
  if(input.summaryOnly===true && !context.trim())return json({needsContext:true,message:'Tell us what your business does so we can start with your story.'});
  try { if(input.summaryOnly!==true)website=await readCompanyWebsite(websiteUrl); }
  catch(error) {
   // Inspection reports the real, bounded failure reason and never fabricates
   // evidence or invokes generation. Client copy comes from stable safe codes.
   if(input.inspectWebsite===true) {
    const code=error instanceof WebsiteReadError?error.code:'unreadable';
    return json({website:null,verified:false,code,message:websiteReadMessage(code)},error instanceof WebsiteReadError?error.status:422);
   }
   if(error instanceof WebsiteReadError && error.status===400)return json({error:error.message},400);
   if(!context.trim())return json({needsContext:true,message:'We could not read that public website. Add a short business summary so we can create an accurate concept without guessing.'});
  }
  if(input.inspectWebsite===true)return json({website,verified:Boolean(website),verification:website?'Website text fetched without AI generation.':'Website could not be read; no AI generation was attempted.'});
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
   const {data:existing}=await db.from('brick_concepts').select('id,brand,title,story,image_path,edition,format,interaction,source_url,source_title,prompt_version').eq('cache_key',cacheKey).maybeSingle();
   if(existing)return await deliver(existing);
   throw new Failure(503,'Could not save this concept. Please retry.');
  }
  return await deliver(row);
 }catch(e){if(req.signal.aborted)return json({error:'The request was cancelled.'},499);return json({error:e instanceof Failure||e instanceof CanvasFailure?e.message:'The concept could not be completed. Please try again.'},e instanceof Failure||e instanceof CanvasFailure?e.status:503);}
}
Deno.serve(handleRequest);
