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
          {/* Tiny smile */}
          <path d="M8 14 Q10 15 12 14" stroke="hsl(30 25% 25%)" strokeWidth="0.8" fill="none" strokeLinecap="round" />
        </g>
      ))}

      {/* Bored chibi child sitting on pile */}
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Head */}
        <ellipse cx="100" cy="55" rx="24" ry="22" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair */}
        <path 
          d="M78 48 Q82 30 100 26 Q118 30 122 48 Q118 38 100 34 Q84 38 80 48 Z" 
          className="hair-fill"
          strokeWidth="2"
        />
        {/* Hair highlights */}
        <path d="M86 38 Q95 32 104 36" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round" />
        
        {/* Bored half-closed eyes */}
        <path d="M90 52 Q94 50 98 52" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M102 52 Q106 50 110 52" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Unimpressed flat mouth */}
        <line x1="94" y1="64" x2="106" y2="64" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        
        {/* Pale cheeks - not excited */}
        <ellipse cx="82" cy="58" rx="4" ry="2.5" fill="hsl(0 40% 80%)" opacity="0.25" />
        <ellipse cx="118" cy="58" rx="4" ry="2.5" fill="hsl(0 40% 80%)" opacity="0.25" />
        
        {/* Body sitting on pile */}
        <ellipse cx="100" cy="82" rx="14" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Arms hanging limply */}
        <path d="M88 78 Q78 85 76 95" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        <path d="M112 78 Q122 85 124 95" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="75" cy="97" rx="3" ry="2.5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <ellipse cx="125" cy="97" rx="3" ry="2.5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
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
