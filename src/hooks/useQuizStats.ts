import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Choice } from './useGameState';

interface LevelStats {
  now: number;
  later: number;
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
            stats[r.level] = { now: 0, later: 0, total: 0 };
          }
          stats[r.level][r.choice as 'now' | 'later']++;
          stats[r.level].total++;
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
    waitTimeSeconds?: number
  ) => {
    try {
      const { error } = await supabase
        .from('quiz_responses')
        .insert({
          level,
          choice,
          session_id: sessionId,
          wait_time_seconds: waitTimeSeconds || null,
        });

      if (error) {
        console.error('Error submitting response:', error);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  }, []);

  const getStatsForLevel = useCallback((level: number): { nowPercent: number; laterPercent: number } => {
    const stats = levelStats[level];
    if (!stats || stats.total === 0) {
      // Return weighted defaults for more realistic initial stats
      const defaults: Record<number, { nowPercent: number; laterPercent: number }> = {
        1: { nowPercent: 35, laterPercent: 65 },
        2: { nowPercent: 45, laterPercent: 55 },
        3: { nowPercent: 72, laterPercent: 28 },
        4: { nowPercent: 85, laterPercent: 15 },
        5: { nowPercent: 40, laterPercent: 60 },
        6: { nowPercent: 88, laterPercent: 12 },
      };
      return defaults[level] || { nowPercent: 50, laterPercent: 50 };
    }
    
    return {
      nowPercent: Math.round((stats.now / stats.total) * 100),
      laterPercent: Math.round((stats.later / stats.total) * 100),
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
