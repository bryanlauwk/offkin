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

  // Get expression-based elements
  const getEyes = () => {
    switch (researcherState) {
      case 'professional':
        return (
          <>
            {/* Confident eyes with glasses */}
            <ellipse cx="32" cy="52" rx="6" ry="7" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <ellipse cx="48" cy="52" rx="6" ry="7" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <ellipse cx="32" cy="53" rx="3" ry="4" className="stick-fill" />
            <ellipse cx="48" cy="53" rx="3" ry="4" className="stick-fill" />
            <circle cx="31" cy="51" r="1.5" fill="hsl(var(--background))" />
            <circle cx="47" cy="51" r="1.5" fill="hsl(var(--background))" />
            {/* Glasses */}
            <ellipse cx="32" cy="52" rx="8" ry="9" className="stick-line" fill="none" strokeWidth="1.2" />
            <ellipse cx="48" cy="52" rx="8" ry="9" className="stick-line" fill="none" strokeWidth="1.2" />
            <line x1="40" y1="52" x2="40" y2="52" className="stick-line" strokeWidth="1.2" />
            <path d="M24 50 L20 48" className="stick-line" strokeWidth="1" />
            <path d="M56 50 L60 48" className="stick-line" strokeWidth="1" />
          </>
        );
      case 'shifty':
        return (
          <motion.g
            animate={{ x: [0, 2, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ellipse cx="32" cy="52" rx="6" ry="7" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <ellipse cx="48" cy="52" rx="6" ry="7" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <ellipse cx="34" cy="53" rx="3" ry="4" className="stick-fill" />
            <ellipse cx="50" cy="53" rx="3" ry="4" className="stick-fill" />
            <circle cx="33" cy="51" r="1.5" fill="hsl(var(--background))" />
            <circle cx="49" cy="51" r="1.5" fill="hsl(var(--background))" />
          </motion.g>
        );
      case 'apologetic':
        return (
          <>
            {/* Worried upward slanted eyebrows */}
            <ellipse cx="32" cy="54" rx="5" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <ellipse cx="48" cy="54" rx="5" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <ellipse cx="32" cy="55" rx="2.5" ry="3" className="stick-fill" />
            <ellipse cx="48" cy="55" rx="2.5" ry="3" className="stick-fill" />
            <circle cx="31" cy="53" r="1" fill="hsl(var(--background))" />
            <circle cx="47" cy="53" r="1" fill="hsl(var(--background))" />
            {/* Worried eyebrows */}
            <path d="M26 46 L38 44" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
            <path d="M42 44 L54 46" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          </>
        );
      case 'clinical':
        return (
          <>
            {/* Narrowed analytical eyes with glasses */}
            <path d="M27 52 L37 52" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M43 52 L53 52" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
            {/* Glasses */}
            <ellipse cx="32" cy="52" rx="8" ry="7" className="stick-line" fill="none" strokeWidth="1.2" />
            <ellipse cx="48" cy="52" rx="8" ry="7" className="stick-line" fill="none" strokeWidth="1.2" />
            <line x1="40" y1="52" x2="40" y2="52" className="stick-line" strokeWidth="1.2" />
          </>
        );
      case 'manic':
        return (
          <motion.g
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            {/* Wide excited eyes */}
            <ellipse cx="32" cy="52" rx="7" ry="9" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <ellipse cx="48" cy="52" rx="7" ry="9" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <ellipse cx="32" cy="53" rx="4" ry="5" className="stick-fill" />
            <ellipse cx="48" cy="53" rx="4" ry="5" className="stick-fill" />
            <circle cx="30" cy="50" r="2" fill="hsl(var(--background))" />
            <circle cx="46" cy="50" r="2" fill="hsl(var(--background))" />
            {/* Sparkle */}
            <circle cx="34" cy="56" r="1" fill="hsl(var(--background))" />
            <circle cx="50" cy="56" r="1" fill="hsl(var(--background))" />
          </motion.g>
        );
      case 'knowing':
        return (
          <>
            {/* One eye winking, smug */}
            <ellipse cx="32" cy="52" rx="6" ry="7" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <ellipse cx="32" cy="53" rx="3" ry="4" className="stick-fill" />
            <circle cx="31" cy="51" r="1.5" fill="hsl(var(--background))" />
            {/* Winking eye */}
            <path d="M43 52 Q48 48 53 52" className="stick-line" fill="none" strokeWidth="2" />
          </>
        );
      default:
        return null;
    }
  };

  const getMouth = () => {
    switch (researcherState) {
      case 'professional':
        return <path d="M35 66 Q40 68 45 66" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />;
      case 'shifty':
        return <path d="M35 66 Q40 64 45 66" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />;
      case 'apologetic':
        return <path d="M35 68 Q40 72 45 68" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />;
      case 'clinical':
        return <line x1="35" y1="66" x2="45" y2="66" className="stick-line" strokeWidth="2" strokeLinecap="round" />;
      case 'manic':
        return <path d="M32 64 Q40 76 48 64" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />;
      case 'knowing':
        return <path d="M35 66 Q42 70 48 65" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />;
      default:
        return null;
    }
  };

  const getExtras = () => {
    switch (researcherState) {
      case 'shifty':
        return (
          <>
            {/* Sweat drops */}
            <motion.path
              d="M62 42 Q64 46 62 50 Q60 46 62 42Z"
              fill="hsl(200 80% 70%)"
              animate={{ opacity: [0.5, 1, 0.5], y: [0, 2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            {/* Coffee stain on coat */}
            <ellipse cx="35" cy="105" rx="4" ry="3" fill="hsl(30 30% 70%)" opacity="0.5" />
          </>
        );
      case 'apologetic':
        return (
          <motion.path
            d="M60 48 Q62 52 60 56 Q58 52 60 48Z"
            fill="hsl(200 80% 70%)"
            animate={{ opacity: [0.5, 1, 0.5], y: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        );
      case 'manic':
        return (
          <>
            {/* Sparkles around */}
            <motion.text
              x="15"
              y="45"
              className="fill-foreground"
              fontSize="10"
              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ✦
            </motion.text>
            <motion.text
              x="58"
              y="38"
              className="fill-foreground"
              fontSize="8"
              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
            >
              ✦
            </motion.text>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="flex items-start gap-3"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Chibi Researcher */}
      <motion.svg
        viewBox="0 0 80 130"
        className="w-16 h-24 flex-shrink-0"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Chibi Head - large proportions */}
        <ellipse cx="40" cy="45" rx="25" ry="22" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair - neat professional style */}
        <path 
          d="M16 38 Q20 18 40 14 Q60 18 64 38 Q62 28 40 24 Q22 28 18 38 Z" 
          className="hair-fill"
          strokeWidth="2"
        />
        {/* Hair shine */}
        <path d="M25 28 Q35 22 45 26" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round" />
        
        {/* Dynamic eyes based on state */}
        {getEyes()}
        
        {/* Nose */}
        <path d="M40 56 Q41 60 40 62" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Dynamic mouth based on state */}
        {getMouth()}
        
        {/* Rosy cheeks - subtle */}
        <ellipse cx="24" cy="58" rx="5" ry="3" fill="hsl(0 50% 80%)" opacity="0.3" />
        <ellipse cx="56" cy="58" rx="5" ry="3" fill="hsl(0 50% 80%)" opacity="0.3" />
        
        {/* Body - compact chibi style */}
        <rect x="28" y="68" width="24" height="30" rx="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Lab coat details */}
        <line x1="40" y1="70" x2="40" y2="95" className="stick-line" strokeWidth="1" opacity="0.3" />
        <ellipse cx="35" cy="75" rx="2" ry="2" className="stick-line" fill="none" strokeWidth="1" opacity="0.5" />
        <ellipse cx="45" cy="75" rx="2" ry="2" className="stick-line" fill="none" strokeWidth="1" opacity="0.5" />
        
        {/* Arms */}
        <path d="M28 72 L18 85" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M52 72 L62 85" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Hands */}
        <ellipse cx="16" cy="87" rx="4" ry="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <ellipse cx="64" cy="87" rx="4" ry="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        
        {/* Clipboard */}
        <rect x="60" y="82" width="12" height="16" rx="1" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <line x1="62" y1="86" x2="70" y2="86" className="stick-line" strokeWidth="1" opacity="0.5" />
        <line x1="62" y1="89" x2="70" y2="89" className="stick-line" strokeWidth="1" opacity="0.5" />
        <line x1="62" y1="92" x2="68" y2="92" className="stick-line" strokeWidth="1" opacity="0.5" />
        
        {/* Legs */}
        <path d="M34 98 L30 120" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M46 98 L50 120" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Shoes */}
        <ellipse cx="28" cy="122" rx="5" ry="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <ellipse cx="52" cy="122" rx="5" ry="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        
        {/* State-specific extras */}
        {getExtras()}
      </motion.svg>

      {/* Dialogue bubble - hand-drawn style */}
      <motion.div
        className="relative bg-background border-2 border-foreground p-3 max-w-xs rounded-lg"
        initial={{ opacity: 0, scale: 0.9, x: -5 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        style={{
          borderRadius: '12px 12px 12px 4px',
        }}
      >
        {/* Speech bubble tail */}
        <div 
          className="absolute -left-3 top-4 w-0 h-0"
          style={{
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: '12px solid hsl(var(--foreground))',
          }}
        />
        <div 
          className="absolute -left-2 top-4 w-0 h-0"
          style={{
            borderTop: '5px solid transparent',
            borderBottom: '5px solid transparent',
            borderRight: '10px solid hsl(var(--background))',
            marginTop: '1px',
          }}
        />
        
        <p className="font-mono text-sm leading-relaxed">
          "{dialogue}"
        </p>
      </motion.div>
    </motion.div>
  );
}
