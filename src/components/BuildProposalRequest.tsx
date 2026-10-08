import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { CONCEPT_PREVIEW_NOTE, prepareProposalRequest, type ExportSnapshot, type PreparedRequest } from '@/lib/proposal-export';

/** A local request draft. No contact endpoint exists and no inquiry is transmitted. */
export default function BuildProposalRequest({ brief, snapshot, disabled = false, hasPending = false }: { brief: string; snapshot?: ExportSnapshot; disabled?: boolean; hasPending?: boolean }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [timing, setTiming] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [downloaded, setDownloaded] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [prepared, setPrepared] = useState<PreparedRequest | null>(null);
  const [error, setError] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const operation = useRef<AbortController | null>(null);
  const currentKey = `${snapshot?.key || brief}:${disabled}`;
  const latestKey = useRef(currentKey); latestKey.current = currentKey;
  function cancel() { operation.current?.abort(); operation.current = null; setPreparing(false); }
  function clearResult() { setDownloaded(false); setPrepared(null); setError(''); }
  useEffect(() => { operation.current?.abort(); operation.current = null; setPreparing(false); setDownloaded(false); setPrepared(null); setError(''); }, [currentKey]);
  useEffect(() => () => { operation.current?.abort(); operation.current = null; }, []);
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
    clearResult(); const controller = new AbortController(); operation.current = controller; const key = currentKey; setPreparing(true);
    try {
      const result = await prepareProposalRequest(snapshot, brief, { quantity, timing, budget, notes }, controller.signal);
      if (controller.signal.aborted || operation.current !== controller || latestKey.current !== key) return;
      if (result.missing.length) setPrepared(result); else save(result);
    } catch {
      if (!controller.signal.aborted && operation.current === controller && latestKey.current === key) setError('The request file could not be prepared. Your saved proposal is unchanged. Try again.');
    } finally { if (operation.current === controller) { operation.current = null; setPreparing(false); } }
  }
  return <section className="op-build-request" aria-labelledby="op-build-request-title">
    <div><p className="op-eyebrow">FROM PREVIEW TO POSSIBILITY</p><h2 id="op-build-request-title">Make It LIVE</h2><p>Like the direction? Shape the realistic build around the idea.</p><p className="op-subtle">{CONCEPT_PREVIEW_NOTE}</p></div>
    <button ref={trigger} className="op-primary" disabled={disabled} onClick={() => { clearResult(); setOpen(true); }}>Request a Quote &amp; Build Proposal<ArrowUpRight size={16} aria-hidden="true"/></button>
    <p className="op-subtle">Prepare a downloadable request draft. No inquiry is sent from this page.</p>
    <Dialog open={open} onOpenChange={value => { if (!value) { cancel(); clearResult(); } setOpen(value); }}><DialogContent className="op-dialog" onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}>
      <DialogHeader><DialogTitle>Request a Quote &amp; Build Proposal</DialogTitle><DialogDescription>Prepare your request on this device. A contact destination hasn’t been selected, so you can download a self-contained HTML draft with the available concept images to share yourself. Nothing is sent automatically.</DialogDescription></DialogHeader>
      {hasPending && <p className="op-warning">Your preview has unfinished sections. The draft identifies what is ready and what still needs work.</p>}
      <fieldset className="op-detail-grid" disabled={preparing || disabled} style={{ border: 0, margin: 0, padding: 0 }}>
        <label>Desired quantity <span>(optional)</span><input value={quantity} maxLength={120} onChange={event => { setQuantity(event.target.value); clearResult(); }} placeholder="e.g. 50 gifts, or one special piece"/></label>
        <label>Target timing <span>(optional)</span><input value={timing} maxLength={120} onChange={event => { setTiming(event.target.value); clearResult(); }} placeholder="A launch date or flexible"/></label>
        <label>Budget direction <span>(optional)</span><input value={budget} maxLength={160} onChange={event => { setBudget(event.target.value); clearResult(); }} placeholder="Amount and currency, or to discuss"/></label>
        <label>What matters most? <span>(optional)</span><textarea value={notes} rows={3} maxLength={2000} onChange={event => { setNotes(event.target.value); clearResult(); }} placeholder="Details to keep, proposed interaction, questions…"/></label>
      </fieldset>
      <p className="op-subtle">The file includes the current displayed concept, original brief, selected story elements and your notes. Review it before sharing. Images are downloaded from their saved source only when you choose Download.</p>
      <p className="op-subtle">Part counts, materials, tolerances, mechanisms, cost and production options are assessed during the build proposal. Engineering and prototype checks follow before production.</p>
      <button className="op-primary" disabled={preparing || disabled} onClick={() => void download()}><Download size={15} aria-hidden="true"/>{preparing ? 'Preparing images…' : 'Download request draft'}</button>
      {preparing && <><p role="status">Preparing the current concept images for an offline file…</p><button className="op-secondary" onClick={cancel}>Cancel download</button></>}
      {prepared && <div className="op-warning" role="alert"><strong>Partial request: {prepared.embedded} of 4 images available.</strong><ul>{prepared.missing.map(reason => <li key={reason}>{reason}</li>)}</ul><p>Refresh saved images and try again, or explicitly download the incomplete file below. Missing visuals are labelled in the file.</p><button className="op-secondary" disabled={disabled} onClick={() => { try { save(prepared); } catch { setError('The file could not be downloaded. Try again.'); } }}>Download partial request draft</button></div>}
      {error && <p role="alert">{error}</p>}
      {downloaded && <p role="status">Request draft downloaded. It has not been sent, and no order has been placed.</p>}
    </DialogContent></Dialog>
  </section>;
}
