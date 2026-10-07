import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, LoaderCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreationConversation } from '@/components/CreationConversation';
import { supabase } from '@/integrations/supabase/client';
import type { CollectibleConcept } from '@/lib/collectible-brief';
import { requestConcept } from '@/lib/concept-api';
import { emptyDraft, loadCreationDraft, saveCreationDraft, type CreationDraft } from '@/lib/creation-journey';
import './studio.css';
import { displayStudioName, studioBrand } from '@/lib/studio-brand';
import { makeDesignBrief } from '@/lib/brief-handoff';

type SiteSettings = { logoUrl: string; logoLink: string; siteTitle: string };
const defaultSettings: SiteSettings = { logoUrl: '', logoLink: '/', siteTitle: studioBrand.name };
export default function Index() {
  const [params, setParams] = useSearchParams();
  const [generated, setGenerated] = useState<CollectibleConcept | null>(null);
  const [draft, setDraft] = useState<CreationDraft>();
  const [settings, setSettings] = useState(defaultSettings);
  const [editing, setEditing] = useState(false);
  const [homeVersion, setHomeVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const request = useRef<AbortController | null>(null);
  const directions = useRef(new Map<string, CreationDraft>());
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
        if (setting.key === 'site_title') next.siteTitle = !setting.value || ['dioramini', 'briq2.0', 'briq', 'form.', 'brandkin', 'stive', 'the absurd marshmallow test'].includes(setting.value.trim().toLowerCase()) ? defaultSettings.siteTitle : setting.value;
      }); setSettings(next);
    }); return () => { active = false; };
  }, []);
  useEffect(() => {
    document.title = selected ? `${selected.title} — ${displayStudioName(settings.siteTitle)}` : `${displayStudioName(settings.siteTitle)} — ${studioBrand.pageTitleSuffix}`;
    setImageFailed(false); setShareStatus(''); window.scrollTo(0, 0);
  }, [selected, settings.siteTitle]);
  useEffect(() => { setEditing(false); setStatus(''); setDraft(conceptId ? directions.current.get(conceptId) || loadCreationDraft(conceptId) : undefined); }, [conceptId]);
  useEffect(() => {
    if (!conceptId || generated?.id === conceptId) return;
    const controller = new AbortController(); request.current = controller; setBusy(true); setStatus('Opening your concept…');
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
    const text = [`${selected.brand} — ${selected.title}`, selected.story, selected.interaction || '', ...(draft ? [makeDesignBrief(draft)] : ['The original direction is not saved on this device. Add your exact wording, audience and style before refining.']), ...(selected.sourceUrl ? [`Website: ${selected.sourceUrl}`] : []), 'Visual concept. Artwork and lettering are confirmed before production. Final design, construction and pricing follow design review and a physical sample. This brief has not been sent and does not place an order.'].filter(Boolean).join('\n\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${selected.id}-concept-brief.txt`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function share() { try { const link = new URL(window.location.pathname, window.location.origin); if (!selected) return; link.searchParams.set('concept', selected.id); await navigator.clipboard.writeText(link.toString()); setShareStatus('Link copied. Anyone with this link can view the concept; your device-local answers aren’t included.'); } catch { setShareStatus('You can copy the link from your address bar.'); } }
  return <div className="studio-shell"><a className="skip-link" href="#main-content">Skip to content</a><header className="studio-header"><a className="studio-logo" href={settings.logoLink || '/'} aria-label={`${settings.siteTitle} home`}>{settings.logoUrl ? <img src={settings.logoUrl} alt={settings.siteTitle} /> : <><span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span><span className="brand-wordmark"><span>{settings.siteTitle}</span>{settings.siteTitle === studioBrand.name && <span className="brand-chinese" lang="zh-Hans">{studioBrand.chineseName}</span>}</span></>}</a><div className="header-end"><span className="header-caption">STORIES, IN PHYSICAL FORM.</span><button type="button" className="header-coordinate" onClick={() => { createAnother(); setHomeVersion(value => value + 1); window.scrollTo(0, 0); }}>CO-CREATE YOUR WORLD ↗</button><span className="header-arrow" aria-hidden="true">↗</span></div></header>
    {conceptId && !selected ? <main id="main-content" className="loading-page"><h1>Your concept</h1><p role="status">{busy && <LoaderCircle className="spin" aria-hidden="true" />}{status}</p><div className="chat-actions">{!busy && <Button onClick={() => setLoadAttempt(value => value + 1)}>Try loading again</Button>}<Button variant="ghost" onClick={createAnother}>Start a new story</Button></div></main> : !selected || editing ? <CreationConversation key={editing ? `refine-${conceptId}` : `create-${homeVersion}`} initialDraft={editing ? draft || { ...emptyDraft, website: selected?.sourceUrl || '', business: '', summaryOnly: true } : undefined} directionMissing={editing && !draft} navigationKey={params.toString()} onExit={editing ? () => setEditing(false) : undefined} onGenerated={(concept, answers) => { directions.current.set(concept.id, answers); saveCreationDraft(concept.id, answers); setGenerated(concept); setDraft(answers); setEditing(false); setParams({ concept: concept.id }); }} /> : <main id="main-content" className="result-page"><Button variant="ghost" className="back-link" onClick={createAnother}>← Start a new story</Button><section className="result-shell" aria-labelledby="concept-title"><div className="concept-story"><p className="result-kicker">YOUR FIRST LOOK / VISUAL CONCEPT</p><p className="brand-name">{selected.brand}</p><h1 id="concept-title">{selected.title}</h1><section className="business-dna" aria-labelledby="business-dna-title"><h2 id="business-dna-title">Why this represents your business</h2><p className="concept-copy">{selected.story}</p>{selected.sourceUrl && /^https?:\/\//i.test(selected.sourceUrl) && <p className="source-note">Inspired by <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">{selected.sourceTitle || 'your website'}</a> and your direction.</p>}</section>{selected.interaction && <div className="interaction-card"><span>THE MEANINGFUL ACTION</span><p>{selected.interaction}</p></div>}<div className="result-actions"><Button onClick={() => setEditing(true)}>Refine this direction<ArrowIcon /></Button><Button variant="outline" onClick={download}><Download aria-hidden="true" />Save concept brief</Button><Button variant="ghost" onClick={share}><Share2 aria-hidden="true" />Share concept</Button></div><p className="share-status" role="status">{shareStatus}</p><section className="prototype-checks" aria-labelledby="prototype-title"><h2 id="prototype-title">Take this toward a prototype</h2><p className="fine-print">Download your concept brief for a design conversation. The first sample needs its own scope and quote; this page does not submit a request or take payment.</p><ul><li>Scale, stability and the strength of small parts</li><li>Button travel, clearances and reliable return, if it moves</li><li>Materials, surface finish, colour and exact lettering</li><li>Reusable base, connectors and mechanisms, plus assembly and durability</li><li>A few outsourced printed samples to test the experience and cost</li>{draft?.mode === 'electronic' && <><li>USB power, electrical safety, heat and enclosure design</li><li>Firmware, display usability, network fallback and bounded AI content</li><li>Provider terms, data privacy and electronics-specific pricing</li></>}{!draft && <li>If electronics are proposed: power, heat, firmware, network fallback, bounded AI content and privacy</li>}</ul></section><p className="result-disclaimer">An AI-assisted visual exploration. A render doesn’t establish manufacturing readiness. Artwork and lettering require proofing.</p><p className="fine-print">RM100–500 is an exploratory budget range. Outsourced samples and supplier quotes must establish which specifications fit; it is not a guaranteed price or a limit for every design. Design, electronics and production require separate scoping. Final pricing and construction follow design review and a physical sample.</p></div><div className="concept-preview"><div className="preview-card"><div className="preview-image">{imageFailed ? <p className="image-error">The image couldn’t load. You can still save your story below.</p> : <img src={selected.image} alt={`${selected.brand} — ${selected.title}, a brand-world design concept`} onError={() => setImageFailed(true)} />}<span>Concept preview</span></div><div className="preview-meta"><p>{selected.brand}</p><strong>{selected.title}</strong></div></div><p className="fine-print">One scene. A specific story. The beginning of a physical object.</p></div></section></main>}
  </div>;
}
function ArrowIcon() { return <span aria-hidden="true">↗</span>; }


