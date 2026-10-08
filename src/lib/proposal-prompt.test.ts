import { describe, expect, it } from 'vitest';
import { PRODUCT_PLAN_CORRECTION_PROMPT, PROPOSAL_PROMPT_REVISION, PROPOSAL_REVISION_PROMPT, legacyEngineeringDesignPrompt, proposalDesignPrompt, proposalImagePrompt } from '../../supabase/functions/generate-concept/proposal-prompt';
import { PROPOSAL_CONTRACT_VERSION, PROPOSAL_STAGE_VERSION, parseRevisionPlan, type RevisionPlanRequest } from '../../supabase/functions/generate-concept/proposal';

const current = {
  business: 'An independent paper-art studio.', angle: 'A connected paper garden', audience: 'Our partners',
  exactWording: '  Paper Studio\n纸上世界  ', style: 'Charcoal on warm paper', brandIdentifiers: 'Yellow paths and coral accents',
  interaction: 'Display only', mode: 'mechanical' as const, scale: 'Let the story decide', revisionNotes: 'Keep the illustrated garden rich.',
};
const request: RevisionPlanRequest = {
  contractVersion: PROPOSAL_CONTRACT_VERSION, action: 'plan-revision', brand: 'no-website', context: current,
  sourceWorldId: '10000000-0000-4000-8000-000000000001', sourcePhysicalId: '10000000-0000-4000-8000-000000000002',
  instruction: 'Keep the object and world exactly as they are. Make only the packaging deep navy blue.',
};

