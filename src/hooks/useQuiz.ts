import { useState, useCallback } from 'react';
import type { Word, Adjective } from '../types';
import { ADJECTIVES } from '../constants';

export interface QuizState {
  currentWord: Word | null;
  isReverseQuiz: boolean;
  isPhraseQuiz: boolean;
  phraseAdjective: Adjective | null;
  isPlayerInitiated: boolean;
  streak: number;
}

export interface UseQuizProps {
  getStats: (korean: string) => { correctCount: number; correctStreak: number };
  getUnlockedWords: () => Word[];
}

export function useQuiz({ getStats, getUnlockedWords }: UseQuizProps) {
  const [quizState, setQuizState] = useState<QuizState>({
    currentWord: null,
    isReverseQuiz: false,
    isPhraseQuiz: false,
    phraseAdjective: null,
    isPlayerInitiated: false,
    streak: 0,
  });

  const pickQuizWord = useCallback((): Word => {
    const unlocked = getUnlockedWords();
    const now = Date.now();

    const reviewDue: Word[] = [];
    const newWords: Word[] = [];

    unlocked.forEach(w => {
      const s = getStats(w.korean);
      if (s.correctCount === 0) {
        newWords.push(w);
      } else {
        // Simplified interval check - just check if it's been a while
        const interval = Math.min(Math.max(30000 * Math.pow(2, s.correctStreak), 30000), 86400000);
        const lastSeen = (getStats(w.korean) as { lastSeen?: number }).lastSeen || 0;
        if (now - lastSeen > interval) {
          reviewDue.push(w);
        }
      }
    });

    let pool: Word[];
    if (reviewDue.length > 0 && newWords.length > 0) {
      pool = Math.random() < 0.6 ? reviewDue : newWords;
    } else if (reviewDue.length > 0) {
      pool = reviewDue;
    } else if (newWords.length > 0) {
      pool = newWords;
    } else {
      pool = unlocked;
    }

    const weights = pool.map(w => {
      const s = getStats(w.korean);
      return Math.max(1, 6 - s.correctStreak);
    });
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }, [getStats, getUnlockedWords]);

  const pickDistractors = useCallback((correct: Word, count: number): Word[] => {
    const unlocked = getUnlockedWords().filter(w => w.emoji !== correct.emoji);
    const sameCategory = unlocked.filter(w => w.category === correct.category);
    const shuffledSame = [...sameCategory].sort(() => Math.random() - 0.5);
    const shuffledOther = [...unlocked.filter(w => w.category !== correct.category)].sort(() => Math.random() - 0.5);
    const pool = [...shuffledSame, ...shuffledOther];
    return pool.slice(0, count);
  }, [getUnlockedWords]);

  const startQuiz = useCallback((playerInitiated: boolean = false) => {
    const word = pickQuizWord();
    const stats = getStats(word.korean);

    let isReverse = false;
    let isPhrase = false;
    let adjective: Adjective | null = null;

    // Phrase challenge
    if (stats.correctCount >= 5 && word.category !== 'actions' && Math.random() < 0.2) {
      isPhrase = true;
      adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    } else {
      // Reverse quiz
      const reverseEligible = getUnlockedWords().filter(w => getStats(w.korean).correctCount >= 3);
      if (reverseEligible.length >= 3 && stats.correctCount >= 3 && Math.random() < 0.3) {
        isReverse = true;
      }
    }

    setQuizState({
      currentWord: word,
      isReverseQuiz: isReverse,
      isPhraseQuiz: isPhrase,
      phraseAdjective: adjective,
      isPlayerInitiated: playerInitiated,
      streak: quizState.streak,
    });

    return { word, isReverse, isPhrase, adjective };
  }, [pickQuizWord, getStats, getUnlockedWords, quizState.streak]);

  const getQuizOptions = useCallback((): Word[] => {
    if (!quizState.currentWord) return [];
    const distractors = pickDistractors(quizState.currentWord, 2);
    return [quizState.currentWord, ...distractors].sort(() => Math.random() - 0.5);
  }, [quizState.currentWord, pickDistractors]);

  const getQuizPrompt = useCallback((): string => {
    if (!quizState.currentWord) return '';

    if (quizState.isPhraseQuiz && quizState.phraseAdjective) {
      return `${quizState.phraseAdjective.korean} ${quizState.currentWord.korean} 주세요!`;
    }

    if (quizState.isReverseQuiz) {
      return quizState.currentWord.emoji;
    }

    if (quizState.isPlayerInitiated) {
      return `${quizState.currentWord.korean} 줄까?`;
    }

    return `${quizState.currentWord.korean} 주세요!`;
  }, [quizState]);

  const checkAnswer = useCallback((chosen: Word): boolean => {
    if (!quizState.currentWord) return false;
    return chosen.emoji === quizState.currentWord.emoji;
  }, [quizState.currentWord]);

  const incrementStreak = useCallback(() => {
    setQuizState(prev => ({ ...prev, streak: prev.streak + 1 }));
  }, []);

  const resetStreak = useCallback(() => {
    setQuizState(prev => ({ ...prev, streak: 0 }));
  }, []);

  const endQuiz = useCallback(() => {
    setQuizState(prev => ({
      ...prev,
      currentWord: null,
      isReverseQuiz: false,
      isPhraseQuiz: false,
      phraseAdjective: null,
      isPlayerInitiated: false,
    }));
  }, []);

  return {
    quizState,
    startQuiz,
    getQuizOptions,
    getQuizPrompt,
    checkAnswer,
    incrementStreak,
    resetStreak,
    endQuiz,
    pickDiscoveryWord: pickQuizWord, // Same logic works for discovery
  };
}
