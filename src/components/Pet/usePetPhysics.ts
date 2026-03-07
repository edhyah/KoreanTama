import { useRef, useCallback } from 'react';
import { Spring } from '../../hooks/useSpring';

export interface PetPhysics {
  bodyScaleX: Spring;
  bodyScaleY: Spring;
  bodyOffX: Spring;
  bodyOffY: Spring;
  pupilOffsetX: Spring;
  pupilOffsetY: Spring;
  wanderX: Spring;
  wanderY: Spring;
  // New: edge press effect
  edgePressX: Spring;
  // New: stretch/reach effect
  stretchY: Spring;
}

export function usePetPhysics() {
  const physicsRef = useRef<PetPhysics>({
    bodyScaleX: new Spring(1.0, 0.2, 0.75),
    bodyScaleY: new Spring(1.0, 0.2, 0.75),
    bodyOffX: new Spring(0, 0.12, 0.8),
    bodyOffY: new Spring(0, 0.12, 0.8),
    pupilOffsetX: new Spring(0, 0.1, 0.85),
    pupilOffsetY: new Spring(0, 0.1, 0.85),
    wanderX: new Spring(0, 0.08, 0.88),
    wanderY: new Spring(0, 0.08, 0.88),
    // Edge press (horizontal squish against wall)
    edgePressX: new Spring(0, 0.08, 0.85),
    // Stretch (vertical elongation for yawn/reach)
    stretchY: new Spring(0, 0.06, 0.88),
  });

  const updateAll = useCallback(() => {
    const p = physicsRef.current;
    p.bodyScaleX.update();
    p.bodyScaleY.update();
    p.bodyOffX.update();
    p.bodyOffY.update();
    p.pupilOffsetX.update();
    p.pupilOffsetY.update();
    p.wanderX.update();
    p.wanderY.update();
    p.edgePressX.update();
    p.stretchY.update();
  }, []);

  const applyPoke = useCallback((touchX: number, touchY: number, petCenterX: number, petCenterY: number) => {
    const p = physicsRef.current;

    // Calculate direction from center
    const dx = touchX - petCenterX;
    const dy = touchY - petCenterY;

    // Normalize direction
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const normX = dx / dist;
    const normY = dy / dist;

    // Push AWAY from touch point (opposite direction)
    const pushStrength = 20;
    p.bodyOffX.impulse(-normX * pushStrength);
    p.bodyOffY.impulse(-normY * pushStrength * 0.5);

    // Squish reaction
    p.bodyScaleX.impulse(-0.08);
    p.bodyScaleY.impulse(-0.06);
  }, []);

  const applySquish = useCallback(() => {
    const p = physicsRef.current;
    const angle = Math.random() * Math.PI * 2;
    const strength = 0.4;
    p.bodyScaleX.impulse(-Math.cos(angle) * strength);
    p.bodyScaleY.impulse(-Math.sin(angle) * strength);
    p.bodyOffX.impulse(Math.cos(angle) * 8);
    p.bodyOffY.impulse(Math.sin(angle) * 5);
  }, []);

  const setBreathingTarget = useCallback((scaleX: number, scaleY: number) => {
    const p = physicsRef.current;
    p.bodyScaleX.target = scaleX;
    p.bodyScaleY.target = scaleY;
  }, []);

  const setPupilTarget = useCallback((x: number, y: number) => {
    const p = physicsRef.current;
    p.pupilOffsetX.target = x;
    p.pupilOffsetY.target = y;
  }, []);

  const setBodyOffTarget = useCallback((x: number, y: number) => {
    const p = physicsRef.current;
    p.bodyOffX.target = x;
    p.bodyOffY.target = y;
  }, []);

  const setWanderTarget = useCallback((x: number, y: number) => {
    const p = physicsRef.current;
    p.wanderX.target = x;
    p.wanderY.target = y;
  }, []);

  const getValues = useCallback(() => {
    const p = physicsRef.current;
    return {
      bodyScaleX: p.bodyScaleX.value,
      bodyScaleY: p.bodyScaleY.value,
      bodyOffX: p.bodyOffX.value,
      bodyOffY: p.bodyOffY.value,
      pupilOffsetX: p.pupilOffsetX.value,
      pupilOffsetY: p.pupilOffsetY.value,
      wanderX: p.wanderX.value,
      wanderY: p.wanderY.value,
      edgePressX: p.edgePressX.value,
      stretchY: p.stretchY.value,
    };
  }, []);

  const resetWander = useCallback(() => {
    const p = physicsRef.current;
    p.wanderX.target = 0;
    p.wanderY.target = 0;
  }, []);

  // New: Edge press effect (squish against invisible wall)
  const setEdgePress = useCallback((direction: 'left' | 'right' | null) => {
    const p = physicsRef.current;
    if (direction === 'left') {
      p.edgePressX.target = -0.15; // Squish to the left
    } else if (direction === 'right') {
      p.edgePressX.target = 0.15; // Squish to the right
    } else {
      p.edgePressX.target = 0;
    }
  }, []);

  // New: Stretch effect for yawn/reach
  const applyStretch = useCallback((amount: number = 0.08) => {
    const p = physicsRef.current;
    p.stretchY.target = amount;
    // Auto-release after a delay
    setTimeout(() => {
      p.stretchY.target = 0;
    }, 1500);
  }, []);

  // New: Twitch impulse (brief squish)
  const applyTwitch = useCallback(() => {
    const p = physicsRef.current;
    p.bodyScaleX.impulse(-0.05);
    p.bodyScaleY.impulse(0.03);
    p.bodyOffY.impulse(-3);
  }, []);

  // New: Startle jump
  const applyStartle = useCallback(() => {
    const p = physicsRef.current;
    p.bodyOffY.impulse(-15);
    p.bodyScaleY.impulse(0.1);
    p.bodyScaleX.impulse(-0.05);
  }, []);

  return {
    updateAll,
    applyPoke,
    applySquish,
    setBreathingTarget,
    setPupilTarget,
    setBodyOffTarget,
    setWanderTarget,
    resetWander,
    getValues,
    // New
    setEdgePress,
    applyStretch,
    applyTwitch,
    applyStartle,
  };
}
