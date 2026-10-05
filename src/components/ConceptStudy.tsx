import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import "./ConceptStudy.css";

export type ConceptKind = "a24" | "airbnb" | "tesla";

interface ConceptStudyProps {
  kind: ConceptKind;
  className?: string;
}

type Point = [number, number, number];
const project = ([x, y, z]: Point) => `${252 + x - y},${180 + (x + y) * 0.42 - z}`;
const points = (...vertices: Point[]) => vertices.map(project).join(" ");

function Box({ x, y, z = 18, w, d, h, top = "#e7e4d9", front = "#d4d1c5", side = "#b5b4a9", stroke = "#252822", children }: {
  x: number; y: number; z?: number; w: number; d: number; h: number;
  top?: string; front?: string; side?: string; stroke?: string;
  children?: ReactNode;
}) {
  return <g stroke={stroke} strokeWidth="0.7" strokeLinejoin="round">
    <polygon points={points([x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h])} fill={front} />
    <polygon points={points([x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h])} fill={side} />
    <polygon points={points([x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h])} fill={top} />
    {children}
  </g>;
}

function Chair({ x, y, accent = "#8d4039", director = false }: { x: number; y: number; accent?: string; director?: boolean }) {
  return <g>
    <Box x={x + 3} y={y + 4} z={19} w={17} d={16} h={19} top="#40423c" front="#33372f" side="#252921" />
    <Box x={x} y={y} z={38} w={24} d={25} h={5} top={accent} front={accent} side="#563e33" />
    <Box x={x} y={y + 21} z={43} w={24} d={4} h={24} top={accent} front={accent} side="#563e33" />
    {director && <g stroke="#eee9d5" strokeWidth="1.4">
      <polyline points={points([x + 4, y + 25, 46], [x + 20, y + 25, 62])} />
      <polyline points={points([x + 4, y + 25, 62], [x + 20, y + 25, 46])} />
    </g>}
  </g>;
}

function Cinema({ active }: { active: boolean }) {
  return <g>
    <Box x={16} y={15} w={180} d={108} h={2} top="#32362f" front="#292e27" side="#22271f" />
    <Box x={19} y={16} w={4} d={94} h={116} top="#52584d" front="#373d33" side="#252b24" />
    <Box x={23} y={16} w={170} d={5} h={116} top="#555b50" front="#353b32" side="#242b22" />
    <g stroke="#79806f" strokeWidth="1" opacity="0.5">
      <polyline points={points([43, 23, 20], [43, 23, 126], [166, 23, 126], [166, 23, 20])} fill="none" />
      <polyline points={points([43, 23, 20], [166, 23, 126])} fill="none" />
    </g>
    <Chair x={143} y={26} accent="#bd593e" director />
    <Box x={173} y={26} z={20} w={3} d={4} h={61} top="#a2a899" front="#a2a899" side="#737b69" />
    <Box x={168} y={23} z={80} w={17} d={14} h={14} top="#a8ad9e" front="#7f8873" side="#545e4b" />
    <Box x={172} y={37} z={82} w={9} d={9} h={8} top="#3b4433" front="#2b3224" side="#434b3a" />
    <g className="concept-study__moving" style={{ transform: active ? "translate(-21px, -8.82px)" : "translate(0, 0)" }}>
      <Box x={67} y={62} z={20} w={121} d={4} h={99} top="#e8e6d7" front="#d5d7c7" side="#b5bdab" />
      <polygon points={points([89, 66, 21], [130, 66, 21], [130, 66, 91], [89, 66, 91])} fill="#b5bcaa" stroke="#727d69" strokeWidth="0.8" />
      <polyline points={points([67, 66, 104], [188, 66, 104])} stroke="#bbc3af" strokeWidth="1" />
    </g>
    <g stroke="#c1be79" strokeWidth="1.2" opacity="0.75">
      <polyline points={points([115, 89, 21], [122, 89, 21], [122, 96, 21])} fill="none" />
      <polyline points={points([150, 89, 21], [143, 89, 21], [143, 96, 21])} fill="none" />
    </g>
    <Box x={26} y={111} w={26} d={8} h={20} top="#686e57" front="#4e5741" side="#3f4835" />
    <Box x={59} y={111} w={26} d={8} h={20} top="#686e57" front="#4e5741" side="#3f4835" />
  </g>;
}

