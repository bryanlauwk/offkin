import type { CanvasContext, CanvasConcept } from './canvas-api';
import { isCanvasConcept } from '../../supabase/functions/generate-concept/canvas';
import { normalizeCompanyWebsite } from './company-website';

export const CANVAS_SESSION_KEY = 'offkin:canvas:v1';
export const MAX_SHARE_CHARS = 18000;
export const MAX_SESSION_CHARS = 30000;
export type CanvasBrief = {
  website: string; business: string; angle: string; audience: string; exactWording: string;
  brandIdentifiers: string; style: string; interaction: string; notes: string;
};
export type ElementReplacement = { id: string; label: string; description: string };
export type SharedWorld = { title:string; story:string; worldElements:{id:string;label:string;description:string;kind:'fact'|'proposal'}[] };
export type CanvasSession = {
  sharedWorld?: SharedWorld;
  schema: 1; version: string; parentVersion: string; referenceId: 'airbnb' | 'a24' | 'tesla';
  brief: CanvasBrief; selected: string[]; hero: string; replacements: ElementReplacement[];
  worldId: string; physicalId: string; worldFingerprint: string; physicalFingerprint: string;
  prototype: { quantity: string; budget: string; purpose: string };
};
export const newVersion = () => typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
export function emptyCanvasSession(): CanvasSession {
  return { schema: 1, version: newVersion(), parentVersion: '', referenceId: 'airbnb',
    brief: { website: '', business: '', angle: 'The world we bring together', audience: 'Clients & partners', exactWording: '', brandIdentifiers: '', style: 'Rich illustrated world', interaction: 'Turn to reveal', notes: '' },
    selected: ['airbnb-belo','airbnb-homes','airbnb-community','airbnb-travel','airbnb-explore'], hero: 'airbnb-belo', replacements: [], worldId: '', physicalId: '', worldFingerprint: '', physicalFingerprint: '',
    prototype: { quantity: '', budget: '', purpose: '' } };
}
const limits: Record<keyof CanvasBrief, number> = { website:300, business:1000, angle:120, audience:120, exactWording:200, brandIdentifiers:500, style:120, interaction:120, notes:1000 };
const record = (v: unknown): v is Record<string, unknown> => Boolean(v && typeof v === 'object' && !Array.isArray(v));
const text = (v: unknown, n: number): v is string => typeof v === 'string' && v.length <= n;
const id = (v: unknown) => text(v,80) && /^[a-zA-Z0-9_-]*$/.test(v);
const uuid = (v: unknown) => v === '' || (typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v));
const exactKeys = (v: Record<string,unknown>, keys: string[]) => Object.keys(v).length === keys.length && keys.every(k => Object.prototype.hasOwnProperty.call(v,k));
export function parseCanvasSession(value: unknown): CanvasSession | null {
  if (!record(value)) return null;
  const required=['schema','version','parentVersion','referenceId','brief','selected','hero','replacements','worldId','physicalId','worldFingerprint','physicalFingerprint','prototype'];
  if(!exactKeys(value,required)&&!exactKeys(value,[...required,'sharedWorld']))return null;
  if(value.sharedWorld!==undefined && (!record(value.sharedWorld)||!exactKeys(value.sharedWorld,['title','story','worldElements'])||!text(value.sharedWorld.title,100)||!text(value.sharedWorld.story,2000)||!Array.isArray(value.sharedWorld.worldElements)||value.sharedWorld.worldElements.length>16||!value.sharedWorld.worldElements.every(e=>record(e)&&exactKeys(e,['id','label','description','kind'])&&id(e.id)&&Boolean(e.id)&&text(e.label,80)&&Boolean((e.label as string).trim())&&text(e.description,700)&&['fact','proposal'].includes(e.kind as string))))return null;
  if(record(value.sharedWorld)&&Array.isArray(value.sharedWorld.worldElements)&&new Set(value.sharedWorld.worldElements.map(e=>e.id)).size!==value.sharedWorld.worldElements.length)return null;
  if (value.schema !== 1 || !id(value.version) || !value.version || !id(value.parentVersion) || !['airbnb','a24','tesla'].includes(value.referenceId as string)) return null;
  if (!record(value.brief) || !exactKeys(value.brief,Object.keys(limits)) || !Object.entries(limits).every(([key,limit]) => text(value.brief[key],limit))) return null;
  if (!Array.isArray(value.selected) || value.selected.length > 16 || !value.selected.every(v=>id(v)&&v) || new Set(value.selected).size !== value.selected.length || !id(value.hero) || (value.hero && !value.selected.includes(value.hero))) return null;
  if (!Array.isArray(value.replacements) || value.replacements.length > 16 || !value.replacements.every(v => record(v) && exactKeys(v,['id','label','description']) && id(v.id) && (value.selected as string[]).includes(v.id as string) && text(v.label,80) && Boolean(v.label.trim()) && text(v.description,300)) || new Set(value.replacements.map(v=>v.id)).size !== value.replacements.length) return null;
  if (!uuid(value.worldId) || !uuid(value.physicalId) || !text(value.worldFingerprint,6000) || !text(value.physicalFingerprint,10000)) return null;
  if (!record(value.prototype) || !exactKeys(value.prototype,['quantity','budget','purpose']) || !text(value.prototype.quantity,40) || !text(value.prototype.budget,80) || !text(value.prototype.purpose,300)) return null;
  return value as unknown as CanvasSession;
}
export function saveCanvasSession(session: CanvasSession): boolean {
  try { const text=JSON.stringify(session); if (text.length>MAX_SESSION_CHARS || !parseCanvasSession(session)) return false; localStorage.setItem(CANVAS_SESSION_KEY,text); return true; } catch { return false; }
}
export function loadCanvasSession(): CanvasSession | null {
  try { const raw=localStorage.getItem(CANVAS_SESSION_KEY); return raw && raw.length<=MAX_SESSION_CHARS ? parseCanvasSession(JSON.parse(raw)) : null; } catch { return null; }
}
export function canvasContext(brief: CanvasBrief): CanvasContext {
  return { business: brief.business, angle: brief.angle, audience: brief.audience, exactWording: brief.exactWording, brandIdentifiers: brief.brandIdentifiers, style: brief.style, interaction: brief.interaction, revisionNotes: brief.notes, mode:'mechanical', scale:'Let the story decide' };
}
export const worldFingerprint = (session: CanvasSession) => { const { interaction: _interaction, revisionNotes: _notes, ...story } = canvasContext(session.brief); return JSON.stringify([session.brief.website ? normalizeCompanyWebsite(session.brief.website) || session.brief.website : '',story]); };
export const physicalFingerprint = (session: CanvasSession) => JSON.stringify([session.worldId,canvasContext(session.brief),session.selected,session.hero,session.replacements]);
export function encodeCanvasShare(session: CanvasSession, options: { includeGenerated?:boolean; sharedWorld?:SharedWorld } = {}): string {
  if (!parseCanvasSession(session)) throw new Error('Please check this version before sharing.');
  // Generation fingerprints duplicate private text and are not needed by another device.
  const clean={...session,...(!options.includeGenerated?{worldId:'',physicalId:''}:{}),worldFingerprint:options.includeGenerated&&session.worldId&&session.worldFingerprint&&session.worldFingerprint!==worldFingerprint(session)?'stale':'',physicalFingerprint:'',...(options.sharedWorld?{sharedWorld:options.sharedWorld}:{})};
  if(!parseCanvasSession(clean))throw new Error('The reviewed story metadata cannot be shared safely. Download the brief instead.');
  const bytes=new TextEncoder().encode(JSON.stringify(clean));
  const hash='#world='+btoa(Array.from(bytes,byte=>String.fromCharCode(byte)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  if(hash.length>MAX_SHARE_CHARS) throw new Error('This version is too long for a reliable link. Download the brief instead.');
  return hash;
}
export function decodeCanvasShare(hash: string): CanvasSession | null {
  if (!hash.startsWith('#world=') || hash.length>MAX_SHARE_CHARS) return null;
  try { const encoded=hash.slice(7); if (!/^[A-Za-z0-9_-]+$/.test(encoded)) return null; const bytes=Uint8Array.from(atob(encoded.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)); return parseCanvasSession(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))); } catch { return null; }
}
export function branchCanvasSession(session: CanvasSession): CanvasSession { return {...session,parentVersion:session.version,version:newVersion(),worldFingerprint:session.worldFingerprint==='stale'?'stale':'',physicalFingerprint:''}; }
export function makeCanvasBrief(session: CanvasSession, world: { title:string;story:string;worldElements:{id:string;label:string;description:string;kind:string}[] }, physicalTitle?:string): string {
  return ['OFFKIN｜异趣伙伴 — Co-creation / prototype brief',`Version: ${session.version}`,session.parentVersion?`Branched from: ${session.parentVersion}`:'Private local direction',
    `Business: ${session.brief.business||'Not supplied'}`,`Website: ${session.brief.website||'Not supplied'}`,`Story lens: ${session.brief.angle}`,`Audience: ${session.brief.audience}`,`Brand identifiers: ${session.brief.brandIdentifiers||'To confirm'}`,`Visual direction: ${session.brief.style}`,`Exact wording (verbatim JSON): ${JSON.stringify(session.brief.exactWording)}`,`World: ${world.title}\n${world.story}`,
    'Selected story elements:',...world.worldElements.filter(e=>session.selected.includes(e.id)).map(e=>{ const r=session.replacements.find(r=>r.id===e.id); return `${e.id===session.hero?'HERO · ':''}${r?.label||e.label}: ${r?.description||e.description} (${r?'proposed replacement':e.kind})`; }),
    `Preferred physical interaction: ${session.brief.interaction}`,`Direction notes: ${session.brief.notes||'None'}`,`Physical concept: ${physicalTitle||'Not generated'}${physicalTitle && session.physicalFingerprint!==physicalFingerprint(session)?' (previous version; not updated to match the current direction)':''}`,`Planning quantity: ${session.prototype.quantity||'To be scoped'}`,`Exploratory budget: ${session.prototype.budget||'To be scoped'}`,`Purpose: ${session.prototype.purpose||'To be scoped'}`,
    'Online co-creation explores a rich, connected brand world. Selected elements and story guide the physical concept; this is not a manufactured product or a technical validation.',
    'Next, an offline paid design engagement scopes the final design, a physical prototype and production. That review resolves budget, simplification, materials, tolerances and manufacturing difficulty. The story determines scale; one or two meaningful mechanical motions may be explored. Reusable internals do not require identical outer worlds.',
    'RM100–500 is an exploratory range, not a quote, guaranteed price or mandatory limit. Design, prototyping and production are scoped and quoted separately.',
    'Recipient / submission destination: not set. This file has not been sent. No purchase, production booking or order has been placed. Brand artwork, wording and permissions need review before commercial use.'
  ].filter(Boolean).join('\n\n');
}

const snapshotKey = (id: string) => `offkin:canvas-image-metadata:${id}`;
/** Keep bounded narrative metadata locally; signed image access never enters a share link or this snapshot. */
export function saveCanvasSnapshot(concept: CanvasConcept): boolean {
  try { if (!isCanvasConcept(concept)) return false; const snapshot={...concept,image:''}; const raw=JSON.stringify(snapshot); if(raw.length>45000)return false; localStorage.setItem(snapshotKey(concept.id),raw);return true; }catch{return false;}
}
export function loadCanvasSnapshot(id: string): CanvasConcept | null {
  if(!uuid(id)||!id)return null;
  try { const raw=localStorage.getItem(snapshotKey(id));if(!raw||raw.length>45000)return null;const value=JSON.parse(raw);if(!record(value)||value.image!==''||value.id!==id||!isCanvasConcept({...value,image:'https://metadata.invalid/image.png'}))return null;return value as unknown as CanvasConcept; }catch{return null;}
}
