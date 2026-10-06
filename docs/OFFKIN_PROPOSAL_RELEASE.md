# OFFKIN complete generated proposals

## Outcome and version boundary

The root switches to `ProposalStudio` only when the deployed backend advertises the verified v10 reference-image capability. Until then it preserves the earlier working canvas with a clear two-image-only notice. `?proposal=1` and `#proposal=` links remain available for read-only saved-proposal access during an outage. The user supplies their own URL or idea, answers one optional audience question, and explicitly chooses **Generate my proposal**. That action discloses four generated images and orchestrates four independently persisted stages:

1. A rich illustrated brand world
2. A physical hero using actual saved world pixels as a reference
3. A components/interaction sheet using actual saved physical pixels
4. A packaging study using the saved physical hero and world artwork

These are new customer-specific images. Reference-brand pictures, stories, IDs and selected elements never populate a new proposal. Each image is shown whole. No hero crops pretend to be separately generated components, and no product views or construction diagrams are fabricated.

The backend contract is `offkin-proposal-v10`, separately negotiated with `proposal_reference_images: true`. The existing v9 generation and restoration contracts remain unchanged. The v9 UI is still accessible at `?canvas=legacy` and `#world=` links route there. Earlier v8 concept links retain the legacy reader.

## Natural-language revision

**Update proposal** is an explicit text-planning and generation action. The server validates a bounded resolved context and allowed scope. It preserves exact wording unless explicit replacement/removal evidence is present. For component changes it validates selection, hero and replacement edits against the saved world.

- World/story changes rebuild all four stages
- Physical/component/interaction changes preserve the illustrated world and rebuild physical, details and packaging
- Packaging-only changes preserve the world, physical and detail IDs and generate only packaging

Prior same-role images join the reference list during revisions. Accepted imagery stays visible while the next complete version is generated. It is replaced atomically, avoiding a mixed old/new proposal. An ambiguous request asks one short clarification without generating images.

## Recovery, lineage and privacy

Each completed stage saves immediately. A failed or cancelled stage leaves the pending version intact; **Continue proposal** skips every completed stage. Stop and navigation abort the current client request and prevent late results from advancing another stage. A provider request already started can still use credits. Cache identity is deterministic, but there is no server reservation/deduplication lock, so exactly-once generation or billing is not promised.

Device-local sessions contain the current brief, bounded conversation, accepted version and pending version. Narrative snapshots omit signed image URLs. Explicit restore refreshes image access without generating or checking generation readiness. Image load failures never substitute reference artwork.

Sharing remains text-only by default, omitting conversation history and image IDs. Image sharing is a separate opt-in requiring review of every accepted asset’s original context, story and design and an anyone-with-link warning. IDs have the existing private capability-link behavior. Signed storage URLs are never encoded in shares. Public responses omit earlier-version capability IDs and expose only current world/physical dependencies. Full revision ancestry remains in the private server manifest, so shared current metadata cannot be traversed into unreviewed earlier versions. Opening a shared proposal requires review and creates an independent local version.

The existing private bucket, RLS, admin/auth controls, pinned URL reader and owner-approved daily-limit waiver are unchanged. No new credentials, account permissions, subscriptions or purchase flow are introduced. Brief download is retained; the submission destination remains undecided.

## Gateway verification gate

World generation uses `images/generations`. Reference-conditioned assets use `images/edits` with an ordered JSON `images` list containing data URLs built from validated saved private storage bytes. The server never accepts arbitrary image URLs or falls back to text-only generation after an edit failure.

Upstream OpenAI documents this JSON edit request. Lovable documents GPT Image 2 image editing but does not publicly document the exact gateway edit wire format. Consequently, the route remains an explicit live integration gate. `BRICK_PROPOSAL_ENABLED` must only be enabled as part of the authorized deployment and bounded verification after the configured gateway route is established. A readiness GET is not visual or end-to-end acceptance.

## Release checks

Local tests cover four-stage orchestration, no implicit generation, actual source IDs, packaging-only revisions, dependency closure, accepted-version preservation, double clicks, cancellation, stale navigation, partial retry, restore, privacy defaults, reviewed share branches, API negotiation and backend contracts. Existing v8/v9 tests are retained.

Run final TypeScript, complete Vitest, lint, build and legacy mocked generation contract checks. Then obtain independent code review before merge. Verify the exact published commit and deployed v10 capability. The approved live test budget is four fresh proposal images plus up to two revision/retry images, using existing credits only. Every paid attempt must be counted conservatively; no top-ups, plan changes or additional paid agent request are authorized by this release document.

Public acceptance still requires actual world-to-physical continuity, component/interaction and packaging consistency, a real packaging-only revision, saved restore, share/branch, desktop and narrow/mobile layout and a truthful download. Unit fixtures cannot establish provider quality, working mechanisms, exact typography or production readiness.
