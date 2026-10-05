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
  return <g stroke="#77786c" strokeWidth="0.8" strokeLinejoin="round">
    {/* Fixed cutaway home and enclosed USB controller, matching the visual concept. */}
    <path d="M96 262 L134 283 L442 263 L443 313 Q443 323 429 325 L148 345 Q131 345 124 336 L96 312 Z" fill="#414640" />
    <path d="M96 242 L134 266 L425 246 L443 261 L134 284 L96 263 Z" fill="#eeeade" />
    <path d="M96 260 L134 282 L134 335 Q124 335 118 330 L96 313 Z" fill="#c2c0b2" />
    <path d="M134 282 L443 261 L443 306 Q443 316 429 317 L150 337 Q134 337 134 326 Z" fill="#e4e1d5" />
    <path d="M96 293 L108 299 L108 287 L96 281 Z" fill="#343b32" />
    <path d="M106 291 C91 288 82 289 61 299" fill="none" stroke="#d1cdbf" strokeWidth="9" strokeLinecap="round" />
    <path d="M106 289 C91 287 82 288 61 297" fill="none" stroke="#ece9df" strokeWidth="5" strokeLinecap="round" />
    <path d="M103 148 L145 172 L145 272 L103 245 Z" fill="#53584f" />
    <path d="M145 173 L342 74 L423 115 L423 258 L145 276 Z" fill="#eeebde" />
    <path d="M158 177 L342 87 L411 121 L411 246 L158 263 Z" fill="#c9c8b6" />
    <path d="M158 177 L342 87 L342 251 L158 263 Z" fill="#d8d5c5" />
    <path d="M342 87 L411 121 L411 246 L342 251 Z" fill="#c1c0ad" />
    <path d="M155 265 L411 246 L419 253 L153 273 Z" fill="#f2eee1" />
    <path d="M153 210 L411 191 L419 200 L153 220 Z" fill="#f0ecdf" />
    <path d="M153 220 L419 200 L419 207 L153 227 Z" fill="#bcbda9" />
    <path d="M260 219 L269 218 L269 256 L260 257 Z" fill="#ede9dc" />
    <path d="M349 140 L366 139 L366 158 L349 159 Z" fill="#d7d3c3" />
    <path d="M354 159 L354 193 M362 158 L362 192" fill="none" stroke="#a9aa98" strokeWidth="1.4" />
    <path d="M383 176 L400 175 L408 180 L390 182 Z" fill="#eeeadd" />
    <path d="M390 182 L408 180 L408 191 L390 193 Z" fill="#d6d4c3" />
    <path d="M383 176 L390 182 L390 193 L383 188 Z" fill="#b9bbaa" />
    {/* The amber route and exposed storage are static illustration, not a circuit animation. */}
    <path d="M254 126 L254 178 L328 173 L328 213 L342 220" fill="none" stroke="#b88a3b" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M302 215 L380 209 L398 219 L320 226 Z" fill="#cf9d43" />
    <path d="M302 215 L320 226 L320 260 L302 249 Z" fill="#ae762e" />
    <path d="M320 226 L398 219 L398 253 L320 260 Z" fill="#c59439" />
    <path d="M325 229 L393 223 L393 249 L325 255 Z" fill="#d0a452" stroke="#88672f" />
    <path d="M333 231 L345 230 L345 252 L333 253 Z" fill="#ddbb78" stroke="none" opacity="0.65" />
    <path d="M300 250 L320 261 L399 254 L402 260 L320 267 L300 256 Z" fill="#dfdac9" />
    <path d="M102 147 L299 41 L346 66 L145 173 Z" fill="#454a43" />
    <path d="M102 147 L145 173 L145 183 L102 157 Z" fill="#303830" />
    <path d="M145 173 L346 66 L346 75 L145 183 Z" fill="#696d60" />
    <g fill="#3a413c" stroke="#8b9182" strokeWidth="0.7">
      <path d="M110 147 L153 124 L190 144 L146 166 Z" />
      <path d="M158 121 L201 98 L239 119 L195 141 Z" />
      <path d="M206 95 L249 72 L287 93 L244 116 Z" />
      <path d="M254 69 L298 46 L337 67 L292 90 Z" />
    </g>
    <g fill="none" stroke="#9ba08e" strokeWidth="0.45" opacity="0.7">
      <path d="M118 150 L304 51 M127 155 L313 56 M136 160 L322 61" />
    </g>
    {/* One fixed button; only the sample display and one LED change state. */}
    <ellipse cx="182" cy="306" rx="13" ry="13.5" fill="#a6a99a" />
    <ellipse cx="182" cy="304" rx="12" ry="12.5" fill="#4c5349" stroke="#30382d" strokeWidth="1.2" />
    <g className="concept-study__electronic-response" data-simulation-state={active ? "active" : "idle"}>
      <g transform="matrix(1 -0.07 0 1 226 287)">
        <rect width="126" height="28" rx="3" fill="#454c45" stroke="#343b35" strokeWidth="1.2" />
        <rect x="4" y="4" width="118" height="20" rx="1" className="concept-study__display" fill={active ? "#f4edce" : "#d8e0d9"} stroke="#a8b3a5" />
        <text x="63" y="18" textAnchor="middle" className="concept-study__display-message" opacity={active ? 1 : 0}>STORED</text>
      </g>
      <circle cx="396" cy="289" r="4.5" fill="#b99457" stroke="#8a734b" />
      <circle cx="396" cy="289" r="2.9" className="concept-study__led" fill={active ? "#ffcb68" : "#8f773e"} stroke="none" />
    </g>
  </g>;
}

