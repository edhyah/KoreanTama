import { DebugPet } from '../DebugPet';
import { EMOTIONAL_STATES } from '../../constants';
import type { EmotionalStateName } from '../../types';

const emotionalStateNames = Object.keys(EMOTIONAL_STATES) as EmotionalStateName[];

export function EmotionsGrid() {
  return (
    <div className="debug-emotions-grid">
      {emotionalStateNames.map((state) => {
        const config = EMOTIONAL_STATES[state];
        return (
          <div key={state} className="debug-emotion-card">
            <DebugPet emotionalState={state} size="small" />
            <div className="debug-emotion-info">
              <div className="debug-emotion-name">{state}</div>
              <div className="debug-emotion-details">
                <span
                  className="debug-color-swatch"
                  style={{ backgroundColor: config.color }}
                />
                <span className="debug-emotion-anim">{config.anim}</span>
                <span className="debug-emotion-mouth">{config.mouth}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
