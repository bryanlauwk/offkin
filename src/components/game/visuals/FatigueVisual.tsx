import { motion } from 'framer-motion';

interface FatigueVisualProps {
  className?: string;
}

export function FatigueVisual({ className = '' }: FatigueVisualProps) {
  return (
    <svg viewBox="0 0 200 140" className={`w-full max-w-xs ${className}`}>
      {/* Background */}
      <rect x="0" y="0" width="200" height="140" fill="hsl(var(--background))" />
      
      {/* Table */}
      <ellipse cx="100" cy="125" rx="85" ry="12" fill="hsl(var(--muted))" opacity="0.3" />
      
      {/* Plate */}
      <ellipse cx="55" cy="115" rx="28" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
      <ellipse cx="55" cy="113" rx="22" ry="4" fill="hsl(var(--muted))" opacity="0.2" />
      
      {/* Kawaii Marshmallow on plate */}
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <path 
          d="M40 108 Q36 100 38 92 Q37 84 42 78 Q48 72 55 70 Q62 72 68 78 Q73 84 72 92 Q74 100 70 108 Q64 114 55 115 Q46 114 40 108Z" 
          stroke="hsl(30 20% 60%)" 
          fill="hsl(40 30% 96%)" 
          strokeWidth="1.5"
        />
        <ellipse cx="55" cy="72" rx="12" ry="6" stroke="hsl(30 20% 60%)" fill="hsl(40 30% 96%)" strokeWidth="1.5" />
        
        {/* Kawaii face */}
        <circle cx="49" cy="92" r="2.5" fill="hsl(30 25% 25%)" />
        <circle cx="61" cy="92" r="2.5" fill="hsl(30 25% 25%)" />
        <circle cx="48" cy="91" r="1" fill="hsl(0 0% 100%)" />
        <circle cx="60" cy="91" r="1" fill="hsl(0 0% 100%)" />
        <motion.circle cx="43" cy="96" r="4" fill="hsl(350 70% 75%)" opacity="0.5" animate={{ opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.circle cx="67" cy="96" r="4" fill="hsl(350 70% 75%)" opacity="0.5" animate={{ opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
        <path d="M52 98 Q55 101 58 98" stroke="hsl(30 25% 25%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </motion.g>
      
      {/* Tired chibi child - matching StartScreen style */}
      <motion.g
        animate={{ y: [0, 2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Arms resting heavy on table */}
        <path d="M95 118 Q110 112 125 115 Q138 118 145 120" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Hands - ellipse shapes like StartScreen */}
        <ellipse cx="125" cy="110" rx="8" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        <ellipse cx="140" cy="112" rx="7" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Head resting on hands - large chibi head */}
        <ellipse cx="135" cy="72" rx="34" ry="30" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair - FILLED like StartScreen */}
        <path 
          d="M103 62 Q107 38 135 30 Q167 38 173 62 Q168 48 137 42 Q112 48 107 62 Z" 
          className="hair-fill"
          strokeWidth="2"
        />
        {/* Hair highlights */}
        <path d="M112 48 Q125 38 140 42" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
        {/* Hair tuft */}
        <path d="M135 30 Q138 22 143 28" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Very tired eyes - droopy but still large */}
        <motion.g
          animate={{ scaleY: [1, 0.2, 0.2, 1] }}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
        >
          {/* Eye containers */}
          <ellipse cx="122" cy="70" rx="8" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <ellipse cx="148" cy="70" rx="8" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          {/* Pupils - looking down */}
          <ellipse cx="122" cy="72" rx="4" ry="4" className="stick-fill" />
          <ellipse cx="148" cy="72" rx="4" ry="4" className="stick-fill" />
          {/* Eye shines */}
          <circle cx="120" cy="70" r="1.5" fill="hsl(var(--background))" />
          <circle cx="146" cy="70" r="1.5" fill="hsl(var(--background))" />
        </motion.g>
        
        {/* Heavy eyelids - drooping */}
        <path d="M115 66 Q122 62 129 68" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M141 68 Q148 62 155 66" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Small nose */}
        <path d="M134 78 Q136 82 134 85" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Tired frown */}
        <path d="M128 92 Q135 88 142 92" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Cheek blush - paler for tiredness */}
        <ellipse cx="110" cy="78" rx="6" ry="3.5" fill="hsl(0 40% 75%)" opacity="0.25" />
        <ellipse cx="160" cy="78" rx="6" ry="3.5" fill="hsl(0 40% 75%)" opacity="0.25" />
        
        {/* Chin resting indication */}
        <path d="M118 98 Q135 104 152 98" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      </motion.g>

      {/* Z's floating - sleepy */}
      <motion.text
        x="165"
        y="40"
        className="font-serif fill-muted-foreground"
        fontSize="16"
        animate={{ y: [0, -12, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        z
      </motion.text>
      <motion.text
        x="176"
        y="28"
        className="font-serif fill-muted-foreground"
        fontSize="13"
        animate={{ y: [0, -12, 0], opacity: [0.2, 0.7, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
      >
        z
      </motion.text>
      <motion.text
        x="185"
        y="18"
        className="font-serif fill-muted-foreground"
        fontSize="10"
        animate={{ y: [0, -12, 0], opacity: [0.1, 0.6, 0.1] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      >
        z
      </motion.text>
    </svg>
  );
}
