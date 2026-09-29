import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, Download, LoaderCircle, Search, Settings, Share2, ShoppingBag, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import './brick-gifts.css';
import { concepts } from './clicker-concepts';

type Concept = { id: string; brand: string; title: string; story: string; image?: string; interaction?: string };

type SiteSettings = {
  logoUrl: string;
  logoLink: string;
  siteTitle: string;
};

const defaultSettings: SiteSettings = { logoUrl: '', logoLink: '/', siteTitle: 'form.' };

export default function Index() {
  const [params, setParams] = useSearchParams();
  const [generated, setGenerated] = useState<Concept | null>(null);
  const [settings, setSettings] = useState(defaultSettings);
  const conceptId = params.get('concept');
  const selected = conceptId ? (generated?.id === conceptId ? generated : undefined) : concepts.find(c => c.id === params.get('brand'));
  const [busy, setBusy] = useState(false);
  const [context, setContext] = useState('');
  const [needsContext, setNeedsContext] = useState(false);
  const request = useRef<AbortController | null>(null);
  const [query, setQuery] = useState('');
  const [budget, setBudget] = useState('100');
  const [status, setStatus] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [date, setDate] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const today = new Date();
  const minDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  useEffect(() => {
    let active = true;
    supabase.from('site_settings').select('key, value').then(({ data }) => {
      if (!active || !data) return;
      const next = { ...defaultSettings };
      data.forEach(setting => {
        if (setting.key === 'logo_url') next.logoUrl = setting.value || '';
        if (setting.key === 'logo_link') next.logoLink = setting.value || '/';
        if (setting.key === 'site_title') next.siteTitle = setting.value || 'form.';
      });
      setSettings(next);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.title = selected ? `${selected.title} — form.` : 'form. — Create a brand collectible';
    setShareStatus('');
    window.scrollTo(0, 0);
  }, [selected]);

  async function callGenerator(body: object, signal: AbortSignal) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error('Live generation is being connected. Try one of the examples below.');
    const response = await fetch(`${url}/functions/v1/generate-concept`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: key }, body: JSON.stringify(body), signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Live generation is not available right now. Try an example instead.');
    return data;
  }

  useEffect(() => {
    if (!conceptId || generated?.id === conceptId) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setStatus('Bringing your concept back…');
    callGenerator({ id: conceptId }, controller.signal).then(data => {
      if (!data.concept) throw new Error('This concept could not be loaded.');
      setGenerated(data.concept);
      setStatus('');
    }).catch(error => {
      if (!controller.signal.aborted) setStatus(error.message);
    }).finally(() => {
      if (!controller.signal.aborted) setBusy(false);
    });
    return () => controller.abort();
  }, [conceptId, generated?.id]);

  useEffect(() => () => request.current?.abort(), []);

  async function search(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const name = query.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    const compact = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const match = concepts.find(c => compact(name) === compact(c.id) || compact(name) === compact(c.brand) || name.startsWith(c.id + '.'));
    if (match && !context.trim()) {
      setStatus('');
      setParams({ brand: match.id });
      return;
    }
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setStatus('Sketching the object, interaction, and story…');
    const timeout = window.setTimeout(() => {
      controller.abort();
      setBusy(false);
      setStatus('This is taking longer than expected. Please try again.');
    }, 220000);
    try {
      const data = await callGenerator({ brand: query.trim(), context }, controller.signal);
      if (controller.signal.aborted) return;
      if (data.needsContext) {
        setNeedsContext(true);
        setStatus(data.message);
      } else if (data.concept) {
        setGenerated(data.concept);
        setParams({ concept: data.concept.id });
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
    setStatus('Stopped. You can edit your idea and try again.');
  }

  function download() {
    if (!selected) return;
    const brief = `FORM — CUSTOM CLICKER BRIEF\n\nBrand: ${selected.brand}\nConcept: ${selected.title}\nPlanning quantity: ${quantity}\nTarget unit budget: RM${budget} (design fee excluded)\nEvent date: ${date || 'To be confirmed'}\n\n${selected.story}\n\nRequested proposal: refined concept, click mechanism, 3D-printed construction, finishing and packaging options, quotation and timeline.\n\nThis brief has not been sent. Independent concept, not an official commission. Pricing, switch fit, print strength, durability and delivery require review before production.`;
    const url = URL.createObjectURL(new Blob([brief], { type: 'text/plain' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `form-${selected.id}-gift-brief.txt`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus('Link copied');
    } catch {
      setShareStatus('Copy the link from your address bar');
    }
  }

  const logo = settings.logoUrl
    ? <img src={settings.logoUrl} alt={settings.siteTitle || 'form.'} />
    : <span>{settings.siteTitle || 'form.'}</span>;

  return (
    <div className="brick-studio">
      <header className="studio-header">
        <a className="studio-logo" href={settings.logoLink || '/'} aria-label="Form home">{logo}</a>
        <Button asChild variant="ghost" size="sm" className="settings-link">
          <Link to="/admin"><Settings aria-hidden="true" /> <span>Settings</span></Link>
        </Button>
      </header>

      {!selected ? (
        <main className="creation-home">
          <section className="prompt-block" aria-labelledby="creation-title">
            <div className="spark-mark"><Sparkles aria-hidden="true" /></div>
            <p className="welcome">A tiny object with your whole brand story inside.</p>
            <h1 id="creation-title">What should we turn<br />into a collectible?</h1>
            <p className="prompt-copy">Enter a company or website. We’ll dream up a custom clicker your clients will actually want to keep.</p>

            <form className="brand-search" onSubmit={search} aria-busy={busy}>
              <Search aria-hidden="true" />
              <label className="sr" htmlFor="brand">Company name or website</label>
              <input id="brand" placeholder="Try KLDEX, Grab, or your website" value={query} onChange={event => setQuery(event.target.value)} required maxLength={120} disabled={busy} autoComplete="organization" />
              <Button type="submit" disabled={busy} size="lg">
                {busy ? <LoaderCircle className="spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                {busy ? 'Creating' : 'Generate'}
              </Button>
            </form>

            <div className="example-row" aria-label="Example brands">
              <span>Try an example</span>
              {concepts.slice(0, 4).map(concept => (
                <Button key={concept.id} asChild variant="outline" size="sm">
                  <Link to={`?brand=${concept.id}`}>{concept.brand}</Link>
                </Button>
              ))}
            </div>

            <details open={needsContext || undefined} className="brand-context">
              <summary>Add brand details <span>Optional</span></summary>
              <label htmlFor="brand-context">What do you do, and what makes the brand recognizable?</label>
              <textarea id="brand-context" maxLength={600} value={context} disabled={busy} onChange={event => setContext(event.target.value)} placeholder="We’re a Malaysian coffee roaster known for forest green packaging and slow-roasted beans." />
            </details>

            <div className={`creation-status ${busy ? 'is-busy' : ''}`} role="status" aria-live="polite">
              {busy && <span className="status-orbit" aria-hidden="true" />}
              {status && <span>{status}</span>}
              {busy && <Button variant="ghost" size="sm" type="button" onClick={stopWaiting}>Stop</Button>}
            </div>
          </section>
          <p className="fine-print">Independent, AI-assisted concepts. Every design is reviewed and sampled before production.</p>
        </main>
      ) : (
        <main className="result-page">
          <Button asChild variant="ghost" className="back-link">
            <Link to="/">← Create another</Link>
          </Button>

          <section className="result-shell" aria-labelledby="concept-title">
            <div className="concept-story">
              <div className="result-kicker"><Check aria-hidden="true" /> Your concept is ready</div>
              <p className="brand-name">{selected.brand}</p>
              <h1 id="concept-title">{selected.title}</h1>
              <p className="concept-copy">{selected.story}</p>

              {selected.interaction && (
                <div className="interaction-card">
                  <span><Sparkles aria-hidden="true" /> The satisfying bit</span>
                  <p>{selected.interaction}</p>
                </div>
              )}

              <form id="proposal" onSubmit={event => { event.preventDefault(); dialog.current?.showModal(); }}>
                <div className="order-grid">
                  <label>Quantity<input type="number" min="1" max="100000" step="1" required value={quantity} onChange={event => setQuantity(event.target.value)} /></label>
                  <label>Budget per piece<select value={budget} onChange={event => setBudget(event.target.value)}><option value="50">RM50 · Signature</option><option value="100">RM100 · Collector</option></select></label>
                </div>
                <label>Needed by <span>(optional)</span><input type="date" min={minDate} value={date} onChange={event => setDate(event.target.value)} /></label>
                <Button className="purchase-button" size="lg" type="submit"><ShoppingBag aria-hidden="true" /> Get purchase proposal <ArrowRight aria-hidden="true" /></Button>
                <p className="form-note">No payment yet. We’ll confirm design, sample, final price, and delivery first.</p>
              </form>
            </div>

            <div className="concept-preview">
              <div className="preview-card">
                <div className="preview-image">
                  <img src={('image' in selected && selected.image) || `/clicker-assets/${selected.id}.webp`} alt={`${selected.brand} — ${selected.title}, an independent clicker concept`} />
                  <span>Custom clicker</span>
                </div>
                <div className="preview-meta">
                  <div><p>{selected.brand}</p><strong>{selected.title}</strong></div>
                  <span>From RM{budget}</span>
                </div>
              </div>
              <div className="secondary-actions">
                <Button type="button" variant="outline" onClick={share}><Share2 aria-hidden="true" /> Share</Button>
                <Button type="button" variant="outline" onClick={download}><Download aria-hidden="true" /> Download brief</Button>
              </div>
              <p className="share-status" role="status">{shareStatus}</p>
            </div>
          </section>
        </main>
      )}

      <dialog ref={dialog} aria-labelledby="brief-title">
        <Button className="dialog-close" variant="ghost" size="icon" aria-label="Close" onClick={() => dialog.current?.close()}><X aria-hidden="true" /></Button>
        <div className="dialog-icon"><ShoppingBag aria-hidden="true" /></div>
        <p className="dialog-kicker">Ready for the next step</p>
        <h2 id="brief-title">Your purchase brief is ready.</h2>
        <p>{selected?.brand} · {selected?.title}<br />{quantity} pieces · RM{budget} target each{date ? ` · Needed by ${date}` : ''}</p>
        <p className="dialog-note">Download it now to review or share. This does not place an order or take payment.</p>
        <Button className="dialog-download" size="lg" onClick={download}><Download aria-hidden="true" /> Download purchase brief</Button>
      </dialog>
    </div>
  );
}
