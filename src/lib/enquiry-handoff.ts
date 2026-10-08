import type { EnquiryDraft } from './enquiry-draft';

// Owner-selected pilot enquiry destination. This is a chat handoff, not a send API.
export const OFFKIN_WHATSAPP_NUMBER = '60149303546';
export const OFFKIN_WHATSAPP_DISPLAY = '+60 14-930 3546';
/** The handoff deliberately excludes the original brief, notes, contact details and
 * all image/asset context. Those stay in the separately reviewed local file.
 * Links and UUIDs are stripped even if pasted into a short commercial field. */
const boundedUnicode = (value: string, length: number) => Array.from(value).map(character => {
  const code = character.codePointAt(0)!;
  return code >= 0xd800 && code <= 0xdfff ? '\uFFFD' : character;
}).slice(0, length).join('');
const short = (value: string, length: number) => boundedUnicode(value
  .replace(/(?:https?:\/\/|www\.)\S+/gi, '[link omitted]')
  .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[reference omitted]')
  .replace(/\s+/g, ' ').trim(), length);
export function enquiryWhatsAppMessage(draft: EnquiryDraft, hasConcept: boolean): string {
  return boundedUnicode([
    'Hi OFFKIN, I’d like to discuss a collectible project.',
    `Project: ${short(draft.projectType, 40) || 'To discuss'}`,
    draft.company && `Brand / project: ${short(draft.company, 120)}`,
    `Quantity: ${short(draft.quantity, 120) || 'Not sure yet'}`,
    `Budget direction: ${short(draft.budget, 160) || 'To discuss'}`,
    `Ideal in-hands date: ${short(draft.timing, 120) || 'Flexible / to discuss'}`,
    draft.inspiration && `Inspiration only: ${short(draft.inspiration, 160)} (unofficial study)`,
    hasConcept ? 'I have a concept preview to discuss. I can attach the saved collectible image and optional full brief here.' : 'I’d like to discuss my idea and the next step.',
    'Please help me understand the design scope, feasibility and build proposal. This is an enquiry, not an order.',
  ].filter(Boolean).join('\n'), 1500);
}
export function enquiryWhatsAppUrl(message: string): string {
  return `https://wa.me/${OFFKIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(boundedUnicode(message, 1500))}`;
}
