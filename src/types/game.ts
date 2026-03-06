export type GameStateName =
  | 'sleeping'
  | 'waking'
  | 'idle'
  | 'hungry'
  | 'bored'
  | 'eating'
  | 'discovering'
  | 'walking'
  | 'flying';

export type WanderState = 'resting' | 'curious' | 'walking' | 'investigating';

export type QuizFrequency = 'frequent' | 'normal' | 'rare' | 'off';

export interface QuizFrequencyInterval {
  min: number;
  max: number;
}

export type QuizFrequencyIntervals = Record<QuizFrequency, QuizFrequencyInterval>;

export type ReturnType = 'first-time' | 'same-day' | 'new-day' | 'lapsed' | 'restored';
