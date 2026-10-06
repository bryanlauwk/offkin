# OFFKIN commercial co-creation redesign

## Direction

The homepage keeps “Your business DNA. Made collectible.” and OFFKIN｜异趣伙伴, while turning the entry experience into a distinctive commercial creative studio: authored brand worlds, a visible co-creation invitation, and a clear path from story to brief to prototype review. This is one journey, not a product catalogue or checkout.

The three October 6 supplied concept boards are the only new homepage artwork. The Airbnb world uses the coral Bélo, cottage, guests and yellow path; A24 uses the black projector and story drum; Tesla uses the sun, solar home, storage and car. They are independently conceived, unofficial references, not client work, available products or manufacturing proof. CSS focal windows deliberately feature the concepts rather than the boards’ unvalidated dimensions/production claims. The originals are preserved externally; website WebP files are lossless re-encodings with identical decoded pixels. Only the selected board is loaded; switching is user-controlled and never invokes generation. The older rejected PR #10 visuals are not included.

## Working customer flow

1. Read a public website or start with an owner-written description
2. Keep fetched source text distinct from proposed editorial story lenses
3. Add the inside detail only the owner knows
4. Choose format, visual language, audience, interaction, scale, brand references and exact wording
5. Review and edit the living brief
6. Download it or explicitly review before copying a shareable copy
7. Generate only after an explicit click and exact v8 capability checks
8. Refine a generated direction or export its brief for a prototype conversation

An unfinished draft is stored on the current device, with an explicit Resume option. Storage errors are shown. Share links contain the reviewed answers in their fragment and are readable by anyone holding the link; there is no authentication, live presence or synchronized editing. Opening a link only offers a review. Importing neither fetches its website nor starts generation. All imports are schema- and size-checked. Do not place confidential information in a shareable brief.

No studio contact address is invented. Downloads are the working commercial handoff until a verified email or WhatsApp destination is supplied. No order, payment, sample request or quotation is submitted by this site.

## Honest boundaries

- Size follows the story, display setting and print cost; there is no palm-size requirement
- One main scene and at most one or two meaningful mechanical actions
- Reusable internal bases/connectors where useful without repeating every exterior form
- Initial physical samples are outsourced and require separate scoping and quotations
- RM100–500 is exploratory, never a guaranteed purchase price
- Written brand references do not constitute uploaded or verified logo artwork
- Electronic effects are optional and require hardware/software/safety validation

## Generation contract and rollout

The new UI must not silently send its richer direction to the old live v7 prompt. It requires `offkin-cocreation-v8`, ready state, co-creation capability, and a 6000-character limit. Electronic mode additionally requires the electronic capability. The client repeats its read-only capability check immediately before POST. Incompatible/unavailable backends leave download, local save and reviewed sharing usable; Generate is disabled with a truthful explanation.

Source changes do not deploy the Supabase edge function. Existing private storage, RLS, fetch/SSRF protections, database selection enums and saved concept routes remain intact. No database migration, secret creation or security configuration is needed for this code change. Follow `GENERATION_SETUP.md` for separately authorized deployment and verification.

## Verification

The current public site and the actual source boards were inspected. The updated source is covered by component/state/API tests, the real edge handler with fake providers, TypeScript, lint and production build checks. No paid AI calls were used.

Unpublished visual browser QA is blocked: the cloud browser reported `ERR_BLOCKED_BY_CLIENT` for localhost. A local build is not evidence of browser layout verification. Before public release, verify desktop/mobile focal crops, narrow-screen wrapping, focus trapping and Escape, keyboard selection, reduced motion, image failures, resumed/imported briefs, navigation during requests and the exact deployed v8 capability response in an approved preview environment.

Keep this change a draft until design review, approved preview QA and deployment approval. The live site is unchanged by preparing this source branch.

### Final source checks (2026-10-06)

- `npm test`: 429 tests across 14 files passed, including 84 UI cases
- `node tests/generation-contract.mjs`: passed against isolated fake providers/storage/database, with no paid calls
- `npm run build`: passed (JavaScript 172.91KB gzip); Vite reports the existing >500KB uncompressed chunk warning
- `npx tsc --noEmit -p tsconfig.app.json` and `-p tsconfig.node.json`: passed
- `npm run lint`: passed with zero errors and eight inherited warnings in unchanged UI/game files
- `git diff --check`: passed
- Independent review findings about navigation races, modal dismissal/focus, clean concept URLs, URL length alignment, focal windows and skip-link contrast were addressed; regression checks passed

No live generated-output test or unpublished browser layout check was performed. Those remain release gates.
