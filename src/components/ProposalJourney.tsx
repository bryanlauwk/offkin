import { ArrowDown } from 'lucide-react';
import { MarketingArtwork } from './ProposalMarketing';

const stages = [
  { name: 'Brand world', description: 'Find the story, characters and visual language.', art: 'world' as const },
  { name: 'Collectible', description: 'Choose the story worth holding.', art: 'collectible' as const },
  { name: 'Components & interaction', description: 'Explore proposed parts, joins and how it could move.', art: 'components' as const },
  { name: 'Packaging concept', description: 'Complete the story around the object.', art: 'packaging' as const },
];

/** Orientation only: these are stages of a proposal, never sample customer results. */
export default function ProposalJourney({ compact = false }: { compact?: boolean }) {
  return <section id="proposal-worlds" tabIndex={-1} className={`op-journey${compact ? ' op-journey--compact' : ''}`} aria-label="Four connected proposal stages">
    {!compact && <div className="op-journey-heading"><div><h2>From your story to a little world.</h2></div></div>}
    <ol>{stages.map(({ name, description, art }, index) => <li key={name}>
      <div className="op-step-top"><span>{String(index + 1).padStart(2, '0')}</span></div>
      <div className="op-step-copy"><h3>{name}</h3>{!compact && <p>{description}</p>}</div>{!compact && <MarketingArtwork kind={art}/>}
    </li>)}</ol>
    {!compact && <p className="op-journey-note"><ArrowDown size={15} aria-hidden="true"/>A physical product plan comes first. Final design, CAD, prototyping and production are scoped together after concept review.</p>}
  </section>;
}
