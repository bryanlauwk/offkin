# Friendly single-hero redesign

## Goal
Turn the homepage into one welcoming creation journey: answer a simple brand question, generate one custom clicker concept, then configure and purchase/request it. Remove the catalogue-like corporate homepage experience.

## Experience
- Keep a minimal header with the editable `form.` logo at top-left linking home and one quiet utility action.
- Open with one centered, conversational question and a large search bar with a blue **Generate** action.
- Keep optional brand context and example brands compact and secondary.
- During generation, transform the same central surface into a friendly progress state rather than moving users elsewhere.
- Reveal one generated collectible in a tactile two-part workspace: creation details on the left and the product preview with quantity, budget, date, and purchase/proposal action on the right.
- Preserve share and downloadable brief behavior, but present them as secondary actions in the result state.
- Remove the collection grid, occasion strip, pricing bands, process section, and corporate footer from the main journey.

## Visual direction
- Use the selected playful utility palette: white, pale blue, vivid blue, yellow, and coral through semantic design tokens.
- Use **Outfit** for headings and **Figtree** for interface text.
- Match the selected tactile composition with softly elevated surfaces, compact rounded controls, cheerful highlights, and a clear product preview.
- Keep corners controlled and hierarchy spacious; avoid glass effects, dark themes, corporate styling, and catalogue density.
- Add restrained motion for search focus, generation progress, and the generated-result reveal, with reduced-motion support.

## Responsive behavior
- Desktop: centered single-hero prompt; generated result expands into the selected tactile two-column workspace.
- Mobile: one-column sequence with the question/search first, preview second, and purchase controls always readable without overlap.

## Technical details
- Refactor the homepage presentation while retaining its existing concept generator, URL-based concept loading, generated/sample image paths, quantity/budget/date values, sharing, and downloadable brief.
- Consolidate the homepage styling around semantic variables in the global design system and remove the remote CSS font import; load fonts safely from the document head.
- Keep the admin page and its editable logo settings intact, and connect the homepage logo to those settings where already supported.
- Update page metadata and theme color only where needed to match the redesigned experience.
- Verify the initial, generating, generated, detail/purchase, dialog, desktop, and mobile states, plus current build and runtime logs.
