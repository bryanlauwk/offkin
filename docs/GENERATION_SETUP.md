# OFFKIN co-creation v8 (draft source, October 6, 2026)

These notes supersede the historical flow and prompt descriptions below. This change is source-only: it does not deploy a function, run a migration, publish the site, change credentials or invoke paid generation. Passing offline tests does not establish live provider quality or typography accuracy.

## Frontend/backend negotiation

- Source prompt and request contract version: `offkin-cocreation-v8`. Every new co-creation generation POST must contain `contractVersion: "offkin-cocreation-v8"`.
- A read-only GET must return HTTP 200, `ready: true`, `prompt_version: "offkin-cocreation-v8"`, `capabilities.cocreation: true`, and `capabilities.context_max_chars: 6000`. Electronic exploration also requires `capabilities.electronic_story_scene: true`.
- `supportsCoCreation(signal)` drives frontend availability. `requestConcept` repeats this check immediately before a v8 POST, even if the screen checked earlier. Missing, malformed, disabled, v7, future-version or aborted responses fail closed. No new generation POST is sent, and the brief can be kept/downloaded for design review.
- Never silently truncate a brief or downgrade a new direction to the live v7 contract. A source commit or GitHub sync does not activate the new backend. Deploy only after explicit approval, then confirm the GET response before enabling new image generation.
- Readiness verifies configuration and the existing storage schema only. It is not a successful provider test, proof of a working electronic object or a production-readiness claim.

## Bounded co-creation input

The `brand` website/identifier input is bounded to 2–300 characters, matching the frontend website field; existing public-URL validation still applies. The `context` remains a JSON-encoded string, now with a maximum of 6,000 JavaScript UTF-16 code units including its JSON envelope. Frontend and backend use the same limit. The whole request is streamed with a 48,000-byte cap, allowing bounded Unicode and JSON escaping without the old 3,000-character body restriction. Oversize requests are rejected, never shortened.

The v8 context is a flat JSON object with known string-valued fields:

- `business`, `hiddenDetail`, `angle`, `item`, `audience`
- `exactWording`, `placement`, `style`, `interaction`
- `mode` (`mechanical` or `electronic`; absent means mechanical)
- `scale`, `brandIdentifiers`
- Optional design-review extensions: `materials`, `avoid`, `revisionNotes`

Unknown fields, nested values, arrays, non-string fields and unknown modes are rejected. Whitespace, line breaks, case, punctuation and Unicode in the original context and exact wording pass through unchanged to both provider prompts. This is an input-preservation guarantee, not a claim that an image model renders perfect lettering. Artwork proofing remains necessary. The website reader has a separate 6,000-character evidence-excerpt cap; it does not truncate customer context. Generated response summaries keep their existing display/storage bounds, while the original customer direction is included independently in the image prompt.

The new UI sends its expanded choices through `item`, `style`, `interaction`, and `scale`; for example Scene in a frame, Illustrated & surreal, Slide to discover, and Let the story decide. `brandIdentifiers` describes supplied product shapes, materials, colours, gestures or rituals. This is a text-only contract: it does not accept logo/image uploads or imply that an asset is available. Website text is evidence, not print-ready logo artwork.

Legacy requests without `contractVersion` retain the existing 600-character context limit and default mechanical mode. Existing website-inspection and saved-concept requests stay available. The persisted `edition` and `format` enums remain unchanged (`icon|hero|inside|everyday`, `bricks|miniature|clicker`); expanded forms refine the miniature direction within context, avoiding a schema migration. Icon/clicker remains invalid. Explicit electronic studies still require Inside/miniature.

## Creative and prototype boundaries

