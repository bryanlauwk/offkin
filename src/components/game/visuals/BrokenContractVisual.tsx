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
      <ellipse cx="110" cy="145" rx="100" ry="12" fill="hsl(var(--muted))" opacity="0.2" />
      
      {/* Table */}
      <ellipse cx="70" cy="118" rx="45" ry="10" fill="hsl(var(--muted))" opacity="0.3" />
      
      {/* Plate */}
      <ellipse cx="70" cy="113" rx="25" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
      <ellipse cx="70" cy="111" rx="20" ry="3.5" fill="hsl(var(--muted))" opacity="0.2" />
      
      {/* Single marshmallow - looking betrayed */}
      <motion.g
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <path 
          d="M57 106 Q54 98 56 90 Q55 83 60 78 Q66 73 70 72 Q74 73 80 78 Q85 83 84 90 Q86 98 83 106 Q77 111 70 111 Q63 111 57 106Z" 
          stroke="hsl(30 20% 60%)" 
          fill="hsl(40 30% 96%)" 
          strokeWidth="1.5"
        />
        {/* Sad eyes */}
        <circle cx="65" cy="90" r="2.5" fill="hsl(30 25% 25%)" />
        <circle cx="75" cy="90" r="2.5" fill="hsl(30 25% 25%)" />
        <circle cx="64" cy="89" r="1" fill="hsl(0 0% 100%)" />
        <circle cx="74" cy="89" r="1" fill="hsl(0 0% 100%)" />
        {/* Sad eyebrows */}
        <path d="M62 86 L68 84" className="stick-line" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M78 84 L72 86" className="stick-line" strokeWidth="1.5" strokeLinecap="round" />
        {/* Sad frown */}
        <path d="M66 100 Q70 96 74 100" stroke="hsl(30 25% 25%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Tear */}
        <motion.path
          d="M63 94 Q62 98 63 102"
          stroke="hsl(200 80% 70%)"
          strokeWidth="1.5"
          fill="none"
          animate={{ y: [0, 5], opacity: [1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Rosy cheeks - sad */}
        <circle cx="58" cy="95" r="3" fill="hsl(350 60% 75%)" opacity="0.4" />
        <circle cx="82" cy="95" r="3" fill="hsl(350 60% 75%)" opacity="0.4" />
      </motion.g>

      {/* Betrayed chibi child */}
      <motion.g>
        {/* Head - large chibi proportions */}
        <ellipse cx="130" cy="78" rx="28" ry="25" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair - FILLED */}
        <path 
          d="M104 70 Q108 48 130 42 Q156 48 160 70 Q155 55 132 50 Q112 55 108 70 Z" 
          className="hair-fill"
          strokeWidth="2"
        />
        {/* Hair highlights */}
        <path d="M112 55 Q125 47 140 52" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
        {/* Hair tuft */}
        <path d="M130 42 Q133 34 138 40" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Betrayed eyes - wide and watery */}
        <ellipse cx="120" cy="76" rx="8" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <ellipse cx="140" cy="76" rx="8" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        {/* Pupils - looking at empty space where marshmallow should be */}
        <ellipse cx="122" cy="78" rx="4" ry="5" className="stick-fill" />
        <ellipse cx="142" cy="78" rx="4" ry="5" className="stick-fill" />
        {/* Eye shines - watery */}
        <circle cx="119" cy="75" r="2" fill="hsl(var(--background))" />
        <circle cx="122" cy="80" r="1" fill="hsl(var(--background))" />
        <circle cx="139" cy="75" r="2" fill="hsl(var(--background))" />
        <circle cx="142" cy="80" r="1" fill="hsl(var(--background))" />
        
        {/* Sad/betrayed eyebrows */}
        <path d="M112 68 Q120 72 128 68" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M132 68 Q140 72 148 68" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Tear tracks */}
        <motion.path
          d="M117 82 Q116 90 118 98"
          stroke="hsl(200 70% 75%)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Small nose */}
        <path d="M130 82 Q132 85 130 88" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Quivering frown */}
        <motion.path 
          d="M124 96 Q130 92 136 96" 
          className="stick-line" 
          fill="none" 
          strokeWidth="2" 
          strokeLinecap="round"
          animate={{ d: ["M124 96 Q130 92 136 96", "M124 95 Q130 91 136 95", "M124 96 Q130 92 136 96"] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        
        {/* Cheek blush - flushed from crying */}
        <ellipse cx="108" cy="84" rx="5" ry="3" fill="hsl(0 50% 75%)" opacity="0.4" />
        <ellipse cx="152" cy="84" rx="5" ry="3" fill="hsl(0 50% 75%)" opacity="0.4" />
        
        {/* Body */}
        <ellipse cx="130" cy="118" rx="16" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Arms hanging sadly */}
        <path d="M118 112 Q108 120 112 135" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M142 112 Q152 120 148 135" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        {/* Hands */}
        <ellipse cx="112" cy="138" rx="5" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        <ellipse cx="148" cy="138" rx="5" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Legs */}
        <path d="M122 128 L118 148" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M138 128 L142 148" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
      </motion.g>

      {/* Apologetic researcher */}
      <motion.g>
        {/* Head */}
        <circle cx="185" cy="55" r="16" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Apologetic eyes - looking down */}
        <path d="M178 52 Q181 56 184 52" className="stick-line" fill="none" strokeWidth="2" />
        <path d="M186 52 Q189 56 192 52" className="stick-line" fill="none" strokeWidth="2" />
        
        {/* Worried/sorry mouth */}
        <path d="M179 64 Q185 60 191 64" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Sweat drops */}
        <motion.path
          d="M202 48 Q204 52 202 56 Q200 52 202 48Z"
          fill="hsl(200 80% 70%)"
          animate={{ opacity: [0.5, 1, 0.5], y: [0, 3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.path
          d="M206 55 Q208 58 206 61 Q204 58 206 55Z"
          fill="hsl(200 80% 70%)"
          animate={{ opacity: [0.3, 0.8, 0.3], y: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        />
        
        {/* Hair */}
        <path d="M171 45 Q175 32 185 30 Q195 32 199 45" className="hair-fill" strokeWidth="2" />
        
        {/* Body */}
        <line x1="185" y1="71" x2="185" y2="105" className="stick-line" strokeWidth="2" />
        
        {/* Lab coat */}
        <path 
          d="M173 75 L173 108 L185 105 L197 108 L197 75" 
          stroke="hsl(var(--foreground))" 
          fill="hsl(var(--background))" 
          strokeWidth="2" 
        />
        
        {/* Arms raised in shrug - EMPTY HANDS */}
        <motion.g
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ transformOrigin: '185px 82px' }}
        >
          <path d="M185 82 L165 70" className="stick-line" strokeWidth="2" strokeLinecap="round" />
          <path d="M185 82 L205 70" className="stick-line" strokeWidth="2" strokeLinecap="round" />
          {/* Empty hands - palms up */}
          <ellipse cx="163" cy="68" rx="6" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" transform="rotate(-30 163 68)" />
          <ellipse cx="207" cy="68" rx="6" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" transform="rotate(30 207 68)" />
        </motion.g>
        
        {/* Legs */}
        <path d="M185 105 L178 135" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        <path d="M185 105 L192 135" className="stick-line" strokeWidth="2" strokeLinecap="round" />
      </motion.g>

      {/* "Sorry" speech bubble */}
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <ellipse cx="185" cy="22" rx="22" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <path d="M180 31 L185 40 L190 31" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <text x="185" y="26" textAnchor="middle" className="font-mono fill-muted-foreground" fontSize="9">
          sorry...
        </text>
      </motion.g>

      {/* Ghost outline of promised marshmallow */}
      <motion.g
        animate={{ opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <path 
          d="M87 106 Q84 98 86 90 Q85 83 90 78 Q96 73 100 72 Q104 73 110 78 Q115 83 114 90 Q116 98 113 106 Q107 111 100 111 Q93 111 87 106Z" 
          stroke="hsl(var(--muted-foreground))" 
          fill="none" 
          strokeWidth="1.5"
          strokeDasharray="4"
        />
        <text x="100" y="93" textAnchor="middle" className="font-mono fill-muted-foreground" fontSize="10">
          ?
        </text>
      </motion.g>
    </svg>
  );
}
