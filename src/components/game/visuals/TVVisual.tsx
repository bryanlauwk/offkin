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
        
        {/* Chibi person on couch watching */}
        <g>
          {/* Body sitting */}
          <ellipse cx="35" cy="118" rx="15" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Legs on couch */}
          <path d="M25 125 Q20 130 22 135" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M45 125 Q50 130 48 135" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Arm holding remote */}
          <path d="M48 115 Q55 105 58 110" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Remote */}
          <rect x="55" y="106" width="8" height="12" rx="1" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <circle cx="59" cy="110" r="1" className="stick-fill" />
          
          {/* Other arm on lap */}
          <path d="M22 115 Q15 120 18 125" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Head - eager expression */}
          <ellipse cx="35" cy="95" rx="18" ry="16" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Hair */}
          <path d="M20 85 Q22 70 35 65 Q48 70 50 85" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M23 80 Q28 72 35 68" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Face - excited/anticipating, looking at TV */}
          <motion.g
            animate={{ x: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Wide eyes */}
            <ellipse cx="29" cy="93" rx="5" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <ellipse cx="41" cy="93" rx="5" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            {/* Pupils looking at TV */}
            <circle cx="31" cy="93" r="2.5" className="stick-fill" />
            <circle cx="43" cy="93" r="2.5" className="stick-fill" />
            {/* Eye shine */}
            <circle cx="30" cy="91" r="0.8" fill="hsl(var(--background))" />
            <circle cx="42" cy="91" r="0.8" fill="hsl(var(--background))" />
          </motion.g>
          
          {/* Raised eyebrows - anticipation */}
          <path d="M24 85 Q29 82 34 85" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M36 85 Q41 82 46 85" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Small nose */}
          <path d="M35 96 Q36 99 35 100" className="stick-line" fill="none" strokeWidth="1" strokeLinecap="round" />
          
          {/* Excited open mouth */}
          <motion.ellipse 
            cx="35" 
            cy="105" 
            rx="4" 
            ry="3" 
            className="stick-line" 
            fill="hsl(var(--background))" 
            strokeWidth="1.5"
            animate={{ ry: [3, 2, 3] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          
          {/* Cheek blush */}
          <ellipse cx="22" cy="98" rx="3" ry="2" fill="hsl(var(--muted))" opacity="0.35" />
          <ellipse cx="48" cy="98" rx="3" ry="2" fill="hsl(var(--muted))" opacity="0.35" />
        </g>
        
        {/* Popcorn bowl */}
        <g>
          <path d="M170 135 L175 150 L195 150 L200 135 Z" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          {/* Popcorn pieces */}
          <motion.g
            animate={{ y: [0, -1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, staggerChildren: 0.1 }}
          >
            <circle cx="180" cy="132" r="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
            <circle cx="186" cy="130" r="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
            <circle cx="192" cy="132" r="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
            <circle cx="183" cy="128" r="2.5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
            <circle cx="189" cy="127" r="2.5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
          </motion.g>
        </g>
      </svg>
    </div>
  );
}
