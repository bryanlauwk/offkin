import { useRef, useState } from 'react';
import { ArrowUpRight, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const CONCEPT_PREVIEW_NOTE = 'Concept preview. Final design, functionality and pricing confirmed during the build proposal.';

/** A local request draft. No contact endpoint exists and no inquiry is transmitted. */
export default function BuildProposalRequest({ brief, disabled = false, hasPending = false }: { brief: string; disabled?: boolean; hasPending?: boolean }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [timing, setTiming] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [downloaded, setDownloaded] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  function download() {
    const content = ['OFFKIN — Quote & Build Proposal request draft', 'Status: local draft only. No recipient is configured and this request has not been sent.', CONCEPT_PREVIEW_NOTE,
      `Desired quantity: ${quantity.trim() || 'To discuss'}`, `Target timing: ${timing.trim() || 'To discuss'}`, `Budget direction (not an agreed price): ${budget.trim() || 'To discuss'}`, `Priorities and questions: ${notes.trim() || 'To discuss'}`,
      'Requested next step: assess the creative direction and propose a realistic scope, construction route, materials, mechanisms, prototype plan, timeline and quotation. This draft does not approve spending or place an order.', brief].join('\n\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'OFFKIN-quote-build-proposal-draft.txt'; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  }
  return <section className="op-build-request" aria-labelledby="op-build-request-title">
    <div><p className="op-eyebrow">FROM PREVIEW TO POSSIBILITY</p><h2 id="op-build-request-title">Make It LIVE</h2><p>Like the direction? Shape the realistic build around the idea.</p><p className="op-subtle">{CONCEPT_PREVIEW_NOTE}</p></div>
    <button ref={trigger} className="op-primary" disabled={disabled} onClick={() => { setDownloaded(false); setOpen(true); }}>Request a Quote &amp; Build Proposal<ArrowUpRight size={16} aria-hidden="true"/></button>
    <p className="op-subtle">Prepare a downloadable request draft. No inquiry is sent from this page.</p>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="op-dialog" onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}>
      <DialogHeader><DialogTitle>Request a Quote &amp; Build Proposal</DialogTitle><DialogDescription>Prepare your request on this device. A contact destination hasn’t been selected, so you can download the draft to share yourself. Nothing is sent automatically.</DialogDescription></DialogHeader>
      {hasPending && <p className="op-warning">Your preview has unfinished sections. The draft identifies what is ready and what still needs work.</p>}
      <div className="op-detail-grid">
        <label>Desired quantity <span>(optional)</span><input value={quantity} maxLength={120} onChange={event => { setQuantity(event.target.value); setDownloaded(false); }} placeholder="e.g. 50 gifts, or one special piece"/></label>
        <label>Target timing <span>(optional)</span><input value={timing} maxLength={120} onChange={event => { setTiming(event.target.value); setDownloaded(false); }} placeholder="A launch date or flexible"/></label>
        <label>Budget direction <span>(optional)</span><input value={budget} maxLength={160} onChange={event => { setBudget(event.target.value); setDownloaded(false); }} placeholder="Amount and currency, or to discuss"/></label>
        <label>What matters most? <span>(optional)</span><textarea value={notes} rows={3} maxLength={2000} onChange={event => { setNotes(event.target.value); setDownloaded(false); }} placeholder="Details to keep, proposed interaction, questions…"/></label>
      </div>
      <p className="op-subtle">Part counts, materials, tolerances, mechanisms, cost and production options are assessed during the build proposal. Engineering and prototype checks follow before production.</p>
      <button className="op-primary" onClick={download}><Download size={15} aria-hidden="true"/>Download request draft</button>
      {downloaded && <p role="status">Request draft downloaded. It has not been sent, and no order has been placed.</p>}
    </DialogContent></Dialog>
  </section>;
}
