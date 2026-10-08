import './brand-example-strip.css';

const contents = [
  ['Brand world', 'The story, characters and visual language.'],
  ['Collectible', 'A direction for the object itself.'],
  ['Details & interaction', 'Small discoveries and proposed behaviour.'],
  ['Packaging', 'The story around the object.'],
];

/** Explains the preview deliverables, without repeating the buying process. */
export default function ProposalJourney({ compact = false }: { compact?: boolean }) {
  return <section className="op-preview-contents" aria-label="Inside your concept preview">
    <h2>Inside your concept preview</h2>
    <ul>{contents.map(([name, description]) => <li key={name}><h3>{name}</h3>{!compact && <p>{description}</p>}</li>)}</ul>
  </section>;
}
