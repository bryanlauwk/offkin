import { beforeEach, describe, expect, it } from 'vitest';
import { clearPlannerRecovery, loadPlannerRecovery, savePlannerRecovery } from './pilot-recovery';
import { emptyProposalSession, encodeProposalShare } from './proposal-session';
import type { RevisionPlanRequest } from './proposal-api';
const request:RevisionPlanRequest={contractVersion:'offkin-proposal-v10',action:'plan-revision',instruction:'Only the packaging should be navy',brand:'no-website',context:{business:'Paper gifts'},sourceWorldId:'00000000-0000-4000-8000-000000000001',sourcePhysicalId:'00000000-0000-4000-8000-000000000002',detailsId:'00000000-0000-4000-8000-000000000003',packagingId:'00000000-0000-4000-8000-000000000004'};
beforeEach(()=>localStorage.clear());
describe('Exact local planner recovery',()=>{
  it('survives reload keyed to the accepted revision without entering a public share snapshot',()=>{
    expect(savePlannerRecovery({acceptedId:'accepted',request})).toBe(true);expect(loadPlannerRecovery('accepted')).toEqual({acceptedId:'accepted',request});expect(loadPlannerRecovery('different')).toBeNull();
    expect(encodeProposalShare(emptyProposalSession())).not.toContain('Only the packaging');clearPlannerRecovery('accepted');expect(loadPlannerRecovery('accepted')).toBeNull();
  });
  it('rejects malformed requests, extra credential fields and excessive stored payloads',()=>{
    expect(savePlannerRecovery({acceptedId:'accepted',request:{...request,token:'secret'} as RevisionPlanRequest})).toBe(false);
    localStorage.setItem('offkin:pilot-planner-recovery:v1:accepted',JSON.stringify({version:1,acceptedId:'other',request}));expect(loadPlannerRecovery('accepted')).toBeNull();
    localStorage.setItem('offkin:pilot-planner-recovery:v1:accepted','x'.repeat(20001));expect(loadPlannerRecovery('accepted')).toBeNull();
  });
});
