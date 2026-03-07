import type { MouthType } from '../types';

export function getMouthPath(type: MouthType, cx: number, cy: number, munchPhase: number = 0): string {
  const dark = "#4A4A5A";

  switch (type) {
    case 'smile':
      return `<path d="M${cx - 10},${cy} Q${cx},${cy + 10} ${cx + 10},${cy}" fill="none" stroke="${dark}" stroke-width="2.2" stroke-linecap="round"/>`;
    case 'bigSmile':
      return `<path d="M${cx - 14},${cy - 2} Q${cx},${cy + 14} ${cx + 14},${cy - 2}" fill="${dark}" stroke="${dark}" stroke-width="1.5" stroke-linecap="round"/>`;
    case 'frown':
      return `<path d="M${cx - 9},${cy + 4} Q${cx},${cy - 4} ${cx + 9},${cy + 4}" fill="none" stroke="${dark}" stroke-width="2.2" stroke-linecap="round"/>`;
    case 'flat':
      return `<line x1="${cx - 8}" y1="${cy + 1}" x2="${cx + 8}" y2="${cy + 1}" stroke="${dark}" stroke-width="2.2" stroke-linecap="round"/>`;
    case 'open':
      return `<ellipse cx="${cx}" cy="${cy + 2}" rx="8" ry="10" fill="${dark}"/>`;
    case 'openSmall':
      return `<ellipse cx="${cx}" cy="${cy + 2}" rx="5" ry="6" fill="${dark}"/>`;
    case 'yawn':
      return `<ellipse cx="${cx}" cy="${cy + 3}" rx="7" ry="9" fill="${dark}"/>`;
    case 'wavy':
      return `<path d="M${cx - 10},${cy} q5,-4 10,0 q5,4 10,0" fill="none" stroke="${dark}" stroke-width="2" stroke-linecap="round"/>`;
    case 'pant':
      return `<ellipse cx="${cx}" cy="${cy + 2}" rx="7" ry="5" fill="${dark}"/><ellipse cx="${cx}" cy="${cy + 4}" rx="5" ry="2.5" fill="#F87171" opacity="0.7"/>`;
    case 'smirk':
      return `<path d="M${cx - 6},${cy + 1} Q${cx + 2},${cy + 10} ${cx + 10},${cy - 1}" fill="none" stroke="${dark}" stroke-width="2.2" stroke-linecap="round"/>`;
    case 'munch':
      // Animate between open and smile for munching
      if (munchPhase > 0) {
        return `<path d="M${cx - 8},${cy} Q${cx},${cy + 8} ${cx + 8},${cy}" fill="${dark}" stroke="${dark}" stroke-width="1.5"/>`;
      } else {
        return `<path d="M${cx - 10},${cy} Q${cx},${cy + 10} ${cx + 10},${cy}" fill="none" stroke="${dark}" stroke-width="2.2" stroke-linecap="round"/>`;
      }
    case 'pout':
      // Small pouty/annoyed mouth - rounded squished shape
      return `<ellipse cx="${cx}" cy="${cy + 2}" rx="6" ry="4" fill="${dark}"/>`;
    default:
      return `<path d="M${cx - 8},${cy} Q${cx},${cy + 8} ${cx + 8},${cy}" fill="none" stroke="${dark}" stroke-width="2" stroke-linecap="round"/>`;
  }
}
