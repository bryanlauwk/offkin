# Rebuild the OFFKIN experience from scratch, with brand search generation working

## Why generation doesn't work today
Generation is switched off on purpose. The site has a pause flag (`PROPOSAL_GENERATION_PAUSED = true`), and while it is on, a brand search can never reach Generate. You only see "New generations are paused". No redesign fixes this unless the pause is lifted. **Approving this plan authorizes turning generation back on.** Each concept creates 4 images and spends AI credits.

## New experience (one simple screen at a time)

```text
1. Welcome    Headline "Your business DNA. Made collectible." + one big brand search bar
2. Confirm    "Is this the brand?" Up to 3 matches, then a short story read from their public website (editable)
3. Generate   One button. A friendly progress view while the 4 images arrive:
              brand world, collectible hero, details sheet, packaging
4. Result     A full-width editorial board of those 4 images, a single "Refine" box,
              and "Request a proposal" (the private contact form we already have)
```

- Start the layout and components fresh: a warm editorial look that is calm and premium. Lots of space, large imagery, rounded tactile controls, and a mobile-first layout.
- Remove the clutter: invite labels, marketing sections, journey diagrams, yellow notes and duplicate links. Example worlds stay as a single link to `/showcase`.
- Keep the campaign lines, plus the note "Concept preview. Final design, functionality and pricing confirmed during the build proposal."
- Show plain errors with a single Try again (for example out of credits, or a website that couldn't be read). Skipping the website is always allowed.

## What stays unchanged
Saved drafts and links, old share links (`?canvas=legacy`, `#world=`), the admin page and request inbox, private image storage, the daily request limits, and the website-reading safety checks.

## Technical details
- Set `PROPOSAL_GENERATION_PAUSED = false` in `src/lib/proposal-availability.ts`. Keep the backend readiness check, so the button only turns on when the v10 backend reports ready with reference images.
- Replace the `ProposalStudio` presentation with new step components (`BrandSearch`, `BrandConfirm`, `GenerateProgress`, `ResultBoard`) and a new stylesheet. Reuse the existing logic unchanged: `findBrand`, `readWebsite`, the v10 `requestConcept` four-stage generation and resume, lineage checks, and `BuildProposalRequest`.
- Delete unused marketing and journey components and their CSS.
- Update `ProposalStudio`/journey tests for the new markup. Add a test that the Generate button is enabled when not paused and ready.
- Verify: tests, the build, and desktop and mobile screenshots. Then run one real end-to-end generation for a sample brand to confirm all 4 images arrive and the request form opens. This one run uses credits.
