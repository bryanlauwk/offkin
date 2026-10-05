# Historical rollout record

The current approved identity is OFFKIN｜异趣伙伴. This file preserves earlier DIORAMINI rollout history; see EDITORIAL_STUDIO_REDESIGN.md for the current source and release gates.

# DIORAMINI functional rollout

The homepage starts with one website field. It performs a no-AI website inspection, shows a clearly attributed excerpt when available, and asks the customer to confirm their business story. Four short conversation steps collect the story, miniature or diorama and audience, exact wording and placement, then style and meaningful optional interaction. Only the final Create action requests a generated concept. Display-only requests use Icon / Miniature; requested meaningful interactions use Inside / Miniature: the business process becomes the product, with a click only when it imitates a real action. Printing is outsourced initially. The admin route is removed from the public app because its previous client-side password was not real authentication; no account or database permissions are changed by that UI removal.

## Backend prerequisites

Apply the existing concept cache/rate-limit migration, the collectible edition migration, then `20260930093000_concept_website_sources.sql`. These create private concept storage, a private image bucket and the service-role-only atomic reservation function. Do not recreate credentials or weaken policies. Preserve existing tables/data. Source columns store only a public source URL/title; raw extracted page text is not persisted.

Deploy `generate-concept` with `index.ts`, `options.ts`, `prompt.ts`, and `website.ts`. Use existing platform-managed configuration. `BRICK_GENERATION_ENABLED` remains off unless setup and usage permission are confirmed. Do not create or expose an API key, enable top-ups, or change a plan as part of deployment.

## Readiness and paid checks

GET `/functions/v1/generate-concept` performs configuration/schema readiness checks without calling the AI provider, reserving quota, or generating a concept. A ready response establishes configuration/schema presence, not model/provider compatibility or successful generation. An authorized live generation is still required.

After authorized deployment, POST `{ "brand": "https://company.com", "inspectWebsite": true }` to test the pinned website reader without an AI call or image generation. This reserves an attempt only when daily limits are enabled and does not require AI activation. It must return a real source excerpt before automatic website-reading support is claimed.

After authorized deployment and usage approval:
1. Check GET readiness.
2. Test one public company website, confirm a business-specific story, image, and source link.
3. Reload its concept share URL; verify persistence and a fresh image URL.
4. Repeat the same request and verify cache reuse without new provider calls.
5. Use no more test generations or provider credits than explicitly approved.

## Website evidence and request boundaries

The website reader only accepts public HTTPS domains, validates DNS destinations and redirects, bounds time/bytes, rejects non-text media, and treats page content as untrusted evidence. It must fail closed if its pinned secure transport is unavailable in the deployed edge runtime; no unpinned fallback is acceptable. In that case the UI requests a short user-provided business summary and does not claim the website was read.

When daily limits are enabled, URL syntax is validated before a quota reservation. Other failed/ambiguous attempts, including blocked website reads, consume a reservation to bound anonymous outbound work. A fallback summary retry uses another of the three per-client daily attempts. In that mode the hard global cap is thirty attempts per UTC day; each attempt makes at most one text and one image request. The IP-derived client key is an abuse hint, not authentication. No automatic model retries are made.

Stop cancels browser waiting; backend calls use the request abort signal when propagated by the platform. Provider work already accepted may still finish and incur usage. The UI states this explicitly. New navigation cannot be overwritten by an old response.

## Verification

Run `npm ci`, `npm run build`, `npx tsc --noEmit -p tsconfig.app.json`, `npm test`, `node tests/generation-contract.mjs`, and `npm run lint`. Unit/contract tests mock paid providers; passing them does not establish live deployment. Existing Fast Refresh/hook lint warnings are non-fatal.


## Native Deno transport repair

The first hosted test proved Node-compatible `https.request` did not work in the target Deno runtime. The repair uses native `Deno.connect` to a validated literal address, then native `Deno.startTls` for the original hostname with normal certificate verification. A thin Duplex adapter feeds the official Node.js Undici 7.30.0 HTTP client, so HTTP framing is handled by its maintained parser rather than handwritten parsing. There is no generic-fetch fallback, custom production trust root, or disabled TLS check.

`tests/native-https-smoke.ts` exercises actual TLS locally using a disposable self-signed test fixture certificate. The production code does not accept certificate inputs. Generate a CA:false certificate for company.invalid outside the repo, then run the script with a Deno2.6 runtime and the cert/key paths. The tested Deno2.6.8 runtime passed success and rejection cases for certificate hostname, chunked bodies, oversized headers/body, compressed responses, cancellation, redirect preservation, conflicting framing, invalid chunks and truncated bodies. The exact target runtime still needs an authorized hosted inspectWebsite test; local success does not establish production readiness.

## Temporary testing waiver (owner requested)

Daily limits are temporarily waived by default in source. An absent `BRICK_ENFORCE_DAILY_LIMITS` or explicit `false` skips the reservation RPC entirely. Set `BRICK_ENFORCE_DAILY_LIMITS=true` in the backend runtime to restore the existing 3/client and 30/global daily caps. Unknown values also enforce caps. GET readiness reports `daily_limits_enforced`. No quota records are deleted, reset or modified while waived; tables and permissions are unchanged.

This endpoint is publicly reachable. A single intended tester is not access control: others can consume AI credits while the caps are waived. There is no aggregate spend ceiling in this mode. `BRICK_GENERATION_ENABLED` remains the independent kill switch; validation, public-address DNS pinning/TLS checks, size limits, timeouts, cache and the one-text/one-image-per-attempt limit remain. Restore daily caps before wider use. No automatic retries or extra test loops are introduced.

Git sync updates source only. The deployed backend retains its existing daily policy until an authorized function deployment applies this change. Verify readiness after deployment rather than infer live policy from Git.

## Conversation rollout and backward compatibility

Frontend source now uses DIORAMINI and the agreed headline. Legacy default site titles map to the new name; custom titles are preserved. No project/repository/domain/legal account rename is included. The result offers story, refine, save and share; no agency or internal-budget form is shown. Exact wording is retained verbatim in the conversation, JSON direction and downloaded concept. No artwork-upload control exists; customers bring finished artwork to design review. Image lettering is still confirmed before production.

The no-AI inspectWebsite call is supported by the existing deployed function. Ordinary unreadable sites already allow a customer context fallback. The new backend adds summaryOnly, which skips website retrieval after explicit customer confirmation, preserving URL syntax validation and all other safeguards. For an unsafe-address400 the frontend checks GET capabilities.summary_only before offering that fallback; old deployments without this capability ask for another public HTTPS homepage. No unsafe redirects are followed.

Deploying these Git changes is separately required to enable summaryOnly on previously rejected sites, new DIORAMINI generation prompts, and passing the original customer wording directly into the image prompt. Until deployed, the existing generator receives the complete customer direction as its supported context string, but the stronger new prompt rules must not be claimed live. No AI generation was used for local verification.

Original direction is kept per concept in this browser after successful creation, including verbatim lettering, for refresh and refinement. A shared concept opened on another device still restores the server-saved concept, but asks for the original design details again before a new version; it does not invent or claim to retain missing wording. Description-only and website-grounded generation have separate cache keys.

