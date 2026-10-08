const steps = [
  ['Explore your concept', 'A rich brand world, collectible direction, proposed details and interaction, and packaging. AI previews help you choose the direction.'],
  ['Agree a build proposal', 'Review design scope, materials, size, quantity, feasibility and a quotation. Design and prototype fees are separate from unit-production costs.'],
  ['Review a real prototype', 'If you proceed, check physical finish, scale and the proposed interaction. Approve the prototype and any changes before production is agreed.'],
  ['Plan production together', 'Confirm the final specification, quantity, delivery plan and terms before placing an order. An enquiry or preview does not place an order.'],
];

export default function PilotProcess() {
  return <section id="proposal-process" className="op-pilot-process" tabIndex={-1} aria-labelledby="op-process-title">
    <div className="op-process-heading"><p className="op-eyebrow">FROM A GOOD IDEA TO A REAL OBJECT</p><h2 id="op-process-title">A clear next step. At every stage.</h2><p>Start with the creative ambition. Decide what to build together.</p></div>
    <ol className="op-process-steps">{steps.map(([title, description], index) => <li key={title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{description}</p></li>)}</ol>
    <div className="op-buyer-faq" aria-label="Before you plan a project">
      <details><summary>Who is OFFKIN for?</summary><p>Our focus is distinctive branded gifts for clients, teams, launches and events. You can also describe a personal commission; one-off feasibility and availability need to be confirmed for your idea.</p></details>
      <details><summary>What does it cost, and how many can I make?</summary><p>Pricing and minimum quantities are not fixed yet. Share a rough quantity and a budget with currency, ideally noting whether it is a total project budget or per piece. The proposal should separate design, prototyping, unit production, packaging and delivery so you can decide with the full scope in view.</p></details>
      <details><summary>How big is it, and when could it arrive?</summary><p>Size, materials and lead time are agreed for each project after feasibility review. A concept image is not to scale. Tell us where it will live and your ideal delivery date; neither is a confirmed specification or deadline until agreed.</p></details>
      <details><summary>Are these real products or client commissions?</summary><p>The showcase contains AI-generated concept studies. No physical prototypes are shown, and these are not products available to buy or commissions for the featured brands. Shape, finish and interaction need a real prototype before production approval.</p></details>
      <details><summary>What happens to my idea and contact details?</summary><p>Your enquiry draft stays in this browser on this device. Closing the window does not clear it. You can clear the draft at any time. Downloading creates a file for you to review. The WhatsApp step shows a separate short message before you open it; you attach any file and press Send in WhatsApp yourself.</p></details>
    </div>
  </section>;
}
