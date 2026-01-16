import { motion } from 'framer-motion';

interface LootBoxVisualProps {
  className?: string;
}

export function LootBoxVisual({ className = '' }: LootBoxVisualProps) {
  return (
    <svg viewBox="0 0 200 160" className={`w-full max-w-sm ${className}`}>
      {/* Background */}
      <rect x="0" y="0" width="200" height="160" fill="hsl(var(--background))" />
      
      {/* Floor */}
      <ellipse cx="100" cy="145" rx="90" ry="12" fill="hsl(var(--muted))" opacity="0.3" />
      
      {/* Glow effect behind box */}
      <motion.ellipse
        cx="100"
        cy="90"
        rx="50"
        ry="35"
        fill="hsl(270 50% 50%)"
        opacity="0.15"
        animate={{ 
          rx: [50, 60, 50],
          ry: [35, 45, 35],
          opacity: [0.1, 0.25, 0.1]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Mystery box */}
      <motion.g
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Box body */}
        <rect 
          x="65" y="55" width="70" height="60" 
          className="stick-line" 
          fill="hsl(var(--background))" 
          strokeWidth="2.5"
          rx="4"
        />
        
        {/* Box lid */}
        <path 
          d="M60 55 L100 35 L140 55 L100 50 Z" 
          className="stick-line" 
          fill="hsl(var(--background))" 
          strokeWidth="2"
        />
        
        {/* Question mark */}
        <motion.text
          x="100"
          y="95"
          textAnchor="middle"
          className="font-serif fill-foreground"
          fontSize="35"
          fontWeight="bold"
          animate={{ 
            scale: [1, 1.08, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ?
        </motion.text>
        
        {/* Sparkles around box */}
        <motion.text
          x="45"
          y="50"
          className="fill-foreground"
          fontSize="12"
          animate={{ opacity: [0, 1, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0 }}
          style={{ transformOrigin: '45px 50px' }}
        >
          ✦
        </motion.text>
        <motion.text
          x="150"
          y="60"
          className="fill-foreground"
          fontSize="10"
          animate={{ opacity: [0, 1, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          style={{ transformOrigin: '150px 60px' }}
        >
          ✦
        </motion.text>
        <motion.text
          x="55"
          y="110"
          className="fill-foreground"
          fontSize="8"
          animate={{ opacity: [0, 1, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          style={{ transformOrigin: '55px 110px' }}
        >
          ✦
        </motion.text>
        <motion.text
          x="145"
          y="105"
          className="fill-foreground"
          fontSize="11"
          animate={{ opacity: [0, 1, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
          style={{ transformOrigin: '145px 105px' }}
        >
          ✦
        </motion.text>
      </motion.g>

      {/* Chibi child staring at box - excited/conflicted */}
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      >
        {/* Head */}
        <ellipse cx="40" cy="100" rx="22" ry="20" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair */}
        <path 
          d="M20 92 Q24 76 40 72 Q56 76 60 92 Q57 82 40 78 Q26 82 22 92 Z" 
          className="hair-fill"
          strokeWidth="2"
        />
        {/* Hair tuft */}
        <path d="M40 72 Q42 66 46 70" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Excited/wide eyes looking at box */}
        <motion.g
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <ellipse cx="34" cy="98" rx="5" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <ellipse cx="48" cy="98" rx="5" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <ellipse cx="35" cy="99" rx="3" ry="4" className="stick-fill" />
          <ellipse cx="49" cy="99" rx="3" ry="4" className="stick-fill" />
          {/* Sparkles in eyes */}
          <circle cx="33" cy="97" r="1.5" fill="hsl(var(--background))" />
          <circle cx="47" cy="97" r="1.5" fill="hsl(var(--background))" />
          <circle cx="36" cy="101" r="0.8" fill="hsl(var(--background))" />
          <circle cx="50" cy="101" r="0.8" fill="hsl(var(--background))" />
        </motion.g>
        
        {/* Excited open mouth */}
        <ellipse cx="41" cy="112" rx="5" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        
        {/* Rosy cheeks - extra rosy from excitement */}
        <motion.ellipse 
          cx="25" cy="104" rx="5" ry="3" 
          fill="hsl(350 70% 75%)" 
          opacity="0.5"
          animate={{ opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.ellipse 
          cx="57" cy="104" rx="5" ry="3" 
          fill="hsl(350 70% 75%)" 
          opacity="0.5"
          animate={{ opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {/* Body */}
        <ellipse cx="40" cy="135" rx="12" ry="8" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Arms reaching toward box */}
        <motion.path 
          d="M48 128 L65 115" 
          className="stick-line" 
          strokeWidth="2" 
          strokeLinecap="round"
          animate={{ d: ["M48 128 L65 115", "M48 128 L68 112", "M48 128 L65 115"] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <ellipse cx="67" cy="113" rx="3" ry="2.5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
      </motion.g>

      {/* Labels */}
      <text x="100" y="155" textAnchor="middle" className="font-mono fill-muted-foreground" fontSize="8">
        0-10 marshmallows (random)
      </text>
    </svg>
  );
}
