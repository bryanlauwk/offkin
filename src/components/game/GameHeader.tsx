import { Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSound } from '@/hooks/useSound';
import { supabase } from '@/integrations/supabase/client';

interface GameHeaderProps {
  levelInfo?: {
    current: number;
    total: number;
    title: string;
  } | null;
  showTitle?: boolean;
}

interface SiteSettings {
  logoUrl: string;
  logoLink: string;
  siteTitle: string;
}

export function GameHeader({ levelInfo, showTitle = true }: GameHeaderProps) {
  const [isMuted, setIsMuted] = useState(false);
  const { setEnabled, playClick } = useSound();
  const [settings, setSettings] = useState<SiteSettings>({
    logoUrl: '',
    logoLink: 'https://example.com',
    siteTitle: 'The Absurd Marshmallow Test'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value');
      
      if (data) {
        const newSettings: SiteSettings = { ...settings };
        data.forEach(setting => {
          if (setting.key === 'logo_url') newSettings.logoUrl = setting.value || '';
          if (setting.key === 'logo_link') newSettings.logoLink = setting.value || 'https://example.com';
          if (setting.key === 'site_title') newSettings.siteTitle = setting.value || 'The Absurd Marshmallow Test';
        });
        setSettings(newSettings);
      }
    };
    
    fetchSettings();
  }, []);

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
          href={settings.logoLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
          {settings.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              alt="Logo" 
              className="h-8 w-auto object-contain"
            />
          ) : (
            <>
              <div className="w-8 h-8 border-2 border-foreground flex items-center justify-center font-serif font-bold text-sm">
                M
              </div>
              <span className="font-serif font-bold text-sm hidden sm:inline">Your Logo</span>
            </>
          )}
        </a>

        {/* Center - Title & Level */}
        {showTitle && (
          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <h1 className="font-serif text-lg md:text-xl font-bold italic">
              {settings.siteTitle}
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