function Home({ active }: { active: boolean }) {
  return <g>
    <Box x={17} y={16} w={178} d={111} h={2} top="#c4c7ac" front="#afb698" side="#909c7d" />
    <g stroke="#8f977d" strokeWidth="0.65" opacity="0.55">
      {[40, 65, 90, 115, 140, 165, 190].map(x => <polyline key={x} points={points([x, 20, 20], [x, 126, 20])} />)}
    </g>
    <Box x={17} y={16} w={4} d={93} h={115} top="#efedde" front="#d8d8c6" side="#bfc5ad" />
    <Box x={21} y={16} w={169} d={5} h={115} top="#f1efe3" front="#e6e5d7" side="#c6ccba" />
    <polygon points={points([69, 22, 64], [129, 22, 64], [129, 22, 112], [69, 22, 112])} fill="#8b9c8b" stroke="#555f4e" strokeWidth="2" />
    <g stroke="#f1eedc" strokeWidth="3">
      <polyline points={points([99, 23, 65], [99, 23, 111])} />
      <polyline points={points([70, 23, 88], [128, 23, 88])} />
    </g>
    <Box x={64} y={19} z={61} w={71} d={9} h={4} top="#f3f0de" front="#d7d9c4" side="#bbc3aa" />
    <Chair x={115} y={35} accent="#9e6850" />
    <Box x={99} y={60} z={19} w={5} d={5} h={39} top="#8d664d" front="#967451" side="#6a533c" />
    <Box x={156} y={60} z={19} w={5} d={5} h={39} top="#8d664d" front="#967451" side="#6a533c" />
    <Box x={99} y={96} z={19} w={5} d={5} h={39} top="#8d664d" front="#967451" side="#6a533c" />
    <Box x={156} y={96} z={19} w={5} d={5} h={39} top="#8d664d" front="#967451" side="#6a533c" />
    <Box x={92} y={55} z={57} w={76} d={52} h={6} top="#d2b790" front="#b39168" side="#987854" />
    <Box x={114} y={65} z={63} w={8} d={8} h={7} top="#4d5e42" front="#dfe1cc" side="#b9c2a7" />
    <Box x={140} y={87} z={63} w={8} d={8} h={7} top="#4d5e42" front="#dfe1cc" side="#b9c2a7" />
    <Box x={40} y={35} z={20} w={18} d={18} h={25} top="#576d43" front="#ab8964" side="#806443" />
    <g fill="#657b4c" stroke="#374d31" strokeWidth="0.8">
      <ellipse cx="253" cy="163" rx="10" ry="17" transform="rotate(-25 253 163)" />
      <ellipse cx="271" cy="163" rx="10" ry="15" transform="rotate(29 271 163)" />
    </g>
    <g className="concept-study__moving" style={{ transform: active ? "translate(21px, -8.82px)" : "translate(0, 0)" }}>
      <Chair x={125} y={119} accent="#bd7555" />
    </g>
  </g>;
}

function Energy({ active }: { active: boolean }) {
  return <g>
    <Box x={20} y={17} w={178} d={111} h={3} top="#d4d8c9" front="#b8c0ab" side="#959f8a" />
    <Box x={30} y={23} w={144} d={68} h={90} top="#e1e3d9" front="#cbd1c0" side="#a6b09c" />
    <polygon points={points([74, 92, 21], [167, 92, 21], [167, 92, 93], [74, 92, 93])} fill="#343e32" stroke="#20291f" strokeWidth="1" />
    <g stroke="#63745b" strokeWidth="1">
      <polyline points={points([86, 93, 23], [86, 93, 86], [164, 93, 86])} fill="none" />
      <polyline points={points([91, 93, 23], [91, 93, 81], [164, 93, 81])} fill="none" />
    </g>
    <Box x={125} y={84} z={33} w={34} d={8} h={43} top="#edc374" front="#d4a14d" side="#a47935" />
    <polyline points={points([130, 93, 62], [153, 93, 62])} fill="none" stroke="#6b4c20" strokeWidth="1.2" />
    <polyline points={points([130, 93, 48], [153, 93, 48])} fill="none" stroke="#6b4c20" strokeWidth="1.2" />
    <g className="concept-study__moving" style={{ transform: active ? "translate(-21px, -8.82px)" : "translate(0, 0)" }}>
      <Box x={74} y={96} z={22} w={98} d={4} h={72} top="#e6e8dc" front="#d3d8c8" side="#aab4a0" />
      <g stroke="#aab49f" strokeWidth="0.65">
        {[86, 98, 110, 122, 134, 146, 158].map(x => <polyline key={x} points={points([x, 101, 25], [x, 101, 90])} />)}
      </g>
    </g>
    <Box x={24} y={18} z={108} w={157} d={80} h={5} top="#e4e7dc" front="#bfc8b4" side="#939f88" />
    <Box x={39} y={28} z={113} w={91} d={54} h={2} top="#485746" front="#33442e" side="#263921" />
    <g stroke="#829075" strokeWidth="0.65">
      {[57, 75, 93, 111].map(x => <polyline key={x} points={points([x, 29, 115.5], [x, 81, 115.5])} />)}
      {[46, 64].map(y => <polyline key={y} points={points([40, y, 115.5], [129, y, 115.5])} />)}
    </g>
    <polyline points={points([130, 57, 115], [151, 57, 115], [151, 90, 115], [151, 92, 95])} fill="none" stroke="#b29452" strokeWidth="2" />
    <Box x={42} y={107} z={21} w={16} d={11} h={25} top="#c1c9b4" front="#a3ae94" side="#75846a" />
  </g>;
}

