# BRIQ2.0 functional rollout

The homepage starts with one website field. Story and format options appear only after a concept, under refinement. The default remains Everyday / Clicker pending a product-direction decision. The admin route is removed from the public app because its previous client-side password was not real authentication; no account or database permissions are changed by that UI removal.

## Backend prerequisites

Apply the existing concept cache/rate-limit migration, the collectible edition migration, then `20260930093000_concept_website_sources.sql`. These create private concept storage, a private image bucket and the service-role-only atomic reservation function. Do not recreate credentials or weaken policies. Preserve existing tables/data. Source columns store only a public source URL/title; raw extracted page text is not persisted.

Deploy `generate-concept` with `index.ts`, `options.ts`, `prompt.ts`, and `website.ts`. Use existing platform-managed configuration. `BRICK_GENERATION_ENABLED` remains off unless setup and usage permission are confirmed. Do not create or expose an API key, enable top-ups, or change a plan as part of deployment.

## Readiness and paid checks

GET `/functions/v1/generate-concept` performs configuration/schema readiness checks without calling the AI provider, reserving quota, or generating a concept. A ready response establishes configuration/schema presence, not model/provider compatibility or successful generation. An authorized live generation is still required.

After authorized deployment, POST `{ "brand": "https://company.com", "inspectWebsite": true }` to test the pinned website reader without an AI call or image generation. This uses one request reservation but does not require AI activation. It must return a real source excerpt before automatic website-reading support is claimed.

After authorized deployment and usage approval:
1. Check GET readiness.
2. Test one public company website, confirm a business-specific story, image, and source link.
3. Reload its concept share URL; verify persistence and a fresh image URL.
4. Repeat the same request and verify cache reuse without new provider calls.
5. Use no more test generations or provider credits than explicitly approved.

## Website evidence and request boundaries

The website reader only accepts public HTTPS domains, validates DNS destinations and redirects, bounds time/bytes, rejects non-text media, and treats page content as untrusted evidence. It must fail closed if its pinned secure transport is unavailable in the deployed edge runtime; no unpinned fallback is acceptable. In that case the UI requests a short user-provided business summary and does not claim the website was read.

URL syntax is validated before a quota reservation. Other failed/ambiguous attempts, including blocked website reads, consume a reservation to bound anonymous outbound work. A fallback summary retry uses another of the three per-client daily attempts. The hard global cap remains thirty attempts per UTC day; each attempt makes at most one text and one image request. The IP-derived client key is an abuse hint, not authentication. No automatic model retries are made.

Stop cancels browser waiting; backend calls use the request abort signal when propagated by the platform. Provider work already accepted may still finish and incur usage. The UI states this explicitly. New navigation cannot be overwritten by an old response.

## Verification

Run `npm ci`, `npm run build`, `npx tsc --noEmit -p tsconfig.app.json`, `npm test`, `node tests/generation-contract.mjs`, and `npm run lint`. Unit/contract tests mock paid providers; passing them does not establish live deployment. Existing Fast Refresh/hook lint warnings are non-fatal.
