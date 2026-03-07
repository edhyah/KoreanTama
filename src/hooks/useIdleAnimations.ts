import { useRef, useCallback } from 'react';

// ============================================
// Types
// ============================================

export type BlinkType = 'normal' | 'double' | 'slow';

export type AwarenessMode = 'idle' | 'noticing' | 'glancing' | 'curious' | 'ignoring';

export type IdleBehaviorType = 'yawn' | 'twitch' | 'daydream';

export type ExplorationBehaviorType =
  | 'edgeWander'
  | 'edgePeer'
  | 'spotInvestigate'
  | 'followThing'
  | 'startle'
  | 'reaching';

export interface ExplorationBehavior {
  type: ExplorationBehaviorType;
  edge?: 'left' | 'right' | 'top' | 'bottom';
  target?: { x: number; y: number };
  path?: Array<{ x: number; y: number }>;
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
  // Exploration Behaviors
  // ============================================

  const updateExploration = useCallback((now: number, isIdle: boolean): {
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
          timers.nextExplorationDelay = 8000 + Math.random() * 12000;
        }
      }

      // Calculate wander/look targets based on behavior
      if (state.currentExploration) {
        const targets = getExplorationTargets(state.currentExploration, state.explorationPhase!, state.explorationProgress, state.followPathIndex);
        result.wanderTarget = targets.wanderTarget;
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
        const exploration = pickRandomExploration();
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
      const edgePositions = {
        left: { x: -35, y: 0 },
        right: { x: 35, y: 0 },
        top: { x: 0, y: -20 },
        bottom: { x: 0, y: 15 },
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

    default:
      return { wanderTarget: null, lookTarget: null };
  }
}

function pickRandomExploration(): ExplorationBehavior {
  const roll = Math.random();

  if (roll < 0.25) {
    // Edge wander
    const edges: Array<'left' | 'right' | 'top' | 'bottom'> = ['left', 'right', 'top', 'bottom'];
    return { type: 'edgeWander', edge: edges[Math.floor(Math.random() * edges.length)] };
  } else if (roll < 0.40) {
    // Edge peer
    const edges: Array<'left' | 'right'> = ['left', 'right'];
    return { type: 'edgePeer', edge: edges[Math.floor(Math.random() * 2)] };
  } else if (roll < 0.55) {
    // Spot investigate
    return {
      type: 'spotInvestigate',
      target: { x: (Math.random() - 0.5) * 60, y: 15 + Math.random() * 15 },
    };
  } else if (roll < 0.70) {
    // Follow imaginary thing
    return { type: 'followThing', path: generateFollowPath() };
  } else if (roll < 0.85) {
    // Startle
    return { type: 'startle' };
  } else {
    // Reaching
    return { type: 'reaching' };
  }
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
