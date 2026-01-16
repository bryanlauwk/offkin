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
          <ellipse cx="100" cy="130" rx="22" ry="16" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Legs */}
          <path d="M85 142 Q78 155 82 160" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M115 142 Q122 155 118 160" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Arms - one hand on cheek */}
          <path d="M78 125 Q65 115 60 105" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          {/* Other arm raised dramatically */}
          <path d="M122 125 Q140 110 150 100" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Hand on cheek */}
          <ellipse cx="58" cy="102" rx="7" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Head - tilted in pain */}
          <ellipse cx="85" cy="75" rx="32" ry="28" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Hair */}
          <path d="M56 58 Q60 38 85 32 Q110 38 114 58" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M60 52 Q70 42 85 38" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M110 52 Q100 42 85 38" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          {/* Hair tuft */}
          <path d="M85 32 Q87 24 90 30" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Pained face */}
          <motion.g
            animate={{ x: [-1, 1, -1] }}
            transition={{ duration: 0.15, repeat: Infinity }}
          >
            {/* Squeezed eyes in pain */}
            <path d="M70 70 Q75 65 80 70" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M90 70 Q95 65 100 70" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
            
            {/* Pain lines from eyes */}
            <path d="M68 66 L65 62" className="stick-line" fill="none" strokeWidth="1" strokeLinecap="round" />
            <path d="M82 66 L84 62" className="stick-line" fill="none" strokeWidth="1" strokeLinecap="round" />
            <path d="M88 66 L86 62" className="stick-line" fill="none" strokeWidth="1" strokeLinecap="round" />
            <path d="M102 66 L105 62" className="stick-line" fill="none" strokeWidth="1" strokeLinecap="round" />
          </motion.g>
          
          {/* Pained eyebrows */}
          <path d="M68 62 Q75 58 82 64" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M88 64 Q95 58 102 62" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Small nose */}
          <path d="M85 78 Q86 82 85 84" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Open mouth showing teeth problem */}
          <ellipse cx="85" cy="92" rx="12" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Upper teeth */}
          <g>
            {[...Array(5)].map((_, i) => (
              <rect 
                key={`upper-${i}`}
                x={75 + i * 5} 
                y="85" 
                width="4" 
                height="5" 
                rx="0.5"
                className="stick-line" 
                fill="hsl(var(--background))" 
                strokeWidth="1"
              />
            ))}
          </g>
          
          {/* Lower teeth with kernel stuck */}
          <g>
            {[...Array(5)].map((_, i) => (
              <rect 
                key={`lower-${i}`}
                x={75 + i * 5} 
                y="95" 
                width="4" 
                height="4" 
                rx="0.5"
                className="stick-line" 
                fill="hsl(var(--background))" 
                strokeWidth="1"
              />
            ))}
            {/* Popcorn kernel stuck */}
            <motion.circle
              cx="87"
              cy="96"
              r="2.5"
              fill="hsl(var(--destructive))"
              className="stick-line"
              strokeWidth="1"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </g>
          
          {/* Swollen cheek */}
          <ellipse cx="58" cy="85" rx="8" ry="6" fill="hsl(var(--muted))" opacity="0.4" />
          
          {/* Tear of pain */}
          <motion.path
            d="M68 75 Q66 80 68 83 Q70 80 68 75Z"
            className="stick-line"
            fill="hsl(var(--background))"
            strokeWidth="1"
            animate={{ y: [0, 10], opacity: [1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeIn" }}
          />
          
          {/* Other cheek blush */}
          <ellipse cx="105" cy="82" rx="5" ry="3" fill="hsl(var(--muted))" opacity="0.35" />
        </g>
        
        {/* Pain indicators floating */}
        <motion.g
          animate={{ y: [-2, 2, -2], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <text x="130" y="55" className="stick-fill" fontSize="12" fontWeight="bold">OW!</text>
        </motion.g>
        
        {/* Lightning bolt pain symbols */}
        <motion.g
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        >
          <path d="M45 70 L42 78 L47 76 L44 85" className="stick-line" fill="none" strokeWidth="1.5" />
        </motion.g>
        <motion.g
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.3, repeat: Infinity, delay: 0.15 }}
        >
          <path d="M120 60 L117 68 L122 66 L119 75" className="stick-line" fill="none" strokeWidth="1.5" />
        </motion.g>
        
        {/* Popcorn box nearby */}
        <g>
          <path d="M155 125 L160 150 L185 150 L190 125 Z" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          {/* Stripes */}
          <line x1="163" y1="127" x2="165" y2="148" stroke="hsl(var(--destructive))" strokeWidth="2" opacity="0.5" />
          <line x1="172" y1="126" x2="173" y2="149" stroke="hsl(var(--destructive))" strokeWidth="2" opacity="0.5" />
          <line x1="181" y1="127" x2="182" y2="148" stroke="hsl(var(--destructive))" strokeWidth="2" opacity="0.5" />
          {/* Popcorn pieces */}
          <circle cx="168" cy="122" r="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
          <circle cx="177" cy="120" r="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
          <circle cx="172" cy="116" r="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}
