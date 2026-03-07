import { useRef, useCallback } from 'react';
import type { MouthType, BehaviorConfidence } from '../types';

// ============================================
// Types
// ============================================

export type BlinkType = 'normal' | 'double' | 'slow';

export type AwarenessMode = 'idle' | 'noticing' | 'glancing' | 'curious' | 'ignoring';

export type IdleBehaviorType = 'yawn' | 'twitch' | 'daydream';

export type MouthFidgetType = 'relax' | 'soften' | 'breathe' | 'microSmile' | 'prideSoften';

export type ExplorationBehaviorType =
  | 'edgeWander'
  | 'edgePeer'
  | 'spotInvestigate'
  | 'followThing'
  | 'startle'
  | 'reaching'
  // New environmental behaviors
  | 'wallBounce'    // Hit wall, bounce back with surprise
  | 'cornerHide'    // Tuck into corner, peek out
  | 'edgePeek'      // Partially offscreen, curious
  | 'wallClimb'     // Move along wall edge
  | 'screenTap';    // Look at/interact with spot

export interface ExplorationBehavior {
  type: ExplorationBehaviorType;
  edge?: 'left' | 'right' | 'top' | 'bottom';
  corner?: 'tl' | 'tr' | 'bl' | 'br';
  target?: { x: number; y: number };
  path?: Array<{ x: number; y: number }>;
  direction?: 'up' | 'down';
}

export interface IdleAnimationState {
  blinkState: number; // 0 = open, 1 = closing, 2 = closed, 3 = opening
  blinkProgress: number;
  blinkType: BlinkType;
  doubleBlinkCount: number;
  lookTarget: { x: number; y: number };
  weightShiftDirection: number;
  // Awareness
  awarenessMode: AwarenessMode;
  cursorDirection: { x: number; y: number };
  // Autonomous behaviors
  currentIdleBehavior: IdleBehaviorType | null;
  idleBehaviorProgress: number;
  // Exploration
  currentExploration: ExplorationBehavior | null;
  explorationPhase: 'starting' | 'active' | 'ending' | null;
  explorationProgress: number;
  followPathIndex: number;
  // Breath variation
  breathMultiplier: number;
  isSighing: boolean;
  // Mouth fidgets
  currentMouthFidget: MouthFidgetType | null;
  mouthFidgetProgress: number;
  mouthTargetMouth: MouthType | null;
}

// ============================================
// Hook
// ============================================

