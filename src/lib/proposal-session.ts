import { isConstructionIntent, type ConstructionIntent } from '../../supabase/functions/generate-concept/construction-intent';
import { productPlanText, productPlanInteraction } from '../../supabase/functions/generate-concept/product-plan';
import { isCanvasContext, isConceptId } from '../../supabase/functions/generate-concept/canvas';
import { isCustomerIdentity, isProposalConcept, type CustomerIdentity } from '../../supabase/functions/generate-concept/proposal';
import { PROPOSAL_STAGES, type ProposalConcept, type ProposalStage, type ProposalRequest } from './proposal-api';
import { normalizeCompanyWebsite } from './company-website';
import { newVersion } from './canvas-session';
export const PROPOSAL_SESSION_KEY = 'offkin:proposal:v10';
export type ProposalAssets = Partial<Record<ProposalStage, ProposalConcept>>;
export type AssetIds = Partial<Record<ProposalStage, string>>;
export type ProposalScope = 'world' | 'physical' | 'packaging';
export type ProposalVersion = { customerIdentity?: CustomerIdentity; constructionIntent?: ConstructionIntent; id: string; context: ProposalConcept['context']; website: string; assets: AssetIds; selected: string[]; hero: string; replacements: NonNullable<ProposalRequest['replacements']> };
export type PendingProposal = ProposalVersion & { scope: ProposalScope; previous: AssetIds; instruction: string };
export type ProposalSession = { customerIdentity?: CustomerIdentity; constructionIntent?: ConstructionIntent; schema: 10; id: string; website: string; context: ProposalConcept['context']; accepted: ProposalVersion | null; pending: PendingProposal | null; turns: { role:'user'|'assistant'; text:string }[] };
// Unspecified interaction must not contradict a physical action in the business story.
// Explicit user choices, including Display only, remain in the saved context.
export const emptyProposalSession = (): ProposalSession => ({schema:10,id:newVersion(),website:'',context:{business:'',angle:'The world we bring together',audience:'Clients & partners',exactWording:'',brandIdentifiers:'',style:'Rich layered collectible world with a distinctive silhouette, expressive details and connected brand storytelling',interaction:'',scale:'Let the story decide'},accepted:null,pending:null,turns:[]});
const record = (v:unknown):v is Record<string,unknown> => Boolean(v && typeof v === 'object' && !Array.isArray(v));
const keys = (v:Record<string,unknown>,allowed:string[]) => Object.keys(v).every(k=>allowed.includes(k));
const text = (v:unknown,max:number):v is string => typeof v==='string' && v.length<=max;
function validIds(v:unknown):v is AssetIds { return record(v) && keys(v,[...PROPOSAL_STAGES]) && Object.values(v).every(isConceptId) && new Set(Object.values(v)).size===Object.values(v).length; }
function validVersion(v:unknown,pending=false): boolean {
  if (!record(v) || !keys(v,['id','context','website','assets','selected','hero','replacements','constructionIntent','customerIdentity',...(pending?['scope','previous','instruction']:[])]) || !text(v.id,80) || !v.id || !isCanvasContext(v.context) || !text(v.website,300) || !validIds(v.assets)) return false;
  if (v.customerIdentity !== undefined && !isCustomerIdentity(v.customerIdentity)) return false;
  if (v.constructionIntent !== undefined && !isConstructionIntent(v.constructionIntent)) return false;
  if (!Array.isArray(v.selected) || v.selected.length>16 || !v.selected.every(id=>typeof id==='string' && /^[a-z][a-z0-9-]{0,47}$/.test(id)) || new Set(v.selected).size!==v.selected.length || !text(v.hero,48) || Boolean(v.hero)&&!v.selected.includes(v.hero)) return false;
  if (!Array.isArray(v.replacements) || v.replacements.length>16 || !v.replacements.every(r=>record(r)&&keys(r,['id','label','description'])&&(v.selected as string[]).includes(r.id as string)&&text(r.label,80)&&r.label.trim()&&text(r.description,700)) || new Set(v.replacements.map(r=>r.id)).size!==v.replacements.length) return false;
  if (v.assets.physical&&!v.assets.world || (v.assets.details||v.assets.packaging)&&!v.assets.physical) return false;
  return !pending || ['world','physical','packaging'].includes(String(v.scope)) && validIds(v.previous) && text(v.instruction,2000);
}
export function parseProposalSession(v:unknown):ProposalSession|null {
  if (!record(v)||!keys(v,['schema','id','website','context','accepted','pending','turns','constructionIntent','customerIdentity'])||v.schema!==10||!text(v.id,80)||!v.id||!text(v.website,300)||!isCanvasContext(v.context)||!(v.accepted===null||validVersion(v.accepted))||!(v.pending===null||validVersion(v.pending,true))) return null;
  if (v.customerIdentity !== undefined && !isCustomerIdentity(v.customerIdentity)) return null;
  if (v.constructionIntent !== undefined && !isConstructionIntent(v.constructionIntent)) return null;
  if (!Array.isArray(v.turns)||v.turns.length>30||!v.turns.every(t=>record(t)&&keys(t,['role','text'])&&['user','assistant'].includes(String(t.role))&&text(t.text,2000)))return null;
  if (v.accepted && !PROPOSAL_STAGES.every(s=>Boolean((v.accepted as ProposalVersion).assets[s]))) return null;
  return v as unknown as ProposalSession;
}
export function saveProposalSession(s:ProposalSession):boolean {try{const raw=JSON.stringify(s);if(raw.length>100000||!parseProposalSession(s))return false;localStorage.setItem(PROPOSAL_SESSION_KEY,raw);return true;}catch{return false;}}
export function loadProposalSession():ProposalSession|null {try{const raw=localStorage.getItem(PROPOSAL_SESSION_KEY);return raw&&raw.length<=100000?parseProposalSession(JSON.parse(raw)):null;}catch{return null;}}
export function pendingProposal(session:ProposalSession,scope:ProposalScope,context:ProposalConcept['context'],instruction=''):PendingProposal {
  const previous = session.accepted?.assets || {}; const assets:AssetIds = scope==='packaging'?{world:previous.world,physical:previous.physical,details:previous.details}:scope==='physical'?{world:previous.world}:{};
  for (const stage of PROPOSAL_STAGES) if (!assets[stage]) delete assets[stage];
  // A new world or physical revision needs its own explicit choice. Packaging retains the accepted product.
  const sameContext=Object.keys(context).length===Object.keys(session.context).length&&Object.entries(context).every(([key,value])=>session.context[key]===value);
  const constructionIntent = scope === 'packaging' ? session.accepted?.constructionIntent : !session.accepted && scope === 'world' && sameContext ? session.constructionIntent : undefined;
  // Revisions belong to the accepted customer, never an unrelated editable draft.
  const customerIdentity = session.accepted ? session.accepted.customerIdentity : session.customerIdentity;
  return {...(customerIdentity ? {customerIdentity:{...customerIdentity}} : {}),...(constructionIntent ? {constructionIntent} : {}),id:newVersion(),context:{...context},website:session.website,assets,scope,previous:{...previous},instruction,selected:scope==='world'?[]:[...(session.accepted?.selected||[])],hero:scope==='world'?'':session.accepted?.hero||'',replacements:scope==='world'?[]:[...(session.accepted?.replacements||[])]};
}
/** A user-confirmed packaging-only recovery, never an automatic scope reinterpretation. */
export function confirmedPackagingChange(session:ProposalSession,instruction:string):PendingProposal {
  const accepted=session.accepted;
  if(!accepted||!isComplete(accepted)||session.pending)throw new Error('Open the accepted complete proposal before changing its packaging.');
  if(!instruction.trim()||instruction.length>2000)throw new Error('Describe the packaging change in under 2,000 characters.');
  const context={...accepted.context,revisionNotes:instruction};
  if(!isCanvasContext(context))throw new Error('This packaging direction is too long. Shorten the change; your wording has not been truncated.');
  return pendingProposal({...session,website:accepted.website},'packaging',context,instruction);
}
export function isComplete(version:ProposalVersion|null):boolean {return Boolean(version && PROPOSAL_STAGES.every(stage=>version.assets[stage]));}
function matchesCustomerIdentity(expected:CustomerIdentity|undefined,asset:ProposalConcept):boolean {
  return !expected || asset.customerIdentity?.version===expected.version && asset.customerIdentity?.name===expected.name && asset.brand===expected.name;
}
export function addProposalAsset(version:PendingProposal,asset:ProposalConcept):PendingProposal {
  if (!matchesCustomerIdentity(version.customerIdentity,asset)) throw new Error('This section belongs to a different customer brand. Your accepted version is unchanged.');
  if (asset.stage!=='world' && asset.sourceWorldId!==version.assets.world || ['details','packaging'].includes(asset.stage) && asset.sourcePhysicalId!==version.assets.physical) throw new Error('This section belongs to a different proposal.');
  return {...version,assets:{...version.assets,[asset.stage]:asset.id},...(asset.stage==='world'?{selected:asset.worldElements.map(e=>e.id),hero:asset.worldElements[0]?.id||'',replacements:[]}: {})};
}
export function assetsForVersion(version:ProposalVersion|null,all:Record<string,ProposalConcept>):ProposalAssets {
  const result:ProposalAssets={}; if(!version)return result;
  for(const stage of PROPOSAL_STAGES){const asset=all[version.assets[stage]||''];if(asset?.stage===stage&&matchesCustomerIdentity(version.customerIdentity,asset)&&(stage==='world'||asset.sourceWorldId===version.assets.world)&&(!['details','packaging'].includes(stage)||asset.sourcePhysicalId===version.assets.physical)) result[stage]=asset;}
  return result;
}
export function proposalBrand(website:string):string {if(!website.trim())return 'no-website';const url=normalizeCompanyWebsite(website);if(!url)throw new Error('Check the public website address or leave it empty.');return url;}
export function requestForStage(version:PendingProposal,stage:ProposalStage):ProposalRequest {
  const body:ProposalRequest={...(version.customerIdentity?{customerIdentity:{...version.customerIdentity}}:{}),contractVersion:'offkin-proposal-v10',stage,brand:proposalBrand(version.website),context:version.context,...(version.previous[stage]?{previousAssetId:version.previous[stage]}:{})};
  if (stage==='world'&&!isCustomerIdentity(version.customerIdentity)) throw new Error('Enter the exact brand name before generating your proposal.');
  if(stage!=='world')body.sourceWorldId=version.assets.world;
  if(stage==='physical'){body.selectedElementIds=version.selected;body.heroElementId=version.hero;body.replacements=version.replacements;}
  if(stage==='details'||stage==='packaging')body.sourcePhysicalId=version.assets.physical;
  return body;
}
export function saveProposalSnapshot(c:ProposalConcept):boolean {try{if(!isProposalConcept(c))return false;localStorage.setItem(`offkin:proposal-asset:${c.id}`,JSON.stringify({...c,image:''}));return true;}catch{return false;}}
export function loadProposalSnapshot(id:string):ProposalConcept|null {try{const raw=localStorage.getItem(`offkin:proposal-asset:${id}`);if(!raw||raw.length>60000)return null;const v=JSON.parse(raw);return v.id===id&&v.image===''&&isProposalConcept({...v,image:'https://metadata.invalid/image.png'})?v:null;}catch{return null;}}
export function addTurn(s:ProposalSession,role:'user'|'assistant',text:string):ProposalSession {return {...s,turns:[...s.turns,{role,text}].slice(-30)};}
const SHARE_LIMIT=28000;
/** A bounded current-text snapshot, with image capability IDs only after separate opt-in. */
export function encodeProposalShare(s:ProposalSession,includeImages=false):string {
  const customerIdentity=s.customerIdentity||s.accepted?.customerIdentity||s.pending?.customerIdentity;
  const copy:ProposalSession={...(customerIdentity?{customerIdentity:{...customerIdentity}}:{}),schema:10,id:newVersion(),website:s.website,context:s.context,accepted:includeImages?s.accepted:null,pending:null,turns:[]};
  if(includeImages&&!isComplete(s.accepted))throw new Error('Complete the proposal before sharing its images.');
  if(!parseProposalSession(copy))throw new Error('This proposal cannot be shared safely.');
  const bytes=new TextEncoder().encode(JSON.stringify(copy));const hash='#proposal='+btoa(Array.from(bytes,b=>String.fromCharCode(b)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  if(hash.length>SHARE_LIMIT)throw new Error('This proposal is too long for a reliable link. Download the brief instead.');return hash;
}
export function decodeProposalShare(hash:string):ProposalSession|null {try{if(!hash.startsWith('#proposal=')||hash.length>SHARE_LIMIT)return null;const raw=hash.slice(10);if(!/^[A-Za-z0-9_-]+$/.test(raw))return null;const parsed=parseProposalSession(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(raw.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)))));if(!parsed)return null;const {constructionIntent:_choice,...branch}=parsed;if(branch.pending){const {constructionIntent:_pendingChoice,...pending}=branch.pending;branch.pending=pending;}return branch;}catch{return null;}}
export function proposalBrief(s:ProposalSession,all:Record<string,ProposalConcept>):string {
  const v=s.accepted||s.pending;const planSource=all[v?.assets.physical||'']||all[v?.assets.world||''];return ['OFFKIN｜异趣伙伴 — Concept preview / build proposal draft',`Version: ${v?.id||s.id}`,`Exact brand name: ${JSON.stringify(s.customerIdentity?.name||v?.customerIdentity?.name||'Not supplied')}`,`Website: ${s.website||'Not supplied'}`,...Object.entries(s.context).map(([k,value])=>`${k}: ${k==='exactWording'?JSON.stringify(value):value}`),s.pending&&s.accepted?'A revised proposal is unfinished. Assets below are the previous accepted version.':'',...PROPOSAL_STAGES.map(stage=>{const asset=all[v?.assets[stage]||''];return `${stage.toUpperCase()}: ${asset?`${asset.title}\n${asset.story}\n${asset.productPlan ? productPlanInteraction(asset.productPlan) : asset.interaction}`:v?.assets[stage]?'Saved section; restore its narrative':'Not generated'}`;}),planSource?.productPlan ? (planSource.stage==='world'?'Preliminary product plan; the physical hero is not available here yet.\n\n':'')+productPlanText(planSource.productPlan) : 'Creative concept preview. Construction has not been assessed; no part-count limit or engineered mechanism is implied by the imagery.', 'Concept preview. Final design, functionality and pricing confirmed during the build proposal. Any saved legacy construction plan remains unverified; images are not CAD, validated fits or working prototypes.','Build proposal: assess scope, part counts, materials, scale, tolerances, mechanisms, cost and a realistic production route. Engineering, prototypes and production follow a separately agreed proposal.','Recipient / submission destination: not set. This brief has not been sent. No purchase or manufacturing order has been placed.'].filter(Boolean).join('\n\n');
}
