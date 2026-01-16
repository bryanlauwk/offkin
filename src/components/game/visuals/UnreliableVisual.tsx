import { motion } from 'framer-motion';

interface UnreliableVisualProps {
  className?: string;
}

export function UnreliableVisual({ className = '' }: UnreliableVisualProps) {
  return (
    <svg viewBox="0 0 220 160" className={`w-full max-w-sm ${className}`}>
      {/* Background - messy room */}
      <rect x="0" y="0" width="220" height="160" fill="hsl(var(--background))" />
      
      {/* Messy floor with scattered items */}
      <line x1="0" y1="145" x2="220" y2="145" className="stick-line" strokeWidth="2" />
      
      {/* Scattered papers */}
      <rect x="15" y="130" width="12" height="8" fill="hsl(var(--muted))" stroke="hsl(var(--foreground))" strokeWidth="1" transform="rotate(-15 15 130)" />
      <rect x="180" y="135" width="10" height="6" fill="hsl(var(--muted))" stroke="hsl(var(--foreground))" strokeWidth="1" transform="rotate(10 180 135)" />
      <rect x="40" y="138" width="8" height="5" fill="hsl(var(--muted))" stroke="hsl(var(--foreground))" strokeWidth="1" transform="rotate(-8 40 138)" />
      
      {/* Crooked table */}
      <ellipse cx="80" cy="120" rx="50" ry="10" fill="hsl(var(--muted))" opacity="0.4" />
      
      {/* Plate - slightly crooked */}
      <g transform="rotate(-5 80 115)">
        <ellipse cx="80" cy="115" rx="25" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Nervous marshmallow */}
        <motion.g
          animate={{ x: [-1, 1, -1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <path 
            d="M67 108 Q64 100 66 92 Q65 85 70 80 Q76 75 80 74 Q84 75 90 80 Q95 85 94 92 Q96 100 93 108 Q87 113 80 113 Q73 113 67 108Z" 
            stroke="hsl(30 20% 60%)" 
            fill="hsl(40 30% 96%)" 
            strokeWidth="1.5"
          />
          {/* Worried eyes */}
          <circle cx="75" cy="92" r="2.5" fill="hsl(30 25% 25%)" />
          <circle cx="85" cy="92" r="2.5" fill="hsl(30 25% 25%)" />
          <circle cx="74" cy="91" r="1" fill="hsl(0 0% 100%)" />
          <circle cx="84" cy="91" r="1" fill="hsl(0 0% 100%)" />
          {/* Worried eyebrows */}
          <path d="M72 88 L78 90" className="stick-line" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M88 88 L82 90" className="stick-line" strokeWidth="1.5" strokeLinecap="round" />
          {/* Worried mouth */}
          <path d="M76 100 Q80 97 84 100" stroke="hsl(30 25% 25%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Sweat drop */}
          <motion.path
            d="M92 85 Q94 88 92 91 Q90 88 92 85Z"
            fill="hsl(200 80% 70%)"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.g>
      </g>

      {/* Shifty researcher */}
      <motion.g
        animate={{ x: [0, 2, 0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {/* Head */}
        <circle cx="160" cy="55" r="18" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Shifty eyes - looking side to side */}
        <motion.g
          animate={{ x: [-3, 3, -3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <circle cx="153" cy="52" r="3" className="stick-fill" />
          <circle cx="167" cy="52" r="3" className="stick-fill" />
        </motion.g>
        
        {/* Nervous sweat */}
        <motion.path
          d="M180 48 Q182 52 180 56 Q178 52 180 48Z"
          fill="hsl(200 80% 70%)"
          animate={{ opacity: [0.4, 0.8, 0.4], y: [0, 2, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {/* Uncertain smile */}
        <path d="M152 64 Q160 68 168 64" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Messy hair */}
        <path d="M144 45 Q148 32 160 30 Q172 32 176 45" className="hair-fill" strokeWidth="2" />
        <path d="M145 42 Q142 35 148 32" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M175 42 Q178 35 172 32" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Body */}
        <line x1="160" y1="73" x2="160" y2="110" className="stick-line" strokeWidth="2" />
        
        {/* Stained lab coat */}
        <path 
          d="M145 78 L145 115 L160 112 L175 115 L175 78" 
          stroke="hsl(var(--foreground))" 
          fill="hsl(40 20% 92%)" 
          strokeWidth="2" 
        />
        {/* Coffee stains */}
        <circle cx="150" cy="95" r="3" fill="hsl(30 40% 60%)" opacity="0.4" />
        <ellipse cx="168" cy="100" rx="4" ry="2" fill="hsl(30 40% 60%)" opacity="0.3" transform="rotate(-20 168 100)" />
        
        {/* Arms */}
        <path d="M160 85 L140 100" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        <path d="M160 85 L180 100" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        
        {/* Legs */}
        <path d="M160 110 L150 140" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        <path d="M160 110 L170 140" className="stick-line" strokeWidth="2" strokeLinecap="round" />
      </motion.g>

      {/* Suspicious question marks */}
      <motion.text
        x="30"
        y="40"
        className="font-mono fill-muted-foreground"
        fontSize="20"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        ?
      </motion.text>
      <motion.text
        x="195"
        y="30"
        className="font-mono fill-muted-foreground"
        fontSize="16"
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      >
        ?
      </motion.text>
    </svg>
  );
}
