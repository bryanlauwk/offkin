import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, LoaderCircle, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { normalizeCompanyWebsite } from '@/lib/company-website';
import { requestConcept, supportsSummaryOnly, WebsiteAddressError, type WebsiteEvidence } from '@/lib/concept-api';
import { emptyDraft, makeCreationContext, type CreationDraft } from '@/lib/creation-journey';
import type { CollectibleConcept } from '@/lib/collectible-brief';

const steps = ['Your business', 'The object & its audience', 'Words & placement', 'Look & feel'];
const questions = [
  'Lovely. So — what should your business be known for?',
  'Great, I can picture it. What shall we make, and who is it for?',
  'Any words you’d like built into it?',
  'Last one: how should your miniature feel?',
  'That’s everything I need. Shall we bring your story to life?'
];
function Avatar() { return <span className="chat-avatar" aria-hidden="true"><Sparkles /></span>; }
function Typing() { return <span className="typing-dots" aria-hidden="true"><i /><i /><i /></span>; }
export function CreationConversation({ initialDraft, navigationKey, onGenerated, onExit, directionMissing = false }: { initialDraft?: CreationDraft; directionMissing?: boolean; navigationKey: string; onGenerated: (concept: CollectibleConcept, draft: CreationDraft) => void; onExit?: () => void }) {
  const [draft, setDraft] = useState<CreationDraft>(initialDraft || { ...emptyDraft });
  const [started, setStarted] = useState(Boolean(initialDraft));
  const [step, setStep] = useState(0);
  const [evidence, setEvidence] = useState<WebsiteEvidence | null>(null);
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [status, setStatus] = useState('');
  const active = useRef<AbortController | null>(null);
  const latest = useRef(0);
  const question = useRef<HTMLHeadingElement>(null);
  const foot = useRef<HTMLDivElement>(null);
  const cancelActive = useCallback(() => { latest.current++; active.current?.abort(); active.current = null; }, []);
  useEffect(() => { setBusy(false); setStatus(''); return cancelActive; }, [navigationKey, cancelActive]);
  useEffect(() => { if (started && !busy && !thinking) question.current?.focus(); }, [step, started, busy, thinking]);
  useEffect(() => { if (started) foot.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [step, started, thinking]);
  const update = <K extends keyof CreationDraft>(key: K, value: CreationDraft[K]) => setDraft(previous => ({ ...previous, [key]: value }));
  function stop() { cancelActive(); setBusy(false); setStatus('Stopped waiting. Your answers are still here; a creation already started may still finish.'); }
  function reset() { stop(); setStarted(false); setStep(0); setEvidence(null); setDraft(previous => ({ ...emptyDraft, website: previous.website })); setStatus(''); }
  function advance(to: number) { setThinking(true); window.setTimeout(() => { setThinking(false); setStep(to); }, 520); }
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
    advance(Math.min(4, step + 1));
  }
  async function generate() {
    if (active.current) return;
    let context: string;
    const site = normalizeCompanyWebsite(draft.website); const noSite = !site && Boolean(initialDraft);
    try { if (!site && !noSite) { setStep(0); throw new Error('Add your company website before creating the miniature.'); } context = makeCreationContext(draft); } catch (error) { setStatus((error as Error).message); return; }
    const controller = new AbortController(); active.current = controller; const attempt = ++latest.current;
    setBusy(true); setStatus('Turning your story into a miniature…');
    const timer = window.setTimeout(() => controller.abort(), 220000);
    try {
      const data = await requestConcept({ brand: site || 'no-website', context, summaryOnly: noSite || draft.summaryOnly, edition: draft.interaction === 'Display only' ? 'icon' : 'inside', format: 'miniature' }, controller.signal);
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
      <section className="welcome-hero" aria-labelledby="creation-title">
        <div className="prompt-block">
          <p className="guide-greeting"><Avatar />Hi, I’m your miniature studio guide</p>
          <h1 id="creation-title">What should we<br />bring to life?</h1>
          <p className="prompt-copy">Share your company website. I’ll get to know your story, ask a few simple questions, and shape it into a collectible miniature.</p>
          <form onSubmit={start} className="creation-form single-search-form" aria-busy={busy}>
            <div className="brand-search"><Search aria-hidden="true" /><label className="sr" htmlFor="brand">Company website</label><input id="brand" placeholder="Enter your company website…" value={draft.website} onChange={e => update('website', e.target.value)} required maxLength={120} autoComplete="url" inputMode="url" disabled={busy} /><Button type="submit" disabled={busy}>{busy ? <><LoaderCircle className="spin" aria-hidden="true" /><span>Reading</span></> : <><span>Start creating</span><ArrowRight aria-hidden="true" /></>}</Button></div>
          </form>
          <div className="creation-status" role="status">{status}{busy && <Button variant="ghost" type="button" onClick={stop}>Stop</Button>}</div>
          <p className="hero-reassure">About a minute <span aria-hidden="true">·</span> No account needed <span aria-hidden="true">·</span> Change anything later</p>
        </div>
        <figure className="hero-product">
          <div className="product-image-wrap"><img src="/miniature-assets/stive-commerce-v1.webp" alt="A colorful STIVE Commerce shop recreated as a collectible miniature" /></div>
          <figcaption><span><strong>STIVE Commerce</strong> Featured studio design</span><span className="product-format">Inside · Miniature</span></figcaption>
          <span className="product-note product-note-top" aria-hidden="true">Made from a business story</span>
          <span className="product-note product-note-side" aria-hidden="true">Desk-sized delight</span>
        </figure>
      </section>
      <footer className="studio-footer"><p>Every business has a tiny world inside it.</p><p className="fine-print">From RM100 per piece · Design fees are separate</p></footer>
    </main>
  ) : (
    <main id="main-content" className="conversation-page">
      <div className="conversation-header"><Button type="button" variant="ghost" onClick={onExit || reset} disabled={busy}>← {onExit ? 'Back to your concept' : 'Change website'}</Button><p><span className="live-dot" aria-hidden="true" />Studio guide · online</p></div>
      <div className="chat-thread">
        <div className="chat-turn user-turn"><p className="chat-speaker">You</p><p>{draft.website}</p></div>
        <div className="chat-turn assistant-turn"><p className="chat-speaker"><Avatar />Studio guide</p>{evidence ? <><p>Thanks for sharing! I had a read of your website — here’s what stood out. Anything you’d add?</p><details className="dna-evidence"><summary>{evidence.title || 'Read the website excerpt'}</summary><blockquote>{evidence.excerpt.slice(0, 1400)}</blockquote><a href={evidence.url} target="_blank" rel="noopener noreferrer">Read the source ↗</a></details></> : <p>{directionMissing ? 'Your earlier design details aren’t saved on this device. Add your story and exact wording again and we’ll make a new version.' : initialDraft ? 'Happy to keep going! You can change any of the details below.' : 'Thanks! I couldn’t read much from that website, so tell me about the business in your own words and we’ll start there.'}</p>}</div>
        {answers.slice(0, step).map((answer, index) => <div className="chat-turn user-turn" key={index}><p className="chat-speaker">{steps[index]} <button type="button" onClick={() => { setStep(index); setStatus(''); }} disabled={busy}>Edit</button></p><p className="preserve-wording">{answer}</p></div>)}
        {thinking ? <div className="chat-turn assistant-turn is-typing"><p className="chat-speaker"><Avatar />Studio guide</p><Typing /></div> : <section className="chat-turn assistant-turn"><p className="chat-speaker"><Avatar />Studio guide</p><p className="conversation-progress">{step < 4 ? `${step + 1} of 4 · ${steps[step]}` : 'Ready when you are'}</p>
          <h1 tabIndex={-1} ref={question}>{questions[step]}</h1>
          {step < 4 ? <form className="conversation-form" onSubmit={next}>
            {step === 0 && <><p>Tell me what you do and the product, process or moment you’d like to celebrate.</p><label htmlFor="business">Your business story</label><textarea id="business" maxLength={150} required value={draft.business} onChange={e => update('business', e.target.value)} placeholder="We turn online orders into personalised gifts, then pack and ship each one…" disabled={busy} />{initialDraft && <><label htmlFor="refine-website">Company website</label><input id="refine-website" value={draft.website} maxLength={120} onChange={e => update('website', e.target.value)} required /></>}<p className="conversation-note">No need for perfect wording — you can change this anytime.</p></>}
            {step === 1 && <><fieldset className="question-card"><legend>The object</legend>{chips(['Miniature workstation', 'Small diorama'] as const, draft.item, value => update('item', value))}<p>A focused object or a small scene. Both start with sturdy, simple forms.</p></fieldset><fieldset className="question-card"><legend>Who is it for?</legend>{chips(['Clients & partners', 'Your team', 'Customers & fans'], draft.audience, value => update('audience', value))}<label htmlFor="audience">Or tell me in your own words</label><input id="audience" maxLength={40} value={draft.audience} onChange={e => update('audience', e.target.value)} required /></fieldset></>}
            {step === 2 && <><label htmlFor="wording">Exact wording <span>(optional)</span></label><textarea id="wording" maxLength={100} value={draft.wording} onChange={e => update('wording', e.target.value)} placeholder="Type it exactly as you’d like it to appear. Leave blank for no lettering." /><fieldset className="question-card"><legend>Where should it appear?</legend>{chips(['On the base', 'On a sign', 'On the object', 'Designer recommendation'] as const, draft.placement, value => update('placement', value))}</fieldset><p className="conversation-note">Have a finished logo or artwork? Keep it for the design review — artwork and lettering are confirmed before production.</p></>}
            {step === 3 && <><fieldset className="question-card"><legend>Choose a visual direction</legend>{chips(['Realistic & refined', 'Playful & sculptural', 'Minimal & architectural'] as const, draft.style, value => update('style', value))}</fieldset><fieldset className="question-card"><legend>Would a small action help tell the story?</legend>{chips(['Display only', 'A meaningful click'] as const, draft.interaction, value => update('interaction', value))}<p>A click is added only when it echoes something your business really does.</p></fieldset></>}
            <div className="chat-actions">{step > 0 && <Button type="button" variant="ghost" onClick={() => advance(step - 1)}>Back</Button>}<Button type="submit">{step === 3 ? 'Review my direction' : 'Continue'}<ArrowRight aria-hidden="true" /></Button></div>
          </form> : <><dl className="answer-review">{steps.map((label, index) => <div key={label}><dt>{label}</dt><dd className="preserve-wording">{answers[index]}</dd></div>)}</dl><p className="conversation-note">A visual concept to refine together. From RM100 per piece, with design fees separate.</p><div className="chat-actions"><Button type="button" variant="ghost" disabled={busy} onClick={() => advance(3)}>Back</Button><Button type="button" disabled={busy} onClick={generate}>{busy ? <><LoaderCircle className="spin" aria-hidden="true" />Creating your miniature</> : <>Create my miniature<ArrowRight aria-hidden="true" /></>}</Button></div></>}
          <div className="creation-status" role="status" aria-live="polite">{status}{busy && <Button variant="ghost" type="button" onClick={stop}>Stop</Button>}</div>
        </section>}
        <div ref={foot} />
      </div>
    </main>
  );
}