describe('proposal prompt corrections from live output review', () => {
  it('audits every existing assembly relationship before the one correction returns', () => {
    expect(PRODUCT_PLAN_CORRECTION_PROMPT).toContain('EVERY declared part and join');
    expect(PRODUCT_PLAN_CORRECTION_PROMPT).toContain('A previously assembled part is not implicitly included');
    expect(PRODUCT_PLAN_CORRECTION_PROMPT).toContain('steps [a,b] then [b,c] cover both');
    expect(PRODUCT_PLAN_CORRECTION_PROMPT).toContain('Do not append a blanket all-parts step');
    expect(PRODUCT_PLAN_CORRECTION_PROMPT).toContain('productPlan.purchasedParts[i]');
    expect(PRODUCT_PLAN_CORRECTION_PROMPT).toContain('productPlan.joins[i].partIds');
    expect(PRODUCT_PLAN_CORRECTION_PROMPT).toContain('Diagnostics are bounded');
  });
  it('versions prompt cache identity separately from saved manifest compatibility', () => {
    expect(PROPOSAL_PROMPT_REVISION).toBe('proposal-prompts-v8-creative-preview');
    expect(PROPOSAL_STAGE_VERSION).toBe('proposal-assets-v1');
  });
  it('keeps historical engineering plan validation isolated from public preview prompts', () => {
    const prompt = legacyEngineeringDesignPrompt('world');
    expect(prompt).toContain('"worldElements":[{"id":string');
    expect(prompt).toContain('Nested productPlan schema');
    expect(prompt).toContain('NOT the whole stage response');
    expect(prompt).not.toContain('Return one JSON object with exactly the following schema');
    expect(prompt).toContain('6000–8500 characters total');
    expect(prompt).toContain('ceilings, not targets');
  });
  it('bounds correction while preserving customer authority and unverified construction', () => {
    expect(PRODUCT_PLAN_CORRECTION_PROMPT).toContain('exactly one outer property: {"productPlan":PRODUCT_PLAN}');
    expect(PRODUCT_PLAN_CORRECTION_PROMPT).toContain('only correction attempt');
    expect(PRODUCT_PLAN_CORRECTION_PROMPT).toContain('Recheck the WHOLE plan');
    expect(PRODUCT_PLAN_CORRECTION_PROMPT).toContain('never drop a selection or replace the hero');
    expect(PRODUCT_PLAN_CORRECTION_PROMPT).toContain('actions MUST be []');
    expect(PRODUCT_PLAN_CORRECTION_PROMPT).toContain('10000 characters');
    expect(PRODUCT_PLAN_CORRECTION_PROMPT).toContain('Never claim supplier confirmation');
    expect(PRODUCT_PLAN_CORRECTION_PROMPT).toContain('No saved-image UUIDs');
  });
  it.each(['world', 'physical', 'details', 'packaging'] as const)('preserves grounded brand identity and exact wording while excluding invented microcopy for %s', stage => {
    const design = proposalDesignPrompt(stage);
    const image = proposalImagePrompt(stage, 'mechanical');
    expect(design).toContain('Authorized brand identity and requested copy are separate');
    expect(design).toContain('clearly grounded in the supplied business text or websiteEvidence');
    expect(design).toContain('Textual direction is not an uploaded asset, verified print-ready artwork or licensing proof');
    expect(image).toContain('preserve current context.exactWording verbatim');
    expect(image).toContain('Do not print JSON titles, story, element labels, material descriptions or proposed names');
    expect(image).toContain('Erase invented wording already visible in references');
    expect(image).toContain('Empty exactWording does not remove authorized branding');
    expect(image).toContain('No invented slogans');
    expect(image).toContain('Do not invent a logo design or verified colour specification from a name alone');
  });
  it('preserves visual richness first and defers engineering without making production claims',()=>{
    for(const stage of ['world','physical','details','packaging'] as const){
      const design=proposalDesignPrompt(stage);const image=proposalImagePrompt(stage,'mechanical');
      expect(design).toContain('Do not simplify the creative world for manufacturing');
      expect(design).toContain('metadata/UI limit, never a cap on visual details or manufactured parts');
      expect(design).toContain('request a quote and realistic build proposal');
      expect(design).toContain('unverified visual concept');
      expect(design).not.toContain('PRODUCT FIRST');expect(design).not.toContain('Nested productPlan schema');
      expect(image).toContain('no manufacturing part-count limit or rigid mechanism template');
      expect(image).toContain('unverified visual concept, never CAD, tested construction or production proof');
    }
    expect(proposalDesignPrompt('details')).toContain('not proof of detachable manufactured parts');
    expect(proposalDesignPrompt('packaging')).toContain('Packaging fit, protective structure');
  });
  it('requires concrete story elements rather than style or palette cards', () => {
    const prompt = proposalDesignPrompt('world');
    expect(prompt).toContain('worldElements must describe concrete meaningful story forms or scenes');
    expect(prompt).toContain('NEVER standalone element cards');
    expect(prompt).toContain('Do not return cards such as Warm Paper Expanse or Charcoal Linework');
  });
  it('spatially reinterprets the world without imposing small size, generic bases or simplified storytelling', () => {
    const prompt = proposalDesignPrompt('physical');
    expect(prompt).toContain('freestanding, fully dimensional collectible by default');
    expect(prompt).toContain('NOT a tracing template');
    expect(prompt).toContain('Do not dilute the details to satisfy a speculative fabrication limit');
    expect(prompt).toContain('Do NOT preserve the illustration’s rectangular outline');
    expect(prompt).toContain('prohibited unless the customer explicitly requested that form');
    expect(prompt).toContain('retain every selected meaning');
    expect(prompt).toContain('no universal palm-size limit');
    expect(prompt).toContain('A base is optional');
    expect(prompt).toContain('Do not reduce richness to one hero and a few props or force movement/electronics');
    expect(prompt).toContain('Do not apply etched illustration linework to every product surface');
  });
  it('distinguishes world-to-object reinterpretation from preserving the approved physical object', () => {
    const prompt = proposalImagePrompt('physical', 'mechanical');
    expect(prompt).toContain('For physical generation, the world image supplies story, palette and approved identity');
    expect(proposalImagePrompt('details', 'mechanical')).toContain('For details/packaging, the actual physical image is the object-identity authority');
    expect(proposalImagePrompt('world', 'mechanical')).not.toContain('Component forms must be complete, independently rendered');
    expect(proposalImagePrompt('world', 'mechanical')).not.toContain('Default packaging is ONE');
  });
  it('requests full isolated component forms rather than another hero or crop panels', () => {
    const prompt = proposalDesignPrompt('details');
    expect(prompt).toContain('dedicated landscape component sheet');
    expect(prompt).toContain('4–6 complete conceptual forms or visual groups');
    expect(prompt).toContain('entire silhouette');
    expect(prompt).toContain('generous negative space on every side');
    expect(prompt).toContain('Do not repeat a large full hero');
    expect(prompt).toContain('No zoom windows, close-up rectangles, cropped scene fragments');
    expect(prompt).toContain('not proof of detachable manufactured parts');
  });
  it('forbids a user-journey or implied response for Display only', () => {
    const prompt = proposalImagePrompt('details', 'mechanical');
    expect(prompt).toContain('Display only means static forms only');
    expect(prompt).toContain('no interaction strip, journey storyboard, numbered steps, motion arrows or implied response');
    expect(proposalDesignPrompt('details')).toContain('ONLY static component forms');
  });
  it('defaults packaging to one design and does not authorize inherited variants', () => {
    const design = proposalDesignPrompt('packaging');
    const image = proposalImagePrompt('packaging', 'mechanical');
    expect(design).toContain('Default output has NO series, variants, alternate colourways, edition lineup');
    expect(design).toContain('only an explicit request in current customer context permits');
    expect(image).toContain('Default packaging is ONE consistent design shown closed/open');
    expect(image).toContain('an example or previous generated variant lineup does not count');
  });
  it('asks the planner for a sparse packaging patch rather than copied physical fields', () => {
    expect(PROPOSAL_REVISION_PROMPT).toContain('SPARSE context patch containing ONLY fields actually changed');
    expect(PROPOSAL_REVISION_PROMPT).toContain('For scope packaging, context MUST contain ONLY revisionNotes');
    expect(PROPOSAL_REVISION_PROMPT).toContain('never copy, normalize, paraphrase or guess their values');
    expect(PROPOSAL_REVISION_PROMPT).toContain('Never guess physical materials from an image');
    expect(PROPOSAL_REVISION_PROMPT).not.toContain('next complete context');
    expect(PROPOSAL_REVISION_PROMPT).not.toContain('...complete current text fields');
  });
  it('merges a sparse packaging patch while preserving every accepted property and exact wording', () => {
    const note = 'Preserve the rich garden, existing world and object. Change only the packaging to deep navy blue.';
    const result = parseRevisionPlan({ scope: 'packaging', context: { revisionNotes: note }, summary: 'Change only the packaging colour.' }, request);
    expect(result.plan?.scope).toBe('packaging');
    expect(result.plan?.context).toEqual({ ...current, revisionNotes: note });
    expect(result.plan?.context.exactWording).toBe(current.exactWording);
    expect(result.plan?.context).not.toHaveProperty('materials');
  });
  it.each([
    { revisionNotes: 'Navy box', materials: 'Foam insert' },
    { revisionNotes: 'Navy box', style: 'Navy blue throughout' },
    { revisionNotes: 'Navy box', interaction: 'Turn to reveal' },
  ])('keeps the strict scope guard when a packaging patch changes protected fields: %j', patch => {
    expect(() => parseRevisionPlan({ scope: 'packaging', context: patch, summary: 'Navy box.' }, request)).toThrow();
  });
  it('preserves exact-wording and clarification safeguards with sparse plans', () => {
    const wording = parseRevisionPlan({ scope: 'world', context: { exactWording: 'Unrequested slogan' }, summary: 'New slogan.' }, request);
    expect(wording.clarification).toContain('exact wording'); expect(wording).not.toHaveProperty('plan');
    expect(parseRevisionPlan({ clarification: 'Should navy apply to the sleeve or the whole box?' }, request)).toEqual({ clarification: 'Should navy apply to the sleeve or the whole box?' });
  });
});

