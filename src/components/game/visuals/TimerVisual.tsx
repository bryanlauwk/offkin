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
        
        {/* Large clock overhead */}
        <motion.g
          animate={isNearEnd ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {/* Clock face */}
          <circle cx="100" cy="45" r="35" className="stick-line" fill="hsl(var(--background))" strokeWidth="2.5" />
          
          {/* Clock inner ring */}
          <circle cx="100" cy="45" r="30" className="stick-line" fill="none" strokeWidth="1" opacity="0.3" />
          
          {/* Hour markers */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x1 = 100 + Math.cos(angle) * 26;
            const y1 = 45 + Math.sin(angle) * 26;
            const x2 = 100 + Math.cos(angle) * 30;
            const y2 = 45 + Math.sin(angle) * 30;
            return (
              <line 
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                className="stick-line"
                strokeWidth={i % 3 === 0 ? "2" : "1"}
              />
            );
          })}
          
          {/* Clock hands */}
          {/* Hour hand (slow) */}
          <line 
            x1="100" y1="45" 
            x2="100" y2="30" 
            className="stick-line" 
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${(seconds / 3600) * 360} 100 45)`}
          />
          
          {/* Minute hand (progress based) */}
          <motion.line 
            x1="100" y1="45" 
            x2="100" y2="22" 
            className="stick-line" 
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ rotate: progress * 360 }}
            style={{ transformOrigin: '100px 45px' }}
          />
          
          {/* Second hand */}
          <motion.line 
            x1="100" y1="45" 
            x2="100" y2="18" 
            stroke="hsl(var(--destructive))"
            strokeWidth="1"
            strokeLinecap="round"
            animate={{ rotate: (seconds % 60) * 6 }}
            style={{ transformOrigin: '100px 45px' }}
          />
          
          {/* Center dot */}
          <circle cx="100" cy="45" r="3" className="stick-fill" />
        </motion.g>
        
        {/* Chibi person sitting and waiting */}
        <g>
          {/* Chair */}
          <rect x="75" y="130" width="50" height="5" rx="1" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          <rect x="78" y="135" width="4" height="20" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <rect x="118" y="135" width="4" height="20" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          
          {/* Body sitting */}
          <ellipse cx="100" cy="122" rx="18" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Legs dangling */}
          <path d="M88 130 Q82 140 85 150" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M112 130 Q118 140 115 150" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Arms - hands clasped in lap */}
          <path d="M85 120 Q75 125 80 130" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M115 120 Q125 125 120 130" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          {/* Clasped hands */}
          <ellipse cx="100" cy="130" rx="8" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Head */}
          <ellipse cx="100" cy="100" rx="22" ry="20" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Hair */}
          <path d="M80 88 Q82 72 100 68 Q118 72 120 88" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          <path d="M84 84 Q92 75 100 72" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M116 84 Q108 75 100 72" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Face expression changes based on progress */}
          {progress < 0.5 ? (
            // Calm waiting face
            <>
              {/* Normal eyes */}
              <ellipse cx="92" cy="98" rx="4" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
              <ellipse cx="108" cy="98" rx="4" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
              <circle cx="92" cy="99" r="2" className="stick-fill" />
              <circle cx="108" cy="99" r="2" className="stick-fill" />
              {/* Neutral eyebrows */}
              <path d="M87 92 Q92 90 97 92" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M103 92 Q108 90 113 92" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
              {/* Calm mouth */}
              <path d="M95 108 Q100 110 105 108" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
            </>
          ) : progress < 0.83 ? (
            // Getting antsy
            <>
              {/* Slightly strained eyes */}
              <motion.g animate={{ y: [0, -0.5, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>
                <ellipse cx="92" cy="98" rx="5" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
                <ellipse cx="108" cy="98" rx="5" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
                <circle cx="92" cy="98" r="2.5" className="stick-fill" />
                <circle cx="108" cy="98" r="2.5" className="stick-fill" />
              </motion.g>
              {/* Tense eyebrows */}
              <path d="M86 91 Q92 88 98 92" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M102 92 Q108 88 114 91" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
              {/* Tense mouth */}
              <path d="M94 108 Q100 106 106 108" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            // Almost there - excited/strained
            <>
              {/* Wide determined eyes */}
              <motion.g animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 0.3, repeat: Infinity }}>
                <ellipse cx="92" cy="98" rx="5" ry="7" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
                <ellipse cx="108" cy="98" rx="5" ry="7" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
                <circle cx="92" cy="98" r="3" className="stick-fill" />
                <circle cx="108" cy="98" r="3" className="stick-fill" />
                <circle cx="91" cy="96" r="1" fill="hsl(var(--background))" />
                <circle cx="107" cy="96" r="1" fill="hsl(var(--background))" />
              </motion.g>
              {/* Determined eyebrows */}
              <path d="M85 90 Q92 86 99 91" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
              <path d="M101 91 Q108 86 115 90" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
              {/* Gritted teeth smile */}
              <path d="M93 108 Q100 112 107 108" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
          
          {/* Nose */}
          <path d="M100 102 Q101 105 100 107" className="stick-line" fill="none" strokeWidth="1" strokeLinecap="round" />
          
          {/* Cheek blush */}
          <ellipse cx="84" cy="104" rx="4" ry="2.5" fill="hsl(var(--muted))" opacity="0.35" />
          <ellipse cx="116" cy="104" rx="4" ry="2.5" fill="hsl(var(--muted))" opacity="0.35" />
          
          {/* Sweat drop if past halfway */}
          {progress > 0.5 && (
            <motion.path
              d="M78 95 Q76 100 78 103 Q80 100 78 95Z"
              className="stick-line"
              fill="hsl(var(--background))"
              strokeWidth="1"
              animate={{ y: [0, 5], opacity: [1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeIn" }}
            />
          )}
        </g>
        
        {/* Tick marks / time passing indicators */}
        {progress > 0.3 && (
          <motion.text
            x="155"
            y="100"
            className="stick-fill"
            fontSize="10"
            fontStyle="italic"
            opacity="0.5"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            tick...
          </motion.text>
        )}
        
        {progress > 0.6 && (
          <motion.text
            x="40"
            y="95"
            className="stick-fill"
            fontSize="10"
            fontStyle="italic"
            opacity="0.5"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          >
            tock...
          </motion.text>
        )}
      </svg>
    </div>
  );
}
