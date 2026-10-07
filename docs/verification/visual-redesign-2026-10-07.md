# OFFKIN visual redesign: source and verification record

## Identity and scope

This is a new reconstruction of the approved visual direction, not recovery of an earlier missing eight-file patch. It starts from main `4c69d9e319bf2907d2c02c73a9ceb9c2d1ad8b68`, tree `e08570df6c6fd0e1d4e137632ea0e5359e1b1592` (ProductPlan repair plus restored preview-auth guards).

References inspected: user-supplied `Offkin.png` pixels and the previously delivered `OFFKIN-local-redesign-preview.html` (17,369,190 bytes). The preview is static layout evidence with prior images and abbreviated test metadata, not live functionality or manufacturing validation. Neither reference is presented as customer work. Original brand boards stay off the homepage.

## What changed

- Cream, ink-black, coral and yellow interface; bold editorial typography, conversation-first split entry, responsive breakpoints, four connected stage descriptions and a full-width physical-first result board
- Exact headline: “Your business DNA. Made collectible.”
- Public site title, logo and logo link still read the authoritative `site_settings`; footer now uses the same loaded title
- Self-hosted unmodified Anton font extracted from the approved preview; copyright and SIL OFL 1.1 included in `public/fonts/Anton-OFL.txt`. No font-host request is introduced
- Skip and header navigation scroll/focus locally without altering URL/history. Genuine route/share/back-forward cancellation is preserved
- Larger controls, visible keyboard focus, accessible labels, reduced-motion handling and portal modal styling
- Stage labels stay consistent (01 world, 02 collectible, 03 components, 04 packaging) while the physical hero is displayed first

### Deliberate generation-semantics change

New sessions no longer preselect `interaction: 'Display only'`. The value is now blank/unspecified, allowing a business-story request such as “press the sun to reveal the shared energy path” to reach planning without a contradictory static default. This does **not** promise or invent movement or electronics. Explicit user-entered `Display only` remains intact through all four generated request contexts. Ready-state copy points to optional interaction in Edit details and states that proposed movement needs physical prototype testing. Backend plan validation and the 0–2 action contract are unchanged.

## Automated checks on the reconstructed patch

Run 2026-10-07. These are fresh results, not the count from an earlier patch.

| Check | Result |
| --- | --- |
| `npm test` | PASS: 983 tests, 31 files |
| Focused ProposalStudio / ProposalBoard / proposal-session suite | PASS: 75 tests, 3 files |
| `npx tsc --noEmit -p tsconfig.app.json` | PASS |
| `npx tsc --noEmit -p tsconfig.node.json` | PASS |
| `npm run lint` | PASS: 0 errors; 8 existing react-refresh warnings in shared UI components |
| `npm run build` | PASS; existing bundle-size warning remains |
| `node tests/generation-contract.mjs` | PASS: mocked backend generation contract; zero paid provider calls |
| `git diff --check` | PASS after trailing-blank-line cleanup |

New regressions cover exact headline and four-stage navigation; no example images in fresh entry; requested press-the-sun story preservation; explicit Display-only behavior; restored-result anchors and disabled generation; and in-page navigation during an in-flight proposal. Existing tests continue covering source lineage, reviewed sharing, original-metadata opt-in, repeated clicks, cancellation, newer navigation, partial recovery and atomic revisions.

## Independent review

Source review found an initial anchor regression: native hash navigation would cancel active work through the existing router effect. It was corrected to prevent default URL navigation and scroll/focus the intended element. Re-review found no remaining functional/source blocker; 75 focused tests, scoped ESLint and app TypeScript passed. This is source-level approval, not visual or release sign-off.

## Blocked and deliberately not run

- **BLOCKED: actual desktop/mobile rendering, screenshots and browser keyboard/modal acceptance.** Installed Chromium aborts on `process_singleton` / `socket() failed: Operation not permitted`, including a reviewed escalated attempt. The supported cloud browser rejects the local development URL with `ERR_BLOCKED_BY_CLIENT`. No substitute screenshot is represented as a rendered result
- Responsive CSS and focus/modal behavior have source and component-test coverage only. Pixel-level overflow, custom-brand stress cases, Tab order, modal focus return and real Back/Forward behavior still need browser acceptance
- **NOT RUN:** live paid world → physical → components → packaging generation, live refinement/restore/share acceptance, production publication or deployment. The five separately reserved live image attempts were not used
- `PROPOSAL_GENERATION_PAUSED = true` is unchanged. A passing local suite does not establish public readiness

## Preserved boundaries

No edits to `supabase/`, ProductPlan validation/repair, API contracts, private storage, source-lineage validators, capability gating, auth/admin guards, credentials, permissions or settings. All unrelated files are inherited from the exact base tree. Preview-auth blob remains `4049233832d3ec47a5d1eed68927087db7319f4a`. No purchases, provider calls, images generated, Lovable turns, merges or public publish actions were performed for this patch.

## Required acceptance before release

1. Inspect 1440 px desktop and 390/320 px mobile entry, blocked-generation notice, details disclosure, restored four-image result and image/share dialogs
2. Exercise keyboard-only skip/header navigation, Tab order, Escape/Close focus return and Back/Forward without losing accepted work
3. Use the separately authorized live budget to verify a meaningful requested physical interaction is retained; validate ProductPlan and image lineage through refinement, restore and reviewed sharing
4. Keep the generation hold until the corrected backend and final UI pass that bounded live acceptance
