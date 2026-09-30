import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, LoaderCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { normalizeCompanyWebsite } from '@/lib/company-website';
import { requestConcept, supportsSummaryOnly, WebsiteAddressError, type WebsiteEvidence } from '@/lib/concept-api';
import { emptyDraft, makeCreationContext, type CreationDraft } from '@/lib/creation-journey';
import type { CollectibleConcept } from '@/lib/collectible-brief';

const steps = ['Your business', 'The object & its audience', 'Words & placement', 'Look & feel'];
export function CreationConversation({ initialDraft, navigationKey, onGenerated, onExit, directionMissing = false }: { initialDraft?: CreationDraft; directionMissing?: boolean; navigationKey: string; onGenerated: (concept: CollectibleConcept, draft: CreationDraft) => void; onExit?: () => void }) {
  const [draft, setDraft] = useState<CreationDraft>(initialDraft || { ...emptyDraft });
  const [started, setStarted] = useState(Boolean(initialDraft));
  const [step, setStep] = useState(0);
  const [evidence, setEvidence] = useState<WebsiteEvidence | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const active = useRef<AbortController | null>(null);
  const latest = useRef(0);
  const question = useRef<HTMLHeadingElement>(null);
  const cancelActive = useCallback(() => { latest.current++; active.current?.abort(); active.current = null; }, []);
  useEffect(() => { setBusy(false); setStatus(''); return cancelActive; }, [navigationKey, cancelActive]);
  useEffect(() => { if (started && !busy) question.current?.focus(); }, [step, started, busy]);
  const update = <K extends keyof CreationDraft>(key: K, value: CreationDraft[K]) => setDraft(previous => ({ ...previous, [key]: value }));
  function stop() { cancelActive(); setBusy(false); setStatus('Stopped waiting. Your answers are still here; a creation already started may still finish.'); }
  function reset() { stop(); setStarted(false); setStep(0); setEvidence(null); setDraft(previous => ({ ...emptyDraft, website: previous.website })); setStatus(''); }
  async function start(event: FormEvent) {
    event.preventDefault(); if (active.current) return;
    const website = normalizeCompanyWebsite(draft.website);
    if (!website) { setStatus('Enter a company website, such as company.com.'); return; }
    const controller = new AbortController(); active.current = controller; const attempt = ++latest.current;
    setBusy(true); setStatus('Taking a look at your business…');
    const timer = window.setTimeout(() => controller.abort(), 30000);
    let found: WebsiteEvidence | null = null;
    try {
      const data = await requestConcept({ brand: website, inspectWebsite: true }, controller.signal);
      if (!controller.signal.aborted && data.verified && data.website?.excerpt) found = data.website;
    } catch (error) {
      // Older deployments cannot skip unsafe redirects. Keep that path usable without promising an unsupported fallback.
      if (error instanceof WebsiteAddressError && !await supportsSummaryOnly(controller.signal)) {
        clearTimeout(timer);
        if (attempt === latest.current) { active.current = null; setBusy(false); setStatus('We couldn’t use that address. Try your public HTTPS homepage.'); }
        return;
      }
    }
    finally { clearTimeout(timer); }
    if (attempt !== latest.current) return;
    active.current = null; setBusy(false); setEvidence(found);
    setDraft(previous => ({ ...previous, website, summaryOnly: !found }));
    setStarted(true); setStep(0); setStatus('');
  }
  function next(event: FormEvent) {
    event.preventDefault(); setStatus('');
    if (!draft.business.trim()) { setStatus('Tell us what your business should be known for.'); return; }
    setStep(value => Math.min(4, value + 1));
  }
  async function generate() {
    if (active.current) return;
    let context: string;
    try { if (!normalizeCompanyWebsite(draft.website)) { setStep(0); throw new Error('Add your company website before creating the miniature.'); } context = makeCreationContext(draft); } catch (error) { setStatus((error as Error).message); return; }
    const controller = new AbortController(); active.current = controller; const attempt = ++latest.current;
    setBusy(true); setStatus('Turning your story into a miniature…');
    const timer = window.setTimeout(() => controller.abort(), 220000);
    try {
      const data = await requestConcept({ brand: normalizeCompanyWebsite(draft.website), context, summaryOnly: draft.summaryOnly, edition: draft.interaction === 'Display only' ? 'icon' : 'inside', format: 'miniature' }, controller.signal);
      if (attempt !== latest.current) return;
      if (controller.signal.aborted) throw new Error('Creation timed out.');
      if (data.concept) { onGenerated(data.concept, draft); return; }
      if (data.needsContext) { setStep(0); setStatus('Could you add one specific product or process to your business description?'); }
      else setStatus('We couldn’t finish your concept. Your answers are still here. Please try again.');
    } catch {
      if (attempt === latest.current) setStatus(controller.signal.aborted ? 'This is taking longer than expected. Your answers are still here. Please try again.' : 'We couldn’t finish your concept. Your answers are still here. Please try again.');
    } finally { clearTimeout(timer); if (attempt === latest.current) { active.current = null; setBusy(false); } }
  }
  const answers = [draft.business, `${draft.item} · ${draft.audience}`, draft.wording ? `“${draft.wording}” · ${draft.placement}` : 'No added wording', `${draft.style} · ${draft.interaction}`];
  const chips = <T extends string>(values: readonly T[], selected: T, choose: (value: T) => void) => <div className="choice-chips">{values.map(value => <Button type="button" variant="outline" key={value} aria-pressed={selected === value} className={selected === value ? 'is-selected' : ''} onClick={() => choose(value)} disabled={busy}>{value}</Button>)}</div>;
  return !started ? (
    <main id="main-content" className="creation-home">
      <div className="hero-layout"><section className="prompt-block" aria-labelledby="creation-title"><p className="welcome">SMALL OBJECT. DISTINCTLY YOURS.</p><h1 id="creation-title">Your business DNA.<br /> Made collectible.</h1><p className="prompt-copy">A little world built around your business. Share your website, then shape the story with us.</p>
        <form onSubmit={start} className="creation-form single-search-form" aria-busy={busy}><div className="brand-search"><Search aria-hidden="true" /><label className="sr" htmlFor="brand">Company website</label><input id="brand" placeholder="Your company website" value={draft.website} onChange={e => update('website', e.target.value)} required maxLength={120} autoComplete="url" inputMode="url" disabled={busy} /><Button type="submit" disabled={busy} aria-label={busy ? 'Reading your website' : 'Explore my business'}>{busy ? <LoaderCircle className="spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}</Button></div></form>
        <div className="creation-status" role="status">{status}{busy && <Button variant="ghost" type="button" onClick={stop}>Stop</Button>}</div>
      </section><aside className="material-study" aria-hidden="true"><div className="study-caption"><span>FORM / STORY / IDENTITY</span><span>DIORAMINI</span></div><svg viewBox="0 0 440 430" fill="none"><path d="M70 295L218 369L370 294M70 226L218 300L370 225" stroke="#c8c1b5" /><path d="M93 222L224 155L353 221L220 289Z" fill="#e9e3d8" /><path d="M93 222L220 289V340L93 274Z" fill="#c7bfb0" /><path d="M220 289L353 221V272L220 340Z" fill="#aaa193" /><path d="M93 146L224 79L353 145L220 213Z" fill="#f9f6ed" /><path d="M93 146L220 213V251L93 184Z" fill="#d8d0c2" /><path d="M220 213L353 145V183L220 251Z" fill="#b6ad9d" /><path d="M157 78L226 43L292 77L222 112Z" fill="#f16a42" /><path d="M157 78L222 112V160L157 126Z" fill="#d94f29" /><path d="M222 112L292 77V125L222 160Z" fill="#ae3e20" /></svg><div className="study-caption"><span>AN IDEA TAKES SHAPE</span><span>↗</span></div></aside></div>
      <footer className="studio-footer"><p>YOUR STORY, IN A SMALLER WORLD</p><p className="fine-print">From RM100 per piece. Design fees are separate.<br />Final pricing follows design review and a physical sample.</p></footer>
    </main>
  ) : (
    <main id="main-content" className="conversation-page"><div className="conversation-header"><Button type="button" variant="ghost" onClick={onExit || reset} disabled={busy}>← {onExit ? 'Back to your concept' : 'Change website'}</Button><p>Let’s make it yours.</p></div>
      <div className="chat-thread"><div className="chat-turn user-turn"><p className="chat-speaker">You</p><p>{draft.website}</p></div>
        <div className="chat-turn assistant-turn"><p className="chat-speaker">DIORAMINI</p>{evidence ? <><p>Here’s what I found on your website. What should the miniature say about your business?</p><details className="dna-evidence"><summary>{evidence.title || 'Read the website excerpt'}</summary><blockquote>{evidence.excerpt.slice(0, 1400)}</blockquote><a href={evidence.url} target="_blank" rel="noopener noreferrer">Read the source ↗</a></details></> : <p>{directionMissing ? 'Your earlier design details aren’t saved on this device. Add your story and exact wording again to make a new version.' : initialDraft ? 'Let’s build on your story. You can change any of the details below.' : 'I couldn’t read enough from that website. Tell me about the business and we’ll start with your description.'}</p>}</div>
        {answers.slice(0, step).map((answer, index) => <div className="chat-turn user-turn" key={index}><p className="chat-speaker">{steps[index]} <button type="button" onClick={() => { setStep(index); setStatus(''); }} disabled={busy}>Edit</button></p><p className="preserve-wording">{answer}</p></div>)}
        <section className="chat-turn assistant-turn"><p className="chat-speaker">DIORAMINI</p><p className="conversation-progress">{step < 4 ? `${step + 1} of 4 · ${steps[step]}` : 'Ready when you are'}</p>
          <h1 tabIndex={-1} ref={question}>{['What should your business be known for?', 'What shall we make, and who is it for?', 'Any words you want to make part of it?', 'How should your miniature feel?', 'Shall we bring your story to life?'][step]}</h1>
          {step < 4 ? <form className="conversation-form" onSubmit={next}>
            {step === 0 && <><p>Tell us what you do and the product, process or moment you’d like to celebrate.</p><label htmlFor="business">Your business story</label><textarea id="business" maxLength={150} required value={draft.business} onChange={e => update('business', e.target.value)} placeholder="We turn online orders into personalised gifts, then pack and ship each one…" disabled={busy} />{initialDraft && <><label htmlFor="refine-website">Company website</label><input id="refine-website" value={draft.website} maxLength={120} onChange={e => update('website', e.target.value)} required /></>}<p className="conversation-note">We’ll use your description as the starting point. You can change it anytime.</p></>}
            {step === 1 && <><fieldset className="question-card"><legend>The object</legend>{chips(['Miniature workstation', 'Small diorama'] as const, draft.item, value => update('item', value))}<p>A focused object or a small scene. Both start with sturdy, simple forms.</p></fieldset><fieldset className="question-card"><legend>Who is it for?</legend>{chips(['Clients & partners', 'Your team', 'Customers & fans'], draft.audience, value => update('audience', value))}<label htmlFor="audience">Or tell us in your own words</label><input id="audience" maxLength={40} value={draft.audience} onChange={e => update('audience', e.target.value)} required /></fieldset></>}
            {step === 2 && <><label htmlFor="wording">Exact wording <span>(optional)</span></label><textarea id="wording" maxLength={100} value={draft.wording} onChange={e => update('wording', e.target.value)} placeholder="Type it exactly as you’d like it to appear. Leave blank for no lettering." /><fieldset className="question-card"><legend>Where should it appear?</legend>{chips(['On the base', 'On a sign', 'On the object', 'Designer recommendation'] as const, draft.placement, value => update('placement', value))}</fieldset><p className="conversation-note">Have a finished logo or artwork? Keep it for the design review. Artwork and lettering are confirmed before production.</p></>}
            {step === 3 && <><fieldset className="question-card"><legend>Choose a visual direction</legend>{chips(['Realistic & refined', 'Playful & sculptural', 'Minimal & architectural'] as const, draft.style, value => update('style', value))}</fieldset><fieldset className="question-card"><legend>Would a small action help tell the story?</legend>{chips(['Display only', 'A meaningful click'] as const, draft.interaction, value => update('interaction', value))}<p>A click is added only when it echoes something your business really does.</p></fieldset></>}
            <div className="chat-actions">{step > 0 && <Button type="button" variant="ghost" onClick={() => setStep(value => value - 1)}>Back</Button>}<Button type="submit">{step === 3 ? 'Review my direction' : 'Continue'}<ArrowRight aria-hidden="true" /></Button></div>
          </form> : <><dl className="answer-review">{steps.map((label, index) => <div key={label}><dt>{label}</dt><dd className="preserve-wording">{answers[index]}</dd></div>)}</dl><p className="conversation-note">A visual concept to refine together. From RM100 per piece, with design fees separate.</p><div className="chat-actions"><Button type="button" variant="ghost" disabled={busy} onClick={() => setStep(3)}>Back</Button><Button type="button" disabled={busy} onClick={generate}>{busy ? <><LoaderCircle className="spin" aria-hidden="true" />Creating your miniature</> : <>Create my miniature<ArrowRight aria-hidden="true" /></>}</Button></div></>}
          <div className="creation-status" role="status" aria-live="polite">{status}{busy && <Button variant="ghost" type="button" onClick={stop}>Stop</Button>}</div>
        </section></div>
    </main>
  );
}
