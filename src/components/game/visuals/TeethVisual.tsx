import { motion } from 'framer-motion';

export function TeethVisual() {
  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <svg viewBox="0 0 200 160" className="w-full h-full max-w-md">
        {/* Ground */}
        <ellipse cx="100" cy="155" rx="80" ry="8" fill="hsl(var(--muted))" opacity="0.2" />
        
        {/* Chibi person in dental distress */}
        <g>
          {/* Body */}
          <ellipse cx="95" cy="128" rx="22" ry="16" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Legs */}
          <path d="M80 140 Q72 153 76 160" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M110 140 Q118 153 114 160" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Arms - one hand pressing cheek in pain */}
          <path d="M75 122 Q60 110 52 100" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          {/* Other arm raised dramatically */}
          <path d="M115 122 Q135 105 145 95" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Hand pressing on cheek */}
          <ellipse cx="50" cy="98" rx="8" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Head - tilted in pain */}
          <ellipse cx="80" cy="72" rx="34" ry="30" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Hair - FILLED with warm brown */}
          <path 
            d="M48 55 Q55 30 80 25 Q105 30 112 55 L108 52 Q100 38 80 35 Q60 38 52 52 Z" 
            className="hair-fill"
            strokeWidth="2"
          />
          {/* Hair highlights */}
          <path d="M60 40 Q72 32 85 35" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
          {/* Messy hair from distress */}
          <path d="M80 25 Q82 18 86 24" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M52 48 Q48 42 54 38" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Pained face */}
          <motion.g
            animate={{ x: [-2, 2, -2] }}
            transition={{ duration: 0.12, repeat: Infinity }}
          >
            {/* Squeezed eyes in pain - X shaped from agony */}
            <path d="M62 65 L72 75" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M62 75 L72 65" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M88 65 L98 75" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M88 75 L98 65" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
            
            {/* Pain lines radiating from eyes */}
            <path d="M58 62 L54 56" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M76 62 L78 56" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M84 62 L82 56" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M102 62 L106 56" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          </motion.g>
          
          {/* Anguished eyebrows */}
          <path d="M60 56 Q67 50 74 58" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M86 58 Q93 50 100 56" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Small nose */}
          <path d="M80 78 Q81 82 80 85" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Wide open mouth showing teeth problem */}
          <ellipse cx="80" cy="94" rx="14" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Upper teeth row */}
          <g>
            {[...Array(6)].map((_, i) => (
              <rect 
                key={`upper-${i}`}
                x={68 + i * 5} 
                y="85" 
                width="4" 
                height="6" 
                rx="1"
                className="stick-line" 
                fill="hsl(var(--background))" 
                strokeWidth="1.5"
              />
            ))}
          </g>
          
          {/* Lower teeth with kernel stuck */}
          <g>
            {[...Array(6)].map((_, i) => (
              <rect 
                key={`lower-${i}`}
                x={68 + i * 5} 
                y="98" 
                width="4" 
                height="5" 
                rx="1"
                className="stick-line" 
                fill="hsl(var(--background))" 
                strokeWidth="1.5"
              />
            ))}
            {/* Popcorn kernel stuck - pulsing red */}
            <motion.circle
              cx="83"
              cy="99"
              r="3"
              fill="hsl(var(--destructive))"
              className="stick-line"
              strokeWidth="1.5"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            />
          </g>
          
          {/* Swollen cheek where hand is pressing */}
          <ellipse cx="52" cy="82" rx="10" ry="7" fill="hsl(0 50% 70%)" opacity="0.5" />
          
          {/* Tear of pain streaming */}
          <motion.path
            d="M58 72 Q55 80 58 85 Q61 80 58 72Z"
            className="stick-line"
            fill="hsl(var(--background))"
            strokeWidth="1.5"
            animate={{ y: [0, 12], opacity: [1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeIn" }}
          />
          
          {/* Other cheek blush */}
          <ellipse cx="105" cy="80" rx="6" ry="3.5" fill="hsl(0 60% 75%)" opacity="0.4" />
        </g>
        
        {/* Pain indicators floating */}
        <motion.g
          animate={{ y: [-3, 3, -3], opacity: [0.7, 1, 0.7], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          <text x="125" y="52" className="stick-fill" fontSize="14" fontWeight="bold">OW!</text>
        </motion.g>
        
        {/* Lightning bolt pain symbols */}
        <motion.g
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.25, repeat: Infinity }}
        >
          <path d="M38 68 L34 78 L40 75 L36 88" className="stick-line" fill="none" strokeWidth="2" />
        </motion.g>
        <motion.g
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.25, repeat: Infinity, delay: 0.12 }}
        >
          <path d="M118 58 L114 70 L120 67 L116 80" className="stick-line" fill="none" strokeWidth="2" />
        </motion.g>
        <motion.g
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.3, repeat: Infinity, delay: 0.2 }}
        >
          <path d="M130 75 L127 82 L132 80 L128 90" className="stick-line" fill="none" strokeWidth="1.5" />
        </motion.g>
        
        {/* Popcorn box nearby - the culprit */}
        <g>
          <path d="M155 125 L160 152 L188 152 L193 125 Z" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          {/* Red stripes */}
          <line x1="165" y1="127" x2="167" y2="150" stroke="hsl(var(--destructive))" strokeWidth="2.5" opacity="0.5" />
          <line x1="175" y1="126" x2="176" y2="151" stroke="hsl(var(--destructive))" strokeWidth="2.5" opacity="0.5" />
          <line x1="185" y1="127" x2="186" y2="150" stroke="hsl(var(--destructive))" strokeWidth="2.5" opacity="0.5" />
          {/* Popcorn pieces */}
          <circle cx="170" cy="122" r="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <circle cx="180" cy="120" r="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <circle cx="175" cy="115" r="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}
