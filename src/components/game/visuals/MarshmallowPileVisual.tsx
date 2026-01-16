import { motion } from 'framer-motion';

interface MarshmallowPileVisualProps {
  className?: string;
}

export function MarshmallowPileVisual({ className = '' }: MarshmallowPileVisualProps) {
  // Generate random positions for marshmallows in pile
  const pilePositions = [
    { x: 80, y: 110, size: 0.8 },
    { x: 100, y: 115, size: 0.9 },
    { x: 120, y: 108, size: 0.85 },
    { x: 90, y: 100, size: 0.75 },
    { x: 110, y: 102, size: 0.8 },
    { x: 70, y: 105, size: 0.7 },
    { x: 130, y: 112, size: 0.75 },
    { x: 85, y: 92, size: 0.65 },
    { x: 105, y: 90, size: 0.7 },
    { x: 115, y: 95, size: 0.65 },
    { x: 95, y: 85, size: 0.55 },
    { x: 75, y: 95, size: 0.6 },
    { x: 125, y: 100, size: 0.65 },
  ];

  return (
    <svg viewBox="0 0 200 160" className={`w-full max-w-sm ${className}`}>
      {/* Background */}
      <rect x="0" y="0" width="200" height="160" fill="hsl(var(--background))" />
      
      {/* Floor */}
      <line x1="0" y1="140" x2="200" y2="140" className="stick-line" strokeWidth="2" />
      
      {/* Pile of marshmallows */}
      {pilePositions.map((pos, i) => (
        <g key={i} transform={`translate(${pos.x - 10}, ${pos.y - 15}) scale(${pos.size})`}>
          {/* Simple marshmallow cylinder */}
          <ellipse cx="10" cy="20" rx="8" ry="3" fill="hsl(40 30% 94%)" stroke="hsl(30 20% 70%)" strokeWidth="1" />
          <rect x="2" y="8" width="16" height="12" fill="hsl(40 30% 96%)" stroke="none" />
          <ellipse cx="10" cy="8" rx="8" ry="3" fill="hsl(40 30% 98%)" stroke="hsl(30 20% 70%)" strokeWidth="1" />
          <path d="M2 8 L2 20" stroke="hsl(30 20% 70%)" strokeWidth="1" />
          <path d="M18 8 L18 20" stroke="hsl(30 20% 70%)" strokeWidth="1" />
        </g>
      ))}

      {/* Bored character sitting on pile */}
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Body sitting */}
        <ellipse cx="100" cy="75" rx="15" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Head */}
        <circle cx="100" cy="55" r="14" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair */}
        <path 
          d="M88 48 Q90 38 100 35 Q110 38 112 48 L110 46 Q105 40 100 39 Q95 40 90 46 Z" 
          className="hair-fill"
          strokeWidth="2"
        />
        
        {/* Bored eyes - half closed */}
        <line x1="93" y1="53" x2="98" y2="53" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        <line x1="102" y1="53" x2="107" y2="53" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        
        {/* Unimpressed mouth */}
        <line x1="96" y1="62" x2="104" y2="62" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        
        {/* Arms hanging */}
        <path d="M88 70 Q80 80 78 88" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        <path d="M112 70 Q120 80 122 88" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        
        {/* Legs dangling */}
        <path d="M92 82 Q88 100 85 115" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        <path d="M108 82 Q112 100 115 115" className="stick-line" strokeWidth="2" strokeLinecap="round" />
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
        <ellipse cx="145" cy="40" rx="20" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <circle cx="125" cy="52" r="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
        <circle cx="118" cy="58" r="2" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
        <text x="145" y="44" textAnchor="middle" className="font-mono fill-muted-foreground" fontSize="10">
          meh
        </text>
      </motion.g>
    </svg>
  );
}
