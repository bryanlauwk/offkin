import { useState } from 'react';
import { ArrowUpRight, RotateCw, Sparkles } from 'lucide-react';

const worlds = [
  { id: 'airbnb', brand: 'Airbnb', title: 'A little world.\nA bigger welcome.', tag: 'BELONGING, GIVEN A SHAPE', idea: 'A winding yellow path connects homes, hosts and new arrivals. The familiar Bélo becomes a landmark inside a world of welcome.', action: 'Explore a path that brings people together.', art: '/concept-worlds/airbnb-world.webp', alt: 'Airbnb-inspired concept with a coral Bélo, cottage, guests and a yellow path', type: 'Illustrated world → collectible scene', color: '#ffc9bd' },
  { id: 'a24', brand: 'A24', title: 'One click.\nAnother world.', tag: 'CURIOSITY, MADE MECHANICAL', idea: 'A retro projector becomes a portal. Four sculpted scenes suggest the strange, human worlds cinema lets us step into.', action: 'A proposed quarter-turn reveals a different story.', art: '/concept-worlds/a24-world.webp', alt: 'A24-inspired black projector concept with sculpted miniature story worlds', type: 'Cinema → story-turning object', color: '#c8c5ef' },
  { id: 'tesla', brand: 'Tesla', title: 'Make the invisible\nfeel tangible.', tag: 'AN ENERGY STORY YOU CAN FOLLOW', idea: 'Sun, solar roof, home storage and a car become one connected landscape. The whole energy system gets the leading role.', action: 'Press the sun to imagine energy travelling through the scene.', art: '/concept-worlds/tesla-world.webp', alt: 'Tesla-inspired energy-world concept with a yellow sun, solar home, battery and car', type: 'Connected system → physical story', color: '#efe783' },
] as const;
export function BrandWorldShowcase() {
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState<string>();
  const world = worlds[selected];
  return <section className="world-showcase" aria-labelledby="world-title" style={{ '--world-color': world.color } as React.CSSProperties}>
    <div className="world-topline"><span><Sparkles size={14} aria-hidden="true" /> WORLDS IN PROGRESS</span><span>0{selected + 1} / 03</span></div>
    <div className={`world-art world-art--${world.id}`}><img onError={() => setFailed(world.art)} key={world.art} src={world.art} alt={world.alt} width="1536" height="1024" decoding="async" loading="eager" />{failed === world.art && <div className="world-image-error"><p>This concept image couldn’t load.</p><p>You can still explore its story below or choose another world.</p></div>}<span className="concept-stamp">INDEPENDENT<br />CONCEPT STUDY ↗</span></div>
    <div className="world-caption"><div><p className="micro-label">{world.tag}</p><h2 id="world-title">{world.title}</h2></div><button type="button" className="world-next" onClick={() => { setSelected((selected + 1) % worlds.length); setExpanded(false); }} aria-label="Explore the next concept world"><RotateCw size={23} /></button></div>
    <p className="world-idea">{world.idea}</p>
    <div className="world-tabs" role="group" aria-label="Explore observation studies">{worlds.map((entry, index) => <button key={entry.id} type="button" aria-pressed={selected === index} onClick={() => { setSelected(index); setExpanded(false); }}><span>0{index + 1}</span>{entry.brand}<ArrowUpRight size={14} aria-hidden="true" /></button>)}</div>
    <button className="text-button world-detail-toggle" type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>What makes this a brand world? {expanded ? '−' : '+'}</button>
    {expanded && <div className="world-detail"><strong>{world.type}</strong><p>{world.action} This is an interaction proposal, not a working prototype.</p><p>The image is a creative reference. Mechanisms, dimensions, cost, exact artwork and production feasibility still need validation.</p></div>}
    <p className="concept-note">Independent design explorations. No affiliation, commission or endorsement. Visual concepts, not available products.</p>
  </section>;
}
