// HSL conversion utilities and color modulation based on needs

interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/**
 * Convert hex color to HSL
 */
function hexToHSL(hex: string): HSL {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to hex color
 */
function hslToHex(hsl: HSL): string {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export interface Needs {
  hunger: number;    // 0-100
  happiness: number; // 0-100
}

/**
 * Modulate a color based on the pet's needs (hunger and happiness).
 *
 * - Low hunger → desaturates color (more gray)
 * - Low happiness → shifts cooler and darker
 * - Combined low needs → notably "unwell" appearance
 *
 * Uses quadratic curves so changes are visible throughout the range,
 * not just at extreme values.
 */
export function modulateColorByNeeds(
  baseColor: string,
  needs: Needs
): string {
  const hsl = hexToHSL(baseColor);

  // Normalize needs to 0-1 range
  const hungerFactor = needs.hunger / 100;
  const happinessFactor = needs.happiness / 100;

  // Combined health factor (average of both needs)
  const healthFactor = (hungerFactor + happinessFactor) / 2;

  // === Saturation modulation ===
  // Use quadratic curve so effect is noticeable even at higher values
  // At 100% hunger: multiplier = 1.0 (no change)
  // At 70% hunger: multiplier = 0.79 (21% reduction)
  // At 50% hunger: multiplier = 0.55 (45% reduction)
  // At 0% hunger: multiplier = 0.2 (80% reduction)
  const saturationMultiplier = 0.2 + (hungerFactor * hungerFactor * 0.8);
  hsl.s = Math.round(hsl.s * saturationMultiplier);

  // === Lightness modulation ===
  // Low happiness makes color darker - use quadratic for earlier effect
  // At 100% happiness: no change
  // At 70% happiness: -4.5 lightness
  // At 50% happiness: -12.5 lightness
  // At 0% happiness: -25 lightness
  const happinessDeficit = 1 - happinessFactor;
  const lightnessReduction = happinessDeficit * happinessDeficit * 25;
  hsl.l = Math.round(Math.max(25, hsl.l - lightnessReduction));

  // === Hue shift ===
  // Low happiness shifts color toward cooler tones (blue-gray)
  // Stronger effect: up to 20 degrees shift
  if (hsl.h < 180 || hsl.h > 260) {
    const hueShift = happinessDeficit * 20;
    if (hsl.h < 210) {
      hsl.h = Math.min(210, hsl.h + hueShift);
    }
  }

  // === Additional desaturation for combined low needs ===
  // When both needs are low, apply extra "unwell" desaturation
  // Kicks in below 60% combined health
  if (healthFactor < 0.6) {
    const unwellFactor = 1 - (healthFactor / 0.6); // 0 at 60% health, 1 at 0% health
    const extraDesaturation = unwellFactor * 0.5; // Up to 50% more desaturation
    hsl.s = Math.round(hsl.s * (1 - extraDesaturation));
  }

  return hslToHex(hsl);
}
