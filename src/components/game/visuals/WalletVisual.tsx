import { motion } from 'framer-motion';
import { StickFigure } from '../StickFigure';

export function WalletVisual() {
  return (
    <div className="relative w-full h-48 flex items-center justify-center">
      {/* Stick figure */}
      <div className="absolute left-1/4">
        <StickFigure pose="standing" className="w-16 h-24" />
      </div>
      
      {/* Wallet */}
      <div className="relative">
        {/* Wallet body */}
        <div className="w-24 h-16 border-2 border-foreground bg-background relative">
          {/* Wallet flap */}
          <div className="absolute -top-4 left-0 right-0 h-6 border-2 border-foreground border-b-0 bg-background" 
               style={{ clipPath: 'polygon(0 100%, 100% 100%, 90% 0, 10% 0)' }} />
          
          {/* Empty inside */}
          <div className="absolute inset-2 border border-dashed border-muted-foreground" />
        </div>
        
        {/* Fly buzzing out */}
        <motion.div
          className="absolute -top-8 right-4"
          animate={{
            x: [0, 3, -2, 2, 0],
            y: [0, -2, 2, -3, 0],
            rotate: [0, 10, -5, 8, 0],
          }}
          transition={{ duration: 0.3, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 20 20" className="w-6 h-6">
            {/* Fly body */}
            <ellipse cx="10" cy="12" rx="4" ry="6" className="stick-fill" />
            {/* Fly head */}
            <circle cx="10" cy="5" r="3" className="stick-fill" />
            {/* Wings */}
            <ellipse cx="5" cy="10" rx="4" ry="2" className="stick-line" fill="none" />
            <ellipse cx="15" cy="10" rx="4" ry="2" className="stick-line" fill="none" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
