import { motion } from 'framer-motion';

interface LevelVisualProps {
  levelId: number;
}

export function LevelVisual({ levelId }: LevelVisualProps) {
  // Render different chibi visuals based on level
  switch (levelId) {
    case 1:
      return <CoffeeShopVisual />;
    case 2:
      return <GroupProjectVisual />;
    case 3:
      return <TrafficMergeVisual />;
    case 4:
      return <LastSliceVisual />;
    case 5:
      return <CorporateLadderVisual />;
    case 6:
      return <ParachuteVisual />;
    case 7:
      return <HostageExchangeVisual />;
    case 8:
      return <NuclearButtonVisual />;
    case 9:
      return <AlienZooVisual />;
    case 10:
      return <SimulationRebootVisual />;
    default:
      return <CoffeeShopVisual />;
  }
}

// Level 1: Coffee Shop - Two chibis seeing $10 bill
function CoffeeShopVisual() {
  return (
    <motion.svg viewBox="0 0 200 120" className="w-full h-48 md:h-56">
      <ellipse cx="100" cy="110" rx="90" ry="10" fill="hsl(var(--muted))" opacity="0.3" />
      {/* $10 Bill */}
      <motion.g animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity }}>
        <rect x="80" y="85" width="40" height="20" rx="2" fill="hsl(150 50% 70%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        <text x="100" y="98" textAnchor="middle" fontSize="10" fontWeight="bold" fill="hsl(var(--foreground))">$10</text>
      </motion.g>
      {/* Left chibi reaching */}
      <g>
        <ellipse cx="50" cy="55" rx="22" ry="20" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        <path d="M30 48 Q34 30 50 26 Q66 30 70 48" fill="hsl(150 45% 65%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        <circle cx="44" cy="54" r="3" fill="hsl(var(--foreground))" />
        <circle cx="56" cy="54" r="3" fill="hsl(var(--foreground))" />
        <path d="M45 64 Q50 68 55 64" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="none" />
        <path d="M65 70 Q78 80 85 85" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      {/* Right chibi */}
      <g>
        <ellipse cx="150" cy="55" rx="22" ry="20" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        <path d="M130 48 Q134 30 150 26 Q166 30 170 48" fill="hsl(350 60% 75%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        <circle cx="144" cy="54" r="3" fill="hsl(var(--foreground))" />
        <circle cx="156" cy="54" r="3" fill="hsl(var(--foreground))" />
        <path d="M145 64 Q150 68 155 64" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="none" />
        <path d="M135 70 Q122 80 115 85" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </motion.svg>
  );
}

// Level 2: Group Project
function GroupProjectVisual() {
  return (
    <motion.svg viewBox="0 0 200 120" className="w-full h-48 md:h-56">
      {/* Left: Working chibi */}
      <g>
        <rect x="20" y="70" width="60" height="40" rx="3" fill="hsl(220 30% 90%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        <rect x="30" y="60" width="40" height="25" rx="2" fill="hsl(220 40% 30%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        <ellipse cx="50" cy="45" rx="18" ry="16" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        <ellipse cx="44" cy="48" rx="2" ry="3" fill="hsl(var(--foreground))" />
        <ellipse cx="56" cy="48" rx="2" ry="3" fill="hsl(var(--foreground))" />
        <ellipse cx="38" cy="42" rx="8" ry="3" fill="hsl(270 40% 60%)" opacity="0.5" />
        <ellipse cx="62" cy="42" rx="8" ry="3" fill="hsl(270 40% 60%)" opacity="0.5" />
      </g>
      {/* Right: Sleeping chibi */}
      <g>
        <rect x="120" y="75" width="60" height="35" rx="5" fill="hsl(220 30% 85%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        <ellipse cx="150" cy="70" rx="20" ry="18" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        <path d="M142 70 Q148 66 154 70" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" />
        <motion.text x="175" y="55" fontSize="14" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }}>💤</motion.text>
      </g>
    </motion.svg>
  );
}

