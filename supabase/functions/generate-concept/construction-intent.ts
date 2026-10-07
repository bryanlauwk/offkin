/** An explicit customer instruction. This is never engineering approval or proof of a UI click. */
export const CONSTRUCTION_INTENT_VERSION = 'construction-intent-v1';
export type ConstructionIntent = { version: typeof CONSTRUCTION_INTENT_VERSION; action: 'static' | 'press-reveal-manual-reset' };
export function isConstructionIntent(value: unknown): value is ConstructionIntent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v=value as Record<string,unknown>;
  return Object.keys(v).length===2 && v.version===CONSTRUCTION_INTENT_VERSION && (v.action==='static'||v.action==='press-reveal-manual-reset');
}
export function constructionInteraction(intent: ConstructionIntent): string {
  return intent.action==='static' ? 'Display only' : 'Press the hero to reveal a marker; lift manually to reset.';
}
