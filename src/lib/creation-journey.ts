import { getStoryAngle, type StoryAngleId } from './story-angles';

export const draftFieldLimits = {
  website: 300,
  business: 500,
  hiddenDetail: 500,
  audience: 100,
  wording: 200,
  scale: 120,
  brandIdentifiers: 300,
} as const;
export const MAX_CREATION_CONTEXT_CHARS = 6000;
export const DEFAULT_CREATION_SCALE = 'Let the story decide';
export const creationItems = ['Sculptural story world', 'Mechanical story object', 'Scene in a frame', 'Miniature workstation', 'Small diorama'] as const;
export const creationStyles = ['Illustrated & surreal', 'Cinematic & atmospheric', 'Bold & graphic', 'Realistic & refined', 'Playful & sculptural', 'Minimal & architectural'] as const;
export const creationInteractions = ['Display only', 'A meaningful click', 'Turn to reveal', 'Slide to discover'] as const;
const placements = ['On the base', 'On a sign', 'On the object', 'Designer recommendation'] as const;

export type CreationDraft = {
  mode: 'mechanical' | 'electronic';
  website: string;
  business: string;
  angle: StoryAngleId | '';
  hiddenDetail: string;
  item: typeof creationItems[number];
  audience: string;
  wording: string;
  placement: typeof placements[number];
  style: typeof creationStyles[number];
  interaction: typeof creationInteractions[number];
  summaryOnly: boolean;
  scale?: string;
  brandIdentifiers?: string;
};

export const emptyDraft: CreationDraft = {
  mode: 'mechanical', website: '', business: '', angle: '', hiddenDetail: '',
  item: 'Sculptural story world', audience: 'Clients & partners', wording: '',
  placement: 'Designer recommendation', style: 'Illustrated & surreal',
  interaction: 'A meaningful click', summaryOnly: false,
  scale: DEFAULT_CREATION_SCALE, brandIdentifiers: '',
};

export function normalizeCreationDraft(draft: CreationDraft): CreationDraft & { scale: string; brandIdentifiers: string } {
  return { ...draft, scale: draft.scale || DEFAULT_CREATION_SCALE, brandIdentifiers: draft.brandIdentifiers ?? '' };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function isChoice<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T);
}
function isBoundedString(value: unknown, limit: number): value is string {
  return typeof value === 'string' && value.length <= limit;
}

/** Strict imports reject unknown keys; device-local legacy drafts ignore them. */
export function parseCreationDraft(value: unknown, options: { strict?: boolean } = {}): CreationDraft | undefined {
  if (!isRecord(value)) return;
  const allowedKeys = ['mode', 'website', 'business', 'angle', 'hiddenDetail', 'item', 'audience', 'wording', 'placement', 'style', 'interaction', 'summaryOnly', 'scale', 'brandIdentifiers'];
  if (options.strict && Object.keys(value).some(key => !allowedKeys.includes(key))) return;
  if (!isBoundedString(value.website, draftFieldLimits.website)
    || !isBoundedString(value.business, draftFieldLimits.business)
    || !isBoundedString(value.audience, draftFieldLimits.audience)
    || !isBoundedString(value.wording, draftFieldLimits.wording)
    || !isChoice(value.item, creationItems)
    || !isChoice(value.placement, placements)
    || !isChoice(value.style, creationStyles)
    || !isChoice(value.interaction, creationInteractions)
    || typeof value.summaryOnly !== 'boolean') return;
  if (value.mode !== undefined && !isChoice(value.mode, ['mechanical', 'electronic'])) return;
  if (value.angle !== undefined && value.angle !== '' && (typeof value.angle !== 'string' || !getStoryAngle(value.angle))) return;
  if (value.hiddenDetail !== undefined && !isBoundedString(value.hiddenDetail, draftFieldLimits.hiddenDetail)) return;
  if (value.scale !== undefined && !isBoundedString(value.scale, draftFieldLimits.scale)) return;
  if (value.brandIdentifiers !== undefined && !isBoundedString(value.brandIdentifiers, draftFieldLimits.brandIdentifiers)) return;
  return {
    mode: value.mode as CreationDraft['mode'] || 'mechanical', website: value.website,
    business: value.business, angle: value.angle as CreationDraft['angle'] || '',
    hiddenDetail: value.hiddenDetail as string || '', item: value.item,
    audience: value.audience, wording: value.wording, placement: value.placement,
    style: value.style, interaction: value.interaction, summaryOnly: value.summaryOnly,
    ...(value.scale !== undefined ? { scale: value.scale as string } : {}),
    ...(value.brandIdentifiers !== undefined ? { brandIdentifiers: value.brandIdentifiers as string } : {}),
  };
}

