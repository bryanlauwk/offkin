import { motion } from 'framer-motion';

export function MarshmallowVisual() {
  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <svg viewBox="0 0 200 160" className="w-full h-full max-w-md">
        {/* Table/Surface */}
        <ellipse cx="100" cy="145" rx="90" ry="12" fill="hsl(var(--muted))" opacity="0.3" />
        
        {/* Plate */}
        <ellipse cx="60" cy="135" rx="32" ry="7" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        <ellipse cx="60" cy="132" rx="25" ry="5" fill="hsl(var(--muted))" opacity="0.2" />
        
        {/* Improved Marshmallow - soft, fluffy, organic shape */}
        <motion.g
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Main marshmallow body - soft cylinder with organic curves */}
          <path 
            d="M45 125 
               Q42 120 44 110 
               Q43 100 48 95 
               Q50 88 60 85 
               Q70 88 72 95 
               Q77 100 76 110 
               Q78 120 75 125 
               Q70 130 60 132 
               Q50 130 45 125Z" 
            className="stick-line" 
            fill="hsl(var(--background))" 
            strokeWidth="2"
          />
          {/* Top rounded cap */}
          <ellipse cx="60" cy="88" rx="12" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          {/* Bottom squish (sitting on plate) */}
          <ellipse cx="60" cy="128" rx="14" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          {/* Soft highlights */}
          <path d="M50 100 Q48 108 50 115" stroke="hsl(var(--muted))" strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round" />
          <ellipse cx="52" cy="95" rx="2" ry="3" fill="hsl(var(--muted))" opacity="0.3" />
          {/* Subtle texture lines */}
          <path d="M54 92 Q55 95 54 98" stroke="hsl(var(--muted))" strokeWidth="0.5" fill="none" opacity="0.3" />
        </motion.g>
        
        {/* Chibi Child - chin resting on hands, staring at marshmallow */}
        <g>
          {/* Arms resting on table */}
          <path d="M100 138 Q115 130 135 134 Q150 138 160 142" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M100 138 Q105 143 115 140" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Hands */}
          <ellipse cx="135" cy="130" rx="9" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          <ellipse cx="155" cy="132" rx="8" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Head resting on hands */}
          <ellipse cx="145" cy="95" rx="35" ry="30" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Hair - messy cute style */}
          <path d="M115 75 Q118 50 140 45 Q165 42 180 60 Q186 72 183 90" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M118 68 Q125 58 135 52" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M170 62 Q174 55 178 65" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          {/* Hair tuft */}
          <path d="M145 45 Q148 35 152 42" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Face - eyes looking left at marshmallow */}
          <motion.g
            animate={{ x: [0, -1, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Eyes */}
            <ellipse cx="132" cy="92" rx="7" ry="8" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <ellipse cx="155" cy="92" rx="7" ry="8" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            {/* Pupils looking at marshmallow */}
            <circle cx="128" cy="93" r="3.5" className="stick-fill" />
            <circle cx="151" cy="93" r="3.5" className="stick-fill" />
            {/* Eye shine */}
            <circle cx="127" cy="91" r="1.2" fill="hsl(var(--background))" />
            <circle cx="150" cy="91" r="1.2" fill="hsl(var(--background))" />
          </motion.g>
          
          {/* Eyebrows - longing expression */}
          <path d="M125 82 Q132 79 139 83" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M148 83 Q155 79 162 82" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Small nose */}
          <path d="M143 98 Q145 102 143 105" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Mouth - slight pout/drool */}
          <path d="M138 112 Q145 109 152 112" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Cheek blush */}
          <ellipse cx="122" cy="102" rx="5" ry="3" fill="hsl(var(--muted))" opacity="0.35" />
          <ellipse cx="165" cy="102" rx="5" ry="3" fill="hsl(var(--muted))" opacity="0.35" />
        </g>
        
        {/* Thought bubble showing two marshmallows */}
        <motion.g
          animate={{ opacity: [0.6, 1, 0.6], y: [0, -2, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle cx="175" cy="55" r="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
          <circle cx="182" cy="45" r="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
          <ellipse cx="190" cy="30" rx="12" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          {/* Two tiny marshmallows in thought */}
          <rect x="183" y="26" width="5" height="7" rx="2" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
          <rect x="190" y="26" width="5" height="7" rx="2" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
        </motion.g>
      </svg>
    </div>
  );
}
