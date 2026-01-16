import { Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { useSound } from '@/hooks/useSound';

interface GameHeaderProps {
  levelInfo?: {
    current: number;
    total: number;
    title: string;
  } | null;
  showTitle?: boolean;
}

export function GameHeader({ levelInfo, showTitle = true }: GameHeaderProps) {
  const [isMuted, setIsMuted] = useState(false);
  const { setEnabled, playClick } = useSound();

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setEnabled(!newMuted);
    if (!newMuted) {
      playClick();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        {/* Logo - Top Left */}
        <a 
          href="https://example.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
          <div className="w-8 h-8 border-2 border-foreground flex items-center justify-center font-serif font-bold text-sm">
            M
          </div>
          <span className="font-serif font-bold text-sm hidden sm:inline">Your Logo</span>
        </a>

        {/* Center - Title & Level */}
        {showTitle && (
          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <h1 className="font-serif text-lg md:text-xl font-bold italic">
              The Absurd Marshmallow Test
            </h1>
            {levelInfo && (
              <p className="font-mono text-xs text-muted-foreground mt-0.5">
                Level {levelInfo.current} of {levelInfo.total}: {levelInfo.title}
              </p>
            )}
          </div>
        )}

        {/* Sound Toggle - Top Right */}
        <button
          onClick={handleToggleMute}
          className="p-2 hover:bg-secondary rounded-full transition-colors"
          aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  );
}
