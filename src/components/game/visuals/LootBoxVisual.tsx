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

      {/* Warm chibi child - excited about box */}
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      >
        {/* Head - large chibi proportions */}
        <ellipse cx="40" cy="100" rx="24" ry="22" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair - FILLED with warm brown, matching StartScreen */}
        <path 
          d="M18 92 Q22 74 40 68 Q58 74 62 92 Q58 80 40 74 Q25 80 20 92 Z" 
          fill="hsl(30 25% 35%)"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.5"
        />
        {/* Hair highlight */}
        <path d="M26 80 Q36 72 46 78" stroke="hsl(var(--background))" strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round" />
        {/* Hair tuft */}
        <path d="M40 68 Q44 60 48 66" stroke="hsl(30 25% 35%)" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Excited/wide eyes looking at box */}
        <motion.g
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {/* Left eye */}
          <ellipse cx="32" cy="98" rx="6" ry="7" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <ellipse cx="33" cy="99" rx="3.5" ry="4.5" fill="hsl(30 25% 25%)" />
          <circle cx="31" cy="96" r="2" fill="hsl(var(--background))" />
          <circle cx="34" cy="101" r="1" fill="hsl(var(--background))" />
          
          {/* Right eye */}
          <ellipse cx="48" cy="98" rx="6" ry="7" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <ellipse cx="49" cy="99" rx="3.5" ry="4.5" fill="hsl(30 25% 25%)" />
          <circle cx="47" cy="96" r="2" fill="hsl(var(--background))" />
          <circle cx="50" cy="101" r="1" fill="hsl(var(--background))" />
        </motion.g>
        
        {/* Excited eyebrows */}
        <path d="M26 90 Q32 87 38 90" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M42 90 Q48 87 54 90" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        
        {/* Excited open mouth */}
        <ellipse cx="40" cy="112" rx="6" ry="5" fill="hsl(0 40% 45%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        
        {/* Rosy cheeks - extra rosy from excitement */}
        <motion.ellipse 
          cx="22" cy="104" rx="6" ry="4" 
          fill="hsl(350 70% 75%)" 
          opacity="0.5"
          animate={{ opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.ellipse 
          cx="58" cy="104" rx="6" ry="4" 
          fill="hsl(350 70% 75%)" 
          opacity="0.5"
          animate={{ opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {/* Body - rounded */}
        <ellipse cx="40" cy="138" rx="14" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Arm reaching toward box */}
        <motion.path 
          d="M50 130 Q58 120 65 115" 
          className="stick-line" 
          strokeWidth="2.5" 
          strokeLinecap="round"
          fill="none"
          animate={{ d: ["M50 130 Q58 120 65 115", "M50 130 Q60 118 68 112", "M50 130 Q58 120 65 115"] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        {/* Hand - ellipse shape */}
        <motion.ellipse 
          cx="67" cy="113" 
          rx="4" ry="3" 
          fill="hsl(var(--background))" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="1.5"
          animate={{ cx: [67, 70, 67], cy: [113, 110, 113] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        
        {/* Other arm */}
        <path d="M30 130 Q22 135 18 142" className="stick-line" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <ellipse cx="16" cy="144" rx="4" ry="3" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        
        {/* Legs */}
        <path d="M34 146 L30 155" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M46 146 L50 155" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
      </motion.g>

      {/* Labels */}
      <text x="100" y="155" textAnchor="middle" className="font-mono fill-muted-foreground" fontSize="8">
        0-10 marshmallows (random)
      </text>
    </svg>
  );
}