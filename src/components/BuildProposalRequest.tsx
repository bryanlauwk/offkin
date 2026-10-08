import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CONCEPT_PREVIEW_NOTE, prepareCollectibleImage, prepareProposalRequest, type ExportSnapshot, type PreparedRequest } from '@/lib/proposal-export';
import { enquiryWhatsAppMessage, enquiryWhatsAppUrl, OFFKIN_WHATSAPP_DISPLAY } from '@/lib/enquiry-handoff';
import { clearEnquiryDraft, emptyEnquiryDraft, ENQUIRY_LIMITS, readEnquiryDraft, saveEnquiryDraft, type EnquiryDraft } from '@/lib/enquiry-draft';

type Props = { brief: string; snapshot?: ExportSnapshot; disabled?: boolean; hasPending?: boolean; draftKey?: string; compact?: boolean; projectEntry?: boolean; inspiration?: string; initialContext?: { company?: string; story?: string; projectType?: EnquiryDraft['projectType'] } };

/** Local draft only. Adding a destination requires an explicitly approved sending flow. */
export default function BuildProposalRequest({ brief, snapshot, disabled = false, hasPending = false, draftKey = 'project', compact = false, projectEntry = false, inspiration = '', initialContext }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'idea' | 'details'>(projectEntry ? 'idea' : 'details');
  const [loaded] = useState(() => readEnquiryDraft(draftKey));
  const [draft, setDraft] = useState<EnquiryDraft>(loaded.draft);
  const [saved, setSaved] = useState(loaded.restored);
  const [storageError, setStorageError] = useState(loaded.unavailable);
  const [reviewWhatsApp, setReviewWhatsApp] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [heroDownloaded, setHeroDownloaded] = useState(false);
  const [preparingHero, setPreparingHero] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [prepared, setPrepared] = useState<PreparedRequest | null>(null);
  const [error, setError] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const whatsappHeading = useRef<HTMLHeadingElement>(null);
  const clearButton = useRef<HTMLButtonElement>(null);
  const clearTrigger = useRef<HTMLButtonElement>(null);
  const operation = useRef<AbortController | null>(null);
  const priorDraftKey = useRef(draftKey);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const currentKey = `${snapshot?.key || brief}:${disabled}:${draftKey}:${inspiration}:${JSON.stringify(draft)}`;
  const latestKey = useRef(currentKey); latestKey.current = currentKey;
  function cancel() { operation.current?.abort(); operation.current = null; setPreparing(false); }
  function clearResult() { setHeroDownloaded(false); setReviewWhatsApp(false); setDownloaded(false); setPrepared(null); setError(''); }
  useEffect(() => { operation.current?.abort(); operation.current = null; setPreparing(false); setHeroDownloaded(false); setDownloaded(false); setPrepared(null); setError(''); setReviewWhatsApp(false); setClearConfirm(false); }, [currentKey]);
  useEffect(() => {
    if (priorDraftKey.current === draftKey) return;
    priorDraftKey.current = draftKey;
    const next = readEnquiryDraft(draftKey);
    setDraft(next.draft); setSaved(next.restored); setStorageError(next.unavailable); setClearConfirm(false);
  }, [draftKey]);
  useEffect(() => () => { operation.current?.abort(); operation.current = null; }, []);
  function update(field: keyof EnquiryDraft, value: string) {
    const next = { ...draft, [field]: value.slice(0, ENQUIRY_LIMITS[field]) };
    setDraft(next); const stored = saveEnquiryDraft(draftKey, next); setSaved(stored); setStorageError(!stored); clearResult(); setClearConfirm(false);
  }
  function show() {
    const current = readEnquiryDraft(draftKey);
    const base = storageError ? draft : current.draft;
    const next = { ...base, company: base.company || initialContext?.company || '', story: base.story || initialContext?.story || '', inspiration: inspiration || base.inspiration, projectType: !current.restored && !storageError ? initialContext?.projectType || base.projectType : base.projectType };
    setDraft(next); setSaved(current.restored && !storageError); setStorageError(storageError || current.unavailable); setStep(projectEntry ? 'idea' : 'details'); setClearConfirm(false); clearResult(); setOpen(true);
  }
  function changeStep(next: 'idea' | 'details') { setStep(next); setClearConfirm(false); window.requestAnimationFrame(() => stepHeading.current?.focus()); }
  function saveAndClose() {
    const stored = saveEnquiryDraft(draftKey, draft); setSaved(stored); setStorageError(!stored);
    if (stored) { cancel(); clearResult(); setOpen(false); }
  }
  function save(result: PreparedRequest) {
    const url = URL.createObjectURL(new Blob([result.html], { type: 'text/html;charset=utf-8' }));
    try {
      const anchor = document.createElement('a'); anchor.href = url;
      anchor.download = `OFFKIN-quote-build-proposal-${result.missing.length ? 'partial-' : ''}draft.html`;
      anchor.click(); setDownloaded(true); setPrepared(null);
    } finally { window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
  }
  async function download() {
    if (operation.current || disabled) return;
    clearResult(); const controller = new AbortController(); operation.current = controller; const key = currentKey; setPreparingHero(false); setPreparing(true);
    try {
      const result = await prepareProposalRequest(snapshot, brief, draft, controller.signal, { textOnly: projectEntry });
      if (controller.signal.aborted || operation.current !== controller || latestKey.current !== key) return;
      // A no-preview enquiry is intentionally text-only; generated proposals still require explicit partial consent.
      if (result.missing.length) setPrepared(result); else save(result);
    } catch {
      if (!controller.signal.aborted && operation.current === controller && latestKey.current === key) setError('The request file could not be prepared. Your saved proposal is unchanged. Try again.');
    } finally { if (operation.current === controller) { operation.current = null; setPreparing(false); } }
  }
  async function downloadHero() {
    if (operation.current || disabled) return;
    clearResult(); const controller = new AbortController(); operation.current = controller; const key = currentKey;
    setPreparingHero(true); setPreparing(true);
    try {
      const result = await prepareCollectibleImage(snapshot, controller.signal);
      if(controller.signal.aborted || operation.current !== controller || latestKey.current !== key)return;
      const url=URL.createObjectURL(new Blob([new Uint8Array(result.bytes)],{type:result.mime}));
      try { const anchor=document.createElement('a');anchor.href=url;anchor.download=result.filename;anchor.click();setHeroDownloaded(true); }
      finally {window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
    }catch{if(!controller.signal.aborted&&operation.current===controller&&latestKey.current===key)setError('The collectible image could not be saved. Refresh saved images and try again, or continue to WhatsApp knowing no image is attached.');}
    finally{if(operation.current===controller){operation.current=null;setPreparing(false);setPreparingHero(false);}}
  }
  const hasHero = Boolean(snapshot?.stages.some(item=>item.stage==='physical'&&item.asset));
  const whatsappMessage = enquiryWhatsAppMessage(draft, Boolean(snapshot));
  const field = (key: keyof EnquiryDraft, label: string, placeholder: string, options: { multiline?: boolean; autoComplete?: string; hint?: string } = {}) => <label key={key} htmlFor={`${id}-${key}`}>{label} <span>(optional)</span>{options.multiline ? <textarea id={`${id}-${key}`} value={draft[key]} rows={3} maxLength={ENQUIRY_LIMITS[key]} onChange={event => update(key, event.target.value)} placeholder={placeholder} aria-describedby={options.hint ? `${id}-${key}-hint` : undefined} /> : <input id={`${id}-${key}`} value={draft[key]} maxLength={ENQUIRY_LIMITS[key]} onChange={event => update(key, event.target.value)} placeholder={placeholder} autoComplete={options.autoComplete} aria-describedby={options.hint ? `${id}-${key}-hint` : undefined} />}{options.hint && <small id={`${id}-${key}-hint`}>{options.hint}</small>}</label>;
  return <section className={compact ? 'op-enquiry-entry' : 'op-build-request'} aria-label={compact ? 'Plan your project' : undefined} aria-labelledby={compact ? undefined : `${id}-title`}>
    {!compact && <div><p className="op-eyebrow">FROM PREVIEW TO POSSIBILITY</p><h2 id={`${id}-title`}>Make It LIVE</h2><p>Like the direction? Shape the realistic build around the idea.</p><p className="op-subtle">{CONCEPT_PREVIEW_NOTE}</p></div>}
    <button ref={trigger} className="op-primary" disabled={disabled} onClick={show}>{projectEntry ? 'Plan my project' : 'Request a Quote & Build Proposal'}<ArrowUpRight size={16} aria-hidden="true"/></button>
    <p className="op-subtle">{projectEntry ? 'Prepare a project brief. No preview required.' : 'Your chosen concept and notes come with you.'} Draft first, then discuss on WhatsApp.</p>
    <Dialog open={open} onOpenChange={value => { if (!value) { cancel(); clearResult(); setClearConfirm(false); } setOpen(value); }}><DialogContent className="op-dialog op-enquiry-dialog" onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}>
      <DialogHeader><DialogTitle>{projectEntry ? 'Your project brief' : 'Your quote & build-proposal brief'}</DialogTitle><DialogDescription>Prepare your brief, then review a short enquiry for OFFKIN on WhatsApp. Download your brief to attach yourself. Nothing is sent automatically.</DialogDescription></DialogHeader>
      <p className="op-draft-state">Local draft · Not sent{saved && !storageError ? ' · Saved in this browser' : ''}</p>
      {hasPending && <p className="op-warning">Your preview has unfinished sections. The draft identifies what is ready and what still needs work.</p>}
      {snapshot && <div className="op-request-context"><strong>Your displayed concept is included</strong><p>The chosen revision, original brief, story selections and available images will be in your download. No need to describe them again.</p></div>}
      {draft.inspiration && <p className="op-subtle">Inspiration: {draft.inspiration}. This unofficial study is a reference only, not your brand or a generated customer result.</p>}
      <h3 ref={stepHeading} tabIndex={-1} className="op-enquiry-step">{step === 'idea' ? '1 / What do you have in mind?' : projectEntry ? '2 / Shape the next conversation' : 'Shape the next conversation'}</h3>
      <p className="op-subtle op-no-margin">All fields are optional. “Not sure yet” is a useful answer.</p>
      <fieldset className="op-request-fields" disabled={preparing || disabled}>
        {step === 'idea' ? <>
          <fieldset className="op-project-types"><legend>I’m exploring</legend>{['Corporate gifting', 'Personal commission', 'Not sure yet'].map(type => <label key={type}><input type="radio" name={`${id}-type`} checked={draft.projectType === type} onChange={() => update('projectType', type)} />{type}</label>)}</fieldset>
          {draft.projectType === 'Personal commission' && <p className="op-subtle">Tell us about your idea. One-off commissions and feasibility need to be confirmed; this is not an order.</p>}
          <div className="op-detail-grid op-request-idea">{field('company', draft.projectType === 'Personal commission' ? 'Project name' : 'Brand or company', 'Your brand or project name', { autoComplete: 'organization' })}{field('story', 'Your idea and who it is for', 'A launch gift for partners, a team milestone, a personal story…', { multiline: true })}</div>
        </> : <div className="op-detail-grid">
          {field('quantity', 'Desired quantity', 'e.g. 50 gifts, one special piece, or not sure')}
          {field('timing', 'Target timing', 'Ideal in-hands date or event date', { hint: 'An ideal date, not a confirmed delivery commitment.' })}
          {field('budget', 'Budget direction', 'e.g. MYR 10,000 total, or a per-piece range', { hint: 'Include currency and total / per piece. No price is agreed here.' })}
          {field('size', 'Size or display setting', 'A desk object, shelf piece, or dimensions if known')}
          {field('destination', 'Delivery country or city', 'Country / city only; no full address needed')}
          {field('name', 'Your name', 'How you would like to be addressed', { autoComplete: 'name' })}
          {field('contact', 'Preferred contact', 'Email or WhatsApp, if you want it in the draft', { hint: 'Stored locally and included in your download. No contact is made.' })}
          {field('notes', 'What matters most?', 'Details to keep, proposed interaction, priorities and questions…', { multiline: true })}
        </div>}
      </fieldset>
      {storageError && <p className="op-warning" role="alert">This browser could not save the draft. Keep this window open and download a copy before leaving. Your changes are still visible here.</p>}
      <div className="op-enquiry-actions">
        {step === 'idea' ? <button className="op-primary" disabled={disabled} onClick={() => changeStep('details')}>Continue to project details<ArrowRight size={16} aria-hidden="true"/></button> : <>
          <button className="op-secondary" disabled={preparing} onClick={() => changeStep('idea')}><ArrowLeft size={15} aria-hidden="true"/>{projectEntry ? 'Back to the idea' : 'Edit project idea'}</button>
          {hasHero&&<button className="op-primary" disabled={preparing||disabled} onClick={()=>void downloadHero()}><Download size={15} aria-hidden="true"/>{preparing&&preparingHero?'Preparing collectible image…':'Save collectible image'}</button>}<button className="op-primary" disabled={preparing || disabled} onClick={() => {setReviewWhatsApp(true);window.requestAnimationFrame(()=>whatsappHeading.current?.focus());}}>Review WhatsApp enquiry<ArrowUpRight size={16} aria-hidden="true"/></button><button className="op-secondary" disabled={preparing || disabled} onClick={() => void download()}><Download size={15} aria-hidden="true"/>{preparing&&!preparingHero ? 'Preparing full brief…' : 'Download full brief (HTML)'}</button>
        </>}
        <button className="op-secondary" disabled={preparing || disabled} onClick={saveAndClose}>Save &amp; close</button>
      </div>
      {reviewWhatsApp && step === 'details' && <section className="op-whatsapp-review" aria-label="Review your WhatsApp enquiry"><h3 ref={whatsappHeading} tabIndex={-1}>Discuss with OFFKIN</h3><p>Recipient: {OFFKIN_WHATSAPP_DISPLAY}. The message below includes your project, quantity, budget and timing. Opening WhatsApp shares this text with WhatsApp; you review and press Send there.</p><p className="op-whatsapp-message">{whatsappMessage}</p><a className="op-primary" href={enquiryWhatsAppUrl(whatsappMessage)} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Open WhatsApp with this message<ArrowUpRight size={16} aria-hidden="true"/></a><p>Images and files are not attached automatically. Save the collectible image above, then attach it in WhatsApp. The full HTML brief is an optional detailed attachment. We cannot confirm sending or receipt from this page.</p><p>If the app does not open, use WhatsApp Web or start a chat with {OFFKIN_WHATSAPP_DISPLAY} and copy the message above.</p></section>}
      {step === 'details' && <p className="op-subtle">{projectEntry ? 'The full HTML download is a text-only project brief, not a generated concept.' : 'For a simple phone handoff, save the collectible image and attach it in WhatsApp. The full HTML brief keeps all four available views, selections and detailed notes. Images are fetched only when you choose a save or download action.'} Review the file, including any contact details, before sharing. Design and prototyping are scoped separately from production; pricing, quantities and delivery are confirmed in the build proposal.</p>}
      {preparing && <><p role="status">{preparingHero?'Preparing the chosen collectible image…':'Preparing the current concept images for an offline file…'}</p><button className="op-secondary" onClick={cancel}>Cancel download</button></>}
      {prepared && <div className="op-warning" role="alert"><strong>Partial request: {prepared.embedded} of 4 images available.</strong><ul>{prepared.missing.map(reason => <li key={reason}>{reason}</li>)}</ul><p>Refresh saved images and try again, or explicitly download the incomplete file below. Missing visuals are labelled in the file.</p><button className="op-secondary" disabled={disabled} onClick={() => { try { save(prepared); } catch { setError('The file could not be downloaded. Try again.'); } }}>Download partial request draft</button></div>}
      {error && <p role="alert">{error}</p>}
      {heroDownloaded&&<p role="status">Image download started. Find it in your browser’s downloads or Files, then attach it in WhatsApp. It is not attached or sent automatically.</p>}
      {downloaded && <p role="status">Request draft downloaded. It has not been sent, and no order has been placed.</p>}
      <div className="op-draft-privacy"><p>Drafts stay in this browser, including on a shared device. Closing does not clear them.</p>{clearConfirm ? <div><p>Clear this enquiry’s fields from this browser? Your generated concept and downloaded files stay unchanged.</p><button ref={clearButton} className="op-secondary" disabled={preparing} onClick={() => { cancel(); const cleared = clearEnquiryDraft(draftKey); if (cleared) { setDraft(emptyEnquiryDraft()); setSaved(false); setStorageError(false); setClearConfirm(false); clearResult(); window.requestAnimationFrame(()=>clearTrigger.current?.focus()); } else setStorageError(true); }}>Clear draft now</button><button className="op-secondary" disabled={preparing} onClick={() => {setClearConfirm(false);window.requestAnimationFrame(()=>clearTrigger.current?.focus());}}>Keep draft</button></div> : <button ref={clearTrigger} disabled={preparing} onClick={() => {setClearConfirm(true);window.requestAnimationFrame(()=>clearButton.current?.focus());}}>Clear saved enquiry draft</button>}</div>
    </DialogContent></Dialog>
  </section>;
}
