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
      
      {/* Warm chibi reflection in mirror */}
      <g opacity="0.75">
        {/* Head */}
        <ellipse cx="100" cy="58" rx="22" ry="20" stroke="hsl(var(--foreground))" fill="hsl(var(--background))" strokeWidth="1.5" opacity="0.85" />
        
        {/* Hair - FILLED warm brown */}
        <path 
          d="M80 52 Q84 36 100 32 Q116 36 120 52 Q116 42 100 38 Q86 42 82 52 Z" 
          fill="hsl(30 25% 35%)"
          stroke="hsl(var(--foreground))"
          strokeWidth="1"
          opacity="0.8"
        />
        {/* Hair highlight */}
        <path d="M88 42 Q98 36 108 40" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round" />
        
        {/* Nervous eyes looking at viewer */}
        <ellipse cx="92" cy="56" rx="5" ry="6" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.85" />
        <ellipse cx="108" cy="56" rx="5" ry="6" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.85" />
        <ellipse cx="93" cy="57" rx="3" ry="4" fill="hsl(30 25% 25%)" opacity="0.85" />
        <ellipse cx="109" cy="57" rx="3" ry="4" fill="hsl(30 25% 25%)" opacity="0.85" />
        {/* Eye shines */}
        <circle cx="91" cy="54" r="1.5" fill="hsl(var(--background))" opacity="0.85" />
        <circle cx="107" cy="54" r="1.5" fill="hsl(var(--background))" opacity="0.85" />
        <circle cx="94" cy="59" r="0.8" fill="hsl(var(--background))" opacity="0.85" />
        <circle cx="110" cy="59" r="0.8" fill="hsl(var(--background))" opacity="0.85" />
        
        {/* Worried eyebrows */}
        <path d="M86 48 Q92 51 98 49" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M102 49 Q108 51 114 48" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7" />
        
        {/* Nervous sweat */}
        <motion.path
          d="M120 50 Q122 54 120 58 Q118 54 120 50Z"
          fill="hsl(200 80% 70%)"
          opacity="0.6"
          animate={{ y: [0, 3, 0], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {/* Nervous wavy smile */}
        <path d="M94 70 Q100 68 106 70" stroke="hsl(var(--foreground))" fill="none" strokeWidth="1.5" opacity="0.7" strokeLinecap="round" />
        
        {/* Rosy cheeks */}
        <ellipse cx="82" cy="62" rx="4" ry="2.5" fill="hsl(350 70% 75%)" opacity="0.35" />
        <ellipse cx="118" cy="62" rx="4" ry="2.5" fill="hsl(350 70% 75%)" opacity="0.35" />
        
        {/* Body */}
        <ellipse cx="100" cy="98" rx="14" ry="10" stroke="hsl(var(--foreground))" fill="hsl(var(--background))" strokeWidth="1.5" opacity="0.6" />
        
        {/* Arms - with hands */}
        <path d="M88 92 L78 100" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <ellipse cx="76" cy="102" rx="3" ry="2" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.5" />
        <path d="M112 92 L122 100" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <ellipse cx="124" cy="102" rx="3" ry="2" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.5" />
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

      {/* Warm chibi child in front of mirror - nervous */}
      <motion.g
        animate={{ y: [0, -1, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Head */}
        <ellipse cx="35" cy="115" rx="18" ry="16" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair - FILLED warm brown */}
        <path 
          d="M19 109 Q22 96 35 92 Q48 96 51 109 Q48 100 35 96 Q24 100 21 109 Z" 
          fill="hsl(30 25% 35%)"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.5"
        />
        {/* Hair highlight */}
        <path d="M25 100 Q33 94 41 98" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
        
        {/* Nervous wide eyes */}
        <ellipse cx="29" cy="114" rx="4" ry="5" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        <ellipse cx="41" cy="114" rx="4" ry="5" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        <ellipse cx="30" cy="115" rx="2.5" ry="3" fill="hsl(30 25% 25%)" />
        <ellipse cx="42" cy="115" rx="2.5" ry="3" fill="hsl(30 25% 25%)" />
        {/* Eye shines */}
        <circle cx="28" cy="112" r="1.5" fill="hsl(var(--background))" />
        <circle cx="40" cy="112" r="1.5" fill="hsl(var(--background))" />
        <circle cx="31" cy="117" r="0.8" fill="hsl(var(--background))" />
        <circle cx="43" cy="117" r="0.8" fill="hsl(var(--background))" />
        
        {/* Nervous smile */}
        <path d="M30 124 Q35 122 40 124" stroke="hsl(var(--foreground))" fill="none" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Rosy cheeks */}
        <ellipse cx="22" cy="119" rx="4" ry="2.5" fill="hsl(350 70% 75%)" opacity="0.5" />
        <ellipse cx="48" cy="119" rx="4" ry="2.5" fill="hsl(350 70% 75%)" opacity="0.5" />
        
        {/* Body */}
        <ellipse cx="35" cy="142" rx="10" ry="8" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Arms */}
        <path d="M27 138 L18 145" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="16" cy="147" rx="3" ry="2" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        <path d="M43 138 L52 145" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="54" cy="147" rx="3" ry="2" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
      </motion.g>

      {/* Marshmallow on plate */}
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      >
        <ellipse cx="100" cy="148" rx="18" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        {/* Kawaii marshmallow */}
        <path 
          d="M90 145 Q87 138 89 131 Q91 127 100 125 Q109 127 111 131 Q113 138 110 145 Q106 148 100 148 Q94 148 90 145Z" 
          stroke="hsl(30 20% 60%)" 
          fill="hsl(40 30% 96%)" 
          strokeWidth="1.5"
        />
        {/* Kawaii face */}
        <circle cx="95" cy="136" r="1.5" fill="hsl(30 25% 25%)" />
        <circle cx="105" cy="136" r="1.5" fill="hsl(30 25% 25%)" />
        {/* Eye shines */}
        <circle cx="94" cy="135" r="0.6" fill="hsl(0 0% 100%)" />
        <circle cx="104" cy="135" r="0.6" fill="hsl(0 0% 100%)" />
        {/* Nervous wavy mouth */}
        <path d="M96 141 Q98 143 100 141 Q102 139 104 141" stroke="hsl(30 25% 25%)" strokeWidth="1" fill="none" strokeLinecap="round" />
        {/* Rosy cheeks */}
        <circle cx="90" cy="139" r="2.5" fill="hsl(350 70% 75%)" opacity="0.4" />
        <circle cx="110" cy="139" r="2.5" fill="hsl(350 70% 75%)" opacity="0.4" />
      </motion.g>
    </svg>
  );
}