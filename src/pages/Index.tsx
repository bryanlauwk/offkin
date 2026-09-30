import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, LoaderCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreationConversation } from '@/components/CreationConversation';
import { supabase } from '@/integrations/supabase/client';
import type { CollectibleConcept } from '@/lib/collectible-brief';
import { requestConcept } from '@/lib/concept-api';
import { emptyDraft, loadCreationDraft, saveCreationDraft, type CreationDraft } from '@/lib/creation-journey';
import './brick-gifts.css';

type SiteSettings = { logoUrl: string; logoLink: string; siteTitle: string };
const defaultSettings: SiteSettings = { logoUrl: '', logoLink: '/', siteTitle: 'DIORAMINI' };
export default function Index() {
  const [params, setParams] = useSearchParams();
  const [generated, setGenerated] = useState<CollectibleConcept | null>(null);
  const [draft, setDraft] = useState<CreationDraft>();
  const [settings, setSettings] = useState(defaultSettings);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const request = useRef<AbortController | null>(null);
  const conceptId = params.get('concept');
  const selected = conceptId && generated?.id === conceptId ? generated : undefined;
  useEffect(() => {
    let active = true;
    supabase.from('site_settings').select('key, value').then(({ data }) => {
      if (!active || !data) return;
      const next = { ...defaultSettings };
      data.forEach(setting => {
        if (setting.key === 'logo_url') next.logoUrl = setting.value || '';
        if (setting.key === 'logo_link') next.logoLink = !setting.value || setting.value === 'https://example.com' ? '/' : setting.value;
        if (setting.key === 'site_title') next.siteTitle = !setting.value || ['briq2.0', 'briq', 'form.', 'brandkin', 'stive', 'the absurd marshmallow test'].includes(setting.value.trim().toLowerCase()) ? defaultSettings.siteTitle : setting.value;
      }); setSettings(next);
    }); return () => { active = false; };
  }, []);
  useEffect(() => {
    document.title = selected ? `${selected.title} — ${settings.siteTitle}` : `${settings.siteTitle} — Your business DNA. Made collectible.`;
    setImageFailed(false); setShareStatus(''); window.scrollTo(0, 0);
  }, [selected, settings.siteTitle]);
  useEffect(() => { setEditing(false); setStatus(''); if (generated?.id !== conceptId) setDraft(conceptId ? loadCreationDraft(conceptId) : undefined); }, [conceptId, generated?.id]);
  useEffect(() => {
    if (!conceptId || generated?.id === conceptId) return;
    const controller = new AbortController(); request.current = controller; setBusy(true); setStatus('Opening your miniature…');
    const timer = window.setTimeout(() => controller.abort(), 30000);
    requestConcept({ id: conceptId }, controller.signal).then(data => {
      if (controller.signal.aborted) return;
      if (!data.concept) throw new Error('This concept could not be found.');
      setBusy(false); setGenerated(data.concept); setStatus('');
    }).catch(() => { if (!controller.signal.aborted) setStatus('We couldn’t open this concept. Please try again.'); })
      .finally(() => { clearTimeout(timer); if (request.current === controller) { setBusy(false); if (controller.signal.aborted) setStatus('This is taking longer than expected. Please try again.'); } });
    return () => { request.current = null; clearTimeout(timer); controller.abort(); };
  }, [conceptId, generated?.id, loadAttempt]);
  function createAnother() { request.current?.abort(); setBusy(false); setStatus(''); setEditing(false); setDraft(undefined); setParams({}); }
  function download() {
    if (!selected) return;
    const text = [`${selected.brand} — ${selected.title}`, selected.story, selected.interaction || '', ...(draft ? [`Business story: ${draft.business}`, `Object: ${draft.item}`, `Audience: ${draft.audience}`, `Exact wording: ${JSON.stringify(draft.wording)}`, `Placement: ${draft.placement}`, `Style: ${draft.style}`, `Interaction: ${draft.interaction}`] : []), ...(selected.sourceUrl ? [`Website: ${selected.sourceUrl}`] : []), 'Visual concept. Artwork and lettering are confirmed before production. Final design, construction and pricing follow design review and a physical sample.', 'From RM100 per piece. Design fees are separate.'].filter(Boolean).join('\n\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${selected.id}-my-miniature.txt`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function share() { try { await navigator.clipboard.writeText(window.location.href); setShareStatus('Your concept link is copied.'); } catch { setShareStatus('You can copy the link from your address bar.'); } }
  return <div className="brick-studio"><a className="skip-link" href="#main-content">Skip to content</a><header className="studio-header"><a className="studio-logo" href={settings.logoLink || '/'} aria-label={`${settings.siteTitle} home`}>{settings.logoUrl ? <img src={settings.logoUrl} alt={settings.siteTitle} /> : <><span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span><span>{settings.siteTitle}</span></>}</a><span className="header-caption">THE COLLECTIBLE DESIGN STUDIO</span></header>
    {conceptId && !selected ? <main id="main-content" className="conversation-page"><h1>Your miniature</h1><p role="status">{busy && <LoaderCircle className="spin" aria-hidden="true" />}{status}</p><div className="chat-actions">{!busy && <Button onClick={() => setLoadAttempt(value => value + 1)}>Try loading again</Button>}<Button variant="ghost" onClick={createAnother}>Start a new story</Button></div></main> : !selected || editing ? <CreationConversation key={editing ? `refine-${conceptId}` : 'create'} initialDraft={editing ? draft || { ...emptyDraft, website: selected?.sourceUrl || '', business: '', summaryOnly: true } : undefined} directionMissing={editing && !draft} navigationKey={params.toString()} onExit={editing ? () => setEditing(false) : undefined} onGenerated={(concept, answers) => { saveCreationDraft(concept.id, answers); setGenerated(concept); setDraft(answers); setEditing(false); setParams({ concept: concept.id }); }} /> : <main id="main-content" className="result-page"><Button variant="ghost" className="back-link" onClick={createAnother}>← Start a new story</Button><section className="result-shell" aria-labelledby="concept-title"><div className="concept-story"><p className="result-kicker">YOUR FIRST LOOK</p><p className="brand-name">{selected.brand}</p><h1 id="concept-title">{selected.title}</h1><section className="business-dna" aria-labelledby="business-dna-title"><h2 id="business-dna-title">Your business, in miniature</h2><p className="concept-copy">{selected.story}</p>{selected.sourceUrl && /^https?:\/\//i.test(selected.sourceUrl) && <p className="source-note">Inspired by <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">{selected.sourceTitle || 'your website'}</a> and your direction.</p>}</section>{selected.interaction && <div className="interaction-card"><span>A small moment to enjoy</span><p>{selected.interaction}</p></div>}<div className="result-actions"><Button onClick={() => setEditing(true)}>Let’s refine it<ArrowIcon /></Button><Button variant="outline" onClick={download}><Download aria-hidden="true" />Save my concept</Button><Button variant="ghost" onClick={share}><Share2 aria-hidden="true" />Share concept</Button></div><p className="share-status" role="status">{shareStatus}</p><p className="result-disclaimer">A visual concept to refine together. Artwork and lettering are confirmed before production.</p><p className="fine-print">From RM100 per piece. Design fees are separate. Final pricing and construction follow design review and a physical sample.</p></div><div className="concept-preview"><div className="preview-card"><div className="preview-image">{imageFailed ? <p className="image-error">The image couldn’t load. You can still save your story below.</p> : <img src={selected.image} alt={`${selected.brand} — ${selected.title}, a miniature design concept`} onError={() => setImageFailed(true)} />}<span>Concept preview</span></div><div className="preview-meta"><p>{selected.brand}</p><strong>{selected.title}</strong></div></div><p className="fine-print">From your business story to something worth keeping.</p></div></section></main>}
  </div>;
}
function ArrowIcon() { return <span aria-hidden="true">↗</span>; }
