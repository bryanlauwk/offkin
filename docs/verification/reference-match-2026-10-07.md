# OFFKIN reference-led public studio

## Source and scope

Based on published main `23fd0d47607dbc246361a0ee00139ad74a2cfa72`, tree `442a5d9ebf8cfd21b6ad3412eadc1db66a3c47ac`. The isolated verification checkout has the exact same baseline tree.

The approved 1024 × 1536 reference was inspected directly. The newly supplied image and the earlier reference are byte-identical (SHA-256 `bdc728086ebf4c5edf61af31555e923774fb6a40f639886b61004957561c468a`). A real 1165 × 747 screenshot of the published baseline confirmed both the missing illustration-led layout and overlapping Anton text. Later public-browser acceptance found split compact stage numerals and lost focus after closing image/share dialogs.

## Implementation

- Reconstruct the reference as responsive HTML: compact header navigation; left-hand headline and entry form; dominant right-side illustrative world; yellow statement strip; three application cards; four-stage process; dark illustrated closing section
- Preserve the exact headline, authoritative `site_settings`, conversation-first flow, explicit website-reading and generation actions, download/restore and reviewed sharing
- Use standalone, newly generated illustration-only marketing artwork. All navigation, headings, card descriptions, stage labels and forms are real HTML. Artwork is clearly labelled illustrative and is never inserted into a proposal, generated result, stored brief, selected element or image lineage
- Hide marketing artwork once customer results exist, keeping the four actual generated assets in their editorial result board
- Use Anton at its actual weight 400, disable font synthesis and remove negative tracking. The baseline requested weights 800/900 from a regular-only font, together with `-.036em` tracking and `.92` line height; this combination is consistent with the observed collision. Decorative arrows now use SVG
- Use coral `#ed6041` against cream `#faf5e9` (3.040:1 for large text), close to the visual reference while meeting the large-text contrast threshold
- Prevent compact step numerals from shrinking or wrapping
- Restore image/share modal focus to the actual initiating button; focus main content after a shared import or if a trigger has disappeared. Keep navigation cancellation semantics intact

## Protected boundaries

No changes to Supabase functions or configuration, ProductPlan validation/repair, API contracts, auth/admin guards, capability gating, storage/privacy policy, sharing payloads, credentials or site settings. `PROPOSAL_GENERATION_PAUSED = true` remains unchanged. No merge, deployment, public publication, Lovable turn or live product-generation attempt was performed.

Native image generation for marketing artwork was explicitly authorized separately. It does not validate manufacturing or consume the reserved live product-acceptance attempts. Delivery formats preserve each generated composition and transparency; atlas cells are displayed with native SVG viewports.

## Verification

Fresh checks against the final integrated source and assets on 2026-10-07:

| Check | Result |
| --- | --- |
| Full `npm test` | PASS: 992 tests, 32 files |
| Focused Studio / Board / Marketing / session suite | PASS: 84 tests, 4 files |
| App TypeScript (`tsconfig.app.json`) | PASS |
| Node TypeScript (`tsconfig.node.json`) | PASS |
| `npm run lint` | PASS: 0 errors, 8 existing shared-UI react-refresh warnings |
| `npm run build` | PASS: existing large-chunk warning remains |
| `node tests/generation-contract.mjs` | PASS: mocked legacy backend contract, zero provider calls |
| `git diff --check` | PASS |
| Final independent source/asset review | No remaining blocker; 61 focused component tests passed independently |

The generation contract script is a mocked v8 regression check; v10 proposal behaviour is covered by the unit/component suites. Neither substitutes for live v10 acceptance.

All four delivery assets were visually inspected. Their dimensions match the code; the hero retains byte-identical alpha from its original PNG. The four WebP files total 1,364,592 bytes. Original generated PNGs are also retained privately. Prompts, composition regions and delivery checksums are recorded in `docs/design/marketing-assets-2026-10-07.json`.

Independent review caught and resolved the accessible-name mismatch and low-contrast coral. The interim screenshot-crop caption issue was eliminated by replacing that source entirely with fresh illustration-only assets. The reviewed image/share focus restoration passes Escape/Close tests, and compact numeral spacing is constrained in CSS.

Component tests include label-in-name, all marketing navigation targets, no marketing-to-session contamination, removal of illustrative art on restore, image/share dialog focus return, and import focus. Existing lineage, cancellation, repeated-click, partial recovery, atomic revision and share-boundary tests remain in place.

## Remaining acceptance

Actual rendering of this patch is not established. Local Chromium socket access was denied in prior attempts, and the cloud browser rejected the local development URL. Those restrictions were respected. Source checks and component tests cannot prove pixel-level layout, font loading, image clipping, responsive overflow or browser keyboard behaviour.

After an authorized preview/publication, inspect the exact commit at 1440/1165 desktop and 485/390/320 mobile widths, verify every image and caption, keyboard navigation, image/share Escape/Close focus return, custom site branding and actual history navigation. The reference's composition and art direction are the target; newly generated art is not pixel-identical to the reference. Keep the generation hold until the separately authorized backend/live acceptance is complete.
