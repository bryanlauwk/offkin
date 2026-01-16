import { motion } from 'framer-motion';

export function BatteryVisual() {
  return (
    <div className="relative w-full h-48 flex items-center justify-center">
      {/* Phone outline */}
      <div className="relative w-32 h-56 border-2 border-foreground rounded-lg bg-background">
        {/* Screen */}
        <div className="absolute inset-2 border border-foreground flex flex-col items-center justify-center">
          {/* Battery icon */}
          <div className="relative w-16 h-28 border-2 border-foreground">
            {/* Battery top */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-3 border-2 border-foreground border-b-0 bg-background" />
            
            {/* Battery level - 1% red sliver */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-action-now"
              style={{ height: '3%' }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          
          {/* Percentage */}
          <motion.p 
            className="mt-2 font-mono text-lg font-bold"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          >
            1%
          </motion.p>
        </div>
        
        {/* Home button */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-foreground rounded-full" />
      </div>
    </div>
  );
}
