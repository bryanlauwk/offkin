# Physical-product planning release candidate

This proposal responds to the owner's 7 October request that OFFKIN produce believable physical corporate gifts and collectibles that can be developed for 3D printing, rather than attractive architectural illustrations. The software does not produce CAD or prove manufacturability.

## Behaviour

Before the first new image, the text generation must supply a bounded ProductPlan: one printed hero, a coherent silhouette, finite proposed printed parts, separately identified purchased components, story mappings, proposed joins, ordered assembly, zero to two selected actions, process/scale assumptions, unresolved manufacturing inputs and verification gates. The server validates references and completeness before calling the image provider. A schema-valid plan is still an unverified design proposal.

The brand world is illustrated from that product logic. The physical hero resolves the same plan into a product presentation. Details and protective packaging use the saved physical plan unchanged and actual saved source pixels. They cannot add a new construction plan or silently alter it. A physical revision can update a plan while keeping story lineage; packaging-only revisions retain it.

The result leads with the physical hero. Construction notes remain expandable, and the downloadable brief preserves the full plan. The simple conversation does not require customers to fill technical specification forms. Repeated identical narrative is suppressed in the board.

## Compatibility and boundaries

- The v9 endpoint and old v10 manifest versions are unchanged. Old v10 assets lacking ProductPlan restore and can finish visual-only supplements, explicitly without construction evidence. New physical generation creates a plan.
- New frontend generation requires the advertised product-plan-v1 capability. Restore remains available without that capability. Deploy the matching backend before exposing the new frontend. The published v10 client filters known manifest fields and tolerates the added public plan. If new plan-bearing rows have been saved, retain the upgraded server parser during rollback; disable generation or roll back the frontend instead of reverting the backend parser and making those rows unreadable.
- ProductPlan is optional only for old stored assets. New world/physical requests with missing, malformed, disconnected, mismatched-hero or unrequested Display-only action plans fail before an image call.
- All generated verification statuses remain unverified. No supplier-confirmed specifications, measured tolerance, sliced file, successful print, safe electronics or quoted production cost is inferred.
- The generator is brand-generic: no Tesla sun, red road, fixed dimensions, universal palm-size, default electronics or forced mechanism. Supplied identity and copy stay authoritative.
- Private storage, source-byte multipart edits, capability-ID redaction, exact wording, URL-reader protections, cancellation and atomic accepted-version behaviour remain in place.

## Required acceptance before deployment claims

1. Review the exact local diff and run aggregate tests, TypeScript, lint, production build and legacy contract checks.
2. Keep external actions within the explicitly approved release budget: one deployment request and at most five real image attempts. This software change does not authorize factory contact, purchases or additional spending.
3. Minimum focused live check: one bundled deployment turn plus at most five image attempts. Four make one complete proposal; the fifth checks a packaging-only update without changing the physical plan. Stop on a failing or visibly unsuitable product rather than consuming the allowance blindly. A live physical redesign would need three further images for hero, details and packaging, requiring a separately approved budget.
4. Inspect actual output against the reference: distinctive authored silhouette, exaggerated/charming proportions where requested, discrete plausible parts, supported roads/bridges and cleanable forms, no cloned suburban architecture. Compare every supplement with the same hero.
5. Recheck plan/download/restore, old assets and partials, text-only share, desktop/narrow presentation, no forced actions and no manufacturing claims.
6. Physical feasibility is a separate evidence gate: actual CAD, selected process/material, slicer review, fit samples, assembly/finishing trial and physical prototype. Interaction needs physical function/durability checks; packaging needs fit and transport tests. Images and unit tests cannot pass those gates.

Runtime acceptance is recorded separately after deployment and actual image inspection. Earlier Tesla renders remain historical visual evidence, not proof of this new product-planning behaviour.
