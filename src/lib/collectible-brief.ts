import { editions, formats, type Selection } from '../../supabase/functions/generate-concept/options';
export type CollectibleConcept = Selection & { id: string; brand: string; title: string; story: string; image?: string; interaction?: string };
export type BriefDetails = { agency: string; quantity: string; budget: string; date: string; occasion: string; clientReady: boolean };
export function makeBrief(concept: CollectibleConcept, details: BriefDetails) {
  return [
    `${concept.brand.toUpperCase()} — COLLECTIBLE CONCEPT`,
    ...(details.agency.trim() ? [`Prepared by: ${details.agency.trim()}`] : []),
    `Concept: ${concept.title}`,
    `Edition: ${editions[concept.edition].label}\nFormat: ${formats[concept.format].label}`,
    concept.story,
    `Recipient experience: ${concept.interaction || 'To be refined during design review.'}`,
    `Occasion: ${details.occasion}\nPlanning quantity: ${details.quantity}\nRequested delivery: ${details.date || 'To be confirmed'}`,
    ...(!details.clientReady ? [`INTERNAL PLANNING ONLY\nTarget unit budget: RM${details.budget} (not a quote; design and sample fees excluded)`] : []),
    'Packaging direction: matching branded box and story card; details to be agreed.',
    'Next steps: design review, quotation, physical sample approval, then production.',
    'Independent visual concept. Brand details, construction, durability, final price and delivery require confirmation. This brief has not been sent and does not place an order.',
  ].join('\n\n');
}
