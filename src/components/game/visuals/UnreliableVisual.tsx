import { motion } from 'framer-motion';

interface UnreliableVisualProps {
  className?: string;
}

export function UnreliableVisual({ className = '' }: UnreliableVisualProps) {
  return (
    <svg viewBox="0 0 220 160" className={`w-full max-w-sm ${className}`}>
      {/* Background - messy room */}
      <rect x="0" y="0" width="220" height="160" fill="hsl(var(--background))" />
      
      {/* Messy floor */}
      <ellipse cx="110" cy="145" rx="100" ry="12" fill="hsl(var(--muted))" opacity="0.2" />
      
      {/* Scattered papers */}
      <rect x="15" y="130" width="12" height="8" fill="hsl(var(--muted))" stroke="hsl(var(--foreground))" strokeWidth="1" transform="rotate(-15 15 130)" />
      <rect x="185" y="135" width="10" height="6" fill="hsl(var(--muted))" stroke="hsl(var(--foreground))" strokeWidth="1" transform="rotate(10 185 135)" />
      <rect x="45" y="138" width="8" height="5" fill="hsl(var(--muted))" stroke="hsl(var(--foreground))" strokeWidth="1" transform="rotate(-8 45 138)" />
      
      {/* Crooked table */}
      <ellipse cx="70" cy="118" rx="45" ry="10" fill="hsl(var(--muted))" opacity="0.3" />
      
      {/* Plate - slightly crooked */}
      <g transform="rotate(-5 70 113)">
        <ellipse cx="70" cy="113" rx="25" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        <ellipse cx="70" cy="111" rx="20" ry="3.5" fill="hsl(var(--muted))" opacity="0.2" />
        
        {/* Nervous marshmallow */}
        <motion.g
          animate={{ x: [-1, 1, -1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <path 
            d="M57 106 Q54 98 56 90 Q55 83 60 78 Q66 73 70 72 Q74 73 80 78 Q85 83 84 90 Q86 98 83 106 Q77 111 70 111 Q63 111 57 106Z" 
            stroke="hsl(30 20% 60%)" 
            fill="hsl(40 30% 96%)" 
            strokeWidth="1.5"
          />
          {/* Worried eyes */}
          <circle cx="65" cy="90" r="2.5" fill="hsl(30 25% 25%)" />
          <circle cx="75" cy="90" r="2.5" fill="hsl(30 25% 25%)" />
          <circle cx="64" cy="89" r="1" fill="hsl(0 0% 100%)" />
          <circle cx="74" cy="89" r="1" fill="hsl(0 0% 100%)" />
          {/* Worried eyebrows */}
          <path d="M62 86 L68 88" className="stick-line" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M78 86 L72 88" className="stick-line" strokeWidth="1.5" strokeLinecap="round" />
          {/* Worried mouth */}
          <path d="M66 98 Q70 95 74 98" stroke="hsl(30 25% 25%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Sweat drop */}
          <motion.path
            d="M82 83 Q84 86 82 89 Q80 86 82 83Z"
            fill="hsl(200 80% 70%)"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.g>
      </g>

      {/* Skeptical chibi child - watching researcher */}
      <motion.g>
        {/* Head - large chibi proportions */}
        <ellipse cx="130" cy="75" rx="28" ry="25" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair - FILLED */}
        <path 
          d="M104 68 Q108 48 130 42 Q156 48 160 68 Q155 55 132 50 Q112 55 108 68 Z" 
          className="hair-fill"
          strokeWidth="2"
        />
        {/* Hair highlights */}
        <path d="M112 55 Q125 47 140 52" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
        
        {/* Skeptical eyes - narrowed, looking at researcher */}
        <motion.g
          animate={{ x: [0, 2, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <ellipse cx="120" cy="73" rx="7" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <ellipse cx="140" cy="73" rx="7" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          {/* Narrowed pupils - looking right at researcher */}
          <ellipse cx="122" cy="74" rx="3.5" ry="4" className="stick-fill" />
          <ellipse cx="142" cy="74" rx="3.5" ry="4" className="stick-fill" />
          {/* Eye shines */}
          <circle cx="120" cy="72" r="1.5" fill="hsl(var(--background))" />
          <circle cx="140" cy="72" r="1.5" fill="hsl(var(--background))" />
        </motion.g>
        
        {/* Skeptical eyebrows - one raised */}
        <path d="M113 66 Q120 68 127 66" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M133 64 Q140 62 147 66" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Small nose */}
        <path d="M130 78 Q132 81 130 84" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Skeptical pursed lips */}
        <path d="M125 90 Q130 88 135 90" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Cheek blush */}
        <ellipse cx="108" cy="80" rx="5" ry="3" fill="hsl(0 60% 75%)" opacity="0.3" />
        <ellipse cx="152" cy="80" rx="5" ry="3" fill="hsl(0 60% 75%)" opacity="0.3" />
        
        {/* Body */}
        <ellipse cx="130" cy="115" rx="16" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Arms crossed */}
        <path d="M118 110 Q110 115 115 125" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M142 110 Q150 115 145 125" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        {/* Hands */}
        <ellipse cx="115" cy="128" rx="5" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        <ellipse cx="145" cy="128" rx="5" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Legs */}
        <path d="M122 125 L118 145" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M138 125 L142 145" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
      </motion.g>

      {/* Shifty researcher - stick figure style but with more detail */}
      <motion.g
        animate={{ x: [0, 2, 0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {/* Head */}
        <circle cx="185" cy="55" r="16" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Shifty eyes - looking side to side */}
        <motion.g
          animate={{ x: [-3, 3, -3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <circle cx="179" cy="52" r="3" className="stick-fill" />
          <circle cx="191" cy="52" r="3" className="stick-fill" />
        </motion.g>
        
        {/* Nervous sweat */}
        <motion.path
          d="M202 48 Q204 52 202 56 Q200 52 202 48Z"
          fill="hsl(200 80% 70%)"
          animate={{ opacity: [0.4, 0.8, 0.4], y: [0, 2, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {/* Uncertain smile */}
        <path d="M178 62 Q185 66 192 62" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Messy hair */}
        <path d="M171 45 Q175 35 185 33 Q195 35 199 45" className="hair-fill" strokeWidth="2" />
        <path d="M172 42 Q169 35 175 32" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M198 42 Q201 35 195 32" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Body */}
        <line x1="185" y1="71" x2="185" y2="105" className="stick-line" strokeWidth="2" />
        
        {/* Stained lab coat */}
        <path 
          d="M172 75 L172 108 L185 105 L198 108 L198 75" 
          stroke="hsl(var(--foreground))" 
          fill="hsl(40 20% 92%)" 
          strokeWidth="2" 
        />
        {/* Coffee stains */}
        <circle cx="177" cy="92" r="3" fill="hsl(30 40% 60%)" opacity="0.4" />
        <ellipse cx="193" cy="98" rx="4" ry="2" fill="hsl(30 40% 60%)" opacity="0.3" transform="rotate(-20 193 98)" />
        
        {/* Arms */}
        <path d="M185 82 L168 95" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        <path d="M185 82 L202 95" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        
        {/* Legs */}
        <path d="M185 105 L178 135" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        <path d="M185 105 L192 135" className="stick-line" strokeWidth="2" strokeLinecap="round" />
      </motion.g>

      {/* Suspicious question marks */}
      <motion.text
        x="95"
        y="50"
        className="font-mono fill-muted-foreground"
        fontSize="16"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        ?
      </motion.text>
      <motion.text
        x="155"
        y="40"
        className="font-mono fill-muted-foreground"
        fontSize="12"
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      >
        ?
      </motion.text>
    </svg>
  );
}
