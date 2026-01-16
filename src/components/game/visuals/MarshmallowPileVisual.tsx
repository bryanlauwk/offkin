import { motion } from 'framer-motion';

interface MarshmallowPileVisualProps {
  className?: string;
}

export function MarshmallowPileVisual({ className = '' }: MarshmallowPileVisualProps) {
  // Generate positions for marshmallows in pile
  const pilePositions = [
    { x: 80, y: 115, size: 0.8 },
    { x: 100, y: 120, size: 0.9 },
    { x: 120, y: 112, size: 0.85 },
    { x: 90, y: 105, size: 0.75 },
    { x: 110, y: 108, size: 0.8 },
    { x: 70, y: 110, size: 0.7 },
    { x: 130, y: 118, size: 0.75 },
    { x: 85, y: 98, size: 0.65 },
    { x: 105, y: 95, size: 0.7 },
    { x: 115, y: 100, size: 0.65 },
    { x: 95, y: 90, size: 0.55 },
    { x: 75, y: 100, size: 0.6 },
    { x: 125, y: 105, size: 0.65 },
  ];

  return (
    <svg viewBox="0 0 200 160" className={`w-full max-w-sm ${className}`}>
      {/* Background */}
      <rect x="0" y="0" width="200" height="160" fill="hsl(var(--background))" />
      
      {/* Floor */}
      <ellipse cx="100" cy="145" rx="90" ry="12" fill="hsl(var(--muted))" opacity="0.3" />
      
      {/* Pile of kawaii marshmallows */}
      {pilePositions.map((pos, i) => (
        <g key={i} transform={`translate(${pos.x - 10}, ${pos.y - 15}) scale(${pos.size})`}>
          {/* Kawaii marshmallow */}
          <path 
            d="M5 18 Q2 12 4 6 Q6 2 10 0 Q14 2 16 6 Q18 12 15 18 Q12 20 10 20 Q8 20 5 18Z" 
            stroke="hsl(30 20% 60%)" 
            fill="hsl(40 30% 96%)" 
            strokeWidth="1"
          />
          {/* Tiny eyes */}
          <circle cx="7" cy="10" r="1" fill="hsl(30 25% 25%)" />
          <circle cx="13" cy="10" r="1" fill="hsl(30 25% 25%)" />
          {/* Tiny shine */}
          <circle cx="6.5" cy="9.5" r="0.4" fill="hsl(0 0% 100%)" />
          <circle cx="12.5" cy="9.5" r="0.4" fill="hsl(0 0% 100%)" />
          {/* Tiny smile */}
          <path d="M8 14 Q10 15 12 14" stroke="hsl(30 25% 25%)" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          {/* Tiny blush */}
          <circle cx="5" cy="12" r="1.2" fill="hsl(350 70% 75%)" opacity="0.4" />
          <circle cx="15" cy="12" r="1.2" fill="hsl(350 70% 75%)" opacity="0.4" />
        </g>
      ))}

      {/* Warm chibi child sitting on pile - bored expression */}
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Head - large chibi proportions */}
        <ellipse cx="100" cy="52" rx="26" ry="24" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair - FILLED warm brown */}
        <path 
          d="M76 44 Q80 24 100 18 Q120 24 124 44 Q120 32 100 26 Q82 32 78 44 Z" 
          fill="hsl(30 25% 35%)"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.5"
        />
        {/* Hair highlights */}
        <path d="M84 32 Q96 24 108 30" stroke="hsl(var(--background))" strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round" />
        {/* Hair tuft */}
        <path d="M100 18 Q104 10 108 16" stroke="hsl(30 25% 35%)" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Bored half-closed eyes */}
        <g>
          {/* Left eye - half closed */}
          <ellipse cx="90" cy="50" rx="6" ry="4" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <ellipse cx="90" cy="51" rx="3" ry="2" fill="hsl(30 25% 25%)" />
          <circle cx="89" cy="50" r="1" fill="hsl(var(--background))" />
          {/* Droopy eyelid */}
          <path d="M84 48 Q90 46 96 48" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          
          {/* Right eye - half closed */}
          <ellipse cx="110" cy="50" rx="6" ry="4" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <ellipse cx="110" cy="51" rx="3" ry="2" fill="hsl(30 25% 25%)" />
          <circle cx="109" cy="50" r="1" fill="hsl(var(--background))" />
          {/* Droopy eyelid */}
          <path d="M104 48 Q110 46 116 48" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
        
        {/* Unimpressed flat mouth */}
        <line x1="94" y1="64" x2="106" y2="64" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        
        {/* Pale rosy cheeks - less excited */}
        <ellipse cx="80" cy="56" rx="5" ry="3" fill="hsl(350 60% 80%)" opacity="0.3" />
        <ellipse cx="120" cy="56" rx="5" ry="3" fill="hsl(350 60% 80%)" opacity="0.3" />
        
        {/* Body sitting on pile */}
        <ellipse cx="100" cy="85" rx="16" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Arms hanging limply - with proper hands */}
        <path d="M86 80 Q74 88 72 98" className="stick-line" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <ellipse cx="70" cy="100" rx="4" ry="3" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        
        <path d="M114 80 Q126 88 128 98" className="stick-line" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <ellipse cx="130" cy="100" rx="4" ry="3" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
      </motion.g>

      {/* Counter */}
      <text x="100" y="20" textAnchor="middle" className="font-mono fill-muted-foreground" fontSize="10">
        1,000 marshmallows
      </text>
      
      {/* Thought bubble - "meh" */}
      <motion.g
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <ellipse cx="150" cy="35" rx="22" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <circle cx="128" cy="48" r="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
        <circle cx="122" cy="54" r="2" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
        <text x="150" y="39" textAnchor="middle" className="font-mono fill-muted-foreground italic" fontSize="10">
          meh
        </text>
      </motion.g>
    </svg>
  );
}