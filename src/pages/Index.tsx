import { PROPOSAL_GENERATION_PAUSED, PROPOSAL_SIMPLE_MODE } from '@/lib/proposal-availability';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { supportsProposalGeneration } from '@/lib/proposal-api';
import { supportsPairedGeneration } from '@/lib/paired-api';
const LegacyConcept = lazy(() => import('./LegacyConcept'));
const PairedConceptReview = lazy(() => import('@/components/PairedConceptReview'));
const PairedLiveStudio = lazy(() => import('@/components/PairedLiveStudio'));
import CanvasStudio from '@/components/CanvasStudio';
import ProposalStudio from '@/components/ProposalStudio';

export default function Index() {
  const [params] = useSearchParams();
  const location = useLocation();
  const legacyConcept = Boolean(params.get('concept'));
  const legacyCanvas = params.get('canvas') === 'legacy' || location.hash.startsWith('#world=');
  const savedProposal = params.get('proposal') === '1' || location.hash.startsWith('#proposal=');
  const pairedReview = params.get('engine') === 'paired-draft';
  const explicitRoute = legacyConcept || legacyCanvas || savedProposal || pairedReview;
  const [proposalReady, setProposalReady] = useState<boolean | null>(null);
  const [pairedReady, setPairedReady] = useState<boolean | null>(null);
  useEffect(() => {
    if (explicitRoute || PROPOSAL_GENERATION_PAUSED) return;
    const abort = new AbortController(); let live = true; setProposalReady(null);
    const timer = window.setTimeout(() => { if (live) { abort.abort(); setProposalReady(false); } }, 6000);
    Promise.all([supportsProposalGeneration(abort.signal),supportsPairedGeneration(abort.signal)]).then(([proposal,paired]) => { if (live && !abort.signal.aborted) {setProposalReady(proposal);setPairedReady(paired);} }).catch(() => { if (live && !abort.signal.aborted) {setProposalReady(false);setPairedReady(false);} }).finally(() => clearTimeout(timer));
    return () => { live = false; clearTimeout(timer); abort.abort(); };
  }, [explicitRoute]);
  if (legacyConcept) return <Suspense fallback={<main aria-busy="true">Opening your concept…</main>}><LegacyConcept /></Suspense>;
  if (legacyCanvas) return <CanvasStudio />;
  if (pairedReview) return <Suspense fallback={<main aria-busy="true">Opening offline design review…</main>}><PairedConceptReview /></Suspense>;
  if (!savedProposal && pairedReady === true) return <Suspense fallback={<main aria-busy="true">Opening linked concept studio…</main>}><PairedLiveStudio /></Suspense>;
  // Saved proposals can always be restored without generation, including during an outage.
  if (savedProposal || PROPOSAL_GENERATION_PAUSED || proposalReady === true) return <ProposalStudio simple={PROPOSAL_SIMPLE_MODE} />;
  if (proposalReady === null || pairedReady === null) return <main className="op-app" aria-busy="true"><p className="op-service">Opening your creative studio…</p></main>;
  // Never replace a working two-stage release with a disabled four-stage generator.
  // A v10 brief is not sent to the older API; this is an explicitly labelled separate canvas.
  if (PROPOSAL_SIMPLE_MODE) return <ProposalStudio simple />;
  return <><aside className="op-rollout-notice" role="status">Complete proposal generation is not available yet. This earlier canvas creates world and physical studies only. <Link to="/?proposal=1">Open a saved complete proposal</Link></aside><CanvasStudio /></>;
}
