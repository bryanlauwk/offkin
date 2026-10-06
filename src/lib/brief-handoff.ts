import { makeCreationBrief, parseCreationDraft, type CreationDraft } from './creation-journey';

export const BRIEF_SESSION_KEY = 'offkin:co-creation:session:v1';
export const BRIEF_HASH_PREFIX = '#offkin-brief=';
export const MAX_BRIEF_PAYLOAD_BYTES = 12000;
export const MAX_BRIEF_HASH_CHARS = BRIEF_HASH_PREFIX.length + Math.ceil(MAX_BRIEF_PAYLOAD_BYTES / 3) * 4;
const MAX_SESSION_CHARS = 24000;
const BRIEF_VERSION = 1;

export type BriefSession = { draft: CreationDraft; step: number; started: boolean };

export function saveBriefSession(session: BriefSession): boolean {
  const validated = parseSession({ version: BRIEF_VERSION, ...session });
  if (!validated) return false;
  try {
    localStorage.setItem(BRIEF_SESSION_KEY, JSON.stringify({ version: BRIEF_VERSION, ...validated }));
    return true;
  } catch { return false; }
}
export function loadBriefSession(): BriefSession | undefined {
  try {
    const stored = localStorage.getItem(BRIEF_SESSION_KEY);
    if (!stored || stored.length > MAX_SESSION_CHARS) return;
    return parseSession(JSON.parse(stored));
  } catch { return; }
}
export function clearBriefSession(): boolean {
  try { localStorage.removeItem(BRIEF_SESSION_KEY); return true; } catch { return false; }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function parseSession(value: unknown): BriefSession | undefined {
  if (!isRecord(value) || value.version !== BRIEF_VERSION || typeof value.started !== 'boolean'
    || typeof value.step !== 'number' || !Number.isInteger(value.step) || value.step < 0 || value.step > 3) return;
  if (Object.keys(value).some(key => !['version', 'draft', 'step', 'started'].includes(key))) return;
  const draft = parseCreationDraft(value.draft, { strict: true });
  if (!draft) return;
  return { draft, step: value.step, started: value.started };
}

function encodeBytes(bytes: Uint8Array): string {
  // Payloads are bounded before this loop; no argument-spread stack overflow.
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Encoding is local. A recipient holding the URL can read every included answer. */
export function encodeBriefHash(draft: CreationDraft): string {
  const validated = parseCreationDraft(draft, { strict: true });
  if (!validated) throw new Error('Please check the brief before creating a sharing link.');
  const bytes = new TextEncoder().encode(JSON.stringify({ version: BRIEF_VERSION, draft: validated }));
  if (bytes.length > MAX_BRIEF_PAYLOAD_BYTES) throw new Error('This brief is too long for a sharing link. Save a text brief instead.');
  return BRIEF_HASH_PREFIX + encodeBytes(bytes);
}

/** Returns a candidate for explicit review. Never saves, generates or fetches. */
export function decodeBriefHash(hash: string): CreationDraft | undefined {
  if (typeof hash !== 'string' || !hash.startsWith(BRIEF_HASH_PREFIX) || hash.length > MAX_BRIEF_HASH_CHARS) return;
  const encoded = hash.slice(BRIEF_HASH_PREFIX.length);
  if (!encoded || !/^[A-Za-z0-9_-]+$/.test(encoded) || encoded.length % 4 === 1) return;
  try {
    const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - encoded.length % 4) % 4));
    if (binary.length > MAX_BRIEF_PAYLOAD_BYTES) return;
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    // Disallow noncanonical encodings and malformed UTF-8 instead of replacing text.
    if (encodeBytes(bytes) !== encoded) return;
    const payload: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!isRecord(payload) || payload.version !== BRIEF_VERSION || Object.keys(payload).some(key => !['version', 'draft'].includes(key))) return;
    return parseCreationDraft(payload.draft, { strict: true });
  } catch { return; }
}

export function makeShareableBriefUrl(draft: CreationDraft, baseUrl: string): string {
  const url = new URL(baseUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Use an HTTP or HTTPS page address to share a brief.');
  // Avoid carrying a selected generated concept or unrelated tracking into the link.
  url.search = '';
  url.hash = encodeBriefHash(draft);
  return url.toString();
}

export function makeDesignBrief(draft: CreationDraft): string {
  return makeCreationBrief(draft);
}
