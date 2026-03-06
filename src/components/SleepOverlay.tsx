import { PetSvg } from './Pet/PetSvg';
import { EMOTIONAL_STATES } from '../constants';

interface SleepOverlayProps {
  visible: boolean;
  onWake: () => void;
  animationTime: number;
}

export function SleepOverlay({ visible, onWake, animationTime }: SleepOverlayProps) {
  const sleepyState = EMOTIONAL_STATES.sleepy;

  return (
    <div
      className={`sleep-overlay ${!visible ? 'hidden' : ''}`}
      onClick={onWake}
    >
      <PetSvg
        color={sleepyState.color}
        scaleX={sleepyState.scaleX}
        scaleY={sleepyState.scaleY}
        offY={sleepyState.offY}
        eyeW={sleepyState.eyeW}
        eyeH={sleepyState.eyeH}
        pupilR={sleepyState.pupilR}
        lidTop={sleepyState.lidTop}
        mouth={sleepyState.mouth}
        blush={sleepyState.blush}
        anim={sleepyState.anim}
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
      <div className="tap-text">tap to wake up!</div>
    </div>
  );
}
