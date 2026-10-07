import { ArrowDown, ArrowUpRight, Box, Layers3, Package, Sparkles } from 'lucide-react';

const stages = [
  { name: 'Brand world', description: 'Find the story, characters and visual language.', Icon: Sparkles },
  { name: 'Collectible', description: 'Choose the story worth holding.', Icon: Box },
  { name: 'Components & interaction', description: 'Explore proposed parts, joins and how it could move.', Icon: Layers3 },
  { name: 'Packaging concept', description: 'Complete the story around the object.', Icon: Package },
];

/** Orientation only: these are stages of a proposal, never sample customer results. */
export default function ProposalJourney({ compact = false }: { compact?: boolean }) {
  return <section className={`op-journey${compact ? ' op-journey--compact' : ''}`} aria-label="Four connected proposal stages">
    {!compact && <div className="op-journey-heading"><div><p className="op-eyebrow">ONE STORY. FOUR CONNECTED VISUALS.</p><h2>From your story to a little world.</h2></div><p>A physical product plan comes first. The images explore what it could become.</p></div>}
    <ol>{stages.map(({ name, description, Icon }, index) => <li key={name}>
      <div className="op-step-top"><span>{String(index + 1).padStart(2, '0')}</span>{!compact && <Icon size={27} strokeWidth={1.3} aria-hidden="true"/>}</div>
      <h3>{name}</h3>{!compact && <><p>{description}</p>{index < stages.length - 1 && <ArrowUpRight size={21} className="op-step-arrow" aria-hidden="true"/>}</>}
    </li>)}</ol>
    {!compact && <p className="op-journey-note"><ArrowDown size={15} aria-hidden="true"/>Final design, CAD, prototyping and production are scoped together after concept review.</p>}
  </section>;
}
