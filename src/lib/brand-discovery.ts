import { pilotCredentialVersion, pilotInviteHeaders, pilotInviteTokenPresent } from './pilot-access';
import { isBrandDiscoveryResponse, type BrandDiscoveryRequest, type BrandDiscoveryResponse } from '../../supabase/functions/generate-concept/brand-discovery-contract';

export type { BrandDiscoveryRequest, BrandDiscoveryResponse };
export const BRAND_DISCOVERY_VERSION = 'offkin-brand-discovery-v1' as const;
export const BRAND_LOOKUP_DRAFT_KEY = 'offkin:brand-lookup:v1';
export type LookupDraft = { query: string; researchId?: string };
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value);
export function loadLookupDraft(): LookupDraft | null {
  try {
    const raw = localStorage.getItem(BRAND_LOOKUP_DRAFT_KEY);
    if (!raw || raw.length > 1200) return null;
    const value = JSON.parse(raw);
    return value && typeof value.query === 'string' && value.query.length <= 300 && value.query.trim() &&
      Object.keys(value).every(key => ['query', 'researchId'].includes(key)) &&
      (value.researchId === undefined || uuid(value.researchId)) ? value : null;
  } catch { return null; }
}
export function saveLookupDraft(value: LookupDraft | null): boolean {
  try { if (value) localStorage.setItem(BRAND_LOOKUP_DRAFT_KEY, JSON.stringify(value)); else localStorage.removeItem(BRAND_LOOKUP_DRAFT_KEY); return true; }
  catch { return false; }
}
/** The invitation remains header-only. No third-party browser request is used. */
export async function requestBrandDiscovery(body: BrandDiscoveryRequest, signal: AbortSignal): Promise<BrandDiscoveryResponse> {
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
  if (!pilotInviteTokenPresent()) throw new Error('Open your private preview invitation to look up your brand.');
  const url = import.meta.env.VITE_SUPABASE_URL; const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Brand lookup is not connected yet. Your entry is still here.');
  const version = pilotCredentialVersion();
  const response = await fetch(`${url}/functions/v1/generate-concept`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', apikey: key, ...pilotInviteHeaders() },
    body: JSON.stringify(body), signal, credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error',
  });
  const data: unknown = await response.json().catch(() => null);
  if (signal.aborted || version !== pilotCredentialVersion()) throw new DOMException('Cancelled', 'AbortError');
  if (!response.ok) throw new Error('Brand lookup could not finish. Check for a saved result, or add your own description.');
  if (!isBrandDiscoveryResponse(data)) throw new Error('The brand research could not be read safely. No concept was generated.');
  return data;
}
