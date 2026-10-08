# Details-only visual refinement

Status: local code and mocked transport verification only. Public generation remains paused. This change does not deploy, authorize live generation or validate visual quality; a separately approved deployment and bounded live acceptance test are still required.

## API extension

`offkin-proposal-v10` remains the contract and `proposal-assets-v1` remains the saved-manifest version. Readiness now advertises and the updated client requires `proposal_details_refinement_version: "details-refinement-v1"`. Restore of older assets does not require readiness.

A details request may include:

```json
{
  "detailsRefinement": {
    "version": "details-refinement-v1",
    "instruction": "Keep the same assembled collectible. Reframe local detail windows and clarify only its original action."
  }
}
```

- Only `stage: "details"` accepts this field.
- The instruction is nonblank, at most 2,000 JavaScript string characters, never silently trimmed or shortened. Unknown properties and versions fail closed.
- Supply `sourceWorldId` and `sourcePhysicalId` from the accepted lineage. `context` must still exactly match the saved physical asset's context. Do not insert the correction into `context.revisionNotes`.
- `previousAssetId` is optional and must pass the existing saved same-role and lineage checks.
- For the new versioned path, the accepted physical image is first and authoritative. Optional previous details is second and a lower-priority layout reference only. Previous details can be omitted to avoid carrying its flawed visual layout forward.
- Only validated private saved-image bytes are sent to the provider. UUIDs and private image URLs are not prompt references. The public result contains current source IDs only, never the private revision ancestor.
- The exact refinement is saved separately in the details manifest and survives restore. It is included in both text/image direction and the canonical request/cache identity. Changed instructions cannot hit the prior instruction's cache entry. Identical completed requests reuse their saved result; this is not an exactly-once billing guarantee for concurrent unresolved work.
- Legacy requests/manifests without the field retain their reference ordering and remain restorable. The offline legacy-engineering adapter rejects the new field rather than ignoring it.

## Conversational planning

The planner can classify a change as `scope: "details"` only with an empty context patch and no selection/wording changes. The server copies the original user instruction into `detailsRefinement`; the planner cannot rewrite it. Changes to the physical object or its action still require physical scope. The client checks the returned instruction, context and scope before use.

A details revision retains world, physical and packaging; only details is generated. If a packaging-only revision changed the accepted proposal's `revisionNotes`, keep that accepted context unchanged in the session and plan. Pass the loaded physical asset's original context to the details generation request. This distinction preserves both the new packaging direction and the physical-lineage guard.

## Visual direction

The new default details prompt selects bounded local clusters visible in the accepted hero and preserves adjacent assembly, routes, openings and nearby discoveries. Metadata story cards do not define detachable parts or one image per card. It avoids duplicate whole heroes, invented standalone modules/plinths, new props and unsupported hidden geometry.

A proposed interaction uses a matched before/after pair with camera, scale, original control/mount, surrounding assembly and unaffected features fixed. The pair depicts only the original requested action and the same visible response through its original opening. It must not substitute a new object, lid, control or envelope-box. If faithful depiction is unsupported, omit the invented response. Static briefs remain static. These are unverified visual concepts, not mechanical validation, CAD, manufacturing constraints or proof of demand.

## Bounded live acceptance criteria after separate approval

For the held fictional night-post case, use the saved physical context exactly and move only the reviewed correction into `detailsRefinement.instruction`. Keep the accepted world/physical lineage. Inspect the entire result against the hero, especially:

- Original rail loop, paper boat, cleaner and adjacent star cup
- Original coral route and the baker, radio host and gardener scenes
- Original fixed moon-stamp mount and central ivory envelope opening
- More of the same partially visible coral reply emerging from that same opening, with only the original crescent control turning
- No duplicate hero, detached garden plinth, new envelope-box or stamp-as-lid action

These criteria establish visual consistency only. Do not claim a working mechanism, manufacturability, market demand or release readiness from a passing mock suite.
