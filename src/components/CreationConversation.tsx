import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Globe2, LoaderCircle, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConceptStudy } from '@/components/ConceptStudy';
import { normalizeCompanyWebsite } from '@/lib/company-website';
import { requestConcept, supportsSummaryOnly, WebsiteAddressError, type WebsiteEvidence } from '@/lib/concept-api';
import { emptyDraft, makeCreationContext, type CreationDraft } from '@/lib/creation-journey';
import { angleEvidence, getStoryAngle, storyAngles } from '@/lib/story-angles';
import type { CollectibleConcept } from '@/lib/collectible-brief';

const studies = [
  { kind: 'a24', brand: 'A24', title: 'OFF-SCREEN', line: 'The frame hides its making.', detail: 'A small cinematic scene. Press to reveal the work outside the frame.' },
  { kind: 'airbnb', brand: 'Airbnb', title: 'A PLACE IS MADE', line: 'A place becomes yours when someone makes room.', detail: 'A table, an empty place, a spare chair. One small gesture of welcome.' },
  { kind: 'tesla', brand: 'Tesla', title: 'STORED AFTERNOON', line: 'What if you could keep a little of the afternoon?', detail: 'A quiet architectural study of sunlight, storage and the hours after.' },
] as const;
const steps = ['Find a story', 'Go one layer deeper', 'Shape the object', 'Review & create'];

