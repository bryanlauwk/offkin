import { motion } from 'framer-motion';

export function EmbarrassmentVisual() {
  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <svg viewBox="0 0 220 160" className="w-full h-full max-w-md">
        {/* Ground */}
        <ellipse cx="110" cy="150" rx="100" ry="10" fill="hsl(var(--muted))" opacity="0.2" />
        
        {/* Fallen person - chibi style */}
        <g>
          {/* Body on ground */}
          <ellipse cx="60" cy="135" rx="18" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" transform="rotate(-15 60 135)" />
          
          {/* Legs splayed */}
          <path d="M72 140 Q85 135 95 145" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M75 145 Q82 150 90 155" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Arms splayed */}
          <path d="M50 130 Q35 120 25 125" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M55 138 Q45 145 35 145" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Head on ground */}
          <ellipse cx="45" cy="115" rx="20" ry="18" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Messy hair */}
          <path d="M28 105 Q30 88 45 82 Q60 88 62 105" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M32 100 Q38 90 48 88" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Embarrassed face */}
          <motion.g
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          >
            {/* Squeezed shut eyes */}
            <path d="M36 112 Q40 108 44 112" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
            <path d="M46 112 Q50 108 54 112" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          </motion.g>
          
          {/* Embarrassed eyebrows */}
          <path d="M34 106 Q40 104 46 107" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M44 107 Q50 104 56 106" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Nose */}
          <path d="M45 116 Q46 119 45 120" className="stick-line" fill="none" strokeWidth="1" strokeLinecap="round" />
          
          {/* Grimace mouth */}
          <path d="M38 126 Q45 122 52 126" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Very red cheeks - embarrassment */}
          <ellipse cx="32" cy="118" rx="5" ry="3" fill="hsl(var(--muted))" opacity="0.5" />
          <ellipse cx="58" cy="118" rx="5" ry="3" fill="hsl(var(--muted))" opacity="0.5" />
          
          {/* Impact stars */}
          <motion.g
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <text x="70" y="110" className="stick-fill" fontSize="10">✱</text>
            <text x="25" cy="130" className="stick-fill" fontSize="8">✱</text>
          </motion.g>
        </g>
        
        {/* Crowd of laughing chibi people */}
        {[
          { x: 130, y: 120, delay: 0 },
          { x: 155, y: 115, delay: 0.15 },
          { x: 180, y: 122, delay: 0.3 },
        ].map((person, i) => (
          <motion.g
            key={i}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: person.delay, ease: "easeInOut" }}
          >
            {/* Body */}
            <ellipse cx={person.x} cy={person.y + 25} rx="12" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            
            {/* Legs */}
            <path d={`M${person.x - 6} ${person.y + 32} Q${person.x - 10} ${person.y + 42} ${person.x - 8} ${person.y + 48}`} className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
            <path d={`M${person.x + 6} ${person.y + 32} Q${person.x + 10} ${person.y + 42} ${person.x + 8} ${person.y + 48}`} className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
            
            {/* Head */}
            <ellipse cx={person.x} cy={person.y + 8} rx="14" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            
            {/* Hair */}
            <path d={`M${person.x - 12} ${person.y + 2} Q${person.x - 8} ${person.y - 8} ${person.x} ${person.y - 10} Q${person.x + 8} ${person.y - 8} ${person.x + 12} ${person.y + 2}`} className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
            
            {/* Laughing eyes - happy arcs */}
            <path d={`M${person.x - 8} ${person.y + 6} Q${person.x - 5} ${person.y + 3} ${person.x - 2} ${person.y + 6}`} className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
            <path d={`M${person.x + 2} ${person.y + 6} Q${person.x + 5} ${person.y + 3} ${person.x + 8} ${person.y + 6}`} className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
            
            {/* Wide laughing mouth */}
            <motion.ellipse 
              cx={person.x} 
              cy={person.y + 14} 
              rx="5" 
              ry="4"
              className="stick-line" 
              fill="hsl(var(--background))" 
              strokeWidth="1.5"
              animate={{ ry: [4, 3, 4] }}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
            
            {/* Pointing arm */}
            <path d={`M${person.x - 10} ${person.y + 22} Q${person.x - 25} ${person.y + 15} ${person.x - 35} ${person.y + 18}`} className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          </motion.g>
        ))}
        
        {/* HA HA HA text */}
        <motion.g
          animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <text x="140" y="70" className="stick-fill" fontSize="12" fontWeight="bold" fontStyle="italic">HA</text>
          <text x="158" y="65" className="stick-fill" fontSize="10" fontWeight="bold" fontStyle="italic">HA</text>
          <text x="175" y="72" className="stick-fill" fontSize="11" fontWeight="bold" fontStyle="italic">HA</text>
        </motion.g>
        
        {/* Scattered papers/items from fall */}
        <motion.g
          animate={{ rotate: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <rect x="85" y="140" width="8" height="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" transform="rotate(15 85 140)" />
          <rect x="100" y="145" width="6" height="8" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" transform="rotate(-20 100 145)" />
        </motion.g>
      </svg>
    </div>
  );
}
