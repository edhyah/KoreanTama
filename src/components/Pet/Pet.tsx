import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { PetSvg } from './PetSvg';
import { usePetPhysics } from './usePetPhysics';
import { useEmotionalState, useIdleAnimations } from '../../hooks';
import type { EmotionalStateName, GameStateName, MouthType } from '../../types';
import type { BlinkType, IdleBehaviorType, ExplorationBehavior } from '../../hooks/useIdleAnimations';

export interface PetRef {
  setEmotionalState: (state: EmotionalStateName) => void;
  handlePoke: (touchX: number, touchY: number) => void;
  applySquish: () => void;
  setWanderTarget: (x: number, y: number) => void;
  resetWander: () => void;
  setLookTarget: (x: number, y: number) => void;
  resetLookTarget: () => void;
  getCurrentEmotionalState: () => EmotionalStateName;
  // New behavior triggers
  triggerBlink: (type: BlinkType) => void;
  triggerSigh: () => void;
  triggerBehavior: (type: IdleBehaviorType) => void;
  triggerExploration: (exploration: ExplorationBehavior) => void;
  triggerAwareness: (mode: 'glance' | 'ignore') => void;
}

export interface PetProps {
  gameState: GameStateName;
  isQuizActive: boolean;
  hunger: number;
  happiness: number;
  onClick?: (e: React.MouseEvent) => void;
  forceSleepy?: boolean;
}

