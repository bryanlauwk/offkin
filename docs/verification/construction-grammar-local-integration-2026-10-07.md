# Construction-intent integration candidate

Status: implemented and wired locally; not deployed. No real provider calls, public API generation, push, deployment, settings or credential changes were performed. Public generation remains paused. Graph/contract tests are not evidence of physical manufacturability or successful image output.

## Conversation and production API

- Before new generation, the customer explicitly chooses **Static display** or **Proposed press/reveal with manual lift reset**. Both are labeled unverified and requiring prototypes. No brand or action is inferred from an example.
- The request carries `constructionIntent: {version: "construction-intent-v1", action: "static" | "press-reveal-manual-reset"}`. This is a customer instruction, not engineering approval or proof that a human clicked a particular UI.
- `index.ts` now unconditionally passes `requireConstructionIntent: true`. New world/physical requests without a supported intent return construction clarification before provider/quota calls. No request, model field, environment value or client “reviewed” flag can bypass the gate. The older freeform-generation path is retained only behind an explicitly disabled runtime gate for scoped compatibility tests.
- The server requires the exact canonical interaction text and compatible mechanical mode. The static text is `Display only`; the moving text is `Press the hero to reveal a marker; lift manually to reset.` Existing rocker/gravity/spring/automatic-reset directions are not rewritten into a supported action.
- Capability `proposal_construction_intent_version: "construction-intent-v1"` gates new client generation. Old v9/v10 snapshots and private restores remain readable independently of that capability.

## Bounded per-brief compilation

The text model supplies only bounded artistic choices: part role, existing story IDs, geometry (`sculpted`, `architectural`, `character`, `ribbon`, `organic`), profile (`rounded`, `angular`, `layered`, `asymmetric`), finish (`matte`, `satin`, `selective-color`) and 1–3 six-digit hex colors. It cannot supply a graph, join, operation, tolerance, action, reset behavior or verification status.

- Static: two core printed parts, one authored static seat and one static assembly operation. No guide, moving capture, reset, action or interaction-test gate.
- Press/reveal: three core printed parts, three authored relationships and two ordered operations. Insert the one-piece pressing form/stem/marker before installing its retainer. Pressing proposes revealing the marker; lifting manually resets it.
- Either family can use up to four explicitly authored static modules at named interfaces. Optional modules are selected as complete declared parts/interfaces/operations, never synthesized to repair an invalid graph.
- Every selected story ID and hero must remain mapped. Unsupported geometry, story coverage, actions or size bounds clarify before images; nothing is truncated, dropped or silently substituted.
- The unchanged strict ProductPlan v1 validator remains the final acceptance gate. All CAD, slicer, fit, physical-prototype and finish/assembly gates remain unverified; the moving family also retains unverified interaction testing.

The mechanism library contains no brand, sun, road, car, fixed palette, generic pedestal or mandatory city layout. Artistic identity remains specific to the brief. Bounded model visuals are recorded as **unverified model proposals**, not promoted to a reviewed/server-authored creative catalog.

Distinctive brand/title/story and story-element descriptions remain in display metadata. For v2 images they appear only in an explicitly untrusted proposed-artistic narrative section. The separate **Compiled unverified functional direction** object contains compiler-owned design and interaction; model prose never becomes functional authority. Rendering fidelity still requires later visual review.

## Binding, persistence and revisions

The server derives the canonical source binding and hashes. It includes validated current context, actual element descriptions, hero, replacements, explicit intent, template ID/revision, compiler version and semantic digest. Digests prove consistency, not human review or manufacturing approval.

Source identity uses the same website identity actually persisted as evidence. If website reading fails and supplied business facts permit generation, it remains `no-website`; a failed read is never promoted to verified website evidence. Ignored physical-request brand text cannot bypass unchanged-direction pinning.

- Unchanged world-to-physical continuation reuses the frozen plan/origin. The model need not reproduce the visual choice, and any attempted alteration clarifies instead.
- Initial physical generation cannot change its unfinished world's selected action. An explicit physical revision with its previous asset may choose a new supported action after visible reconfirmation.
- Retired/incompatible compiler or template origins remain restorable but cannot be silently recompiled for new physical images.
- Details and packaging inherit the exact physical plan, origin and intent. Packaging-only revisions do not require unnecessary mechanical reconfirmation.
- Relevant context/selection/hero/replacement changes and world/physical revisions clear or visibly reconfirm the choice. Imports require their own active choice. Partial assets and accepted versions remain intact, including interrupted requests and failed metadata restores.
- Cache identity covers request, source images/manifests, complete intent/compiler/render semantics and applicable artistic data. Completed hits use no provider calls.
- Validated private image bytes, source lineage, UUID filtering, partial saves, atomic accepted/pending revisions and default text-only sharing are preserved. Source digests/capability identifiers are not sent as model instructions.

