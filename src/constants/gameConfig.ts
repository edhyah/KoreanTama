import type { QuizFrequencyIntervals } from '../types';

export const HUNGER_DURATION = 35000;
export const HAPPINESS_DURATION = 60000;
export const TICK_INTERVAL = 500;

export const HUNGER_PER_TICK = (100 / HUNGER_DURATION) * TICK_INTERVAL;
export const HAPPINESS_PER_TICK = (100 / HAPPINESS_DURATION) * TICK_INTERVAL;

export const WALK_MIN_DELAY = 5000;
export const WALK_MAX_DELAY = 12000;
export const FLY_MIN_DELAY = 8000;
export const FLY_MAX_DELAY = 20000;
export const DISCOVERY_MIN_DELAY = 20000;
export const DISCOVERY_MAX_DELAY = 40000;
export const DISCOVERY_CHANCE = 0.3;

export const QUIZ_FREQUENCY_INTERVALS: QuizFrequencyIntervals = {
  frequent: { min: 15000, max: 30000 },
  normal: { min: 30000, max: 60000 },
  rare: { min: 60000, max: 120000 },
  off: { min: Infinity, max: Infinity }
};

export const DEFAULT_SESSION = {
  lastPlayedDate: null,
  currentStreak: 0,
  bestStreak: 0,
  dailyCorrectCount: 0,
  dailyGoal: 10,
  awake: false,
  firstFeedComplete: false,
};
