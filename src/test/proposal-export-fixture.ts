import { PROPOSAL_STAGES, type ProposalConcept, type ProposalStage } from '@/lib/proposal-api';
import { emptyProposalSession, type ProposalSession } from '@/lib/proposal-session';
export const EXPORT_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGfQAAAAASUVORK5CYII=';
export const exportIds = { world: '00000000-0000-4000-8000-000000000001', physical: '00000000-0000-4000-8000-000000000002', details: '00000000-0000-4000-8000-000000000003', packaging: '00000000-0000-4000-8000-000000000004' };
export function exportFixture() {
  const session: ProposalSession = emptyProposalSession();
  session.context.business = 'We make layered paper gifts'; session.context.exactWording = '  字 Keep me  '; session.context.interaction = 'Turn the attached moon';
  session.customerIdentity = { version: 'customer-brand-v1', name: 'Paper Finch 字' };
  session.accepted = { id: 'accepted-visual-revision', customerIdentity: session.customerIdentity, website: 'https://paper.example', context: session.context, assets: { ...exportIds }, selected: ['moon'], hero: 'moon', replacements: [{ id: 'moon', label: 'Moon dial', description: 'Keep the dial attached to the arch' }] };
  const asset = (stage: ProposalStage): ProposalConcept => ({ contractVersion: 'offkin-proposal-v10', stageVersion: 'proposal-assets-v1', id: exportIds[stage], stage, customerIdentity: session.customerIdentity, brand: session.customerIdentity!.name, context: session.context, title: `Paper ${stage}`, story: `Original ${stage} story`, design: 'Layered arches with a moon dial', interaction: 'Turn the attached moon to reveal a reply', image: EXPORT_PNG, sourceUrl: 'https://unused-source.example', sourceTitle: '', worldElements: [{ id: 'moon', label: 'Moon', description: 'The attached moon dial', kind: 'proposal' }], sourceImageIds: stage === 'world' ? [] : stage === 'physical' ? [exportIds.world] : stage === 'details' ? [exportIds.physical] : [exportIds.physical, exportIds.world], ...(stage !== 'world' ? { sourceWorldId: exportIds.world, selectedElementIds: ['moon'], heroElementId: 'moon', replacements: [] } : {}), ...(['details', 'packaging'].includes(stage) ? { sourcePhysicalId: exportIds.physical } : {}) });
  return { session, all: Object.fromEntries(PROPOSAL_STAGES.map(stage => [exportIds[stage], asset(stage)])) };
}
