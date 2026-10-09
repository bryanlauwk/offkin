# OFFKIN paired engine — source-only draft

## Implemented
- Strict shared design manifest, four pre-render gates, quoted confirmed evidence (public citation or labelled owner statement), exactly one story lens, editorial ProductPlan, named printed/purchased parts, zero or one proposed mechanic and process caveats.
- SHA-256 product identity and pair manifest IDs include versioned OFFKIN house style. Both deterministic artifact prompts derive from one immutable spec. Exact text, headline and causal narrative remain metadata for separate artwork proofing.
- Offline runner: collectible → card sequencing, per-stage persistence, missing-stage resume, identity/lineage checks before work, failure propagation without retries, late-abort guards and atomic complete-pair acceptance.
- Offline review: `/?engine=paired-draft`. Brand → pasted evidence/owner statement confirmation → one of three lenses → lock → paired specifications, not fake images. JSON plan is intentionally a human review gate until a server planner is approved. Prompts, exact wording and targeted refinement are disclosures. No generation/research API imports, legacy storage writes or example prefill.
- Existing v10 board now shows collectible first, original brand-world artwork second and details/packaging under Supporting studies. Legacy art is not relabelled as a newly generated story card. Original four assets, orchestration, source checks, restore and request eligibility remain intact. Evidence confirmation shows returned source URL.

## Compatibility blocker
Live v10 is world → physical → details → packaging, with strict saved-manifest/context parsers. concept-preview-v1 deliberately rejects ProductPlan fields. The new paired plan must not be sent through that contract. Its renderer/planner/readiness/storage integration is therefore NOT active. Existing public v10 natural-language refinement remains unchanged; target-specific refinement operates in the offline draft only.

No existing prompt/cache version, provider, model, endpoint, output cap, quota, guard, secret, auth/storage permission or pause flag was changed. PROPOSAL_GENERATION_PAUSED was observed as false and remains false. This task grants no paid-call authorization. No deployment, publishing, generation or provider probes occurred.

## Separately authorized non-destructive activation
1. Add a new negotiated paired capability, persisted discriminator and versioned cache keys; preserve v8/v9/v10 parsing, restoration and caches. Never add unknown fields to strict legacy payloads.
2. Evaluate cited evidence on the server with the existing pinned reader and fallback. Keep bounded URL/title/excerpt and source confirmation. Offline citations are user assertions, not verified page reads or fetch authorization.
3. Adapt the server text planner to emit the new strict plan while preserving existing provider/model/caps. Run all gates before images. Semantic lens suitability, print plausibility and nuanced generic-prop rejection require review; syntax/pattern checks cannot verify brand truth or working mechanics.
4. Add an owner-authorized server renderer with existing private validated product bytes conditioning the card; never client image URLs. Preserve gateway status, streaming, cancellation, quota and reference guards. Add server reservation/deduplication before promising exactly-once billing. Offline sequencing is not a concurrency guarantee.
5. Store shared manifest identity on both outputs, check source lineage/spec digest and independently inspect actual silhouette, colours and action consistency. Matching metadata is NOT raster geometry verification. Typeset and proof exact text separately.
6. Extend private proposal-request validation to accept either legacy four-asset sets or new validated pairs. Keep owner review, quotas and all old records. No destructive migration or permission expansion.
7. Activate target-specific public refinement after server validation: card frames preserve identity; silhouette, symbolism and complete mechanism plan/narrative changes require explicit new-identity approval and dependency closure.

## Offline tests and limits
STIVE Asia heat-press clicker, KL Durian Experience Centre split-fruit reveal, DHL routing ribbon and A24 film portal are test hypotheses, NOT researched brand claims, customer work or available products. Each has a distinct silhouette/action and causal one-sentence story in one OFFKIN style. Fixtures never seed new customer drafts.

Tests cover evidence fallback, invented claims, zero/one mechanic, purchased-part linkage, generic/impossible claims, editorial 3–5 target (six allowed), exact text, frozen identities, mixed outputs, targeted refinements, failure/resume, abort and atomic acceptance. These establish offline contract behavior only. Backend activation and bounded authorized visual acceptance remain required; no live quality/manufacturability claim is made.