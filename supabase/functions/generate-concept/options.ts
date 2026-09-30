export const editions = {
  icon: { label: 'Icon', intent: 'Keep the symbol', description: 'Your signature shape, made collectible.', direction: 'A nonfunctional display collectible with a recognizable brand-derived silhouette. No moving parts, buttons, or useful secondary function.' },
  hero: { label: 'Hero', intent: 'Build the story', description: 'The people and moments behind the brand.', direction: 'A compact scene or character celebrating a supplied founder, employee, customer, origin, or milestone story. Never invent a factual origin story. If no true story is supplied, use an explicitly proposed fictional customer or team scenario.' },
  inside: { label: 'Inside', intent: 'Show how it works', description: 'Make a big idea easy to understand.', direction: 'A compact miniature of the supplied business process, arranged as one coherent workstation or scene. Respect the customer’s item, style and placement preferences. No added lettering or unrelated functions. A simple tactile action is optional only when requested and meaningful to that real process. It is a miniature, not actual working machinery.' },
  everyday: { label: 'Everyday', intent: 'Make it a ritual', description: 'A useful object with the brand built in.', direction: 'Give the collectible one simple daily function: phone stand, cable holder, business-card holder, or tactile clicker. No electronics, heating, food preparation, or claims of working machinery.' },
} as const;
export const formats = {
  bricks: { label: 'Brick build', description: 'A story you assemble', direction: 'An original small interlocking brick build using plausible available standard brick shapes, with a clear assembly sequence. Avoid proprietary character designs. No assumed LEGO affiliation.' },
  miniature: { label: 'Miniature', description: 'Small scale, big personality', direction: 'A palm-sized sculptural miniature with sturdy geometry and a plausible resin or 3D-printed construction. Moving parts only when the chosen edition calls for them.' },
  clicker: { label: 'Clicker', description: 'A satisfying tactile moment', direction: 'A compact tactile object using purchased keyboard switches, guided caps or a stout pivot lever with controlled travel and a removable base. The click action must express the story.' },
} as const;
export type Edition = keyof typeof editions;
export type GiftFormat = keyof typeof formats;
export type Selection = { edition: Edition; format: GiftFormat };
export function isEdition(value: unknown): value is Edition { return typeof value === 'string' && Object.prototype.hasOwnProperty.call(editions, value); }
export function isFormat(value: unknown): value is GiftFormat { return typeof value === 'string' && Object.prototype.hasOwnProperty.call(formats, value); }
export function parseSelection(input: { edition?: unknown; format?: unknown }): Selection | null {
  const edition = input.edition === undefined ? 'everyday' : input.edition;
  const format = input.format === undefined ? 'clicker' : input.format;
  if (!isEdition(edition) || !isFormat(format) || (edition === 'icon' && format === 'clicker')) return null;
  return { edition, format };
}
export function designDirection(selection: Selection) {
  return `Edition: ${editions[selection.edition].label}. ${editions[selection.edition].direction}\nObject format: ${formats[selection.format].label}. ${formats[selection.format].direction}`;
}
