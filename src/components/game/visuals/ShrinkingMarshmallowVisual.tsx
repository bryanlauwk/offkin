import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ShrinkingMarshmallowVisualProps {
  className?: string;
}

export function ShrinkingMarshmallowVisual({ className = '' }: ShrinkingMarshmallowVisualProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setScale(prev => Math.max(0.3, prev - 0.02));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <svg viewBox="0 0 200 160" className={`w-full max-w-xs ${className}`}>
      {/* Background - clean room */}
      <rect x="0" y="0" width="200" height="160" fill="hsl(var(--background))" />
      
      {/* Floor */}
      <line x1="0" y1="140" x2="200" y2="140" className="stick-line" strokeWidth="2" />
      
      {/* Plate */}
      <ellipse cx="100" cy="130" rx="50" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
      
      {/* Shrinking marshmallow */}
      <motion.g
        animate={{ scale }}
        style={{ transformOrigin: '100px 100px' }}
        transition={{ duration: 0.1 }}
      >
        {/* Kawaii marshmallow body */}
        <path 
          d="M75 125 
             Q70 110 73 95 
             Q72 80 80 70 
             Q90 60 100 58 
             Q110 60 120 70 
             Q128 80 127 95 
             Q130 110 125 125 
             Q115 132 100 133 
             Q85 132 75 125Z" 
          stroke="hsl(30 20% 60%)" 
          fill="hsl(40 30% 96%)" 
          strokeWidth="2"
        />
        
        {/* Top dome */}
        <ellipse cx="100" cy="62" rx="18" ry="8" stroke="hsl(30 20% 60%)" fill="hsl(40 30% 96%)" strokeWidth="2" />
        
        {/* Worried face */}
        <circle cx="92" cy="95" r="3" fill="hsl(30 25% 25%)" />
        <circle cx="108" cy="95" r="3" fill="hsl(30 25% 25%)" />
        <circle cx="91" cy="94" r="1" fill="hsl(0 0% 100%)" />
        <circle cx="107" cy="94" r="1" fill="hsl(0 0% 100%)" />
        
        {/* Worried eyebrows */}
        <path d="M88 88 L96 90" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        <path d="M112 88 L104 90" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        
        {/* Worried mouth */}
        <path d="M94 108 Q100 104 106 108" stroke="hsl(30 25% 25%)" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Sweat drops */}
        <motion.path
          d="M120 80 Q122 84 120 88 Q118 84 120 80Z"
          fill="hsl(200 80% 70%)"
          animate={{ y: [0, 5, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.g>

      {/* Shrinking indicator */}
      <motion.text
        x="100"
        y="25"
        textAnchor="middle"
        className="font-mono fill-muted-foreground"
        fontSize="12"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        -10% / min
      </motion.text>

      {/* Scale indicator */}
      <text
        x="100"
        y="155"
        textAnchor="middle"
        className="font-mono fill-muted-foreground"
        fontSize="10"
      >
        Value: {Math.round(scale * 100)}%
      </text>
    </svg>
  );
}
