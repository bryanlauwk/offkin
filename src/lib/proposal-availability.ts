/** Temporary client rollout hold after live product-plan validation failed.
 * Restores/downloads and the separately labelled legacy workflow remain available.
 * Re-enable only after the corrected backend passes bounded live acceptance.
 */
export const PROPOSAL_GENERATION_PAUSED = true;
export const PROPOSAL_PAUSE_MESSAGE = 'New complete-proposal generation is temporarily unavailable. Your saved proposals and brief tools are still available.';
