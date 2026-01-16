import { motion } from 'framer-motion';
import { Phase } from '@/lib/gameData';

interface ResearcherVisualProps {
  phase: Phase;
  levelId: number;
  dialogue: string;
}

export function ResearcherVisual({ phase, levelId, dialogue }: ResearcherVisualProps) {
  // Different researcher states based on level
  const getResearcherState = () => {
    switch (levelId) {
      case 1:
      case 2:
        return 'professional';
      case 3:
        return 'shifty';
      case 4:
        return 'apologetic';
      case 5:
      case 6:
        return 'clinical';
      case 7:
      case 8:
        return 'manic';
      case 9:
        return 'knowing';
      default:
        return 'professional';
    }
  };

  const researcherState = getResearcherState();

  return (
    <div className="flex items-start gap-4 mb-6">
      {/* Researcher stick figure */}
      <motion.svg
        viewBox="0 0 60 100"
        className="w-12 h-20 flex-shrink-0"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Head */}
        <circle cx="30" cy="18" r="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Eyes based on state */}
        {researcherState === 'professional' && (
          <>
            <circle cx="26" cy="16" r="2" className="stick-fill" />
            <circle cx="34" cy="16" r="2" className="stick-fill" />
          </>
        )}
        {researcherState === 'shifty' && (
          <motion.g
            animate={{ x: [0, 2, 0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <circle cx="26" cy="16" r="2" className="stick-fill" />
            <circle cx="34" cy="16" r="2" className="stick-fill" />
          </motion.g>
        )}
        {researcherState === 'apologetic' && (
          <>
            <circle cx="26" cy="16" r="2" className="stick-fill" />
            <circle cx="34" cy="16" r="2" className="stick-fill" />
            {/* Sweat drop */}
            <motion.path
              d="M42 12 Q44 16 42 20 Q40 16 42 12Z"
              fill="hsl(200 80% 70%)"
              animate={{ opacity: [0.5, 1, 0.5], y: [0, 2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </>
        )}
        {researcherState === 'clinical' && (
          <>
            <line x1="23" y1="16" x2="29" y2="16" className="stick-line" strokeWidth="2" />
            <line x1="31" y1="16" x2="37" y2="16" className="stick-line" strokeWidth="2" />
          </>
        )}
        {researcherState === 'manic' && (
          <motion.g
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <circle cx="26" cy="16" r="3" className="stick-fill" />
            <circle cx="34" cy="16" r="3" className="stick-fill" />
          </motion.g>
        )}
        {researcherState === 'knowing' && (
          <>
            <path d="M24 14 Q26 18 28 14" className="stick-line" fill="none" strokeWidth="2" />
            <path d="M32 14 Q34 18 36 14" className="stick-line" fill="none" strokeWidth="2" />
          </>
        )}

        {/* Mouth based on state */}
        {researcherState === 'professional' && (
          <line x1="26" y1="24" x2="34" y2="24" className="stick-line" strokeWidth="2" />
        )}
        {researcherState === 'shifty' && (
          <path d="M26 24 Q30 22 34 24" className="stick-line" fill="none" strokeWidth="2" />
        )}
        {researcherState === 'apologetic' && (
          <path d="M26 24 Q30 28 34 24" className="stick-line" fill="none" strokeWidth="2" />
        )}
        {researcherState === 'clinical' && (
          <line x1="26" y1="24" x2="34" y2="24" className="stick-line" strokeWidth="2" />
        )}
        {researcherState === 'manic' && (
          <path d="M24 22 Q30 30 36 22" className="stick-line" fill="none" strokeWidth="2" />
        )}
        {researcherState === 'knowing' && (
          <path d="M26 22 Q30 26 34 22" className="stick-line" fill="none" strokeWidth="2" />
        )}

        {/* Glasses for some states */}
        {(researcherState === 'professional' || researcherState === 'clinical') && (
          <>
            <circle cx="26" cy="16" r="5" className="stick-line" fill="none" strokeWidth="1.5" />
            <circle cx="34" cy="16" r="5" className="stick-line" fill="none" strokeWidth="1.5" />
            <line x1="31" y1="16" x2="29" y2="16" className="stick-line" strokeWidth="1.5" />
          </>
        )}

        {/* Body */}
        <line x1="30" y1="30" x2="30" y2="60" className="stick-line" strokeWidth="2" />
        
        {/* Lab coat */}
        <path 
          d="M20 35 L20 65 L30 62 L40 65 L40 35" 
          className="stick-line" 
          fill={researcherState === 'shifty' ? 'hsl(30 20% 90%)' : 'hsl(var(--background))'} 
          strokeWidth="2" 
        />
        {researcherState === 'shifty' && (
          <>
            {/* Stains on coat */}
            <circle cx="25" cy="50" r="2" fill="hsl(30 30% 70%)" opacity="0.5" />
            <circle cx="35" cy="45" r="1.5" fill="hsl(30 30% 70%)" opacity="0.5" />
          </>
        )}

        {/* Arms */}
        <path d="M30 40 L18 55" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        <path d="M30 40 L42 55" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        
        {/* Clipboard */}
        <rect x="40" y="48" width="10" height="14" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <line x1="42" y1="52" x2="48" y2="52" className="stick-line" strokeWidth="1" />
        <line x1="42" y1="55" x2="48" y2="55" className="stick-line" strokeWidth="1" />
        <line x1="42" y1="58" x2="46" y2="58" className="stick-line" strokeWidth="1" />

        {/* Legs */}
        <path d="M30 60 L22 85" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        <path d="M30 60 L38 85" className="stick-line" strokeWidth="2" strokeLinecap="round" />
      </motion.svg>

      {/* Dialogue bubble */}
      <motion.div
        className="relative bg-background border-2 border-foreground p-3 max-w-xs"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* Bubble tail */}
        <div className="absolute left-0 top-4 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-foreground -translate-x-[10px]" />
        <div className="absolute left-0 top-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-background -translate-x-[7px] translate-y-[2px]" />
        
        <p className="font-mono text-sm italic leading-relaxed">
          "{dialogue}"
        </p>
      </motion.div>
    </div>
  );
}
