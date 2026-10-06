import { useLocation } from 'react-router-dom';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Download, Globe2, Share2, LoaderCircle, Minus, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { loadBriefSession, saveBriefSession, clearBriefSession, decodeBriefHash, makeShareableBriefUrl, makeDesignBrief } from '@/lib/brief-handoff';
import { Button } from '@/components/ui/button';
import { BrandWorldShowcase } from '@/components/BrandWorldShowcase';
import { normalizeCompanyWebsite } from '@/lib/company-website';
import { requestConcept, supportsCoCreation, supportsElectronicStoryScenes, CO_CREATION_CONTRACT_VERSION, supportsSummaryOnly, WebsiteAddressError, type WebsiteEvidence } from '@/lib/concept-api';
import { emptyDraft, makeCreationContext, type CreationDraft } from '@/lib/creation-journey';
import { angleEvidence, getStoryAngle, storyAngles } from '@/lib/story-angles';
import type { CollectibleConcept } from '@/lib/collectible-brief';

const steps = ['Find a story', 'Go one layer deeper', 'Shape the object', 'Review & create'];

export function CreationConversation({ initialDraft, navigationKey, onGenerated, onExit, directionMissing = false }: { initialDraft?: CreationDraft; directionMissing?: boolean; navigationKey: string; onGenerated: (concept: CollectibleConcept, draft: CreationDraft) => void; onExit?: () => void }) {
  const location = useLocation();
  const isRefining = Boolean(initialDraft);
  const [savedSession, setSavedSession] = useState(() => initialDraft ? undefined : loadBriefSession());
  const [importedDraft, setImportedDraft] = useState(() => initialDraft ? undefined : decodeBriefHash(window.location.hash));
  const [importReview, setImportReview] = useState(false);
  const [shareReview, setShareReview] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [draft, setDraft] = useState<CreationDraft>(initialDraft || { ...emptyDraft });
  const [started, setStarted] = useState(Boolean(initialDraft));
  const [step, setStep] = useState(0);
  const [evidence, setEvidence] = useState<WebsiteEvidence | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [showProcess, setShowProcess] = useState(false);
  const [generationState, setGenerationState] = useState<'unchecked' | 'checking' | 'available' | 'brief'>('unchecked');
  const active = useRef<AbortController | null>(null);
  const latest = useRef(0);
  const question = useRef<HTMLHeadingElement>(null);
  const importTrigger = useRef<HTMLButtonElement>(null);
  const shareTrigger = useRef<HTMLButtonElement>(null);
  const cancelActive = useCallback(() => { latest.current++; active.current?.abort(); active.current = null; }, []);
  useEffect(() => { setBusy(false); setStatus(''); setShareReview(false); setImportReview(false); setImportedDraft(isRefining ? undefined : decodeBriefHash(location.hash)); return cancelActive; }, [navigationKey, location.key, location.hash, isRefining, cancelActive]);
  useEffect(() => { if (started && !busy) question.current?.focus(); }, [step, started, busy]);
  useEffect(() => {
    if (!started || step !== 3) { setGenerationState('unchecked'); return; }
    const controller = new AbortController();
    setGenerationState('checking');
    const timer = window.setTimeout(() => { controller.abort(); setGenerationState('brief'); }, 10000);
    (draft.mode === 'electronic' ? supportsElectronicStoryScenes(controller.signal) : supportsCoCreation(controller.signal)).then(available => {
      clearTimeout(timer);
      if (!controller.signal.aborted) setGenerationState(available ? 'available' : 'brief');
    });
    return () => { clearTimeout(timer); controller.abort(); };
  }, [draft.mode, started, step, navigationKey]);
  useEffect(() => {
    if (started) setStorageWarning(!saveBriefSession({ draft, step, started }));
  }, [draft, step, started]);
  function saveBrief() {
    const url = URL.createObjectURL(new Blob([makeDesignBrief(draft)], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'offkin-creative-direction.txt'; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('Your brief has been downloaded. It has not been sent and does not place an order.');
  }
  function startWithoutWebsite() { cancelActive(); setDraft({ ...emptyDraft, summaryOnly: true }); setEvidence(null); setStarted(true); setStep(0); setStatus(''); }
  function resume() { if (!savedSession) return; cancelActive(); setBusy(false); setEvidence(null); setDraft(savedSession.draft); setStep(savedSession.step); setStarted(true); setStatus('Your device-local brief is restored. Website evidence is not re-fetched automatically.'); }
  function acceptImport() { if (!importedDraft) return; cancelActive(); setBusy(false); setDraft({ ...importedDraft, summaryOnly: true }); setEvidence(null); setStep(0); setStarted(true); setImportReview(false); setImportedDraft(undefined); setStatus('Shared direction copied. Review its facts and make it your own.'); window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search); }
  async function copyBrief() {
    try { await navigator.clipboard.writeText(makeShareableBriefUrl(draft, window.location.origin + window.location.pathname)); setShareReview(false); setStatus('Brief link copied. It includes every answer shown in the review. Anyone with the link can read or remix that copy; edits are not synced.'); }
    catch { setStatus('The link could not be copied. Download the brief instead.'); }
  }
  const update = <K extends keyof CreationDraft>(key: K, value: CreationDraft[K]) => setDraft(previous => ({ ...previous, [key]: value }));
  function stop() { cancelActive(); setBusy(false); setStatus('Stopped waiting. Your answers are still here. A creation already started may still finish.'); }
  function reset() { clearBriefSession(); setSavedSession(undefined); cancelActive(); setBusy(false); setStarted(false); setStep(0); setEvidence(null); setDraft(previous => ({ ...emptyDraft, website: previous.website })); setStatus(''); }
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
    setDraft({ ...emptyDraft, website, summaryOnly: !found });
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
    if (generationState !== 'available') { setStatus('The updated image service is not available yet. You can download or share your complete brief.'); return; }
    let context: string;
    const site = normalizeCompanyWebsite(draft.website); const noSite = !draft.website.trim() && draft.summaryOnly;
    try { if (!draft.angle || !draft.hiddenDetail.trim()) { setStep(!draft.angle ? 0 : 1); throw new Error('Choose a story lens and add your inside detail first.'); } if (!site && !noSite) { setStep(0); throw new Error('Add your company website before creating a concept.'); } context = makeCreationContext(draft); } catch (error) { setStatus((error as Error).message); return; }
    const controller = new AbortController(); active.current = controller; const attempt = ++latest.current;
    setBusy(true); setStatus('Making your first visual concept. This can take a few minutes.');
    const timer = window.setTimeout(() => controller.abort(), 220000);
    try {
      const data = await requestConcept({ brand: site || 'no-website', context, summaryOnly: noSite || draft.summaryOnly, contractVersion: CO_CREATION_CONTRACT_VERSION, edition: draft.mode === 'electronic' ? 'inside' : draft.interaction === 'Display only' ? 'icon' : 'inside', format: 'miniature' }, controller.signal);
      if (attempt !== latest.current) return;
      if (controller.signal.aborted) throw new Error('Creation timed out.');
      if (data.concept) { clearBriefSession(); onGenerated(data.concept, draft); return; }
      if (data.needsContext) { setStep(0); setStatus('Add one specific product or process to your business description.'); }
      else setStatus('We couldn’t finish your concept. Your answers are still here. Please try again.');
    } catch {
      if (attempt === latest.current) setStatus(controller.signal.aborted ? 'This is taking longer than expected. Your answers are still here. Please try again.' : 'We couldn’t finish your concept. Your answers are still here. Please try again.');
    } finally { clearTimeout(timer); if (attempt === latest.current) { active.current = null; setBusy(false); } }
  }
  const chips = <T extends string>(values: readonly T[], selected: T, choose: (value: T) => void) => <div className="choice-chips">{values.map(value => <button type="button" key={value} aria-pressed={selected === value} className={selected === value ? 'is-selected' : ''} onClick={() => choose(value)} disabled={busy}>{value}{selected === value && <Check size={14} aria-hidden="true" />}</button>)}</div>;
  const sources = angleEvidence(evidence, draft.business);
  const chosen = getStoryAngle(draft.angle);
  const statusBlock = <div className="creation-status" role="status" aria-live="polite">{busy && <LoaderCircle className="spin" size={16} aria-hidden="true" />}{status}{busy && <button type="button" className="text-button" onClick={stop}>Stop waiting</button>}</div>;
  return !started ? <main id="main-content" className="creation-home commercial-home">
    <section className="commercial-hero" aria-labelledby="creation-title">
      <div className="commercial-intro"><p className="eyebrow"><span className="studio-dot" /> ART × TECHNOLOGY × YOUR BRAND</p>
        <h1 id="creation-title">Your business DNA.<br />{' '}<span>Made collectible.</span><span className="headline-spark" aria-hidden="true">✳</span></h1>
        <p className="commercial-deck">Your world is anything<br />but ordinary. <em>Let’s show it.</em></p>
        <p className="commercial-copy">We turn what makes a business different into curious physical worlds. Part art object. Part story. A little unexpected, and unmistakably yours.</p>
        <div className="co-create-entry" id="co-create"><p className="micro-label">LET’S MAKE SOMETHING ONLY YOU COULD MAKE</p><form onSubmit={start} className="website-composer" aria-busy={busy}><label htmlFor="brand">START WITH YOUR WEBSITE</label><div className="website-input"><Globe2 size={19} aria-hidden="true" /><input id="brand" placeholder="your-business.com" value={draft.website} onChange={e => update('website', e.target.value)} required maxLength={300} autoComplete="url" inputMode="url" disabled={busy} /><button type="submit" disabled={busy} aria-label={busy ? 'Reading website' : 'Explore my business'}>{busy ? <LoaderCircle className="spin" size={20} /> : <ArrowUpRight size={25} />}</button></div></form>{storageWarning && <p className="notice">This browser could not save your progress. Keep this page open and download your brief before leaving.</p>}{statusBlock}<div className="entry-bottom"><p>Find your story. Add your point of view.<br />Co-create a direction worth holding.</p><button type="button" className="text-button" onClick={startWithoutWebsite} disabled={busy}>Start without a website ↗</button></div></div>
        {savedSession && <div className="resume-note"><span>You have an unfinished brief on this device.</span><button type="button" className="text-button" onClick={resume} disabled={busy}>Resume my brief →</button></div>}
        {importedDraft && <div className="resume-note"><span>Someone shared a creative direction with you.</span><button type="button" className="text-button" ref={importTrigger} onClick={() => setImportReview(true)} disabled={busy}>Review shared brief →</button></div>}
        <p className="no-pressure">No account needed to shape a brief. No order is placed.</p>
      </div><BrandWorldShowcase />
    </section>
    <section className="world-manifesto" aria-labelledby="manifesto-title"><p className="micro-label">THE OFFKIN WAY</p><h2 id="manifesto-title">Less ordinary.<br /><span>More <i>you.</i></span></h2><div><p>Not every brand lives in the same little box.</p><p>A cinematic machine. An impossible landscape. A familiar ritual turned slightly strange. The story chooses the form. You help choose where it goes.</p><a href="#co-create" className="manifesto-link">Find your starting point <ArrowUpRight size={19} /></a></div><span aria-hidden="true" className="manifesto-orbit">↗</span></section>
    <section className="co-create-process" aria-labelledby="process-title"><div className="section-heading"><p className="micro-label">YOU BRING THE INSIDE STORY. WE SHAPE THE POSSIBILITY.</p><h2 id="process-title">Make it <em>with us.</em></h2></div><div className="process-grid"><article><span className="process-number">01 ↘</span><h3>Find the spark</h3><p>Start with your public website or a description. Separate what’s known from the story angles we could explore.</p></article><article><span className="process-number">02 ✳</span><h3>Put yourself in it</h3><p>Choose a story, a visual language and a meaningful interaction. Add the detail no website could tell us.</p></article><article><span className="process-number">03 ↗</span><h3>Shape what comes next</h3><p>Review your living brief, share a copy for feedback, then choose whether to generate a concept. Refine the direction before a physical sample.</p></article></div></section>
    <section className="commercial-uses"><p className="micro-label">MADE FOR A REASON</p><div><span>Brand launches ↗</span><span>Gifts with a story ↗</span><span>Community keepsakes ↗</span><span>Experiences worth keeping ↗</span></div></section>
    <section className="prototype-band"><div><p className="micro-label">FROM CURIOUS IDEA TO PHYSICAL OBJECT</p><h2>Big imagination.<br /><em>Real-world questions.</em></h2></div><div><p>Size follows the story, experience and print cost. We keep one main scene and at most one or two meaningful mechanical actions, with reusable internals where they make sense.</p><p>Initial samples are outsourced to test the experience and cost. Materials, mechanics and any electronics need review before production.</p><button type="button" className="process-toggle" aria-expanded={showProcess} aria-controls="studio-process" onClick={() => setShowProcess(value => !value)}>How it takes shape{showProcess ? <Minus size={17} /> : <Plus size={17} />}</button>{showProcess && <div id="studio-process"><p>You approve the direction before AI creates a visual concept. We reuse bases, connectors and selected mechanisms, then outsource a few printed samples to test the experience and cost before production.</p><p>Exploring RM100–500 budgets is a starting question, not a quote or price guarantee. Design, sample work, electronics and production are scoped separately.</p></div>}</div></section>
    <footer className="commercial-footer"><span>OFFKIN｜异趣伙伴</span><p>A different kind of brand companion.</p><a href="#co-create">Co-create your world <ArrowUpRight size={16} /></a></footer>
    <Dialog open={importReview} onOpenChange={setImportReview}><DialogContent className="brief-modal" onCloseAutoFocus={event => { event.preventDefault(); (importTrigger.current || question.current)?.focus(); }}><DialogHeader><DialogTitle>Review this shared direction</DialogTitle><DialogDescription>This is a copy, not a live shared workspace. Importing won’t contact its website or generate an image. Review all details before using them.</DialogDescription></DialogHeader><pre>{importedDraft ? makeDesignBrief(importedDraft) : ''}</pre><Button type="button" onClick={acceptImport}>Use as my starting point</Button></DialogContent></Dialog>
  </main> : <main id="main-content" className="journey-page">
    <div className="journey-top"><button type="button" className="text-button" onClick={onExit || reset}>← {onExit ? 'Back to your concept' : 'Change website'}</button><span className="journey-source">{draft.website || 'Your story'}</span></div>
    <ol className="journey-progress" aria-label="Creation progress">{steps.map((label, index) => <li key={label} className={index === step ? 'is-current' : index < step ? 'is-done' : ''}><button type="button" disabled={index > step || busy} onClick={() => go(index)} aria-current={index === step ? 'step' : undefined}><span>{index < step ? <Check size={14} /> : `0${index + 1}`}</span>{label}</button></li>)}</ol>
    <div className="journey-body"><aside className="journey-aside"><p className="eyebrow">A STORY WORTH HOLDING</p><p className="aside-large">{step === 0 ? <>Look closer.<br /><em>There’s a story.</em></> : step === 1 ? <>Small detail.<br /><em>Big difference.</em></> : step === 2 ? <>Give the idea<br /><em>some shape.</em></> : <>Your point<br /><em>of view.</em></>}</p><span className="aside-mark" aria-hidden="true">↘</span>{chosen && <div className="selected-lens"><span>YOUR CHOSEN LENS</span><strong>{chosen.title}</strong><p>{chosen.question}</p></div>}<div className="live-brief"><span className="micro-label">YOUR LIVING BRIEF</span><p>{draft.business || 'A business with a story to tell'}</p><p>{draft.hiddenDetail || 'Your inside detail goes here'}</p><span>{draft.style} · {draft.item}</span></div><p className="aside-note">Saved on this device when browser storage is available. Your answers stay editable. Generation starts only when you choose it.</p></aside>
      <section className="journey-content" aria-busy={busy}><p className="eyebrow">0{step + 1} / {steps[step].toUpperCase()}</p><h1 tabIndex={-1} ref={question}>{['Which story deserves a closer look?', 'What do customers not know that you do every day?', 'What kind of world should the story become?', 'Your world. A very specific story.'][step]}</h1>
        {directionMissing && <p className="notice">Your earlier design details aren’t saved on this device. Add the story and exact wording again to make a new version.</p>}
        <form onSubmit={next} className="direction-form">
          {step === 0 && <>{evidence ? <details className="source-evidence"><summary><Globe2 size={15} />Text from {evidence.title || 'your website'}<Plus size={15} /></summary><p>{evidence.excerpt.slice(0, 1400)}</p><a href={evidence.url} target="_blank" rel="noopener noreferrer">Open public source ↗</a></details> : <p className="notice">{initialDraft ? 'Continue with your saved direction. You can change any detail.' : 'We couldn’t read enough from this website. Start with a short description and your own knowledge instead.'}</p>}
            <label htmlFor="business">In one line, what does the business do?</label><input id="business" maxLength={500} value={draft.business} onChange={e => update('business', e.target.value)} required placeholder="We make personalised gifts and pack each order by hand." />
            <p className="field-note">These are editorial prompts to explore, not AI findings or verified claims about your business.</p>
            <fieldset className="angle-list"><legend className="sr">Choose a story lens</legend>{storyAngles.map((angle, index) => <label key={angle.id} className={`angle-card ${draft.angle === angle.id ? 'is-selected' : ''}`}><input type="radio" name="angle" value={angle.id} checked={draft.angle === angle.id} onChange={() => update('angle', angle.id)} /><span className="angle-number">0{index + 1}</span><span className="angle-copy"><span className="eyebrow">{angle.label}</span><strong>{angle.title}</strong><span>{angle.question}</span><span className="angle-object">{angle.object}</span>{sources[index] && <span className="angle-evidence">{evidence ? 'Source detail' : 'Your description'}: “{sources[index]}”</span>}</span><span className="angle-check" aria-hidden="true">{draft.angle === angle.id ? <Check size={15} /> : <ArrowUpRight size={17} />}</span></label>)}</fieldset></>}
          {step === 1 && <><p className="question-description">The careful check. The small ritual. The part that happens before anyone sees the result. This is where the idea becomes yours.</p><label htmlFor="hidden-detail">The detail only you know</label><textarea id="hidden-detail" maxLength={500} value={draft.hiddenDetail} onChange={e => update('hiddenDetail', e.target.value)} required placeholder="Every gift is placed back in its box three times until the reveal feels right." /><p className="field-note">One real detail, up to 500 characters. Avoid private or confidential information.</p><div className="direction-callout"><span>THE STORY TO EXPLORE</span><p>{chosen?.question}</p><p>{chosen?.object}</p></div></>}
          {step === 2 && <><fieldset><legend>Creative direction</legend><div className="choice-chips">{([{ value: 'mechanical', label: 'Physical story object' }, { value: 'electronic', label: 'Electronic story scene (concept study)' }] as const).map(mode => <button type="button" key={mode.value} className={draft.mode === mode.value ? 'is-selected' : ''} aria-pressed={draft.mode === mode.value} onClick={() => update('mode', mode.value)}>{mode.label}{draft.mode === mode.value && <Check size={14} aria-hidden="true" />}</button>)}</div></fieldset>{draft.mode === 'electronic' && <div className="direction-callout"><span>AN ELECTRONIC CONCEPT STUDY</span><p>Explore a simple powered response only if it adds to your chosen story: light, a display, or a bounded interactive response. Electronics are optional; the physical idea comes first.</p><p>Hardware, software, content and safety need prototype validation. Electronic development and production are quoted separately.</p></div>}<fieldset><legend>The object</legend>{chips(['Sculptural story world', 'Mechanical story object', 'Scene in a frame', 'Small diorama', 'Miniature workstation'] as const, draft.item, value => update('item', value))}<p className="field-note">The story chooses the form. Size follows the experience and print cost, with dimensions confirmed during design review.</p></fieldset><fieldset><legend>Visual direction</legend>{chips(['Illustrated & surreal', 'Cinematic & atmospheric', 'Bold & graphic', 'Playful & sculptural', 'Minimal & architectural', 'Realistic & refined'] as const, draft.style, value => update('style', value))}</fieldset><fieldset><legend>Who will keep it?</legend>{chips(['Clients & partners', 'Your team', 'Customers & fans'], draft.audience, value => update('audience', value))}<label htmlFor="audience" className="sr">Audience</label><input id="audience" maxLength={100} value={draft.audience} onChange={e => update('audience', e.target.value)} required /></fieldset><fieldset><legend>A meaningful interaction</legend>{chips(['A meaningful click', 'Turn to reveal', 'Slide to discover', 'Display only'] as const, draft.interaction, value => update('interaction', value))}<p className="field-note">Up to one or two meaningful mechanical actions. Add motion only when it serves the story; display-only stays still. Prototypes must validate the mechanism.</p></fieldset><label htmlFor="scale">Scale or display setting</label><input id="scale" maxLength={120} value={draft.scale || 'Let the story decide'} onChange={e => update('scale', e.target.value)} /><label htmlFor="identifiers">Recognisable brand details <span>(optional)</span></label><textarea id="identifiers" maxLength={300} value={draft.brandIdentifiers || ''} onChange={e => update('brandIdentifiers', e.target.value)} placeholder="A signature colour, a familiar shape, a material or a symbol that belongs in the story." /><p className="field-note">Describe references you are authorised to use. This form does not upload logo artwork; generated marks and lettering still require proofing.</p><label htmlFor="wording">Exact wording <span>(optional)</span></label><textarea id="wording" rows={2} maxLength={200} value={draft.wording} onChange={e => update('wording', e.target.value)} placeholder="Leave blank for no lettering." /><p className="field-note">We keep what you type, including spacing and punctuation. Rendered text still needs artwork proofing.</p><fieldset><legend>Where should the words appear?</legend>{chips(['On the base', 'On a sign', 'On the object', 'Designer recommendation'] as const, draft.placement, value => update('placement', value))}</fieldset></>}
          {step === 3 && <><dl className="answer-review">{[['Direction', draft.mode === 'electronic' ? 'Electronic story scene (concept study)' : 'Physical story object', 2], ['Business', draft.business, 0], ['Story lens', chosen?.title || '', 0], ['Hidden detail', draft.hiddenDetail, 1], ['Object & audience', `${draft.item} · ${draft.audience}`, 2], ['Look & action', `${draft.style} · ${draft.interaction}`, 2], ['Scale', draft.scale || 'Let the story decide', 2], ['Brand details', draft.brandIdentifiers || 'Let the story lead', 2], ['Exact wording', draft.wording || 'No lettering', 2], ['Placement', draft.wording ? draft.placement : 'Not applicable', 2]].map(([label, value, editStep]) => <div key={String(label)}><dt>{label}</dt><dd className="preserve-wording">{value}</dd><button type="button" className="text-button" disabled={busy} onClick={() => go(Number(editStep))} aria-label={`Edit ${label}`}>Edit</button></div>)}</dl><div className="generation-note"><strong>{draft.mode === 'electronic' ? 'An electronic concept study to scope and prototype.' : 'This creates a visual concept.'}</strong><p>Design review and a physical prototype come next. It doesn’t place an order. We’re exploring what RM100–500 budgets can support. A few outsourced samples and print quotes must establish the specifications and cost; this is not a fixed price or a promise that every design fits. Design and electronics are scoped separately.</p><p role="status">{generationState === 'checking' || generationState === 'unchecked' ? 'Checking the updated image service…' : generationState === 'available' ? 'The updated image service is available. Generation only starts when you choose Generate my concept.' : 'The updated image service is not available yet. Your complete brief can still be downloaded, shared and refined here.'}</p><p>Only submit information you’re happy to use in AI-assisted design. Your answers are included in the generation request.</p></div></>}
          <div className="journey-actions">{step > 0 && <button type="button" className="text-button" disabled={busy} onClick={() => go(step - 1)}>← Back</button>}{step < 3 ? <Button type="submit" disabled={busy}>{step === 2 ? 'Review my direction' : 'Continue'}<ArrowRight size={17} /></Button> : <Button type="button" disabled={busy || generationState !== 'available'} onClick={generate}>{busy ? <><LoaderCircle className="spin" />Creating your concept</> : <>Generate my concept<ArrowUpRight size={19} /></>}</Button>}</div>
          {step === 3 && <div className="brief-handoff-actions"><Button type="button" variant="outline" onClick={saveBrief}><Download size={16} />Download creative brief</Button><Button type="button" variant="outline" ref={shareTrigger} onClick={() => setShareReview(true)}><Share2 size={16} />Review & share a copy</Button><p>A downloaded brief is ready for a prototype conversation. It isn’t an order or quotation.</p></div>}

        </form>{storageWarning && <p className="notice">This browser could not save your progress. Keep this page open and download your brief before leaving.</p>}{statusBlock}
      </section></div>
    <Dialog open={shareReview} onOpenChange={setShareReview}><DialogContent className="brief-modal" onCloseAutoFocus={event => { event.preventDefault(); shareTrigger.current?.focus(); }}><DialogHeader><DialogTitle>Review before sharing</DialogTitle><DialogDescription>The link will contain every answer below, including your website and inside detail. Anyone with it can read or remix the copy. Remove private or confidential information first. There is no live collaboration or access control on the link.</DialogDescription></DialogHeader><pre>{makeDesignBrief(draft)}</pre><Button type="button" onClick={copyBrief}>Copy link with these details</Button><button type="button" className="text-button" onClick={() => setShareReview(false)}>Keep editing</button></DialogContent></Dialog>
  </main>;
}

