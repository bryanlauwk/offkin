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
          <ellipse cx="70" cy="72" rx="30" ry="26" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Hair - FILLED with warm brown and messy stressed strands */}
          <path 
            d="M42 58 Q45 35 70 30 Q95 35 98 58 L95 55 Q90 42 70 38 Q50 42 47 55 Z" 
            className="hair-fill"
            strokeWidth="2"
          />
          {/* Messy stress strands */}
          <path d="M48 50 Q45 42 50 38" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M92 50 Q95 42 90 38" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          {/* Hair highlights */}
          <path d="M55 42 Q65 35 75 38" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
          {/* Hair tuft - panicked */}
          <motion.path 
            d="M70 30 Q72 22 76 28"
            className="stick-line" 
            fill="none" 
            strokeWidth="2.5" 
            strokeLinecap="round"
            animate={{ rotate: [-5, 5, -5] }}
            style={{ transformOrigin: '70px 30px' }}
            transition={{ duration: 0.3, repeat: Infinity }}
          />
          
          {/* Worried face looking at phone */}
          <motion.g
            animate={{ y: [0, 1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Eyes - WIDE with worry, larger */}
            <ellipse cx="58" cy="70" rx="8" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <ellipse cx="82" cy="70" rx="8" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            {/* Tiny pupils - looking up at phone in panic */}
            <circle cx="58" cy="68" r="3" className="stick-fill" />
            <circle cx="82" cy="68" r="3" className="stick-fill" />
            {/* Eye shines */}
            <circle cx="56" cy="66" r="1.5" fill="hsl(var(--background))" />
            <circle cx="80" cy="66" r="1.5" fill="hsl(var(--background))" />
          </motion.g>
          
          {/* Worried eyebrows - very angled */}
          <path d="M50 58 Q58 52 66 60" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M74 60 Q82 52 90 58" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Nose */}
          <path d="M70 76 Q72 80 70 82" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Worried mouth - open grimace */}
          <ellipse cx="70" cy="90" rx="7" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          {/* Teeth showing in grimace */}
          <line x1="65" y1="90" x2="75" y2="90" className="stick-line" strokeWidth="1" />
          
          {/* Multiple sweat drops */}
          <motion.g
            animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeIn" }}
          >
            <path d="M40 62 Q38 70 40 74 Q42 70 40 62Z" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          </motion.g>
          <motion.g
            animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeIn", delay: 0.4 }}
          >
            <path d="M100 68 Q98 76 100 80 Q102 76 100 68Z" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          </motion.g>
          <motion.g
            animate={{ y: [0, 6, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeIn", delay: 0.2 }}
          >
            <path d="M44 75 Q42 80 44 83 Q46 80 44 75Z" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
          </motion.g>
          
          {/* Cheek blush - stressed */}
          <ellipse cx="48" cy="80" rx="5" ry="3" fill="hsl(0 60% 75%)" opacity="0.4" />
          <ellipse cx="92" cy="80" rx="5" ry="3" fill="hsl(0 60% 75%)" opacity="0.4" />
        </g>
        
        {/* Phone being held - larger and more detailed */}
        <g>
          <rect x="55" y="42" width="30" height="52" rx="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="2.5" />
          {/* Screen */}
          <rect x="58" y="48" width="24" height="40" fill="hsl(var(--muted))" opacity="0.3" />
          
          {/* Battery icon on screen */}
          <rect x="62" y="54" width="16" height="26" rx="2" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          <rect x="67" y="50" width="6" height="4" rx="1" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          
          {/* Battery level - 1% red sliver with pulse */}
          <motion.rect
            x="64"
            y="76"
            width="12"
            height="2"
            fill="hsl(var(--destructive))"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* 1% text */}
          <motion.text 
            x="70" 
            y="70" 
            className="stick-fill" 
            fontSize="8" 
            fontWeight="bold"
            textAnchor="middle"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
          >
            1%
          </motion.text>
        </g>
        
        {/* Lightning bolt / charging desire */}
        <motion.g
          animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M145 48 L138 68 L148 64 L140 88 L158 58 L148 62 L158 48Z" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        </motion.g>
        
        {/* Outlet on wall - what they want */}
        <g>
          <rect x="158" y="100" width="28" height="40" rx="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="2.5" />
          <rect x="164" y="112" width="6" height="10" rx="1" className="stick-fill" />
          <rect x="176" y="112" width="6" height="10" rx="1" className="stick-fill" />
          {/* Outlet glow */}
          <motion.ellipse
            cx="172"
            cy="120"
            rx="20"
            ry="15"
            fill="hsl(var(--muted))"
            opacity="0.2"
            animate={{ opacity: [0.1, 0.3, 0.1], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </g>
      </svg>
    </div>
  );
}
