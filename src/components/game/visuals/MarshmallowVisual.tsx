import { motion } from 'framer-motion';

export function MarshmallowVisual() {
  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <svg viewBox="0 0 200 160" className="w-full h-full max-w-md">
        {/* Table/Surface */}
        <ellipse cx="100" cy="145" rx="90" ry="12" fill="hsl(var(--muted))" opacity="0.3" />
        
        {/* Plate */}
        <ellipse cx="55" cy="135" rx="32" ry="7" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        <ellipse cx="55" cy="132" rx="25" ry="5" fill="hsl(var(--muted))" opacity="0.2" />
        
        {/* Improved Marshmallow - soft, fluffy, organic shape */}
        <motion.g
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Main marshmallow body - soft cylinder with organic curves */}
          <path 
            d="M40 125 
               Q37 120 39 110 
               Q38 100 43 95 
               Q45 88 55 85 
               Q65 88 67 95 
               Q72 100 71 110 
               Q73 120 70 125 
               Q65 130 55 132 
               Q45 130 40 125Z" 
            className="stick-line" 
            fill="hsl(var(--background))" 
            strokeWidth="2"
          />
          {/* Top rounded cap */}
          <ellipse cx="55" cy="88" rx="12" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          {/* Bottom squish (sitting on plate) */}
          <ellipse cx="55" cy="128" rx="14" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          {/* Soft highlights */}
          <path d="M45 100 Q43 108 45 115" stroke="hsl(var(--muted))" strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round" />
          <ellipse cx="47" cy="95" rx="2" ry="3" fill="hsl(var(--muted))" opacity="0.3" />
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
          
          {/* Hair - FILLED with warm brown */}
          <path 
            d="M112 80 Q115 55 140 48 Q168 52 180 72 Q185 85 182 100 L178 95 Q175 75 145 68 Q120 72 118 90 Z" 
            className="hair-fill"
            strokeWidth="2"
          />
          {/* Hair highlight strokes */}
          <path d="M120 72 Q130 60 145 55" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
          <path d="M165 60 Q172 65 175 75" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
          {/* Hair tuft */}
          <path d="M143 48 Q146 38 152 45" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Face - eyes looking left at marshmallow */}
          <motion.g
            animate={{ x: [0, -1, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Eyes - larger, more expressive */}
            <ellipse cx="130" cy="92" rx="9" ry="11" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <ellipse cx="156" cy="92" rx="9" ry="11" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            {/* Pupils looking at marshmallow */}
            <ellipse cx="126" cy="94" rx="4" ry="5" className="stick-fill" />
            <ellipse cx="152" cy="94" rx="4" ry="5" className="stick-fill" />
            {/* Eye shines - multiple for sparkle */}
            <circle cx="124" cy="91" r="2" fill="hsl(var(--background))" />
            <circle cx="127" cy="96" r="1" fill="hsl(var(--background))" />
            <circle cx="150" cy="91" r="2" fill="hsl(var(--background))" />
            <circle cx="153" cy="96" r="1" fill="hsl(var(--background))" />
          </motion.g>
          
          {/* Eyebrows - longing expression */}
          <path d="M122 78 Q130 74 138 80" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M148 80 Q156 74 164 78" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Small nose */}
          <path d="M143 100 Q145 105 143 108" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Mouth - slight pout/longing */}
          <path d="M136 116 Q143 112 150 116" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          {/* Drool hint */}
          <motion.path 
            d="M148 118 Q150 122 148 125"
            className="stick-line"
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Cheek blush - larger, more prominent */}
          <ellipse cx="118" cy="102" rx="7" ry="4" fill="hsl(0 60% 75%)" opacity="0.4" />
          <ellipse cx="168" cy="102" rx="7" ry="4" fill="hsl(0 60% 75%)" opacity="0.4" />
        </g>
        
        {/* Thought bubble showing two marshmallows */}
        <motion.g
          animate={{ opacity: [0.6, 1, 0.6], y: [0, -2, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle cx="178" cy="58" r="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <circle cx="186" cy="45" r="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <ellipse cx="195" cy="28" rx="14" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          {/* Two tiny marshmallows in thought */}
          <rect x="186" y="23" width="6" height="9" rx="2" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <rect x="194" y="23" width="6" height="9" rx="2" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        </motion.g>
      </svg>
    </div>
  );
}
