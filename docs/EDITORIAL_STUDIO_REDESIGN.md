# Editorial studio redesign

## Scope

This draft replaces the public creation interface with an independent, editorial creative-studio direction. The existing admin-configured logo, link and title remain authoritative. `src/lib/studio-brand.ts` isolates the fallback name; DIORAMINI remains temporary until a new identity is approved.

The three code-native A24, Airbnb and Tesla demonstrations are hypothetical, unofficial design studies. They are not customer commissions, completed prototypes or engineering validation. Each has one linear scene action, a pressable cap and a return state. Geometry and dimensions are design targets, not manufacturing specifications.

## Journey

1. Submit one public company website. The existing safe website reader returns source text without an AI generation call.
2. Review three editorial lenses: unseen ritual, turning point and human trace. Relevant extracted sentences are shown where a simple keyword match is available. These are proposed creative questions, not AI analysis, business verification or invented facts. The customer supplies a short factual description and chooses a lens.
3. Answer the hidden-detail question in the customer's own words.
4. Choose object, style, audience, exact lettering/placement and interaction.
5. Review the complete direction and explicitly generate the concept.
6. Read why the generated concept represents the business, save the brief or refine it, and review the physical-prototype checklist.

No price is a firm quote. RM100 is an indicative unit entry point. Design, prototyping, manufacture and delivery require separate review.

## Compatibility and data

- Existing POST inspection, generation and saved-concept retrieval schemas are unchanged.
- New `angle` and `hiddenDetail` values are carried inside the existing context JSON, included in the existing full-context cache key. The 600-character ceiling remains in force, with an explicit error instead of truncating exact wording.
- Successful directions remain in the existing device-local `dioramini:direction:<id>` keys. Legacy records without new fields still load. URL navigation restores the matching saved direction.
- Shared concept URLs retrieve the image/story through the existing endpoint; they do not contain device-local answers. Anyone holding a concept link can retrieve the concept.
- Website fetch hardening, private image storage, signed delivery URLs, generation kill switch, provider choices and temporary daily-quota waiver remain unchanged.

## Release requirements

This is a draft branch. Do not merge or publish until the identity and design are approved.

The frontend uses the existing deployed API. The improved editorial generation instructions in `supabase/functions/generate-concept/prompt.ts` require an explicit function deployment before they affect generated output. The new prompt version separates new cached results from older directions. No new migration, key or paid connector is needed.

Offline checks mock generation and website responses. They are not evidence of live provider quality or physical manufacturability. A paid generation test, if wanted, needs separate authorization. Before release, visually review desktop/mobile layout, keyboard interaction, reduced motion, error states and the full flow in an accessible preview environment.
