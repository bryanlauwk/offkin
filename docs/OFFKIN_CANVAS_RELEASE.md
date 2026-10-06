# OFFKIN canvas-first release

## Experience

The public root is a world-building table: guided business/story choices on the left, a large illustrated world with authored selection controls in the centre, a component tray below, and a collapsible physical concept on the right. Mobile keeps the canvas first and moves choices into bottom sheets. The original full reference boards remain inspectable.

The three authored examples are independent, uncommissioned concept studies. Their boards are visual references, not validated business research, licensed film assets, mechanism specifications or manufactured products. Tesla’s rocket is an expressly speculative horizon motif.

A generated world returns a rich illustration and bounded story elements. Generated elements have no fabricated raster coordinates. Their cards drive included/removed elements, a hero, proposed replacements and direction notes. The current image stays unchanged until another explicit generation.

## Generation and persistence

The `offkin-canvas-v9` contract adds two separately invoked stages, `world` and `physical`. Exact readiness negotiation prevents a v9 brief reaching a stale backend. Existing v8 handling remains for earlier links.

World and physical outputs use the existing private `brick-concepts` bucket and the existing `brick_concepts` schema. A versioned manifest is serialized in the existing text story column. New reads recognize and decode it. UUIDs are capability links: people who hold a concept ID may open that concept, while storage URLs are signed and time-limited. No access-policy or credential changes are included in this release.

The physical stage loads a saved world, validates selected element IDs, validates its selected hero and replacements, and derives a new image from that narrative. Cache identity includes contract version, stage, context, source world, selection, hero and replacements. Restoring a saved image is a read, even when generation is disabled.

Drafts stay in device storage until the user requests a website read, image generation or reviewed share link. Share links contain reviewed current text only by default and can be forwarded. Generated IDs are excluded unless the user explicitly opts in after reviewing the original stored generation metadata; those IDs expose original context, story and design as well as images, including details later removed from the current direction. Signed image URLs are never included in a link. Opening a shared snapshot creates an independent branch after confirmation. No live synchronization is implied.

## Offline commercial path

Quantity, exploratory budget and purpose can be added to a downloadable prototype brief. There is no submission destination, order, payment or reservation. Final design, a physical sample and production are separately scoped and quoted offline. This phase resolves manufacturing simplification, budget, materials, tolerances, stability and one or two meaningful motions if appropriate. The online concept has no fixed size or universal palm-sized limit.

## Verification and release gates

- Unit and interaction tests: references, strict session parsing, local storage errors, Unicode sharing, reviewed branches, explicit generation only, selection propagation, cancellation, resume and legacy behavior
- Mock edge tests: v9 negotiation, two stages, valid selection lineage, exact wording, private restore, caching, URL safety, cancellation, failure handling and kill/limit controls
- TypeScript, build, lint, legacy generation contract
- Supported browser verification: desktop plus narrow/mobile layout, original artwork loading, selection and replacement feedback, overlays/dialogs, keyboard flow, reduced motion, back/cancel, brief download and share import
- Authorized live generation: one representative world, its physical interpretation, a meaningful refinement, cached restore/resume and share branch. Record actual provider requests; do not use repeated generation for unchanged read-only checks
- Audit actual deployed commit against the reviewed source, including existing authentication storage timer safeguards

Localhost may be unavailable to a managed browser. An unrun browser check is not a pass; use a supported project preview and retain that gate until observed. GET readiness checks establish configuration only, not successful provider output or visual quality.
