# OFFKIN five-buyer pilot readiness

Scope: one brand-name or website input, evidence-based discovery, a rich collectible-led preview, then a design-proposal request and WhatsApp conversation. Preserve the existing editorial visual language and privacy protections. The source begins at verified GitHub main `89f22a946c6b076d7b65e5fbdb3800f8a5e2db38`; the local synthetic history is not a remote ancestor.

## Buyer journey

- Home uses “Your brand. Made collectible.” with one concrete explanation of gifting, launches and display. Three example studies sit immediately beside the entry, separate from customer work. Repeated campaign slogans and duplicate process sections are removed.
- An invited buyer enters a brand name or URL and explicitly chooses “See my concept”. Online discovery uses source evidence, with a small follow-up only for ambiguous or insufficient identity. A factual manual-story fallback is clearly distinguished from research. Audience, quantity, budget and date do not block the preview.
- Public visitors can explore the studies, open their invitation, or prepare a design enquiry. Online search and paid generation remain server-gated.
- The illustrated world appears while its dependent collectible is made. The actual collectible becomes the main result immediately, with an adjacent proposal request; details and packaging follow automatically. No additional image is invented or inferred from a crop.
- Showcase enquiries carry the chosen study as inspiration only. They never copy its identity, images or story into a buyer's generated proposal.
- Corporate and personal paths share the initial idea step. One-off availability is explicitly unconfirmed.
- Quantity, ideal in-hands date, total/per-piece budget with currency, size/display setting and contact are progressive, optional inputs. They do not constrain the creative preview.
- The process distinguishes a concept preview, agreement on design/build proposal, real-prototype approval and an agreed production plan. Design/prototyping and unit-production costs are separate. No prices, minimum order, production capability, response SLA or delivery promise is invented.
- Showcase studies are AI concepts with no physical prototypes shown. Real prototype evidence is still a future commercial proof requirement.

## Enquiry and privacy

The owner-selected destination is WhatsApp `+60 14-930 3546`. The handoff follows WhatsApp's documented international-number and encoded-message format: https://faq.whatsapp.com/5913398998672934/

A buyer reviews the exact short message before opening WhatsApp. It contains project type, brand/project, quantity, budget, timing and optional study inspiration. Detailed story/notes, contact fields and original proposal metadata are not silently copied into the URL. Links and UUIDs pasted into short fields are removed from the message. Opening WhatsApp does not prove sending, delivery or receipt.

Generated images are not attached by a WhatsApp link. For the phone-friendly primary handoff, buyers save the actual chosen collectible hero as an ordinary PNG/JPEG/WebP file and attach it themselves in WhatsApp. This uses the same private-source, signature, byte, decode, timeout and cancellation checks as the full export and preserves the original image bytes. A failed save is explicit; buyers can knowingly continue with text and no image. The complete self-contained HTML request remains the secondary detailed attachment with all four available views, chosen context/selections and notes. Partial image exports remain explicit; text-only first enquiries are labelled as intentional text-only briefs. No send or order success is fabricated.

Buyer fields remain in browser localStorage, separately from proposal-share data. The UI discloses shared-device persistence and offers explicit clear. Storage failures retain visible in-memory fields through repeated close/reopen and offer a download; they do not claim successful saving. Clearing enquiry fields does not delete generated concepts or prior downloaded files.

## Invite access

The public source hold remains. Invite-only generation requires a separately validated server access contract. The frontend accepts an opaque code or same-origin fragment invitation link, immediately removes an imported fragment from the route, and keeps the credential only in memory. It sends the credential in a dedicated HTTPS header, never in localStorage/sessionStorage, ordinary proposal-share URLs, exports or restoration requests.

Read-only access checks do not generate images. Quotas and expiry come from the server. An invitation is a bearer allocation and can be forwarded; it is not proof of a verified buyer identity. Reloading requires the original invitation again.

The current ledger grants one attempt per initial stage (world, hero, details, packaging) and one narrow revision. It is not a flexible five-attempt retry pool: a consumed failed stage can block later slots. The UI identifies blocked attempts and provides saved-output recovery or an owner-help route. Adding a new counted retry would require a separately reviewed change; no quota refund or ambiguous redispatch is implemented.

The five-invite package remains subject to the database/security release gates. The added research and separate QA allocation require their specifically approved scope before activation. Failed/disconnected provider attempts may count. A single-image revision is details-only or packaging-only; a broader redesign cannot be promised within that allowance. Existing legacy capability-link restore behavior is retained, not upgraded into authenticated private viewing.

## Online discovery and separate QA

The source adapter supports an existing direct Firecrawl connection or an explicitly approved managed gateway mapping. Search transport is not yet live-verified. All activation flags default off. Name discovery allows one search per allocation, up to five results, with no paid scraping, automatic retry, search refinement or extra research-model call. At most two bounded native website reads supply factual evidence. Website-backed private generation requires the owned ready research record and reuses it; omission cannot bypass the read ledger. Only no-website manual stories can generate without research.

