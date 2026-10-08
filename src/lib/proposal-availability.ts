/** Client rollout hold while the preview-first backend awaits deployment and acceptance.
 * Restores/downloads and the separately labelled legacy workflow remain available.
 * Re-enable only after the corrected backend passes bounded live acceptance.
 */
export const PROPOSAL_GENERATION_PAUSED = false;
export const PROPOSAL_PAUSE_MESSAGE = 'New complete-proposal generation is temporarily unavailable. Your saved proposals and brief tools are still available.';

/** Keep the public entry simple; completed previews retain refinement and the build-proposal handoff. */
export const PROPOSAL_SIMPLE_MODE = true;
