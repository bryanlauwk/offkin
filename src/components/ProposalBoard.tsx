import { useId } from 'react';
import { Check, Expand, ImageOff, LoaderCircle, PackageOpen, Sparkles } from 'lucide-react';
import type { ProposalConcept, ProposalStage } from '@/lib/proposal-api';
import './proposal-board.css';
import { isProductPlan, productPlanText, productPlanInteraction } from '../../supabase/functions/generate-concept/product-plan';
import { Button } from './ui/button';

export type ProposalAssets = Partial<Record<ProposalStage, ProposalConcept>>;
export interface ProposalBoardProps {
  /** Presentation adapter only: the v10 world is not claimed to be a newly generated story card. */
  pairedPresentation?: boolean;
  assets: ProposalAssets;
  pendingAssets?: ProposalAssets;
  updating?: boolean;
  progress?: string;
  imageErrors: Record<string, boolean>;
  onImageError: (src: string) => void;
  onRetryImage?: (src: string) => void;
  onEnlarge?: (concept: ProposalConcept, trigger: HTMLButtonElement) => void;
}

const panels: { stage: ProposalStage; label: string; description: string }[] = [
  { stage: 'physical', label: 'Collectible', description: 'The physical concept at the heart of this proposal' },
  { stage: 'world', label: 'Brand world', description: 'The story behind the same physical collectible' },
  { stage: 'details', label: 'Components & interaction', description: 'Story details and proposed behaviour of the same collectible' },
  { stage: 'packaging', label: 'Packaging concept', description: 'A visual packaging direction for this collectible' },
];

// The orchestrator supplies a single accepted version. Pending revision assets are
// deliberately used only for progress, never as image or narrative fallbacks.
function acceptedAsset(assets: ProposalAssets, stage: ProposalStage) {
  const concept = assets[stage];
  return concept?.stage === stage ? concept : undefined;
}

function connectedAssets(assets: ProposalAssets): ProposalAssets {
  const world = acceptedAsset(assets, 'world');
  const candidate = acceptedAsset(assets, 'physical');
  const physical = world && candidate?.sourceWorldId === world.id && candidate.sourceImageIds?.includes(world.id) ? candidate : undefined;
  const result: ProposalAssets = { ...(world ? {world} : {}), ...(physical ? {physical} : {}) };
  if (world && physical) for (const stage of ['details', 'packaging'] as const) {
    const item = acceptedAsset(assets, stage);
    if (item?.sourceWorldId === world.id && item.sourcePhysicalId === physical.id && item.sourceImageIds?.includes(physical.id) && (stage !== 'packaging' || item.sourceImageIds.includes(world.id))) result[stage] = item;
  }
  return result;
}

function Narrative({ text, className = '' }: { text?: string; className?: string }) {
  if (!text?.trim()) return null;
  const sentence = text.match(/^[\s\S]{30,280}?[.!?。！？](?:\s|$)/u)?.[0]?.trim();
  const intro = text.length <= 320 ? text : sentence;
  if (!intro) return <details className={`pb-narrative ${className}`}><summary>Read the story <span aria-hidden="true">+</span></summary><p>{text}</p></details>;
  return <div className={className}><p className="pb-summary">{intro}</p>{text.length > 320 && <details className="pb-narrative"><summary>Read the full story <span aria-hidden="true">+</span></summary><p>{text}</p></details>}</div>;
}