- One coherent story and hero object, with at most one or two meaningful actions. Actions are optional; display-only remains static.
- Use supplied business details and brand identifiers to shape the object. A proposed story lens is not proof of a founding story or customer habit. Do not invent facts, logo assets, a verified palette or unrequested lettering.
- Story-specific silhouette, composition, material finish, lighting and framing replace the fixed warm-ivory catalogue template. A separate pedestal is optional, never the universal format. Expanded art directions should materially change the object and image.
- Dimensions follow story, intended placement, construction and exploratory cost. There is no universal palm-size ceiling. Reuse hidden internals, connectors or mechanism patterns when suitable while keeping outer forms story-specific.
- Mechanical mode has no powered electronics. Electronic mode is an explicitly selected exploration: respect a chosen click, turn, slide or display-only preference rather than replacing it with a button/screen/LED package. Any requested USB-powered response and sensing/control need separate validation; static display can omit electronics. No motors, cameras, microphones, heating, food use or actual working industrial machinery.
- A short cloud reply is optional only when requested and bounded to 160 characters per deliberate activation, with content scope, request limits and a scripted fallback to validate. No promised Muse integration, existing API access, autonomous operation or unrestricted conversation.
- Start with a few outsourced printed samples to validate appearance, physical performance, assembly and cost. No render establishes dimensions, tolerances, stability, firmware, electrical safety, hardware availability or manufacturability.
- RM100–500 remains an exploratory budget range pending actual sample and print quotes, not a fixed floor, ceiling, product price or promise every design fits. Design, electronics, firmware and cloud services are scoped separately.

## Data, safety and deployment

- The safe public-site reader, SSRF guards, RLS and private image bucket are unchanged. Summary-only requests skip website fetching without allowing malformed addresses. Website content remains untrusted source material.
- Daily quotas retain the existing temporary owner-requested waiver. `BRICK_ENFORCE_DAILY_LIMITS=true` restores limits; unknown non-false values fail closed. This change does not alter the kill switch, quota database or provider credentials.
- Cache keys include v8 prompt version, explicit contract/legacy mode, full unchanged context, source mode, website and persisted selection. New directions cannot reuse v7 imagery. Raw customer context and exact wording are not added to persisted rows.
- Saved concept UUID links retain their existing behavior: anyone with the link can view that result through a fresh one-hour image URL; there is no public listing endpoint or automatic gallery inclusion.
- Existing admin title/logo controls remain authoritative. No migration, production configuration change or external publication is part of this source change.

Offline checks: `npx vitest run src/lib/generate-concept-prompt.test.ts src/lib/concept-api.test.ts`, `node tests/generation-contract.mjs`, and `npx tsc --noEmit -p tsconfig.app.json`. The contract script runs the real handler against fake provider/database/storage services and makes no paid calls. A separately authorized live test after backend deployment is still necessary.

## Historical setup and earlier product directions

The rest of this file contains older rollout notes. Read their dated descriptions as historical, not as the current frontend or live-deployment status.

# Brand concept generation — activation

Status: frontend and backend implementation complete; backend not deployed or provider-tested in this change. The connected Lovable workspace rejected the build/deployment request because it was out of credits. GitHub sync alone does not deploy an Edge Function or run a migration.

## Activate in the existing Lovable project

Project: cecfbbf4-68b9-4b30-913e-320f26d0feb7
Supabase project: cpmksomijohojpdxedzt

When build credits are available, ask Lovable:

> Apply the existing migration 20260928040000_brick_concepts.sql and deploy generate-concept from this repository. Enable this project's built-in AI connector and its managed LOVABLE_API_KEY. Verify the gateway model IDs and image response format against the current integration: chat/completions with BRICK_TEXT_MODEL (default google/gemini-3-flash-preview), images/generations with BRICK_IMAGE_MODEL (default openai/gpt-image-2), returning data[0].b64_json. Set BRICK_GENERATION_ENABLED=true only after backend setup. Test one new brand such as NVIDIA end to end, refresh its ?concept=<id> URL, and confirm cache reuse without a second image call. Test missing config and rate-limit errors. Keep existing project visibility; do not publish publicly or enable auto-topups.

Secrets belong exclusively in the Edge Function environment, never VITE_* or source control. Supabase supplies SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. LOVABLE_API_KEY is managed by Lovable AI. BRICK_GENERATION_ENABLED defaults to off. Optional BRICK_TEXT_MODEL and BRICK_IMAGE_MODEL select gateway-supported models. Frontend uses the project's existing public VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.

