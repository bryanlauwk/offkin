import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function TVVisual() {
  const [showSpoiler, setShowSpoiler] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowSpoiler(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <svg viewBox="0 0 220 160" className="w-full h-full max-w-md">
        {/* Floor */}
        <ellipse cx="110" cy="155" rx="100" ry="8" fill="hsl(var(--muted))" opacity="0.2" />
        
        {/* TV on stand */}
        <g>
          {/* TV Stand */}
          <rect x="85" y="140" width="50" height="8" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          <rect x="105" y="148" width="10" height="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* TV Frame */}
          <rect x="60" y="70" width="100" height="70" rx="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="2.5" />
          
          {/* Screen */}
          <rect x="65" y="75" width="90" height="55" fill="hsl(var(--muted))" opacity="0.3" />
          
          {/* Static noise pattern */}
          <motion.g
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          >
            {[...Array(8)].map((_, i) => (
              <line 
                key={i}
                x1="65" 
                y1={78 + i * 7} 
                x2="155" 
                y2={78 + i * 7} 
                stroke="hsl(var(--foreground))" 
                strokeWidth="0.5" 
                opacity={0.2 + Math.random() * 0.3}
              />
            ))}
          </motion.g>
          
          {/* Spoiler alert overlay */}
          <motion.g
            animate={{ opacity: showSpoiler ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <rect x="80" y="95" width="60" height="20" fill="hsl(var(--destructive))" rx="2" />
            <text x="110" y="108" fill="hsl(var(--background))" fontSize="6" textAnchor="middle" fontWeight="bold">SPOILER!</text>
          </motion.g>
        </g>
        
        {/* Couch */}
        <path d="M10 145 Q5 140 8 130 L12 130 L12 145 Z" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        <rect x="12" y="125" width="45" height="22" rx="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        <path d="M57 145 Q62 140 59 130 L55 130 L55 145 Z" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Chibi person on couch watching - leaning forward eagerly */}
        <g>
          {/* Body sitting - leaning forward */}
          <ellipse cx="35" cy="115" rx="16" ry="11" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" transform="rotate(-10 35 115)" />
          
          {/* Legs on couch */}
          <path d="M25 125 Q20 132 22 138" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M45 125 Q50 132 48 138" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Arm holding remote up excitedly */}
          <path d="M48 112 Q58 100 62 105" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Remote */}
          <rect x="58" y="100" width="8" height="14" rx="2" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <circle cx="62" cy="105" r="1.5" className="stick-fill" />
          
          {/* Other arm on knee */}
          <path d="M22 112 Q15 118 18 125" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Head - eager expression, leaning toward TV */}
          <ellipse cx="35" cy="90" rx="20" ry="18" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Hair - FILLED */}
          <path 
            d="M17 80 Q20 62 35 58 Q50 62 53 80 L50 78 Q48 68 35 65 Q22 68 20 78 Z" 
            className="hair-fill"
            strokeWidth="2"
          />
          {/* Hair highlights */}
          <path d="M25 68 Q32 62 40 65" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
          {/* Hair tuft */}
          <path d="M35 58 Q37 52 40 56" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Face - VERY excited/anticipating, looking at TV */}
          <motion.g
            animate={{ x: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* WIDE sparkly eyes */}
            <ellipse cx="28" cy="88" rx="7" ry="9" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <ellipse cx="42" cy="88" rx="7" ry="9" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            {/* Pupils looking at TV */}
            <ellipse cx="30" cy="89" rx="3" ry="4" className="stick-fill" />
            <ellipse cx="44" cy="89" rx="3" ry="4" className="stick-fill" />
            {/* Multiple eye shines - sparkly */}
            <circle cx="28" cy="86" r="1.5" fill="hsl(var(--background))" />
            <circle cx="31" cy="90" r="1" fill="hsl(var(--background))" />
            <circle cx="42" cy="86" r="1.5" fill="hsl(var(--background))" />
            <circle cx="45" cy="90" r="1" fill="hsl(var(--background))" />
          </motion.g>
          
          {/* Raised eyebrows - very high with anticipation */}
          <path d="M21 77 Q28 72 35 78" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M35 78 Q42 72 49 77" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Small nose */}
          <path d="M35 93 Q36 96 35 98" className="stick-line" fill="none" strokeWidth="1" strokeLinecap="round" />
          
          {/* Excited open mouth - big smile */}
          <motion.path 
            d="M28 104 Q35 110 42 104" 
            className="stick-line" 
            fill="none" 
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ d: ["M28 104 Q35 110 42 104", "M28 104 Q35 108 42 104", "M28 104 Q35 110 42 104"] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          
          {/* Cheek blush */}
          <ellipse cx="18" cy="94" rx="4" ry="2.5" fill="hsl(0 60% 75%)" opacity="0.4" />
          <ellipse cx="52" cy="94" rx="4" ry="2.5" fill="hsl(0 60% 75%)" opacity="0.4" />
        </g>
        
        {/* Popcorn bowl - with pieces spilling */}
        <g>
          <path d="M170 135 L175 150 L195 150 L200 135 Z" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          {/* Red stripes on bowl */}
          <line x1="178" y1="137" x2="180" y2="148" stroke="hsl(var(--destructive))" strokeWidth="2" opacity="0.4" />
          <line x1="188" y1="136" x2="189" y2="149" stroke="hsl(var(--destructive))" strokeWidth="2" opacity="0.4" />
          {/* Popcorn pieces */}
          <motion.g
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, staggerChildren: 0.1 }}
          >
            <circle cx="180" cy="132" r="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <circle cx="187" cy="130" r="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <circle cx="194" cy="132" r="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <circle cx="183" cy="127" r="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
            <circle cx="190" cy="125" r="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
          </motion.g>
          {/* Spilled popcorn pieces */}
          <motion.g
            animate={{ rotate: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <circle cx="165" cy="148" r="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
            <circle cx="205" cy="146" r="2.5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
          </motion.g>
        </g>
      </svg>
    </div>
  );
}