function ProposalArtwork({ stage, concept, imageErrors, onImageError, onRetryImage, onEnlarge }: { stage: ProposalStage; concept?: ProposalConcept } & Pick<ProposalBoardProps, 'imageErrors' | 'onImageError' | 'onRetryImage' | 'onEnlarge'>) {
    const panel = panels.find(item => item.stage === stage);
    if (!panel) return null;
    const visibleConcept = concept?.image && !imageErrors[concept.image] ? concept : undefined;
    const available = Boolean(visibleConcept);
    const failed = Boolean(concept?.image && imageErrors[concept.image]);
    const alt = concept ? `${concept.brand}: ${concept.title}, generated ${panel.label.toLowerCase()} study` : '';
    return <figure className={`pb-artwork pb-artwork--${stage}`}>
      <div className="pb-panel-heading"><div><span className="pb-section-number">{({world:'02',physical:'01',details:'03',packaging:'04'})[stage]}</span><h3>{panel.label}</h3></div>{visibleConcept && onEnlarge && <Button variant="ghost" type="button" className="pb-enlarge" onClick={event => onEnlarge(visibleConcept, event.currentTarget)} aria-label={`Enlarge ${panel.label.toLowerCase()}`}><Expand size={13} aria-hidden="true"/><span>View</span></Button>}</div>
      {visibleConcept
        ? onEnlarge
          ? <Button variant="ghost" className="pb-image-button" type="button" aria-label={`Open ${panel.label.toLowerCase()} image`} onClick={event => onEnlarge(visibleConcept, event.currentTarget)}><img key={visibleConcept.image} src={visibleConcept.image} alt={alt} onError={() => onImageError(visibleConcept.image)} decoding="async"/></Button>
          : <div className="pb-image"><img key={visibleConcept.image} src={visibleConcept.image} alt={alt} onError={() => onImageError(visibleConcept.image)} decoding="async"/></div>
        : <div className="pb-unavailable">{failed ? <ImageOff size={24} strokeWidth={1.3} aria-hidden="true"/> : stage === 'packaging' ? <PackageOpen size={25} strokeWidth={1.2} aria-hidden="true"/> : <Sparkles size={24} strokeWidth={1.2} aria-hidden="true"/>}<strong>{failed ? `${panel.label} image couldn’t load` : concept ? `${panel.label} image is unavailable` : `${panel.label} is not ready yet`}</strong><p>{concept ? 'The saved direction is still here.' : 'This panel appears when its own visual has been generated.'}</p>{failed && concept && onRetryImage && <Button variant="outline" type="button" className="pb-retry" onClick={() => onRetryImage(concept.image)} aria-label={`Retry ${panel.label.toLowerCase()} image`}>Try image again</Button>}</div>}
      {concept && <figcaption><span>{stage === 'world' ? 'Illustrated brand world' : stage === 'physical' ? 'Physical concept study' : stage === 'details' ? 'Generated component & interaction sheet' : 'Generated packaging study'}</span><span>Concept exploration</span></figcaption>}
    </figure>;
  }


