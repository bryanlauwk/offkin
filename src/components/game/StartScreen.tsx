import { motion } from 'framer-motion';
import { useSound } from '@/hooks/useSound';
import { useQuizStats } from '@/hooks/useQuizStats';

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const { playClick } = useSound();
  const { totalResponses } = useQuizStats();

  const handleStart = () => {
    playClick();
    onStart();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-12"
    >
      {/* Child staring at marshmallow illustration - improved chibi style */}
      <motion.svg 
        viewBox="0 0 200 140" 
        className="w-64 h-44 md:w-80 md:h-56 lg:w-96 lg:h-64 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Table/Surface */}
        <ellipse cx="100" cy="125" rx="85" ry="12" fill="hsl(var(--muted))" opacity="0.3" />
        
        {/* Plate */}
        <ellipse cx="65" cy="115" rx="28" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        <ellipse cx="65" cy="113" rx="22" ry="4" fill="hsl(var(--muted))" opacity="0.2" />
        
        {/* Kawaii Marshmallow on plate */}
        <motion.g
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Soft pillowy marshmallow body */}
          <path 
            d="M50 108 
               Q46 100 48 92 
               Q47 84 52 78 
               Q58 72 65 70 
               Q72 72 78 78 
               Q83 84 82 92 
               Q84 100 80 108 
               Q74 114 65 115 
               Q56 114 50 108Z" 
            stroke="hsl(30 20% 60%)" 
            fill="hsl(40 30% 96%)" 
            strokeWidth="1.5"
          />
          {/* Top rounded dome */}
          <ellipse cx="65" cy="72" rx="12" ry="6" stroke="hsl(30 20% 60%)" fill="hsl(40 30% 96%)" strokeWidth="1.5" />
          {/* Bottom squish */}
          <ellipse cx="65" cy="112" rx="14" ry="5" stroke="hsl(30 20% 60%)" fill="hsl(40 30% 96%)" strokeWidth="1.5" />
          {/* Soft highlight */}
          <path d="M54 88 Q52 95 54 102" stroke="hsl(0 0% 100%)" strokeWidth="2.5" fill="none" opacity="0.6" strokeLinecap="round" />
          
          {/* Kawaii Face */}
          {/* Eyes - cute dots looking up at child */}
          <circle cx="59" cy="92" r="2.5" fill="hsl(30 25% 25%)" />
          <circle cx="71" cy="92" r="2.5" fill="hsl(30 25% 25%)" />
          {/* Eye shines */}
          <circle cx="58" cy="91" r="1" fill="hsl(0 0% 100%)" />
          <circle cx="70" cy="91" r="1" fill="hsl(0 0% 100%)" />
          
          {/* Rosy cheeks */}
          <motion.circle 
            cx="53" cy="96" r="4" 
            fill="hsl(350 70% 75%)" 
            opacity="0.5"
            animate={{ opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle 
            cx="77" cy="96" r="4" 
            fill="hsl(350 70% 75%)" 
            opacity="0.5"
            animate={{ opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Cute smile */}
          <path d="M62 98 Q65 101 68 98" stroke="hsl(30 25% 25%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          
          {/* Tiny arms reaching toward child */}
          <path d="M80 88 Q86 85 90 88" stroke="hsl(30 20% 60%)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="90" cy="88" r="2" stroke="hsl(30 20% 60%)" fill="hsl(40 30% 96%)" strokeWidth="1" />
        </motion.g>
        
        {/* Child's arms resting on table */}
        <path d="M95 115 Q110 108 130 112 Q145 115 155 118" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M95 115 Q100 120 110 118" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Child's hands */}
        <ellipse cx="130" cy="108" rx="8" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        <ellipse cx="148" cy="110" rx="7" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Child's head resting on hands */}
        <ellipse cx="140" cy="72" rx="34" ry="30" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair - FILLED with warm brown */}
        <path 
          d="M108 58 Q112 35 138 28 Q168 32 178 55 Q182 68 180 82 L175 78 Q172 60 142 52 Q118 56 115 75 Z" 
          className="hair-fill"
          strokeWidth="2"
        />
        {/* Hair highlights */}
        <path d="M118 48 Q130 38 145 35" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
        <path d="M162 42 Q170 50 174 62" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
        {/* Hair tuft */}
        <path d="M140 28 Q143 20 148 26" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Face - looking at marshmallow */}
        <motion.g
          animate={{ x: [0, -1, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Eyes looking left at marshmallow - LARGE and expressive */}
          <ellipse cx="126" cy="70" rx="8" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <ellipse cx="150" cy="70" rx="8" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          {/* Pupils looking at marshmallow */}
          <ellipse cx="122" cy="72" rx="4" ry="5" className="stick-fill" />
          <ellipse cx="146" cy="72" rx="4" ry="5" className="stick-fill" />
          {/* Multiple eye shines */}
          <circle cx="120" cy="69" r="2" fill="hsl(var(--background))" />
          <circle cx="123" cy="74" r="1" fill="hsl(var(--background))" />
          <circle cx="144" cy="69" r="2" fill="hsl(var(--background))" />
          <circle cx="147" cy="74" r="1" fill="hsl(var(--background))" />
        </motion.g>
        
        {/* Eyebrows - slightly worried/longing */}
        <path d="M118 58 Q126 54 134 60" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M142 60 Q150 54 158 58" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Small nose */}
        <path d="M138 78 Q140 82 138 85" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Mouth - slight pout */}
        <path d="M132 92 Q138 88 144 92" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Cheek blush - prominent */}
        <ellipse cx="115" cy="80" rx="6" ry="3.5" fill="hsl(0 60% 75%)" opacity="0.4" />
        <ellipse cx="162" cy="80" rx="6" ry="3.5" fill="hsl(0 60% 75%)" opacity="0.4" />
        
        {/* Chin resting indication */}
        <path d="M122 98 Q138 104 154 98" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      </motion.svg>

      {/* Title - Italic serif like neal.fun */}
      <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold italic text-center mb-4">
        The Absurd Marshmallow Test
      </h1>

      {/* Subtitle */}
      <p className="font-serif text-lg md:text-xl text-muted-foreground text-center mb-12 italic max-w-md">
        A scientific examination of your impulse control.
      </p>

      {/* Start button - minimal style */}
      <motion.button
        className="btn-choice text-lg"
        onClick={handleStart}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Begin Experiment
      </motion.button>

      {/* Counter - subtle at bottom */}
      <div className="mt-12">
        <p className="font-mono text-sm text-muted-foreground">
          <span className="font-bold">{totalResponses.toLocaleString()}</span> people tested
        </p>
      </div>
    </motion.div>
  );
}
