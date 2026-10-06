import { normalizeCompanyWebsite } from './company-website';

export type ConversationEntry = { kind: 'website' | 'business'; value: string } | { kind: 'error'; message: string };
/** Guided routing only: no inferred facts, silent keyword extraction or simulated AI answer. */
export function interpretConversationEntry(value: string): ConversationEntry {
  if (!value.trim()) return { kind: 'error', message: 'Add a brand, website or a little story to begin.' };
  if (value.length > 1000) return { kind: 'error', message: 'Keep this introduction under 1,000 characters. Your wording has not been shortened.' };
  const website = normalizeCompanyWebsite(value);
  if (website) return { kind: 'website', value: website };
  if (/^(https?:\/\/|www\.)/i.test(value.trim()) && !/\s/.test(value.trim())) return { kind: 'error', message: 'Check that public website address, or describe your brand instead.' };
  return { kind: 'business', value };
}
export function appendDirectionNote(existing: string, addition: string): string | null {
  if (!addition.trim()) return existing;
  const combined = existing ? `${existing}\n${addition}` : addition;
  return combined.length <= 1000 ? combined : null;
}
