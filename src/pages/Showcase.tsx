import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { studioBrand } from '@/lib/studio-brand';
import { showcaseWorlds, SHOWCASE_DISCLAIMER } from '@/lib/showcase-worlds';
import '@/components/proposal-studio.css';
import './showcase.css';

const safeLink = (value: string) => /^https?:\/\//i.test(value) || (value.startsWith('/') && !value.startsWith('//')) ? value : '/';

export default function Showcase() {
  const [settings, setSettings] = useState({ title: studioBrand.name, logo: '', link: '/' });
  const [active, setActive] = useState(showcaseWorlds[0].id);
  useEffect(() => {
    document.title = `Example worlds · ${studioBrand.name}`;
    let live = true;
    supabase.from('site_settings').select('key,value').then(({ data }) => {
      if (!live || !data) return;
      const next = { title: studioBrand.name, logo: '', link: '/' };
      for (const s of data) {
        if (s.key === 'site_title' && s.value) next.title = s.value;
        if (s.key === 'logo_url' && /^https?:\/\//i.test(s.value || '')) next.logo = s.value;
        if (s.key === 'logo_link' && s.value && s.value !== 'https://example.com') next.link = safeLink(s.value);
      }
      setSettings(next);
    });
    return () => { live = false; };
  }, []);
  const world = showcaseWorlds.find(w => w.id === active)!;
  return <div className="op-app sc-page">
    <header className="op-header"><a href={settings.link} aria-label={`${settings.title} home`} className="op-logo">{settings.logo && <img src={settings.logo} alt="" />}<span>{settings.title}<small>异趣伙伴</small></span></a><Link to="/" className="op-text-link"><ArrowLeft size={14} aria-hidden="true" />Start your world</Link></header>
    <main>
      <section className="sc-intro">
        <p className="op-eyebrow">EXAMPLE WORLDS</p>
        <h1>From brand story<br /><span>to something you can hold.</span></h1>
        <p>Three concept studies showing the journey: an illustrated world, a collectible, how it plays, and the box it comes in.</p>
        <p className="sc-disclaimer">{SHOWCASE_DISCLAIMER} Brand names are used only to describe the study.</p>
      </section>
      <div className="sc-tabs" role="tablist" aria-label="Choose an example world">
        {showcaseWorlds.map(w => <button key={w.id} role="tab" aria-selected={w.id === active} aria-controls={`sc-${w.id}`} className={w.id === active ? 'is-active' : ''} onClick={() => setActive(w.id)}><strong>{w.brand}</strong><span>{w.tagline}</span></button>)}
      </div>
      <article id={`sc-${world.id}`} role="tabpanel" className={`sc-world sc-accent-${world.accent}`} aria-label={`${world.brand} concept study`}>
        <div className="sc-hero-row">
          <figure className="sc-world-art"><img src={world.images.world} alt={`Illustrated ${world.brand} brand world concept`} width={1536} height={1024} /><figcaption>01 · Brand world</figcaption></figure>
          <div className="sc-hero-copy">
            <h2>{world.brand}<span>{world.tagline}</span></h2>
            <p>{world.summary}</p>
            <figure className="sc-collectible"><img src={world.images.hero} alt={`${world.brand} collectible concept`} width={1024} height={1024} loading="lazy" /><figcaption>02 · The collectible — <em>{world.note}</em></figcaption></figure>
          </div>
        </div>
        <section className="sc-block" aria-label="Key elements">
          <h3>Brand DNA → physical form</h3>
          <ul className="sc-elements">{world.elements.map((e, i) => <li key={e.title}><span>{String(i + 1).padStart(2, '0')}</span><strong>{e.title}</strong><p>{e.copy}</p></li>)}</ul>
        </section>
        <div className="sc-split">
          <section className="sc-block" aria-label="How it works">
            <h3>How it plays</h3>
            <ol className="sc-steps">{world.steps.map((s, i) => <li key={s.title}><span>{i + 1}</span><div><strong>{s.title}</strong><p>{s.copy}</p></div></li>)}</ol>
            <h3 className="sc-series-title">Collect the series</h3>
            <ul className="sc-series">{world.series.map(s => <li key={s}>{s}</li>)}</ul>
          </section>
          <figure className="sc-block sc-pack"><img src={world.images.packaging} alt={`${world.brand} packaging concept`} width={1024} height={1024} loading="lazy" /><figcaption><strong>03 · Packaging</strong>{world.packaging}</figcaption></figure>
        </div>
      </article>
      <section className="sc-cta"><h2>What does <span>your</span> brand look like in another world?</h2><Link to="/" className="op-primary">Start your world<ArrowRight size={16} aria-hidden="true" /></Link></section>
    </main>
  </div>;
}
