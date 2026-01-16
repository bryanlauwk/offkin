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
      <line x1="0" y1="145" x2="200" y2="145" className="stick-line" strokeWidth="2" />
      
      {/* Mirror frame */}
      <rect x="55" y="25" width="90" height="110" className="stick-line" fill="none" strokeWidth="4" />
      
      {/* Mirror surface - slightly tinted */}
      <rect x="60" y="30" width="80" height="100" fill="hsl(200 20% 95%)" />
      
      {/* Reflection in mirror - you */}
      <g opacity="0.8">
        {/* Head */}
        <circle cx="100" cy="70" r="16" stroke="hsl(var(--foreground))" fill="hsl(var(--background))" strokeWidth="2" opacity="0.7" />
        
        {/* Hair */}
        <path 
          d="M86 62 Q88 50 100 46 Q112 50 114 62 L111 60 Q106 52 100 51 Q94 52 89 60 Z" 
          fill="hsl(30 25% 35%)"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.5"
          opacity="0.7"
        />
        
        {/* Eyes looking at viewer */}
        <circle cx="94" cy="68" r="3" fill="hsl(var(--foreground))" opacity="0.7" />
        <circle cx="106" cy="68" r="3" fill="hsl(var(--foreground))" opacity="0.7" />
        
        {/* Slight smile */}
        <path d="M94 80 Q100 84 106 80" stroke="hsl(var(--foreground))" fill="none" strokeWidth="2" opacity="0.7" />
        
        {/* Body */}
        <ellipse cx="100" cy="110" rx="18" ry="12" stroke="hsl(var(--foreground))" fill="hsl(var(--background))" strokeWidth="2" opacity="0.5" />
      </g>

      {/* Audience behind (in reflection) - small icons */}
      <g opacity="0.4">
        {/* Row 1 */}
        {[70, 85, 100, 115, 130].map((x, i) => (
          <motion.circle
            key={`row1-${i}`}
            cx={x}
            cy="40"
            r="4"
            className="stick-fill"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
        {/* Row 2 */}
        {[65, 78, 92, 108, 122, 135].map((x, i) => (
          <motion.circle
            key={`row2-${i}`}
            cx={x}
            cy="50"
            r="3"
            className="stick-fill"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </g>

      {/* Viewer count indicator */}
      <motion.g
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <circle cx="170" cy="35" r="12" fill="hsl(0 70% 55%)" />
        <text x="170" y="38" textAnchor="middle" fill="white" fontSize="8" className="font-mono">
          LIVE
        </text>
      </motion.g>

      {/* Viewer count */}
      <text x="170" y="55" textAnchor="middle" className="font-mono fill-muted-foreground" fontSize="9">
        12.4K
      </text>

      {/* Camera icons on sides */}
      <g opacity="0.3">
        {/* Left camera */}
        <rect x="20" y="70" width="15" height="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <circle cx="28" cy="75" r="3" className="stick-line" fill="none" strokeWidth="1" />
        
        {/* Right camera */}
        <rect x="165" y="70" width="15" height="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <circle cx="172" cy="75" r="3" className="stick-line" fill="none" strokeWidth="1" />
      </g>

      {/* Marshmallow on plate in front of mirror */}
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ellipse cx="100" cy="142" rx="15" ry="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        {/* Small kawaii marshmallow */}
        <path 
          d="M93 140 Q91 135 92 130 Q91 125 95 122 Q98 120 100 120 Q102 120 105 122 Q109 125 108 130 Q109 135 107 140 Q104 142 100 142 Q96 142 93 140Z" 
          stroke="hsl(30 20% 60%)" 
          fill="hsl(40 30% 96%)" 
          strokeWidth="1"
        />
        {/* Tiny face */}
        <circle cx="97" cy="130" r="1" fill="hsl(30 25% 25%)" />
        <circle cx="103" cy="130" r="1" fill="hsl(30 25% 25%)" />
        <path d="M98 134 Q100 135 102 134" stroke="hsl(30 25% 25%)" strokeWidth="0.8" fill="none" />
      </motion.g>
    </svg>
  );
}
