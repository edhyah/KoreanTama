import { useState, useCallback, useEffect } from 'react';
import type { WordStats, Session, ReturnType } from '../types';
import { CATEGORIES, WORDS } from '../constants/words';
import { DEFAULT_SESSION } from '../constants/gameConfig';

const STATS_KEY = 'koreanTamaStats';
const SESSION_KEY = 'koreanTamaSession';

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function usePersistence() {
  const [wordStats, setWordStats] = useState<Record<string, WordStats>>({});
  const [session, setSession] = useState<Session>({ ...DEFAULT_SESSION });
  const [returnType, setReturnType] = useState<ReturnType>('first-time');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    // Load stats
    try {
      const savedStats = localStorage.getItem(STATS_KEY);
      if (savedStats) {
        setWordStats(JSON.parse(savedStats));
      }
    } catch {
      // ignore
    }

    // Load session
    let loadedSession: Session = { ...DEFAULT_SESSION };
    try {
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (savedSession) {
        const s = JSON.parse(savedSession);
        loadedSession = { ...DEFAULT_SESSION, ...s };
      }
    } catch {
      // ignore
    }

    // Determine return type and update session
    const today = getTodayStr();
    let newReturnType: ReturnType = 'first-time';

    if (!loadedSession.lastPlayedDate) {
      newReturnType = 'first-time';
    } else if (loadedSession.lastPlayedDate === today) {
      newReturnType = 'same-day';
    } else {
      const last = new Date(loadedSession.lastPlayedDate + 'T00:00:00');
      const now = new Date(today + 'T00:00:00');
      const diffDays = Math.round((now.getTime() - last.getTime()) / 86400000);
      if (diffDays === 1) {
        newReturnType = 'new-day';
        loadedSession.currentStreak++;
        if (loadedSession.currentStreak > loadedSession.bestStreak) {
          loadedSession.bestStreak = loadedSession.currentStreak;
        }
      } else {
        newReturnType = 'lapsed';
        loadedSession.currentStreak = 0;
      }
      loadedSession.dailyCorrectCount = 0;
      loadedSession.firstFeedComplete = false;
    }

    loadedSession.lastPlayedDate = today;
    setSession(loadedSession);
    setReturnType(newReturnType);
    setIsLoaded(true);

    // Save updated session
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(loadedSession));
    } catch {
      // ignore
    }
  }, []);

  const saveStats = useCallback((stats: Record<string, WordStats>) => {
    setWordStats(stats);
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
      // ignore
    }
  }, []);

  const saveSession = useCallback((newSession: Session) => {
    setSession(newSession);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    } catch {
      // ignore
    }
  }, []);

  const getStats = useCallback((korean: string): WordStats => {
    if (!wordStats[korean]) {
      return { correctCount: 0, correctStreak: 0, lastSeen: 0, interval: 0 };
    }
    return wordStats[korean];
  }, [wordStats]);

  const updateWordStats = useCallback((korean: string, updates: Partial<WordStats>) => {
    const current = wordStats[korean] || { correctCount: 0, correctStreak: 0, lastSeen: 0, interval: 0 };
    const updated = { ...current, ...updates };
    const newStats = { ...wordStats, [korean]: updated };
    saveStats(newStats);
  }, [wordStats, saveStats]);

  const updateSession = useCallback((updates: Partial<Session>) => {
    const newSession = { ...session, ...updates };
    saveSession(newSession);
  }, [session, saveSession]);

  const getTotalCorrect = useCallback((): number => {
    return Object.values(wordStats).reduce((sum, s) => sum + s.correctCount, 0);
  }, [wordStats]);

  const getUnlockedCategories = useCallback(() => {
    const total = getTotalCorrect();
    return CATEGORIES.filter(c => total >= c.unlockAt);
  }, [getTotalCorrect]);

  const getUnlockedWords = useCallback(() => {
    const unlocked = getUnlockedCategories();
    return WORDS.filter(w => unlocked.some(c => c.id === w.category));
  }, [getUnlockedCategories]);

  const getLearnedWordCount = useCallback((): number => {
    return Object.values(wordStats).filter(s => s.correctCount >= 1).length;
  }, [wordStats]);

  const resetAll = useCallback(() => {
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(SESSION_KEY);
    window.location.reload();
  }, []);

  const setProgressLevel = useCallback((targetTotal: number) => {
    let remaining = targetTotal;
    const newStats: Record<string, WordStats> = {};

    for (let i = 0; i < WORDS.length && remaining > 0; i++) {
      const count = Math.min(remaining, 5);
      newStats[WORDS[i].korean] = {
        correctCount: count,
        correctStreak: count,
        lastSeen: Date.now(),
        interval: 30000
      };
      remaining -= count;
    }

    saveStats(newStats);
  }, [saveStats]);

  return {
    wordStats,
    session,
    returnType,
    isLoaded,
    getStats,
    updateWordStats,
    updateSession,
    getTotalCorrect,
    getUnlockedCategories,
    getUnlockedWords,
    getLearnedWordCount,
    resetAll,
    setProgressLevel,
    setReturnType,
  };
}
