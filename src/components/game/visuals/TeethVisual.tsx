import { motion } from 'framer-motion';

export function TeethVisual() {
  return (
    <div className="relative w-full h-48 flex items-center justify-center">
      {/* Mouth outline */}
      <motion.div
        animate={{ y: [0, 1, -1, 0] }}
        transition={{ duration: 0.1, repeat: Infinity }}
      >
        {/* Lips */}
        <div className="relative w-48 h-32">
          {/* Upper lip */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-foreground rounded-t-full" />
          
          {/* Teeth area */}
          <div className="absolute top-4 left-2 right-2 h-20 bg-background border-2 border-foreground flex flex-col">
            {/* Upper teeth */}
            <div className="flex-1 flex justify-center gap-1 pt-1">
              {[...Array(8)].map((_, i) => (
                <div key={`upper-${i}`} className="w-4 h-6 bg-background border border-foreground rounded-b" />
              ))}
            </div>
            
            {/* Lower teeth */}
            <div className="flex-1 flex justify-center gap-1 pb-1">
              {[...Array(8)].map((_, i) => (
                <div key={`lower-${i}`} className="relative w-4 h-5 bg-background border border-foreground rounded-t">
                  {/* Kernel stuck between teeth 3 and 4 */}
                  {i === 3 && (
                    <motion.div
                      className="absolute -right-2 top-1 w-3 h-3 bg-foreground rounded-full"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Lower lip */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-foreground rounded-b-full" />
        </div>
      </motion.div>
    </div>
  );
}
