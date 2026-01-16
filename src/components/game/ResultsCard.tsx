import { useRef } from 'react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Archetype } from '@/lib/gameData';
import { Choice } from '@/hooks/useGameState';
import { useSound } from '@/hooks/useSound';
import { StickFigure } from './StickFigure';

interface ResultsCardProps {
  archetype: Archetype;
  choices: (Choice | null)[];
  level7WaitTime: number | null;
  onRestart: () => void;
}

export function ResultsCard({ archetype, choices, level7WaitTime, onRestart }: ResultsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { playClick } = useSound();

  const laterCount = choices.filter(c => c === 'later').length;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    playClick();
    
    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      link.download = `marshmallow-test-${archetype.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const handleShare = () => {
    playClick();
    
    const shareText = `I got ${archetype.name} on The Absurd Marshmallow Test`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: 'The Absurd Marshmallow Test',
        text: shareText,
        url: shareUrl,
      }).catch(() => {});
    } else {
      // Fallback to Twitter
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(twitterUrl, '_blank');
    }
  };

  const handleCopyLink = () => {
    playClick();
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-12"
    >
      {/* The shareable card */}
      <div 
        ref={cardRef}
        className="bg-background p-8 md:p-12 max-w-md w-full mb-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <p className="font-mono text-xs text-muted-foreground tracking-widest">
            THE ABSURD MARSHMALLOW TEST
          </p>
        </div>

        {/* Stick figure avatar */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 flex items-center justify-center">
            <StickFigure 
              pose={archetype.id === 'toddler' ? 'tripped' : 'standing'} 
              className={archetype.id === 'toddler' ? 'w-20 h-16' : 'w-16 h-20'}
            />
          </div>
        </div>

        {/* Archetype */}
        <div className="text-center mb-6">
          <h2 className="font-serif text-3xl md:text-4xl font-bold italic mb-2">
            {archetype.name}
          </h2>
          <p className="font-mono text-sm text-muted-foreground">
            {archetype.title}
          </p>
        </div>

        {/* Description */}
        <p className="font-serif text-center text-base md:text-lg italic text-muted-foreground mb-8 leading-relaxed">
          {archetype.description}
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-8 text-center">
          <div>
            <p className="font-mono text-3xl font-bold">{laterCount}/6</p>
            <p className="font-mono text-xs text-muted-foreground mt-1">Delayed</p>
          </div>
          <div>
            <p className="font-mono text-3xl font-bold">
              {level7WaitTime !== null ? `${level7WaitTime}s` : '-'}
            </p>
            <p className="font-mono text-xs text-muted-foreground mt-1">Timer</p>
          </div>
        </div>
      </div>

      {/* Action buttons - minimal */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleDownload}
          className="btn-choice px-6 py-3 text-sm"
        >
          Download
        </button>
        <button
          onClick={handleShare}
          className="btn-choice px-6 py-3 text-sm"
        >
          Share
        </button>
        <button
          onClick={handleCopyLink}
          className="btn-choice px-6 py-3 text-sm"
        >
          Copy Link
        </button>
      </div>

      {/* Restart */}
      <button
        onClick={() => {
          playClick();
          onRestart();
        }}
        className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
      >
        Take Test Again
      </button>
    </motion.div>
  );
}
