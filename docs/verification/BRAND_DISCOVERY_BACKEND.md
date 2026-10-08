# Brand discovery: source-only implementation and acceptance gates

Status: local implementation with mocked transports. No migration was executed, no campaign or search flag was enabled, no token was issued or inspected, no search/model provider was called, and nothing was deployed. Source tests and mocked tests cannot establish database concurrency, RLS enforcement, live transport support, billable cost, or real brand quality.

## Public contract

`offkin-brand-discovery-v1` is a separate, invitation-authenticated action on `generate-concept`.

- `discover-brand`: `query`, either a public brand name (2–120 characters) or public company URL (maximum 300). Name spelling is preserved after outer whitespace trimming. URL normalization upgrades HTTPS and removes query/fragment data. Extra context, credentials, evidence, client enablement, and arbitrary fields are rejected.
- `select-brand`: `researchId` and `candidateId` UUIDs. A candidate must belong to this owned stored research. Optional `brandName` (1–120) is accepted only to clarify a URL-only identity. It cannot rename a typed-name query.
- `recover-brand`: exactly one of `researchId` or the original `query`. Exact-query recovery recomputes the invite-bound fingerprint and is useful after loss of the first HTTP response. Recovery never reserves or dispatches search, page reads, or models.

Response statuses: `ready`, `choose`, `needs-context`, `unavailable`. Every response contains a short message, `evidence` (maximum two directly read pages), and `candidates` (maximum five). Candidate fields are opaque ID, URL, title (160), and excerpt (1,200). Evidence has the same fields without ID. Ready responses include research ID, exact brand name (120), website (300), and directly sourced summary (80–1,600). Text and URLs remain untrusted source material, not verified ownership, instructions, licensing evidence, or manufacturing claims.

A name lookup becomes ready automatically only with one plausible non-social candidate, matching normalized exact name in result title and matching domain, followed by matching name in directly read title/excerpt and substantial readable text. This conservative rule can ask for a choice even when a human recognizes the source. Selecting a listed candidate explicitly confirms that source; it does not trigger another search. URL-only input asks for the exact name because the current reader exposes title/prose rather than reliable structured organization identity. No name is fabricated from a hostname.

## Bounds and tradeoff

Each invitation gets one research allocation, not one free search per different query. A URL-only query also consumes that allocation. Each research may dispatch at most one paid search and two distinct direct candidate-page reads. Search returns at most five results; no automatic query refinement, crawl, paid scrape fallback, extra model call, or provider retry exists. Redirects inside one direct-reader operation remain subject to the existing three-redirect ceiling; the budget counts reader operations, not raw HTTP hops.

Ambiguous search results are saved without eagerly reading arbitrary pages. The selected cached candidate may claim a read. A failed/blocked candidate cannot be read again, but a different cached candidate may use the remaining second read. A cached source may satisfy exact-name clarification without a second read. Ready research is immutable. A wrong first query, failed/uncertain dispatch, lost claim acknowledgement, or abandoned attempt is not refunded. Buyers need the UI warning before lookup, explicit saved-result recovery, and the independent factual-story fallback; there is no unlimited “retry search.”

The source migration reserves six maximum searches across distinct allocations: five buyer invitations plus one separate QA invitation. At the documented direct Firecrawl rate of two credits for 1–10 results, that is a maximum twelve search credits, excluding any unverified managed-connection billing difference. This is a proposed bound, not approval to spend.

## Gates and transport

All values below are server environment settings, never client fields.

- `BRICK_BRAND_DISCOVERY_ENABLED=true` permits new discovery work. Absent or other values disable it.
- `BRICK_BRAND_SEARCH_ENABLED=true` separately enables configured name search.
- `BRICK_BRAND_SEARCH_PROVIDER=firecrawl-direct-v2` uses an existing non-`lovc_` Firecrawl key and the documented direct endpoint.
- `BRICK_BRAND_SEARCH_PROVIDER=firecrawl-gateway-v2` additionally requires an existing `lovc_` Firecrawl connection key, existing Lovable key, and `BRICK_BRAND_SEARCH_GATEWAY_APPROVED=true`. This flag authorizes use of the provisional mapping after separate approval; it does not assert that the route has been verified live.
- No missing route, missing key, unrecognized provider or missing approval falls back to another provider or endpoint.
- URL discovery uses the pinned native public-page reader and never the paid Firecrawl scrape fallback.
- Both query modes require the active server-validated pilot invitation, regardless of public-generation hold state.

The direct request is one POST to `https://api.firecrawl.dev/v2/search`, with only a bounded quoted brand-name query plus “official website”, `limit:5`, `sources:["web"]`, `timeout:10000`. `scrapeOptions` is absent. The adapter accepts only `success:true` and `data.web` items with URL/title/description; the response body is capped at 256,000 bytes. The provisional gateway mapping is `https://connector-gateway.lovable.dev/firecrawl/v2/search` with the repository’s existing two-key gateway header convention. No official documentation retrieved for this task established that precise gateway route.

