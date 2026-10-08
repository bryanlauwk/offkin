import { SHOWCASE_PREVIEW_NOTE } from '@/lib/showcase-worlds';
import './brand-example-strip.css';

const steps = [
  ['Preview', 'See a collectible direction for your brand. Refine the story and details before deciding what to build.'],
  ['Proposal', 'Agree the design, size, materials, quantity and quotation. Design and prototype costs are separate from production.'],
  ['Prototype', 'If you proceed, review a real sample. Approve its finish and functionality before agreeing production.'],
];

export default function PilotProcess() {
  return <section id="proposal-process" className="op-pilot-process op-pilot-process--simple" tabIndex={-1} aria-labelledby="op-process-title">
    <div className="op-process-heading"><h2 id="op-process-title">From concept to something real.</h2></div>
    <ol className="op-process-steps">{steps.map(([title, description], index) => <li key={title}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{description}</p></li>)}</ol>
    <p className="op-process-note">{SHOWCASE_PREVIEW_NOTE}</p>
    <div className="op-buyer-faq" aria-label="Project essentials">
      <details><summary>What about price, quantity and timing?</summary><p>These depend on the design and feasibility review. Share your rough quantity, budget and ideal delivery date in the build proposal request. A preview or enquiry does not place an order.</p></details>
    </div>
  </section>;
}
