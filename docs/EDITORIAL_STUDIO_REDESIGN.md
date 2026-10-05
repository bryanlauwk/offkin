# Editorial studio redesign

## Scope

This draft replaces the public creation interface with an independent, editorial creative-studio direction. The existing admin-configured logo, link and title remain authoritative. `src/lib/studio-brand.ts` isolates the fallback name; the approved identity is OFFKIN｜异趣伙伴. Legacy DIORAMINI default title settings migrate in the UI while genuinely custom studio titles are preserved.

The three code-native A24, Airbnb and Tesla demonstrations are hypothetical, unofficial design studies. They are not customer commissions, completed prototypes or engineering validation. Each has one linear scene action, a pressable cap and a return state. Geometry and dimensions are design targets, not manufacturing specifications.

## Journey

1. Submit one public company website. The existing safe website reader returns source text without an AI generation call.
2. Review three editorial lenses: unseen ritual, turning point and human trace. Relevant extracted sentences are shown where a simple keyword match is available. These are proposed creative questions, not AI analysis, business verification or invented facts. The customer supplies a short factual description and chooses a lens.
3. Answer the hidden-detail question in the customer's own words.
4. Choose Mechanical miniature or Electronic story scene (concept study), then object, style, audience and exact lettering/placement. Mechanical interaction preferences remain editable.
5. Review the complete direction. Mechanical generation remains explicit. Electronic image generation is enabled only by a successful ready/capability/version check; otherwise save a full electronic brief locally without a paid request.
6. Read why the generated concept represents the business, save the brief or refine it, and review the physical-prototype checklist.

Art, technology and commercial purpose are equally important. The first edition is a palm-sized single main scene with at most one or two mechanical actions only when useful. Reuse bases, connectors and selected mechanisms while varying the shell and story. Start with a few outsourced printed samples to test the experience and cost. RM100–500 is an exploratory budget range: samples and supplier quotes must establish which specifications fit. It is neither a fixed unit price nor a requirement that every future format fit. Design, electronics, prototyping, manufacture and delivery require separate review.

## Compatibility and data

- Existing POST inspection, generation and saved-concept retrieval schemas are unchanged.
- New `angle`, `hiddenDetail` and optional electronic `mode` values are carried inside the existing context JSON, included in the existing full-context cache key. The 600-character ceiling remains in force for image generation, with an explicit error instead of truncating exact wording. Local electronic brief review/export does not inherit that backend limit.
- Successful directions remain in the existing device-local `dioramini:direction:<id>` keys. Legacy records without new fields still load. URL navigation restores the matching saved direction.
- Shared concept URLs retrieve the image/story through the existing endpoint; they do not contain device-local answers. Anyone holding a concept link can retrieve the concept.
- Website fetch hardening, private image storage, signed delivery URLs, generation kill switch, provider choices and temporary daily-quota waiver remain unchanged.

## Release requirements

The OFFKIN name and website scope are approved for merge. Public publishing, function deployment and paid testing remain separately authorized actions.

A first connected-hardware format is being explored: a small story scene using off-the-shelf hardware, a button, screen/light and a bounded AI response. The public copy labels this as exploration and requires hardware/software prototype validation. No integration with Muse, hardware availability, ordering, tested mechanism, or fixed electronics price is claimed. The wizard distinguishes mechanical and electronic creative briefs. New backend source branches by `context.mode`, rejects electronic requests outside Inside/miniature, and returns `capabilities.electronic_story_scene: true` plus `prompt_version: dioramini-story-led-miniatures-v7` on GET. The frontend also requires a successful response with `ready: true`. Older, disabled, failed or incompatible backends stay brief-only for electronic mode. A 10-second capability timeout fails closed; local brief saving does not depend on that check. Electronic designs require a separate scope, prototype and quotation.

Mechanical creation uses the existing deployed API. Electronic visual creation needs the new source deployed and is otherwise unavailable; the downloadable exploratory brief still works. The improved editorial generation instructions in `supabase/functions/generate-concept/prompt.ts` require an explicit function deployment before they affect generated output. Prompt v7 separates new cached results from older directions, and the full context separates electronic from mechanical requests. Stored concept rows do not gain a mode column; shared links do not pretend to recover a missing private direction. No new migration, key or paid connector is needed.

Offline checks mock generation and website responses. They are not evidence of live provider quality or physical manufacturability. A paid generation test, if wanted, needs separate authorization. Before release, visually review desktop/mobile layout, keyboard interaction, reduced motion, error states and the full flow in an accessible preview environment.
