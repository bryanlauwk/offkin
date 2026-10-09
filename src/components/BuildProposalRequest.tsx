import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CONCEPT_PREVIEW_NOTE, type ExportSnapshot } from '@/lib/proposal-export';
import type { PairedConcept } from '../../supabase/functions/generate-concept/paired-design';

type Fields = { buyerName: string; workEmail: string; company: string; quantity: string; timing: string; budget: string; priorities: string; websiteField: string };
const empty: Fields = { buyerName: '', workEmail: '', company: '', quantity: '', timing: '', budget: '', priorities: '', websiteField: '' };

export default function BuildProposalRequest({ brief, snapshot, pairedAssets, disabled = false, hasPending = false }: { brief: string; snapshot?: ExportSnapshot; pairedAssets?: [PairedConcept,PairedConcept]; disabled?: boolean; hasPending?: boolean }) {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const key = snapshot?.key || brief;
  useEffect(() => { setError(''); setReference(''); setOpen(false); }, [key]);
  const assets = useMemo(() => pairedAssets?.map(asset=>({stage:asset.role,id:asset.id,title:asset.title,brand:asset.brand,story:asset.story,website:asset.sourceUrl})) || snapshot?.stages.flatMap(item => item.asset ? [{ stage: item.stage, id: item.asset.id, title: item.asset.title, brand: item.asset.brand, story: item.asset.story, website: item.asset.sourceUrl }] : []) || [], [pairedAssets,snapshot]);
  const paired=Boolean(pairedAssets);
  const complete = (paired ? assets.length === 2 : assets.length === 4) && !hasPending;
  const brand = assets[0]?.brand || 'Your brand';
  const story = assets.find(asset => asset.stage === 'physical'||asset.stage==='collectible')?.story || assets[0]?.story || brief.slice(0, 6000);
  const website = assets.find(asset => asset.website)?.website || '';
  function update(name: keyof Fields, value: string) { setFields(current => ({ ...current, [name]: value })); setError(''); }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting || disabled || !complete) return;
    if (!fields.buyerName.trim() || !fields.company.trim() || !/^\S+@\S+\.\S+$/.test(fields.workEmail.trim())) { setError('Add your name, company and a valid work email.'); return; }
    setSubmitting(true); setError('');
    const { data, error: requestError } = await supabase.functions.invoke('proposal-request', { body: {
      ...fields, brandName: brand, website, conceptStory: story,
      assetIds: assets.map(asset => asset.id),
       conceptSummary: { title: assets.find(asset => asset.stage === 'physical'||asset.stage==='collectible')?.title || brand, stages: assets.map(asset => ({ stage: asset.stage, title: asset.title })) },
    } });
    setSubmitting(false);
    if (requestError || !data?.ok || typeof data.reference !== 'string') { setError(data?.error || 'Your request could not be saved. Nothing was submitted; please try again.'); return; }
    setReference(data.reference);
  }
  return <section className="op-build-request" aria-labelledby="op-build-request-title">
    <div><p className="op-eyebrow">NEXT / BUILD PROPOSAL</p><h2 id="op-build-request-title">Take the idea into the real world.</h2><p>Tell the studio what success looks like. We’ll review the concept, then scope materials, mechanisms, prototype, timing and price.</p></div>
    <Button ref={trigger} className="op-primary" disabled={disabled || !complete} onClick={() => { setError(''); setOpen(true); }}>Request a Quote &amp; Build Proposal<ArrowRight aria-hidden="true"/></Button>
    {!complete && <p className="op-subtle">Complete and restore the linked concept before requesting a build proposal.</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="op-dialog op-request-dialog" onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}>
      {reference ? <div className="op-request-success"><span><Check aria-hidden="true"/></span><DialogHeader><DialogTitle>Request saved for review.</DialogTitle><DialogDescription>Your request is in the OFFKIN review inbox. No order has been placed and no email was sent.</DialogDescription></DialogHeader><strong>{reference}</strong><p>Keep this reference for your conversation with the studio.</p><Button className="op-primary" onClick={() => setOpen(false)}>Done</Button></div> : <form onSubmit={submit}>
        <DialogHeader><DialogTitle>Request a Quote &amp; Build Proposal</DialogTitle><DialogDescription>Review the chosen concept, then leave your contact and project direction.</DialogDescription></DialogHeader>
        <div className="op-request-summary"><span>CHOSEN CONCEPT</span><strong>{brand}</strong><p>{story}</p>{website && <small>{website}</small>}<ol>{assets.map(asset => <li key={asset.id}><span>{asset.stage}</span><b>{asset.title}</b><code>{asset.id.slice(0, 8)}</code></li>)}</ol></div>
        {hasPending && <p className="op-warning">An unfinished revision is excluded. The accepted complete concept above will be submitted.</p>}
        <fieldset className="op-request-fields" disabled={submitting || disabled}>
          <label>Your name<input required autoComplete="name" maxLength={120} value={fields.buyerName} onChange={event => update('buyerName', event.target.value)}/></label>
          <label>Work email<input required type="email" autoComplete="email" maxLength={254} value={fields.workEmail} onChange={event => update('workEmail', event.target.value)}/></label>
          <label>Company<input required autoComplete="organization" maxLength={160} value={fields.company} onChange={event => update('company', event.target.value)}/></label>
          <label>Desired quantity <span>(optional)</span><input maxLength={120} value={fields.quantity} onChange={event => update('quantity', event.target.value)} placeholder="50 gifts or one special piece"/></label>
          <label>Target timing <span>(optional)</span><input maxLength={120} value={fields.timing} onChange={event => update('timing', event.target.value)} placeholder="Launch date or flexible"/></label>
          <label>Budget direction <span>(optional)</span><input maxLength={160} value={fields.budget} onChange={event => update('budget', event.target.value)} placeholder="Amount and currency, or to discuss"/></label>
          <label className="op-request-wide">Priorities and questions <span>(optional)</span><textarea rows={4} maxLength={2000} value={fields.priorities} onChange={event => update('priorities', event.target.value)} placeholder="What must the physical version preserve?"/></label>
          <label className="op-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={fields.websiteField} onChange={event => update('websiteField', event.target.value)}/></label>
        </fieldset>
        <p className="op-request-note">{CONCEPT_PREVIEW_NOTE} This request asks for review; it does not approve spending or place an order.</p>
        {error && <p className="op-request-error" role="alert">{error}</p>}
        <Button type="submit" className="op-primary" disabled={submitting || disabled || !complete}><Send aria-hidden="true"/>{submitting ? 'Saving request…' : 'Submit for studio review'}</Button>
      </form>}
    </DialogContent></Dialog>
  </section>;
}