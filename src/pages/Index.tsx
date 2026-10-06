import { useSearchParams } from 'react-router-dom';
import { lazy, Suspense } from 'react';
const LegacyConcept = lazy(() => import('./LegacyConcept'));
import CanvasStudio from '@/components/CanvasStudio';

export default function Index() {
  const [params] = useSearchParams();
  return params.get('concept') ? <Suspense fallback={<main aria-busy="true">Opening your concept…</main>}><LegacyConcept /></Suspense> : <CanvasStudio />;
}
