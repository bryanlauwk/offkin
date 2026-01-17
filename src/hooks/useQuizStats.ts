import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Choice, Outcome } from '@/lib/gameData';

interface LevelStats {
  cooperate: number;
  defect: number;
  total: number;
}

export function useQuizStats() {
  const [totalResponses, setTotalResponses] = useState<number>(0);
  const [levelStats, setLevelStats] = useState<Record<number, LevelStats>>({});
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      // Get total unique sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('quiz_responses')
        .select('session_id')
        .limit(10000);

      if (!sessionsError && sessions) {
        const uniqueSessions = new Set(sessions.map(s => s.session_id));
        setTotalResponses(uniqueSessions.size);
      }

      // Get stats per level
      const { data: responses, error: responsesError } = await supabase
        .from('quiz_responses')
        .select('level, choice')
        .limit(10000);

      if (!responsesError && responses) {
        const stats: Record<number, LevelStats> = {};
        
        responses.forEach(r => {
          if (!stats[r.level]) {
            stats[r.level] = { cooperate: 0, defect: 0, total: 0 };
          }
          if (r.choice === 'cooperate' || r.choice === 'defect') {
            stats[r.level][r.choice as 'cooperate' | 'defect']++;
            stats[r.level].total++;
          }
        });
        
        setLevelStats(stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('quiz_responses_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quiz_responses',
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  const submitResponse = useCallback(async (
    level: number, 
    choice: Choice, 
    sessionId: string,
    opponentChoice?: Choice,
    outcome?: Outcome,
  ) => {
    try {
      const { error } = await supabase
        .from('quiz_responses')
        .insert({
          level,
          choice,
          session_id: sessionId,
          opponent_choice: opponentChoice || null,
          outcome: outcome || null,
        });

      if (error) {
        console.error('Error submitting response:', error);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  }, []);

  const getStatsForLevel = useCallback((level: number): { cooperatePercent: number; defectPercent: number } => {
    const stats = levelStats[level];
    if (!stats || stats.total === 0) {
      // Return weighted defaults based on level escalation
      const defaults: Record<number, { cooperatePercent: number; defectPercent: number }> = {
        1: { cooperatePercent: 92, defectPercent: 8 },    // Coffee Shop - most split
        2: { cooperatePercent: 60, defectPercent: 40 },   // Group Project
        3: { cooperatePercent: 55, defectPercent: 45 },   // Traffic Merge
        4: { cooperatePercent: 45, defectPercent: 55 },   // Last Slice
        5: { cooperatePercent: 40, defectPercent: 60 },   // Corporate Ladder
        6: { cooperatePercent: 25, defectPercent: 75 },   // Parachute
        7: { cooperatePercent: 20, defectPercent: 80 },   // Hostage Exchange
        8: { cooperatePercent: 35, defectPercent: 65 },   // Nuclear Button
        9: { cooperatePercent: 50, defectPercent: 50 },   // Alien Zoo
        10: { cooperatePercent: 30, defectPercent: 70 },  // Simulation Reboot
      };
      return defaults[level] || { cooperatePercent: 50, defectPercent: 50 };
    }
    
    return {
      cooperatePercent: Math.round((stats.cooperate / stats.total) * 100),
      defectPercent: Math.round((stats.defect / stats.total) * 100),
    };
  }, [levelStats]);

  return {
    totalResponses,
    loading,
    submitResponse,
    getStatsForLevel,
    refetch: fetchStats,
  };
}