const studies = {
  a24: { index: "01", title: "Off-screen", action: "Look behind the scene", rest: "The frame hides its making", reveal: "A director’s viewpoint, revealed", motion: "SCENIC FLAT / SLIDE", description: "A miniature film set. Pressing moves one scenic flat aside to reveal a stationary director’s chair and camera." },
  airbnb: { index: "02", title: "A place is made", action: "Make a place", rest: "Someone is already expected", reveal: "One more place at the table", motion: "SPARE CHAIR / SLIDE", description: "A miniature dining corner with two cups. Pressing moves one spare chair toward the table." },
  tesla: { index: "03", title: "Stored afternoon", action: "See what stays", rest: "The useful part of a sunny day", reveal: "The storage behind the wall", motion: "WALL PANEL / SLIDE", description: "A miniature solar-roof home. A static engraved path leads toward storage. Pressing moves one wall panel to reveal an amber storage block." },
};

export function ConceptStudy({ kind, className = "" }: ConceptStudyProps) {
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId().replace(/:/g, "");
  const study = studies[kind];
  const clearTimer = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  const reset = () => { clearTimer(); setActive(false); };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { setActive(false); if (timer.current) clearTimeout(timer.current); }, [kind]);

  return <figure className={`concept-study concept-study--${kind} ${active ? "is-pressed" : ""} ${className}`}>
    <div className="concept-study__meta" aria-hidden="true"><span>STUDY {study.index} / {kind.toUpperCase()}</span><span>ONE PRESS. ONE REVEAL.</span></div>
    <div className="concept-study__canvas">
      <svg viewBox="0 0 520 370" role="img" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
        <title id={`${id}-title`}>{study.title}: interactive concept study</title>
        <desc id={`${id}-description`}>{study.description} This is an illustrated design proposal, not a tested physical prototype.</desc>
        <defs>
          <filter id={`${id}-shadow`} x="-30%" y="-50%" width="160%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
          <linearGradient id={`${id}-base`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#e2e2d5" /><stop offset="100%" stopColor="#b9c2aa" /></linearGradient>
        </defs>
        <ellipse cx="282" cy="306" rx="172" ry="31" fill="#596343" opacity="0.18" filter={`url(#${id}-shadow)`} />
        <g className="concept-study__guides" fill="none" stroke="#7e8970" strokeWidth="0.55" opacity="0.5">
          <polyline points="86,248 307,341 480,268" />
          <path d="M82 253l8-10m213 103l8-10m165-63l8-10" />
        </g>
        <Box x={0} y={0} z={0} w={220} d={160} h={18} top={`url(#${id}-base)`} front="#bdc6ad" side="#8e9b80" />
        <g opacity="0.6" stroke="#59664d" strokeWidth="0.7"><polyline points={points([0, 160, 6], [220, 160, 6], [220, 0, 6])} fill="none" /></g>
        {kind === "a24" ? <Cinema active={active} /> : kind === "airbnb" ? <Home active={active} /> : <Energy active={active} />}
        <Box x={174} y={121} z={18} w={31} d={26} h={2} top="#596747" front="#354428" side="#27371e" />
        <g className="concept-study__cap" style={{ transform: active ? "translateY(5px)" : "translateY(0)" } as CSSProperties}>
          <Box x={176} y={123} z={20} w={27} d={22} h={7} top="#e4f2a3" front="#bbc97d" side="#8f9f59" />
          <polyline points={points([184, 129, 27.5], [194, 129, 27.5], [194, 138, 27.5])} stroke="#596840" strokeWidth="1.1" fill="none" />
        </g>
        <text x="321" y="347" transform="rotate(-23 321 347)" className="concept-study__dimension">84 MM · PROPOSED</text>
      </svg>
    </div>
    <figcaption className="concept-study__controls">
      <div className="concept-study__caption">
        <span className="concept-study__motion">{study.motion}</span>
        <span className="concept-study__state" aria-live="polite" aria-atomic="true">{active ? study.reveal : study.rest}</span>
        <span className="concept-study__hint">Hold to explore · release to reset</span>
      </div>
      <button
        type="button"
        className="concept-study__push"
        aria-label={`${study.action}. Hold to reveal; release to reset. Keyboard activation plays one cycle.`}
        aria-pressed={active}
        onPointerDown={event => {
          if (event.button > 0) return;
          clearTimer(); setActive(true);
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onPointerUp={reset}
        onPointerCancel={reset}
        onLostPointerCapture={reset}
        onBlur={reset}
        onClick={event => {
          // Native keyboard and assistive-technology clicks have detail zero.
          if (event.detail !== 0) return;
          clearTimer(); setActive(true);
          timer.current = setTimeout(() => setActive(false), 1300);
        }}
      >
        <span aria-hidden="true" className="concept-study__push-face">↓</span>
        <span className="concept-study__push-label">PRESS</span>
      </button>
    </figcaption>
    <p className="concept-study__disclaimer">Independent concept · mechanism unverified</p>
  </figure>;
}

export default ConceptStudy;
