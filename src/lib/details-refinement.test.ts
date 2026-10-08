import { describe, expect, it } from 'vitest';
import {
  DETAILS_REFINEMENT_MAX_CHARS, DETAILS_REFINEMENT_VERSION, PROPOSAL_CONTRACT_VERSION,
  isDetailsRefinement, parseRevisionPlan, proposalSourceImageIds, validateProposalRequest,
  type DetailsRefinement, type ProposalRequest, type RevisionPlanRequest,
} from '../../supabase/functions/generate-concept/proposal';

const world = '10000000-0000-4000-8000-000000000001';
const physical = '10000000-0000-4000-8000-000000000002';
const previous = '10000000-0000-4000-8000-000000000003';
const context = { business: 'An imagined night post studio.', interaction: 'Turn the existing moon to reveal more of the same letter.', exactWording: '  夜信\nPost  ' };
const detailsRefinement: DetailsRefinement = { version: DETAILS_REFINEMENT_VERSION, instruction: 'Keep the rail and cup attached in context. Show the same original slot before and after.' };
const request: ProposalRequest = { contractVersion: PROPOSAL_CONTRACT_VERSION, stage: 'details', brand: 'no-website', context, sourceWorldId: world, sourcePhysicalId: physical, detailsRefinement };
const planRequest: RevisionPlanRequest = { contractVersion: PROPOSAL_CONTRACT_VERSION, action: 'plan-revision', brand: 'no-website', context, sourceWorldId: world, sourcePhysicalId: physical, instruction: detailsRefinement.instruction };

describe('bounded details-only refinement contract', () => {
  it('accepts the reviewed direction separately without changing any original context', () => {
    expect(validateProposalRequest(request)).toEqual(request);
    expect(validateProposalRequest({ ...request, detailsRefinement: undefined }).context).toEqual(context);
    expect(isDetailsRefinement({ ...detailsRefinement, instruction: 'x'.repeat(DETAILS_REFINEMENT_MAX_CHARS) })).toBe(true);
  });
  it.each([null, '', {}, { ...detailsRefinement, instruction: '' }, { ...detailsRefinement, instruction: '   ' },
    { ...detailsRefinement, instruction: 1 }, { ...detailsRefinement, instruction: 'x'.repeat(2001) },
    { ...detailsRefinement, version: 'details-refinement-v2' }, { ...detailsRefinement, imageUrl: 'https://untrusted.invalid' },
  ])('rejects invalid refinement %j without shortening it', refinement => {
    expect(isDetailsRefinement(refinement)).toBe(false);
    expect(() => validateProposalRequest({ ...request, detailsRefinement: refinement })).toThrow(/details-only refinement/);
  });
  it.each(['world', 'physical', 'packaging'])('rejects the extra direction on %s', stage => {
    expect(() => validateProposalRequest({ ...request, stage })).toThrow(/details-only refinement/);
  });
  it('prioritizes the physical image only on the new versioned path and preserves legacy ordering', () => {
    expect(proposalSourceImageIds({ ...request, previousAssetId: previous })).toEqual([physical, previous]);
    expect(proposalSourceImageIds(request)).toEqual([physical]);
    expect(proposalSourceImageIds({ ...request, detailsRefinement: undefined, previousAssetId: previous })).toEqual([previous, physical]);
  });
  it('classifies the scope but returns the exact reviewed instruction and original accepted context', () => {
    const acceptedContext = { ...context, revisionNotes: 'Packaging-only navy sleeve direction.' };
    const originalInstruction = '  Show the SAME letter through the original slot.\n保留小船。  ';
    expect(parseRevisionPlan({ scope: 'details', context: {}, summary: 'Clarify the original action.' }, { ...planRequest, context: acceptedContext, instruction: originalInstruction })).toEqual({
      plan: { scope: 'details', context: acceptedContext, summary: 'Clarify the original action.', detailsRefinement: { version: DETAILS_REFINEMENT_VERSION, instruction: originalInstruction } },
    });
  });
  it.each([
    { context: { revisionNotes: 'A new object.' } }, { context: { interaction: context.interaction } },
    { selectedElementIds: ['new-control'] }, { heroElementId: 'new-control' }, { replacements: [] },
    { exactWordingEvidence: 'unchanged' }, { detailsRefinement: { ...detailsRefinement, instruction: 'Model-authored instruction' } },
  ])('rejects details plans that mutate context, selection or the reviewed instruction: %j', patch => {
    expect(() => parseRevisionPlan({ scope: 'details', context: {}, summary: 'Clarify details.', ...patch }, planRequest)).toThrow();
  });
});
