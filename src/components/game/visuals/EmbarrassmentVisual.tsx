import { motion } from 'framer-motion';

export function EmbarrassmentVisual() {
  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <svg viewBox="0 0 220 160" className="w-full h-full max-w-md">
        {/* Ground */}
        <ellipse cx="110" cy="150" rx="100" ry="10" fill="hsl(var(--muted))" opacity="0.2" />
        
        {/* Fallen person - chibi style, very embarrassed */}
        <g>
          {/* Body on ground - twisted from fall */}
          <ellipse cx="60" cy="132" rx="18" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" transform="rotate(-20 60 132)" />
          
          {/* Legs splayed dramatically */}
          <path d="M72 138 Q88 132 98 142" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M78 145 Q88 152 95 158" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Arms flailing */}
          <path d="M48 128 Q32 118 22 125" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M52 138 Q40 148 30 148" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Head on ground */}
          <ellipse cx="42" cy="110" rx="22" ry="20" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Messy disheveled hair - FILLED */}
          <path 
            d="M22 98 Q26 78 42 72 Q58 78 62 98 L58 95 Q54 85 42 82 Q30 85 26 95 Z" 
            className="hair-fill"
            strokeWidth="2"
          />
          {/* Extra messy strands from fall */}
          <path d="M25 92 Q20 85 25 78" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M58 90 Q65 82 60 75" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M35 72 Q32 65 38 62" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Embarrassed face - squeezed shut in shame */}
          <motion.g
            animate={{ rotate: [-3, 3, -3] }}
            transition={{ duration: 0.25, repeat: Infinity }}
            style={{ transformOrigin: '42px 110px' }}
          >
            {/* Squeezed shut eyes - X shaped */}
            <path d="M32 106 L40 114" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
            <path d="M32 114 L40 106" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
            <path d="M44 106 L52 114" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
            <path d="M44 114 L52 106" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          </motion.g>
          
          {/* Furrowed embarrassed eyebrows */}
          <path d="M30 100 Q36 96 42 102" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M42 102 Q48 96 54 100" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Nose */}
          <path d="M42 115 Q43 118 42 120" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Grimace mouth - wavy with embarrassment */}
          <path d="M35 126 Q38 123 42 126 Q46 123 50 126" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* VERY red cheeks - extreme embarrassment */}
          <ellipse cx="28" cy="116" rx="6" ry="4" fill="hsl(0 70% 65%)" opacity="0.6" />
          <ellipse cx="56" cy="116" rx="6" ry="4" fill="hsl(0 70% 65%)" opacity="0.6" />
          
          {/* Impact stars */}
          <motion.g
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1], rotate: [0, 15, 0] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          >
            <text x="72" y="105" className="stick-fill" fontSize="12">✱</text>
          </motion.g>
          <motion.g
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7], rotate: [0, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
          >
            <text x="18" y="130" className="stick-fill" fontSize="10">✱</text>
          </motion.g>
          
          {/* Sweat/shame drops */}
          <motion.path
            d="M62 100 Q60 105 62 108 Q64 105 62 100Z"
            className="stick-line"
            fill="hsl(var(--background))"
            strokeWidth="1"
            animate={{ y: [0, 5], opacity: [1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </g>
        
        {/* Crowd of laughing chibi people */}
        {[
          { x: 130, y: 118, delay: 0, pointing: true },
          { x: 158, y: 112, delay: 0.15, pointing: false },
          { x: 185, y: 120, delay: 0.3, pointing: true },
        ].map((person, i) => (
          <motion.g
            key={i}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.4, repeat: Infinity, delay: person.delay, ease: "easeInOut" }}
          >
            {/* Body */}
            <ellipse cx={person.x} cy={person.y + 25} rx="13" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            
            {/* Legs */}
            <path d={`M${person.x - 6} ${person.y + 32} Q${person.x - 10} ${person.y + 42} ${person.x - 7} ${person.y + 48}`} className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
            <path d={`M${person.x + 6} ${person.y + 32} Q${person.x + 10} ${person.y + 42} ${person.x + 7} ${person.y + 48}`} className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
            
            {/* Head */}
            <ellipse cx={person.x} cy={person.y + 6} rx="15" ry="13" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            
            {/* Hair - FILLED */}
            <path 
              d={`M${person.x - 13} ${person.y} Q${person.x - 10} ${person.y - 12} ${person.x} ${person.y - 14} Q${person.x + 10} ${person.y - 12} ${person.x + 13} ${person.y} L${person.x + 10} ${person.y - 2} Q${person.x} ${person.y - 8} ${person.x - 10} ${person.y - 2} Z`} 
              className="hair-fill"
              strokeWidth="1.5"
            />
            
            {/* Laughing eyes - happy arcs, closed from laughing */}
            <path d={`M${person.x - 9} ${person.y + 4} Q${person.x - 5} ${person.y} ${person.x - 1} ${person.y + 4}`} className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
            <path d={`M${person.x + 1} ${person.y + 4} Q${person.x + 5} ${person.y} ${person.x + 9} ${person.y + 4}`} className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
            
            {/* Wide laughing open mouth */}
            <motion.ellipse 
              cx={person.x} 
              cy={person.y + 14} 
              rx="6" 
              ry="5"
              className="stick-line" 
              fill="hsl(var(--background))" 
              strokeWidth="1.5"
              animate={{ ry: [5, 3, 5] }}
              transition={{ duration: 0.25, repeat: Infinity }}
            />
            
            {/* Cheek blush from laughing */}
            <ellipse cx={person.x - 10} cy={person.y + 8} rx="3" ry="2" fill="hsl(0 60% 75%)" opacity="0.4" />
            <ellipse cx={person.x + 10} cy={person.y + 8} rx="3" ry="2" fill="hsl(0 60% 75%)" opacity="0.4" />
            
            {/* Pointing arm if applicable */}
            {person.pointing && (
              <path d={`M${person.x - 12} ${person.y + 22} Q${person.x - 28} ${person.y + 12} ${person.x - 40} ${person.y + 16}`} className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
            )}
          </motion.g>
        ))}
        
        {/* HA HA HA text - bouncing */}
        <motion.g
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          <text x="138" y="68" className="stick-fill" fontSize="14" fontWeight="bold" fontStyle="italic">HA</text>
        </motion.g>
        <motion.g
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
        >
          <text x="158" y="62" className="stick-fill" fontSize="12" fontWeight="bold" fontStyle="italic">HA</text>
        </motion.g>
        <motion.g
          animate={{ scale: [1, 1.12, 1], opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 0.55, repeat: Infinity, delay: 0.3 }}
        >
          <text x="178" y="70" className="stick-fill" fontSize="13" fontWeight="bold" fontStyle="italic">HA</text>
        </motion.g>
        
        {/* Scattered papers/items from fall */}
        <motion.g
          animate={{ rotate: [0, 8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <rect x="88" y="138" width="10" height="12" rx="1" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" transform="rotate(18 88 138)" />
          <rect x="105" y="142" width="8" height="10" rx="1" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" transform="rotate(-25 105 142)" />
          <rect x="78" y="145" width="6" height="8" rx="1" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" transform="rotate(35 78 145)" />
        </motion.g>
      </svg>
    </div>
  );
}
