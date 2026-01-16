import { motion } from 'framer-motion';

interface ToastingMarshmallowVisualProps {
  seconds: number;
  maxSeconds: number;
  className?: string;
}

export function ToastingMarshmallowVisual({ seconds, maxSeconds, className = '' }: ToastingMarshmallowVisualProps) {
  // Toast progress: starts at 30s, complete at 60s
  const toastStart = maxSeconds / 2;
  const toastProgress = Math.max(0, Math.min(1, (seconds - toastStart) / toastStart));
  
  // Color interpolation for toasting effect
  const marshmallowColor = `hsl(${40 - toastProgress * 25} ${30 + toastProgress * 20}% ${96 - toastProgress * 45}%)`;
  const strokeColor = `hsl(${30 - toastProgress * 15} ${20 + toastProgress * 30}% ${60 - toastProgress * 35}%)`;
  
  // Emoji expression changes as it toasts
  const getExpression = () => {
    if (toastProgress < 0.3) return 'happy';
    if (toastProgress < 0.6) return 'worried';
    if (toastProgress < 0.9) return 'stressed';
    return 'crispy';
  };
  
  const expression = getExpression();

  return (
    <svg viewBox="0 0 200 180" className={`w-full max-w-xs ${className}`}>
      {/* Background */}
      <rect x="0" y="0" width="200" height="180" fill="hsl(var(--background))" />
      
      {/* Glow effect - intensifies as toasting */}
      {toastProgress > 0 && (
        <motion.ellipse
          cx="100"
          cy="130"
          rx={40 + toastProgress * 20}
          ry={20 + toastProgress * 10}
          fill={`hsl(${30 - toastProgress * 20} ${60 + toastProgress * 30}% 50%)`}
          opacity={toastProgress * 0.3}
          animate={{ 
            rx: [40 + toastProgress * 20, 50 + toastProgress * 20, 40 + toastProgress * 20],
            opacity: [toastProgress * 0.2, toastProgress * 0.4, toastProgress * 0.2]
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
      
      {/* Plate */}
      <ellipse cx="100" cy="155" rx="45" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
      <ellipse cx="100" cy="152" rx="38" ry="6" fill="hsl(var(--muted))" opacity="0.2" />
      
      {/* Large kawaii marshmallow */}
      <motion.g
        animate={{ 
          y: [0, -3, 0],
          scale: toastProgress > 0.8 ? [1, 1.02, 1] : 1
        }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          filter: `brightness(${1 - toastProgress * 0.15}) saturate(${1 + toastProgress * 0.3})`
        }}
      >
        {/* Marshmallow body */}
        <path 
          d="M60 148 Q52 130 55 105 Q60 85 100 80 Q140 85 145 105 Q148 130 140 148 Q125 160 100 160 Q75 160 60 148Z" 
          stroke={strokeColor}
          fill={marshmallowColor}
          strokeWidth="2.5"
        />
        
        {/* Toast marks appear as it cooks */}
        {toastProgress > 0.4 && (
          <g opacity={Math.min(1, (toastProgress - 0.4) * 2)}>
            <path d="M70 120 Q72 115 70 110" stroke={`hsl(25 40% ${40 - toastProgress * 20}%)`} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M130 125 Q132 118 128 112" stroke={`hsl(25 40% ${40 - toastProgress * 20}%)`} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M85 145 Q88 140 85 135" stroke={`hsl(25 40% ${40 - toastProgress * 20}%)`} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M115 142 Q118 137 114 132" stroke={`hsl(25 40% ${40 - toastProgress * 20}%)`} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </g>
        )}
        
        {/* Eyes */}
        <g>
          {expression === 'happy' && (
            <>
              <ellipse cx="82" cy="115" rx="8" ry="10" fill="hsl(var(--background))" stroke="hsl(30 25% 25%)" strokeWidth="1.5" />
              <ellipse cx="118" cy="115" rx="8" ry="10" fill="hsl(var(--background))" stroke="hsl(30 25% 25%)" strokeWidth="1.5" />
              <ellipse cx="83" cy="117" rx="4" ry="5" fill="hsl(30 25% 25%)" />
              <ellipse cx="119" cy="117" rx="4" ry="5" fill="hsl(30 25% 25%)" />
              <circle cx="80" cy="113" r="2" fill="hsl(0 0% 100%)" />
              <circle cx="116" cy="113" r="2" fill="hsl(0 0% 100%)" />
              <circle cx="85" cy="119" r="1" fill="hsl(0 0% 100%)" />
              <circle cx="121" cy="119" r="1" fill="hsl(0 0% 100%)" />
            </>
          )}
          {expression === 'worried' && (
            <>
              <ellipse cx="82" cy="115" rx="8" ry="10" fill="hsl(var(--background))" stroke="hsl(30 25% 25%)" strokeWidth="1.5" />
              <ellipse cx="118" cy="115" rx="8" ry="10" fill="hsl(var(--background))" stroke="hsl(30 25% 25%)" strokeWidth="1.5" />
              <ellipse cx="83" cy="118" rx="4" ry="4" fill="hsl(30 25% 25%)" />
              <ellipse cx="119" cy="118" rx="4" ry="4" fill="hsl(30 25% 25%)" />
              <circle cx="80" cy="114" r="2" fill="hsl(0 0% 100%)" />
              <circle cx="116" cy="114" r="2" fill="hsl(0 0% 100%)" />
              {/* Worried eyebrows */}
              <path d="M74 105 Q80 108 88 106" stroke="hsl(30 25% 25%)" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M126 105 Q120 108 112 106" stroke="hsl(30 25% 25%)" strokeWidth="2" fill="none" strokeLinecap="round" />
            </>
          )}
          {expression === 'stressed' && (
            <>
              <path d="M74 112 Q82 108 90 112" stroke="hsl(30 25% 25%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M110 112 Q118 108 126 112" stroke="hsl(30 25% 25%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              {/* X X eyes */}
              <motion.g animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                <path d="M78 118 L88 128 M88 118 L78 128" stroke="hsl(30 25% 25%)" strokeWidth="2" strokeLinecap="round" />
                <path d="M112 118 L122 128 M122 118 L112 128" stroke="hsl(30 25% 25%)" strokeWidth="2" strokeLinecap="round" />
              </motion.g>
            </>
          )}
          {expression === 'crispy' && (
            <>
              {/* Spiral eyes */}
              <motion.g animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: '82px 120px' }}>
                <path d="M82 115 Q86 115 86 120 Q86 125 82 125 Q78 125 78 120" stroke="hsl(30 25% 25%)" strokeWidth="2" fill="none" />
              </motion.g>
              <motion.g animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: '118px 120px' }}>
                <path d="M118 115 Q122 115 122 120 Q122 125 118 125 Q114 125 114 120" stroke="hsl(30 25% 25%)" strokeWidth="2" fill="none" />
              </motion.g>
            </>
          )}
        </g>
        
        {/* Mouth */}
        {expression === 'happy' && (
          <path d="M88 138 Q100 148 112 138" stroke="hsl(30 25% 25%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}
        {expression === 'worried' && (
          <motion.path 
            d="M88 140 Q100 135 112 140" 
            stroke="hsl(30 25% 25%)" 
            strokeWidth="2" 
            fill="none" 
            strokeLinecap="round"
            animate={{ d: ["M88 140 Q100 135 112 140", "M88 140 Q100 138 112 140", "M88 140 Q100 135 112 140"] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
        {expression === 'stressed' && (
          <motion.ellipse 
            cx="100" cy="140" rx="8" ry="6" 
            fill="hsl(0 50% 40%)" 
            stroke="hsl(30 25% 25%)" 
            strokeWidth="1.5"
            animate={{ ry: [5, 7, 5] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          />
        )}
        {expression === 'crispy' && (
          <path d="M85 142 Q92 138 100 142 Q108 138 115 142" stroke="hsl(30 25% 25%)" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        
        {/* Rosy cheeks - fade as it toasts */}
        <ellipse cx="68" cy="130" rx="8" ry="5" fill="hsl(350 70% 75%)" opacity={0.5 - toastProgress * 0.3} />
        <ellipse cx="132" cy="130" rx="8" ry="5" fill="hsl(350 70% 75%)" opacity={0.5 - toastProgress * 0.3} />
        
        {/* Sweat drops when stressed */}
        {(expression === 'worried' || expression === 'stressed') && (
          <motion.g
            animate={{ y: [0, 5, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <path d="M140 105 Q143 112 140 118 Q137 112 140 105Z" fill="hsl(200 80% 70%)" />
          </motion.g>
        )}
        
        {/* Steam/smoke when very toasted */}
        {toastProgress > 0.6 && (
          <g opacity={Math.min(1, (toastProgress - 0.6) * 2.5)}>
            <motion.path
              d="M75 75 Q70 65 75 55"
              stroke="hsl(0 0% 60%)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              animate={{ y: [0, -10, 0], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            />
            <motion.path
              d="M100 70 Q95 60 100 50"
              stroke="hsl(0 0% 60%)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              animate={{ y: [0, -10, 0], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            <motion.path
              d="M125 75 Q130 65 125 55"
              stroke="hsl(0 0% 60%)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              animate={{ y: [0, -10, 0], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
          </g>
        )}
      </motion.g>
      
      {/* Progress indicator text */}
      <text x="100" y="20" textAnchor="middle" className="font-mono fill-muted-foreground" fontSize="10">
        {toastProgress >= 1 ? "Perfectly Toasted ✓" : toastProgress > 0 ? "Toasting..." : "Waiting..."}
      </text>
    </svg>
  );
}