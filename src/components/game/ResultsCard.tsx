import { useRef } from 'react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Archetype } from '@/lib/gameData';
import { useSound } from '@/hooks/useSound';

interface ResultsCardProps {
  archetype: Archetype;
  cooperateCount: number;
  defectCount: number;
  winWinCount: number;
  betrayedCount: number;
  onRestart: () => void;
}

// Chibi archetype avatars for Prisoner's Dilemma
function ArchetypeAvatar({ archetypeId }: { archetypeId: string }) {
  if (archetypeId === 'saint') {
    return (
      <svg viewBox="0 0 100 120" className="w-28 h-32">
        {/* Halo glow */}
        <motion.ellipse 
          cx="50" cy="25" rx="20" ry="8" 
          fill="hsl(50 80% 70%)" 
          opacity="0.6"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Chibi head */}
        <ellipse cx="50" cy="45" rx="28" ry="26" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        
        {/* Hair - angelic blonde */}
        <path 
          d="M24 38 Q28 16 50 10 Q72 16 76 38 Q72 26 50 22 Q30 26 26 38 Z" 
          fill="hsl(45 70% 75%)"
          stroke="hsl(var(--foreground))"
          strokeWidth="2"
        />
        
        {/* Sparkly kind eyes */}
        <ellipse cx="40" cy="44" rx="5" ry="6" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        <ellipse cx="60" cy="44" rx="5" ry="6" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        <ellipse cx="40" cy="45" rx="3" ry="4" fill="hsl(200 70% 50%)" />
        <ellipse cx="60" cy="45" rx="3" ry="4" fill="hsl(200 70% 50%)" />
        <circle cx="38" cy="42" r="1.5" fill="hsl(var(--background))" />
        <circle cx="58" cy="42" r="1.5" fill="hsl(var(--background))" />
        
        {/* Warm smile */}
        <path d="M42 58 Q50 66 58 58" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Rosy cheeks */}
        <ellipse cx="30" cy="52" rx="5" ry="3" fill="hsl(350 70% 75%)" opacity="0.5" />
        <ellipse cx="70" cy="52" rx="5" ry="3" fill="hsl(350 70% 75%)" opacity="0.5" />
        
        {/* Body with open arms */}
        <ellipse cx="50" cy="88" rx="18" ry="14" fill="hsl(200 60% 85%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        
        {/* Arms open wide */}
        <path d="M34 82 L18 75" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M66 82 L82 75" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="16" cy="74" r="4" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        <circle cx="84" cy="74" r="4" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        
        {/* Legs */}
        <path d="M44 100 L40 115" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M56 100 L60 115" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (archetypeId === 'pragmatist') {
    return (
      <svg viewBox="0 0 100 120" className="w-28 h-32">
        {/* Balance scale */}
        <motion.g
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ transformOrigin: '50px 25px' }}
        >
          <line x1="30" y1="20" x2="70" y2="20" stroke="hsl(var(--foreground))" strokeWidth="2" />
          <circle cx="30" cy="22" r="6" fill="hsl(150 50% 60%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <circle cx="70" cy="22" r="6" fill="hsl(0 50% 60%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <line x1="50" y1="8" x2="50" y2="20" stroke="hsl(var(--foreground))" strokeWidth="2" />
        </motion.g>
        
        {/* Chibi head */}
        <ellipse cx="50" cy="50" rx="26" ry="24" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        
        {/* Hair - professional brown */}
        <path 
          d="M26 44 Q30 24 50 18 Q70 24 74 44 Q70 34 50 30 Q32 34 28 44 Z" 
          fill="hsl(30 35% 40%)"
          stroke="hsl(var(--foreground))"
          strokeWidth="2"
        />
        
        {/* Thoughtful eyes */}
        <ellipse cx="42" cy="48" rx="4" ry="5" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        <ellipse cx="58" cy="48" rx="4" ry="5" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        <ellipse cx="43" cy="49" rx="2" ry="3" fill="hsl(var(--foreground))" />
        <ellipse cx="59" cy="49" rx="2" ry="3" fill="hsl(var(--foreground))" />
        
        {/* Slight knowing smile */}
        <path d="M44 62 Q50 66 56 62" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Glasses */}
        <circle cx="42" cy="48" r="7" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        <circle cx="58" cy="48" r="7" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        <path d="M49 48 L51 48" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        
        {/* Body */}
        <ellipse cx="50" cy="88" rx="16" ry="12" fill="hsl(220 30% 70%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        
        {/* Arms at sides */}
        <path d="M36 82 L28 92" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M64 82 L72 92" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Legs */}
        <path d="M44 98 L42 115" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M56 98 L58 115" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (archetypeId === 'betrayer') {
    return (
      <svg viewBox="0 0 100 120" className="w-28 h-32">
        {/* Money bags floating */}
        <motion.g
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <circle cx="20" cy="30" r="8" fill="hsl(50 70% 60%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <text x="20" y="34" textAnchor="middle" fontSize="10">$</text>
        </motion.g>
        <motion.g
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          <circle cx="80" cy="25" r="7" fill="hsl(50 70% 60%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <text x="80" y="29" textAnchor="middle" fontSize="9">$</text>
        </motion.g>
        
        {/* Chibi head */}
        <ellipse cx="50" cy="50" rx="26" ry="24" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        
        {/* Hair - slicked back */}
        <path 
          d="M26 44 Q30 24 50 18 Q70 24 74 44 Q70 34 50 30 Q32 34 28 44 Z" 
          fill="hsl(0 0% 20%)"
          stroke="hsl(var(--foreground))"
          strokeWidth="2"
        />
        
        {/* Scheming narrow eyes */}
        <path d="M36 46 Q42 42 48 46" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M52 46 Q58 42 64 46" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="42" cy="50" rx="2" ry="3" fill="hsl(var(--foreground))" />
        <ellipse cx="58" cy="50" rx="2" ry="3" fill="hsl(var(--foreground))" />
        
        {/* Smirk */}
        <path d="M42 62 Q50 58 62 65" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Body */}
        <ellipse cx="50" cy="88" rx="16" ry="12" fill="hsl(0 0% 30%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        
        {/* Arms - one behind back, one with loot */}
        <path d="M36 82 L25 95" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M64 82 Q78 78 82 88" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="84" cy="90" r="6" fill="hsl(50 70% 60%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        
        {/* Legs */}
        <path d="M44 98 L42 115" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M56 98 L58 115" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // Chaos agent
  return (
    <svg viewBox="0 0 100 120" className="w-28 h-32">
      {/* Chaos flames */}
      <motion.g
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <ellipse cx="50" cy="100" rx="40" ry="20" fill="hsl(30 90% 50%)" opacity="0.4" />
      </motion.g>
      
      {/* Chibi head */}
      <ellipse cx="50" cy="50" rx="28" ry="26" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
      
      {/* Chaotic spiky hair */}
      <path 
        d="M24 44 Q22 30 35 20 L40 35 Q45 15 55 22 L55 35 Q65 18 75 28 L70 42 Q82 38 80 50 L74 48 Q68 35 50 32 Q30 35 26 48 Z" 
        fill="hsl(0 70% 50%)"
        stroke="hsl(var(--foreground))"
        strokeWidth="2"
      />
      
      {/* Wild crazy eyes */}
      <ellipse cx="40" cy="48" rx="6" ry="7" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
      <ellipse cx="60" cy="48" rx="6" ry="7" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
      <motion.ellipse 
        cx="40" cy="48" rx="4" ry="5" 
        fill="hsl(0 70% 50%)"
        animate={{ cx: [38, 42, 38] }}
        transition={{ duration: 0.3, repeat: Infinity }}
      />
      <motion.ellipse 
        cx="60" cy="48" rx="4" ry="5" 
        fill="hsl(0 70% 50%)"
        animate={{ cx: [58, 62, 58] }}
        transition={{ duration: 0.3, repeat: Infinity }}
      />
      <circle cx="38" cy="45" r="2" fill="hsl(var(--background))" />
      <circle cx="58" cy="45" r="2" fill="hsl(var(--background))" />
      
      {/* Maniacal grin */}
      <path d="M35 62 Q50 75 65 62" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M40 64 L42 68 L46 64 L48 70 L52 64 L54 68 L58 64 L60 68" stroke="hsl(var(--foreground))" strokeWidth="1" fill="none" />
      
      {/* Body */}
      <ellipse cx="50" cy="90" rx="18" ry="14" fill="hsl(0 70% 30%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
      
      {/* Arms raised chaotically */}
      <motion.path 
        d="M34 84 L18 68" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        strokeLinecap="round"
        animate={{ d: ["M34 84 L18 68", "M34 84 L20 62", "M34 84 L18 68"] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      />
      <motion.path 
        d="M66 84 L82 68" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        strokeLinecap="round"
        animate={{ d: ["M66 84 L82 68", "M66 84 L80 62", "M66 84 L82 68"] }}
        transition={{ duration: 0.5, repeat: Infinity, delay: 0.25 }}
      />
      
      {/* Legs */}
      <path d="M42 102 L38 118" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M58 102 L62 118" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function ResultsCard({ archetype, cooperateCount, defectCount, winWinCount, betrayedCount, onRestart }: ResultsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { playClick } = useSound();

  const handleDownload = async () => {
    if (!cardRef.current) return;
    playClick();
    try {
      const dataUrl = await toPng(cardRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `trust-fall-${archetype.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const handleShare = () => {
    playClick();
    const shareText = `I got ${archetype.name} on The Trust Fall - A Prisoner's Dilemma Simulation`;
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'The Trust Fall', text: shareText, url: shareUrl }).catch(() => {});
    } else {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(twitterUrl, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-12"
    >
      <div 
        ref={cardRef} 
        className="bg-background p-8 md:p-12 max-w-md w-full mb-8 border-2 border-foreground rounded-lg"
        style={{ borderRadius: '12px' }}
      >
        <div className="text-center mb-4">
          <p className="font-mono text-xs text-muted-foreground tracking-widest">YOUR RESULT</p>
        </div>

        <div className="flex justify-center mb-4">
          <ArchetypeAvatar archetypeId={archetype.id} />
        </div>

        <div className="text-center mb-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold italic mb-2">{archetype.name}</h2>
          <p className="font-mono text-sm text-muted-foreground">{archetype.title}</p>
        </div>

        <p className="font-serif text-center text-sm text-muted-foreground mb-8 leading-relaxed italic">
          "{archetype.description}"
        </p>

        <div className="grid grid-cols-2 gap-4 text-center font-mono">
          <div className="bg-cooperate/10 rounded-lg p-3">
            <p className="text-2xl font-bold text-cooperate">{cooperateCount}</p>
            <p className="text-xs text-muted-foreground">Cooperated</p>
          </div>
          <div className="bg-defect/10 rounded-lg p-3">
            <p className="text-2xl font-bold text-defect">{defectCount}</p>
            <p className="text-xs text-muted-foreground">Defected</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-2xl font-bold">{winWinCount}</p>
            <p className="text-xs text-muted-foreground">Win-Wins</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-2xl font-bold">{betrayedCount}</p>
            <p className="text-xs text-muted-foreground">Betrayed</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={handleDownload} className="btn-choice px-6 py-3 text-sm font-mono">Download</button>
        <button onClick={handleShare} className="btn-choice px-6 py-3 text-sm font-mono">Share</button>
      </div>

      <button
        onClick={() => { playClick(); onRestart(); }}
        className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
      >
        Play Again
      </button>
    </motion.div>
  );
}