Search URLs must pass public HTTPS URL and all-public DNS checks before being saved/displayed or selected. Every direct page read repeats URL/DNS validation and pins transport to a verified public IP with original Host/TLS identity. Redirect destinations and final source URLs are revalidated. The existing direct reader supplies its 10-second deadline, 2 MB body ceiling, and no executable content. Discovery caps persisted excerpts further to 1,200 characters. Provider/page text is stripped of markup and controls; generation treats it as untrusted data.

GET status exposes `brand_discovery:{version,enabled,configured,verification:"configuration-only"}` plus bounded capability metadata. It does not contact a provider, claim that the gateway works, or establish deployed readiness.

Provider references reviewed for the source proposal:
- https://docs.firecrawl.dev/api-reference/endpoint/search
- https://docs.firecrawl.dev/features/search
- https://docs.lovable.dev/integrations/firecrawl
- https://docs.lovable.dev/integrations/security

## Atomic ledger and recovery

The new migration leaves the original pilot migration unchanged. It adds a separate disabled/unissued one-seat QA campaign (5 images, 6 generation text attempts, 24-hour invite lifetime). The five buyer seats retain their existing 25/30 aggregate generation bounds and 336-hour lifetime. Campaign kind is immutable and unique. No bearer credentials are stored.

Research table access and every new RPC are server-only: RLS enabled, no client policies, fixed `pg_catalog` search path, invoker functions, no delete/truncate grant. One research row per invite plus campaign counters reserve maximum lifetime liability before dispatch. All mutating RPCs lock campaign → invite → research and recheck enablement, campaign expiry, invite expiry, revocation, ownership, and expected numeric version.

- `reserve_pilot_brand_research` atomically admits the invite-bound query fingerprint or returns existing state without dispatch permission. Another query is consumed/denied.
- `claim_pilot_brand_dispatch` compare-and-sets the unique search claim or a distinct cached candidate’s read claim. Acknowledgement authorizes one dispatch, never a renewable lease. A lost acknowledgement consumes the step without provider dispatch from this handler.
- `save_pilot_brand_research` compare-and-sets a bounded payload after processing. Candidate identities/URLs and cached sources cannot be swapped. Only the active claimed candidate gains a source; typed-name identity remains fixed. Ready result binding is immutable.
- `get_pilot_brand_research` is read-only and has no reservation/claim route. It rechecks active ownership and returns completed payload or unresolved state. Exact ID-only legacy concept restoration remains unchanged and separate.

If save acknowledgement is lost after the database commits, explicit recovery returns the saved result. If persistence genuinely failed after dispatch, the row remains unresolved and no read/search repeats. Revocation/expiry during processing can prevent save, intentionally leaving spent liability unresolved. Existing complete proposal images are untouched.

## World generation

Only a world `ProposalRequest` may contain `brandResearchId`, with an exact `customerIdentity`. Every website-backed private-pilot world requires owned research; omission is rejected before cache/source reads or provider reservation, closing the older unmetered direct-reader path. Manual factual-story generation must use `no-website` and performs no website fetch. Before any model reservation, the server resolves active owned ready research and compares the brand and source URL exactly. It supplies the cached direct evidence as `websiteEvidence`, skips duplicate website retrieval, and binds an evidence digest/version into the generation cache identity. The research UUID does not enter model prompts or public manifests. Later stages inherit the actual saved world as before. The independent exact-name/manual factual-story path still works without research.

## Verification completed locally

- Pure request/response and URL/name validation, provider configuration gating, search request shape, response bounds.
- Name auto-resolution, ambiguity without eager reads, explicit selection, URL name clarification, failed-page fallback, wrong-query consumption.
- Duplicate submissions, lost claim/save acknowledgement, failed persistence, explicit query recovery, ownership/revocation boundaries, two-read cap.
- Real endpoint invitation/default-off/configuration-only boundary, with mocked database and forbidden real fetch.
- Owned research → world evidence forwarding, no duplicate read, cache digest binding, no research UUID leakage, preserved manual path.
- SQL source-policy tests for allocation, immutable lifetime/counters, lock ordering, CAS, payload/source binding, read-only recovery, grants, and disabled QA seed.

The database verification fixture now requires both ordered migrations and filters buyer mutations explicitly. It is still source-only. Before any protected database run, the separately reviewed execution packet must add concrete transaction/RLS tests for concurrent same-query admission, competing queries, five-buyer and one-QA seat/budget separation, duplicate search/read claims, distinct-candidate read cap, lost acknowledgements, candidate/source substitution, revocation/expiry races, and owner/cross-invite recovery. Do not infer those tests passed from the mocked ledger or source string checks.

## Remaining acceptance gates

Separate approval is required for protected schema execution/setup, appropriate existing connection configuration, the bounded billable QA lookup/generation test, deployment, and buyer activation. Confirm the actual gateway route or use an already-authorized existing direct credential route; do not inspect credential values or create new grants to do this. Keep buyers disabled during provisional QA. Verify real Stive Asia discovery and direct evidence, generated world → conditioned physical → details → packaging imagery, ownership/restoration/recovery, and interrupted flows against the exact deployed source. Revoke the QA invite immediately after the authorized test, including failure. One QA allocation provides no automatic retry entitlement.
