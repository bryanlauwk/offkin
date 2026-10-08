import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import BuildProposalRequest from '@/components/BuildProposalRequest';
import PilotProcess from '@/components/PilotProcess';
import { studioBrand } from '@/lib/studio-brand';
import { showcaseWorlds, SHOWCASE_DISCLAIMER, SHOWCASE_IMAGE_NOTE, SHOWCASE_PREVIEW_NOTE, type ShowcaseWorld } from '@/lib/showcase-worlds';
import '@/components/proposal-studio.css';
import './showcase.css';

const safeLink = (value: string) => /^https?:\/\//i.test(value) || (value.startsWith('/') && !value.startsWith('//')) ? value : '/';

function ConceptBoard({ world }: { world: ShowcaseWorld }) {
  const [failed, setFailed] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  return <figure className="sc-concept-board">
    <div className="sc-board-topline"><span>02 / COLLECTIBLE DIRECTION</span><span>UNOFFICIAL CONCEPT</span></div>
    {failed ? <div className="sc-image-fallback" role="status"><strong>This concept image couldn’t load.</strong><p>The story and proposed details are still available below. You can also choose another study.</p></div> : <div className="sc-board-window" role="region" tabIndex={0} aria-label={`${world.brand} concept board; scroll horizontally to explore`}><img src={world.board} alt={world.boardAlt} width={1536} height={1024} decoding="async" loading="lazy" onError={() => setFailed(true)} /></div>}
    <figcaption>
      <div><strong>{world.note}</strong>{!failed && <span className="sc-scroll-hint">Scroll across to explore the full concept board ↔</span>}<p>{SHOWCASE_IMAGE_NOTE}</p></div>
      {!failed && <Dialog onOpenChange={() => setZoomed(false)}>
        <DialogTrigger asChild><button type="button" className="sc-view-board"><Maximize2 size={15} aria-hidden="true" />Explore the details</button></DialogTrigger>
        <DialogContent className="sc-board-dialog">
          <div className="sc-dialog-heading"><DialogTitle>{world.brand} · unofficial concept study</DialogTitle><DialogDescription>{SHOWCASE_IMAGE_NOTE}</DialogDescription></div>
          <button type="button" className="sc-view-board sc-zoom-toggle" aria-pressed={zoomed} onClick={() => setZoomed(!zoomed)}>{zoomed ? <ZoomOut size={15} aria-hidden="true" /> : <ZoomIn size={15} aria-hidden="true" />}{zoomed ? 'Fit the full board' : 'See finer details'}</button>
          <div className={`sc-dialog-image${zoomed ? ' is-zoomed' : ''}`} tabIndex={0} role="region" aria-label={`${world.brand} concept board; scroll to explore when zoomed`}><img src={world.board} alt={world.boardAlt} width={1536} height={1024} /></div>
        </DialogContent>
      </Dialog>}
    </figcaption>
  </figure>;
}

function IllustratedWorld({ world }: { world: ShowcaseWorld }) {
  const [failed, setFailed] = useState(false);
  if (!world.illustration) return null;
  return <figure className="sc-world-art">
    {failed ? <div className="sc-image-fallback" role="status"><strong>This world illustration couldn’t load.</strong><p>You can still explore its collectible direction below.</p></div> : <img src={world.illustration} alt={world.illustrationAlt} width={1536} height={1024} decoding="async" loading="eager" onError={() => setFailed(true)} />}
    <figcaption>01 / THE ILLUSTRATED WORLD</figcaption>
  </figure>;
}