export const Pet = forwardRef<PetRef, PetProps>(({
  gameState,
  isQuizActive,
  hunger,
  happiness,
  onClick,
  forceSleepy = false,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationTimeRef = useRef(0);
  const pokeReactionRef = useRef<{ type: 'surprised' | 'happy' | 'annoyed' | null; timeout: number | null }>({
    type: null,
    timeout: null,
  });
  const tapTrackingRef = useRef<{ count: number; lastTapTime: number; resetTimeout: number | null }>({
    count: 0,
    lastTapTime: 0,
    resetTimeout: null,
  });
  const frameRef = useRef<number>(undefined);

  // Cursor tracking for awareness
  const cursorPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastCursorMoveRef = useRef<number>(0);

  const {
    currentState,
    setEmotionalState,
    updateTransition,
    getInterpolatedState,
  } = useEmotionalState('sleepy', { hunger, happiness });

  const physics = usePetPhysics();
  const idleAnimations = useIdleAnimations();

  // Handle clicks on the pet container
  const handleClick = useCallback((e: React.MouseEvent) => {
    // Any click on the pet-container counts as clicking the character
    onClick?.(e);
  }, [onClick]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    setEmotionalState,
    handlePoke: (touchX: number, touchY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const petCenterX = rect.left + rect.width / 2;
      const petCenterY = rect.top + rect.height / 2;

      // Always apply poke physics
      physics.applyPoke(touchX, touchY, petCenterX, petCenterY);

      // Track taps within 5 second window
      const now = performance.now();
      const tapTracking = tapTrackingRef.current;

      // If tapped within 5 seconds of last tap, increment counter
      if (now - tapTracking.lastTapTime < 5000) {
        tapTracking.count++;
      } else {
        tapTracking.count = 1;
      }
      tapTracking.lastTapTime = now;

      // Clear existing reset timeout
      if (tapTracking.resetTimeout) {
        clearTimeout(tapTracking.resetTimeout);
      }
      // Reset tap count after 5 seconds of no tapping
      tapTracking.resetTimeout = window.setTimeout(() => {
        tapTracking.count = 0;
      }, 5000);

      // Clear any existing reaction timeout
      if (pokeReactionRef.current.timeout) {
        clearTimeout(pokeReactionRef.current.timeout);
      }

      // If tapped more than 2 times within 5 seconds, get annoyed
      if (tapTracking.count > 2) {
        pokeReactionRef.current.type = 'annoyed';
        pokeReactionRef.current.timeout = window.setTimeout(() => {
          pokeReactionRef.current.type = null;
        }, 800);
        return;
      }

      // Normal poke reaction: surprised then happy
      pokeReactionRef.current.type = 'surprised';

      // After brief surprise, show happy
      setTimeout(() => {
        if (pokeReactionRef.current.type === 'surprised') {
          pokeReactionRef.current.type = 'happy';
        }
      }, 150);

      // Clear reaction after animation
      pokeReactionRef.current.timeout = window.setTimeout(() => {
        pokeReactionRef.current.type = null;
      }, 600);
    },
    applySquish: () => {
      physics.applySquish();

      // Show annoyed reaction when squished
      pokeReactionRef.current.type = 'annoyed';
      if (pokeReactionRef.current.timeout) {
        clearTimeout(pokeReactionRef.current.timeout);
      }

      // Clear reaction after animation
      pokeReactionRef.current.timeout = window.setTimeout(() => {
        pokeReactionRef.current.type = null;
      }, 800);
    },
    setWanderTarget: physics.setWanderTarget,
    resetWander: physics.resetWander,
    setLookTarget: idleAnimations.setLookTarget,
    resetLookTarget: idleAnimations.resetLookTarget,
    getCurrentEmotionalState: () => currentState,
    // New behavior triggers
    triggerBlink: idleAnimations.triggerBlink,
    triggerSigh: idleAnimations.triggerSigh,
    triggerBehavior: (type: IdleBehaviorType) => {
      idleAnimations.triggerIdleBehavior(type);
      // Apply physics based on behavior type
      if (type === 'yawn') {
        physics.applyStretch(0.08);
      } else if (type === 'twitch') {
        physics.applyTwitch();
      }
    },
    triggerExploration: (exploration: ExplorationBehavior) => {
      idleAnimations.triggerExploration(exploration);
      // Apply initial physics for some behaviors
      if (exploration.type === 'startle') {
        physics.applyStartle();
      }
    },
    triggerAwareness: (mode: 'glance' | 'ignore') => {
      if (mode === 'glance') {
        idleAnimations.triggerGlance();
      } else {
        idleAnimations.triggerIgnore();
      }
    },
  }), [currentState, setEmotionalState, physics, idleAnimations]);

  // Map game state to emotional state
  const mapGameStateToEmotion = useCallback((): EmotionalStateName => {
    if (gameState === 'sleeping') return 'sleepy';
    if (gameState === 'waking') return 'greeting';
    if (gameState === 'eating') return 'eating';
    if (gameState === 'discovering') return 'playing';

    // Combined needs factor for overall wellbeing
    const wellbeing = (hunger + happiness) / 2;

    // Quiz states - still affected by needs
    if (isQuizActive) {
      if (wellbeing < 40) return 'sad';
      if (wellbeing < 60) return 'bored';
      return 'playing';
    }

    // Critical needs - show specific need state
    if (hunger < 30) return 'hungry';
    if (happiness < 30) return 'bored';

    // Low needs - sad expression
    if (wellbeing < 40) return 'sad';

    // Medium-low needs - bored/neutral
    if (wellbeing < 55) return 'bored';

    // Medium needs - sleepy/neutral (not unhappy, not happy)
    if (wellbeing < 70) return 'sleepy';

    // Good needs - happy
    if (wellbeing < 85) return 'happy';

    // Excellent needs - excited
    return 'excited';
  }, [gameState, isQuizActive, hunger, happiness]);

  // Update emotional state based on game state and needs
  useEffect(() => {
    if (gameState === 'idle' || isQuizActive) {
      setEmotionalState(mapGameStateToEmotion());
    }
  }, [gameState, isQuizActive, hunger, happiness, mapGameStateToEmotion, setEmotionalState]);

  // Track cursor for awareness system
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const petCenterX = rect.left + rect.width / 2;
      const petCenterY = rect.top + rect.height / 2;

      // Only track cursor if it's reasonably close to the pet
      const distance = Math.sqrt(
        Math.pow(e.clientX - petCenterX, 2) + Math.pow(e.clientY - petCenterY, 2)
      );

      if (distance < 400) {
        const now = performance.now();
        // Throttle cursor updates
        if (now - lastCursorMoveRef.current > 100) {
          cursorPosRef.current = { x: e.clientX, y: e.clientY };
          lastCursorMoveRef.current = now;
          idleAnimations.onCursorMove(e.clientX, e.clientY, petCenterX, petCenterY);
        }
      } else {
        cursorPosRef.current = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [idleAnimations]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const now = performance.now();
      animationTimeRef.current++;

      // Update physics
      physics.updateAll();

      // Update transition
      updateTransition();

      // Update idle animations when in idle state
      const isIdle = gameState === 'idle' && !isQuizActive && !pokeReactionRef.current.type;

      // Get pet center for awareness
      let petCenter = { x: 0, y: 0 };
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        petCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }

      // Update awareness system
      idleAnimations.updateAwareness(now, cursorPosRef.current, petCenter);

      // Update blinking
      idleAnimations.updateBlinking(now);

      // Update look around (integrates with awareness)
      const lookTarget = idleAnimations.updateLookAround(now, isIdle);

      // Update weight shift
      const weightShift = idleAnimations.updateWeightShift(now, isIdle);

      // Update idle behaviors (yawn, twitch, daydream)
      const idleBehavior = idleAnimations.updateIdleBehaviors(now, isIdle);

      // Update exploration behaviors
      const exploration = idleAnimations.updateExploration(now, isIdle);

      // Apply breathing to body scale when idle
      if (isIdle) {
        const breathing = idleAnimations.getBreathingOffset(now);
        physics.setBreathingTarget(breathing.scaleX, breathing.scaleY);
      }

      // Handle idle behavior physics
      if (idleBehavior.behavior) {
        if (idleBehavior.behavior === 'yawn' && idleBehavior.progress < 0.1) {
          physics.applyStretch(0.08);
        } else if (idleBehavior.behavior === 'twitch' && idleBehavior.progress < 0.1) {
          physics.applyTwitch();
        }
      }

      // Handle exploration physics and wander
      if (exploration.behavior && exploration.phase) {
        // Apply edge press for edge behaviors
        if (exploration.behavior.type === 'edgePeer' && exploration.phase === 'active') {
          physics.setEdgePress(exploration.behavior.edge as 'left' | 'right');
        } else {
          physics.setEdgePress(null);
        }

        // Apply startle physics
        if (exploration.behavior.type === 'startle' && exploration.phase === 'starting' && exploration.progress < 0.1) {
          physics.applyStartle();
        }

        // Apply reaching stretch
        if (exploration.behavior.type === 'reaching' && exploration.phase === 'active' && exploration.progress < 0.1) {
          physics.applyStretch(0.1);
        }

        // Set wander target from exploration
        if (exploration.wanderTarget) {
          physics.setWanderTarget(exploration.wanderTarget.x, exploration.wanderTarget.y);
        }

        // Override look target from exploration
        if (exploration.lookTarget) {
          physics.setPupilTarget(exploration.lookTarget.x, exploration.lookTarget.y);
        } else {
          physics.setPupilTarget(lookTarget.x, lookTarget.y);
        }
      } else {
        physics.setEdgePress(null);
        physics.setPupilTarget(lookTarget.x, lookTarget.y);
      }

      // Apply weight shift
      if (weightShift !== 0 && isIdle && !exploration.behavior) {
        physics.setBodyOffTarget(weightShift * 2, 0);
        setTimeout(() => {
          physics.setBodyOffTarget(0, 0);
        }, 1500 + Math.random() * 500);
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [gameState, isQuizActive, physics, updateTransition, idleAnimations]);

  // Get current interpolated state
  const interpolatedState = getInterpolatedState(forceSleepy);
  const physicsValues = physics.getValues();
  const blinkLid = idleAnimations.updateBlinking(performance.now());

  // Get current behavior state for visual modifications
  const now = performance.now();
  const isIdle = gameState === 'idle' && !isQuizActive;
  const idleBehavior = idleAnimations.updateIdleBehaviors(now, isIdle);
  const exploration = idleAnimations.updateExploration(now, isIdle);
  const animState = idleAnimations.getState();

  // Get mouth fidget override (only when truly idle)
  const mouthFidgetOverride = idleAnimations.updateMouthFidgets(
    now,
    isIdle && !pokeReactionRef.current.type,
    interpolatedState.mouth as MouthType
  );

  return (
    <div
      ref={containerRef}
      className="pet-container"
      onClick={handleClick}
    >
      <PetSvg
        color={interpolatedState.color}
        scaleX={interpolatedState.scaleX}
        scaleY={interpolatedState.scaleY}
        offY={interpolatedState.offY}
        eyeW={interpolatedState.eyeW}
        eyeH={interpolatedState.eyeH}
        pupilR={interpolatedState.pupilR}
        lidTop={interpolatedState.lidTop}
        mouth={interpolatedState.mouth as MouthType}
        blush={interpolatedState.blush}
        anim={interpolatedState.anim}
        animationTime={animationTimeRef.current}
        bodyScaleX={physicsValues.bodyScaleX}
        bodyScaleY={physicsValues.bodyScaleY}
        bodyOffX={physicsValues.bodyOffX}
        bodyOffY={physicsValues.bodyOffY}
        pupilOffsetX={physicsValues.pupilOffsetX}
        pupilOffsetY={physicsValues.pupilOffsetY}
        blinkLidAdjustment={blinkLid}
        pokeReactionType={pokeReactionRef.current.type}
        // New physics values
        edgePressX={physicsValues.edgePressX}
        stretchY={physicsValues.stretchY}
        wanderX={physicsValues.wanderX}
        wanderY={physicsValues.wanderY}
        // Behavior state for visual modifications
        idleBehavior={idleBehavior.behavior}
        idleBehaviorProgress={idleBehavior.progress}
        explorationBehavior={exploration.behavior?.type || null}
        explorationPhase={exploration.phase}
        awarenessMode={animState.awarenessMode}
        mouthFidgetOverride={mouthFidgetOverride}
      />
    </div>
  );
});

Pet.displayName = 'Pet';
