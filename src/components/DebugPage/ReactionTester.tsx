import { useRef, useCallback, useState } from 'react';
import { Pet, PetRef } from '../Pet';
import { EMOTIONAL_STATES } from '../../constants';
import type { EmotionalStateName } from '../../types';

const emotionalStateNames = Object.keys(EMOTIONAL_STATES) as EmotionalStateName[];

// 3x3 grid look directions
const LOOK_DIRECTIONS = [
  { label: 'TL', x: -4, y: -2 },
  { label: 'T', x: 0, y: -3 },
  { label: 'TR', x: 4, y: -2 },
  { label: 'L', x: -5, y: 0 },
  { label: 'C', x: 0, y: 0 },
  { label: 'R', x: 5, y: 0 },
  { label: 'BL', x: -4, y: 2 },
  { label: 'B', x: 0, y: 3 },
  { label: 'BR', x: 4, y: 2 },
];

export function ReactionTester() {
  const petRef = useRef<PetRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionalStateName>('happy');

  const handlePoke = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Simulate a poke from a random direction
      const angle = Math.random() * Math.PI * 2;
      const distance = 100;
      const x = rect.left + rect.width / 2 + Math.cos(angle) * distance;
      const y = rect.top + rect.height / 2 + Math.sin(angle) * distance;
      petRef.current?.handlePoke(x, y);
    }
  }, []);

  const handleSquish = useCallback(() => {
    petRef.current?.applySquish();
  }, []);

  const handleLook = useCallback((x: number, y: number) => {
    petRef.current?.setLookTarget(x, y);
  }, []);

  const handleResetLook = useCallback(() => {
    petRef.current?.resetLookTarget();
  }, []);

  const handleSetEmotion = useCallback((state: EmotionalStateName) => {
    petRef.current?.setEmotionalState(state);
    setCurrentEmotion(state);
  }, []);

  return (
    <div className="debug-reaction-tester">
      <div className="debug-reaction-pet" ref={containerRef}>
        <Pet
          ref={petRef}
          gameState="idle"
          isQuizActive={false}
          hunger={100}
          happiness={100}
        />
      </div>

      <div className="debug-reaction-controls">
        <div className="debug-control-section">
          <label className="debug-control-label">Physics Actions</label>
          <div className="debug-action-buttons">
            <button onClick={handlePoke} className="debug-action-btn">
              Poke
            </button>
            <button onClick={handleSquish} className="debug-action-btn">
              Squish
            </button>
          </div>
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">Look Direction</label>
          <div className="debug-look-grid">
            {LOOK_DIRECTIONS.map((dir) => (
              <button
                key={dir.label}
                onClick={() => dir.label === 'C' ? handleResetLook() : handleLook(dir.x, dir.y)}
                className="debug-look-btn"
              >
                {dir.label}
              </button>
            ))}
          </div>
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">
            Emotion: <span className="debug-current-emotion">{currentEmotion}</span>
          </label>
          <div className="debug-emotion-buttons">
            {emotionalStateNames.map((state) => (
              <button
                key={state}
                onClick={() => handleSetEmotion(state)}
                className={`debug-emotion-btn ${currentEmotion === state ? 'active' : ''}`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