// Level 3-10: Simplified visuals for brevity
function TrafficMergeVisual() {
  return (
    <motion.svg viewBox="0 0 200 120" className="w-full h-48 md:h-56">
      <path d="M0 80 L200 80" stroke="hsl(var(--foreground))" strokeWidth="2" strokeDasharray="10 5" />
      <motion.g animate={{ x: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
        <ellipse cx="60" cy="70" rx="25" ry="15" fill="hsl(200 60% 70%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        <circle cx="50" cy="80" r="6" fill="hsl(var(--foreground))" />
        <circle cx="70" cy="80" r="6" fill="hsl(var(--foreground))" />
        <ellipse cx="60" cy="62" rx="8" ry="6" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="1" />
      </motion.g>
      <motion.g animate={{ x: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
        <ellipse cx="140" cy="70" rx="25" ry="15" fill="hsl(0 60% 70%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        <circle cx="130" cy="80" r="6" fill="hsl(var(--foreground))" />
        <circle cx="150" cy="80" r="6" fill="hsl(var(--foreground))" />
        <ellipse cx="140" cy="62" rx="8" ry="6" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="1" />
      </motion.g>
    </motion.svg>
  );
}

function LastSliceVisual() {
  return (
    <motion.svg viewBox="0 0 200 120" className="w-full h-48 md:h-56">
      <motion.g animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ transformOrigin: '100px 60px' }}>
        <path d="M100 30 L130 90 L70 90 Z" fill="hsl(45 90% 65%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        <circle cx="90" cy="70" r="5" fill="hsl(0 70% 50%)" />
        <circle cx="105" cy="55" r="4" fill="hsl(0 70% 50%)" />
        <circle cx="100" cy="75" r="4" fill="hsl(0 70% 50%)" />
      </motion.g>
      <ellipse cx="50" cy="90" rx="18" ry="16" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <ellipse cx="150" cy="90" rx="18" ry="16" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
    </motion.svg>
  );
}

function CorporateLadderVisual() {
  return (
    <motion.svg viewBox="0 0 200 120" className="w-full h-48 md:h-56">
      <motion.ellipse cx="100" cy="30" rx="60" ry="30" fill="hsl(0 0% 20%)" opacity="0.3" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} />
      <ellipse cx="70" cy="90" rx="16" ry="14" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <ellipse cx="130" cy="90" rx="16" ry="14" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <path d="M78 85 L95 70" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" />
    </motion.svg>
  );
}

function ParachuteVisual() {
  return (
    <motion.svg viewBox="0 0 200 120" className="w-full h-48 md:h-56">
      <motion.g animate={{ y: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
        <ellipse cx="100" cy="25" rx="35" ry="20" fill="hsl(45 80% 70%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        <path d="M65 25 L80 70" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        <path d="M135 25 L120 70" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        <ellipse cx="100" cy="80" rx="18" ry="16" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
      </motion.g>
      <motion.ellipse cx="150" cy="95" rx="16" ry="14" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" animate={{ y: [0, 8, 0] }} transition={{ duration: 1, repeat: Infinity }} />
    </motion.svg>
  );
}

function HostageExchangeVisual() {
  return (
    <motion.svg viewBox="0 0 200 120" className="w-full h-48 md:h-56">
      <rect x="0" y="100" width="200" height="20" fill="hsl(30 20% 50%)" />
      <ellipse cx="50" cy="70" rx="20" ry="18" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <rect x="60" y="85" width="15" height="12" fill="hsl(30 30% 40%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
      <ellipse cx="150" cy="70" rx="20" ry="18" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <rect x="125" y="85" width="15" height="12" fill="hsl(30 30% 40%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
    </motion.svg>
  );
}

function NuclearButtonVisual() {
  return (
    <motion.svg viewBox="0 0 200 120" className="w-full h-48 md:h-56">
      <rect x="60" y="70" width="80" height="40" rx="3" fill="hsl(30 30% 50%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <motion.circle cx="100" cy="85" r="15" fill="hsl(0 80% 50%)" stroke="hsl(var(--foreground))" strokeWidth="2" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }} />
      <ellipse cx="100" cy="45" rx="22" ry="20" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <motion.ellipse cx="92" cy="42" rx="3" ry="4" fill="hsl(var(--foreground))" animate={{ cy: [42, 40, 42] }} transition={{ duration: 0.3, repeat: Infinity }} />
      <motion.ellipse cx="108" cy="42" rx="3" ry="4" fill="hsl(var(--foreground))" animate={{ cy: [42, 40, 42] }} transition={{ duration: 0.3, repeat: Infinity }} />
    </motion.svg>
  );
}

function AlienZooVisual() {
  return (
    <motion.svg viewBox="0 0 200 120" className="w-full h-48 md:h-56">
      <rect x="30" y="30" width="140" height="80" rx="5" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" strokeDasharray="5 3" />
      <ellipse cx="60" cy="50" rx="20" ry="25" fill="hsl(120 60% 60%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <ellipse cx="55" cy="45" rx="3" ry="5" fill="hsl(0 0% 10%)" />
      <ellipse cx="65" cy="45" rx="3" ry="5" fill="hsl(0 0% 10%)" />
      <motion.ellipse cx="60" cy="85" rx="12" ry="8" fill="hsl(280 60% 50%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }} />
      <ellipse cx="130" cy="80" rx="16" ry="14" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <ellipse cx="160" cy="80" rx="16" ry="14" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
    </motion.svg>
  );
}

function SimulationRebootVisual() {
  return (
    <motion.svg viewBox="0 0 200 120" className="w-full h-48 md:h-56">
      {[...Array(20)].map((_, i) => (
        <motion.text key={i} x={(i % 10) * 20 + 10} y={Math.floor(i / 10) * 60 + 30} fontSize="10" fill="hsl(120 80% 50%)" opacity="0.3" animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}>
          {Math.random() > 0.5 ? '1' : '0'}
        </motion.text>
      ))}
      <motion.g animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 0.5, repeat: Infinity }}>
        <ellipse cx="70" cy="70" rx="22" ry="20" fill="none" stroke="hsl(120 80% 50%)" strokeWidth="2" strokeDasharray="3 2" />
        <ellipse cx="130" cy="70" rx="22" ry="20" fill="none" stroke="hsl(0 80% 50%)" strokeWidth="2" strokeDasharray="3 2" />
      </motion.g>
    </motion.svg>
  );
}
