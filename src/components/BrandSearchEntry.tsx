import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { BRAND_DISCOVERY_VERSION, loadLookupDraft, requestBrandDiscovery, saveLookupDraft, type BrandDiscoveryRequest, type BrandDiscoveryResponse } from '@/lib/brand-discovery';
import { pilotCredentialVersion, subscribePilotAccess } from '@/lib/pilot-access';

type Props = {
  available: boolean; disabled: boolean; navigationKey: string; sessionId: string; initialName?: string; initialStory?: string;
  onReady: (result: BrandDiscoveryResponse, sessionId: string) => void;
  onManual: (name: string, story: string, sessionId: string) => void;
  onAccessRequest: () => void;
};
export default function BrandSearchEntry({ available, disabled, navigationKey, sessionId, initialName = '', initialStory = '', onReady, onManual, onAccessRequest }: Props) {
  const [saved, setSaved] = useState(loadLookupDraft);
  const [query, setQuery] = useState(() => initialName || saved?.query || '');
  const [result, setResult] = useState<BrandDiscoveryResponse | null>(null);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const [manual, setManual] = useState(Boolean(initialStory)); const [name, setName] = useState(initialName); const [story, setStory] = useState(initialStory);
  const [clarifiedName, setClarifiedName] = useState('');
  const active = useRef<AbortController | null>(null); const epoch = useRef(0);
  const latest = useRef({ onReady, available, sessionId }); latest.current = { onReady, available, sessionId };
  const candidateHeading = useRef<HTMLHeadingElement>(null);
  const credentialSeen = useRef(pilotCredentialVersion());
  const cancel = useCallback(() => { epoch.current++; active.current?.abort(); active.current = null; setBusy(false); }, []);
  useEffect(() => { cancel(); setResult(null); setMessage(''); return cancel; }, [navigationKey, sessionId, cancel]);
  useEffect(() => { setName(initialName); setStory(initialStory); setManual(Boolean(initialStory)); }, [initialName, initialStory, sessionId]);
  useEffect(() => { if (result?.candidates.length && (result.status === 'choose' || result.status === 'needs-context')) candidateHeading.current?.focus(); }, [result]);
  useEffect(() => { if (!available && active.current) { cancel(); setMessage('Preview access changed. Your entry is still here.'); } }, [available, cancel]);
  useEffect(() => subscribePilotAccess(() => {
    const current = pilotCredentialVersion(); if (current === credentialSeen.current) return;
    credentialSeen.current = current; cancel(); setResult(null); setClarifiedName('');
    setMessage('Preview access changed. Check the saved lookup with this invitation before continuing.');
  }), [cancel]);
  async function lookup(request: BrandDiscoveryRequest, originalQuery = query) {
    if (active.current || disabled) return;
    if (!available) { setMessage('Use your invitation to create a private preview. You can still explore the examples or request a design proposal.'); onAccessRequest(); return; }
    const controller = new AbortController(); active.current = controller; const attempt = ++epoch.current; const credential = pilotCredentialVersion();
    setBusy(true); setMessage('');
    const draft = { query: originalQuery, ...('researchId' in request ? { researchId: request.researchId } : {}) };
    setSaved(draft); const stored = saveLookupDraft(draft);
    const timer = window.setTimeout(() => controller.abort(), 65000);
    try {
      const found = await requestBrandDiscovery(request, controller.signal);
      if (controller.signal.aborted || epoch.current !== attempt || credential !== pilotCredentialVersion() || latest.current.sessionId !== sessionId) return;
      setResult(found); setMessage(found.message);
      if (found.researchId) { const next = { query: originalQuery, researchId: found.researchId }; setSaved(next); saveLookupDraft(next); }
      if (found.status === 'ready') {
        if (request.action === 'recover-brand') { setMessage('Your saved brand research is ready. Create the concept when you’re ready; no image generation has started.'); return; }
        // The button explicitly requested a concept. Candidate selection continues that request.
        saveLookupDraft(null); setSaved(null); active.current = null; setBusy(false);
        latest.current.onReady(found, sessionId);
      } else if (!stored) setMessage(`${found.message} This browser cannot save the lookup; keep this tab open.`);
    } catch (error) {
      if (epoch.current === attempt) setMessage(controller.signal.aborted ? 'The lookup took too long. Check for a saved result before trying anything else.' : error instanceof Error ? error.message : 'Lookup could not finish. Your entry is still here.');
    } finally { clearTimeout(timer); if (epoch.current === attempt) { active.current = null; setBusy(false); } }
  }
  function stop() { cancel(); setMessage('Stopped waiting. An online lookup already started still counts. Check for its saved result; it will not be searched again automatically.'); }
  function submit() {
    if (!query.trim()) { setMessage('Enter your brand name or public website.'); return; }
    setResult(null);
    void lookup({ contractVersion: BRAND_DISCOVERY_VERSION, action: 'discover-brand', query });
  }
  function recover() {
    if (!saved) return;
    void lookup({ contractVersion: BRAND_DISCOVERY_VERSION, action: 'recover-brand', ...(saved.researchId ? { researchId: saved.researchId } : { query: saved.query }) }, saved.query);
  }
  function select(candidateId: string) {
    if (!result?.researchId) return;
    void lookup({ contractVersion: BRAND_DISCOVERY_VERSION, action: 'select-brand', researchId: result.researchId, candidateId,
      ...(result.reason === 'name-required' ? { brandName: clarifiedName } : {}) }, saved?.query || query);
  }
  function manualSubmit() {
    if (!available) { onAccessRequest(); setMessage('Open your invitation before generating a concept.'); return; }
    if (!name.trim() || name.length > 120 || !story.trim() || story.length > 2000) { setMessage('Add your exact brand name and a short factual description.'); return; }
    cancel(); saveLookupDraft(null); setSaved(null); setResult(null); onManual(name, story, sessionId);
  }
  return <section id="proposal-conversation" tabIndex={-1} className="op-brand-search" aria-label="Preview your brand" aria-busy={busy}>
    {!initialStory&&<form className="op-brand-form" onSubmit={event => { event.preventDefault(); submit(); }}>
      <label htmlFor="brand-search">Your brand name or website</label>
      <div className="op-brand-input"><input id="brand-search" value={query} maxLength={300} autoComplete="organization" placeholder="e.g. Stive Asia" disabled={busy || disabled} onChange={event => { setQuery(event.target.value); setResult(null); setMessage(''); }}/><button className="op-primary" disabled={busy || disabled || !query.trim()}>{busy ? <><LoaderCircle size={16} className="op-spin"/>Reading your brand…</> : <>See my concept<ArrowRight size={16}/></>}</button></div>
    </form>}
    {!initialStory&&<p className="op-search-note">We’ll look for your brand online, then create your collectible concept. {available ? '' : 'Private previews by invitation.'}</p>}
    {busy && <button className="op-secondary" onClick={stop}>Stop lookup</button>}
    {message && <p className="op-search-message" role="status">{message}</p>}
    {result?.status === 'ready' && saved && !busy && <div className="op-brand-recovered"><strong>{result.brand}</strong><p>{result.summary}</p>{result.evidence.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{source.title || new URL(source.url).hostname}</a>)}<button className="op-primary" disabled={disabled || !available} onClick={() => { saveLookupDraft(null); setSaved(null); latest.current.onReady(result, sessionId); }}>Create concept from saved research</button></div>}
    {result && result.candidates.length > 0 && (result.status === 'choose' || result.status === 'needs-context') && <div className="op-brand-choices">
      <h2 ref={candidateHeading} tabIndex={-1}>{result.reason === 'name-required' ? 'What name should your collectible carry?' : result.reason === 'insufficient-evidence' ? 'Try another source for your brand' : 'Which brand is yours?'}</h2>
      {result.reason === 'name-required' && <label>Exact brand name<input value={clarifiedName} onChange={event => setClarifiedName(event.target.value)} maxLength={120} disabled={busy || disabled}/></label>}
      {result.candidates.map(candidate => <article key={candidate.id}><strong>{candidate.title}</strong><a href={candidate.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{new URL(candidate.url).hostname}</a><p>{candidate.excerpt}</p><button className="op-secondary" disabled={busy || disabled || result.reason === 'name-required' && !clarifiedName.trim()} onClick={() => select(candidate.id)}>Use this brand</button></article>)}
    </div>}
    {saved && !busy && <div className="op-lookup-recovery"><button className="op-secondary" disabled={disabled || !available} onClick={recover}>Check saved lookup</button><button className="op-secondary" disabled={disabled} onClick={() => { saveLookupDraft(null); setSaved(null); setMessage('Lookup draft cleared from this browser. Used online allowance is unchanged.'); }}>Clear lookup draft</button><p>Saved in this browser. Checking a saved lookup does not run another online search.</p></div>}
    <details className="op-search-details"><summary>Preview details</summary><p>This private pilot includes one online brand lookup. Check the name before continuing. If a lookup fails or finds the wrong business, use a factual description or discuss it with OFFKIN. AI images show a proposed design; feasibility and pricing follow in the design proposal.</p></details>
    <details className="op-manual-entry" open={manual} onToggle={event => setManual(event.currentTarget.open)}><summary>{initialStory?'Continue your saved direction':'Prefer to describe your idea?'}</summary><form onSubmit={event => { event.preventDefault(); manualSubmit(); }}><label>Brand or project name<input value={name} onChange={event => setName(event.target.value)} maxLength={120} disabled={busy || disabled}/></label><label>Your story<textarea value={story} onChange={event => setStory(event.target.value)} maxLength={2000} rows={3} disabled={busy || disabled} placeholder="What do you do, and what makes your brand distinctive?"/></label><p>{initialStory?'Your saved brand and story are here. Review or add factual context; this continuation does not run another online search.':'This uses the facts you supply, without online research.'}</p><button className="op-secondary" disabled={busy || disabled || !name.trim() || !story.trim()}>Create from my story</button></form></details>
  </section>;
}
