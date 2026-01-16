import { motion } from 'framer-motion';

interface StarvationVisualProps {
  className?: string;
}

export function StarvationVisual({ className = '' }: StarvationVisualProps) {
  return (
    <svg viewBox="0 0 200 160" className={`w-full max-w-xs ${className}`}>
      {/* Background */}
      <rect x="0" y="0" width="200" height="160" fill="hsl(var(--background))" />
      
      {/* Floor */}
      <ellipse cx="100" cy="145" rx="90" ry="12" fill="hsl(var(--muted))" opacity="0.2" />
      
      {/* Table */}
      <ellipse cx="120" cy="125" rx="55" ry="10" fill="hsl(var(--muted))" opacity="0.3" />
      
      {/* Plate */}
      <ellipse cx="130" cy="120" rx="28" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
      <ellipse cx="130" cy="118" rx="22" ry="4" fill="hsl(var(--muted))" opacity="0.2" />
      
      {/* Marshmallow - looks extra delicious */}
      <motion.g
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <path 
          d="M115 113 Q111 103 113 93 Q112 83 119 77 Q127 71 130 70 Q133 71 141 77 Q148 83 147 93 Q149 103 145 113 Q137 119 130 119 Q123 119 115 113Z" 
          stroke="hsl(30 20% 60%)" 
          fill="hsl(40 30% 96%)" 
          strokeWidth="2"
        />
        <ellipse cx="130" cy="73" rx="12" ry="6" stroke="hsl(30 20% 60%)" fill="hsl(40 30% 96%)" strokeWidth="2" />
        
        {/* Happy face */}
        <circle cx="124" cy="93" r="2.5" fill="hsl(30 25% 25%)" />
        <circle cx="136" cy="93" r="2.5" fill="hsl(30 25% 25%)" />
        <circle cx="123" cy="92" r="1" fill="hsl(0 0% 100%)" />
        <circle cx="135" cy="92" r="1" fill="hsl(0 0% 100%)" />
        <path d="M124 103 Q130 108 136 103" stroke="hsl(30 25% 25%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        
        {/* Rosy cheeks */}
        <motion.circle cx="118" cy="97" r="4" fill="hsl(350 70% 75%)" opacity="0.5" animate={{ opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <motion.circle cx="142" cy="97" r="4" fill="hsl(350 70% 75%)" opacity="0.5" animate={{ opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
        
        {/* Sparkles - extra tempting */}
        <motion.text x="155" y="78" className="fill-foreground" fontSize="10" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }}>✦</motion.text>
        <motion.text x="105" y="85" className="fill-foreground" fontSize="8" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}>✦</motion.text>
      </motion.g>

      {/* Starving chibi character - matching StartScreen style */}
      <motion.g
        animate={{ x: [-1, 1, -1] }}
        transition={{ duration: 0.4, repeat: Infinity }}
      >
        {/* Head - large chibi proportions with hollow look */}
        <ellipse cx="50" cy="60" rx="30" ry="26" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Sunken cheeks - subtle shading */}
        <ellipse cx="35" cy="68" rx="5" ry="7" fill="hsl(var(--muted))" opacity="0.15" />
        <ellipse cx="65" cy="68" rx="5" ry="7" fill="hsl(var(--muted))" opacity="0.15" />
        
        {/* Hair - FILLED */}
        <path 
          d="M22 50 Q26 30 50 24 Q74 30 78 50 Q72 38 50 32 Q30 38 25 50 Z" 
          className="hair-fill"
          strokeWidth="2"
        />
        {/* Hair highlights */}
        <path d="M30 38 Q42 30 55 34" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
        {/* Disheveled tuft */}
        <path d="M48 24 Q44 16 52 20" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Desperate eyes - wide, staring at marshmallow */}
        <ellipse cx="40" cy="58" rx="8" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <ellipse cx="60" cy="58" rx="8" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        {/* Pupils - large and fixated */}
        <motion.ellipse cx="43" cy="60" rx="4" ry="5" className="stick-fill" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
        <motion.ellipse cx="63" cy="60" rx="4" ry="5" className="stick-fill" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
        {/* Eye shines */}
        <circle cx="41" cy="57" r="2" fill="hsl(var(--background))" />
        <circle cx="44" cy="62" r="1" fill="hsl(var(--background))" />
        <circle cx="61" cy="57" r="2" fill="hsl(var(--background))" />
        <circle cx="64" cy="62" r="1" fill="hsl(var(--background))" />
        
        {/* Desperate eyebrows */}
        <path d="M32 50 Q40 46 48 52" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M52 52 Q60 46 68 50" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Drooling mouth */}
        <path d="M42 75 Q50 80 58 75" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <motion.path
          d="M50 80 Q51 88 49 96"
          stroke="hsl(200 80% 70%)"
          strokeWidth="2"
          fill="none"
          animate={{ y: [0, 3], opacity: [1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {/* Pale cheek blush */}
        <ellipse cx="28" cy="68" rx="5" ry="3" fill="hsl(0 30% 75%)" opacity="0.2" />
        <ellipse cx="72" cy="68" rx="5" ry="3" fill="hsl(0 30% 75%)" opacity="0.2" />
        
        {/* Body - sitting at table edge */}
        <ellipse cx="50" cy="105" rx="18" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Arms reaching toward marshmallow */}
        <motion.g
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          <path d="M62 100 L85 110" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M58 105 L82 118" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
          {/* Hands - reaching */}
          <ellipse cx="88" cy="108" rx="6" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" transform="rotate(-20 88 108)" />
          <ellipse cx="85" cy="120" rx="6" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" transform="rotate(-10 85 120)" />
        </motion.g>
        
        {/* Legs */}
        <path d="M40 115 L35 145" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M60 115 L65 145" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
      </motion.g>

      {/* Health bar - critical */}
      <g>
        <rect x="130" y="20" width="55" height="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" rx="2" />
        <motion.rect 
          x="132" y="22" width="8" height="8" 
          fill="hsl(0 80% 50%)"
          rx="1"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        <text x="157" y="16" textAnchor="middle" className="font-mono fill-muted-foreground" fontSize="8">
          HUNGER
        </text>
        <motion.text 
          x="157" y="29" 
          textAnchor="middle" 
          className="font-mono" 
          fill="hsl(0 80% 50%)" 
          fontSize="8"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          CRITICAL
        </motion.text>
      </g>

      {/* Stomach growl indicator */}
      <motion.text
        x="50"
        y="138"
        textAnchor="middle"
        className="font-mono fill-muted-foreground"
        fontSize="9"
        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        *growl*
      </motion.text>
    </svg>
  );
}
