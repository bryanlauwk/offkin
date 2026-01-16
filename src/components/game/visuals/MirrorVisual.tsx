import { motion } from 'framer-motion';

interface MirrorVisualProps {
  className?: string;
}

export function MirrorVisual({ className = '' }: MirrorVisualProps) {
  return (
    <svg viewBox="0 0 200 160" className={`w-full max-w-sm ${className}`}>
      {/* Background */}
      <rect x="0" y="0" width="200" height="160" fill="hsl(var(--background))" />
      
      {/* Floor */}
      <ellipse cx="100" cy="150" rx="90" ry="10" fill="hsl(var(--muted))" opacity="0.3" />
      
      {/* Mirror frame */}
      <rect x="55" y="20" width="90" height="105" className="stick-line" fill="none" strokeWidth="4" rx="2" />
      
      {/* Mirror surface - slightly tinted */}
      <rect x="60" y="25" width="80" height="95" fill="hsl(200 20% 96%)" rx="1" />
      
      {/* Chibi reflection in mirror */}
      <g opacity="0.75">
        {/* Head */}
        <ellipse cx="100" cy="60" rx="20" ry="18" stroke="hsl(var(--foreground))" fill="hsl(var(--background))" strokeWidth="1.5" opacity="0.8" />
        
        {/* Hair */}
        <path 
          d="M82 54 Q86 40 100 36 Q114 40 118 54 Q115 46 100 42 Q88 46 84 54 Z" 
          fill="hsl(30 25% 35%)"
          stroke="hsl(var(--foreground))"
          strokeWidth="1"
          opacity="0.7"
        />
        
        {/* Nervous eyes looking at viewer */}
        <ellipse cx="94" cy="58" rx="4" ry="5" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.8" />
        <ellipse cx="106" cy="58" rx="4" ry="5" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.8" />
        <ellipse cx="94" cy="59" rx="2" ry="3" fill="hsl(var(--foreground))" opacity="0.8" />
        <ellipse cx="106" cy="59" rx="2" ry="3" fill="hsl(var(--foreground))" opacity="0.8" />
        
        {/* Nervous sweat */}
        <motion.path
          d="M118 52 Q120 56 118 60 Q116 56 118 52Z"
          fill="hsl(200 80% 70%)"
          opacity="0.6"
          animate={{ y: [0, 3, 0], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {/* Nervous smile */}
        <path d="M94 72 Q100 70 106 72" stroke="hsl(var(--foreground))" fill="none" strokeWidth="1.5" opacity="0.7" />
        
        {/* Body */}
        <ellipse cx="100" cy="100" rx="14" ry="10" stroke="hsl(var(--foreground))" fill="hsl(var(--background))" strokeWidth="1.5" opacity="0.6" />
      </g>

      {/* Audience behind (in reflection) - small chibi heads */}
      <g opacity="0.35">
        {/* Row 1 - closer */}
        {[70, 88, 112, 130].map((x, i) => (
          <motion.g
            key={`row1-${i}`}
            animate={{ opacity: [0.25, 0.5, 0.25] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
          >
            <circle cx={x} cy="35" r="5" className="stick-fill" />
          </motion.g>
        ))}
        {/* Row 2 - further */}
        {[65, 80, 95, 105, 120, 135].map((x, i) => (
          <motion.g
            key={`row2-${i}`}
            animate={{ opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
          >
            <circle cx={x} cy="28" r="3" className="stick-fill" />
          </motion.g>
        ))}
      </g>

      {/* Viewer count indicator - LIVE badge */}
      <motion.g
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <rect x="158" y="25" width="30" height="16" rx="3" fill="hsl(0 70% 55%)" />
        <text x="173" y="36" textAnchor="middle" fill="white" fontSize="8" className="font-mono font-bold">
          LIVE
        </text>
      </motion.g>

      {/* Viewer count */}
      <text x="173" y="52" textAnchor="middle" className="font-mono fill-muted-foreground" fontSize="9">
        12.4K
      </text>

      {/* Camera icons on sides */}
      <g opacity="0.4">
        {/* Left camera */}
        <rect x="15" y="65" width="18" height="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" rx="2" />
        <circle cx="24" cy="71" r="4" className="stick-line" fill="none" strokeWidth="1" />
        <circle cx="24" cy="71" r="1.5" className="stick-fill" />
        
        {/* Right camera */}
        <rect x="167" y="65" width="18" height="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" rx="2" />
        <circle cx="176" cy="71" r="4" className="stick-line" fill="none" strokeWidth="1" />
        <circle cx="176" cy="71" r="1.5" className="stick-fill" />
      </g>

      {/* Marshmallow on plate in front of mirror */}
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ellipse cx="100" cy="145" rx="18" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        {/* Kawaii marshmallow */}
        <path 
          d="M90 142 Q87 135 89 128 Q91 124 100 122 Q109 124 111 128 Q113 135 110 142 Q106 145 100 145 Q94 145 90 142Z" 
          stroke="hsl(30 20% 60%)" 
          fill="hsl(40 30% 96%)" 
          strokeWidth="1.5"
        />
        {/* Tiny nervous face */}
        <circle cx="95" cy="133" r="1.5" fill="hsl(30 25% 25%)" />
        <circle cx="105" cy="133" r="1.5" fill="hsl(30 25% 25%)" />
        {/* Eye shines */}
        <circle cx="94" cy="132" r="0.6" fill="hsl(0 0% 100%)" />
        <circle cx="104" cy="132" r="0.6" fill="hsl(0 0% 100%)" />
        {/* Nervous wavy mouth */}
        <path d="M96 138 Q98 140 100 138 Q102 136 104 138" stroke="hsl(30 25% 25%)" strokeWidth="1" fill="none" strokeLinecap="round" />
        {/* Rosy cheeks */}
        <circle cx="90" cy="136" r="2.5" fill="hsl(350 70% 75%)" opacity="0.4" />
        <circle cx="110" cy="136" r="2.5" fill="hsl(350 70% 75%)" opacity="0.4" />
      </motion.g>
    </svg>
  );
}
