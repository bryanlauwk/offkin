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
      <ellipse cx="65" cy="115" rx="28" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
      
      {/* Kawaii Marshmallow on plate */}
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <path 
          d="M50 108 Q46 100 48 92 Q47 84 52 78 Q58 72 65 70 Q72 72 78 78 Q83 84 82 92 Q84 100 80 108 Q74 114 65 115 Q56 114 50 108Z" 
          stroke="hsl(30 20% 60%)" 
          fill="hsl(40 30% 96%)" 
          strokeWidth="1.5"
        />
        <ellipse cx="65" cy="72" rx="12" ry="6" stroke="hsl(30 20% 60%)" fill="hsl(40 30% 96%)" strokeWidth="1.5" />
        
        {/* Kawaii face */}
        <circle cx="59" cy="92" r="2.5" fill="hsl(30 25% 25%)" />
        <circle cx="71" cy="92" r="2.5" fill="hsl(30 25% 25%)" />
        <circle cx="58" cy="91" r="1" fill="hsl(0 0% 100%)" />
        <circle cx="70" cy="91" r="1" fill="hsl(0 0% 100%)" />
        <motion.circle cx="53" cy="96" r="4" fill="hsl(350 70% 75%)" opacity="0.5" animate={{ opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.circle cx="77" cy="96" r="4" fill="hsl(350 70% 75%)" opacity="0.5" animate={{ opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
        <path d="M62 98 Q65 101 68 98" stroke="hsl(30 25% 25%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </motion.g>
      
      {/* Tired child - slumped posture */}
      <motion.g
        animate={{ y: [0, 2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Arms resting heavy on table */}
        <path d="M95 118 Q110 115 130 120 Q145 125 150 128" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Hands */}
        <ellipse cx="130" cy="115" rx="8" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        <ellipse cx="145" cy="118" rx="7" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Head resting heavy */}
        <ellipse cx="140" cy="78" rx="30" ry="28" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair */}
        <path 
          d="M112 68 Q116 48 140 42 Q168 48 175 68 L172 65 Q166 52 142 48 Q122 52 118 65 Z" 
          className="hair-fill"
          strokeWidth="2"
        />
        
        {/* Very tired eyes - droopy */}
        <motion.g
          animate={{ scaleY: [1, 0.3, 1] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        >
          <ellipse cx="128" cy="76" rx="7" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <ellipse cx="152" cy="76" rx="7" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <circle cx="128" cy="78" r="3" className="stick-fill" />
          <circle cx="152" cy="78" r="3" className="stick-fill" />
        </motion.g>
        
        {/* Heavy eyelids - drooping */}
        <path d="M122 72 Q128 68 134 74" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M146 74 Q152 68 158 72" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Bags under eyes */}
        <path d="M124 82 Q128 84 132 82" stroke="hsl(var(--muted-foreground))" fill="none" strokeWidth="1" opacity="0.3" />
        <path d="M148 82 Q152 84 156 82" stroke="hsl(var(--muted-foreground))" fill="none" strokeWidth="1" opacity="0.3" />
        
        {/* Tired frown */}
        <path d="M134 92 Q140 88 146 92" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Cheek blush - pale */}
        <ellipse cx="118" cy="82" rx="5" ry="3" fill="hsl(0 40% 75%)" opacity="0.25" />
        <ellipse cx="162" cy="82" rx="5" ry="3" fill="hsl(0 40% 75%)" opacity="0.25" />
      </motion.g>

      {/* Z's floating - sleepy */}
      <motion.text
        x="165"
        y="45"
        className="font-serif fill-muted-foreground"
        fontSize="14"
        animate={{ y: [0, -10, 0], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        z
      </motion.text>
      <motion.text
        x="175"
        y="35"
        className="font-serif fill-muted-foreground"
        fontSize="12"
        animate={{ y: [0, -10, 0], opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
      >
        z
      </motion.text>
      <motion.text
        x="182"
        y="28"
        className="font-serif fill-muted-foreground"
        fontSize="10"
        animate={{ y: [0, -10, 0], opacity: [0.1, 0.5, 0.1] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      >
        z
      </motion.text>
    </svg>
  );
}