## Behaviour and boundaries

- Curated KLDEX/STIVE/PETRONAS examples open immediately. New brands call the real endpoint; no mock generated success.
- Optional context improves unfamiliar brands. Brand identification uses model knowledge and user context, not a website crawl. Ambiguous brands request context.
- Master prompt is versioned in supabase/functions/generate-concept/prompt.ts. Changing design rules requires a version bump; cache keys include that version.
- The private cache stores generated public-facing brand/title/story and image path; it does not retain contact details or raw context. Generated concept UUIDs work as share links: anyone with a link can view the result. No public enumeration endpoint or automatic public gallery inclusion.
- Storage bucket is private. The backend issues one-hour image links; reopening a concept obtains a fresh link.
- Anonymous access is intentional. All table writes and model calls happen server-side. JWT verification is disabled only for this new public function; RLS denies direct anon/authenticated access to its tables.
- Atomic database limits: three uncached attempts per IP-derived hash per UTC day; thirty globally per UTC day. Failed/ambiguous requests also count to bound spend. IP is a hint, not a trusted identity; the global cap still bounds paid calls even if headers are spoofed. Each attempt permits at most one text and one image call. Tune caps in a reviewed migration, plus provider spending caps before a public launch.
- Cache reuse avoids repeat paid calls after success. Simultaneous duplicate requests may both run; the unique key keeps one saved result and cleans up the redundant upload. Limits still count both.
- Stop waiting cancels the browser request; already-running provider work may finish and incur usage. Backend timeouts return honest errors, never fabricated images.
- Visual outputs are concepts. No verified parts counts, build instructions, pricing, buildability or delivery guarantees.
- Proposal briefs remain device-only downloads. No emails or payments are sent.

Sources used for the integration contract: https://docs.lovable.dev/features/ai and https://tanstack.com/ai/latest/docs/adapters/lovable . Exact model availability and output contract need the real activation test above.


## Historical premium clicker pivot

The previous prompt was `form-premium-clickers-v1.1`. Historical `brick_concepts` table and bucket names are retained to avoid a destructive migration. Versioned search cache keys separate newly generated clicker concepts from prior brick concepts. Existing shared concept URLs can still open their original result. The 12 curated clicker images are static assets and do not need the generation service. This GitHub update does not activate or deploy the backend.


## Brandkin agency collectible editions

Current prompt version: `brandkin-collectibles-v2`. Apply `20260930090000_collectible_editions.sql` after the original migration, then deploy `generate-concept` with `options.ts` and `prompt.ts`. Deploy the frontend after the new backend. GitHub sync does not perform the database or function deployment.

- Requests carry `edition` (`icon`, `hero`, `inside`, `everyday`) and `format` (`bricks`, `miniature`, `clicker`). Icon + clicker is rejected. Missing values retain the legacy Everyday/clicker defaults.
- Cache keys include edition and format. Saved concepts retain those choices and the recipient interaction. Old rows receive Everyday/clicker defaults.
- The new migration upgrades only the former `form.` site title; other admin-configured branding remains authoritative.
- New concepts are still limited by the existing three uncached requests per client/day and thirty globally. Choosing multiple editions creates separate requests. Review usage requirements before scaling; this change does not raise spend limits.
- Client-facing text exports include the agency name if provided and omit internal budget and studio branding. Internal exports clearly label target budgets, not quotes. The concept-link web page remains studio-branded. No proposal sending or order-taking integration is added.
- The Rimba Coffee board is a generated fictional reference image, not a real customer or manufacturing validation.

Local verification: `npm ci --legacy-peer-deps` (the existing lockfile omits testing-library peer dependencies), `npm run build`, `npx tsc --noEmit -p tsconfig.app.json`, `npm test`, `node tests/generation-contract.mjs`. Backend contract tests use fake services and do not spend model credits. A live provider smoke test is still required after deployment.


