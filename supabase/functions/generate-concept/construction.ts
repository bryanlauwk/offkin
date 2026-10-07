import { isBriefConstructionOrigin, type BriefConstructionOrigin } from './brief-construction.ts';
import { CanvasFailure, isCanvasContext, isWorldElements, type CanvasContext, type CanvasReplacement, type WorldElement } from './canvas.ts';
import { parseProductPlan, type ProductPlan } from './product-plan.ts';

/** Development-only compiler candidate. No endpoint enables it by default. All physics remains unverified. */
export const CONSTRUCTION_VERSION = 'construction-choice-v1';
export const CONSTRUCTION_COMPILER_VERSION = 'construction-compiler-v1';
export const CONSTRUCTION_TEMPLATE = 'press-reveal-v1';
/** Exact supported input, not a keyword classifier or inferred permission. */
export const CONSTRUCTION_INTERACTION = 'Press the hero to reveal a marker; lift manually to reset.';
export const CONSTRUCTION_ROLES = ['body', 'actuator', 'retainer', 'form-a', 'form-b', 'form-c', 'form-d'] as const;
export type ConstructionRole = typeof CONSTRUCTION_ROLES[number];
export type ConstructionChoice = { version: typeof CONSTRUCTION_VERSION; templateId: typeof CONSTRUCTION_TEMPLATE; appearances: { role: ConstructionRole; appearanceId: string }[] };
export type ConstructionAppearance = { id: string; name: string; form: string; finish: string };
/** Authored server input, not a client/model 'reviewed' flag. Entire exact source is bound. */
export type ConstructionBinding = {
  version: 'construction-binding-v1'; action: 'press-reveal-manual-reset';
  source: { context: CanvasContext; elements: WorldElement[]; heroElementId: string; replacements: CanvasReplacement[] };
  creative: { brand: string; title: string; intent: string; silhouette: string; story: string; scaleDirection: string;
    roles: { role: ConstructionRole; storyElementIds: string[]; appearances: ConstructionAppearance[] }[] };
};
export type AuthoredConstructionOrigin = {
  version: 'construction-origin-v1'; kind: 'authored-template'; evidence: 'unverified-design-proposal';
  compilerVersion: string; compilerDigest: string; templateId: string; templateRevision: string;
  templateDigest: string; sourceDigest: string; creativeDigest: string; planDigest: string; choice: Omit<ConstructionChoice, 'templateId'> & { templateId: string };
};
export type ConstructionOrigin = AuthoredConstructionOrigin | BriefConstructionOrigin;
export const CONSTRUCTION_CLARIFICATION = 'This construction direction is not supported by the local press/reveal candidate. Its proposed action uses direct sliding and manual reset. Keep the current brief, or explicitly choose a compatible action and design before generating images. No image was generated.';
export class ConstructionClarification extends CanvasFailure {
  constructor(message = CONSTRUCTION_CLARIFICATION) { super(422, message); }
}
const object = (v: unknown, keys: readonly string[]): v is Record<string, unknown> => {
  if (!v || typeof v !== 'object' || Array.isArray(v) || ![Object.prototype, null].includes(Object.getPrototypeOf(v))) return false;
  const own = Reflect.ownKeys(v);
  return own.length === keys.length && own.every(k => typeof k === 'string' && keys.includes(k) && Object.getOwnPropertyDescriptor(v, k)?.enumerable && 'value' in Object.getOwnPropertyDescriptor(v, k)!);
};
const array = (v: unknown, min: number, max: number): v is unknown[] => Array.isArray(v) && v.length >= min && v.length <= max && Reflect.ownKeys(v).length === v.length + 1;
const text = (v: unknown, max: number): v is string => typeof v === 'string' && Boolean(v.trim()) && v.length <= max;
const slug = (v: unknown): v is string => typeof v === 'string' && /^[a-z][a-z0-9-]{0,47}$/.test(v);
const unique = (v: readonly unknown[]) => new Set(v).size === v.length;
const equalSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && unique(a) && a.every(x => b.includes(x));
export function constructionCanonical(value: unknown): string {
  const ordered = (v: unknown): unknown => Array.isArray(v) ? v.map(ordered) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, ordered((v as Record<string, unknown>)[k])])) : v;
  return JSON.stringify(ordered(value));
}
function refuse(): never { throw new ConstructionClarification(); }
const interfaces: Record<ConstructionRole, string> = {
  body: 'Support body with an open translating guide, reveal window, rear closure seat and three named sculptural seats. Geometry and access remain unresolved.',
  actuator: 'One rigid pressing form, stem and reveal marker; direct down-translation in the body guide; manual upward reset. No automatic return.',
  retainer: 'Rear guide closure locating on the body and capturing the translating actuator without obstructing its proposed travel.',
  'form-a': 'Static sculptural form at body seat A, including the authored mating seat for form B.',
  'form-b': 'Static sculptural form located in form A\'s seat; no rolling or independent motion.',
  'form-c': 'Static sculptural form at the body\'s named seat C.',
  'form-d': 'Static sculptural form at the body\'s named seat D.',
};
type Operation = { id: string; partIds: ConstructionRole[]; joins: string[]; requires: string[]; removes: string[]; adds: string[]; instruction: string };
const joins: ProductPlan['joins'] = [
  { id:'translation-guide', partIds:['body','actuator'], method:'Proposed translating guide', rationale:'Locate one direct-moving actuator and integral reveal marker.', validation:{status:'unverified',check:'Resolve guide, window, travel, friction and fit in CAD and physical samples.'} },
  { id:'closure-seat', partIds:['body','retainer'], method:'Proposed rear closure seat', rationale:'Allow actuator insertion before closing its guide.', validation:{status:'unverified',check:'Review assembly access, closure fit and retention.'} },
  { id:'sliding-capture', partIds:['actuator','retainer'], method:'Proposed sliding capture contact', rationale:'Bound actuator escape without obstructing direct travel.', validation:{status:'unverified',check:'Prototype capture, travel limits, pinch safety and manual reset.'} },
  { id:'form-a-seat', partIds:['body','form-a'], method:'Proposed named seat A', rationale:'Locate the authored static form on the support body.', validation:{status:'unverified',check:'Check installation access, fit, stability and proposed retention.'} },
  { id:'form-b-seat', partIds:['form-a','form-b'], method:'Proposed form B seat', rationale:'Locate the secondary sculptural form on form A.', validation:{status:'unverified',check:'Check mating geometry, installation access and retention.'} },
  { id:'form-c-seat', partIds:['body','form-c'], method:'Proposed named seat C', rationale:'Locate this separate authored static form.', validation:{status:'unverified',check:'Check socket access, detail dimensions and retention.'} },
  { id:'form-d-seat', partIds:['body','form-d'], method:'Proposed named seat D', rationale:'Locate this separate authored static form.', validation:{status:'unverified',check:'Check socket access, detail dimensions and retention.'} },
];
const operations: Operation[] = [
  {id:'insert-actuator',partIds:['body','actuator'],joins:['translation-guide'],requires:['guide-open'],removes:[],adds:['actuator-inserted'],instruction:'With the rear guide open, trial-insert the rigid actuator and marker into the body. Review intended window alignment and travel before claiming operation.'},
  {id:'close-guide',partIds:['body','actuator','retainer'],joins:['closure-seat','sliding-capture'],requires:['guide-open','actuator-inserted'],removes:['guide-open'],adds:['hero-installed'],instruction:'Support the inserted actuator and trial-seat the rear closure. Review capture, access, direct down-travel and manual upward reset on a prototype.'},
  {id:'locate-form-a',partIds:['body','form-a'],joins:['form-a-seat'],requires:['hero-installed'],removes:[],adds:['form-a-installed'],instruction:'Trial-locate form A in body seat A after the actuator subassembly. Review access and proposed retention on a sample.'},
  {id:'locate-form-b',partIds:['form-a','form-b'],joins:['form-b-seat'],requires:['form-a-installed'],removes:[],adds:['form-b-installed'],instruction:'Trial-locate the static form B in its authored seat on form A. Check fit and proposed retention.'},
  {id:'locate-form-c',partIds:['body','form-c'],joins:['form-c-seat'],requires:['form-a-installed'],removes:[],adds:['form-c-installed'],instruction:'Trial-seat form C in body seat C, checking installation access and proposed retention.'},
  {id:'locate-form-d',partIds:['body','form-d'],joins:['form-d-seat'],requires:['form-a-installed'],removes:[],adds:['form-d-installed'],instruction:'Trial-seat form D in body seat D, checking installation access and proposed retention.'},
];
const action: ProductPlan['actions'][number] = { action:'Press the hero downward; lift it manually to reset', response:'Proposed direct translation reveals the integral marker through the body window; lifting the hero hides it again.', partIds:['body','actuator','retainer'], validation:{status:'unverified',check:'CAD and interaction samples must establish reveal visibility, force, fit, travel stops, retention, pinch safety, durability and manual reset.'} };
/** Fingerprint all authored semantics plus an explicit compiler revision; bump revision for algorithm changes. */
export const CONSTRUCTION_SEMANTICS = constructionCanonical({ compilerVersion:CONSTRUCTION_COMPILER_VERSION, templateId:CONSTRUCTION_TEMPLATE, templateRevision:'1', roles:CONSTRUCTION_ROLES, interfaces, joins, operations, action, renderContract:'compiler-functional-only-v1', interaction:CONSTRUCTION_INTERACTION, choiceMaxChars:4096 });
export function assertConstructionBinding(binding: unknown): asserts binding is ConstructionBinding {
  if (!object(binding,['version','action','source','creative']) || binding.version !== 'construction-binding-v1' || binding.action !== 'press-reveal-manual-reset') refuse();
  const { source, creative } = binding;
  if (!object(source,['context','elements','heroElementId','replacements']) || !isCanvasContext(source.context) || source.context.mode === 'electronic' || source.context.interaction !== CONSTRUCTION_INTERACTION || !isWorldElements(source.elements) || !slug(source.heroElementId) || !source.elements.some(e => e.id === source.heroElementId) || !array(source.replacements,0,16)) refuse();
  const elements = source.elements as WorldElement[];
  if (!source.replacements.every(r=>object(r,['id','label','description'])&&slug(r.id)&&text(r.label,80)&&text(r.description,700)&&elements.some(e=>e.id===r.id)) || !unique(source.replacements.map(r=>(r as CanvasReplacement).id))) refuse();
  if (!object(creative,['brand','title','intent','silhouette','story','scaleDirection','roles']) || !text(creative.brand,120) || !text(creative.title,100) || !text(creative.intent,480) || !text(creative.silhouette,480) || !text(creative.story,2000) || !text(creative.scaleDirection,320) || !array(creative.roles,7,7)) refuse();
  for (const item of creative.roles) {
    if (!object(item,['role','storyElementIds','appearances']) || !CONSTRUCTION_ROLES.includes(item.role as ConstructionRole) || !array(item.storyElementIds,0,16) || !item.storyElementIds.every(id=>slug(id)&&elements.some(e=>e.id===id)) || !unique(item.storyElementIds) || !array(item.appearances,1,3)) refuse();
    if (!item.appearances.every(a=>object(a,['id','name','form','finish'])&&slug(a.id)&&text(a.name,80)&&text(a.form,140)&&text(a.finish,180)) || !unique(item.appearances.map(a=>(a as ConstructionAppearance).id))) refuse();
  }
  const roles = creative.roles as ConstructionBinding['creative']['roles'];
  if (!equalSet(roles.map(r=>r.role),CONSTRUCTION_ROLES) || !source.elements.every(e=>roles.some(r=>r.storyElementIds.includes(e.id))) || !roles.find(r=>r.role==='actuator')?.storyElementIds.includes(source.heroElementId)) refuse();
}
export function assertConstructionSource(binding: ConstructionBinding, source: ConstructionBinding['source']): void {
  assertConstructionBinding(binding);
  if (constructionCanonical(binding.source) !== constructionCanonical(source)) refuse();
}
export function parseConstructionChoice(value: unknown): ConstructionChoice {
  if (!object(value,['version','templateId','appearances']) || value.version !== CONSTRUCTION_VERSION || value.templateId !== CONSTRUCTION_TEMPLATE || !array(value.appearances,7,7)) refuse();
  if (!value.appearances.every(p=>object(p,['role','appearanceId'])&&CONSTRUCTION_ROLES.includes(p.role as ConstructionRole)&&slug(p.appearanceId)) || !equalSet(value.appearances.map(p=>(p as ConstructionChoice['appearances'][number]).role),CONSTRUCTION_ROLES) || JSON.stringify(value).length>4096) refuse();
  return value as ConstructionChoice;
}
/** Explicit state/relationship audit, never derive operations from an arbitrary graph. */
function auditOperations(): void {
  const states = new Set(['guide-open']); const covered = new Set<string>();
  for (const op of operations) {
    if (op.requires.some(s=>!states.has(s))) refuse();
    for (const id of op.joins) {
      const join=joins.find(j=>j.id===id);
      if (!join || covered.has(id) || join.partIds.some(p=>!op.partIds.includes(p as ConstructionRole))) refuse();
      covered.add(id);
    }
    op.removes.forEach(s=>states.delete(s)); op.adds.forEach(s=>states.add(s));
  }
  if (covered.size!==joins.length || !['hero-installed','form-a-installed','form-b-installed','form-c-installed','form-d-installed'].every(s=>states.has(s))) refuse();
}
export function compileConstruction(value: unknown, binding: ConstructionBinding): { plan: ProductPlan; choice: ConstructionChoice } {
  assertConstructionBinding(binding); const choice=parseConstructionChoice(value); auditOperations();
  const parts=CONSTRUCTION_ROLES.map(role=>{
    const authored=binding.creative.roles.find(p=>p.role===role)!;
    const chosen=choice.appearances.find(p=>p.role===role)!;
    const appearance=authored.appearances.find(a=>a.id===chosen.appearanceId); if (!appearance) refuse();
    return {id:role,name:appearance.name,storyElementIds:[...authored.storyElementIds],form:`${appearance.form} ${interfaces[role]}`,process:'undecided' as const,printStrategy:'Proposed separate printed part; resolve material, orientation, supports, detail dimensions and mating geometry in CAD and slicer review.',finish:`Proposed appearance: ${appearance.finish} Material and finish compatibility require a sample.`};
  });
  const plan: ProductPlan={version:'product-plan-v1',status:'unverified-prototype-plan',productIntent:binding.creative.intent,silhouette:binding.creative.silhouette,heroPartId:'actuator',scale:{status:'unresolved',direction:binding.creative.scaleDirection},process:'undecided',parts,joins:structuredClone(joins),assembly:operations.map((op,i)=>({step:i+1,partIds:[...op.partIds],instruction:op.instruction})),actions:[structuredClone(action)],risks:['The authored topology is a design hypothesis; access, geometry, small details and stability may require redesign.','The guide and integral marker may jam, collide or fail to reveal clearly; no working mechanism is demonstrated.'],manufacturingUnknowns:['Dimensions, material, equipment, support access, finish compatibility and cost remain unresolved.','All mating surfaces, forces, travel limits, marker visibility, retention and manual reset require physical samples.'],verificationGates:['cad-review','slicer-review','fit-test','physical-prototype','finish-assembly-review','interaction-test'].map(id=>({id:id as ProductPlan['verificationGates'][number]['id'],status:'unverified'}))};
  try { parseProductPlan(plan,binding.source.elements.map(e=>e.id),{heroElementId:binding.source.heroElementId}); } catch { throw new ConstructionClarification('The proposed construction cannot safely include this direction within the supported plan limits. Keep the brief and review the construction choices before generating images. No image was generated.'); }
  return {plan,choice:{...choice,appearances:CONSTRUCTION_ROLES.map(role=>({...choice.appearances.find(p=>p.role===role)!}))}};
}
export function constructionModelChoices(binding: ConstructionBinding, pinned?: AuthoredConstructionOrigin['choice']) {
  return { version:CONSTRUCTION_VERSION,templateId:CONSTRUCTION_TEMPLATE,roles:binding.creative.roles.map(r=>({role:r.role,storyElementIds:r.storyElementIds,appearances:pinned ? r.appearances.filter(a=>a.id===pinned.appearances.find(p=>p.role===r.role)?.appearanceId) : r.appearances})) };
}
export function constructionDesign(plan: ProductPlan): string {
  return `${plan.silhouette}\n${plan.parts.map(p=>`${p.name}: ${p.form} ${p.finish}`).join('\n')}\nFunctional authority: ${plan.actions.map(a=>`${a.action}. ${a.response}`).join(' ')}\nAll geometry, assembly, fit and interaction remain unverified. No extra motion, automatic return, powered response or manufacturing evidence.`;
}
export function isConstructionOrigin(value: unknown): value is ConstructionOrigin {
  if (isBriefConstructionOrigin(value)) return true;
  const keys=['version','kind','evidence','compilerVersion','compilerDigest','templateId','templateRevision','templateDigest','sourceDigest','creativeDigest','planDigest','choice'];
  if (!object(value,keys) || value.version!=='construction-origin-v1' || value.kind!=='authored-template' || value.evidence!=='unverified-design-proposal' || !['compilerVersion','templateId','templateRevision'].every(k=>text(value[k],80)) || !['compilerDigest','templateDigest','sourceDigest','creativeDigest','planDigest'].every(k=>typeof value[k]==='string'&&/^[a-f0-9]{64}$/.test(value[k] as string))) return false;
  // Historical stored-choice shape is intentionally independent of the live supported-template registry.
  const choice=value.choice;
  if (!object(choice,['version','templateId','appearances']) || choice.version!==CONSTRUCTION_VERSION || !slug(choice.templateId) || value.templateId!==choice.templateId || !array(choice.appearances,7,7) ||
    !choice.appearances.every(p=>object(p,['role','appearanceId'])&&CONSTRUCTION_ROLES.includes(p.role as ConstructionRole)&&slug(p.appearanceId)) ||
    !equalSet(choice.appearances.map(p=>(p as ConstructionChoice['appearances'][number]).role),CONSTRUCTION_ROLES)) return false;
  return JSON.stringify(value).length<=6000;
}
export async function constructionOrigin(plan: ProductPlan, choice: ConstructionChoice, binding: ConstructionBinding, hash: (s:string)=>Promise<string>): Promise<AuthoredConstructionOrigin> {
  return {version:'construction-origin-v1',kind:'authored-template',evidence:'unverified-design-proposal',compilerVersion:CONSTRUCTION_COMPILER_VERSION,compilerDigest:await hash(CONSTRUCTION_SEMANTICS),templateId:CONSTRUCTION_TEMPLATE,templateRevision:'1',templateDigest:await hash(constructionCanonical({interfaces,joins,operations,action})),sourceDigest:await hash(constructionCanonical(binding.source)),creativeDigest:await hash(constructionCanonical(binding.creative)),planDigest:await hash(constructionCanonical(plan)),choice};
}
