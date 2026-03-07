import { useRef, useEffect, useMemo, useState } from 'react';
import { PetSvg } from './Pet/PetSvg';
import { EMOTIONAL_STATES } from '../constants';
import type { EmotionalStateName, MouthType, AnimationType } from '../types';

export interface DebugPetProps {
  // Use emotional state preset OR individual overrides
  emotionalState?: EmotionalStateName;

  // Individual parameter overrides (take precedence over emotional state)
  color?: string;
  scaleX?: number;
  scaleY?: number;
  offY?: number;
  eyeW?: number;
  eyeH?: number;
  pupilR?: number;
  lidTop?: number;
  mouth?: MouthType;
  blush?: boolean;
  anim?: AnimationType;

  // Size preset
  size?: 'small' | 'medium' | 'large';
}

const SIZE_MAP = {
  small: 80,
  medium: 150,
  large: 300,
};

export function DebugPet({
  emotionalState = 'happy',
  color,
  scaleX,
  scaleY,
  offY,
  eyeW,
  eyeH,
  pupilR,
  lidTop,
  mouth,
  blush,
  anim,
  size = 'medium',
}: DebugPetProps) {
  const [animationTime, setAnimationTime] = useState(0);
  const frameRef = useRef<number>(undefined);

  // Get base config from emotional state
  const baseConfig = EMOTIONAL_STATES[emotionalState];

  // Apply overrides
  const config = useMemo(() => ({
    color: color ?? baseConfig.color,
    scaleX: scaleX ?? baseConfig.scaleX,
    scaleY: scaleY ?? baseConfig.scaleY,
    offY: offY ?? baseConfig.offY,
    eyeW: eyeW ?? baseConfig.eyeW,
    eyeH: eyeH ?? baseConfig.eyeH,
    pupilR: pupilR ?? baseConfig.pupilR,
    lidTop: lidTop ?? baseConfig.lidTop,
    mouth: mouth ?? baseConfig.mouth,
    blush: blush ?? baseConfig.blush,
    anim: anim ?? baseConfig.anim,
  }), [
    emotionalState, baseConfig, color, scaleX, scaleY, offY, eyeW, eyeH,
    pupilR, lidTop, mouth, blush, anim
  ]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      setAnimationTime(t => t + 1);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const sizeValue = SIZE_MAP[size];
  const scale = sizeValue / 220; // Base size is 220

  return (
    <div
      style={{
        width: sizeValue,
        height: sizeValue,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${scale})`,
        transformOrigin: 'center',
      }}
    >
      <PetSvg
        color={config.color}
        scaleX={config.scaleX}
        scaleY={config.scaleY}
        offY={config.offY}
        eyeW={config.eyeW}
        eyeH={config.eyeH}
        pupilR={config.pupilR}
        lidTop={config.lidTop}
        mouth={config.mouth}
        blush={config.blush}
        anim={config.anim}
        animationTime={animationTime}
        bodyScaleX={1}
        bodyScaleY={1}
        bodyOffX={0}
        bodyOffY={0}
        pupilOffsetX={0}
        pupilOffsetY={0}
        blinkLidAdjustment={0}
        pokeReactionType={null}
      />
    </div>
  );
}
