import { useRef, useCallback } from 'react';

export interface IdleAnimationState {
  blinkState: number; // 0 = open, 1 = closing, 2 = closed, 3 = opening
  blinkProgress: number;
  lookTarget: { x: number; y: number };
  weightShiftDirection: number;
}

export function useIdleAnimations() {
  const stateRef = useRef<IdleAnimationState>({
    blinkState: 0,
    blinkProgress: 0,
    lookTarget: { x: 0, y: 0 },
    weightShiftDirection: 0,
  });

  const timersRef = useRef({
    lastBlinkTime: 0,
    nextBlinkDelay: 2000 + Math.random() * 4000,
    lastLookAroundTime: 0,
    nextLookDelay: 4000 + Math.random() * 6000,
    lastWeightShiftTime: 0,
    nextWeightShiftDelay: 6000 + Math.random() * 6000,
  });

  const updateBlinking = useCallback((now: number): number => {
    const state = stateRef.current;
    const timers = timersRef.current;

    // Check if it's time to blink
    if (now - timers.lastBlinkTime > timers.nextBlinkDelay) {
      if (state.blinkState === 0) {
        state.blinkState = 1; // Start closing
        state.blinkProgress = 0;
      }
    }

    // Update blink animation
    if (state.blinkState > 0) {
      state.blinkProgress += 0.15;
      if (state.blinkState === 1 && state.blinkProgress >= 1) {
        state.blinkState = 2; // Fully closed
        state.blinkProgress = 0;
      } else if (state.blinkState === 2 && state.blinkProgress >= 0.3) {
        state.blinkState = 3; // Start opening
        state.blinkProgress = 0;
      } else if (state.blinkState === 3 && state.blinkProgress >= 1) {
        state.blinkState = 0; // Fully open
        timers.lastBlinkTime = now;
        timers.nextBlinkDelay = 2000 + Math.random() * 4000;
      }
    }

    // Return blink-induced lid adjustment
    if (state.blinkState === 1) {
      return state.blinkProgress * 0.9;
    } else if (state.blinkState === 2) {
      return 0.9;
    } else if (state.blinkState === 3) {
      return (1 - state.blinkProgress) * 0.9;
    }
    return 0;
  }, []);

  const updateLookAround = useCallback((now: number, isIdle: boolean): { x: number; y: number } => {
    const state = stateRef.current;
    const timers = timersRef.current;

    if (now - timers.lastLookAroundTime > timers.nextLookDelay && isIdle) {
      // Pick new random look target
      state.lookTarget.x = (Math.random() - 0.5) * 8;
      state.lookTarget.y = (Math.random() - 0.5) * 4;
      timers.lastLookAroundTime = now;
      timers.nextLookDelay = 4000 + Math.random() * 6000;

      // Occasionally "break eye contact" - look away briefly
      if (Math.random() < 0.2) {
        setTimeout(() => {
          state.lookTarget.x = 0;
          state.lookTarget.y = 0;
        }, 800 + Math.random() * 400);
      }
    }

    return state.lookTarget;
  }, []);

  const updateWeightShift = useCallback((now: number, isIdle: boolean): number => {
    const state = stateRef.current;
    const timers = timersRef.current;

    if (now - timers.lastWeightShiftTime > timers.nextWeightShiftDelay && isIdle) {
      state.weightShiftDirection = state.weightShiftDirection === 0
        ? (Math.random() < 0.5 ? -1 : 1)
        : -state.weightShiftDirection;
      timers.lastWeightShiftTime = now;
      timers.nextWeightShiftDelay = 6000 + Math.random() * 6000;
    }

    return state.weightShiftDirection;
  }, []);

  const getBreathingOffset = useCallback((now: number): { scaleX: number; scaleY: number } => {
    const breathCycle = Math.sin(now / 1500) * 0.015;
    return {
      scaleX: 1.0 + breathCycle * 0.5,
      scaleY: 1.0 - breathCycle,
    };
  }, []);

  const setLookTarget = useCallback((x: number, y: number) => {
    stateRef.current.lookTarget = { x, y };
  }, []);

  const resetLookTarget = useCallback(() => {
    stateRef.current.lookTarget = { x: 0, y: 0 };
  }, []);

  return {
    updateBlinking,
    updateLookAround,
    updateWeightShift,
    getBreathingOffset,
    setLookTarget,
    resetLookTarget,
  };
}
