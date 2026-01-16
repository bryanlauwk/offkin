import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function TVVisual() {
  const [showSpoiler, setShowSpoiler] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowSpoiler(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-48 flex items-center justify-center">
      {/* TV Frame */}
      <div className="relative w-56 h-40 border-4 border-foreground bg-background">
        {/* Screen with static */}
        <div className="absolute inset-1 overflow-hidden bg-muted">
          {/* Static noise effect */}
          <motion.div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' /%3E%3C/svg%3E")`,
            }}
            animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
            transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Spoiler alert text */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            animate={{ opacity: showSpoiler ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-action-now px-3 py-1 border-2 border-foreground">
              <p className="font-mono text-sm font-bold text-action-now-foreground">SPOILER ALERT</p>
            </div>
          </motion.div>
        </div>
        
        {/* TV Stand */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-4 border-2 border-foreground bg-background" />
      </div>
    </div>
  );
}