describe('reference-led art direction without an implicit engineering mode', () => {
  it('takes broad visual qualities from the supplied book references while keeping customer-specific content', () => {
    for (const prompt of [proposalDesignPrompt('world'), proposalImagePrompt('world')]) {
      expect(prompt).toContain('fine black hand-drawn outlines on warm ivory');
      expect(prompt).toContain('restrained brand-specific accent routes');
      expect(prompt).toContain('dense navigable isometric stacked collage');
      expect(prompt).toContain('playful scale shifts, tiny daily activities and unexpected object landmarks');
      expect(prompt).toContain('without copying their composition, characters, landmarks, printed text');
      expect(prompt).toContain('Yellow and Japanese motifs are not mandatory');
      expect(prompt).toContain('customer has not specified a different style');
    }
  });
  it('permits brief-supported conceptual lighting when no mode was chosen, while honoring explicit mechanical constraints', () => {
    const unspecified = proposalImagePrompt('physical');
    expect(unspecified).toContain('unspecified; follow the customer brief');
    expect(unspecified).toContain('No implicit mechanical-only restriction');
    expect(unspecified).toContain('lighting or movement only when supported by the customer brief');
    expect(unspecified).not.toContain('No powered electronics.');
    expect(unspecified).toContain('unengineered conceptual intent');
    expect(proposalImagePrompt('physical', 'mechanical')).toContain('No powered electronics.');
  });
});

describe('stylized collectible-toy visual language', () => {
  it.each(['world', 'physical'] as const)('preserves toy-like charm instead of a luxury maquette in %s', stage => {
    for (const prompt of [proposalDesignPrompt(stage), proposalImagePrompt(stage)]) {
      expect(prompt).toContain('oversized meaningful brand-specific icons');
      expect(prompt).toContain('tiny charming characters');
      expect(prompt).toContain('curved connected story paths');
      expect(prompt).toContain('luxury architectural maquette');
    }
    expect(proposalDesignPrompt('physical')).toContain('premium stylized resin/vinyl collectible-toy appearance');
    expect(proposalDesignPrompt('physical')).toContain('visual language rather than a committed material or manufacturing process');
    expect(proposalDesignPrompt('physical')).toContain('tactile matte/gloss colour blocking');
  });
});
