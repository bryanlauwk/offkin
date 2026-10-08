/** Invite credentials exist only in this module's memory, never in browser storage. */
export const PILOT_ACCESS_VERSION = 'offkin-pilot-v1';
export type PilotAccess = { version: typeof PILOT_ACCESS_VERSION; authorized: true; images_remaining: number; planners_remaining: number; expires_at: string; recovery_available?: boolean; blocked_attempt?: boolean };
let token = '';
let credentialVersion = 0;
export function pilotCredentialVersion() { return credentialVersion; }
let verified: PilotAccess | null = null;
const listeners = new Set<() => void>();
const publish = () => listeners.forEach(listener => listener());
export function subscribePilotAccess(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function pilotInviteTokenPresent() { return Boolean(token); }
export function pilotInviteHeaders(): Record<string, string> { return token ? { 'x-offkin-invite': token } : {}; }
export function forgetPilotInvite() { token = ''; credentialVersion++; verified = null; publish(); }
export function currentPilotAccess() { return verified; }
export function setPilotInvite(value: string): boolean {
  if (!/^[A-Za-z0-9_-]{43}$/.test(value)) return false;
  token = value; credentialVersion++; verified = null; publish(); return true;
}
export function parsePilotInvite(value: string, origin: string): string | null {
  const clean = value.trim();
  if (/^[A-Za-z0-9_-]{43}$/.test(clean)) return clean;
  try {
    const url = new URL(clean, origin);
    if (url.origin !== origin || url.pathname !== '/' || !url.hash.startsWith('#invite=')) return null;
    const candidate = url.hash.slice('#invite='.length);
    return /^[A-Za-z0-9_-]{43}$/.test(candidate) ? candidate : null;
  } catch { return null; }
}
export function isPilotAccess(value: unknown): value is PilotAccess {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Partial<PilotAccess>;
  return item.version === PILOT_ACCESS_VERSION && item.authorized === true &&
    Number.isInteger(item.images_remaining) && item.images_remaining! >= 0 && item.images_remaining! <= 5 &&
    Number.isInteger(item.planners_remaining) && item.planners_remaining! >= 0 && item.planners_remaining! <= 1 &&
    typeof item.expires_at === 'string' && Number.isFinite(Date.parse(item.expires_at)) && Date.parse(item.expires_at) > Date.now();
}
/** Accept only the exact access contract from the authenticated backend. */
export function rememberPilotAccess(value: unknown): PilotAccess | null { verified = token && isPilotAccess(value) ? value : null; publish(); return verified; }
export async function checkPilotAccess(signal: AbortSignal): Promise<PilotAccess> {
  const captured = token;
  if (!captured) throw new Error('Enter your pilot invitation first.');
  const url = import.meta.env.VITE_SUPABASE_URL; const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Pilot access is unavailable. Your brief is still on this device.');
  const response = await fetch(`${url}/functions/v1/generate-concept`, { headers: { apikey: key, 'x-offkin-invite': captured }, signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
  const data: unknown = await response.json().catch(() => null);
  if (signal.aborted || token !== captured) throw new DOMException('Cancelled', 'AbortError');
  const access = data && typeof data === 'object' && !Array.isArray(data) && 'pilot_access' in data ? data.pilot_access : null;
  if (!response.ok || !isPilotAccess(access)) { verified = null; publish(); throw new Error('This invitation could not be verified. It may be expired, revoked, or the pilot may still be paused. You can still plan your project.'); }
  verified = access; publish(); return access;
}
