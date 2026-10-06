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

World generation uses JSON `images/generations`. Reference-conditioned assets use `images/edits` with multipart `FormData`: string fields `model`, `prompt`, `n`, `size` and `quality`, plus ordered, repeated `image[]` file parts built from validated saved private storage bytes. Fetch supplies the multipart boundary; the application never sets a multipart `Content-Type` header manually. File names contain only reference positions, not capability UUIDs. The server never accepts arbitrary image URLs or falls back to text-only generation after an edit failure. Edit cache identity uses `openai-multipart-edits-v2`.

The first authorized gateway probe rejected JSON edits with HTTP 400 requiring multipart form data and a model field; it produced no image. The multipart file-field name follows the [official OpenAI Images Edit HTTP example](https://developers.openai.com/api/reference/resources/images/methods/edit). A subsequent live run successfully generated and privately persisted all four roles through the corrected transport, and the v10 flag was enabled for that controlled test. Transport verification is established; the revised v3 art direction, constrained revision planning and public UI acceptance are separate remaining checks. A readiness GET is not visual or end-to-end acceptance.

## Release checks

Local tests cover four-stage orchestration, no implicit generation, actual source IDs, packaging-only revisions, dependency closure, accepted-version preservation, double clicks, cancellation, stale navigation, partial retry, restore, privacy defaults, reviewed share branches, API negotiation and backend contracts. Existing v8/v9 tests are retained.

Run final TypeScript, complete Vitest, lint, build and legacy mocked generation contract checks. Then obtain independent code review before merge. Verify the exact published commit and deployed v10 capability. The original four-image-plus-two-retry allowance is historical. Follow the latest explicitly approved remaining deployment/image budget and its live execution ledger; this document grants no spending authority. Count every paid attempt conservatively. No top-ups, plan changes or additional paid agent requests are authorized by this document.

Public acceptance still requires actual world-to-physical continuity, component/interaction and packaging consistency, a real packaging-only revision, saved restore, share/branch, desktop and narrow/mobile layout and a truthful download. Unit fixtures cannot establish provider quality, working mechanisms, exact typography or production readiness.


## Follow-up reliability and art-direction repair

The first live four-image run verified the multipart transport and persisted four matching 1536×1024 assets. Visual review found a plaque-like physical translation, close-up-style component panels, unrequested copy and packaging variants. A packaging-only planner response also tried to modify a protected physical field; the server rejected it and no revision image was generated. These are observed limitations of that test run, not passing visual acceptance.

The revised art direction requires spatially reinterpreting the illustrated world as a fully dimensional collectible by default, complete isolated story components and one requested packaging design. Scale remains story-led, and display-only concepts remain static. Supplied or source-grounded brand identity is distinguished from invented microcopy; exact wording still requires artwork proofing. Prompt revisions have their own cache discriminator so existing saved manifests remain readable. New prompt quality must be verified with new images.

The planner now requests sparse context patches; packaging-only plans may alter revisionNotes only. The existing server checks still reject out-of-scope world or physical changes. If a packaging plan is rejected for changing physical settings, the interface asks for explicit packaging-only confirmation. Only that confirmation prepares a bounded packaging request, preserving all accepted fields except the exact new revision instruction, and preserving the world, physical and component asset IDs. Dismissal, navigation, Stop and late responses do not silently generate or replace an accepted version. Clarification context is cleared after recovery and restore.

Website inspection now retains a hard 2,000,000-byte ceiling for modern public HTML pages, including the observed approximately 1.25 MB Tesla homepage. DNS/IP pinning, TLS verification, blocked private addresses, redirect validation, identity encoding, timeouts and bounded text extraction remain in place. Safe typed failures distinguish oversized, timed-out, blocked and unsupported pages without displaying arbitrary upstream error text. A real deployed Tesla read remains a release check; local fixtures are not proof of its deployed network behavior.
