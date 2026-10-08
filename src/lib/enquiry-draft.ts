/** Local-only buyer context. Never part of a public proposal link or image request. */
export const ENQUIRY_DRAFT_PREFIX = 'offkin:enquiry-draft:v1:';
export const ENQUIRY_LIMITS = { projectType: 40, company: 120, story: 2000, name: 120, contact: 200, quantity: 120, timing: 120, budget: 160, size: 160, destination: 160, notes: 2000, inspiration: 160 } as const;
export type EnquiryDraft = Record<keyof typeof ENQUIRY_LIMITS, string>;
export const emptyEnquiryDraft = (): EnquiryDraft => ({ projectType: 'Corporate gifting', company: '', story: '', name: '', contact: '', quantity: '', timing: '', budget: '', size: '', destination: '', notes: '', inspiration: '' });
const storageKey = (key: string) => `${ENQUIRY_DRAFT_PREFIX}${key.slice(0, 160)}`;
export function readEnquiryDraft(key: string): { draft: EnquiryDraft; restored: boolean; unavailable: boolean } {
  const empty = { draft: emptyEnquiryDraft(), restored: false, unavailable: false };
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (!raw) return empty;
    if (raw.length > 20000) return empty;
    const stored: unknown = JSON.parse(raw);
    if (!stored || typeof stored !== 'object' || Array.isArray(stored) || !('version' in stored) || stored.version !== 1 || !('fields' in stored) || !stored.fields || typeof stored.fields !== 'object' || Array.isArray(stored.fields)) return empty;
    const fields = stored.fields as Record<string, unknown>;
    const draft = emptyEnquiryDraft();
    for (const field of Object.keys(ENQUIRY_LIMITS) as (keyof EnquiryDraft)[]) if (typeof fields[field] === 'string') draft[field] = fields[field].slice(0, ENQUIRY_LIMITS[field]);
    if (!['Corporate gifting', 'Personal commission', 'Not sure yet'].includes(draft.projectType)) draft.projectType = 'Not sure yet';
    return { draft, restored: true, unavailable: false };
  } catch { return { ...empty, unavailable: true }; }
}
export function saveEnquiryDraft(key: string, fields: EnquiryDraft): boolean {
  try { localStorage.setItem(storageKey(key), JSON.stringify({ version: 1, fields })); return true; } catch { return false; }
}
export function clearEnquiryDraft(key: string): boolean {
  try { localStorage.removeItem(storageKey(key)); return true; } catch { return false; }
}
