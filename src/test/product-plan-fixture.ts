import type { ProductPlan } from '../../supabase/functions/generate-concept/product-plan';

/** A complete unverified proposal for exercising generation, restore and refinement contracts. */
export function makeProductPlan(storyElementIds: string[] = ['brand-story']): ProductPlan {
  return {
    version: 'product-plan-v1',
    status: 'unverified-prototype-plan',
    productIntent: 'A story-led corporate collectible whose sculpted crest carries the selected brand details.',
    silhouette: 'An asymmetric sculpted crest nested into a shaped display base.',
    heroPartId: 'story-hero',
    scale: { status: 'unresolved', direction: 'Choose the overall scale after reviewing the story details, display setting and print process.' },
    process: 'undecided',
    parts: [
      {
        id: 'story-hero', name: 'Story crest', storyElementIds: [...storyElementIds],
        form: 'One solid sculpted crest with integrated relief representing the selected story elements.',
        process: 'undecided', printStrategy: 'Review orientation and support access in CAD and the chosen slicer before proposing a print setup.',
        finish: 'Propose a compatible colour finish after testing the selected material on a sample.',
      },
      {
        id: 'display-base', name: 'Display base', storyElementIds: [],
        form: 'A stable shaped plinth with a proposed mating seat for the crest.',
        process: 'undecided', printStrategy: 'Investigate a flat contact surface and support-free access to the mating seat in the slicer.',
        finish: 'Test surface preparation and colour compatibility on a material sample.',
      },
    ],
    joins: [{
      id: 'crest-seat', partIds: ['story-hero', 'display-base'], method: 'Proposed keyed seat',
      rationale: 'Locate the crest on the base while leaving fit and retention unresolved until prototyping.',
      validation: { status: 'unverified', check: 'Review mating geometry in CAD, then test alignment, retention and stability with a physical sample.' },
    }],
    assembly: [{ step: 1, partIds: ['story-hero', 'display-base'], instruction: 'Inspect and finish both parts, trial-fit the crest in its seat, then evaluate the proposed retention method.' }],
    actions: [],
    risks: ['Relief details may lose definition in the selected printing process.', 'An untested crest-to-base fit may be loose or damage the parts.'],
    manufacturingUnknowns: ['Printer, material, orientation and support requirements are unresolved.', 'Final dimensions, fit, finishing compatibility, cost and physical stability require offline prototyping.'],
    verificationGates: [
      { id: 'cad-review', status: 'unverified' },
      { id: 'slicer-review', status: 'unverified' },
      { id: 'fit-test', status: 'unverified' },
      { id: 'physical-prototype', status: 'unverified' },
      { id: 'finish-assembly-review', status: 'unverified' },
    ],
  };
}
