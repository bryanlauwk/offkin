import { motion } from 'framer-motion';

interface LootBoxVisualProps {
  className?: string;
}

export function LootBoxVisual({ className = '' }: LootBoxVisualProps) {
  return (
    <svg viewBox="0 0 200 160" className={`w-full max-w-xs ${className}`}>
      {/* Background */}
      <rect x="0" y="0" width="200" height="160" fill="hsl(var(--background))" />
      
      {/* Glow effect behind box */}
      <motion.ellipse
        cx="100"
        cy="100"
        rx="60"
        ry="40"
        fill="hsl(270 50% 50%)"
        opacity="0.2"
        animate={{ 
          rx: [60, 70, 60],
          ry: [40, 50, 40],
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Mystery box */}
      <motion.g
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Box body */}
        <rect 
          x="60" y="60" width="80" height="70" 
          className="stick-line" 
          fill="hsl(var(--background))" 
          strokeWidth="3"
        />
        
        {/* Box lid */}
        <polygon 
          points="55,60 100,40 145,60 100,55" 
          className="stick-line" 
          fill="hsl(var(--background))" 
          strokeWidth="2"
        />
        
        {/* Question mark */}
        <motion.text
          x="100"
          y="105"
          textAnchor="middle"
          className="font-serif fill-foreground"
          fontSize="40"
          fontWeight="bold"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ?
        </motion.text>
        
        {/* Sparkles around box */}
        <motion.text
          x="45"
          y="55"
          className="fill-foreground"
          fontSize="12"
          animate={{ opacity: [0, 1, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0 }}
          style={{ transformOrigin: '45px 55px' }}
        >
          ✦
        </motion.text>
        <motion.text
          x="155"
          y="70"
          className="fill-foreground"
          fontSize="10"
          animate={{ opacity: [0, 1, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          style={{ transformOrigin: '155px 70px' }}
        >
          ✦
        </motion.text>
        <motion.text
          x="50"
          y="120"
          className="fill-foreground"
          fontSize="8"
          animate={{ opacity: [0, 1, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          style={{ transformOrigin: '50px 120px' }}
        >
          ✦
        </motion.text>
        <motion.text
          x="150"
          y="115"
          className="fill-foreground"
          fontSize="11"
          animate={{ opacity: [0, 1, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
          style={{ transformOrigin: '150px 115px' }}
        >
          ✦
        </motion.text>
      </motion.g>

      {/* Floor */}
      <line x1="0" y1="140" x2="200" y2="140" className="stick-line" strokeWidth="2" />

      {/* Labels */}
      <text x="30" y="150" className="font-mono fill-muted-foreground" fontSize="8">
        0-10 marshmallows
      </text>
      <text x="140" y="150" className="font-mono fill-muted-foreground" fontSize="8">
        (random)
      </text>
    </svg>
  );
}
