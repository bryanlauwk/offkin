import { motion } from 'framer-motion';

interface StickFigureProps {
  pose?: 'sitting' | 'standing' | 'tripped' | 'pointing';
  className?: string;
}

export function StickFigure({ pose = 'standing', className = '' }: StickFigureProps) {
  if (pose === 'sitting') {
    return (
      <svg viewBox="0 0 100 120" className={className}>
        {/* Head */}
        <circle cx="50" cy="20" r="12" className="stick-line" />
        {/* Body */}
        <line x1="50" y1="32" x2="50" y2="65" className="stick-line" />
        {/* Arms */}
        <line x1="50" y1="45" x2="30" y2="55" className="stick-line" />
        <line x1="50" y1="45" x2="70" y2="55" className="stick-line" />
        {/* Legs (bent for sitting) */}
        <line x1="50" y1="65" x2="35" y2="75" className="stick-line" />
        <line x1="35" y1="75" x2="35" y2="95" className="stick-line" />
        <line x1="50" y1="65" x2="65" y2="75" className="stick-line" />
        <line x1="65" y1="75" x2="65" y2="95" className="stick-line" />
        {/* Chair */}
        <line x1="25" y1="75" x2="75" y2="75" className="stick-line" />
        <line x1="25" y1="75" x2="25" y2="115" className="stick-line" />
        <line x1="75" y1="75" x2="75" y2="115" className="stick-line" />
      </svg>
    );
  }

  if (pose === 'tripped') {
    return (
      <svg viewBox="0 0 140 80" className={className}>
        {/* Head (on ground) */}
        <circle cx="30" cy="35" r="12" className="stick-line" />
        {/* Body (horizontal) */}
        <line x1="42" y1="35" x2="85" y2="45" className="stick-line" />
        {/* Arms (splayed) */}
        <line x1="55" y1="40" x2="45" y2="20" className="stick-line" />
        <line x1="55" y1="40" x2="60" y2="60" className="stick-line" />
        {/* Legs */}
        <line x1="85" y1="45" x2="110" y2="30" className="stick-line" />
        <line x1="85" y1="45" x2="115" y2="55" className="stick-line" />
        {/* Stars/Impact */}
        <text x="20" y="15" className="fill-foreground text-xs">*</text>
        <text x="40" y="65" className="fill-foreground text-xs">*</text>
      </svg>
    );
  }

  if (pose === 'pointing') {
    return (
      <svg viewBox="0 0 60 100" className={className}>
        {/* Head */}
        <circle cx="30" cy="15" r="10" className="stick-line" />
        {/* Body */}
        <line x1="30" y1="25" x2="30" y2="55" className="stick-line" />
        {/* Arms (one pointing) */}
        <line x1="30" y1="35" x2="10" y2="50" className="stick-line" />
        <line x1="30" y1="35" x2="50" y2="25" className="stick-line" />
        {/* Legs */}
        <line x1="30" y1="55" x2="20" y2="85" className="stick-line" />
        <line x1="30" y1="55" x2="40" y2="85" className="stick-line" />
      </svg>
    );
  }

  // Default standing
  return (
    <svg viewBox="0 0 60 100" className={className}>
      {/* Head */}
      <circle cx="30" cy="15" r="12" className="stick-line" />
      {/* Body */}
      <line x1="30" y1="27" x2="30" y2="55" className="stick-line" />
      {/* Arms */}
      <line x1="30" y1="35" x2="15" y2="50" className="stick-line" />
      <line x1="30" y1="35" x2="45" y2="50" className="stick-line" />
      {/* Legs */}
      <line x1="30" y1="55" x2="18" y2="90" className="stick-line" />
      <line x1="30" y1="55" x2="42" y2="90" className="stick-line" />
    </svg>
  );
}
