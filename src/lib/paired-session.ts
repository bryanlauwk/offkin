import { isPairedConcept, type FrozenPairedDesign, type PairedConcept, type StoryLens } from '../../supabase/functions/generate-concept/paired-design';
export const PAIRED_SESSION_KEY='offkin:paired:v1';
export type PairedSession={schema:1;brand:string;website:string;business:string;lens:StoryLens;manifest?:FrozenPairedDesign;collectibleId?:string;storyCardId?:string};
export function savePairedSession(value:PairedSession){try{localStorage.setItem(PAIRED_SESSION_KEY,JSON.stringify(value));return true;}catch{return false;}}
export function loadPairedSession():PairedSession|null{try{const raw=localStorage.getItem(PAIRED_SESSION_KEY);if(!raw||raw.length>60000)return null;const v=JSON.parse(raw);return v?.schema===1&&typeof v.brand==='string'&&typeof v.website==='string'&&typeof v.business==='string'&&['signature-product','signature-action','brand-belief'].includes(v.lens)?v:null;}catch{return null;}}
export function savePairedSnapshot(asset:PairedConcept){try{if(!isPairedConcept(asset))return false;localStorage.setItem(`offkin:paired-asset:${asset.id}`,JSON.stringify({...asset,image:''}));return true;}catch{return false;}}
