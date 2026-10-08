# Simpler, more polished OFFKIN: showcase page, ambient sound, cleaner home

## What changes for visitors

1. **Simpler flow: answer, then generate once.** Visitors answer the guide's short questions and press Generate. The result board is final and can be downloaded or shared. This phase hides the refinement chat ("Update"), the Edit details panel and element-swap controls. Saved and shared proposals still open. The hidden features stay in the code so they can return later.

2. **New Showcase page (/showcase).** Three example worlds (Airbnb, A24, Tesla) are rebuilt as responsive web layouts. The uploaded boards are not pasted in as images. Each example gets:
   - a brand-world illustration
   - the collectible hero
   - 4–5 key-element cards (brand DNA to physical form)
   - a 3-step "How it works" strip
   - a packaging card
   On mobile these stack into swipeable cards. All illustrations are newly made in your site's look. Every example carries a clear label: "Unofficial concept study — not client work or an available product."
   The home page gets a small "See example worlds →" teaser that links to this page.

3. **Ambient sound with ElevenLabs.** A soft studio ambience loop plays only after a visitor turns it on with a sound button in the header. It is off by default and remembered on the device. A gentle chime plays when generation finishes.
   - The sounds are made once with ElevenLabs and saved with the site, so each visit costs nothing.
   - You'll be asked to link your ElevenLabs connection.

4. **Home page polish (art and commerce in balance).**
   - Clear order: the headline "Your business DNA. Made collectible." (unchanged), one composer, a single line of reassurance, then a compact "how it works" in 3 steps and the showcase teaser.
   - Remove the noisy light-yellow notes from home: the rollout/"proposal generation not available" banner, "visual study" disclaimers, and repeated fine-print notes. Legally needed wording (no quote or order, RM100–500 is exploratory, prototype comes next) moves into one short line next to Generate, plus a "Details" popover.
   - Spacing, type scale and colour are refined using the existing tokens. Product imagery gets a more gallery-like frame, and the mobile layout is checked at 390px.

## Technical details

- Hide refinement and Edit details behind a `SIMPLE_MODE` flag in `ProposalStudio` and `ProposalBoard`. Do not delete the v10 Update path, so the `offkin-proposal-v10` contract and legacy routes stay intact. Record the rule in `AGENTS.md`.
- Add a `src/pages/Showcase.tsx` route with data in `src/lib/showcase-worlds.ts`. Images are generated into `src/assets/showcase/` (world, hero, elements, packaging for each brand). Uploads are used only as visual references.
- Link the ElevenLabs connector. A one-time script calls `/v1/sound-generation` (ambience loop plus chime) and saves the MP3s as project assets. No runtime edge function and no per-visitor calls. The header toggle uses `HTMLAudioElement` and respects reduced-motion and sound preferences.
- Clean up home: remove `op-rollout-notice` and the redundant `aside-note`/`field-note`/`generation-note` blocks from the home view, and consolidate the disclaimer copy. The site title and description stay unchanged.
- Verify with tests, the build, and desktop and mobile Playwright screenshots of the home and showcase pages. No paid proposal generations.

## Note on project rules

Your project rules currently require a refinement composer on results and say the reference boards are "not homepage content". This plan hides refinement for this phase only and keeps the boards on a separate page labelled unofficial, which is consistent with those rules. On approval, the project notes will be updated to match.
