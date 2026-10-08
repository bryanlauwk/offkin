/**
 * Public generation stays held. Only the separately authenticated, transactional
 * pilot path in the endpoint may generate while this is true.
 *
 * Deliberately has no environment, query-string or client flag override. Existing
 * provider enablement flags are not access authorization; a valid invite also
 * needs an enabled, unexpired database campaign and an atomic operation claim.
 * Offline generation-contract tests replace this module with an explicit mock;
 * production must never provide such an adapter.
 */
export function serverGenerationHeld(): boolean { return true; }

export const SERVER_GENERATION_HOLD_MESSAGE = 'New generation and website inspection are paused while private pilot access is being prepared. Saved concept links can still be opened.';

/** Only the existing read-only capability lookup may cross the server hold. */
export function isRestoreOnlyRequest(input: Record<string, unknown>): boolean {
  return Object.keys(input).length === 1 && Object.prototype.hasOwnProperty.call(input, 'id');
}
