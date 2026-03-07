import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { PetSvg } from './PetSvg';
import { usePetPhysics } from './usePetPhysics';
import { useEmotionalState, useIdleAnimations } from '../../hooks';
import type { EmotionalStateName, GameStateName, MouthType } from '../../types';

export interface PetRef {
  setEmotionalState: (state: EmotionalStateName) => void;
  handlePoke: (touchX: number, touchY: number) => void;
  applySquish: () => void;
  setWanderTarget: (x: number, y: number) => void;
  resetWander: () => void;
  setLookTarget: (x: number, y: number) => void;
  resetLookTarget: () => void;
  getCurrentEmotionalState: () => EmotionalStateName;
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

  // Check if a click is on the actual character (not the surrounding container)
  const isClickOnCharacter = useCallback((e: React.MouseEvent): boolean => {
    if (!containerRef.current) return false;
    const rect = containerRef.current.getBoundingClientRect();

    // Get click position relative to container
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Container is 220x220, SVG viewBox is 200x200
    // Character body is centered at (100, 100) in viewBox = (110, 110) in container
    // Body is roughly 84 wide x 116 tall in viewBox units, scaled by 1.1
    const centerX = 110;
    const centerY = 110;
    const radiusX = 50;  // Approximate horizontal radius in pixels
    const radiusY = 70;  // Approximate vertical radius in pixels

    // Check if click is within the character's ellipse
    const dx = (clickX - centerX) / radiusX;
    const dy = (clickY - centerY) / radiusY;
    return (dx * dx + dy * dy) <= 1;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isClickOnCharacter(e)) {
      onClick?.(e);
    }
  }, [onClick, isClickOnCharacter]);

  const {
    currentState,
    setEmotionalState,
    updateTransition,
    getInterpolatedState,
  } = useEmotionalState('sleepy');

  const physics = usePetPhysics();
  const idleAnimations = useIdleAnimations();

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    setEmotionalState,
    handlePoke: (touchX: number, touchY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const petCenterX = rect.left + rect.width / 2;
      const petCenterY = rect.top + rect.height / 2;

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

      // If tapped more than 2 times within 5 seconds, get annoyed
      if (tapTracking.count > 2) {
        physics.applySquish();
        pokeReactionRef.current.type = 'annoyed';
        if (pokeReactionRef.current.timeout) {
          clearTimeout(pokeReactionRef.current.timeout);
        }
        pokeReactionRef.current.timeout = window.setTimeout(() => {
          pokeReactionRef.current.type = null;
        }, 800);
        return;
      }

      // Normal poke behavior
      physics.applyPoke(touchX, touchY, petCenterX, petCenterY);

      // Show brief reaction
      pokeReactionRef.current.type = 'surprised';
      if (pokeReactionRef.current.timeout) {
        clearTimeout(pokeReactionRef.current.timeout);
      }

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
  }), [currentState, setEmotionalState, physics, idleAnimations]);

  // Map game state to emotional state
  const mapGameStateToEmotion = useCallback((): EmotionalStateName => {
    if (gameState === 'sleeping') return 'sleepy';
    if (gameState === 'waking') return 'greeting';
    if (gameState === 'eating') return 'eating';
    if (gameState === 'discovering') return 'playing';

    // Quiz states
    if (isQuizActive) return 'playing';

    // Needs-based states
    if (hunger < 40) return 'hungry';
    if (happiness < 40) return 'bored';

    // Default idle states based on overall happiness
    if (happiness >= 80) return 'happy';
    return 'happy';
  }, [gameState, isQuizActive, hunger, happiness]);

  // Update emotional state based on game state
  useEffect(() => {
    if (!isQuizActive && gameState === 'idle') {
      setEmotionalState(mapGameStateToEmotion());
    }
  }, [gameState, isQuizActive, hunger, happiness, mapGameStateToEmotion, setEmotionalState]);

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

      idleAnimations.updateBlinking(now);
      const lookTarget = idleAnimations.updateLookAround(now, isIdle);
      const weightShift = idleAnimations.updateWeightShift(now, isIdle);

      // Apply breathing to body scale when idle
      if (isIdle) {
        const breathing = idleAnimations.getBreathingOffset(now);
        physics.setBreathingTarget(breathing.scaleX, breathing.scaleY);
      }

      // Apply look target to pupil
      physics.setPupilTarget(lookTarget.x, lookTarget.y);

      // Apply weight shift
      if (weightShift !== 0 && isIdle) {
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
      />
    </div>
  );
});

Pet.displayName = 'Pet';
