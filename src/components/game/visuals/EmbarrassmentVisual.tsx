import { motion } from 'framer-motion';
import { StickFigure } from '../StickFigure';

export function EmbarrassmentVisual() {
  return (
    <div className="relative w-full h-48 flex items-end justify-center pb-4">
      {/* Tripped figure */}
      <div className="absolute left-1/4 bottom-4">
        <StickFigure pose="tripped" className="w-32 h-20" />
      </div>
      
      {/* Crowd of laughing figures */}
      <div className="absolute right-4 bottom-4 flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -3, 0] }}
            transition={{ 
              duration: 0.5, 
              repeat: Infinity, 
              delay: i * 0.15,
              ease: "easeInOut" 
            }}
          >
            <StickFigure pose="pointing" className="w-12 h-20" />
          </motion.div>
        ))}
      </div>
      
      {/* "HA HA" text */}
      <motion.div 
        className="absolute right-8 top-4 font-serif font-bold text-lg"
        animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        HA HA HA
      </motion.div>
    </div>
  );
}
