import { motion } from 'framer-motion';

interface TimerVisualProps {
  seconds: number;
  maxSeconds?: number;
}

export function TimerVisual({ seconds, maxSeconds = 60 }: TimerVisualProps) {
  const progress = Math.min(seconds / maxSeconds, 1);
  const isNearEnd = seconds >= 50;
  
  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <svg viewBox="0 0 200 160" className="w-full h-full max-w-md">
        {/* Ground */}
        <ellipse cx="100" cy="155" rx="80" ry="8" fill="hsl(var(--muted))" opacity="0.2" />
        
        {/* Large clock overhead - looming */}
        <motion.g
          animate={isNearEnd ? { scale: [1, 1.03, 1] } : {}}
          transition={{ duration: 0.4, repeat: Infinity }}
        >
          {/* Clock face */}
          <circle cx="100" cy="42" r="38" className="stick-line" fill="hsl(var(--background))" strokeWidth="2.5" />
          
          {/* Clock inner ring */}
          <circle cx="100" cy="42" r="32" className="stick-line" fill="none" strokeWidth="1" opacity="0.3" />
          
          {/* Hour markers */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x1 = 100 + Math.cos(angle) * 28;
            const y1 = 42 + Math.sin(angle) * 28;
            const x2 = 100 + Math.cos(angle) * 32;
            const y2 = 42 + Math.sin(angle) * 32;
            return (
              <line 
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                className="stick-line"
                strokeWidth={i % 3 === 0 ? "2.5" : "1.5"}
              />
            );
          })}
          
          {/* Clock hands */}
          {/* Hour hand (slow) */}
          <line 
            x1="100" y1="42" 
            x2="100" y2="28" 
            className="stick-line" 
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${(seconds / 3600) * 360} 100 42)`}
          />
          
          {/* Minute hand (progress based) */}
          <motion.line 
            x1="100" y1="42" 
            x2="100" y2="18" 
            className="stick-line" 
            strokeWidth="2.5"
            strokeLinecap="round"
            animate={{ rotate: progress * 360 }}
            style={{ transformOrigin: '100px 42px' }}
          />
          
          {/* Second hand - red, ticking */}
          <motion.line 
            x1="100" y1="42" 
            x2="100" y2="14" 
            stroke="hsl(var(--destructive))"
            strokeWidth="1.5"
            strokeLinecap="round"
            animate={{ rotate: (seconds % 60) * 6 }}
            style={{ transformOrigin: '100px 42px' }}
          />
          
          {/* Center dot */}
          <circle cx="100" cy="42" r="4" className="stick-fill" />
        </motion.g>
        
        {/* Chibi person sitting and waiting */}
        <g>
          {/* Chair */}
          <rect x="72" y="130" width="56" height="6" rx="2" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          <rect x="76" y="136" width="5" height="20" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <rect x="119" y="136" width="5" height="20" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          
          {/* Body sitting */}
          <ellipse cx="100" cy="120" rx="20" ry="14" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Legs dangling */}
          <path d="M86 130 Q80 142 84 152" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M114 130 Q120 142 116 152" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Arms - hands clasped together nervously */}
          <path d="M82 118 Q72 124 78 132" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M118 118 Q128 124 122 132" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          {/* Clasped hands */}
          <ellipse cx="100" cy="132" rx="10" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Head */}
          <ellipse cx="100" cy="96" rx="24" ry="22" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Hair - FILLED */}
          <path 
            d="M78 84 Q82 65 100 60 Q118 65 122 84 L118 82 Q112 70 100 68 Q88 70 82 82 Z" 
            className="hair-fill"
            strokeWidth="2"
          />
          {/* Hair highlights */}
          <path d="M88 70 Q96 64 105 68" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
          {/* Hair tuft */}
          <path d="M100 60 Q102 54 106 58" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Face expression changes based on progress */}
          {progress < 0.5 ? (
            // Calm waiting face
            <>
              {/* Normal relaxed eyes */}
              <ellipse cx="90" cy="94" rx="6" ry="7" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
              <ellipse cx="110" cy="94" rx="6" ry="7" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
              <circle cx="90" cy="95" r="3" className="stick-fill" />
              <circle cx="110" cy="95" r="3" className="stick-fill" />
              <circle cx="89" cy="93" r="1.2" fill="hsl(var(--background))" />
              <circle cx="109" cy="93" r="1.2" fill="hsl(var(--background))" />
              {/* Neutral eyebrows */}
              <path d="M84 86 Q90 84 96 86" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M104 86 Q110 84 116 86" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
              {/* Calm small smile */}
              <path d="M94 106 Q100 109 106 106" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
            </>
          ) : progress < 0.83 ? (
            // Getting antsy - fidgeting
            <>
              {/* Slightly strained wider eyes */}
              <motion.g animate={{ y: [0, -0.5, 0] }} transition={{ duration: 0.4, repeat: Infinity }}>
                <ellipse cx="90" cy="94" rx="7" ry="8" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
                <ellipse cx="110" cy="94" rx="7" ry="8" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
                <circle cx="90" cy="94" r="3.5" className="stick-fill" />
                <circle cx="110" cy="94" r="3.5" className="stick-fill" />
                <circle cx="89" cy="92" r="1.2" fill="hsl(var(--background))" />
                <circle cx="109" cy="92" r="1.2" fill="hsl(var(--background))" />
              </motion.g>
              {/* Tense eyebrows */}
              <path d="M82 85 Q90 81 98 87" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
              <path d="M102 87 Q110 81 118 85" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
              {/* Tense mouth - straight line */}
              <path d="M92 106 Q100 104 108 106" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            // Almost there - very strained, determined
            <>
              {/* Wide intense eyes */}
              <motion.g animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 0.25, repeat: Infinity }}>
                <ellipse cx="90" cy="94" rx="8" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
                <ellipse cx="110" cy="94" rx="8" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
                <circle cx="90" cy="94" r="4" className="stick-fill" />
                <circle cx="110" cy="94" r="4" className="stick-fill" />
                <circle cx="88" cy="91" r="1.5" fill="hsl(var(--background))" />
                <circle cx="108" cy="91" r="1.5" fill="hsl(var(--background))" />
              </motion.g>
              {/* Very determined eyebrows - angled intensely */}
              <path d="M80 84 Q90 78 100 86" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M100 86 Q110 78 120 84" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
              {/* Gritted teeth smile - almost there! */}
              <path d="M92 106 Q100 111 108 106" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
          
          {/* Nose */}
          <path d="M100 100 Q101 103 100 105" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Cheek blush */}
          <ellipse cx="80" cy="100" rx="5" ry="3" fill="hsl(0 60% 75%)" opacity="0.4" />
          <ellipse cx="120" cy="100" rx="5" ry="3" fill="hsl(0 60% 75%)" opacity="0.4" />
          
          {/* Sweat drops if past halfway - increasing with progress */}
          {progress > 0.5 && (
            <motion.path
              d="M74 90 Q72 96 74 100 Q76 96 74 90Z"
              className="stick-line"
              fill="hsl(var(--background))"
              strokeWidth="1.5"
              animate={{ y: [0, 8], opacity: [1, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeIn" }}
            />
          )}
          {progress > 0.7 && (
            <motion.path
              d="M126 88 Q124 94 126 98 Q128 94 126 88Z"
              className="stick-line"
              fill="hsl(var(--background))"
              strokeWidth="1"
              animate={{ y: [0, 6], opacity: [1, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeIn", delay: 0.3 }}
            />
          )}
        </g>
        
        {/* Tick tock text indicators */}
        {progress > 0.3 && (
          <motion.text
            x="158"
            y="98"
            className="stick-fill"
            fontSize="11"
            fontStyle="italic"
            opacity="0.5"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            tick...
          </motion.text>
        )}
        
        {progress > 0.6 && (
          <motion.text
            x="35"
            y="92"
            className="stick-fill"
            fontSize="11"
            fontStyle="italic"
            opacity="0.5"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }}
          >
            tock...
          </motion.text>
        )}
      </svg>
    </div>
  );
}
