import { ArrowDown } from 'lucide-react';
import { MarketingArtwork } from './ProposalMarketing';

const stages = [
  { name: 'Brand world', description: 'Find the story, characters and visual language.', art: 'world' as const },
  { name: 'Collectible', description: 'Choose the story worth holding.', art: 'collectible' as const },
  { name: 'Components & interaction', description: 'Explore rich story details and playful proposed behaviour.', art: 'components' as const },
  { name: 'Packaging concept', description: 'Complete the story around the object.', art: 'packaging' as const },
];

/** Orientation only: these are stages of a proposal, never sample customer results. */
export default function ProposalJourney({ compact = false }: { compact?: boolean }) {
  return <section id="proposal-worlds" tabIndex={-1} className={`op-journey${compact ? ' op-journey--compact' : ''}`} aria-label="Four connected proposal stages">
    {!compact && <div className="op-journey-heading"><div><p className="op-eyebrow">THE INVITED-BUYER JOURNEY</p><h2>One name. One researched story. One world worth holding.</h2></div></div>}
    <ol>{stages.map(({ name, description, art }, index) => <li key={name}>
      <div className="op-step-top"><span>{String(index + 1).padStart(2, '0')}</span></div>
      <div className="op-step-copy"><h3>{name}</h3>{!compact && <p>{description}</p>}</div>{!compact && <MarketingArtwork kind={art}/>}
    </li>)}</ol>
    {!compact && <p className="op-journey-note"><ArrowDown size={15} aria-hidden="true"/>Research → concept preview → studio review → build proposal. Final design, functionality and pricing are confirmed during the build proposal.</p>}
  </section>;
}
