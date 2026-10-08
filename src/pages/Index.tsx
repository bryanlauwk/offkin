import { PROPOSAL_GENERATION_PAUSED } from '@/lib/proposal-availability';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { supportsProposalGeneration } from '@/lib/proposal-api';
const LegacyConcept = lazy(() => import('./LegacyConcept'));
import CanvasStudio from '@/components/CanvasStudio';
import ProposalStudio from '@/components/ProposalStudio';

export default function Index() {
  const [params] = useSearchParams();
  const location = useLocation();
  const legacyConcept = Boolean(params.get('concept'));
  const legacyCanvas = params.get('canvas') === 'legacy' || location.hash.startsWith('#world=');
  const savedProposal = params.get('proposal') === '1' || location.hash.startsWith('#proposal=');
  const explicitRoute = legacyConcept || legacyCanvas || savedProposal;
  const [proposalReady, setProposalReady] = useState<boolean | null>(null);
  useEffect(() => {
    if (explicitRoute || PROPOSAL_GENERATION_PAUSED) return;
    const abort = new AbortController(); let live = true; setProposalReady(null);
    const timer = window.setTimeout(() => { if (live) { abort.abort(); setProposalReady(false); } }, 6000);
    supportsProposalGeneration(abort.signal).then(ready => { if (live && !abort.signal.aborted) setProposalReady(ready); }).catch(() => { if (live && !abort.signal.aborted) setProposalReady(false); }).finally(() => clearTimeout(timer));
    return () => { live = false; clearTimeout(timer); abort.abort(); };
  }, [explicitRoute]);
  if (legacyConcept) return <Suspense fallback={<main aria-busy="true">Opening your concept…</main>}><LegacyConcept /></Suspense>;
  if (legacyCanvas) return <CanvasStudio />;
  // Saved proposals can always be restored without generation, including during an outage.
  if (savedProposal || PROPOSAL_GENERATION_PAUSED || proposalReady === true) return <ProposalStudio simple />;
  if (proposalReady === null) return <main className="op-app" aria-busy="true"><p className="op-service">Opening your creative studio…</p></main>;
  // Never replace a working two-stage release with a disabled four-stage generator.
  // A v10 brief is not sent to the older API; this is an explicitly labelled separate canvas.
  return <ProposalStudio simple />;
}