export function makeCreationContext(draft: CreationDraft): string {
  if (!parseCreationDraft(draft)) throw new Error('Please check the brief fields and their character limits. Your exact wording will stay unchanged.');
  if (!draft.business.trim()) throw new Error('Tell us what the business should be known for.');
  const normalized = normalizeCreationDraft(draft);
  // JSON preserves exact wording, including line breaks and significant whitespace.
  const context = JSON.stringify({
    mode: draft.mode,
    business: draft.business,
    ...(draft.angle ? { angle: getStoryAngle(draft.angle)?.title } : {}),
    ...(draft.hiddenDetail ? { hiddenDetail: draft.hiddenDetail } : {}),
    item: draft.item, audience: draft.audience, exactWording: draft.wording,
    placement: draft.placement, style: draft.style, interaction: draft.interaction,
    scale: normalized.scale,
    ...(normalized.brandIdentifiers ? { brandIdentifiers: normalized.brandIdentifiers } : {}),
  });
  if (context.length > MAX_CREATION_CONTEXT_CHARS) throw new Error('Please shorten the brief a little. Your exact wording will stay unchanged.');
  return context;
}

const draftKey = (id: string) => `dioramini:direction:${id}`;
const MAX_STORED_DRAFT_CHARS = 24000;
export function saveCreationDraft(id: string, draft: CreationDraft): boolean {
  const validated = parseCreationDraft(draft);
  if (!validated) return false;
  try { localStorage.setItem(draftKey(id), JSON.stringify(validated)); return true; } catch { return false; }
}
export function loadCreationDraft(id: string): CreationDraft | undefined {
  try {
    const stored = localStorage.getItem(draftKey(id));
    if (!stored || stored.length > MAX_STORED_DRAFT_CHARS) return;
    return parseCreationDraft(JSON.parse(stored));
  } catch { return; }
}

/** Plain text for local download, not a submission, quote, artwork proof or order. */
export function makeCreationBrief(draft: CreationDraft): string {
  const validated = parseCreationDraft(draft);
  if (!validated) throw new Error('Please check the brief before saving it.');
  const normalized = normalizeCreationDraft(validated);
  return [
    `OFFKIN｜异趣伙伴 — ${draft.mode === 'electronic' ? 'Electronic story scene' : 'Brand-world design brief'}`,
    'Exploratory concept brief. Not a tested product, quotation or order.',
    `Direction: ${draft.mode === 'electronic' ? 'Electronic story scene (concept study)' : 'Physical story world'}`,
    `Business: ${draft.business || 'To confirm'}`,
    `Website: ${draft.website || 'Not supplied'}`,
    `Story lens: ${getStoryAngle(draft.angle)?.title || 'To confirm'}`,
    `Hidden detail: ${draft.hiddenDetail || 'To confirm'}`,
    `Object: ${draft.item}`,
    `Audience: ${draft.audience}`,
    `Style: ${draft.style}`,
    `Scale: ${normalized.scale}`,
    `Brand identifiers: ${normalized.brandIdentifiers || 'To confirm through brand references'}`,
    `Preferred interaction: ${draft.interaction}`,
    `Exact wording: ${JSON.stringify(draft.wording)}`,
    `Wording placement: ${draft.placement}`,
    `Source basis: ${draft.summaryOnly ? 'Owner-provided description; no website reading is implied.' : 'Owner-confirmed direction. Any website-derived details still need review.'}`,
    'Design approach: a distinctive world shaped by the brand story. Explore sculpture, framed scenes or mechanical objects at the scale the story needs. Keep one main idea, with at most one or two meaningful actions; reuse internal bases, connectors and selected mechanisms where appropriate without making every object look the same.',
    ...(draft.mode === 'electronic' ? [
      'Proposed hardware to review: USB power and an off-the-shelf ESP32-class controller; options include one button, a small display and an LED only where they support the agreed story and interaction. These are starting options, not a validated specification. The physical format and scale remain open for design review.',
      'Optional AI: a short response grounded in approved brand material and the visitor’s choice, through a separately approved commercial service. No Muse integration is assumed. No camera, microphone or motor is required.',
      'Prototype review: usability, readable display, electrical safety, thermal behaviour, assembly, enclosure, firmware, network failure, content boundaries and data privacy. Start with a few outsourced printed samples to validate the experience and cost. Confirm provider terms and running costs before any connected pilot.',
    ] : [
      'Prototype review: scale, stability, small-part strength, materials, finish, clearances, reliable movement where requested, assembly and durability. Start with a few outsourced printed samples to validate the experience and cost before considering production.',
    ]),
    'Artwork review: confirm brand references, colours, placement and exact lettering in a proof. This brief contains written references only; no artwork upload or brand-asset verification is implied.',
    'Budget exploration: use RM100–500 as a range to investigate, not a promised unit price or a requirement that every design fit. Outsourced samples and supplier quotes must establish which specifications are possible. Electronics, story/interaction design, firmware, prototyping and production need separate scoping and quotations.',
    'Next step: review the direction together, agree the prototype scope and obtain supplier quotes. Saving or sharing this brief does not submit it to the studio, reserve production or place an order.',
  ].join('\n\n');
}

export function makeElectronicBrief(draft: CreationDraft): string {
  return makeCreationBrief({ ...draft, mode: 'electronic' });
}
