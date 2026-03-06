import { forwardRef } from 'react';

export interface HUDProps {
  currentStreak: number;
  learnedWordCount: number;
  dailyCorrectCount: number;
  dailyGoal: number;
  onDebugClick: () => void;
  goalPulse?: boolean;
}

export const HUD = forwardRef<HTMLDivElement, HUDProps>(({
  currentStreak,
  learnedWordCount,
  dailyCorrectCount,
  dailyGoal,
  onDebugClick,
  goalPulse = false,
}, ref) => {
  const done = Math.min(dailyCorrectCount, dailyGoal);
  const remaining = dailyGoal - done;
  const progressStr = '■'.repeat(done) + '□'.repeat(remaining);

  return (
    <div ref={ref} className={`hud ${goalPulse ? 'goal-pulse' : ''}`}>
      <span className="hud-streak">Day {currentStreak}</span>
      <span className="hud-words">{learnedWordCount} words</span>
      <span className="hud-progress">{progressStr}</span>
      <span className="hud-debug" onClick={onDebugClick}>*</span>
    </div>
  );
});

HUD.displayName = 'HUD';
