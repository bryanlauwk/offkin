import { FormEvent, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, Download, LoaderCircle, Search, Share2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { concepts } from './clicker-concepts';
import { editions, formats, type Edition, type GiftFormat, parseSelection } from '../../supabase/functions/generate-concept/options';
import { makeBrief, type CollectibleConcept } from '@/lib/collectible-brief';
import './brick-gifts.css';
import { normalizeCompanyWebsite } from '@/lib/company-website';

type SiteSettings = { logoUrl: string; logoLink: string; siteTitle: string };
const defaultSettings: SiteSettings = { logoUrl: '', logoLink: '/', siteTitle: 'BRIQ2.0' };
const sampleConcepts: CollectibleConcept[] = concepts.map(c => ({ ...c, edition: 'everyday', format: 'clicker', image: `/clicker-assets/${c.id}.webp` }));

export default function Index() {
  const [params, setParams] = useSearchParams();
  const [generated, setGenerated] = useState<CollectibleConcept | null>(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [edition, setEdition] = useState<Edition>('everyday');
  const [format, setFormat] = useState<GiftFormat>('clicker');
  const [query, setQuery] = useState('');
  const [context, setContext] = useState('');
  const [needsContext, setNeedsContext] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [budget, setBudget] = useState('100');
  const [date, setDate] = useState('');
  const [occasion, setOccasion] = useState('Client appreciation');
  const [agency, setAgency] = useState('');
  const [clientReady, setClientReady] = useState(true);
  const [shareStatus, setShareStatus] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const request = useRef<AbortController | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const conceptId = params.get('concept');
  const selected = conceptId ? (generated?.id === conceptId ? generated : undefined) : sampleConcepts.find(c => c.id === params.get('brand'));
  const today = new Date();
  const minDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  useEffect(() => {
    let active = true;
    supabase.from('site_settings').select('key, value').then(({ data }) => {
      if (!active || !data) return;
      const next = { ...defaultSettings };
      data.forEach(setting => {
        if (setting.key === 'logo_url') next.logoUrl = setting.value || '';
        if (setting.key === 'logo_link') next.logoLink = !setting.value || setting.value === 'https://example.com' ? '/' : setting.value;
        if (setting.key === 'site_title') next.siteTitle = !setting.value || ['form.', 'brandkin', 'stive', 'the absurd marshmallow test'].includes(setting.value.trim().toLowerCase()) ? defaultSettings.siteTitle : setting.value;
      });
      setSettings(next);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.title = selected ? `${selected.title} — ${settings.siteTitle}` : `${settings.siteTitle} — Your business DNA. Made collectible.`;
    setShareStatus('');
    setImageFailed(false);
    window.scrollTo(0, 0);
  }, [selected, settings.siteTitle]);

  async function callGenerator(body: { id?: string; brand?: string; context?: string; edition?: Edition; format?: GiftFormat }, signal: AbortSignal) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error('Live generation is being connected. Try one of the examples below.');
    const response = await fetch(`${url}/functions/v1/generate-concept`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: key }, body: JSON.stringify(body), signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Generation is not available right now. Try an example instead.');
    if (data.concept) {
      if (body.edition && (data.concept.edition !== body.edition || data.concept.format !== body.format)) {
        throw new Error('This edition is not available from the generator yet. Please explore a clicker example.');
      }
      const selection = parseSelection(data.concept);
      if (!selection) throw new Error('This concept has an unsupported edition or format. Please try again.');
      data.concept = { ...data.concept, ...selection };
    }
    return data;
  }

  useEffect(() => {
    request.current?.abort();
    setBusy(false);
  }, [params]);

  useEffect(() => {
    if (!conceptId || generated?.id === conceptId) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setStatus('Bringing your concept back…');
    callGenerator({ id: conceptId }, controller.signal).then(data => {
      if (controller.signal.aborted) return;
      if (!data.concept) throw new Error('This concept could not be loaded.');
      setGenerated(data.concept);
      setStatus('');
    }).catch(error => {
      if (!controller.signal.aborted) setStatus(error.message);
    }).finally(() => {
      if (!controller.signal.aborted) setBusy(false);
    });
    return () => controller.abort();
  }, [conceptId, generated?.id, loadAttempt]);
  useEffect(() => () => request.current?.abort(), []);

  function chooseEdition(value: Edition) {
    setEdition(value);
    if (value === 'icon' && format === 'clicker') setFormat('miniature');
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const website = normalizeCompanyWebsite(query);
    if (!website) { setStatus('Enter a valid company website, such as company.com.'); return; }
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setStatus('Reading the business story and creating your collectible…');
    const timeout = window.setTimeout(() => {
      controller.abort();
      setBusy(false);
      setStatus('This is taking longer than expected. Please try again.');
    }, 220000);
    try {
      const data = await callGenerator({ brand: website, context: context.trim(), edition, format }, controller.signal);
      if (controller.signal.aborted) return;
      if (data.needsContext) {
        setNeedsContext(true);
        setStatus(data.message);
      } else if (data.concept) {
        setGenerated(data.concept);
        setParams({ concept: data.concept.id });
        setNeedsContext(false);
        setStatus('');
      } else throw new Error('The concept could not be completed. Please retry.');
    } catch (error) {
      if (!controller.signal.aborted) setStatus(error instanceof Error ? error.message : 'Could not reach the generator. Please retry.');
    } finally {
      clearTimeout(timeout);
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  function stopWaiting() {
    request.current?.abort();
    setBusy(false);
    setStatus('Stopped waiting. You can edit and try again. Work already started on the server may still finish.');
  }

  function download() {
    if (!selected) return;
    const brief = makeBrief(selected, { agency, quantity, budget: String(Math.max(100, Number(budget) || 100)), date, occasion, clientReady });
    const url = URL.createObjectURL(new Blob([brief], { type: 'text/plain' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${selected.id}-${clientReady ? 'client-concept' : 'internal-brief'}.txt`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function share() {
    try { await navigator.clipboard.writeText(window.location.href); setShareStatus('Concept link copied. Your agency and budget details are not included.'); }
    catch { setShareStatus('Copy the link from your address bar.'); }
  }

  function createAnother() {
    request.current?.abort();
    setBusy(false); setStatus('');
    setQuery(previous => normalizeCompanyWebsite(previous) ? previous : '');
    setEdition('everyday'); setFormat('clicker'); setNeedsContext(false); setContext('');
    setParams({});
  }

  return (
    <div className="brick-studio">
      <header className="studio-header">
        <a className="studio-logo" href={settings.logoLink || '/'} aria-label={`${settings.siteTitle} home`}>
          {settings.logoUrl ? <img src={settings.logoUrl} alt={settings.siteTitle} /> : <span>{settings.siteTitle}</span>}
        </a>
        <span className="header-caption">A business story, made tangible.</span>
      </header>

      {!selected ? (
        <main className="creation-home">
          <section className="prompt-block" aria-labelledby="creation-title">
            <p className="welcome">BUSINESS STORIES. REAL OBJECTS.</p>
            <h1 id="creation-title">Your business DNA.<br /> Made collectible.</h1>
            <p className="prompt-copy">Enter your company website to create a collectible inspired by what your business does.</p>
            <form onSubmit={search} className="creation-form single-search-form" aria-busy={busy}>
              <div className="brand-search">
                <Search aria-hidden="true" />
                <label className="sr" htmlFor="brand">Company website</label>
                <input id="brand" placeholder="Your company website, e.g. company.com" value={query} onChange={e => { setQuery(e.target.value); setContext(''); setNeedsContext(false); }} required minLength={2} maxLength={120} autoComplete="url" inputMode="url" disabled={busy} />
                <Button type="submit" disabled={busy} size="lg" aria-label={busy ? 'Creating your concept' : 'Create collectible'}>{busy ? <LoaderCircle className="spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}</Button>
              </div>
              {needsContext && <div className="brand-context context-request"><label htmlFor="brand-context">Tell us a little about the business</label><textarea id="brand-context" maxLength={600} value={context} disabled={busy} onChange={e => setContext(e.target.value)} placeholder="What do you make or do? What should the collectible celebrate?" /><p>We need a few details to avoid guessing. Add them, then try again.</p><Button type="submit" disabled={busy}>Try again with these details</Button></div>}
            </form>
            <div className={`creation-status ${busy ? 'is-busy' : ''}`} role="status" aria-live="polite">{status && <span>{status}</span>}{conceptId && !busy && status && <Button variant="outline" type="button" onClick={() => setLoadAttempt(value => value + 1)}>Try loading again</Button>}{busy && <Button variant="ghost" size="sm" type="button" onClick={stopWaiting}>Stop</Button>}</div>
            <div className="example-row"><span>Or explore a sample</span>{sampleConcepts.slice(0, 4).map(c => <Button key={c.id} type="button" variant="outline" size="sm" disabled={busy} onClick={() => { setStatus(''); setParams({ brand: c.id }); }}>{c.brand}</Button>)}</div>
          </section>
          <p className="fine-print">Designs from RM100 per piece. Design fees are separate. Final pricing follows design review and a physical sample.</p>
        </main>
      ) : (
        <main className="result-page"><Button variant="ghost" className="back-link" onClick={createAnother}>← Create another edition</Button><section className="result-shell" aria-labelledby="concept-title"><div className="concept-story"><div className="result-kicker"><Check aria-hidden="true" />{!conceptId && <span>Curated example concept · </span>}{editions[selected.edition].label} edition · {formats[selected.format].label}</div><p className="brand-name">{selected.brand}</p><h1 id="concept-title">{selected.title}</h1><section aria-labelledby="business-dna-title" className="business-dna"><h2 id="business-dna-title">How it captures your business DNA</h2><p className="concept-copy">{selected.story}</p>{selected.sourceUrl && /^https?:\/\//i.test(selected.sourceUrl) && <p className="source-note">Based on <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">{selected.sourceTitle || 'company website'}</a>. Please review the interpretation.</p>}</section>{selected.interaction && <div className="interaction-card"><span><Sparkles aria-hidden="true" />The recipient's experience</span><p>{selected.interaction}</p></div>}
          <details className="refinement-panel"><summary>Refine this concept</summary><form onSubmit={search} aria-busy={busy}><p>Keep the business story and explore another direction. Each new generation may use a daily allowance.</p>{!normalizeCompanyWebsite(query) && <label>Company website<input value={query} onChange={e => setQuery(e.target.value)} placeholder="company.com" required disabled={busy} /></label>}<label>What would you change?<textarea maxLength={600} value={context} onChange={e => setContext(e.target.value)} placeholder="More realistic, a different colour, or a specific business detail…" disabled={busy} /></label><label>Story<select value={edition} onChange={e => chooseEdition(e.target.value as Edition)} disabled={busy}>{Object.entries(editions).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label><label>Object<select value={format} onChange={e => setFormat(e.target.value as GiftFormat)} disabled={busy}>{Object.entries(formats).map(([key, value]) => <option key={key} value={key} disabled={edition === 'icon' && key === 'clicker'}>{value.label}</option>)}</select></label><Button type="submit" disabled={busy}>{busy ? 'Creating your concept' : 'Create refined concept'}</Button></form><div role="status" aria-live="polite">{status}{busy && <Button variant="ghost" type="button" onClick={stopWaiting}>Stop</Button>}</div></details>
          <form id="proposal" onSubmit={event => { event.preventDefault(); dialog.current?.showModal(); }}><h2>Make it pitch-ready.</h2><p className="proposal-intro">Add your project details. Choose what your client sees.</p><label>Your agency <span>(optional)</span><input maxLength={120} value={agency} onChange={e => setAgency(e.target.value)} placeholder="Prepared by your agency" /></label><div className="order-grid"><label>Planning quantity<input type="number" min="1" max="100000" step="1" required value={quantity} onChange={e => setQuantity(e.target.value)} /></label><label>Target per piece (RM)<input type="number" min="100" max="100000" step="1" required value={budget} onChange={e => setBudget(e.target.value)} /></label></div><p className="budget-note">Minimum RM100 per piece. Your target is not a quote. Design and sample fees are separate.</p><label>Occasion<select value={occasion} onChange={e => setOccasion(e.target.value)}>{['Client appreciation','Employee onboarding','Product launch','Company anniversary','Event giveaway'].map(value => <option key={value}>{value}</option>)}</select></label><label>Requested delivery <span>(optional)</span><input type="date" min={minDate} value={date} onChange={e => setDate(e.target.value)} /></label><label className="export-option"><input type="checkbox" checked={clientReady} onChange={e => setClientReady(e.target.checked)} /><span><strong>Client-facing brief</strong><small>Leave out the internal budget and studio branding.</small></span></label><Button className="purchase-button" size="lg" type="submit"><Download aria-hidden="true" />Prepare {clientReady ? 'client concept' : 'internal brief'}<ArrowRight aria-hidden="true" /></Button><p className="form-note">Download for review. Nothing is submitted or ordered.</p></form></div>
          <div className="concept-preview"><div className="preview-card"><div className="preview-image">{imageFailed ? <p className="image-error">The image could not load. Your concept brief is still available.</p> : <img src={selected.image} onError={() => setImageFailed(true)} alt={`${selected.brand} — ${selected.title}, an independent ${formats[selected.format].label.toLowerCase()} concept`} />}<span>{formats[selected.format].label} concept</span></div><div className="preview-meta"><div><p>{selected.brand}</p><strong>{selected.title}</strong></div></div></div><div className="secondary-actions"><Button type="button" variant="outline" onClick={share}><Share2 aria-hidden="true" />Copy concept link</Button></div><p className="share-status" role="status">{shareStatus}</p><ol className="production-steps"><li>Concept direction</li><li>Design review & quotation</li><li>Physical sample approval</li><li>Production</li></ol><p className="fine-print">Independent concept, not an official commission.<br />Construction, pricing, and delivery require review.</p></div></section></main>
      )}
      <dialog ref={dialog} aria-labelledby="brief-title"><Button className="dialog-close" variant="ghost" size="icon" aria-label="Close" onClick={() => dialog.current?.close()}><X aria-hidden="true" /></Button><p className="dialog-kicker">Ready for review</p><h2 id="brief-title">Your {clientReady ? 'client concept' : 'internal brief'} is ready.</h2><p>{selected?.brand} · {selected?.title}<br />{quantity} pieces{!clientReady && ` · RM${Math.max(100, Number(budget) || 100)} target each`}</p><p className="dialog-note">{clientReady ? 'Your agency name is included if provided. Internal budget and studio branding are omitted.' : 'Includes your target budget for internal planning.'} This downloads a text brief; nothing is sent and no order is placed.</p><Button className="dialog-download" size="lg" onClick={download}><Download aria-hidden="true" />Download {clientReady ? 'client concept' : 'internal brief'}</Button></dialog>
    </div>
  );
}
