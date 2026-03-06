export interface Word {
  korean: string;
  emoji: string;
  category: string;
}

export interface CategoryWord {
  korean: string;
  emoji: string;
}

export interface Category {
  id: string;
  name: string;
  unlockAt: number;
  words: CategoryWord[];
}

export interface WordStats {
  correctCount: number;
  correctStreak: number;
  lastSeen: number;
  interval: number;
  exposureCount?: number;
}

export interface Adjective {
  korean: string;
  english: string;
}

export interface Session {
  lastPlayedDate: string | null;
  currentStreak: number;
  bestStreak: number;
  dailyCorrectCount: number;
  dailyGoal: number;
  awake: boolean;
  firstFeedComplete: boolean;
}
