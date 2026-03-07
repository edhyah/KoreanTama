import { useMemo } from 'react';
import type { MouthType } from '../../types';
import { getMouthPath } from '../../utils';
import { lerpColor } from '../../utils/colors';
import type { IdleBehaviorType, ExplorationBehaviorType, AwarenessMode } from '../../hooks/useIdleAnimations';

export interface PetSvgProps {
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
  anim: string;
  animationTime: number;
  bodyScaleX: number;
  bodyScaleY: number;
  bodyOffX: number;
  bodyOffY: number;
  pupilOffsetX: number;
  pupilOffsetY: number;
  blinkLidAdjustment: number;
  pokeReactionType: 'surprised' | 'happy' | 'annoyed' | null;
  // New physics
  edgePressX?: number;
  stretchY?: number;
  wanderX?: number;
  wanderY?: number;
  // Behavior state
  idleBehavior?: IdleBehaviorType | null;
  idleBehaviorProgress?: number;
  explorationBehavior?: ExplorationBehaviorType | null;
  explorationPhase?: 'starting' | 'active' | 'ending' | null;
  awarenessMode?: AwarenessMode;
}

export function PetSvg({
  color,
  scaleX: baseScaleX,
  scaleY: baseScaleY,
  offY,
  eyeW,
  eyeH,
  pupilR,
  lidTop: baseLidTop,
  mouth: baseMouth,
  blush: baseBlush,
  anim,
  animationTime,
  bodyScaleX,
  bodyScaleY,
  bodyOffX,
  bodyOffY,
  pupilOffsetX,
  pupilOffsetY,
  blinkLidAdjustment,
  pokeReactionType,
  edgePressX = 0,
  stretchY = 0,
  wanderX = 0,
  wanderY = 0,
  idleBehavior = null,
  idleBehaviorProgress = 0,
  explorationBehavior = null,
  explorationPhase = null,
  awarenessMode = 'idle',
}: PetSvgProps) {
  const svgContent = useMemo(() => {
    // Apply spring physics to scale
    let sx = baseScaleX * bodyScaleX;
    let sy = baseScaleY * bodyScaleY;

    // Apply edge press (horizontal squish)
    if (edgePressX !== 0) {
      sx += Math.abs(edgePressX) * 0.1; // Slightly wider when pressed
      // Asymmetric squish effect handled by path adjustment below
    }

    // Apply stretch (vertical elongation for yawn/reach)
    sy += stretchY;

    // Apply blink animation to lid (will add reaction adjustment later)
    let lidTop = Math.max(baseLidTop, blinkLidAdjustment);

    // Poke/squish reaction overrides
    let mouth = baseMouth;
    let blush = baseBlush;
    let reactionLidAdjust = 0;
    if (pokeReactionType === 'surprised') {
      mouth = 'openSmall';
    } else if (pokeReactionType === 'happy') {
      mouth = 'smile';
      blush = true;
    } else if (pokeReactionType === 'annoyed') {
      mouth = 'pout';
      blush = false;
      reactionLidAdjust = 0.25; // Slightly squint eyes when annoyed
    }

    // Idle behavior overrides
    if (idleBehavior === 'yawn') {
      mouth = 'yawn';
      // Eyes squint during yawn
      const yawnSquint = Math.sin(idleBehaviorProgress * Math.PI) * 0.4;
      reactionLidAdjust = Math.max(reactionLidAdjust, yawnSquint);
    } else if (idleBehavior === 'daydream') {
      // Dreamy eyes - slight unfocus
      reactionLidAdjust = Math.max(reactionLidAdjust, 0.15);
      // Slight smile
      if (mouth !== 'yawn') {
        mouth = 'smile';
      }
    }

    // Exploration behavior overrides
    if (explorationBehavior === 'startle' && explorationPhase === 'starting') {
      mouth = 'openSmall';
      // Eyes wide
      reactionLidAdjust = 0;
    } else if (explorationBehavior === 'reaching' && explorationPhase === 'active') {
      // Focused expression
      mouth = 'flat';
    }

    // Awareness mode effects
    if (awarenessMode === 'curious') {
      // Slightly widened eyes (less lid coverage)
      reactionLidAdjust = Math.max(0, reactionLidAdjust - 0.05);
    }

    // Apply reaction lid adjustment
    lidTop = Math.max(lidTop, reactionLidAdjust);

    // Animation offsets from emotional state animation
    const sec = animationTime / 60;
    let animOffX = 0, animOffY = 0, animRot = 0, animScale = 1;

    switch (anim) {
      case 'bounce':  animOffY = Math.sin(sec * 2.5) * 1.5; break;
      case 'wobble':  animRot = Math.sin(sec * 3) * 1.2; break;
      case 'drift':   animOffY = Math.sin(sec * 1.2) * 1; animOffX = Math.sin(sec * 0.8) * 0.6; break;
      case 'shiver':  animOffX = Math.sin(sec * 18) * 0.8; break;
      case 'nod':     animOffY = Math.sin(sec * 2) * 1.2; break;
      case 'jump':    animOffY = -Math.abs(Math.sin(sec * 3)) * 3; break;
      case 'melt':    animScale = 1 + Math.sin(sec * 1.5) * 0.01; animOffY = Math.sin(sec * 1.5) * 0.8; break;
      case 'munch':   animScale = 1 + Math.sin(sec * 6) * 0.015; break;
      case 'float':   animOffY = Math.sin(sec * 1.8) * 1.5; animOffX = Math.sin(sec * 1.1) * 0.6; break;
    }

    // Add spring-based position offsets
    animOffX += bodyOffX;
    animOffY += bodyOffY;

    // Body blob path with edge press deformation
    const bw = 42 * sx;
    const bh = 58 * sy;
    const bodyY = 100 + offY + animOffY;

    // Edge press deformation - shift control points to create squish effect
    const pressOffsetLeft = edgePressX < 0 ? edgePressX * 40 : 0;
    const pressOffsetRight = edgePressX > 0 ? edgePressX * 40 : 0;

    const bodyPath = `M${100 - bw + pressOffsetLeft},${bodyY}
      C${100 - bw + pressOffsetLeft},${bodyY - bh * 1.1} ${100 + bw + pressOffsetRight},${bodyY - bh * 1.1} ${100 + bw + pressOffsetRight},${bodyY}
      C${100 + bw + pressOffsetRight},${bodyY + bh * 0.9} ${100 - bw + pressOffsetLeft},${bodyY + bh * 0.9} ${100 - bw + pressOffsetLeft},${bodyY}Z`;

    // Eye positions (shifted slightly with edge press)
    const eyeShiftX = edgePressX * 5;
    const eyeCX_L = 82 + eyeShiftX, eyeCX_R = 118 + eyeShiftX;
    const eyeCY = 95 + offY + animOffY;

    // Clamp pupil within eye bounds
    const maxPupilX = (eyeW / 2 - pupilR * 0.85) * 0.7;
    const maxPupilY = (eyeH / 2 - pupilR) * 0.5;
    const clampedPupilX = Math.max(-maxPupilX, Math.min(maxPupilX, pupilOffsetX));
    const clampedPupilY = Math.max(-maxPupilY, Math.min(maxPupilY, pupilOffsetY));

    // Munch phase for animated mouth
    const munchPhase = Math.sin(sec * 6);

    // Build SVG content
    let svg = '';

    // Wrap everything in a wander group for exploration movement
    svg += `<g transform="translate(${wanderX}, ${wanderY})">`;

    // Shadow - scale with body
    const shadowScale = (sx + sy) / 2;
    svg += `<ellipse cx="${100 + animOffX}" cy="${168 + offY * 0.3}" rx="${30 * shadowScale}" ry="5" fill="rgba(0,0,0,0.15)"/>`;

    // Body group with transforms
    svg += `<g transform="translate(${animOffX},0) rotate(${animRot},100,${bodyY})">`;
    svg += `<g transform="scale(${animScale})" style="transform-origin: 100px ${bodyY}px">`;
    svg += `<path d="${bodyPath}" fill="${color}"/>`;
    svg += `</g></g>`;

    // Face group
    svg += `<g transform="translate(${animOffX},0) rotate(${animRot},100,${bodyY})">`;

    // Eyes
    [eyeCX_L, eyeCX_R].forEach((cx, i) => {
      const clipId = `eye-clip-${i}`;
      const eyeTop = eyeCY - eyeH / 2;
      const lidY = eyeTop + eyeH * lidTop;

      svg += `<defs><clipPath id="${clipId}"><ellipse cx="${cx}" cy="${eyeCY}" rx="${eyeW / 2}" ry="${eyeH / 2}"/></clipPath></defs>`;
      svg += `<ellipse cx="${cx}" cy="${eyeCY}" rx="${eyeW / 2}" ry="${eyeH / 2}" fill="white"/>`;
      svg += `<ellipse cx="${cx + clampedPupilX}" cy="${eyeCY + clampedPupilY + 1}" rx="${pupilR * 0.85}" ry="${pupilR}" fill="#2d2d3a" clip-path="url(#${clipId})"/>`;

      if (lidTop > 0.01) {
        svg += `<rect x="${cx - eyeW / 2 - 2}" y="${eyeTop - 2}" width="${eyeW + 4}" height="${lidY - eyeTop + 2}" fill="${color}" clip-path="url(#${clipId})"/>`;
      }
      if (lidTop > 0.05) {
        const lidColor = lerpColor(color, "#333333", 0.25);
        svg += `<line x1="${cx - eyeW / 2}" y1="${lidY}" x2="${cx + eyeW / 2}" y2="${lidY}" stroke="${lidColor}" stroke-width="1.5" stroke-linecap="round" clip-path="url(#${clipId})"/>`;
      }
    });

    // Blush
    if (blush) {
      svg += `<ellipse cx="${eyeCX_L - 6}" cy="${eyeCY + eyeH / 2 + 4}" rx="8" ry="4" fill="#FF8A8A" opacity="0.3"/>`;
      svg += `<ellipse cx="${eyeCX_R + 6}" cy="${eyeCY + eyeH / 2 + 4}" rx="8" ry="4" fill="#FF8A8A" opacity="0.3"/>`;
    }

    // Mouth (shifted with edge press)
    svg += getMouthPath(mouth, 100 + eyeShiftX, eyeCY + eyeH / 2 + 10, munchPhase);

    svg += `</g>`;

    // Sleeping ZZZ - show when mouth is yawn (sleepy state)
    if (mouth === 'yawn' && !idleBehavior) {
      const zOffset = Math.sin(sec * 1.5) * 2;
      const zBaseX = 135 + animOffX;
      const zBaseY = 65 + animOffY + offY;
      svg += `<g fill="#4A4A5A" font-family="sans-serif" font-weight="bold">`;
      svg += `<text x="${zBaseX}" y="${zBaseY + zOffset}" font-size="12" opacity="0.9">z</text>`;
      svg += `<text x="${zBaseX + 10}" y="${zBaseY - 8 + zOffset * 0.7}" font-size="10" opacity="0.7">z</text>`;
      svg += `<text x="${zBaseX + 18}" y="${zBaseY - 14 + zOffset * 0.5}" font-size="8" opacity="0.5">z</text>`;
      svg += `</g>`;
    }

    // Daydream thought bubble (subtle)
    if (idleBehavior === 'daydream' && idleBehaviorProgress > 0.2 && idleBehaviorProgress < 0.8) {
      const bubbleOpacity = Math.sin((idleBehaviorProgress - 0.2) / 0.6 * Math.PI) * 0.4;
      const bubbleX = 140 + animOffX;
      const bubbleY = 55 + animOffY + offY;
      svg += `<g opacity="${bubbleOpacity}">`;
      svg += `<circle cx="${bubbleX - 15}" cy="${bubbleY + 20}" r="3" fill="#e0e0e0"/>`;
      svg += `<circle cx="${bubbleX - 8}" cy="${bubbleY + 12}" r="4" fill="#e0e0e0"/>`;
      svg += `<ellipse cx="${bubbleX + 5}" cy="${bubbleY}" rx="12" ry="8" fill="#e0e0e0"/>`;
      svg += `</g>`;
    }

    // Close wander group
    svg += `</g>`;

    return svg;
  }, [
    color, baseScaleX, baseScaleY, offY, eyeW, eyeH, pupilR, baseLidTop, baseMouth, baseBlush, anim,
    animationTime, bodyScaleX, bodyScaleY, bodyOffX, bodyOffY, pupilOffsetX, pupilOffsetY,
    blinkLidAdjustment, pokeReactionType, edgePressX, stretchY, wanderX, wanderY, idleBehavior, idleBehaviorProgress,
    explorationBehavior, explorationPhase, awarenessMode
  ]);

  return (
    <svg viewBox="0 0 200 200" width="220" height="220" overflow="visible" dangerouslySetInnerHTML={{ __html: svgContent }} />
  );
}