export default function Showcase() {
  const [settings, setSettings] = useState({ title: studioBrand.name, logo: '', link: '/' });
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedBrand = searchParams.get('brand');
  const active = showcaseWorlds.find(world => world.id === requestedBrand)?.id ?? showcaseWorlds[0].id;
  const selectBrand = (id: string) => {
    if (id !== active) setSearchParams({ brand: id }, { preventScrollReset: true });
  };
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    let live = true;
    supabase.from('site_settings').select('key,value').then(({ data }) => {
      if (!live || !data?.length) return;
      const next = { title: studioBrand.name, logo: '', link: '/' };
      for (const s of data) {
        if (s.key === 'site_title' && s.value && !['dioramini', 'briq2.0', 'briq', 'form.', 'brandkin', 'stive', 'the absurd marshmallow test'].includes(s.value.trim().toLowerCase())) next.title = s.value;
        if (s.key === 'logo_url' && /^https?:\/\//i.test(s.value || '')) next.logo = s.value;
        if (s.key === 'logo_link' && s.value && s.value !== 'https://example.com') next.link = safeLink(s.value);
      }
      setSettings(next);
    }, () => { /* The public study remains available with the default studio identity. */ });
    return () => { live = false; };
  }, []);
  useEffect(() => { document.title = `Example worlds · ${settings.title}`; }, [settings.title]);

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'ArrowRight' ? (index + 1) % showcaseWorlds.length : event.key === 'ArrowLeft' ? (index + showcaseWorlds.length - 1) % showcaseWorlds.length : event.key === 'Home' ? 0 : event.key === 'End' ? showcaseWorlds.length - 1 : -1;
    if (next < 0) return;
    event.preventDefault();
    selectBrand(showcaseWorlds[next].id);
    tabRefs.current[next]?.focus();
  }

  const world = showcaseWorlds.find(w => w.id === active)!;
  return <div className="op-app sc-page">
    <a href="#sc-main" className="op-skip-link">Skip to the concept studies</a>
    <header className="op-header"><a href={settings.link} aria-label={`${settings.title} home`} className="op-logo">{settings.logo && <img src={settings.logo} alt="" />}<span>{settings.title}<small>异趣伙伴</small></span></a><Link to="/" className="op-text-link"><ArrowLeft size={14} aria-hidden="true" />See my concept</Link></header>
    <main id="sc-main" tabIndex={-1}>
      <section className="sc-intro">
        <p className="op-eyebrow">COLLECTIBLE INSPIRATION</p>
        <h1>Brand stories.<br /><span>Made collectible.</span></h1>
        <p>Explore how travel, cinema and clean energy could become a collectible, from the first idea to the unboxing.</p>
        <p className="sc-proof-note">AI-generated concept studies. No physical prototypes shown.</p><p className="sc-disclaimer">{SHOWCASE_DISCLAIMER} Brand names identify the inspiration only.</p>
      </section>
      <div className="sc-tabs" role="tablist" aria-label="Choose an example world">
        {showcaseWorlds.map((w, index) => <button key={w.id} ref={node => { tabRefs.current[index] = node; }} type="button" role="tab" id={`sc-tab-${w.id}`} tabIndex={w.id === active ? 0 : -1} aria-selected={w.id === active} aria-controls={`sc-${w.id}`} className={w.id === active ? 'is-active' : ''} onClick={() => selectBrand(w.id)} onKeyDown={event => navigateTabs(event, index)}><strong>{w.brand}</strong><span>{w.tagline}</span></button>)}
      </div>
      <article id={`sc-${world.id}`} role="tabpanel" tabIndex={0} className={`sc-world sc-accent-${world.accent}`} aria-labelledby={`sc-tab-${world.id}`}>
        <div className={`sc-hero-row${world.illustration ? ' sc-hero-row--illustrated' : ''}`}>
          <IllustratedWorld key={`ink-${world.id}`} world={world} />
          <div className="sc-hero-copy"><p className="sc-kicker">{world.brand} / UNOFFICIAL CONCEPT STUDY</p><h2>{world.brand}<span>{world.tagline}</span></h2><div className="sc-world-summary"><p>{world.summary}</p><p className="sc-preview-note">{SHOWCASE_PREVIEW_NOTE}</p></div></div>
        </div>
        <ConceptBoard key={world.id} world={world} />
        <section className="sc-block" aria-labelledby="sc-dna-title">
          <div className="sc-section-heading"><span>03 / THE STORY IN THE DETAILS</span><h3 id="sc-dna-title">Brand DNA → physical form</h3></div>
          <ul className="sc-elements">{world.elements.map((e, i) => <li key={e.title}><span>{String(i + 1).padStart(2, '0')}</span><strong>{e.title}</strong><p>{e.copy}</p></li>)}</ul>
        </section>
        <div className="sc-split">
          <section className="sc-block" aria-labelledby="sc-interaction-title">
            <div className="sc-section-heading"><span>04 / A PROPOSED INTERACTION</span><h3 id="sc-interaction-title">A little reason to come back.</h3></div>
            <p className="sc-section-note">One small interaction to explore in the build proposal.</p>
            <ol className="sc-steps">{world.steps.map((s, i) => <li key={s.title}><span>{i + 1}</span><div><strong>{s.title}</strong><p>{s.copy}</p></div></li>)}</ol>
          </section>
          <section className="sc-block sc-pack" aria-labelledby="sc-pack-title">
            <div className="sc-section-heading"><span>05 / BEYOND THE OBJECT</span><h3 id="sc-pack-title">The first reveal matters.</h3></div>
            <p>{world.packaging}</p>
            <p className="sc-section-note">Packaging direction shown on the concept board.</p>
            <h4 className="sc-series-title">Possible next chapters</h4>
            <ul className="sc-series" aria-label="Future series ideas">{world.series.map(s => <li key={s}>{s}</li>)}</ul>
            <p className="sc-section-note">Ideas for future studies.</p>
          </section>
        </div>
      </article>
      <PilotProcess/>
      <section className="sc-cta"><div><p className="sc-kicker">YOUR STORY COMES NEXT</p><h2>What could <span>yours become?</span></h2><p>Start a project around your own brand or story.</p></div><BuildProposalRequest compact projectEntry brief="New project enquiry. No customer concept has been generated." inspiration={`${world.brand}: ${world.tagline}`}/></section>
    </main>
  </div>;
}
