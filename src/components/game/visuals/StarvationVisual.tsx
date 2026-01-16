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
      <line x1="0" y1="145" x2="200" y2="145" className="stick-line" strokeWidth="2" />
      
      {/* Table */}
      <ellipse cx="100" cy="130" rx="60" ry="10" fill="hsl(var(--muted))" opacity="0.3" />
      
      {/* Plate */}
      <ellipse cx="100" cy="125" rx="30" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
      
      {/* Marshmallow - looks extra delicious */}
      <motion.g
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <path 
          d="M82 118 Q78 108 80 98 Q79 88 86 82 Q94 76 100 75 Q106 76 114 82 Q121 88 120 98 Q122 108 118 118 Q110 124 100 124 Q90 124 82 118Z" 
          stroke="hsl(30 20% 60%)" 
          fill="hsl(40 30% 96%)" 
          strokeWidth="2"
        />
        <ellipse cx="100" cy="78" rx="14" ry="7" stroke="hsl(30 20% 60%)" fill="hsl(40 30% 96%)" strokeWidth="2" />
        
        {/* Happy face */}
        <circle cx="94" cy="98" r="3" fill="hsl(30 25% 25%)" />
        <circle cx="106" cy="98" r="3" fill="hsl(30 25% 25%)" />
        <circle cx="93" cy="97" r="1.2" fill="hsl(0 0% 100%)" />
        <circle cx="105" cy="97" r="1.2" fill="hsl(0 0% 100%)" />
        <path d="M94 108 Q100 114 106 108" stroke="hsl(30 25% 25%)" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Rosy cheeks */}
        <motion.circle cx="86" cy="102" r="5" fill="hsl(350 70% 75%)" opacity="0.5" animate={{ opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <motion.circle cx="114" cy="102" r="5" fill="hsl(350 70% 75%)" opacity="0.5" animate={{ opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
        
        {/* Sparkles around - extra tempting */}
        <motion.text x="125" y="85" className="fill-foreground" fontSize="10" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }}>✦</motion.text>
        <motion.text x="70" y="90" className="fill-foreground" fontSize="8" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}>✦</motion.text>
      </motion.g>

      {/* Starving character */}
      <g>
        {/* Body - thin, weak */}
        <motion.g
          animate={{ x: [-1, 1, -1] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        >
          {/* Head */}
          <ellipse cx="45" cy="65" rx="20" ry="18" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Sunken cheeks indicated by shading */}
          <ellipse cx="35" cy="70" rx="4" ry="6" fill="hsl(var(--muted))" opacity="0.2" />
          <ellipse cx="55" cy="70" rx="4" ry="6" fill="hsl(var(--muted))" opacity="0.2" />
          
          {/* Desperate eyes - wide, staring at marshmallow */}
          <ellipse cx="38" cy="62" rx="6" ry="8" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <ellipse cx="52" cy="62" rx="6" ry="8" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <motion.circle cx="40" cy="64" r="4" className="stick-fill" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
          <motion.circle cx="54" cy="64" r="4" className="stick-fill" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
          <circle cx="38" cy="62" r="1.5" fill="hsl(var(--background))" />
          <circle cx="52" cy="62" r="1.5" fill="hsl(var(--background))" />
          
          {/* Drooling mouth */}
          <path d="M38 78 Q45 82 52 78" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <motion.path
            d="M45 82 Q46 88 44 95"
            stroke="hsl(200 80% 70%)"
            strokeWidth="2"
            fill="none"
            animate={{ y: [0, 3], opacity: [1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          
          {/* Hair - disheveled */}
          <path d="M27 52 Q30 40 45 36 Q60 40 63 52" className="hair-fill" strokeWidth="2" />
          <path d="M28 48 Q24 42 30 38" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        </motion.g>
        
        {/* Thin body */}
        <line x1="45" y1="83" x2="45" y2="115" className="stick-line" strokeWidth="2" />
        
        {/* Arms reaching toward marshmallow */}
        <motion.g
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <path d="M45 90 L70 100" className="stick-line" strokeWidth="2" strokeLinecap="round" />
          <path d="M45 95 L68 110" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        </motion.g>
        
        {/* Weak legs */}
        <path d="M45 115 L38 145" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        <path d="M45 115 L52 145" className="stick-line" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Health bar - critical */}
      <g>
        <rect x="130" y="20" width="60" height="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <motion.rect 
          x="132" y="22" width="8" height="8" 
          fill="hsl(0 80% 50%)"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        <text x="160" y="16" textAnchor="middle" className="font-mono fill-muted-foreground" fontSize="8">
          HUNGER
        </text>
        <motion.text 
          x="160" y="29" 
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
        x="45"
        y="130"
        textAnchor="middle"
        className="font-mono fill-muted-foreground"
        fontSize="10"
        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        *growl*
      </motion.text>
    </svg>
  );
}
