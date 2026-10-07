# Bounded product-plan correction

The first real product-first request was rejected by ProductPlan validation before an image-provider call. No new image or stored plan was produced. The raw model response could not be recovered through the available authorized database or browser routes, so the exact invalid field remains unknown. Passing unit tests did not establish live model compliance or printability.

This repair keeps the frontend hold flag enabled. Actual publication status is recorded separately. It preserves saved proposals, editing/download tools and the explicitly labelled legacy visual workflow. This is a frontend hold, not a server kill switch for already loaded clients or direct API requests.

## Repair boundaries

- ProductPlan v1, its size/field/graph bounds, selected-story and hero requirements, maximum two optional actions, Display-only constraint and unverified prototype gates are retained.
- The stage prompt clearly requests an outer visual-design object containing a nested productPlan; the nested schema no longer gives a contradictory top-level response instruction.
- Invalid world/physical plans receive at most one additional text-only correction attempt, with capped static schema paths and issue codes. The actual invalid plan is sent only to the already configured text provider, with authoritative source data and the same capability-ID boundary. Raw model plans and customer values are not logged or persisted as diagnostics.
- Correction input is capped at 32,000 characters, without truncation; output is capped at 5,000 tokens. A missing, malformed, still-invalid or privacy-violating correction stops before images. Valid plans and supplements receive no correction call.
- All image calls still use the same strict final plan and validated saved reference bytes. Supplements cannot alter the physical construction plan.
- Public errors remain nontechnical. Typed internal failures and bounded issue logs support diagnosis without exposing customer text or capability IDs.

## Time budget

The client keeps a 220-second asset window. The server uses a 190-second elapsed budget with 20 seconds reserved for storage: initial text up to 40 seconds, correction up to 25 seconds, image up to 100 seconds. Text allowances shrink with elapsed preparation time. No image starts unless the full 100-second image and 20-second save window remain. Server-owned timeout overrides can shorten but never enlarge the legacy 100-second provider timeout. Bad clocks fail closed and all timeout values are integer milliseconds.

This closes the added 300-second provider-call path. Network delays, cancellations and storage failures can still leave a provider attempt charged; exactly-once billing is not promised.

## Release acceptance

Keep the hold until the repaired backend has been deployed and actual text output passes the same validator. Prefer a bounded text-only verification through the authorized project tools, with no image call. If that route is unsupported, stop and report before considering a controlled world attempt from the existing image allowance. Any cached preflight followed by UI continuation must be reported accurately.

A corrected plan is still a design proposal. Inspect actual fresh images, part/action continuity and protective packaging before declaring the visual journey usable. CAD, slicer, fit, finishing/assembly and physical prototype tests remain unverified; none can be passed by this repair or by rendered images.
