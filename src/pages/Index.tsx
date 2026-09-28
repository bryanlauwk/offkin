import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './brick-gifts.css';
import { concepts } from './clicker-concepts';

type Concept = { id: string; brand: string; title: string; story: string; image?: string; interaction?: string };



export default function Index() {
  const [params, setParams] = useSearchParams();
  const [generated, setGenerated] = useState<Concept | null>(null);
  const conceptId = params.get('concept');
  const selected = conceptId ? (generated?.id === conceptId ? generated : undefined) : concepts.find(c => c.id === params.get('brand'));
  const [busy, setBusy] = useState(false);
  const [context, setContext] = useState('');
  const [needsContext, setNeedsContext] = useState(false);
  const request = useRef<AbortController | null>(null);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('All');
  const [budget, setBudget] = useState('100');
  const [featured, setFeatured] = useState(0);
  const feature = concepts[featured];
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
  async function callGenerator(body: object, signal: AbortSignal) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error('Live generation is being connected. Explore a sample concept below.');
    const response = await fetch(`${url}/functions/v1/generate-concept`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: key },
      body: JSON.stringify(body), signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Live generation is not available yet. Explore our sample concepts.');
    return data;
  }
  useEffect(() => {
    if (!conceptId || generated?.id === conceptId) return;
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setStatus('Opening your concept…');
    callGenerator({ id: conceptId }, controller.signal).then(data => {
      if (!data.concept) throw new Error('This concept could not be loaded.');
      setGenerated(data.concept); setStatus('');
    }).catch(error => { if (!controller.signal.aborted) setStatus(error.message); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [conceptId, generated?.id]);
  useEffect(() => () => request.current?.abort(), []);
  async function search(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    const name = query.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    const compact = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const match = concepts.find(c => compact(name) === compact(c.id) || compact(name) === compact(c.brand) || name.startsWith(c.id + '.'));
    if (match && !context.trim()) { setStatus(''); setParams({ brand: match.id }); return; }
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setStatus('Creating your brand concept. This can take a minute or two.');
    const timeout = window.setTimeout(() => { controller.abort(); setBusy(false); setStatus('This is taking longer than expected. Try again; completed concepts are cached.'); }, 220000);
    try {
      const data = await callGenerator({ brand: query.trim(), context }, controller.signal);
      if (controller.signal.aborted) return;
      if (data.needsContext) { setNeedsContext(true); setStatus(data.message); }
      else if (data.concept) { setGenerated(data.concept); setParams({ concept: data.concept.id }); setStatus(''); }
      else throw new Error('The concept could not be completed. Please retry.');
    } catch (error) {
      if (!controller.signal.aborted) setStatus(error instanceof Error ? error.message : 'Could not reach the generator. Please retry.');
    } finally { clearTimeout(timeout); if (!controller.signal.aborted) setBusy(false); }
  }
  function stopWaiting() { request.current?.abort(); setBusy(false); setStatus('Stopped waiting. A request already processing may still finish.'); }
  function download() {
    if (!selected) return;
    const brief = `FORM — PREMIUM CLICKER GIFT BRIEF\n\nBrand: ${selected.brand}\nConcept: ${selected.title}\nPlanning quantity: ${quantity}\nTarget unit budget: RM${budget} (design fee excluded)\nEvent date: ${date || 'To be confirmed'}\n\n${selected.story}\n\nRequested proposal: refined concept, click mechanism, 3D-printed construction, finishing and packaging options, quotation and timeline.\n\nThis brief has not been sent. Independent concept, not an official commission. Pricing, switch fit, print strength, durability and delivery require review before production.`;
    const url = URL.createObjectURL(new Blob([brief], { type: 'text/plain' }));
    const a = document.createElement('a'); a.href = url; a.download = `form-${selected.id}-gift-brief.txt`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function share() {
    try { await navigator.clipboard.writeText(window.location.href); setShareStatus('Concept link copied.'); }
    catch { setShareStatus('Copy this concept’s link from your address bar.'); }
  }
  return <div className="brick-studio">
    <header><Link to="/" className="logo" aria-label="Form home">form<span>.</span></Link><Link to="/#concepts" className="nav" onClick={() => requestAnimationFrame(() => document.getElementById('concepts')?.scrollIntoView())}>The collection <span>↗</span></Link><a className="header-cta" href="/#search">Create your concept ↗</a></header>
    {!selected ? <main><section className="hero"><div className="hero-copy"><p className="eyebrow">FOR THE PEOPLE WHO MATTER TO YOUR BUSINESS</p><h1>Your brand.<br /><em>Worth a click.</em></h1><p className="intro">Premium custom clickers that turn your business story into a desk gift people keep reaching for.</p><p className="hero-price">RM50 / RM100 per piece · Design fee separate</p><div className="search-panel"><p className="search-label">See your brand as a collectible.</p><form id="search" onSubmit={search} aria-busy={busy}><label className="sr" htmlFor="brand">Company name or website</label><input id="brand" placeholder="Enter your brand or website" value={query} onChange={e => setQuery(e.target.value)} required maxLength={120} disabled={busy} autoComplete="organization" /><button disabled={busy}>{busy ? 'Creating…' : 'Create concept'} <span>↗</span></button></form><details open={needsContext || undefined} className="brand-context"><summary>Add a little brand context</summary><label htmlFor="brand-context">What do you do? What are your brand colours?</label><textarea id="brand-context" maxLength={600} value={context} disabled={busy} onChange={e => setContext(e.target.value)} placeholder="e.g. A Malaysian coffee roaster. Forest green and cream. Our signature is slow-roasted beans." /><p className="hint">Use public brand information. Website names are identifiers, not a live website scan.</p></details><p className="hint example-links">Explore an example {concepts.slice(0, 4).map((c, i) => <span key={c.id}>{' '}<Link className="text" to={`?brand=${c.id}`}>{c.brand}</Link></span>)}</p><p id="search-status" role="status">{busy && <span className="loading-dot" />}{status}</p>{busy && <button className="text" type="button" onClick={stopWaiting}>Stop waiting</button>}</div></div><div className="hero-showcase"><div className="hero-stage"><div className="stage-top"><span className="stage-label">THE BRAND, REIMAGINED</span><span className="concept-stamp">CONCEPT / 0{featured + 1}</span></div><Link to={`?brand=${feature.id}`} className="featured-image"><img key={feature.id} src={`/clicker-assets/${feature.id}.webp`} alt={`${feature.brand} — ${feature.title}, an independent clicker concept`} fetchPriority="high" /></Link><Link className="stage-caption" to={`?brand=${feature.id}`}><span className="feature-title"><span>{feature.brand}</span><strong>{feature.title}</strong></span><span className="feature-arrow">↗</span></Link></div><div className="feature-picker" aria-label="Featured brand concept">{concepts.slice(0, 4).map((c, i) => <button key={c.id} type="button" onClick={() => setFeatured(i)} aria-pressed={featured === i}><span className={`brand-dot dot-${c.id}`} />{c.brand}</button>)}</div><p className="feature-disclosure">Independent concepts. Not official commissions.</p></div></section><div className="occasion-strip"><span>MADE FOR MOMENTS THAT MATTER</span><span>VIP client gifts</span><span>Company milestones</span><span>Team celebrations</span></div>
    <section id="concepts" className="gallery"><div className="section-title"><div><p className="eyebrow">THE CONCEPT COLLECTION</p><h2>A story in every click.</h2></div><p className="collection-note">12 brand stories, reimagined for the desk.<br />Explore local favourites and global icons.</p></div><div className="gallery-filters" aria-label="Filter concepts">{['All', 'Malaysia', 'Global'].map(r => <button type="button" key={r} aria-pressed={region === r} onClick={() => setRegion(r)}>{r}{' / '}{concepts.filter(c => r === 'All' || c.region === r).length}</button>)}</div><div className="cards">{concepts.filter(c => region === 'All' || c.region === region).map(c => <Link className="card" key={c.id} to={`?brand=${c.id}`}><div className="card-art"><span className="card-brand">{c.brand}</span><img src={`/clicker-assets/${c.id}.webp`} alt={`Unofficial ${c.brand} clicker concept: ${c.title}`} loading="lazy" /><span className="card-arrow">↗</span></div><div className="card-meta"><p className="eyebrow">INDEPENDENT CONCEPT</p><h3>{c.title}</h3><p>{c.tag}</p></div></Link>)}</div><p className="disclosure">Independent AI-assisted concepts, not official commissions or brand endorsements. Mechanisms are proposed; every design needs engineering and sample approval.</p></section>
    <section className="pricing-section" id="pricing"><div className="section-title"><div><p className="eyebrow">A CLEAR STARTING POINT</p><h2>Small gift. Lasting impression.</h2></div><p className="collection-note">Two target budgets.<br />One unmistakably yours design.</p></div><div className="price-grid"><article><p className="eyebrow">SIGNATURE</p><h3>RM50 <span>/ piece</span></h3><p>A distinctive silhouette with a focused click interaction.</p><ul><li>Custom brand-inspired form</li><li>Simple switch-based interaction</li><li>Restrained colours and finishing</li></ul><a href="#search" onClick={() => setBudget('50')}>Start a RM50 concept ↗</a></article><article><p className="eyebrow">COLLECTOR</p><h3>RM100 <span>/ piece</span></h3><p>A richer brand story with room for more tactile detail.</p><ul><li>More sculptural detail</li><li>Multiple clicks or a lever interaction</li><li>More room for finishing and presentation</li></ul><a href="#search" onClick={() => setBudget('100')}>Start a RM100 concept ↗</a></article></div><p className="disclosure">Indicative per-piece targets, not fixed quotations. Design fee is separate. Quantity, mechanism, finish, packaging and delivery determine the final quote. Gallery concepts are not priced offers.</p></section><section className="process-section"><div className="process-heading"><p className="eyebrow">FROM IDEA TO THEIR DESK</p><h2>A thoughtful gift.<br />A simple process.</h2></div><div className="steps"><div><span>01 / IMAGINE</span><h3>Start with your brand.</h3><p>Your business, personality and story shape the idea.</p></div><div><span>02 / MAKE IT YOURS</span><h3>Find the right fit.</h3><p>Refine the concept around your audience and budget.</p></div><div><span>03 / MAKE IT REAL</span><h3>Approve before production.</h3><p>Review the design, sample and quote before an order.</p></div></div></section></main> :
    <main id="detail"><Link className="back" to="/">← All concepts</Link><div className="product"><div className="product-art"><img src={(selected as Concept).image || `/clicker-assets/${selected.id}.webp`} alt={`Unofficial ${selected.brand} clicker concept: ${selected.title}`} /><span className="art-note">INDEPENDENT BRAND CONCEPT</span></div><section className="product-info"><p className="eyebrow">{selected.brand} / CONCEPT</p><h1>{selected.title}</h1><p className="intro">{selected.story}</p><div className="tags"><span>Custom clicker</span><span>Desk collectible</span></div>{selected.interaction && <p className="interaction-note"><strong>The proposed interaction</strong><br />{selected.interaction}</p>}<form id="proposal" onSubmit={e => { e.preventDefault(); dialog.current?.showModal(); }}><div className="fields"><label>Planning quantity<input type="number" min="1" max="100000" step="1" required value={quantity} onChange={e => setQuantity(e.target.value)} /></label><label>Event date <span>(optional)</span><input type="date" min={minDate} value={date} onChange={e => setDate(e.target.value)} /></label></div><label className="budget-label">Target budget per piece<select value={budget} onChange={e => setBudget(e.target.value)}><option value="50">RM50 · Signature</option><option value="100">RM100 · Collector</option></select></label><button className="wide">Prepare your gift brief <span>↗</span></button><p className="hint">Design fee excluded. Final price and delivery follow design and quantity review.</p></form><details><summary>What’s included in the proposal?</summary><p>A refined brand concept, proposed click mechanism, printed construction, finishing and packaging options — with scope, pricing and timings for your review.</p></details><details><summary>From concept to collectible</summary><p>This is a visual exploration. We plan around 3D-printed shells and purchased switches or pivots. Switch travel, clearances, strength, assembly time and cost must be checked in CAD and a working sample. Concept images are not production-ready models.</p></details><button className="text share" onClick={share}>Share this concept ↗</button><p role="status">{shareStatus}</p></section></div></main>}
    <footer><Link to="/" className="logo">form<span>.</span></Link><p>Made to tell your story.</p><span>PREMIUM CORPORATE CLICKERS</span></footer>
    <dialog ref={dialog} aria-labelledby="brief-title"><button className="close" aria-label="Close" onClick={() => dialog.current?.close()}>×</button><p className="eyebrow">LET’S SHAPE YOUR GIFT</p><h2 id="brief-title">Your brief, ready to review.</h2><p>{selected?.brand} · {selected?.title}. {quantity} gifts. RM{budget} target per piece, excluding design fee. {date ? `Event: ${date}.` : 'Event date to be confirmed.'}</p><p className="modal-note">Download this brief to keep it. It will not be sent to the studio.</p><button className="wide" onClick={download}>Download brief ↓</button></dialog>
  </div>;
}
