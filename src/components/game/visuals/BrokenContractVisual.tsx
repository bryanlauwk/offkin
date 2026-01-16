import { motion } from 'framer-motion';

interface BrokenContractVisualProps {
  className?: string;
}

export function BrokenContractVisual({ className = '' }: BrokenContractVisualProps) {
  return (
    <svg viewBox="0 0 220 160" className={`w-full max-w-sm ${className}`}>
      {/* Background */}
      <rect x="0" y="0" width="220" height="160" fill="hsl(var(--background))" />
      
      {/* Floor */}
      <line x1="0" y1="145" x2="220" y2="145" className="stick-line" strokeWidth="2" />
      
      {/* Table */}
      <ellipse cx="80" cy="120" rx="50" ry="10" fill="hsl(var(--muted))" opacity="0.3" />
      
      {/* Plate */}
      <ellipse cx="80" cy="115" rx="25" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
      
      {/* Single marshmallow - looking betrayed */}
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <path 
          d="M67 108 Q64 100 66 92 Q65 85 70 80 Q76 75 80 74 Q84 75 90 80 Q95 85 94 92 Q96 100 93 108 Q87 113 80 113 Q73 113 67 108Z" 
          stroke="hsl(30 20% 60%)" 
          fill="hsl(40 30% 96%)" 
          strokeWidth="1.5"
        />
        {/* Sad eyes */}
        <circle cx="75" cy="92" r="2.5" fill="hsl(30 25% 25%)" />
        <circle cx="85" cy="92" r="2.5" fill="hsl(30 25% 25%)" />
        <circle cx="74" cy="91" r="1" fill="hsl(0 0% 100%)" />
        <circle cx="84" cy="91" r="1" fill="hsl(0 0% 100%)" />
        {/* Sad eyebrows */}
        <path d="M72 88 L78 86" className="stick-line" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M88 86 L82 88" className="stick-line" strokeWidth="1.5" strokeLinecap="round" />
        {/* Sad frown */}
        <path d="M76 102 Q80 98 84 102" stroke="hsl(30 25% 25%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Tear */}
        <motion.path
          d="M73 96 Q72 100 73 104"
          stroke="hsl(200 80% 70%)"
          strokeWidth="1.5"
          fill="none"
          animate={{ y: [0, 5], opacity: [1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.g>

      {/* Apologetic researcher with empty hands */}
      <motion.g>
        {/* Head */}
        <circle cx="160" cy="60" r="18" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Apologetic eyes - looking down */}
        <path d="M153 58 Q156 62 159 58" className="stick-line" fill="none" strokeWidth="2" />
        <path d="M161 58 Q164 62 167 58" className="stick-line" fill="none" strokeWidth="2" />
        
        {/* Worried/sorry mouth */}
        <path d="M154 70 Q160 66 166 70" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Sweat drops */}
        <motion.path
          d="M178 52 Q180 56 178 60 Q176 56 178 52Z"
          fill="hsl(200 80% 70%)"
          animate={{ opacity: [0.5, 1, 0.5], y: [0, 3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.path
          d="M182 58 Q184 61 182 64 Q180 61 182 58Z"
          fill="hsl(200 80% 70%)"
          animate={{ opacity: [0.3, 0.8, 0.3], y: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />
        
        {/* Hair */}
        <path d="M144 50 Q148 35 160 32 Q172 35 176 50" className="hair-fill" strokeWidth="2" />
        
        {/* Body */}
        <line x1="160" y1="78" x2="160" y2="110" className="stick-line" strokeWidth="2" />
        
        {/* Lab coat */}
        <path 
          d="M148 82 L148 115 L160 112 L172 115 L172 82" 
          stroke="hsl(var(--foreground))" 
          fill="hsl(var(--background))" 
          strokeWidth="2" 
        />
        
        {/* Arms raised in shrug - EMPTY HANDS */}
        <motion.g
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ transformOrigin: '160px 85px' }}
        >
          <path d="M160 85 L135 75" className="stick-line" strokeWidth="2" strokeLinecap="round" />
          <path d="M160 85 L185 75" className="stick-line" strokeWidth="2" strokeLinecap="round" />
          {/* Empty hands - palms up */}
          <ellipse cx="132" cy="73" rx="6" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" transform="rotate(-30 132 73)" />
          <ellipse cx="188" cy="73" rx="6" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" transform="rotate(30 188 73)" />
        </motion.g>
        
        {/* Legs */}
        <path d="M160 110 L150 140" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        <path d="M160 110 L170 140" className="stick-line" strokeWidth="2" strokeLinecap="round" />
      </motion.g>

      {/* "Sorry" speech bubble */}
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <ellipse cx="160" cy="25" rx="25" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <path d="M155 36 L160 45 L165 36" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <text x="160" y="29" textAnchor="middle" className="font-mono fill-muted-foreground" fontSize="10">
          sorry...
        </text>
      </motion.g>

      {/* Ghost outline of promised marshmallow */}
      <motion.g
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <path 
          d="M97 108 Q94 100 96 92 Q95 85 100 80 Q106 75 110 74 Q114 75 120 80 Q125 85 124 92 Q126 100 123 108 Q117 113 110 113 Q103 113 97 108Z" 
          stroke="hsl(var(--muted-foreground))" 
          fill="none" 
          strokeWidth="1"
          strokeDasharray="4"
        />
        <text x="110" y="95" textAnchor="middle" className="font-mono fill-muted-foreground" fontSize="8">
          ?
        </text>
      </motion.g>
    </svg>
  );
}
