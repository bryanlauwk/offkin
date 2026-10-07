type Artwork = 'hero' | 'stories' | 'editions' | 'experiences' | 'world' | 'collectible' | 'components' | 'packaging' | 'footer';

// Standalone generated marketing assets. Atlas viewports never contain website UI.
const regions: Record<Artwork, { source: string; width: number; height: number; viewBox: string }> = {
  hero: { source: 'offkin-hero.webp', width: 1536, height: 1024, viewBox: '0 0 1536 1024' },
  stories: { source: 'offkin-applications.webp', width: 1448, height: 1086, viewBox: '0 0 724 543' },
  editions: { source: 'offkin-applications.webp', width: 1448, height: 1086, viewBox: '724 0 724 543' },
  experiences: { source: 'offkin-applications.webp', width: 1448, height: 1086, viewBox: '0 543 724 543' },
  world: { source: 'offkin-process.webp', width: 1536, height: 1024, viewBox: '0 0 768 528' },
  collectible: { source: 'offkin-process.webp', width: 1536, height: 1024, viewBox: '768 0 768 512' },
  components: { source: 'offkin-process.webp', width: 1536, height: 1024, viewBox: '0 528 768 496' },
  packaging: { source: 'offkin-process.webp', width: 1536, height: 1024, viewBox: '768 512 768 512' },
  footer: { source: 'offkin-footer.webp', width: 2172, height: 724, viewBox: '0 0 2172 724' },
};

/** Static marketing art, never a generated customer result or an input to a proposal. */
export function MarketingArtwork({ kind, className = '' }: { kind: Artwork; className?: string }) {
  const { source, width, height, viewBox } = regions[kind];
  return <svg className={`op-marketing-art ${className}`} viewBox={viewBox} preserveAspectRatio={kind==='footer'?'xMaxYMax meet':'xMidYMid meet'} aria-hidden="true" focusable="false" data-marketing-art={kind}>
    <image href={`/marketing/${source}`} width={width} height={height}/>
  </svg>;
}

const applications = [
  { art: 'stories', title: 'Collectible stories', copy: 'Translate your identity, signature product or hero story into an object worth keeping.', note: 'Our focus' },
  { art: 'editions', title: 'Campaign editions', copy: 'Explore a collectible for a launch, anniversary, collaboration or special release.', note: 'An application to explore' },
  { art: 'experiences', title: 'Physical experiences', copy: 'Explore how discovery, movement and play can bring a brand story into the real world.', note: 'An application to explore' },
] as const;

export default function ProposalMarketing() {
  return <section id="proposal-collectibles" className="op-applications" tabIndex={-1} aria-labelledby="op-applications-title">
    <h2 id="op-applications-title">Small objects. Bigger possibilities.</h2>
    <p className="op-applications-intro">One brand story can take different forms.</p>
    <div className="op-application-grid">{applications.map(({ art, title, copy, note }, index) => <article key={art}>
      <MarketingArtwork kind={art}/>
      <div className="op-application-copy"><span className="op-application-number" aria-hidden="true">0{index + 1}</span><div><h3>{title}</h3><p>{copy}</p><small>{note}</small></div></div>
    </article>)}</div>
    <p className="op-art-disclaimer">Illustrative concepts from our visual direction. Your proposal starts with your own story.</p>
  </section>;
}