export function CreationConversation({ initialDraft, navigationKey, onGenerated, onExit, directionMissing = false }: { initialDraft?: CreationDraft; directionMissing?: boolean; navigationKey: string; onGenerated: (concept: CollectibleConcept, draft: CreationDraft) => void; onExit?: () => void }) {
  const [draft, setDraft] = useState<CreationDraft>(initialDraft || { ...emptyDraft });
  const [started, setStarted] = useState(Boolean(initialDraft));
  const [step, setStep] = useState(0);
  const [evidence, setEvidence] = useState<WebsiteEvidence | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [activeDesign, setActiveDesign] = useState(0);
  const [showProcess, setShowProcess] = useState(false);
  const active = useRef<AbortController | null>(null);
  const latest = useRef(0);
  const question = useRef<HTMLHeadingElement>(null);
  const cancelActive = useCallback(() => { latest.current++; active.current?.abort(); active.current = null; }, []);
  useEffect(() => { setBusy(false); setStatus(''); return cancelActive; }, [navigationKey, cancelActive]);
  useEffect(() => { if (started && !busy) question.current?.focus(); }, [step, started, busy]);
  const update = <K extends keyof CreationDraft>(key: K, value: CreationDraft[K]) => setDraft(previous => ({ ...previous, [key]: value }));
  function stop() { cancelActive(); setBusy(false); setStatus('Stopped waiting. Your answers are still here. A creation already started may still finish.'); }
  function reset() { cancelActive(); setBusy(false); setStarted(false); setStep(0); setEvidence(null); setDraft(previous => ({ ...emptyDraft, website: previous.website })); setStatus(''); }
  function go(to: number) { setStatus(''); setStep(to); }
  async function start(event: FormEvent) {
    event.preventDefault(); if (active.current) return;
    const website = normalizeCompanyWebsite(draft.website);
    if (!website) { setStatus('Enter a company website, such as company.com.'); return; }
    const controller = new AbortController(); active.current = controller; const attempt = ++latest.current;
    setBusy(true); setStatus('Reading the public website. No concept is being generated yet.');
    const timer = window.setTimeout(() => controller.abort(), 30000);
    let found: WebsiteEvidence | null = null;
    try {
      const data = await requestConcept({ brand: website, inspectWebsite: true }, controller.signal);
      if (!controller.signal.aborted && data.verified && data.website?.excerpt) found = data.website;
    } catch (error) {
      if (error instanceof WebsiteAddressError && !await supportsSummaryOnly(controller.signal)) {
        if (attempt === latest.current) { active.current = null; setBusy(false); setStatus('We couldn’t use that address. Try your public HTTPS homepage.'); }
        return;
      }
    } finally { clearTimeout(timer); }
    if (attempt !== latest.current) return;
    active.current = null; setBusy(false); setEvidence(found);
    setDraft(previous => ({ ...emptyDraft, website, summaryOnly: !found }));
    setStarted(true); setStep(0); setStatus('');
  }
  function next(event: FormEvent) {
    event.preventDefault(); setStatus('');
    if (step === 0 && !draft.angle) { setStatus('Choose the story you’d like to explore.'); return; }
    if (step === 0 && !draft.business.trim()) { setStatus('Add a short, factual description of the business.'); return; }
    if (step === 1 && !draft.hiddenDetail.trim()) { setStatus('Add one everyday detail. It can be small.'); return; }
    if (step === 2) { try { makeCreationContext(draft); } catch (error) { setStatus((error as Error).message); return; } }
    go(Math.min(3, step + 1));
  }
  async function generate() {
    if (active.current) return;
    let context: string;
    const site = normalizeCompanyWebsite(draft.website); const noSite = !site && Boolean(initialDraft);
    try { if (!site && !noSite) { setStep(0); throw new Error('Add your company website before creating a concept.'); } context = makeCreationContext(draft); } catch (error) { setStatus((error as Error).message); return; }
    const controller = new AbortController(); active.current = controller; const attempt = ++latest.current;
    setBusy(true); setStatus('Making your first visual concept. This can take a few minutes.');
    const timer = window.setTimeout(() => controller.abort(), 220000);
    try {
      const data = await requestConcept({ brand: site || 'no-website', context, summaryOnly: noSite || draft.summaryOnly, edition: draft.interaction === 'Display only' ? 'icon' : 'inside', format: 'miniature' }, controller.signal);
      if (attempt !== latest.current) return;
      if (controller.signal.aborted) throw new Error('Creation timed out.');
      if (data.concept) { onGenerated(data.concept, draft); return; }
      if (data.needsContext) { setStep(0); setStatus('Add one specific product or process to your business description.'); }
      else setStatus('We couldn’t finish your concept. Your answers are still here. Please try again.');
    } catch {
      if (attempt === latest.current) setStatus(controller.signal.aborted ? 'This is taking longer than expected. Your answers are still here. Please try again.' : 'We couldn’t finish your concept. Your answers are still here. Please try again.');
    } finally { clearTimeout(timer); if (attempt === latest.current) { active.current = null; setBusy(false); } }
  }
  const chips = <T extends string>(values: readonly T[], selected: T, choose: (value: T) => void) => <div className="choice-chips">{values.map(value => <button type="button" key={value} aria-pressed={selected === value} className={selected === value ? 'is-selected' : ''} onClick={() => choose(value)} disabled={busy}>{value}{selected === value && <Check size={14} aria-hidden="true" />}</button>)}</div>;
  const sources = angleEvidence(evidence, draft.business);
  const chosen = getStoryAngle(draft.angle);
  const study = studies[activeDesign];
  const statusBlock = <div className="creation-status" role="status" aria-live="polite">{busy && <LoaderCircle className="spin" size={16} aria-hidden="true" />}{status}{busy && <button type="button" className="text-button" onClick={stop}>Stop waiting</button>}</div>;
  return !started ? <main id="main-content" className="creation-home">
    <section className="editorial-hero" aria-labelledby="creation-title">
      <div className="hero-intro"><p className="eyebrow"><span className="studio-dot" /> AN INDEPENDENT CREATIVE STUDIO</p>
        <h1 id="creation-title">Your business DNA.<br />{' '}<span>Made collectible.</span></h1>
        <div className="hero-bottom"><p className="hero-description">A different way to see your business.<br />A small object worth a second look.</p><p className="hero-subcopy">We find the overlooked stories and turn them into distinctive physical objects. AI-assisted ideas. Human detail. Miniatures are just the beginning.</p>
          <form onSubmit={start} className="website-composer" aria-busy={busy}><label htmlFor="brand">START WITH YOUR WEBSITE</label><div className="website-input"><Globe2 size={19} aria-hidden="true" /><input id="brand" placeholder="your-business.com" value={draft.website} onChange={e => update('website', e.target.value)} required maxLength={120} autoComplete="url" inputMode="url" disabled={busy} /><button type="submit" disabled={busy} aria-label={busy ? 'Reading website' : 'Explore my business'}>{busy ? <LoaderCircle className="spin" size={20} /> : <ArrowUpRight size={25} />}</button></div></form>
          {statusBlock}<p className="composer-note">Three story lenses. One detail only you know. Then we create.</p>
        </div>
      </div>
      <div className="hero-study"><div className="study-topline"><span>OBSERVATION STUDY / 0{activeDesign + 1}</span><span>TRY THE OBJECT <span aria-hidden="true">↙</span></span></div><ConceptStudy key={study.kind} kind={study.kind} /><div className="study-caption"><div><span className="eyebrow">{study.brand} / UNOFFICIAL CONCEPT</span><h2>{study.title}</h2><p>{study.line}</p></div><span className="study-index">0{activeDesign + 1}<span>/03</span></span></div><div className="study-tabs" role="group" aria-label="Explore observation studies">{studies.map((entry, index) => <button key={entry.kind} type="button" aria-pressed={index === activeDesign} onClick={() => setActiveDesign(index)}><span>0{index + 1}</span>{entry.brand}<ArrowUpRight size={15} aria-hidden="true" /></button>)}</div><p className="concept-note">Independent design explorations. No affiliation, commission or endorsement.</p></div>
    </section>
    <section className="studio-footnote"><div className="footnote-statement"><span className="asterisk" aria-hidden="true">✳</span><p>Less logo.<br /><strong>More story.</strong></p></div><p>One scene. One meaningful action.<br />Built around the details that make you, you.</p><div className="price-note"><strong>Objects from RM100*</strong><span>*Indicative entry point. Design and prototyping priced separately. Final quote after review.</span></div><button type="button" className="process-toggle" aria-expanded={showProcess} aria-controls="studio-process" onClick={() => setShowProcess(value => !value)}>How it takes shape{showProcess ? <Minus size={17} /> : <Plus size={17} />}</button></section>
    {showProcess && <section id="studio-process" className="process-details"><div><span>01 / OBSERVE</span><h2>Find your story</h2><p>Read a public website, choose an editorial lens, then add the detail only you know.</p></div><div><span>02 / EXPLORE</span><h2>Make the first look</h2><p>You approve the direction before AI creates a visual concept. Refine it until the idea feels right.</p></div><div><span>03 / PROTOTYPE</span><h2>Make it real</h2><p>Construction, motion, finish and cost need design review and a physical sample before production.</p></div></section>}
  </main> : <main id="main-content" className="journey-page">
    <div className="journey-top"><button type="button" className="text-button" onClick={onExit || reset}>← {onExit ? 'Back to your concept' : 'Change website'}</button><span className="journey-source">{draft.website || 'Your story'}</span></div>
    <ol className="journey-progress" aria-label="Creation progress">{steps.map((label, index) => <li key={label} className={index === step ? 'is-current' : index < step ? 'is-done' : ''}><button type="button" disabled={index > step || busy} onClick={() => go(index)} aria-current={index === step ? 'step' : undefined}><span>{index < step ? <Check size={14} /> : `0${index + 1}`}</span>{label}</button></li>)}</ol>
    <div className="journey-body"><aside className="journey-aside"><p className="eyebrow">A STORY WORTH HOLDING</p><p className="aside-large">{step === 0 ? <>Look closer.<br /><em>There’s a story.</em></> : step === 1 ? <>Small detail.<br /><em>Big difference.</em></> : step === 2 ? <>Give the idea<br /><em>some shape.</em></> : <>Your point<br /><em>of view.</em></>}</p><span className="aside-mark" aria-hidden="true">↘</span>{chosen && <div className="selected-lens"><span>YOUR CHOSEN LENS</span><strong>{chosen.title}</strong><p>{chosen.question}</p></div>}<p className="aside-note">Your answers stay editable. Generation starts only when you choose it.</p></aside>
      <section className="journey-content" aria-busy={busy}><p className="eyebrow">0{step + 1} / {steps[step].toUpperCase()}</p><h1 tabIndex={-1} ref={question}>{['Which story deserves a closer look?', 'What do customers not know that you do every day?', 'How should the story feel in someone’s hand?', 'A small object. A very specific story.'][step]}</h1>
        {directionMissing && <p className="notice">Your earlier design details aren’t saved on this device. Add the story and exact wording again to make a new version.</p>}
        <form onSubmit={next} className="direction-form">
          {step === 0 && <>{evidence ? <details className="source-evidence"><summary><Globe2 size={15} />Text from {evidence.title || 'your website'}<Plus size={15} /></summary><p>{evidence.excerpt.slice(0, 1400)}</p><a href={evidence.url} target="_blank" rel="noopener noreferrer">Open public source ↗</a></details> : <p className="notice">{initialDraft ? 'Continue with your saved direction. You can change any detail.' : 'We couldn’t read enough from this website. Start with a short description and your own knowledge instead.'}</p>}
            <label htmlFor="business">In one line, what does the business do?</label><input id="business" maxLength={100} value={draft.business} onChange={e => update('business', e.target.value)} required placeholder="We make personalised gifts and pack each order by hand." />
            <p className="field-note">These are editorial prompts to explore, not AI findings or verified claims about your business.</p>
            <fieldset className="angle-list"><legend className="sr">Choose a story lens</legend>{storyAngles.map((angle, index) => <label key={angle.id} className={`angle-card ${draft.angle === angle.id ? 'is-selected' : ''}`}><input type="radio" name="angle" value={angle.id} checked={draft.angle === angle.id} onChange={() => update('angle', angle.id)} /><span className="angle-number">0{index + 1}</span><span className="angle-copy"><span className="eyebrow">{angle.label}</span><strong>{angle.title}</strong><span>{angle.question}</span><span className="angle-object">{angle.object}</span>{sources[index] && <span className="angle-evidence">{evidence ? 'Source detail' : 'Your description'}: “{sources[index]}”</span>}</span><span className="angle-check" aria-hidden="true">{draft.angle === angle.id ? <Check size={15} /> : <ArrowUpRight size={17} />}</span></label>)}</fieldset></>}
          {step === 1 && <><p className="question-description">The careful check. The small ritual. The part that happens before anyone sees the result. This is where the idea becomes yours.</p><label htmlFor="hidden-detail">The detail only you know</label><textarea id="hidden-detail" maxLength={120} value={draft.hiddenDetail} onChange={e => update('hiddenDetail', e.target.value)} required placeholder="Every gift is placed back in its box three times until the reveal feels right." /><p className="field-note">One real detail, up to 120 characters. Avoid private or confidential information.</p><div className="direction-callout"><span>THE STORY TO EXPLORE</span><p>{chosen?.question}</p><p>{chosen?.object}</p></div></>}
          {step === 2 && <><fieldset><legend>The object</legend>{chips(['Small diorama', 'Miniature workstation'] as const, draft.item, value => update('item', value))}<p className="field-note">A palm-sized first direction. Other physical formats can follow at design review.</p></fieldset><fieldset><legend>Visual direction</legend>{chips(['Minimal & architectural', 'Playful & sculptural', 'Realistic & refined'] as const, draft.style, value => update('style', value))}</fieldset><fieldset><legend>Who will keep it?</legend>{chips(['Clients & partners', 'Your team', 'Customers & fans'], draft.audience, value => update('audience', value))}<label htmlFor="audience" className="sr">Audience</label><input id="audience" maxLength={40} value={draft.audience} onChange={e => update('audience', e.target.value)} required /></fieldset><fieldset><legend>A small interaction</legend>{chips(['A meaningful click', 'Display only'] as const, draft.interaction, value => update('interaction', value))}<p className="field-note">One meaningful action, only if it helps tell the story. Motion needs prototype validation.</p></fieldset><label htmlFor="wording">Exact wording <span>(optional)</span></label><textarea id="wording" rows={2} maxLength={100} value={draft.wording} onChange={e => update('wording', e.target.value)} placeholder="Leave blank for no lettering." /><p className="field-note">We keep what you type, including spacing and punctuation. Rendered text still needs artwork proofing.</p><fieldset><legend>Where should the words appear?</legend>{chips(['On the base', 'On a sign', 'On the object', 'Designer recommendation'] as const, draft.placement, value => update('placement', value))}</fieldset></>}
          {step === 3 && <><dl className="answer-review">{[['Business', draft.business, 0], ['Story lens', chosen?.title || '', 0], ['Hidden detail', draft.hiddenDetail, 1], ['Object & audience', `${draft.item} · ${draft.audience}`, 2], ['Look & action', `${draft.style} · ${draft.interaction}`, 2], ['Exact wording', draft.wording || 'No lettering', 2], ['Placement', draft.wording ? draft.placement : 'Not applicable', 2]].map(([label, value, editStep]) => <div key={String(label)}><dt>{label}</dt><dd className="preserve-wording">{value}</dd><button type="button" className="text-button" disabled={busy} onClick={() => go(Number(editStep))} aria-label={`Edit ${label}`}>Edit</button></div>)}</dl><div className="generation-note"><strong>This creates a visual concept.</strong><p>Design review and a physical prototype come next. It doesn’t place an order. RM100 is an indicative starting point per object; design and prototyping are separate.</p><p>Only submit information you’re happy to use in AI-assisted design. Your answers are included in the generation request.</p></div></>}
          <div className="journey-actions">{step > 0 && <button type="button" className="text-button" disabled={busy} onClick={() => go(step - 1)}>← Back</button>}{step < 3 ? <Button type="submit">{step === 2 ? 'Review my direction' : 'Continue'}<ArrowRight size={17} /></Button> : <Button type="button" disabled={busy} onClick={generate}>{busy ? <><LoaderCircle className="spin" />Creating your concept</> : <>Generate my concept<ArrowUpRight size={19} /></>}</Button>}</div>
        </form>{statusBlock}
      </section></div>
  </main>;
}
