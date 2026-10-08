import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showcaseWorlds } from '@/lib/showcase-worlds';
import './brand-example-strip.css';

const studyThemes: Record<string, string> = {
  airbnb: 'A world of welcome',
  a24: 'Cinema, made collectible',
  tesla: 'A connected energy world',
};

/** Read-only inspiration links. Examples never become a customer's brief or result. */
export default function BrandExampleStrip() {
  return <section id="proposal-worlds" className="op-brand-examples" tabIndex={-1} aria-labelledby="op-examples-title" aria-describedby="op-examples-note">
    <div className="op-examples-heading"><h2 id="op-examples-title">A little inspiration.</h2><Link to="/showcase">Explore the studies <ArrowUpRight size={14} aria-hidden="true" /></Link></div>
    <div className="op-example-grid">{showcaseWorlds.map(world => <Link key={world.id} to={`/showcase?brand=${world.id}`} className={`op-example-card op-example-card--${world.id}`} aria-label={`Explore the ${world.brand}-inspired concept study`}>
      <svg className="op-example-art" viewBox="0 0 980 680" role="img" aria-label={`${world.brand}-inspired AI collectible concept`} focusable="false">
        <image href={world.board} width={1536} height={1024} />
      </svg>
      <span className="op-example-caption"><span><strong>{world.brand}</strong><small>{studyThemes[world.id]}</small></span><ArrowUpRight size={16} aria-hidden="true" /></span>
    </Link>)}</div>
    <p id="op-examples-note" className="op-examples-note">Unofficial AI studies, not client work or real products. No affiliation or endorsement.</p>
  </section>;
}
