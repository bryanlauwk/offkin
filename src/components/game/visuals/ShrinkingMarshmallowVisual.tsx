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
      {/* Background */}
      <rect x="0" y="0" width="200" height="160" fill="hsl(var(--background))" />
      
      {/* Floor */}
      <ellipse cx="100" cy="145" rx="90" ry="12" fill="hsl(var(--muted))" opacity="0.2" />
      
      {/* Table */}
      <ellipse cx="70" cy="125" rx="50" ry="10" fill="hsl(var(--muted))" opacity="0.3" />
      
      {/* Plate */}
      <ellipse cx="70" cy="120" rx="35" ry="7" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
      <ellipse cx="70" cy="118" rx="28" ry="5" fill="hsl(var(--muted))" opacity="0.2" />
      
      {/* Shrinking marshmallow */}
      <motion.g
        animate={{ scale }}
        style={{ transformOrigin: '70px 95px' }}
        transition={{ duration: 0.1 }}
      >
        {/* Kawaii marshmallow body */}
        <path 
          d="M50 112 
             Q45 100 48 88 
             Q47 76 55 68 
             Q63 60 70 58 
             Q77 60 85 68 
             Q93 76 92 88 
             Q95 100 90 112 
             Q82 118 70 118 
             Q58 118 50 112Z" 
          stroke="hsl(30 20% 60%)" 
          fill="hsl(40 30% 96%)" 
          strokeWidth="2"
        />
        
        {/* Top dome */}
        <ellipse cx="70" cy="62" rx="15" ry="7" stroke="hsl(30 20% 60%)" fill="hsl(40 30% 96%)" strokeWidth="2" />
        
        {/* Worried face */}
        <circle cx="63" cy="88" r="3" fill="hsl(30 25% 25%)" />
        <circle cx="77" cy="88" r="3" fill="hsl(30 25% 25%)" />
        <circle cx="62" cy="87" r="1.2" fill="hsl(0 0% 100%)" />
        <circle cx="76" cy="87" r="1.2" fill="hsl(0 0% 100%)" />
        
        {/* Worried eyebrows */}
        <path d="M58 82 L66 84" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        <path d="M82 82 L74 84" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        
        {/* Worried mouth */}
        <path d="M64 100 Q70 96 76 100" stroke="hsl(30 25% 25%)" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Rosy cheeks */}
        <circle cx="55" cy="94" r="4" fill="hsl(350 60% 75%)" opacity="0.4" />
        <circle cx="85" cy="94" r="4" fill="hsl(350 60% 75%)" opacity="0.4" />
        
        {/* Sweat drops */}
        <motion.path
          d="M90 78 Q92 82 90 86 Q88 82 90 78Z"
          fill="hsl(200 80% 70%)"
          animate={{ y: [0, 5, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.g>

      {/* Chibi child watching - distressed */}
      <motion.g>
        {/* Head - large chibi proportions */}
        <ellipse cx="150" cy="75" rx="28" ry="25" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair - FILLED */}
        <path 
          d="M124 68 Q128 46 150 40 Q176 46 180 68 Q175 54 152 48 Q130 54 128 68 Z" 
          className="hair-fill"
          strokeWidth="2"
        />
        {/* Hair highlights */}
        <path d="M132 52 Q145 44 160 48" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
        {/* Hair tuft */}
        <path d="M150 40 Q153 32 158 38" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Worried eyes - watching marshmallow shrink */}
        <motion.g
          animate={{ x: [-2, 0, -2] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ellipse cx="140" cy="73" rx="8" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <ellipse cx="160" cy="73" rx="8" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          {/* Pupils - looking at shrinking marshmallow */}
          <ellipse cx="138" cy="75" rx="4" ry="5" className="stick-fill" />
          <ellipse cx="158" cy="75" rx="4" ry="5" className="stick-fill" />
          {/* Eye shines */}
          <circle cx="136" cy="72" r="2" fill="hsl(var(--background))" />
          <circle cx="156" cy="72" r="2" fill="hsl(var(--background))" />
        </motion.g>
        
        {/* Worried eyebrows */}
        <path d="M132 64 Q140 68 148 64" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M152 64 Q160 68 168 64" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Small nose */}
        <path d="M150 78 Q152 81 150 84" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Anxious open mouth */}
        <ellipse cx="150" cy="92" rx="6" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Cheek blush */}
        <ellipse cx="128" cy="80" rx="5" ry="3" fill="hsl(0 60% 75%)" opacity="0.4" />
        <ellipse cx="172" cy="80" rx="5" ry="3" fill="hsl(0 60% 75%)" opacity="0.4" />
        
        {/* Body */}
        <ellipse cx="150" cy="115" rx="16" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Arms - reaching toward marshmallow but hesitating */}
        <path d="M138 108 Q120 115 115 125" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M162 108 Q175 100 180 90" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        {/* Hands */}
        <ellipse cx="115" cy="128" rx="5" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        <ellipse cx="182" cy="88" rx="5" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Legs */}
        <path d="M142 125 L138 150" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M158 125 L162 150" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
      </motion.g>

      {/* Shrinking indicator */}
      <motion.text
        x="70"
        y="25"
        textAnchor="middle"
        className="font-mono fill-muted-foreground"
        fontSize="11"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        -10% / min
      </motion.text>

      {/* Scale indicator */}
      <text
        x="70"
        y="148"
        textAnchor="middle"
        className="font-mono fill-muted-foreground"
        fontSize="10"
      >
        Value: {Math.round(scale * 100)}%
      </text>

      {/* Timer visual */}
      <g>
        <circle cx="180" cy="25" r="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <motion.line
          x1="180" y1="25" x2="180" y2="17"
          className="stick-line"
          strokeWidth="1.5"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: '180px 25px' }}
        />
      </g>
    </svg>
  );
}
