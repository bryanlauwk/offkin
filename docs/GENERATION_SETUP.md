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


## Premium clicker pivot

The current prompt is `form-premium-clickers-v1.1`. Historical `brick_concepts` table and bucket names are retained to avoid a destructive migration. Versioned search cache keys separate newly generated clicker concepts from prior brick concepts. Existing shared concept URLs can still open their original result. The 12 curated clicker images are static assets and do not need the generation service. This GitHub update does not activate or deploy the backend.
