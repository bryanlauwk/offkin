# OFFKIN five-buyer pilot readiness

Scope: preserve the existing rich editorial design while turning interest into a reviewable project brief and a WhatsApp conversation. The source begins at verified GitHub main `89f22a946c6b076d7b65e5fbdb3800f8a5e2db38`; the local synthetic history is not a remote ancestor.

## Buyer journey

- Home explains collectible gifting for clients, teams and events. The approved headline and campaign phrases remain intact.
- While public AI access is paused, “Plan my project” opens a usable brief immediately. Showcase browsing and the optional saved brand-story composer remain available.
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

The intended five-invite package and protected backend setup require owner approval and independent security review before activation. Failed/disconnected provider attempts may count. A single-image revision is details-only or packaging-only; a broader redesign cannot be promised within that allowance. Existing legacy capability-link restore behavior is retained, not upgraded into authenticated private viewing.

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
2. Apply only the approved private schema/privileges with the campaign disabled. Run the isolated PostgreSQL verification pack for migration validity, role/grant denial, transaction rollback, replay, quota boundaries and genuine two-connection reservation/dispatch races. Structural or mocked tests are not a substitute. No real token issuance or activation is allowed until these results pass and are reviewed.
3. Only after that database gate, issue exactly five revocable invitations through the approved administrative route.
4. Merge/publish/deploy only with approval; inspect the exact resulting source for drift.
5. Verify public anonymous and legacy paid paths are blocked, restores still work, valid invite checks match quotas, and no unauthorized paid acceptance call is made.
6. Test actual phone browser, keyboard/focus, long fields, clear/revisit, WhatsApp opening and manual file attachment. Sending a real message still requires the tester's explicit action.
7. Review one real prototype before making physical-quality or delivery claims.

## Moderated buyer sessions

Use five relevant buyers with real gifting responsibility or a plausible near-term brief. A 20-minute session:
- Ask what they think OFFKIN offers after ten seconds, and whether the examples look like real products.
- Let them find a relevant study and plan their own project without explanation.
- Observe saving/downloading and the reviewed WhatsApp handoff.
- Ask what they expect next, then capture actual purpose/recipients, quantity, budget, date, decision-maker involvement and consent to a concrete next discussion.

Record comprehension, unassisted completion, wrong expectations, blockers, confidence and qualified next steps. The first two sessions diagnose blockers; remaining sessions verify corrections. Visual compliments alone are not commercial validation. Do not treat passing source tests as production or buyer-validation proof.

## Source verification recorded 2026-10-08

- Full Vitest suite: 1,499 tests passed across 54 files.
- TypeScript application and Node configs: passed.
- Production Vite build: passed; existing large-chunk advisory remains.
- ESLint: zero errors, eight pre-existing warnings in game/UI components.
- Mocked generation-contract CLI and git whitespace checks: passed.
- Independent source re-review: no remaining source-level paid-route, quota-bypass, cross-invite access/cache or credential-export blocker found after recovery fixes.
- Disposable database runner: Python syntax and help checks passed. No SQL or fixture was executed; PostgreSQL migration/role/concurrency verification remains required.
- No generated image requests, WhatsApp messages, database mutations, invite issuance, merge, publication or deployment occurred in this source pass.
- The chosen-hero image save is the simple phone handoff; HTML remains the accessible complete export. A raster PDF was assessed and deferred to avoid a multi-hour exporter/font/QA expansion. Real phone download, Files/gallery selection and manual WhatsApp attachment remain a post-publication test gate; a programmatic download click is not proof of saving or sending.

Phone-handoff size check: the existing selected 1536×1024 PNG hero is 2.60 MiB versus 15.23 MiB for its complete HTML brief. The ordinary-image export preserves the source bytes and has been inspected locally; no new concept image or provider call was made. Mobile browser download/attachment behavior is still not verified.
