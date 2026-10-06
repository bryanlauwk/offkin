import { useId } from 'react';
import { ArrowUpRight, Expand, Sparkles, Star } from 'lucide-react';
import type { CanvasConcept, WorldElement } from '@/lib/canvas-api';
import type { CanvasSession } from '@/lib/canvas-session';
import type { WorldReference } from '@/lib/world-references';
import './conversation-board.css';

export interface ConversationBoardProps {
  world: CanvasConcept | null;
  physical: CanvasConcept | null;
  session: CanvasSession;
  hasOwnWorld: boolean;
  reference: WorldReference;
  imageErrors: Record<string, boolean>;
  onImageError: (src: string) => void;
  onRetryImage?: (src: string) => void;
  onEnlarge: () => void;
  onEditElements: () => void;
  worldIsCurrent?: boolean;
  physicalIsCurrent?: boolean;
}

/** An editorial result, not an image editor. Each displayed image is a complete source image. */
export default function ConversationBoard({
  world, physical, session, hasOwnWorld, reference, imageErrors,
  onImageError, onRetryImage, onEnlarge, onEditElements, worldIsCurrent = true, physicalIsCurrent = true,
}: ConversationBoardProps) {
  const headingId = useId();
  const elementsHeadingId = useId();
  // A saved or shared world must never fall back to another brand's reference artwork.
  const ownsWorld = hasOwnWorld || Boolean(world || session.worldId || session.sharedWorld);
  const ownWorldId = world?.id || session.worldId;
  const physicalStudy = ownsWorld && physical?.stage === 'physical' && ownWorldId && physical.sourceWorldId === ownWorldId
    ? physical : null;
  const story = world || session.sharedWorld;
  const elements: WorldElement[] = story?.worldElements || [];
  const selectedElements = elements.filter(element => session.selected.includes(element.id));
  const replacements = new Map(session.replacements.map(item => [item.id, item]));
  const worldImage = world?.image || '';
  const brand = world?.brand || 'Your brand world';
  const title = story?.title || 'Your saved brand world';
  const exactWording = world?.context.exactWording;

  if (!ownsWorld) {
    return <article className="cb-board cb-board--reference" aria-labelledby={headingId}>
      <header className="cb-reference-heading">
        <div><p className="cb-eyebrow">An example of where a conversation can go</p><h2 id={headingId}>{reference.name}, imagined as a world</h2></div>
        <span className="cb-study-label">Unofficial visual study</span>
      </header>
      <figure className="cb-reference-figure">
        {imageErrors[reference.boardImage]
          ? <div className="cb-image-missing"><strong>The original board couldn’t load</strong><p>{reference.story}</p></div>
          : <button className="cb-reference-image" type="button" onClick={onEnlarge} aria-label={`Enlarge the complete ${reference.name} example board`}>
            <img src={reference.boardImage} alt={`${reference.name} original complete concept board: illustrated brand world, collectible proposal, story elements and speculative design studies`} width="1536" height="1024" onError={() => onImageError(reference.boardImage)} decoding="async" />
            <span className="cb-image-enlarge"><Expand size={14} aria-hidden="true" /> View full board</span>
          </button>}
        <figcaption className="cb-reference-caption"><span>{reference.sourceLabel}</span><span>One story. A world of possibilities.</span></figcaption>
      </figure>
      <footer className="cb-board-footer"><p>{reference.disclosure}</p></footer>
    </article>;
  }

  return <article className={`cb-board${physicalStudy ? ' cb-board--physical' : ''}`} aria-labelledby={headingId}>
    <header className="cb-masthead">
      <div className="cb-brand-identity">
        <p className="cb-eyebrow">Your business DNA, reimagined</p>
        <p className="cb-brand-name">{brand}</p>
        {exactWording?.trim() && <p className="cb-brand-wording">{exactWording}</p>}
      </div>
      <div className="cb-story-intro">
        <p className="cb-eyebrow">The world &amp; its story</p>
        <h2 id={headingId}>{title}</h2>
        <p className="cb-story">{story?.story || 'The saved artwork and story aren’t available here yet. Your selected elements and direction are still in your brief.'}</p>
      </div>
    </header>

    <div className="cb-artwork-layout">
      <figure className="cb-world-figure">
        <div className="cb-section-heading cb-image-heading"><span className="cb-section-number">01</span><h3>The illustrated world</h3>{world && !worldIsCurrent && <span className="cb-version-badge">Previous direction</span>}{worldImage && !imageErrors[worldImage] && <button type="button" className="cb-text-action" onClick={onEnlarge} aria-label="Enlarge your illustrated world"><Expand size={14} aria-hidden="true" /><span>Enlarge</span></button>}</div>
        <div className="cb-world-art">
          {worldImage && !imageErrors[worldImage]
            ? <img src={worldImage} alt={`${title} — your generated illustrated brand world`} onError={() => onImageError(worldImage)} decoding="async" />
            : <div className="cb-image-missing"><Sparkles size={25} strokeWidth={1.3} aria-hidden="true" /><strong>{worldImage ? 'The illustration couldn’t load' : 'Your world, saved as a story'}</strong><p>{worldImage ? 'The story and element descriptions are still available below.' : 'This version has no available image. Its story and selections remain in your brief.'}</p>{worldImage && onRetryImage && <button className="cb-text-action" type="button" onClick={() => onRetryImage(worldImage)}>Try image again</button>}</div>}
        </div>
        <figcaption className="cb-art-caption"><span>A connected world, built around your story</span><span>Illustration study</span></figcaption>
      </figure>

      {physicalStudy && <figure className="cb-physical-figure">
        <div className="cb-section-heading cb-image-heading"><span className="cb-section-number">02</span><h3>From world to collectible</h3>{!physicalIsCurrent && <span className="cb-version-badge">Previous concept</span>}</div>
        <div className="cb-physical-art">
          {physicalStudy.image && !imageErrors[physicalStudy.image]
            ? <img src={physicalStudy.image} alt={`${physicalStudy.title} — generated physical concept`} onError={() => onImageError(physicalStudy.image)} decoding="async" />
            : <div className="cb-image-missing"><strong>The physical concept image isn’t available</strong><p>Its proposed story and interaction are preserved below.</p></div>}
        </div>
        <figcaption className="cb-physical-caption"><h3>{physicalStudy.title}</h3><p>{physicalStudy.story}</p></figcaption>
      </figure>}
    </div>

    <section className="cb-elements-section" aria-labelledby={elementsHeadingId}>
      <div className="cb-section-heading cb-elements-heading"><span className="cb-section-number">{physicalStudy ? '03' : '02'}</span><h3 id={elementsHeadingId}>{physicalStudy && !physicalIsCurrent ? 'Elements for your next concept' : 'The elements that tell your story'}</h3><button type="button" className="cb-text-action" onClick={onEditElements}>Refine elements <ArrowUpRight size={14} aria-hidden="true" /></button></div>
      <p className="cb-section-intro">{selectedElements.length ? `${selectedElements.length} selected story ${selectedElements.length === 1 ? 'element' : 'elements'}. One connected world.` : elements.length ? 'Choose the elements you want to carry into the physical concept.' : 'The element descriptions need to be restored before they can be shown here.'}{physicalStudy && !physicalIsCurrent ? ' These choices haven’t been applied to the image above yet.' : ''}</p>
      {selectedElements.length > 0 && <ol className="cb-element-grid">{selectedElements.map((element, index) => {
        const replacement = replacements.get(element.id);
        const hero = session.hero === element.id;
        return <li className={`cb-element-card${hero ? ' cb-element-card--hero' : ''}`} key={element.id}>
          <div className="cb-element-topline"><span className="cb-element-number">{String(index + 1).padStart(2, '0')}</span>{hero && <span className="cb-hero-label"><Star size={11} aria-hidden="true" /> Main character</span>}</div>
          <h4>{replacement?.label || element.label}</h4>
          <p>{replacement?.description || element.description}</p>
          <div className="cb-element-provenance">{replacement ? `Proposed replacement for ${element.label}` : element.kind === 'proposal' ? 'Creative interpretation' : 'From your world’s story'}</div>
        </li>;
      })}</ol>}
    </section>

    <div className="cb-design-bottom">
      <section className="cb-interaction-section" aria-label={physicalStudy ? 'Proposed interaction' : 'The next physical direction'}>
        <p className="cb-eyebrow">{physicalStudy ? 'A little interaction. A bigger story.' : 'The next chapter'}</p>
        <h3>{physicalStudy ? 'How it could come to life' : 'From a world to something you can hold'}</h3>
        <p className="cb-interaction-copy">{physicalStudy
          ? physicalStudy.interaction || 'An interaction hasn’t been described for this study yet.'
          : 'The elements you choose will shape the physical concept. Keep exploring the story in the conversation, then ask to see it as a collectible.'}</p>
        {physicalStudy && <p className="cb-small-note">Proposed interaction{physicalIsCurrent ? '' : ' from the previous version'} · to be explored through design and prototyping</p>}
      </section>
      <section className="cb-further-section" aria-label="Further design">
        <p className="cb-eyebrow">Further design</p>
        <h3>A world worth taking further</h3>
        <p>Packaging, companion pieces and construction can be developed in the next design stage. Scale, materials and movement will follow the story and a prototype review.</p>
        {(world?.design || physicalStudy?.design) && <details className="cb-design-details">
          <summary>Read the design direction <span aria-hidden="true">+</span></summary>
          {world?.design && <div><h4>Illustrated world</h4><p>{world.design}</p></div>}
          {physicalStudy?.design && <div><h4>Physical concept{physicalIsCurrent ? '' : ' · previous version'}</h4><p>{physicalStudy.design}</p></div>}
        </details>}
      </section>
    </div>
    <footer className="cb-board-footer"><span>Creative concept · {physicalStudy ? 'physical design study' : 'illustrated world'}</span><p>Artwork, movement and construction need review before production. This is an idea to develop together.</p></footer>
  </article>;
}
