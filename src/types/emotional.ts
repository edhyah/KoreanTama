export type EmotionalStateName =
  | 'sleepy'
  | 'greeting'
  | 'hungry'
  | 'bored'
  | 'playing'
  | 'eating'
  | 'happy'
  | 'sad'
  | 'excited'
  | 'proud'
  | 'thanking'
  | 'annoyed';

export type MouthType =
  | 'smile'
  | 'bigSmile'
  | 'frown'
  | 'flat'
  | 'open'
  | 'openSmall'
  | 'yawn'
  | 'wavy'
  | 'pant'
  | 'smirk'
  | 'munch'
  | 'pout';

export type AnimationType =
  | 'bounce'
  | 'wobble'
  | 'drift'
  | 'shiver'
  | 'nod'
  | 'jump'
  | 'melt'
  | 'munch'
  | 'float';

export interface EmotionalConfig {
  color: string;
  scaleX: number;
  scaleY: number;
  offY: number;
  eyeW: number;
  eyeH: number;
  pupilR: number;
  lidTop: number;
  mouth: MouthType;
  blush: boolean;
  anim: AnimationType;
  phrases: string[];
}

export type EmotionalStates = Record<EmotionalStateName, EmotionalConfig>;