const studies = {
  a24: { mode: "mechanical", index: "01", title: "Off-screen", action: "Look behind the scene", rest: "The frame hides its making", reveal: "A director’s viewpoint, revealed", motion: "SCENIC FLAT / SLIDE", description: "A miniature film set. Pressing moves one scenic flat aside to reveal a stationary director’s chair and camera." },
  airbnb: { mode: "mechanical", index: "02", title: "A place is made", action: "Make a place", rest: "Someone is already expected", reveal: "One more place at the table", motion: "SPARE CHAIR / SLIDE", description: "A miniature dining corner with two cups. Pressing moves one spare chair toward the table." },
  tesla: { mode: "electronic", index: "03", title: "Stored afternoon", action: "Try the simulated response", rest: "The useful part of a sunny day", reveal: "A stored afternoon, simulated", motion: "BUTTON / SIMULATED RESPONSE", description: "An illustrated electronic concept: a fixed, two-level solar-roof home with exposed amber storage and a proposed enclosed USB-powered controller. One round button sits beside a small blank display and one amber LED. Pressing shows a sample STORED display message and lights the indicator together; releasing resets them. The house, energy route and storage stay still. This is a local visual simulation, with no connected hardware, network request or AI response." },
};

export function ConceptStudy({ kind, className = "" }: ConceptStudyProps) {
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId().replace(/:/g, "");
  const study = studies[kind];
  const electronic = study.mode === "electronic";
  const clearTimer = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  const reset = () => { clearTimer(); setActive(false); };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    setActive(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, [kind]);

  return <figure className={`concept-study concept-study--${kind} ${active ? "is-pressed" : ""} ${className}`}>
    <div className="concept-study__meta" aria-hidden="true"><span>STUDY {study.index} / {kind.toUpperCase()}</span><span>{electronic ? "ILLUSTRATED SIMULATION" : "ONE PRESS. ONE REVEAL."}</span></div>
    <div className="concept-study__canvas">
      <svg viewBox="0 0 520 370" role="img" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
        <title id={`${id}-title`}>{`${study.title}: interactive concept study`}</title>
        <desc id={`${id}-description`}>{study.description} This is an illustrated design proposal, not a tested physical prototype.</desc>
        <defs>
          <filter id={`${id}-shadow`} x="-30%" y="-50%" width="160%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
          <linearGradient id={`${id}-base`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#e2e2d5" /><stop offset="100%" stopColor="#b9c2aa" /></linearGradient>
        </defs>
        <ellipse cx="282" cy={electronic ? 331 : 306} rx="172" ry={electronic ? 20 : 31} fill="#596343" opacity="0.18" filter={`url(#${id}-shadow)`} />
        {!electronic && <g className="concept-study__guides" fill="none" stroke="#7e8970" strokeWidth="0.55" opacity="0.5">
          <polyline points="86,248 307,341 480,268" />
          <path d="M82 253l8-10m213 103l8-10m165-63l8-10" />
        </g>}
        {!electronic && <>
          <Box x={0} y={0} z={0} w={220} d={160} h={18} top={`url(#${id}-base)`} front="#bdc6ad" side="#8e9b80" />
          <g opacity="0.6" stroke="#59664d" strokeWidth="0.7"><polyline points={points([0, 160, 6], [220, 160, 6], [220, 0, 6])} fill="none" /></g>
        </>}
        {kind === "a24" ? <Cinema active={active} /> : kind === "airbnb" ? <Home active={active} /> : <Energy active={active} />}
        {!electronic && <>
          <Box x={174} y={121} z={18} w={31} d={26} h={2} top="#596747" front="#354428" side="#27371e" />
          <g className="concept-study__cap" style={{ transform: active ? "translateY(5px)" : "translateY(0)" } as CSSProperties}>
            <Box x={176} y={123} z={20} w={27} d={22} h={7} top="#e4f2a3" front="#bbc97d" side="#8f9f59" />
            <polyline points={points([184, 129, 27.5], [194, 129, 27.5], [194, 138, 27.5])} stroke="#596840" strokeWidth="1.1" fill="none" />
          </g>
        </>}
        <text x={electronic ? 274 : 321} y={electronic ? 362 : 347} transform={electronic ? undefined : "rotate(-23 321 347)"} className="concept-study__dimension">{electronic ? "USB-POWERED · PROPOSED" : "84 MM · PROPOSED"}</text>
      </svg>
    </div>
    <figcaption className="concept-study__controls">
      <div className="concept-study__caption">
        <span className="concept-study__motion">{study.motion}</span>
        <span className="concept-study__state" aria-live="polite" aria-atomic="true">{active ? study.reveal : study.rest}</span>
        <span className="concept-study__hint">{electronic ? "Hold for sample response · release to reset" : "Hold to explore · release to reset"}</span>
      </div>
      <button
        type="button"
        className="concept-study__push"
        aria-label={`${study.action}. ${electronic ? "Hold for a simulated display and LED response" : "Hold to reveal"}; release to reset. Keyboard activation plays one cycle.`}
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
          timer.current = setTimeout(() => { timer.current = null; setActive(false); }, 1300);
        }}
      >
        <span aria-hidden="true" className="concept-study__push-face">↓</span>
        <span className="concept-study__push-label">PRESS</span>
      </button>
    </figcaption>
    <p className="concept-study__disclaimer">{electronic ? "Illustrated simulation · no live hardware or AI" : "Independent concept · mechanism unverified"}</p>
  </figure>;
}

export default ConceptStudy;
