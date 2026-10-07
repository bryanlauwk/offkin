# Customer identity and story mapping: local repair

Local candidate only. No provider calls, image generation/editing, DB writes, settings changes, push or deployment were performed. Public generation remains paused. Baseline is released commit `83f039e0f5ddd1ec1f3df0a81444d577deec140c`, tree `ee8474315df23cb1688e3abc13500491f2e80e4f`; the reviewed source was copied into a separate workspace and preserved unchanged.

## Cause and minimal authority

The existing proposal `brand` request field means a public website URL or `no-website`, not the customer's name. Business and brand-identifier fields contain arbitrary prose. A new world previously persisted the text model's `design.brand`; descendants then inherited that saved value. There is no deterministic, generic way to extract an exact customer name from every prose brief.

The additive `customerIdentity: {version: "customer-brand-v1", name: string}` field supplies that missing authority. Its name is bounded to 120 characters, nonblank and free of control characters; otherwise it is preserved exactly. A customer may use a real, fictional, project or concept name. There is no example-brand allowlist or name-extraction heuristic, and this field is not proof of licensing or uploaded artwork.

- New production worlds require the exact name before quota reservation or provider calls. An explicit saved identity can be inherited by a world revision; legacy worlds without one ask for it.
- The server replaces only the model's non-authoritative name with the explicit customer name before saving and rendering. Descendants use their actual saved world identity; a conflicting request must start a new world.
- The identity is included in manifests, source binding, cache identity, local versions, snapshot checks, text/image share review and request/response consistency checks. The exact capability `proposal_customer_identity_version` prevents a new client using an older backend.
- The compact exact-name input is independent of freeform story prose. A completed proposal's explicit name change starts a world-scope pending version; accepted assets remain intact until its complete dependency closure succeeds. The conversational revision planner cannot invent a replacement name.
- Historical metadata without this optional field stays readable. No existing saved row or image is renamed or edited. Legacy test adapters explicitly bypass the new-generation gate only inside tests; the production entry point unconditionally enables it.

## Bounded scenic assignment

New compilation accepts `construction-visual-v2`, with the same finite body/hero/retainer/four-optional-form roles and the same authored joins, operations and actions. Each part adds one bounded representation value:

- `support`: zero story IDs; the small rear retainer is always support-only
- `single-form`: exactly one story ID; the hero carries only its selected hero meaning
- `integral-cluster`: two or three distinct story IDs, each represented visibly within one proposed rigid dimensional cluster

Every selected meaning must appear exactly once. Repeated disconnected objects cannot be hidden as undeclared parts, and unrelated scenery must not be grouped merely to satisfy coverage. The prompt asks for more available authored forms before forced grouping and clarification if required placements cannot fit. The maximum remains six printed parts for static or seven for manual press/reveal; up to sixteen story meanings can fit as explicit bounded clusters. Nothing is dropped to make a graph pass, and no new mechanical relationship is inferred.

The strict ProductPlan validator is unchanged. Clusters are unverified visual-transfer proposals, not proof of connected pixels, printable geometry, assembly access or a working mechanism. Expressive WORLD imagery can retain rich dimensional storytelling. Its floating details or scattered scenic arrangements are physical-transfer risks; a physical rendering and later CAD/slicer/fit/prototype review still need to establish a valid reinterpretation.

Compiler and prompt revisions are bumped, and cache/consistency digests include the new assignment rules. Historical v1 visual choices, including formerly permitted support/scenic overlap, retain their original read-only parser. Retired compiler origins can be restored unchanged but cannot be silently recompiled for new physical generation.

## Verification scope

Only synthetic fictional examples are present in regression tests. Backend checks cover exact Unicode names, substituted/blank/null model names, malformed authority, zero-provider missing-name gates, identity-separated caches/source digests, immutable new-world renaming, descendant rejection, model/request bypass attempts, support-role misuse, overloaded/duplicate mappings, explicit clusters, all sixteen meanings, and historical v1 reading.

Actual endpoint tests replace only external provider/storage transports. No real image result, production acceptance or physical manufacturability is claimed. UI/session checks cover local persistence, partial and accepted versions, exact-name correction, response mismatch, share/import and legacy snapshots. Final aggregate results are recorded separately by the integration review.

The standalone strict backend check continues to report the same six inherited TS7053 string-index diagnostics in proposal-handler.ts/proposal.ts; this is not a clean strict-backend claim. Auth guards, private source lineage, the public hold, strict ProductPlan acceptance and old v9/v10 restores remain preserved.

## Supported configuration

Generation prompts are compiled source. Existing administrative controls manage site title/logo/link; they do not provide a runtime prompt editor. This repair does not create one, change settings, add persistent access or bypass a deployment approval. A separately authorized release and bounded live acceptance remain necessary before enabling public generation.

## Final frozen-source local checks

- `node_modules/.bin/vitest run --maxWorkers=2 --reporter=dot`: 1,192 tests passed across 37 suites, with the existing test timeouts unchanged
- An independent default-worker run also passed all 1,192 tests; the separate review passed 22 additional offline probes and verified an existing historical asset restores byte-for-byte without generation
- App and Node TypeScript checks passed: `tsc --noEmit -p tsconfig.app.json` and `tsc --noEmit -p tsconfig.node.json`
- `npm run build` passed; `npm run lint` passed with zero errors and the eight inherited warnings
- `node tests/generation-contract.mjs` passed with mocked services only
- Standalone strict backend diagnostics match the released baseline exactly after normalizing only checkout paths and line/column positions: six inherited TS7053 errors, no new diagnostics
- Public pause, strict ProductPlan, legacy canvas/config and the original reviewed source tree were independently compared and remain unchanged

A preliminary run overlapped in-progress frontend edits and is not the final result. A subsequent default-worker run under concurrent verification load reached 1,191 passes and one 5-second timeout in an untouched legacy UI test. That unchanged suite passed all 79 tests in isolation, then the frozen full bounded-worker run passed all 1,192. No timeout was increased and no test was skipped.

These checks do not include new browser acceptance, a real provider/image call, deployment or physical testing. The original observed artwork remains immutable. This is a verified local source candidate, not a released or manufacturing-validated product.
