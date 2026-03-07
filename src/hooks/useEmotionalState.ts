import { useState, useRef, useCallback } from 'react';
import type { EmotionalStateName } from '../types';
import { EMOTIONAL_STATES, TRANSITION_DURATION } from '../constants';
import { lerp, lerpColor, modulateColorByNeeds, type Needs } from '../utils';

export interface InterpolatedEmotionalState {
  color: string;
  scaleX: number;
  scaleY: number;
  offY: number;
  eyeW: number;
  eyeH: number;
  pupilR: number;
  lidTop: number;
  mouth: string;
  blush: boolean;
  anim: string;
}

export function useEmotionalState(
  initialState: EmotionalStateName = 'sleepy',
  needs?: Needs
) {
  const [currentState, setCurrentState] = useState<EmotionalStateName>(initialState);
  const [prevState, setPrevState] = useState<EmotionalStateName>(initialState);
  const transitionRef = useRef({
    progress: 1,
    startTime: 0,
  });
  const needsRef = useRef<Needs | undefined>(needs);

  const setEmotionalState = useCallback((newState: EmotionalStateName) => {
    setCurrentState(current => {
      if (newState === current) return current;
      setPrevState(current);
      transitionRef.current.progress = 0;
      transitionRef.current.startTime = performance.now();
      return newState;
    });
  }, []);

  const updateTransition = useCallback((): number => {
    if (transitionRef.current.progress >= 1) return 1;
    const elapsed = performance.now() - transitionRef.current.startTime;
    const t = Math.min(1, elapsed / TRANSITION_DURATION);
    // Ease in-out
    transitionRef.current.progress = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    return transitionRef.current.progress;
  }, []);

  // Keep needs ref in sync
  needsRef.current = needs;

  const getInterpolatedState = useCallback((forceSleepy: boolean = false): InterpolatedEmotionalState => {
    const t = transitionRef.current.progress;
    const cur = EMOTIONAL_STATES[forceSleepy ? 'sleepy' : currentState];
    const prev = EMOTIONAL_STATES[prevState];

    // Get base interpolated color
    let color = lerpColor(prev.color, cur.color, t);

    // Apply needs-based modulation if needs are provided
    if (needsRef.current) {
      color = modulateColorByNeeds(color, needsRef.current);
    }

    return {
      color,
      scaleX: lerp(prev.scaleX, cur.scaleX, t),
      scaleY: lerp(prev.scaleY, cur.scaleY, t),
      offY: lerp(prev.offY, cur.offY, t),
      eyeW: lerp(prev.eyeW, cur.eyeW, t),
      eyeH: lerp(prev.eyeH, cur.eyeH, t),
      pupilR: lerp(prev.pupilR, cur.pupilR, t),
      lidTop: lerp(prev.lidTop, cur.lidTop, t),
      mouth: t > 0.5 ? cur.mouth : prev.mouth,
      blush: t > 0.5 ? cur.blush : prev.blush,
      anim: t > 0.5 ? cur.anim : prev.anim,
    };
  }, [currentState, prevState]);

  return {
    currentState,
    prevState,
    setEmotionalState,
    updateTransition,
    getInterpolatedState,
    transitionProgress: () => transitionRef.current.progress,
  };
}
