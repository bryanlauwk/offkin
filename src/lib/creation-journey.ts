export type CreationDraft = {
  website: string;
  business: string;
  item: 'Miniature workstation' | 'Small diorama';
  audience: string;
  wording: string;
  placement: 'On the base' | 'On a sign' | 'On the object' | 'Designer recommendation';
  style: 'Realistic & refined' | 'Playful & sculptural' | 'Minimal & architectural';
  interaction: 'Display only' | 'A meaningful click';
  summaryOnly: boolean;
};
export const emptyDraft: CreationDraft = { website: '', business: '', item: 'Miniature workstation', audience: 'Clients & partners', wording: '', placement: 'Designer recommendation', style: 'Realistic & refined', interaction: 'Display only', summaryOnly: false };
export function makeCreationContext(draft: CreationDraft) {
  // Keep supplied lettering verbatim. Never silently trim or truncate artwork instructions.
  const context = JSON.stringify({ business: draft.business, item: draft.item, audience: draft.audience, exactWording: draft.wording, placement: draft.placement, style: draft.style, interaction: draft.interaction });
  if (!draft.business.trim()) throw new Error('Tell us what the business should be known for.');
  if (context.length > 600) throw new Error('Please shorten the business description or audience a little. Your exact wording will stay unchanged.');
  return context;
}

const draftKey = (id: string) => `dioramini:direction:${id}`;
export function saveCreationDraft(id: string, draft: CreationDraft) {
  try { localStorage.setItem(draftKey(id), JSON.stringify(draft)); } catch { /* Creation still works when browser storage is unavailable. */ }
}
export function loadCreationDraft(id: string): CreationDraft | undefined {
  try {
    const value = JSON.parse(localStorage.getItem(draftKey(id)) || 'null');
    if (!value || typeof value !== 'object') return;
    const strings = ['website', 'business', 'item', 'audience', 'wording', 'placement', 'style', 'interaction'] as const;
    if (!strings.every(key => typeof value[key] === 'string') || typeof value.summaryOnly !== 'boolean') return;
    if (value.website.length > 120 || value.business.length > 150 || value.wording.length > 100 || value.audience.length > 40) return;
    if (!['Miniature workstation', 'Small diorama'].includes(value.item) || !['On the base', 'On a sign', 'On the object', 'Designer recommendation'].includes(value.placement) || !['Realistic & refined', 'Playful & sculptural', 'Minimal & architectural'].includes(value.style) || !['Display only', 'A meaningful click'].includes(value.interaction)) return;
    return { website: value.website, business: value.business, item: value.item, audience: value.audience, wording: value.wording, placement: value.placement, style: value.style, interaction: value.interaction, summaryOnly: value.summaryOnly };
  } catch { return; }
}
