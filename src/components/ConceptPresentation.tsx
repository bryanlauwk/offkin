import { useState } from 'react';
import { ArrowUpRight, Image, MousePointer2 } from 'lucide-react';
import { ConceptStudy } from './ConceptStudy';
import type { HomepageStudy } from '@/lib/homepage-studies';
import './ConceptPresentation.css';

export function ConceptPresentation({ study }: { study: HomepageStudy }) {
  const [view, setView] = useState<'visual' | 'interaction'>('visual');
  const [failedImage, setFailedImage] = useState<string>();
  return <div className="concept-presentation">
    <div className="concept-view-options" role="group" aria-label={`${study.brand} study view`}>
      <button type="button" aria-pressed={view === 'visual'} onClick={() => setView('visual')}><Image size={14} aria-hidden="true" />Visual concept</button>
      <button type="button" aria-pressed={view === 'interaction'} onClick={() => setView('interaction')}><MousePointer2 size={14} aria-hidden="true" />{study.mode === 'electronic' ? 'Response sketch' : 'Interaction sketch'}<ArrowUpRight size={14} aria-hidden="true" /></button>
    </div>
    {view === 'visual' ? <figure className="concept-visual" aria-label={`${study.brand} visual proposal`}>
      <div className="concept-visual-image">
        {failedImage === study.image ? <div className="concept-visual-error"><p>The visual couldn’t load.</p><button type="button" onClick={() => setView('interaction')}>Explore the illustration instead <ArrowUpRight size={15} aria-hidden="true" /></button></div> : <img key={study.image} src={study.image} alt={study.imageAlt} width={1024} height={1024} loading="eager" decoding="async" onError={() => setFailedImage(study.image)} />}
        <span className="concept-visual-label">AI VISUAL / {study.mode === 'electronic' ? 'ELECTRONIC STUDY' : 'MECHANICAL STUDY'}</span>
      </div>
      <figcaption><p>{study.visualNote}</p><span>Visual proposal · not production CAD</span></figcaption>
    </figure> : <div className="concept-interaction-view" aria-label={`${study.brand} illustrated interaction`}>
      <ConceptStudy kind={study.kind} />
      <p className="concept-sketch-note">{study.mode === 'electronic' ? 'A simulated display-and-light response. No live hardware or AI is connected.' : 'A possible interaction, illustrated. The mechanism and construction may differ from the visual concept.'}</p>
    </div>}
  </div>;
}
