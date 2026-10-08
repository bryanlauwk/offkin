# Concept request handoff repair — 2026-10-08

The quote/build-proposal action now downloads a self-contained, print-friendly HTML request rather than a text-only narrative. It captures the displayed accepted version, or the genuine partial initial version when no accepted version exists. Unfinished later revisions are not mixed into the accepted object. The document includes exact brand and context, selected story elements and hero, replacements and details-refinement notes, proposed interaction, generated section narratives/design directions, original section contexts, and the user's quantity/timing/budget/priorities.

## Safety and incomplete exports

- The action reads existing images only after explicit Download. No generation, upload, inquiry, ordering or contact destination is added.
- Network sources must be the configured HTTPS Supabase origin and the same selected asset's exact signed private bucket path. Fetch omits credentials/referrer and rejects redirects.
- PNG/JPEG/WebP only, checked against magic, bounded dimensions before allocation (8,192 pixels per side / 16 megapixels), and actual browser decode before counting as embedded. Decoding is bounded to five seconds; network reads to fifteen seconds per image. Raster bytes are limited to 8 MiB each / 24 MiB total.
- Missing, expired, corrupt, unsupported, oversized and mismatched sections are disclosed before download. The user must explicitly choose the partial-file button. The file itself has a prominent partial label and specific omissions.
- Inline escaped text, data images and a restrictive CSP provide offline viewing with no scripts, forms or external resources. Storage URLs, capability IDs, ancestors and hidden conversation history are excluded. Non-capability SHA-256 image hashes and a local revision reference identify the chosen visual.
- Close, Escape, cancellation, new revision, generation starting and unmount abort pending export work. Repeated clicks cannot start simultaneous prepares; late results do not download. Private stored records are unchanged.

## Verification

Automated coverage includes current/refined/restored/legacy/text-only directions, exact text, source lineage and identity, image byte retention, URL restrictions, XSS, MIME/magic/decode failures, byte/dimension/time limits, fallback decoder, double clicks, cancel/unmount/revision invalidation, partial confirmation and failure retry.

An independent check used the three actual generated acceptance-test images. All three exported PNG byte hashes matched the original inputs; packaging remained genuinely absent and the file was labelled partial. No active content, external resource URL, private asset ID or signed URL appeared. Those private inputs and the local QA harness are not part of this commit.

Local interactive browser QA could not be completed: the cloud browser could not reach the local listener and the installed headless browser could not create its required socket. DOM interaction tests and artifact checks passed; do not describe these as live UI acceptance. Live frontend/paid image acceptance remains a separately gated deployment check.

Public generation remains paused. Existing admin authentication, private sharing/storage permissions, prior saved proposal schemas, and the legacy canvas remain intact.
