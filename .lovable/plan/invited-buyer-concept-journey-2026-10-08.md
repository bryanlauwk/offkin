# Invited-buyer concept journey

## Experience

Create one focused, full-screen journey for an invited business buyer:

```text
Brand name → confirm the right brand → review researched story → generate once
→ immersive collectible concept board → submit proposal request
```

“Invited” is audience framing, not an access gate. The public page stays reachable.

### 1. Brand-first opening
- Keep the exact headline “Your business DNA. Made collectible.”, but make the immediate action a large single brand-name field.
- Reserve the top-left for the configured logo and home link from site settings.
- Remove the current marketing-heavy homepage sequence from the primary path. Keep one quiet Showcase link for the unofficial examples.
- Use warm ivory, black ink, coral and a restrained yellow accent with editorial typography, fine hand-drawn cues and generous space—artistic enough to feel authored, disciplined enough for a buyer presentation.

### 2. Research and confirmation
- A plain brand name triggers the existing safe brand search and shows up to three likely official sites in a clean confirmation view.
- Choosing a match immediately reads its public website through the existing validated reader and Firecrawl fallback.
- Present the source, exact brand name and a short “what we found” summary for confirmation; keep one optional audience question.
- If lookup or reading fails, let the buyer continue with their own description without blocking the journey.

### 3. Generation as a visible story
- One explicit Generate action creates the existing four connected outputs: brand world, physical collectible, components/interaction and packaging.
- Replace generic loading copy with a staged visual sequence that reveals research, world-building, collectible and presentation progress while preserving stop/resume and partial-save behavior.
- Keep `PROPOSAL_GENERATION_PAUSED = true`; the redesign can be reviewed with saved data and mocks, but public generation remains unavailable until separately authorized.

### 4. Reference-quality concept board
- Recompose the result as a dense, full-width editorial sheet inspired by the references: brand story and mark area, large illustrated world, dominant collectible hero, story-element index, proposed interaction and packaging.
- Display only the proposal’s four actual generated images with verified lineage. Do not invent product angles, exploded views, component crops, series products or validated mechanics.
- Keep the concept-preview note once, in the final board footer. Make technical caveats available without repeating yellow notices throughout the page.
- Preserve accessible image enlargement, saved restore, download and reviewed sharing. In this simple phase, refinement and Edit details remain hidden.

### 5. Real proposal request
- Replace the local-only handoff with a concise contact form: buyer name, work email, company, quantity, timing, budget direction and priorities.
- Show the chosen brand, website, concept story and four saved asset identifiers in the review step before submission.
- Save requests privately for owner review and return a real request reference only after a successful save. Never imply an email was sent or an order was placed.
- Add a password-protected “Proposal requests” area to the existing admin page with newest-first status, buyer details and the submitted concept summary.

## Privacy and backend

- Add a private `proposal_requests` table with bounded fields, timestamps and request status.
- Grant table access only to the server role; enable row-level security with no public read/write policies.
- Add a dedicated submission function that validates every field server-side, rate-limits abuse, verifies the referenced saved proposal assets, and writes through server credentials. The browser never receives access to the request table.
- Extend the existing password-protected admin function to return requests after server-side password verification. Do not expose buyer details through public settings or logs.
- Keep private concept storage, authentication, quotas, feature flags and saved proposal records unchanged.

## Verification

- Add focused tests for brand-name lookup/confirmation, exact-name preservation, the one-action four-stage request, simple-mode hidden editing, proposal form validation, private persistence and truthful success/failure states.
- Run the existing relevant test suites and generation contract mocks.
- Check the latest build signal and inspect the opening, research confirmation, generated board and request form at desktop and mobile sizes.
- Do not run paid generation or publish. A separately authorized acceptance pass is still required before unpausing generation or claiming live readiness.

## Technical details

- Refactor the current large studio into focused journey sections while retaining the v10 proposal/session APIs, legacy routes and restoration safeguards.
- Restyle the proposal board around the four real assets rather than embedding the uploaded reference graphics; the uploads remain visual references only.
- Apply the database migration through Lovable Cloud, deploy only the new/updated request-handling functions, and record the new private-submission architecture in `AGENTS.md`.
