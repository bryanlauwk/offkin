import { motion } from 'framer-motion';

export function WalletVisual() {
  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <svg viewBox="0 0 200 160" className="w-full h-full max-w-md">
        {/* Ground */}
        <ellipse cx="100" cy="150" rx="90" ry="10" fill="hsl(var(--muted))" opacity="0.2" />
        
        {/* Chibi person looking at wallet dreamily */}
        <g>
          {/* Body */}
          <ellipse cx="60" cy="125" rx="20" ry="15" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Legs */}
          <path d="M48 135 Q42 148 45 155" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M72 135 Q78 148 75 155" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Arm holding wallet out */}
          <path d="M78 120 Q95 115 105 110" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          {/* Other arm at side */}
          <path d="M42 120 Q35 130 38 140" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Hand holding wallet */}
          <ellipse cx="105" cy="108" rx="7" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Head - sad/longing expression */}
          <ellipse cx="60" cy="85" rx="25" ry="22" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Hair */}
          <path d="M38 70 Q42 50 60 45 Q78 50 82 70" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M42 65 Q50 55 60 50" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M78 65 Q70 55 60 50" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          {/* Hair tuft */}
          <path d="M60 45 Q62 38 65 43" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Sad face looking at wallet */}
          <motion.g
            animate={{ x: [0, 0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Droopy eyes */}
            <ellipse cx="52" cy="83" rx="5" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <ellipse cx="68" cy="83" rx="5" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            {/* Pupils looking at wallet */}
            <circle cx="54" cy="83" r="2" className="stick-fill" />
            <circle cx="70" cy="83" r="2" className="stick-fill" />
            {/* Eye shine */}
            <circle cx="53" cy="82" r="0.8" fill="hsl(var(--background))" />
            <circle cx="69" cy="82" r="0.8" fill="hsl(var(--background))" />
          </motion.g>
          
          {/* Sad eyebrows */}
          <path d="M47 77 Q52 75 57 78" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M63 78 Q68 75 73 77" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Small nose */}
          <path d="M60 87 Q61 90 60 92" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Sad mouth */}
          <path d="M54 98 Q60 95 66 98" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Tear */}
          <motion.path
            d="M48 88 Q46 93 48 96 Q50 93 48 88Z"
            className="stick-line"
            fill="hsl(var(--background))"
            strokeWidth="1"
            animate={{ y: [0, 8], opacity: [1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeIn" }}
          />
          
          {/* Cheek blush */}
          <ellipse cx="45" cy="90" rx="4" ry="2.5" fill="hsl(var(--muted))" opacity="0.35" />
          <ellipse cx="75" cy="90" rx="4" ry="2.5" fill="hsl(var(--muted))" opacity="0.35" />
        </g>
        
        {/* Empty wallet */}
        <g>
          {/* Wallet body - open */}
          <rect x="105" y="95" width="40" height="30" rx="2" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Wallet flap open */}
          <path d="M105 95 L100 75 L140 75 L145 95" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Empty card slots */}
          <rect x="110" y="100" width="30" height="5" rx="1" stroke="hsl(var(--muted-foreground))" strokeDasharray="2" fill="none" strokeWidth="1" />
          <rect x="110" y="108" width="30" height="5" rx="1" stroke="hsl(var(--muted-foreground))" strokeDasharray="2" fill="none" strokeWidth="1" />
          <rect x="110" y="116" width="30" height="5" rx="1" stroke="hsl(var(--muted-foreground))" strokeDasharray="2" fill="none" strokeWidth="1" />
          
          {/* Fly buzzing around */}
          <motion.g
            animate={{
              x: [0, 5, -3, 4, 0],
              y: [0, -3, 3, -4, 0],
              rotate: [0, 10, -8, 12, 0],
            }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ellipse cx="155" cy="85" rx="4" ry="3" className="stick-fill" />
            <circle cx="155" cy="82" r="2" className="stick-fill" />
            <ellipse cx="151" cy="84" rx="3" ry="1.5" className="stick-line" fill="none" strokeWidth="1" />
            <ellipse cx="159" cy="84" rx="3" ry="1.5" className="stick-line" fill="none" strokeWidth="1" />
          </motion.g>
          
          {/* Cobweb in wallet corner */}
          <path d="M142 100 Q148 105 145 112" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" fill="none" opacity="0.5" />
          <path d="M145 100 Q148 108 142 112" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" fill="none" opacity="0.5" />
        </g>
        
        {/* Dream bubble with money */}
        <motion.g
          animate={{ opacity: [0.5, 1, 0.5], y: [0, -2, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle cx="35" cy="45" r="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
          <circle cx="28" cy="35" r="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1" />
          <ellipse cx="18" cy="22" rx="14" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          {/* Dollar signs */}
          <text x="12" y="26" className="stick-fill" fontSize="8" fontWeight="bold">$</text>
          <text x="20" y="24" className="stick-fill" fontSize="6" fontWeight="bold">$</text>
        </motion.g>
      </svg>
    </div>
  );
}
