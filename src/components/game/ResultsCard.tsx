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
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="max-w-lg w-full">
        {/* The shareable card */}
        <div 
          ref={cardRef}
          className="paper-container bg-background mb-6"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <p className="font-mono text-xs text-muted-foreground mb-1">
              THE ABSURD MARSHMALLOW TEST
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              OFFICIAL RESULTS
            </p>
          </div>

          {/* Archetype */}
          <div className="text-center mb-6">
            <h2 className="font-serif text-3xl md:text-4xl font-black mb-1">
              {archetype.name}
            </h2>
            <p className="font-mono text-sm text-muted-foreground">
              {archetype.title}
            </p>
          </div>

          {/* Stick figure avatar */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 border-2 border-foreground flex items-center justify-center">
              <StickFigure 
                pose={archetype.id === 'toddler' ? 'tripped' : 'standing'} 
                className={archetype.id === 'toddler' ? 'w-16 h-12' : 'w-12 h-16'}
              />
            </div>
          </div>

          {/* Description */}
          <p className="font-sans text-center text-sm mb-6 leading-relaxed">
            {archetype.description}
          </p>

          {/* Stats */}
          <div className="border-t border-foreground pt-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="font-mono text-2xl font-bold">{laterCount}/6</p>
                <p className="font-sans text-xs text-muted-foreground">Delayed Choices</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold">
                  {level7WaitTime !== null ? `${level7WaitTime}s` : '-'}
                </p>
                <p className="font-sans text-xs text-muted-foreground">Timer Endurance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button
            onClick={handleDownload}
            className="btn-later p-3 text-sm font-semibold"
          >
            Download
          </button>
          <button
            onClick={handleShare}
            className="btn-later p-3 text-sm font-semibold"
          >
            Share
          </button>
          <button
            onClick={handleCopyLink}
            className="btn-later p-3 text-sm font-semibold"
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
          className="w-full paper-border bg-background p-3 text-sm font-semibold hover:bg-secondary transition-colors"
        >
          Take Test Again
        </button>
      </div>
    </motion.div>
  );
}
