/** Shared with the proposal client. Keep server work inside this abort window. */
export const PROPOSAL_ASSET_TIMEOUT_MS = 220_000;
/** Includes preparation, provider calls and the reserved storage/save window. */
export const PROPOSAL_STAGE_BUDGET_MS = 190_000;
export const PROPOSAL_STORAGE_RESERVE_MS = 20_000;
export const PROPOSAL_TEXT_TIMEOUT_MS = 40_000;
export const PROPOSAL_CORRECTION_TIMEOUT_MS = 25_000;
export const PROPOSAL_IMAGE_TIMEOUT_MS = 100_000;
export const PROVIDER_TIMEOUT_MAX_MS = 100_000;

export type ProposalProviderCall = 'design' | 'correction' | 'image';

/** Pure elapsed-time policy. Zero means stop before making a provider request. */
export function proposalCallTimeout(call: ProposalProviderCall, elapsedMs: number): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return 0;
  const remaining = Math.floor(PROPOSAL_STAGE_BUDGET_MS - elapsedMs);
  const imageAndSave = PROPOSAL_IMAGE_TIMEOUT_MS + PROPOSAL_STORAGE_RESERVE_MS;
  if (call === 'image') return remaining >= imageAndSave ? PROPOSAL_IMAGE_TIMEOUT_MS : 0;
  return Math.max(0, Math.min(call === 'design' ? PROPOSAL_TEXT_TIMEOUT_MS : PROPOSAL_CORRECTION_TIMEOUT_MS,
    remaining - imageAndSave));
}

/** Optional server-owned overrides may shorten, never expand, the legacy timeout. */
export function providerCallTimeout(timeoutMs: number = PROVIDER_TIMEOUT_MAX_MS): number {
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1) return 0;
  return Math.min(PROVIDER_TIMEOUT_MAX_MS, Math.floor(timeoutMs));
}
