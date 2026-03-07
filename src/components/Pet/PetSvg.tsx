import { useMemo } from 'react';
import type { MouthType } from '../../types';
import { getMouthPath } from '../../utils';
import { lerpColor } from '../../utils/colors';

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
}: PetSvgProps) {
  const svgContent = useMemo(() => {
    // Apply spring physics to scale
    let sx = baseScaleX * bodyScaleX;
    let sy = baseScaleY * bodyScaleY;

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

    // Body blob path
    const bw = 42 * sx, bh = 58 * sy;
    const bodyY = 100 + offY + animOffY;
    const bodyPath = `M${100 - bw},${bodyY}
      C${100 - bw},${bodyY - bh * 1.1} ${100 + bw},${bodyY - bh * 1.1} ${100 + bw},${bodyY}
      C${100 + bw},${bodyY + bh * 0.9} ${100 - bw},${bodyY + bh * 0.9} ${100 - bw},${bodyY}Z`;

    // Eye positions
    const eyeCX_L = 82, eyeCX_R = 118;
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

    // Mouth
    svg += getMouthPath(mouth, 100, eyeCY + eyeH / 2 + 10, munchPhase);

    svg += `</g>`;

    // Sleeping ZZZ - show when mouth is yawn (sleepy state)
    if (mouth === 'yawn') {
      const zOffset = Math.sin(sec * 1.5) * 2;
      const zBaseX = 135 + animOffX;
      const zBaseY = 65 + animOffY + offY;
      svg += `<g fill="#4A4A5A" font-family="sans-serif" font-weight="bold">`;
      svg += `<text x="${zBaseX}" y="${zBaseY + zOffset}" font-size="12" opacity="0.9">z</text>`;
      svg += `<text x="${zBaseX + 10}" y="${zBaseY - 8 + zOffset * 0.7}" font-size="10" opacity="0.7">z</text>`;
      svg += `<text x="${zBaseX + 18}" y="${zBaseY - 14 + zOffset * 0.5}" font-size="8" opacity="0.5">z</text>`;
      svg += `</g>`;
    }

    return svg;
  }, [
    color, baseScaleX, baseScaleY, offY, eyeW, eyeH, pupilR, baseLidTop, baseMouth, baseBlush, anim,
    animationTime, bodyScaleX, bodyScaleY, bodyOffX, bodyOffY, pupilOffsetX, pupilOffsetY,
    blinkLidAdjustment, pokeReactionType
  ]);

  return (
    <svg viewBox="0 0 200 200" width="220" height="220" dangerouslySetInnerHTML={{ __html: svgContent }} />
  );
}