The five buyers retain their 25-image/30-text total. The separately bounded QA allocation allows one “Stive Asia” lookup, up to five image attempts and six supporting text calls, expires within 24 hours and must be revoked after verification. Total discovery ceilings are six searches and twelve native page reads across buyer and QA allocations. Failure and uncertain dispatches count. Search billing is provider-dependent; request caps are not a fixed currency bill. Source contracts and exact provider limitations are documented in `BRAND_DISCOVERY_BACKEND.md`.

Sources persist with the local preview and detailed brief, while the private research lookup handle is excluded from ordinary sharing and exports. Recovery of a saved lookup never starts a new search or automatically starts image generation. A buyer explicitly continues from recovered research.

## Verification and release gates

Record exact final test totals and head SHA in the PR after all source changes and independent review.

Automated scope includes:
- Empty, corporate and personal brief; back, close, remount and clear
- Malformed/oversized persisted values and denied/full storage
- Double-click, cancellation, Escape, replacement context and stale export suppression
- Explicit partial visual downloads and intentional text-only downloads
- Original concept/selection/notes/lineage and private image export protections
- WhatsApp recipient/encoding/review and no real communication
- Invite import cleanup, memory-only storage, old-backend rejection, expiry/quota contracts and credential-free restore
- CSS contracts at 320, 375 and 414 pixels, touch targets, 16px inputs, focus visibility and primary/help-text contrast

Interactive unpublished QA is not established. The permitted cloud browser cannot reach the native workspace's localhost preview; the prior engineer verified the same environment limit. No alternative browser automation or security-setting workaround is used. DOM/CSS tests are not a claim of actual iPhone/Android behavior or mobile keyboard testing.

Before buyer invitations are sent:
1. Review the exact source and security migration, approve activation scope and bounded spending.
2. After explicit approval for the connected-database test target, run the independently reviewed isolated-schema fixture packet. It must cover both migrations, actual roles/grants, rollback, buyer/QA separation, search/read caps, replay and observed overlapping-session reservation/dispatch races. Use only synthetic fixtures and enumerated RESTRICT cleanup; never apply the destructive disposable-database reset to an existing database. Structural or mocked tests are not a substitute.
3. Apply the reviewed protected production schema with buyer access inactive only after the database gate passes. Issue the separately authorized QA allocation, and merge/publish/deploy within the approved single deployment request. Inspect exact deployed source for drift.
4. Perform the explicitly authorized real “Stive Asia” lookup and full four-image generation, one narrow revision if allowed, pixel/lineage review, restore/recovery and enquiry/download/handoff checks. Report actual request usage and any provider billing evidence. Revoke QA immediately afterwards.
5. Verify anonymous and legacy paid paths remain blocked and old saved restores work. Only after all gates pass, create and activate exactly five buyer allocations and privately deliver their links to the owner. Do not spend their allowance on QA.
6. Test actual phone browser, keyboard/focus, long fields, clear/revisit, WhatsApp opening and manual file attachment. Sending a real message still requires the tester's explicit action.
7. Review one real prototype before making physical-quality or delivery claims.

## Moderated buyer sessions

Use five relevant buyers with real gifting responsibility or a plausible near-term brief. A 20-minute session:
- Ask what they think OFFKIN offers after ten seconds, and whether the examples look like real products.
- Let them find a relevant study, enter their own brand, inspect its evidence and generated collectible, then request a proposal without explanation.
- Observe saving/downloading and the reviewed WhatsApp handoff.
- Ask what they expect next, then capture actual purpose/recipients, quantity, budget, date, decision-maker involvement and consent to a concrete next discussion.

Record comprehension, unassisted completion, wrong expectations, blockers, confidence and qualified next steps. The first two sessions diagnose blockers; remaining sessions verify corrections. Visual compliments alone are not commercial validation. Do not treat passing source tests as production or buyer-validation proof.

## Verification status

The streamlined revision passed 1,600 tests across 61 files. Application/Node TypeScript checks, production build, mocked generation-contract CLI and whitespace checks passed; ESLint has zero errors and eight pre-existing warnings. Independent source reviews covered the new backend boundary and the frontend recovery, provenance and progressive hero-handoff paths. The final remote head is recorded in the pull request. These are source/mocked checks, not live-provider or database verification.

Neither migration has passed complete PostgreSQL runtime verification. The first isolated rollback-capture attempt exposed a PL/pgSQL conditional CASE syntax error; the corrected source needs reviewed replay and independent namespace-absence verification. A supported isolated runtime could not create its Unix socket, and no security workaround was attempted. The changed existing-database fixture target requires its own approval and reviewed packet. No real token, provider call, migration, merge or deployment is implied by passing local tests.

The chosen-hero image save remains the simple phone handoff; HTML is the complete detailed export. A PDF was assessed and deferred. An existing inspected 1536×1024 PNG hero is 2.60 MiB versus 15.23 MiB for its complete HTML brief. The ordinary-image export preserves the source bytes. Actual phone download, gallery/Files selection and manual WhatsApp attachment remain production acceptance gates.
