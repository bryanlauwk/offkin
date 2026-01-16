import { motion } from 'framer-motion';

export function WalletVisual() {
  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <svg viewBox="0 0 200 160" className="w-full h-full max-w-md">
        {/* Ground */}
        <ellipse cx="100" cy="150" rx="90" ry="10" fill="hsl(var(--muted))" opacity="0.2" />
        
        {/* Chibi person looking at wallet sadly */}
        <g>
          {/* Body */}
          <ellipse cx="55" cy="125" rx="20" ry="15" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Legs */}
          <path d="M43 135 Q37 148 40 155" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M67 135 Q73 148 70 155" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Arm holding wallet out */}
          <path d="M73 118 Q90 112 102 108" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          {/* Other arm drooped at side */}
          <path d="M37 120 Q28 132 32 142" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Hand holding wallet */}
          <ellipse cx="102" cy="106" rx="7" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Head - large, sad */}
          <ellipse cx="55" cy="82" rx="28" ry="25" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Hair - FILLED with warm brown */}
          <path 
            d="M30 68 Q35 45 55 40 Q75 45 80 68 L77 65 Q72 52 55 48 Q38 52 33 65 Z" 
            className="hair-fill"
            strokeWidth="2"
          />
          {/* Hair highlights */}
          <path d="M40 52 Q50 45 60 48" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
          {/* Droopy hair strand - matching mood */}
          <path d="M55 40 Q54 33 58 38" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Sad face looking at wallet */}
          <motion.g
            animate={{ y: [0, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Droopy sad eyes - half closed */}
            <ellipse cx="45" cy="80" rx="7" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <ellipse cx="65" cy="80" rx="7" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            {/* Pupils looking at wallet */}
            <circle cx="48" cy="81" r="2.5" className="stick-fill" />
            <circle cx="68" cy="81" r="2.5" className="stick-fill" />
            {/* Eye shines - dim */}
            <circle cx="47" cy="79" r="1" fill="hsl(var(--background))" />
            <circle cx="67" cy="79" r="1" fill="hsl(var(--background))" />
            {/* Droopy eyelids */}
            <path d="M38 77 Q45 75 52 77" className="stick-line" fill="none" strokeWidth="1.5" />
            <path d="M58 77 Q65 75 72 77" className="stick-line" fill="none" strokeWidth="1.5" />
          </motion.g>
          
          {/* Very sad eyebrows - tilted up in middle */}
          <path d="M38 72 Q45 68 52 74" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M58 74 Q65 68 72 72" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Small nose */}
          <path d="M55 86 Q56 90 55 92" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Sad wavering mouth */}
          <path d="M48 100 Q55 95 62 100" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Tear dropping */}
          <motion.path
            d="M38 85 Q35 92 38 96 Q41 92 38 85Z"
            className="stick-line"
            fill="hsl(var(--background))"
            strokeWidth="1.5"
            animate={{ y: [0, 15], opacity: [1, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeIn" }}
          />
          
          {/* Cheek blush - sad pink */}
          <ellipse cx="35" cy="88" rx="5" ry="3" fill="hsl(0 60% 75%)" opacity="0.4" />
          <ellipse cx="75" cy="88" rx="5" ry="3" fill="hsl(0 60% 75%)" opacity="0.4" />
        </g>
        
        {/* Empty wallet - open and sad */}
        <g>
          {/* Wallet body - open */}
          <rect x="105" y="92" width="42" height="32" rx="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Wallet flap open */}
          <path d="M105 92 L100 70 L147 70 L152 92" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Empty card slots - dashed to show emptiness */}
          <rect x="110" y="98" width="32" height="6" rx="1" stroke="hsl(var(--muted-foreground))" strokeDasharray="3" fill="none" strokeWidth="1.5" />
          <rect x="110" y="107" width="32" height="6" rx="1" stroke="hsl(var(--muted-foreground))" strokeDasharray="3" fill="none" strokeWidth="1.5" />
          <rect x="110" y="116" width="32" height="5" rx="1" stroke="hsl(var(--muted-foreground))" strokeDasharray="3" fill="none" strokeWidth="1.5" />
          
          {/* Cobweb in wallet */}
          <path d="M142 95 Q150 102 146 112" stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" fill="none" opacity="0.6" />
          <path d="M146 95 Q152 105 142 112" stroke="hsl(var(--muted-foreground))" strokeWidth="0.8" fill="none" opacity="0.6" />
          <path d="M144 95 L145 110" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" fill="none" opacity="0.4" />
          
          {/* Fly buzzing around empty wallet */}
          <motion.g
            animate={{
              x: [0, 8, -5, 6, 0],
              y: [0, -5, 4, -6, 0],
              rotate: [0, 15, -10, 18, 0],
            }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          >
            <ellipse cx="160" cy="82" rx="5" ry="4" className="stick-fill" />
            <circle cx="160" cy="78" r="3" className="stick-fill" />
            {/* Wings */}
            <ellipse cx="155" cy="80" rx="4" ry="2" className="stick-line" fill="none" strokeWidth="1" />
            <ellipse cx="165" cy="80" rx="4" ry="2" className="stick-line" fill="none" strokeWidth="1" />
            {/* Tiny eyes */}
            <circle cx="159" cy="77" r="0.8" fill="hsl(var(--background))" />
            <circle cx="161" cy="77" r="0.8" fill="hsl(var(--background))" />
          </motion.g>
        </g>
        
        {/* Dream bubble with money - what they wish they had */}
        <motion.g
          animate={{ opacity: [0.5, 1, 0.5], y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle cx="30" cy="50" r="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <circle cx="22" cy="38" r="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <ellipse cx="15" cy="22" rx="16" ry="14" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          {/* Dollar signs - dreamy */}
          <text x="8" y="28" className="stick-fill" fontSize="10" fontWeight="bold">$</text>
          <text x="18" y="24" className="stick-fill" fontSize="8" fontWeight="bold">$</text>
          {/* Sparkles */}
          <text x="24" y="18" className="stick-fill" fontSize="6">✦</text>
        </motion.g>
      </svg>
    </div>
  );
}
