import { motion } from 'framer-motion';

export function BatteryVisual() {
  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <svg viewBox="0 0 200 160" className="w-full h-full max-w-md">
        {/* Ground shadow */}
        <ellipse cx="100" cy="150" rx="80" ry="8" fill="hsl(var(--muted))" opacity="0.2" />
        
        {/* Chibi person anxiously holding phone */}
        <g>
          {/* Body */}
          <ellipse cx="70" cy="130" rx="25" ry="18" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Legs */}
          <path d="M55 142 Q50 155 52 160" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M85 142 Q90 155 88 160" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Arms holding phone up */}
          <path d="M55 125 Q45 110 55 95" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M85 125 Q95 110 85 95" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Hands */}
          <ellipse cx="55" cy="92" rx="6" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          <ellipse cx="85" cy="92" rx="6" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Head */}
          <ellipse cx="70" cy="75" rx="28" ry="25" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Hair */}
          <path d="M45 60 Q50 40 70 35 Q90 40 95 60" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M50 55 Q55 48 65 45" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M90 55 Q85 48 75 45" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          {/* Hair tuft */}
          <path d="M70 35 Q72 28 75 33" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Worried face looking at phone */}
          <motion.g
            animate={{ y: [0, 1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Eyes - wide with worry */}
            <ellipse cx="60" cy="72" rx="6" ry="8" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <ellipse cx="80" cy="72" rx="6" ry="8" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            {/* Pupils - looking up at phone */}
            <circle cx="60" cy="70" r="3" className="stick-fill" />
            <circle cx="80" cy="70" r="3" className="stick-fill" />
            {/* Eye shine */}
            <circle cx="59" cy="68" r="1" fill="hsl(var(--background))" />
            <circle cx="79" cy="68" r="1" fill="hsl(var(--background))" />
          </motion.g>
          
          {/* Worried eyebrows */}
          <path d="M54 62 Q60 58 66 64" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M74 64 Q80 58 86 62" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Nose */}
          <path d="M70 76 Q72 80 70 82" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Worried mouth - open */}
          <ellipse cx="70" cy="90" rx="5" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          
          {/* Sweat drops */}
          <motion.g
            animate={{ y: [0, 5, 0], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M42 65 Q40 70 42 72 Q44 70 42 65Z" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
          </motion.g>
          <motion.g
            animate={{ y: [0, 5, 0], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <path d="M98 70 Q96 75 98 77 Q100 75 98 70Z" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
          </motion.g>
          
          {/* Cheek blush */}
          <ellipse cx="52" cy="80" rx="4" ry="2.5" fill="hsl(var(--muted))" opacity="0.35" />
          <ellipse cx="88" cy="80" rx="4" ry="2.5" fill="hsl(var(--muted))" opacity="0.35" />
        </g>
        
        {/* Phone being held - larger and more detailed */}
        <g>
          <rect x="55" y="45" width="30" height="50" rx="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          {/* Screen */}
          <rect x="58" y="50" width="24" height="38" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
          
          {/* Battery icon on screen */}
          <rect x="63" y="55" width="14" height="24" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <rect x="67" y="52" width="6" height="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
          
          {/* Battery level - 1% red sliver with pulse */}
          <motion.rect
            x="64"
            y="76"
            width="12"
            height="2"
            fill="hsl(var(--destructive))"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* 1% text */}
          <motion.text 
            x="70" 
            y="70" 
            className="stick-fill" 
            fontSize="6" 
            textAnchor="middle"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          >
            1%
          </motion.text>
        </g>
        
        {/* Lightning bolt / charging desire */}
        <motion.g
          animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M145 50 L140 65 L148 63 L142 80 L155 58 L147 60 L155 50Z" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        </motion.g>
        
        {/* Outlet on wall - what they want */}
        <g>
          <rect x="160" y="100" width="25" height="35" rx="2" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          <rect x="165" y="110" width="5" height="8" rx="1" className="stick-fill" />
          <rect x="175" y="110" width="5" height="8" rx="1" className="stick-fill" />
        </g>
      </svg>
    </div>
  );
}
