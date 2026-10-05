import { editions, formats, type Selection } from '../../supabase/functions/generate-concept/options';
export type CollectibleConcept = Selection & { id: string; brand: string; title: string; story: string; image?: string; interaction?: string; sourceUrl?: string; sourceTitle?: string };
export type BriefDetails = { agency: string; quantity: string; budget: string; date: string; occasion: string; clientReady: boolean };
export function makeBrief(concept: CollectibleConcept, details: BriefDetails) {
  const suppliedBudget = Number(details.budget);
  const budget = Number.isFinite(suppliedBudget) && suppliedBudget > 0 ? `RM${suppliedBudget}` : 'To be scoped';
  return [
    `${concept.brand.toUpperCase()} — COLLECTIBLE CONCEPT`,
    ...(details.agency.trim() ? [`Prepared by: ${details.agency.trim()}`] : []),
    `Concept: ${concept.title}`,
    `Edition: ${editions[concept.edition].label}\nFormat: ${formats[concept.format].label}`,
    concept.story,
    ...(concept.sourceUrl ? [`Business source: ${concept.sourceUrl}`] : []),
    `Recipient experience: ${concept.interaction || 'To be refined during design review.'}`,
    `Occasion: ${details.occasion}\nPlanning quantity: ${details.quantity}\nRequested delivery: ${details.date || 'To be confirmed'}`,
    ...(!details.clientReady ? [`INTERNAL PLANNING ONLY\nTarget unit budget: ${budget} (not a quote; design and sample fees excluded)`] : []),
    'Packaging direction: matching branded box and story card; details to be agreed.',
    'Next steps: design review, a few outsourced printed samples to test the experience and cost, quotation, sample approval, then production.',
    'RM100–500 is an exploratory budget range. Supplier quotes and samples must establish which specifications fit; it is not a price guarantee or a requirement that every design fit. Electronics and design work need separate scoping.',
    'Independent visual concept. Brand details, construction, durability, final price and delivery require confirmation. This brief has not been sent and does not place an order.',
  ].join('\n\n');
}

