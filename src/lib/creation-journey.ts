import { getStoryAngle, type StoryAngleId } from './story-angles';
export type CreationDraft = {
  website: string;
  business: string;
  angle: StoryAngleId | '';
  hiddenDetail: string;
  item: 'Miniature workstation' | 'Small diorama';
  audience: string;
  wording: string;
  placement: 'On the base' | 'On a sign' | 'On the object' | 'Designer recommendation';
  style: 'Realistic & refined' | 'Playful & sculptural' | 'Minimal & architectural';
  interaction: 'Display only' | 'A meaningful click';
  summaryOnly: boolean;
};
export const emptyDraft: CreationDraft = { website: '', business: '', angle: '', hiddenDetail: '', item: 'Small diorama', audience: 'Clients & partners', wording: '', placement: 'Designer recommendation', style: 'Minimal & architectural', interaction: 'A meaningful click', summaryOnly: false };
export function makeCreationContext(draft: CreationDraft) {
  // This deliberately keeps the deployed 600-character contract. Never trim exact lettering.
  const context = JSON.stringify({ business: draft.business, ...(draft.angle ? { angle: getStoryAngle(draft.angle)?.title } : {}), ...(draft.hiddenDetail ? { hiddenDetail: draft.hiddenDetail } : {}), item: draft.item, audience: draft.audience, exactWording: draft.wording, placement: draft.placement, style: draft.style, interaction: draft.interaction });
  if (!draft.business.trim()) throw new Error('Tell us what the business should be known for.');
  if (context.length > 600) throw new Error('Please shorten the business description or hidden detail a little. Your exact wording will stay unchanged.');
  return context;
}
const draftKey = (id: string) => `dioramini:direction:${id}`;
export function saveCreationDraft(id: string, draft: CreationDraft) {
  try { localStorage.setItem(draftKey(id), JSON.stringify(draft)); } catch { /* Optional device-local storage. */ }
}
export function loadCreationDraft(id: string): CreationDraft | undefined {
  try {
    const value = JSON.parse(localStorage.getItem(draftKey(id)) || 'null');
    if (!value || typeof value !== 'object') return;
    const strings = ['website', 'business', 'item', 'audience', 'wording', 'placement', 'style', 'interaction'] as const;
    if (!strings.every(key => typeof value[key] === 'string') || typeof value.summaryOnly !== 'boolean') return;
    if (value.website.length > 120 || value.business.length > 150 || value.wording.length > 100 || value.audience.length > 40) return;
    if (!['Miniature workstation', 'Small diorama'].includes(value.item) || !['On the base', 'On a sign', 'On the object', 'Designer recommendation'].includes(value.placement) || !['Realistic & refined', 'Playful & sculptural', 'Minimal & architectural'].includes(value.style) || !['Display only', 'A meaningful click'].includes(value.interaction)) return;
    if (value.angle !== undefined && value.angle !== '' && !getStoryAngle(value.angle)) return;
    if (value.hiddenDetail !== undefined && (typeof value.hiddenDetail !== 'string' || value.hiddenDetail.length > 120)) return;
    return { website: value.website, business: value.business, item: value.item, audience: value.audience, wording: value.wording, placement: value.placement, style: value.style, interaction: value.interaction, summaryOnly: value.summaryOnly, angle: value.angle || '', hiddenDetail: value.hiddenDetail || '' };
  } catch { return; }
}