export function useIdleAnimations() {
  const stateRef = useRef<IdleAnimationState>({
    blinkState: 0,
    blinkProgress: 0,
    blinkType: 'normal',
    doubleBlinkCount: 0,
    lookTarget: { x: 0, y: 0 },
    weightShiftDirection: 0,
    // Awareness
    awarenessMode: 'idle',
    cursorDirection: { x: 0, y: 0 },
    // Autonomous behaviors
    currentIdleBehavior: null,
    idleBehaviorProgress: 0,
    // Exploration
    currentExploration: null,
    explorationPhase: null,
    explorationProgress: 0,
    followPathIndex: 0,
    // Breath
    breathMultiplier: 1,
    isSighing: false,
    // Mouth fidgets
    currentMouthFidget: null,
    mouthFidgetProgress: 0,
    mouthTargetMouth: null,
  });

  const timersRef = useRef({
    // Blinking
    lastBlinkTime: 0,
    nextBlinkDelay: 2000 + Math.random() * 4000,
    // Look around
    lastLookAroundTime: 0,
    nextLookDelay: 4000 + Math.random() * 6000,
    // Weight shift
    lastWeightShiftTime: 0,
    nextWeightShiftDelay: 6000 + Math.random() * 6000,
    // Awareness
    lastCursorMoveTime: 0,
    awarenessStartTime: 0,
    ignoreUntil: 0,
    // Autonomous behaviors
    lastIdleBehaviorTime: 0,
    nextIdleBehaviorDelay: 5000 + Math.random() * 8000,
    idleBehaviorStartTime: 0,
    // Exploration
    lastExplorationTime: 0,
    nextExplorationDelay: 8000 + Math.random() * 12000,
    explorationStartTime: 0,
    // Breath
    lastSighTime: 0,
    nextSighDelay: 15000 + Math.random() * 25000,
    // Mouth fidgets
    lastMouthFidgetTime: 0,
    nextMouthFidgetDelay: 3000 + Math.random() * 5000,
    mouthFidgetStartTime: 0,
  });

  // ============================================
  // Blinking (with variations)
  // ============================================

  const updateBlinking = useCallback((now: number): number => {
    const state = stateRef.current;
    const timers = timersRef.current;

    // Check if it's time to blink
    if (now - timers.lastBlinkTime > timers.nextBlinkDelay) {
      if (state.blinkState === 0) {
        // Determine blink type
        const roll = Math.random();
        if (roll < 0.15) {
          state.blinkType = 'double';
          state.doubleBlinkCount = 0;
        } else if (roll < 0.25) {
          state.blinkType = 'slow';
        } else {
          state.blinkType = 'normal';
        }
        state.blinkState = 1; // Start closing
        state.blinkProgress = 0;
      }
    }

    // Update blink animation
    if (state.blinkState > 0) {
      // Speed varies by blink type
      const blinkSpeed = state.blinkType === 'slow' ? 0.08 : 0.15;
      const holdTime = state.blinkType === 'slow' ? 0.5 : 0.3;

      state.blinkProgress += blinkSpeed;

      if (state.blinkState === 1 && state.blinkProgress >= 1) {
        state.blinkState = 2; // Fully closed
        state.blinkProgress = 0;
      } else if (state.blinkState === 2 && state.blinkProgress >= holdTime) {
        state.blinkState = 3; // Start opening
        state.blinkProgress = 0;
      } else if (state.blinkState === 3 && state.blinkProgress >= 1) {
        // Check if double blink needs another iteration
        if (state.blinkType === 'double' && state.doubleBlinkCount < 1) {
          state.doubleBlinkCount++;
          state.blinkState = 1; // Close again for double blink
          state.blinkProgress = 0;
        } else {
          state.blinkState = 0; // Fully open
          timers.lastBlinkTime = now;
          timers.nextBlinkDelay = 2000 + Math.random() * 4000;
        }
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

  const triggerBlink = useCallback((type: BlinkType) => {
    const state = stateRef.current;
    if (state.blinkState === 0) {
      state.blinkType = type;
      state.doubleBlinkCount = 0;
      state.blinkState = 1;
      state.blinkProgress = 0;
    }
  }, []);

  // ============================================
  // Look Around (enhanced with awareness integration)
  // ============================================

  const updateLookAround = useCallback((now: number, isIdle: boolean): { x: number; y: number } => {
    const state = stateRef.current;
    const timers = timersRef.current;

    // If awareness is controlling look, use cursor direction
    if (state.awarenessMode === 'glancing' || state.awarenessMode === 'curious') {
      return state.cursorDirection;
    }

    // Normal random look behavior when idle
    if (now - timers.lastLookAroundTime > timers.nextLookDelay && isIdle) {
      state.lookTarget.x = (Math.random() - 0.5) * 8;
      state.lookTarget.y = (Math.random() - 0.5) * 4;
      timers.lastLookAroundTime = now;
      timers.nextLookDelay = 4000 + Math.random() * 6000;

      // Occasionally look back to center
      if (Math.random() < 0.2) {
        setTimeout(() => {
          state.lookTarget.x = 0;
          state.lookTarget.y = 0;
        }, 800 + Math.random() * 400);
      }
    }

    return state.lookTarget;
  }, []);

  // ============================================
  // Cursor Awareness System
  // ============================================

  const updateAwareness = useCallback((now: number, cursorPos: { x: number; y: number } | null, petCenter: { x: number; y: number }): void => {
    const state = stateRef.current;
    const timers = timersRef.current;

    // If ignoring, check if ignore period is over
    if (state.awarenessMode === 'ignoring') {
      if (now > timers.ignoreUntil) {
        state.awarenessMode = 'idle';
      }
      return;
    }

    // State machine transitions
    switch (state.awarenessMode) {
      case 'idle':
        // No active cursor - stay idle
        break;

      case 'noticing':
        // After delay, transition to glancing
        if (now - timers.awarenessStartTime > 200 + Math.random() * 200) {
          state.awarenessMode = 'glancing';
          timers.awarenessStartTime = now;
        }
        break;

      case 'glancing':
        // Quick look, then return to idle
        if (now - timers.awarenessStartTime > 500 + Math.random() * 300) {
          // Small chance to become curious if cursor is close
          if (cursorPos && Math.random() < 0.3) {
            const dist = Math.sqrt(
              Math.pow(cursorPos.x - petCenter.x, 2) +
              Math.pow(cursorPos.y - petCenter.y, 2)
            );
            if (dist < 150) {
              state.awarenessMode = 'curious';
              timers.awarenessStartTime = now;
              return;
            }
          }
          state.awarenessMode = 'idle';
          state.cursorDirection = { x: 0, y: 0 };

          // Sometimes enter ignore mode (daydreaming)
          if (Math.random() < 0.15) {
            state.awarenessMode = 'ignoring';
            timers.ignoreUntil = now + 5000 + Math.random() * 5000;
          }
        }
        break;

      case 'curious':
        // Brief deeper interest, then return
        if (now - timers.awarenessStartTime > 800 + Math.random() * 400) {
          state.awarenessMode = 'idle';
          state.cursorDirection = { x: 0, y: 0 };
        }
        break;
    }
  }, []);

  const onCursorMove = useCallback((cursorX: number, cursorY: number, petCenterX: number, petCenterY: number) => {
    const state = stateRef.current;
    const timers = timersRef.current;
    const now = performance.now();

    // Update last cursor move time
    timers.lastCursorMoveTime = now;

    // If ignoring, don't react
    if (state.awarenessMode === 'ignoring') return;

    // Calculate direction to cursor (with noise for peripheral feel)
    const dx = cursorX - petCenterX;
    const dy = cursorY - petCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Normalize and add noise (±1 unit randomness)
    const noiseX = (Math.random() - 0.5) * 2;
    const noiseY = (Math.random() - 0.5) * 2;
    const targetX = Math.max(-5, Math.min(5, (dx / dist) * 4 + noiseX));
    const targetY = Math.max(-3, Math.min(3, (dy / dist) * 2 + noiseY));

    state.cursorDirection = { x: targetX, y: targetY };

    // Only start noticing if currently idle
    if (state.awarenessMode === 'idle') {
      // 60-70% chance to notice
      if (Math.random() < 0.65) {
        state.awarenessMode = 'noticing';
        timers.awarenessStartTime = now;
      }
    }
  }, []);

  const triggerGlance = useCallback(() => {
    const state = stateRef.current;
    const timers = timersRef.current;
    if (state.awarenessMode === 'idle' || state.awarenessMode === 'ignoring') {
      state.awarenessMode = 'glancing';
      timers.awarenessStartTime = performance.now();
      // Random direction for manual trigger
      state.cursorDirection = {
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 4,
      };
    }
  }, []);

  const triggerIgnore = useCallback(() => {
    const state = stateRef.current;
    const timers = timersRef.current;
    state.awarenessMode = 'ignoring';
    timers.ignoreUntil = performance.now() + 5000 + Math.random() * 5000;
  }, []);

  // ============================================
  // Weight Shift
  // ============================================

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

  // ============================================
  // Breathing (with sigh variation)
  // ============================================

  const getBreathingOffset = useCallback((now: number): { scaleX: number; scaleY: number } => {
    const state = stateRef.current;
    const timers = timersRef.current;

    // Check for sigh
    if (!state.isSighing && now - timers.lastSighTime > timers.nextSighDelay) {
      state.isSighing = true;
      state.breathMultiplier = 2.0; // Deeper breath
      timers.lastSighTime = now;
      timers.nextSighDelay = 15000 + Math.random() * 25000;

      // End sigh after one breath cycle
      setTimeout(() => {
        state.isSighing = false;
        state.breathMultiplier = 1.0;
      }, 2000);
    }

    // Add slight rhythm variation
    const rhythmVariation = 1 + Math.sin(now / 8000) * 0.1;
    const breathCycle = Math.sin(now / 1500) * 0.015 * state.breathMultiplier * rhythmVariation;

    return {
      scaleX: 1.0 + breathCycle * 0.5,
      scaleY: 1.0 - breathCycle,
    };
  }, []);

  const triggerSigh = useCallback(() => {
    const state = stateRef.current;
    state.isSighing = true;
    state.breathMultiplier = 2.0;
    setTimeout(() => {
      state.isSighing = false;
      state.breathMultiplier = 1.0;
    }, 2000);
  }, []);

  // ============================================
  // Autonomous Idle Behaviors
  // ============================================

  const updateIdleBehaviors = useCallback((now: number, isIdle: boolean): {
    behavior: IdleBehaviorType | null;
    progress: number;
  } => {
    const state = stateRef.current;
    const timers = timersRef.current;

    // Don't start new behavior if exploration is active
    if (state.currentExploration) {
      return { behavior: null, progress: 0 };
    }

    // Check if current behavior is done
    if (state.currentIdleBehavior) {
      const elapsed = now - timers.idleBehaviorStartTime;
      const durations: Record<IdleBehaviorType, number> = {
        yawn: 2500,
        twitch: 400,
        daydream: 3000,
      };
      const duration = durations[state.currentIdleBehavior];
      state.idleBehaviorProgress = Math.min(1, elapsed / duration);

      if (elapsed >= duration) {
        state.currentIdleBehavior = null;
        state.idleBehaviorProgress = 0;
        timers.lastIdleBehaviorTime = now;
        timers.nextIdleBehaviorDelay = 5000 + Math.random() * 8000;
      }
    }

    // Start new behavior if time
    if (!state.currentIdleBehavior && isIdle) {
      if (now - timers.lastIdleBehaviorTime > timers.nextIdleBehaviorDelay) {
        const behaviors: IdleBehaviorType[] = ['yawn', 'twitch', 'daydream'];
        state.currentIdleBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
        state.idleBehaviorProgress = 0;
        timers.idleBehaviorStartTime = now;
      }
    }

    return {
      behavior: state.currentIdleBehavior,
      progress: state.idleBehaviorProgress,
    };
  }, []);

  const triggerIdleBehavior = useCallback((type: IdleBehaviorType) => {
    const state = stateRef.current;
    const timers = timersRef.current;
    state.currentIdleBehavior = type;
    state.idleBehaviorProgress = 0;
    timers.idleBehaviorStartTime = performance.now();
  }, []);

  // ============================================
  // Mouth Fidgets
  // ============================================

  const updateMouthFidgets = useCallback((now: number, isIdle: boolean, baseMouth: MouthType): MouthType | null => {
    const state = stateRef.current;
    const timers = timersRef.current;

    // Skip if other behaviors are active (they have priority)
    if (state.currentIdleBehavior || state.currentExploration) {
      state.currentMouthFidget = null;
      state.mouthFidgetProgress = 0;
      state.mouthTargetMouth = null;
      return null;
    }

    // Skip non-fidgetable mouths (these are used by active behaviors)
    const nonFidgetable: MouthType[] = ['yawn', 'munch', 'pant'];
    if (nonFidgetable.includes(baseMouth)) {
      return null;
    }

    // Update current fidget if active
    if (state.currentMouthFidget) {
      const elapsed = now - timers.mouthFidgetStartTime;
      const duration = getMouthFidgetDuration(state.currentMouthFidget);
      state.mouthFidgetProgress = Math.min(1, elapsed / duration);

      // Return target mouth during peak of fidget (30-70% progress)
      if (state.mouthFidgetProgress >= 0.3 && state.mouthFidgetProgress <= 0.7) {
        return state.mouthTargetMouth;
      }

      // Fidget complete
      if (state.mouthFidgetProgress >= 1) {
        state.currentMouthFidget = null;
        state.mouthFidgetProgress = 0;
        state.mouthTargetMouth = null;
        timers.lastMouthFidgetTime = now;
        timers.nextMouthFidgetDelay = 3000 + Math.random() * 5000;
      }

      return null;
    }

    // Start new fidget if time and idle
    if (isIdle && now - timers.lastMouthFidgetTime > timers.nextMouthFidgetDelay) {
      const fidget = pickMouthFidget(baseMouth);
      if (fidget) {
        state.currentMouthFidget = fidget.type;
        state.mouthTargetMouth = fidget.targetMouth;
        state.mouthFidgetProgress = 0;
        timers.mouthFidgetStartTime = now;
      }
    }

    return null;
  }, []);

  // ============================================
  // Exploration Behaviors
  // ============================================

  const updateExploration = useCallback((
    now: number,
    isIdle: boolean,
    confidence?: BehaviorConfidence
  ): {
    behavior: ExplorationBehavior | null;
    phase: 'starting' | 'active' | 'ending' | null;
    progress: number;
    wanderTarget: { x: number; y: number } | null;
    lookTarget: { x: number; y: number } | null;
  } => {
    const state = stateRef.current;
    const timers = timersRef.current;

    const result: ReturnType<typeof updateExploration> = {
      behavior: state.currentExploration,
      phase: state.explorationPhase,
      progress: state.explorationProgress,
      wanderTarget: null,
      lookTarget: null,
    };

    // Update current exploration
    if (state.currentExploration) {
      const elapsed = now - timers.explorationStartTime;
      const phaseDurations = getExplorationPhaseDurations(state.currentExploration.type);

      // Calculate current phase and progress
      if (state.explorationPhase === 'starting') {
        state.explorationProgress = Math.min(1, elapsed / phaseDurations.starting);
        if (elapsed >= phaseDurations.starting) {
          state.explorationPhase = 'active';
          timers.explorationStartTime = now;
        }
      } else if (state.explorationPhase === 'active') {
        state.explorationProgress = Math.min(1, elapsed / phaseDurations.active);
        if (elapsed >= phaseDurations.active) {
          state.explorationPhase = 'ending';
          timers.explorationStartTime = now;
        }
      } else if (state.explorationPhase === 'ending') {
        state.explorationProgress = Math.min(1, elapsed / phaseDurations.ending);
        if (elapsed >= phaseDurations.ending) {
          state.currentExploration = null;
          state.explorationPhase = null;
          state.explorationProgress = 0;
          timers.lastExplorationTime = now;
          // Apply confidence frequency modifier to delay
          const baseDelay = 8000 + Math.random() * 12000;
          const frequencyMod = confidence?.explorationFrequency ?? 1;
          timers.nextExplorationDelay = baseDelay * frequencyMod;
        }
      }

      // Calculate wander/look targets based on behavior
      if (state.currentExploration) {
        const targets = getExplorationTargets(state.currentExploration, state.explorationPhase!, state.explorationProgress, state.followPathIndex);

        // Apply movement range modifier
        const rangeMod = confidence?.movementRange ?? 1;
        if (targets.wanderTarget) {
          result.wanderTarget = {
            x: targets.wanderTarget.x * rangeMod,
            y: targets.wanderTarget.y * rangeMod,
          };
        } else {
          result.wanderTarget = null;
        }
        result.lookTarget = targets.lookTarget;

        // Update follow path index
        if (state.currentExploration.type === 'followThing' && state.currentExploration.path) {
          const pathProgress = state.explorationProgress * state.currentExploration.path.length;
          state.followPathIndex = Math.min(
            Math.floor(pathProgress),
            state.currentExploration.path.length - 1
          );
        }
      }

      result.behavior = state.currentExploration;
      result.phase = state.explorationPhase;
      result.progress = state.explorationProgress;
    }

    // Start new exploration if time
    if (!state.currentExploration && !state.currentIdleBehavior && isIdle) {
      if (now - timers.lastExplorationTime > timers.nextExplorationDelay) {
        const exploration = pickRandomExplorationWithConfidence(confidence);
        state.currentExploration = exploration;
        state.explorationPhase = 'starting';
        state.explorationProgress = 0;
        state.followPathIndex = 0;
        timers.explorationStartTime = now;

        result.behavior = exploration;
        result.phase = 'starting';
        result.progress = 0;
      }
    }

    return result;
  }, []);

  const triggerExploration = useCallback((exploration: ExplorationBehavior) => {
    const state = stateRef.current;
    const timers = timersRef.current;
    state.currentExploration = exploration;
    state.explorationPhase = 'starting';
    state.explorationProgress = 0;
    state.followPathIndex = 0;
    timers.explorationStartTime = performance.now();
  }, []);

  // ============================================
  // Look Target Management
  // ============================================

  const setLookTarget = useCallback((x: number, y: number) => {
    stateRef.current.lookTarget = { x, y };
  }, []);

  const resetLookTarget = useCallback(() => {
    stateRef.current.lookTarget = { x: 0, y: 0 };
  }, []);

  // ============================================
  // State Access
  // ============================================

  const getState = useCallback(() => stateRef.current, []);

  return {
    // Original APIs
    updateBlinking,
    updateLookAround,
    updateWeightShift,
    getBreathingOffset,
    setLookTarget,
    resetLookTarget,
    // Enhanced APIs
    triggerBlink,
    updateAwareness,
    onCursorMove,
    triggerGlance,
    triggerIgnore,
    triggerSigh,
    updateIdleBehaviors,
    triggerIdleBehavior,
    updateMouthFidgets,
    updateExploration,
    triggerExploration,
    getState,
  };
}

// ============================================
// Helper Functions
// ============================================

function getExplorationPhaseDurations(type: ExplorationBehaviorType): { starting: number; active: number; ending: number } {
  switch (type) {
    case 'edgeWander':
      return { starting: 2000, active: 3000, ending: 2000 };
    case 'edgePeer':
      return { starting: 500, active: 2500, ending: 1000 };
    case 'spotInvestigate':
      return { starting: 1500, active: 2000, ending: 1500 };
    case 'followThing':
      return { starting: 500, active: 3000, ending: 500 };
    case 'startle':
      return { starting: 100, active: 500, ending: 1000 };
    case 'reaching':
      return { starting: 500, active: 2000, ending: 500 };
    // New environmental behaviors
    case 'wallBounce':
      return { starting: 800, active: 400, ending: 800 }; // 2s total
    case 'cornerHide':
      return { starting: 1500, active: 2500, ending: 1500 }; // 5.5s total
    case 'edgePeek':
      return { starting: 2000, active: 2500, ending: 1500 }; // 6s total
    case 'wallClimb':
      return { starting: 1000, active: 4000, ending: 1000 }; // 6s total
    case 'screenTap':
      return { starting: 800, active: 1500, ending: 700 }; // 3s total
    default:
      return { starting: 1000, active: 2000, ending: 1000 };
  }
}

function getExplorationTargets(
  behavior: ExplorationBehavior,
  phase: 'starting' | 'active' | 'ending',
  _progress: number,
  pathIndex: number
): { wanderTarget: { x: number; y: number } | null; lookTarget: { x: number; y: number } | null } {
  switch (behavior.type) {
    case 'edgeWander': {
      // Expanded edge positions for more dramatic exploration
      const edgePositions = {
        left: { x: -50, y: 0 },
        right: { x: 50, y: 0 },
        top: { x: 0, y: -35 },
        bottom: { x: 0, y: 25 },
      };
      const edge = behavior.edge || 'left';
      if (phase === 'starting' || phase === 'active') {
        return { wanderTarget: edgePositions[edge], lookTarget: null };
      }
      return { wanderTarget: { x: 0, y: 0 }, lookTarget: null };
    }

    case 'edgePeer': {
      const edge = behavior.edge || 'left';
      const lookDir = edge === 'left' ? -6 : 6;
      if (phase === 'active') {
        return {
          wanderTarget: null,
          lookTarget: { x: lookDir, y: 0 },
        };
      }
      return { wanderTarget: null, lookTarget: { x: 0, y: 0 } };
    }

    case 'spotInvestigate': {
      const target = behavior.target || { x: (Math.random() - 0.5) * 60, y: 20 };
      if (phase === 'starting') {
        return { wanderTarget: target, lookTarget: { x: 0, y: 3 } };
      }
      if (phase === 'active') {
        return { wanderTarget: null, lookTarget: { x: 0, y: 4 } };
      }
      return { wanderTarget: { x: 0, y: 0 }, lookTarget: { x: 0, y: 0 } };
    }

    case 'followThing': {
      const path = behavior.path || generateFollowPath();
      if (phase === 'active' && path[pathIndex]) {
        return { wanderTarget: null, lookTarget: path[pathIndex] };
      }
      return { wanderTarget: null, lookTarget: { x: 0, y: 0 } };
    }

    case 'startle': {
      if (phase === 'starting') {
        return { wanderTarget: null, lookTarget: { x: (Math.random() - 0.5) * 8, y: -2 } };
      }
      if (phase === 'active') {
        // Alert look
        return { wanderTarget: null, lookTarget: { x: 0, y: -2 } };
      }
      return { wanderTarget: null, lookTarget: { x: 0, y: 0 } };
    }

    case 'reaching': {
      if (phase === 'active') {
        return { wanderTarget: null, lookTarget: { x: 0, y: -4 } };
      }
      return { wanderTarget: null, lookTarget: { x: 0, y: 0 } };
    }

    // New environmental behaviors
    case 'wallBounce': {
      const edge = behavior.edge || 'left';
      const bouncePositions = {
        left: { x: -90, y: 0 },
        right: { x: 90, y: 0 },
        top: { x: 0, y: -50 },
        bottom: { x: 0, y: 40 },
      };
      if (phase === 'starting') {
        // Move toward wall
        return { wanderTarget: bouncePositions[edge], lookTarget: null };
      }
      if (phase === 'active') {
        // Bounce back - reverse direction
        const reverseDir = edge === 'left' ? 4 : edge === 'right' ? -4 : 0;
        return { wanderTarget: { x: reverseDir * 10, y: 0 }, lookTarget: { x: reverseDir, y: 0 } };
      }
      return { wanderTarget: { x: 0, y: 0 }, lookTarget: { x: 0, y: 0 } };
    }

    case 'cornerHide': {
      const corner = behavior.corner || 'bl';
      const cornerPositions: Record<string, { x: number; y: number }> = {
        tl: { x: -85, y: -40 },
        tr: { x: 85, y: -40 },
        bl: { x: -85, y: 35 },
        br: { x: 85, y: 35 },
      };
      if (phase === 'starting') {
        // Move to corner
        return { wanderTarget: cornerPositions[corner], lookTarget: null };
      }
      if (phase === 'active') {
        // Tucked in, periodically peek
        const peekProgress = (_progress * 3) % 1;
        if (peekProgress > 0.7 && peekProgress < 0.9) {
          // Brief peek
          const peekDir = corner.includes('l') ? 4 : -4;
          return { wanderTarget: null, lookTarget: { x: peekDir, y: -2 } };
        }
        return { wanderTarget: null, lookTarget: { x: 0, y: 2 } };
      }
      // Emerge from corner
      return { wanderTarget: { x: 0, y: 0 }, lookTarget: { x: 0, y: 0 } };
    }

    case 'edgePeek': {
      const side = behavior.edge === 'right' ? 'right' : 'left';
      const offscreenX = side === 'left' ? -120 : 120;

      if (phase === 'starting') {
        // Move toward edge, then past it
        return { wanderTarget: { x: offscreenX, y: 0 }, lookTarget: null };
      }
      if (phase === 'active') {
        // Peek back toward center
        const peekDir = side === 'left' ? 5 : -5;
        return { wanderTarget: { x: offscreenX * 0.85, y: 0 }, lookTarget: { x: peekDir, y: 0 } };
      }
      // Slide back onscreen
      return { wanderTarget: { x: 0, y: 0 }, lookTarget: { x: 0, y: 0 } };
    }

    case 'wallClimb': {
      const wall = behavior.edge === 'right' ? 'right' : 'left';
      const dir = behavior.direction || 'up';
      const wallX = wall === 'left' ? -80 : 80;

      if (phase === 'starting') {
        // Move to wall starting position
        const startY = dir === 'up' ? 30 : -35;
        return { wanderTarget: { x: wallX, y: startY }, lookTarget: null };
      }
      if (phase === 'active') {
        // Climb along wall with oscillation
        const climbY = dir === 'up' ?
          30 - _progress * 65 : // Moving up
          -35 + _progress * 65; // Moving down
        const oscillation = Math.sin(_progress * Math.PI * 4) * 5;
        return {
          wanderTarget: { x: wallX + oscillation, y: climbY },
          lookTarget: { x: 0, y: dir === 'up' ? -3 : 3 },
        };
      }
      return { wanderTarget: { x: 0, y: 0 }, lookTarget: { x: 0, y: 0 } };
    }

    case 'screenTap': {
      const tapTarget = behavior.target || {
        x: (Math.random() - 0.5) * 80,
        y: (Math.random() - 0.5) * 40,
      };

      if (phase === 'starting' || phase === 'active') {
        // Look intently at spot
        const lookIntensity = phase === 'active' ? 1.2 : 0.8;
        const normalizedX = (tapTarget.x / 40) * 4 * lookIntensity;
        const normalizedY = (tapTarget.y / 20) * 2 * lookIntensity;
        return {
          wanderTarget: { x: tapTarget.x * 0.3, y: tapTarget.y * 0.3 },
          lookTarget: { x: normalizedX, y: normalizedY },
        };
      }
      return { wanderTarget: { x: 0, y: 0 }, lookTarget: { x: 0, y: 0 } };
    }

    default:
      return { wanderTarget: null, lookTarget: null };
  }
}

function pickRandomExploration(): ExplorationBehavior {
  const roll = Math.random();

  // Updated probabilities to include new behaviors
  // edgeWander: 15%, edgePeer: 10%, spotInvestigate: 10%, followThing: 10%
  // startle: 10%, reaching: 10%
  // wallBounce: 10%, cornerHide: 10%, edgePeek: 5%, wallClimb: 5%, screenTap: 5%

  if (roll < 0.15) {
    // Edge wander (15%)
    const edges: Array<'left' | 'right' | 'top' | 'bottom'> = ['left', 'right', 'top', 'bottom'];
    return { type: 'edgeWander', edge: edges[Math.floor(Math.random() * edges.length)] };
  } else if (roll < 0.25) {
    // Edge peer (10%)
    const edges: Array<'left' | 'right'> = ['left', 'right'];
    return { type: 'edgePeer', edge: edges[Math.floor(Math.random() * 2)] };
  } else if (roll < 0.35) {
    // Spot investigate (10%)
    return {
      type: 'spotInvestigate',
      target: { x: (Math.random() - 0.5) * 60, y: 15 + Math.random() * 15 },
    };
  } else if (roll < 0.45) {
    // Follow imaginary thing (10%)
    return { type: 'followThing', path: generateFollowPath() };
  } else if (roll < 0.55) {
    // Startle (10%)
    return { type: 'startle' };
  } else if (roll < 0.65) {
    // Reaching (10%)
    return { type: 'reaching' };
  } else if (roll < 0.75) {
    // Wall bounce (10%)
    const edges: Array<'left' | 'right' | 'top' | 'bottom'> = ['left', 'right', 'top', 'bottom'];
    return { type: 'wallBounce', edge: edges[Math.floor(Math.random() * edges.length)] };
  } else if (roll < 0.85) {
    // Corner hide (10%)
    const corners: Array<'tl' | 'tr' | 'bl' | 'br'> = ['tl', 'tr', 'bl', 'br'];
    return { type: 'cornerHide', corner: corners[Math.floor(Math.random() * corners.length)] };
  } else if (roll < 0.90) {
    // Edge peek (5%)
    const sides: Array<'left' | 'right'> = ['left', 'right'];
    return { type: 'edgePeek', edge: sides[Math.floor(Math.random() * 2)] };
  } else if (roll < 0.95) {
    // Wall climb (5%)
    const walls: Array<'left' | 'right'> = ['left', 'right'];
    const directions: Array<'up' | 'down'> = ['up', 'down'];
    return {
      type: 'wallClimb',
      edge: walls[Math.floor(Math.random() * 2)],
      direction: directions[Math.floor(Math.random() * 2)],
    };
  } else {
    // Screen tap (5%)
    return {
      type: 'screenTap',
      target: {
        x: (Math.random() - 0.5) * 80,
        y: (Math.random() - 0.5) * 40,
      },
    };
  }
}

/**
 * Pick exploration behavior with confidence-based weighting
 *
 * Bold: Favor adventurous behaviors (wallClimb, screenTap, edgePeek)
 * Timid: Favor safe behaviors (cornerHide, edgePeer); avoid bold behaviors
 * Cautious: Smaller wander targets, prefer center-staying behaviors
 * Normal: Standard probabilities
 */
function pickRandomExplorationWithConfidence(confidence?: BehaviorConfidence): ExplorationBehavior {
  if (!confidence || confidence.level === 'normal') {
    return pickRandomExploration();
  }

  const roll = Math.random();

  if (confidence.level === 'bold') {
    // Bold: more adventurous exploration
    // Increase wallClimb, screenTap, edgePeek; decrease cautious behaviors
    if (roll < 0.12) {
      const edges: Array<'left' | 'right' | 'top' | 'bottom'> = ['left', 'right', 'top', 'bottom'];
      return { type: 'edgeWander', edge: edges[Math.floor(Math.random() * edges.length)] };
    } else if (roll < 0.18) {
      const edges: Array<'left' | 'right'> = ['left', 'right'];
      return { type: 'edgePeer', edge: edges[Math.floor(Math.random() * 2)] };
    } else if (roll < 0.26) {
      return {
        type: 'spotInvestigate',
        target: { x: (Math.random() - 0.5) * 80, y: 15 + Math.random() * 20 }, // Larger range
      };
    } else if (roll < 0.34) {
      return { type: 'followThing', path: generateFollowPath() };
    } else if (roll < 0.40) {
      return { type: 'startle' };
    } else if (roll < 0.48) {
      return { type: 'reaching' };
    } else if (roll < 0.56) {
      const edges: Array<'left' | 'right' | 'top' | 'bottom'> = ['left', 'right', 'top', 'bottom'];
      return { type: 'wallBounce', edge: edges[Math.floor(Math.random() * edges.length)] };
    } else if (roll < 0.62) {
      // Less corner hiding when bold
      const corners: Array<'tl' | 'tr' | 'bl' | 'br'> = ['tl', 'tr', 'bl', 'br'];
      return { type: 'cornerHide', corner: corners[Math.floor(Math.random() * corners.length)] };
    } else if (roll < 0.74) {
      // More edge peeking when bold
      const sides: Array<'left' | 'right'> = ['left', 'right'];
      return { type: 'edgePeek', edge: sides[Math.floor(Math.random() * 2)] };
    } else if (roll < 0.88) {
      // More wall climbing when bold
      const walls: Array<'left' | 'right'> = ['left', 'right'];
      const directions: Array<'up' | 'down'> = ['up', 'down'];
      return {
        type: 'wallClimb',
        edge: walls[Math.floor(Math.random() * 2)],
        direction: directions[Math.floor(Math.random() * 2)],
      };
    } else {
      // More screen tapping when bold
      return {
        type: 'screenTap',
        target: {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 50,
        },
      };
    }
  }

  if (confidence.level === 'timid') {
    // Timid: favor hiding, avoid adventurous behaviors
    if (roll < 0.10) {
      // Less edge wandering
      const edges: Array<'left' | 'right' | 'top' | 'bottom'> = ['left', 'right', 'top', 'bottom'];
      return { type: 'edgeWander', edge: edges[Math.floor(Math.random() * edges.length)] };
    } else if (roll < 0.25) {
      // More edge peering (cautious looking)
      const edges: Array<'left' | 'right'> = ['left', 'right'];
      return { type: 'edgePeer', edge: edges[Math.floor(Math.random() * 2)] };
    } else if (roll < 0.30) {
      // Less spot investigating
      return {
        type: 'spotInvestigate',
        target: { x: (Math.random() - 0.5) * 30, y: 10 + Math.random() * 10 }, // Smaller range
      };
    } else if (roll < 0.38) {
      return { type: 'followThing', path: generateFollowPath() };
    } else if (roll < 0.48) {
      // More startling when timid (easily spooked)
      return { type: 'startle' };
    } else if (roll < 0.52) {
      // Less reaching
      return { type: 'reaching' };
    } else if (roll < 0.56) {
      // Less wall bouncing (too bold)
      const edges: Array<'left' | 'right' | 'top' | 'bottom'> = ['left', 'right', 'top', 'bottom'];
      return { type: 'wallBounce', edge: edges[Math.floor(Math.random() * edges.length)] };
    } else if (roll < 0.80) {
      // MUCH more corner hiding when timid
      const corners: Array<'tl' | 'tr' | 'bl' | 'br'> = ['tl', 'tr', 'bl', 'br'];
      return { type: 'cornerHide', corner: corners[Math.floor(Math.random() * corners.length)] };
    } else if (roll < 0.85) {
      // Some edge peeking (cautious curiosity)
      const sides: Array<'left' | 'right'> = ['left', 'right'];
      return { type: 'edgePeek', edge: sides[Math.floor(Math.random() * 2)] };
    } else if (roll < 0.90) {
      // Very little wall climbing
      const walls: Array<'left' | 'right'> = ['left', 'right'];
      const directions: Array<'up' | 'down'> = ['up', 'down'];
      return {
        type: 'wallClimb',
        edge: walls[Math.floor(Math.random() * 2)],
        direction: directions[Math.floor(Math.random() * 2)],
      };
    } else {
      // Very little screen tapping
      return {
        type: 'screenTap',
        target: {
          x: (Math.random() - 0.5) * 40,
          y: (Math.random() - 0.5) * 20,
        },
      };
    }
  }

  // Cautious: prefer center, moderate exploration
  if (confidence.level === 'cautious') {
    if (roll < 0.12) {
      const edges: Array<'left' | 'right' | 'top' | 'bottom'> = ['left', 'right', 'top', 'bottom'];
      return { type: 'edgeWander', edge: edges[Math.floor(Math.random() * edges.length)] };
    } else if (roll < 0.24) {
      const edges: Array<'left' | 'right'> = ['left', 'right'];
      return { type: 'edgePeer', edge: edges[Math.floor(Math.random() * 2)] };
    } else if (roll < 0.36) {
      // More spot investigating (stay near center)
      return {
        type: 'spotInvestigate',
        target: { x: (Math.random() - 0.5) * 40, y: 10 + Math.random() * 12 },
      };
    } else if (roll < 0.48) {
      return { type: 'followThing', path: generateFollowPath() };
    } else if (roll < 0.56) {
      return { type: 'startle' };
    } else if (roll < 0.64) {
      return { type: 'reaching' };
    } else if (roll < 0.72) {
      const edges: Array<'left' | 'right' | 'top' | 'bottom'> = ['left', 'right', 'top', 'bottom'];
      return { type: 'wallBounce', edge: edges[Math.floor(Math.random() * edges.length)] };
    } else if (roll < 0.84) {
      const corners: Array<'tl' | 'tr' | 'bl' | 'br'> = ['tl', 'tr', 'bl', 'br'];
      return { type: 'cornerHide', corner: corners[Math.floor(Math.random() * corners.length)] };
    } else if (roll < 0.90) {
      const sides: Array<'left' | 'right'> = ['left', 'right'];
      return { type: 'edgePeek', edge: sides[Math.floor(Math.random() * 2)] };
    } else if (roll < 0.96) {
      const walls: Array<'left' | 'right'> = ['left', 'right'];
      const directions: Array<'up' | 'down'> = ['up', 'down'];
      return {
        type: 'wallClimb',
        edge: walls[Math.floor(Math.random() * 2)],
        direction: directions[Math.floor(Math.random() * 2)],
      };
    } else {
      return {
        type: 'screenTap',
        target: {
          x: (Math.random() - 0.5) * 60,
          y: (Math.random() - 0.5) * 30,
        },
      };
    }
  }

  // Fallback
  return pickRandomExploration();
}

function generateFollowPath(): Array<{ x: number; y: number }> {
  // Generate a path for eyes to follow (like tracking a fly)
  const points: Array<{ x: number; y: number }> = [];
  let x = (Math.random() - 0.5) * 6;
  let y = (Math.random() - 0.5) * 3;

  for (let i = 0; i < 8; i++) {
    points.push({ x, y });
    x += (Math.random() - 0.5) * 4;
    y += (Math.random() - 0.5) * 2;
    x = Math.max(-5, Math.min(5, x));
    y = Math.max(-3, Math.min(3, y));
  }

  return points;
}

// ============================================
// Mouth Fidget Helpers
// ============================================

function getMouthFidgetDuration(type: MouthFidgetType): number {
  switch (type) {
    case 'relax':
      return 800; // Brief relaxation
    case 'soften':
      return 1000; // Intensity softening
    case 'breathe':
      return 600; // Breathing rhythm
    case 'microSmile':
      return 1200; // Rare, subtle
    case 'prideSoften':
      return 900; // Pride softening
    default:
      return 800;
  }
}

function pickMouthFidget(baseMouth: MouthType): { type: MouthFidgetType; targetMouth: MouthType } | null {
  // Define transitions based on base mouth
  // Weighted random selection for contextual appropriateness
  const roll = Math.random();

  switch (baseMouth) {
    case 'smile':
      // smile → flat (brief relaxation)
      if (roll < 0.7) {
        return { type: 'relax', targetMouth: 'flat' };
      }
      return null;

    case 'bigSmile':
      // bigSmile → smile (intensity softening)
      if (roll < 0.6) {
        return { type: 'soften', targetMouth: 'smile' };
      }
      return null;

    case 'frown':
      // frown → flat (sad breathing)
      if (roll < 0.5) {
        return { type: 'breathe', targetMouth: 'flat' };
      }
      return null;

    case 'flat':
      // flat → smile (rare occasional micro-smile)
      if (roll < 0.2) {
        return { type: 'microSmile', targetMouth: 'smile' };
      }
      return null;

    case 'open':
      // open → openSmall (breathing rhythm)
      if (roll < 0.6) {
        return { type: 'breathe', targetMouth: 'openSmall' };
      }
      return null;

    case 'openSmall':
      // openSmall → flat (settling)
      if (roll < 0.4) {
        return { type: 'relax', targetMouth: 'flat' };
      }
      return null;

    case 'smirk':
      // smirk → smile (pride softening)
      if (roll < 0.5) {
        return { type: 'prideSoften', targetMouth: 'smile' };
      }
      return null;

    case 'wavy':
      // wavy → flat (uncertain settling)
      if (roll < 0.4) {
        return { type: 'relax', targetMouth: 'flat' };
      }
      return null;

    case 'pout':
      // pout stays pouty - no fidgets
      return null;

    default:
      return null;
  }
}
