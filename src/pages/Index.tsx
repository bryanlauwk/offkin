import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './brick-gifts.css';

const concepts = [
  { id: 'kldex', brand: 'KLDEX', title: 'The Tasting Counter', tag: 'A discovery worth sharing.', story: 'A little tasting counter, built around the joy of discovering durian. A shared ritual becomes a collectible brand experience.' },
  { id: 'stive', brand: 'STIVE', title: 'The Creator Workshop', tag: 'Ideas become something tangible.', story: 'An orange little world for big creative ideas. An easel, a display wall and a workshop counter celebrate the journey from inspiration to creation.' },
  { id: 'petronas', brand: 'PETRONAS', title: 'The Everyday Pit Stop', tag: 'A familiar stop. A new perspective.', story: 'A familiar roadside moment, reimagined as a compact desk collectible. The teal canopy, pumps and little car celebrate the journeys a brand helps power.' },
];

export default function Index() {
  const [params, setParams] = useSearchParams();
  const selected = concepts.find(c => c.id === params.get('brand'));
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [date, setDate] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const today = new Date();
  const minDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  useEffect(() => {
    document.title = selected ? `${selected.title} — form.` : 'form. — Your brand, built to be kept.';
    setShareStatus('');
    window.scrollTo(0, 0);
  }, [selected]);
  function search(event: FormEvent) {
    event.preventDefault();
    const name = query.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    const match = concepts.find(c => name === c.id || name.startsWith(c.id + '.'));
    if (match) { setStatus(''); setParams({ brand: match.id }); }
    else setStatus('This prototype has three ready-to-explore concepts. Try KLDEX, STIVE or PETRONAS. New-brand AI generation is not connected yet.');
  }
  function download() {
    if (!selected) return;
    const brief = `FORM — CORPORATE BRICK GIFT BRIEF\n\nBrand: ${selected.brand}\nConcept: ${selected.title}\nPlanning quantity: ${quantity}\nEvent date: ${date || 'To be confirmed'}\n\n${selected.story}\n\nRequested proposal: refined concept, proposed brick build, presentation box, assembly guide, quotation and timeline.\n\nPrototype only. This request has not been sent. Independent concept, not an official commission. Pricing, brick availability, stability and delivery require review before production.`;
    const url = URL.createObjectURL(new Blob([brief], { type: 'text/plain' }));
    const a = document.createElement('a'); a.href = url; a.download = `form-${selected.id}-gift-brief.txt`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function share() {
    try { await navigator.clipboard.writeText(window.location.href); setShareStatus('Concept link copied.'); }
    catch { setShareStatus('Copy this concept’s link from your address bar.'); }
  }
  return <div className="brick-studio">
    <header><Link to="/" className="logo" aria-label="Form home">form<span>.</span></Link><Link to="/#concepts" className="nav" onClick={() => requestAnimationFrame(() => document.getElementById('concepts')?.scrollIntoView())}>Explore concepts <span>↗</span></Link></header>
    {!selected ? <main><section className="hero"><p className="eyebrow">SMALL BRICKS. BIG BRAND STORIES.</p><h1>Your brand.<br />Built to be kept.</h1><p className="intro">Custom brick gifts for your clients and teams.<br />A little world that could only be yours.</p><form id="search" onSubmit={search}><label className="sr" htmlFor="brand">Company name or website</label><input id="brand" placeholder="Enter your brand or website" value={query} onChange={e => setQuery(e.target.value)} required autoComplete="organization" /><button>Create concept <span>↗</span></button></form><p className="hint">Try {concepts.map((c, i) => <span key={c.id}>{i > 0 && (i === 2 ? ' or ' : ', ')}<Link className="text" to={`?brand=${c.id}`}>{c.brand}</Link></span>)}</p><p id="search-status" role="status">{status}</p></section>
    <section id="concepts" className="gallery"><div className="section-title"><h2>A brand story. A new form.</h2><span>THE CONCEPT COLLECTION / 01—03</span></div><div className="cards">{concepts.map(c => <Link className="card" key={c.id} to={`?brand=${c.id}`}><div className="card-art"><img src={`/brick-assets/${c.id}.webp`} alt={`Unofficial ${c.brand} brick concept: ${c.title}`} loading="lazy" /><span className="card-arrow">↗</span></div><div className="card-meta"><p className="eyebrow">{c.brand} / BRAND EXPLORATION</p><h3>{c.title}</h3><p>{c.tag}</p></div></Link>)}</div><p className="disclosure">Independent design explorations. Not official commissions or brand endorsements.</p></section>
    <section className="steps"><div><span>01 / IMAGINE</span><h3>Start with your brand.</h3><p>Your business, personality and story shape the idea.</p></div><div><span>02 / MAKE IT YOURS</span><h3>Find the right fit.</h3><p>Refine the concept around your audience and budget.</p></div><div><span>03 / MAKE IT REAL</span><h3>Approve before production.</h3><p>Review the design, sample and quote before an order.</p></div></section></main> :
    <main id="detail"><Link className="back" to="/">← All concepts</Link><div className="product"><div className="product-art"><img src={`/brick-assets/${selected.id}.webp`} alt={`Unofficial ${selected.brand} brick set: ${selected.title}`} /><span className="art-note">INDEPENDENT BRAND CONCEPT</span></div><section className="product-info"><p className="eyebrow">{selected.brand} / CONCEPT</p><h1>{selected.title}</h1><p className="intro">{selected.story}</p><div className="tags"><span>Custom brick set</span><span>Desk collectible</span></div><form id="proposal" onSubmit={e => { e.preventDefault(); dialog.current?.showModal(); }}><div className="fields"><label>Planning quantity<input type="number" min="1" max="100000" step="1" required value={quantity} onChange={e => setQuantity(e.target.value)} /></label><label>Event date <span>(optional)</span><input type="date" min={minDate} value={date} onChange={e => setDate(e.target.value)} /></label></div><button className="wide">Request a proposal <span>↗</span></button><p className="hint">Price and delivery confirmed after design review.</p></form><details><summary>What’s included in the proposal?</summary><p>A refined brand concept, proposed brick build, presentation box and assembly guide — with scope, pricing and timings for your review.</p></details><details><summary>From concept to collectible</summary><p>This is a visual exploration. Brick availability, assembly, stability and cost need to be checked before a sample is made.</p></details><button className="text share" onClick={share}>Share this concept ↗</button><p role="status">{shareStatus}</p></section></div></main>}
    <footer><Link to="/" className="logo">form<span>.</span></Link><p>Made to tell your story.</p><span>BRICK-GIFTING PROTOTYPE</span></footer>
    <dialog ref={dialog} aria-labelledby="brief-title"><button className="close" aria-label="Close" onClick={() => dialog.current?.close()}>×</button><p className="eyebrow">LET’S SHAPE YOUR GIFT</p><h2 id="brief-title">Your brief, ready to review.</h2><p>{selected?.brand} · {selected?.title}. {quantity} gifts. {date ? `Event: ${date}.` : 'Event date to be confirmed.'}</p><p className="modal-note">Prototype preview — this request is not sent. Download your brief to keep it.</p><button className="wide" onClick={download}>Download brief ↓</button></dialog>
  </div>;
}