export default function ProposalBoard({ pairedPresentation = false, assets, pendingAssets = {}, updating = false, progress = '', imageErrors, onImageError, onRetryImage, onEnlarge }: ProposalBoardProps) {
  const boardHeading = useId();
  const accepted = connectedAssets(assets);
  const { world, physical, details, packaging } = accepted;
  const pending = connectedAssets(pendingAssets);
  const hasAccepted = panels.some(({ stage }) => Boolean(accepted[stage]));
  const completed = panels.filter(({ stage }) => Boolean(pending[stage]?.image)).length;
  const lineageProblem = panels.some(({stage})=>Boolean(assets[stage]&&!accepted[stage]));
  const imageProps = { imageErrors, onImageError, onRetryImage, onEnlarge };
  const brand = world?.brand || physical?.brand || 'Your brand';
  const title = physical?.title || world?.title || 'A world only your story could make';
  const elements = details?.worldElements || physical?.worldElements || world?.worldElements || [];
  const exactWording = world?.context?.exactWording || physical?.context?.exactWording;
  const planSource = physical || world;
  const candidatePlan = planSource?.productPlan;
  const productPlan = candidatePlan && isProductPlan(candidatePlan, planSource?.worldElements.map(e => e.id)) ? candidatePlan : undefined;
  const leadStory = physical?.story || world?.story;
  const interaction = productPlan ? productPlanInteraction(productPlan) : details?.interaction || physical?.interaction;


  return <article className={`pb-board${pairedPresentation ? ' pb-board--paired' : ''}${hasAccepted ? '' : ' pb-board--waiting'}`} aria-labelledby={boardHeading} aria-busy={updating && !hasAccepted}>
    {(updating || progress) && <div className="pb-progress" role="status" aria-live="polite"><div>{updating && <LoaderCircle className="pb-spin" size={16} aria-hidden="true"/>}<strong>{progress || (hasAccepted ? 'Creating your next version…' : 'Creating your complete proposal…')}</strong>{updating && <span className="pb-progress-count">{completed} / {panels.length} visuals</span>}</div>{updating && <ol aria-label="Proposal generation progress">{panels.map(({ stage, label }) => <li className={pending[stage]?.image ? 'pb-progress-done' : ''} key={stage}>{pending[stage]?.image ? <Check size={11} aria-hidden="true"/> : <span className="pb-progress-dot" aria-hidden="true"/>}{label}</li>)}</ol>}{updating && hasAccepted && <p>Your current version stays here until the complete update is ready.</p>}</div>}
    {lineageProblem && <p className="pb-lineage-warning" role="status">Some saved panels do not match this version. Restore the matching proposal to view them.</p>}
    <header className="pb-masthead"><div className="pb-identity"><p className="pb-eyebrow">OFFKIN / COLLECTIBLE-LED BRAND WORLD</p><p className="pb-brand">{hasAccepted ? brand : 'Your story, taking shape.'}</p>{exactWording?.trim() && <p className="pb-exact-wording">{exactWording}</p>}</div><div className="pb-story"><span className="pb-edition">Concept preview</span><h2 id={boardHeading}>{title}</h2><Narrative text={leadStory}/></div></header>
    <div className="pb-hero-grid">{pairedPresentation ? <><ProposalArtwork {...imageProps} stage="physical" concept={physical}/><ProposalArtwork {...imageProps} stage="world" concept={world}/></> : <><ProposalArtwork {...imageProps} stage="world" concept={world}/><div className="pb-physical"><ProposalArtwork {...imageProps} stage="physical" concept={physical}/></div></>}</div>
    {pairedPresentation && <p className="pb-legacy-note">Saved v10 brand-world artwork · not a newly generated paired story card. Exact lettering needs separate artwork proof.</p>}
    <details className="pb-supporting" open={pairedPresentation ? undefined : true}><summary>Supporting studies & proposed interaction</summary><div className="pb-lower-grid"><section className="pb-components" aria-label="Component and interaction proposal"><ProposalArtwork {...imageProps} stage="details" concept={details}/>{details && details.story !== leadStory && <Narrative text={details.story} className="pb-sheet-story"/>}{elements.length > 0 && <div className="pb-element-index" aria-label="Story element names">{elements.map(element=><span key={element.id}>{element.label}</span>)}</div>}{elements.length > 0 && <details className="pb-element-details"><summary>Meet the {elements.length} story {elements.length === 1 ? 'element' : 'elements'} <span aria-hidden="true">+</span></summary><ol>{elements.map((element, index) => <li key={element.id}><span className="pb-element-number">{String(index + 1).padStart(2, '0')}</span><div><h4>{element.label}</h4><p>{element.description}</p><span className="pb-provenance">{element.kind === 'fact' ? 'Source-based story element' : 'Creative proposal'}</span></div></li>)}</ol></details>}{interaction && <section className="pb-interaction" aria-label="Proposed interaction"><span className="pb-eyebrow">How it could come to life</span><p>{interaction}</p><small>Proposed behaviour · to be tested in a physical prototype</small></section>}</section><section className="pb-packaging" aria-label="Packaging proposal"><ProposalArtwork {...imageProps} stage="packaging" concept={packaging}/>{packaging && <div className="pb-packaging-copy"><h3>{packaging.title !== title ? packaging.title : 'Made to present and protect'}</h3>{packaging.story !== leadStory && <Narrative text={packaging.story}/>}</div>}</section></div></details>
    <footer className="pb-footer"><span>One brand world. Many details worth keeping.</span><p>Concept preview. Final design, functionality and pricing confirmed during the build proposal.</p></footer>
  </article>;
}