Historical visual-only, model-authored-plan and earlier authored-template snapshots are preserved without fabricated provenance. The optional older runtime binding remains useful for compatibility tests; the production route derives each new binding directly from validated request/source data and the bounded model visual choice.

## Verification

- 27 wrapper-free actual-index tests cover fictional static/manual four-stage generation, private reference bytes, frozen origins, narrative isolation, cache/restore, source-brand and failed-website freshness, action-change boundaries, retired metadata and zero-provider gates.
- 16 per-brief compiler tests cover both cores, all 32 optional-module sets, finite artistic combinations, no example-brand inference, unsupported/freeform keys, story/hero preservation, oversize failure and binding identity.
- 29 earlier authored-template handler tests and 88 explicitly scoped legacy/gate endpoint tests remain regression coverage.
- 115 focused UI/session/API tests cover explicit choice, invalidation, revisions, packaging inheritance, imports, old snapshots, missing metadata, capabilities and interrupted recovery.
- Independent production-mode adversarial checks and an unchanged prior unsupported-mechanism request were also checked privately, without copying customer requests or production identifiers into this source patch.
- Final aggregate verification passed 1,152 tests across 37 suites, app/node TypeScript, production build and the legacy mock contract. Lint has zero errors and eight inherited warnings. The private source bundle includes the verification evidence. No real model/image acceptance, live browser acceptance or physical validation is claimed.
- Public-pause configuration, strict ProductPlan validator and authorization guards are unchanged. The production endpoint change is the explicit required-intent runtime gate. Baseline: commit `3422b73c667dea8c08b00143f0ffc63ca1751ad1`, tree `0e4b08d3c2045101fb9b62da1c48b2c21a8ec047`.

## Reproducible standalone backend comparison

Set these paths to existing checkouts with dependencies installed. Temporary configurations do not modify either checkout.

```sh
export BASELINE_CHECKOUT=/path/to/baseline
export CANDIDATE_CHECKOUT=/path/to/candidate
export CHECK_DIR="$(mktemp -d)"
python3 - <<'PYCONFIG'
import json, os, pathlib
for name, variable in [('baseline', 'BASELINE_CHECKOUT'), ('candidate', 'CANDIDATE_CHECKOUT')]:
    root = pathlib.Path(os.environ[variable]).resolve()
    config = {
        'extends': str(root / 'tsconfig.app.json'),
        'compilerOptions': {'strict': True, 'noImplicitAny': True, 'noEmit': True, 'types': []},
        'include': [str(root / 'supabase/functions/generate-concept/proposal-handler.ts')]
    }
    (pathlib.Path(os.environ['CHECK_DIR']) / (name + '.tsconfig.json')).write_text(json.dumps(config))
PYCONFIG
"$CANDIDATE_CHECKOUT/node_modules/.bin/tsc" --noEmit -p "$CHECK_DIR/baseline.tsconfig.json"
"$CANDIDATE_CHECKOUT/node_modules/.bin/tsc" --noEmit -p "$CHECK_DIR/candidate.tsconfig.json"
```

Both standalone strict/noImplicitAny checks report the same six pre-existing TS7053 string-index diagnostics: two in proposal-handler.ts and four in proposal.ts. Normalizing only checkout roots and moved line/column locations makes their diagnostics identical. The new construction modules introduce no diagnostics. This baseline comparison is not a claim that the existing backend passes strict/noImplicitAny.

## Remaining release and physical boundaries

The manual-reset mechanism remains an unverified design hypothesis. Explicit customer intent does not validate geometry, assembly access, fit, force, stability, safety, materials, durability or imagery. Unsupported custom mechanisms must clarify; this is a small library, not a general CAD or manufacturing engine.

The candidate is locally wired and tested but remains unpublished with the public hold intact. Release review, a separately authorized bounded live acceptance check, CAD/slicer work and physical prototypes remain outstanding. No remaining paid request slot was consumed by this implementation.
