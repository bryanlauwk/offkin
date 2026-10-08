## Technical details
- **Brand lookup:** new `findBrand` action in the generate-concept function using the linked Firecrawl search (no new connector). Returns at most 3 candidates `{name, url, description}`; every URL passes the existing normalization + public-DNS checks before being shown. Bounded result size, short timeout, no model call.
- **Frontend:** in ProposalStudio, when the entry is a name (not a URL/story), call lookup and render a candidate picker; selecting one sets `customerIdentity` (customer-brand-v1, exact name) and `website`, then auto-runs the existing `readWebsite` to pre-fill business context.
- **Proposal handoff:** BuildProposalRequest receives brand, website, story, hero and asset IDs from the accepted proposal; output stays a local labelled draft.
- **Tests:** lookup rejects private/unsafe URLs, caps at 3, and the picker sets the exact chosen name; handoff includes the accepted concept's fields.
- **Deployment:** backend redeploy needed for the lookup action (only after your approval); `PROPOSAL_GENERATION_PAUSED` unchanged. Each lookup uses Firecrawl credits.
