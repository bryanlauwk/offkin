import { motion } from 'framer-motion';
import { StickFigure } from '../StickFigure';

export function MarshmallowVisual() {
  return (
    <div className="relative w-full h-48 flex items-end justify-center">
      {/* Table */}
      <div className="absolute bottom-8 w-48 h-2 bg-foreground" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-8 bg-foreground" />
      
      {/* Stick figure sitting */}
      <div className="absolute left-1/4 bottom-6">
        <StickFigure pose="sitting" className="w-20 h-24" />
      </div>
      
      {/* Marshmallow */}
      <motion.div
        className="absolute bottom-10 right-1/3"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 50 50" className="w-12 h-12">
          {/* Marshmallow body */}
          <ellipse cx="25" cy="30" rx="18" ry="15" className="stick-line" fill="hsl(var(--background))" />
          <ellipse cx="25" cy="25" rx="18" ry="15" className="stick-line" fill="hsl(var(--background))" />
          {/* Top rounded part */}
          <ellipse cx="25" cy="18" rx="14" ry="10" className="stick-line" fill="hsl(var(--background))" />
        </svg>
      </motion.div>
    </div>
  );
}
