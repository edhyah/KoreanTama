import { useState } from 'react';
import type { EmotionalStateName, QuizFrequency } from '../types';
import { EMOTIONAL_STATES, CATEGORIES } from '../constants';

interface DebugModalProps {
  visible: boolean;
  onClose: () => void;
  hunger: number;
  happiness: number;
  quizFrequency: QuizFrequency;
  onSetHunger: (value: number) => void;
  onSetHappiness: (value: number) => void;
  onSetProgressLevel: (level: number) => void;
  onSetEmotionalState: (state: EmotionalStateName) => void;
  onSetQuizFrequency: (freq: QuizFrequency) => void;
  onTriggerDiscovery: () => void;
  onTriggerHungerQuiz: () => void;
  onTriggerBoredQuiz: () => void;
  onTriggerRandomQuiz: () => void;
  onTestSquish: () => void;
  onForceWander: () => void;
  onReset: () => void;
  onOpenDebugPage?: () => void;
}

export function DebugModal({
  visible,
  onClose,
  hunger,
  happiness,
  quizFrequency,
  onSetHunger,
  onSetHappiness,
  onSetProgressLevel,
  onSetEmotionalState,
  onSetQuizFrequency,
  onTriggerDiscovery,
  onTriggerHungerQuiz,
  onTriggerBoredQuiz,
  onTriggerRandomQuiz,
  onTestSquish,
  onForceWander,
  onReset,
  onOpenDebugPage,
}: DebugModalProps) {
  const [hoverHunger, setHoverHunger] = useState<number | null>(null);
  const [hoverHappiness, setHoverHappiness] = useState<number | null>(null);

  const levels = [
    { label: '0', value: 0 },
    ...CATEGORIES.filter(c => c.unlockAt > 0).map(c => ({ label: c.name, value: c.unlockAt }))
  ];

  const emotionalStates = Object.keys(EMOTIONAL_STATES) as EmotionalStateName[];
  const frequencies: QuizFrequency[] = ['frequent', 'normal', 'rare', 'off'];

  const hungerLevel = Math.ceil(hunger / 20);
  const happinessLevel = Math.ceil(happiness / 20);

  const getStatIconClass = (index: number, level: number, hoverLevel: number | null) => {
    if (hoverLevel !== null) {
      return index < hoverLevel ? 'stat-icon hover-fill' : 'stat-icon hover-unfill';
    }
    return index < level ? 'stat-icon filled' : 'stat-icon';
  };

  return (
    <div className={`debug-modal ${visible ? 'visible' : ''}`}>
      <h3>Debug Menu</h3>

      <div className="debug-section">
        <div className="debug-label">Set Progress Level</div>
        <div className="level-buttons">
          {levels.map(level => (
            <button
              key={level.value}
              title={`Set progress to ${level.value}`}
              onClick={() => {
                onSetProgressLevel(level.value);
                onClose();
              }}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <div className="debug-section">
        <div className="debug-label">Hunger</div>
        <div
          className="stat-icons"
          onMouseLeave={() => setHoverHunger(null)}
        >
          {[20, 40, 60, 80, 100].map((value, index) => (
            <span
              key={value}
              className={getStatIconClass(index, hungerLevel, hoverHunger)}
              data-value={value}
              onMouseEnter={() => setHoverHunger(index + 1)}
              onClick={() => {
                onSetHunger(value);
                onClose();
              }}
            >
              ♥
            </span>
          ))}
        </div>
      </div>

      <div className="debug-section">
        <div className="debug-label">Happiness</div>
        <div
          className="stat-icons stat-icons-large"
          onMouseLeave={() => setHoverHappiness(null)}
        >
          {[20, 40, 60, 80, 100].map((value, index) => (
            <span
              key={value}
              className={getStatIconClass(index, happinessLevel, hoverHappiness)}
              data-value={value}
              onMouseEnter={() => setHoverHappiness(index + 1)}
              onClick={() => {
                onSetHappiness(value);
                onClose();
              }}
            >
              ☻
            </span>
          ))}
        </div>
      </div>

      <div className="debug-section">
        <div className="debug-label">Emotional State</div>
        <div className="level-buttons">
          {emotionalStates.map(state => (
            <button key={state} onClick={() => onSetEmotionalState(state)}>
              {state}
            </button>
          ))}
        </div>
      </div>

      <div className="debug-section">
        <div className="debug-label">Quiz Frequency</div>
        <div className="level-buttons">
          {frequencies.map(freq => (
            <button
              key={freq}
              style={{
                background: freq === quizFrequency ? 'rgba(126, 200, 227, 0.3)' : undefined
              }}
              onClick={() => onSetQuizFrequency(freq)}
            >
              {freq}
            </button>
          ))}
        </div>
      </div>

      <div className="debug-section">
        <div className="debug-label">Triggers</div>
        <button onClick={() => { onTriggerDiscovery(); onClose(); }}>Discovery</button>
        <button onClick={() => { onTriggerHungerQuiz(); onClose(); }}>Hunger Quiz</button>
        <button onClick={() => { onTriggerBoredQuiz(); onClose(); }}>Bored Quiz</button>
        <button onClick={() => { onTriggerRandomQuiz(); onClose(); }}>Random Quiz</button>
      </div>

      <div className="debug-section">
        <div className="debug-label">Physics Test</div>
        <button onClick={onTestSquish}>Test Squish</button>
        <button onClick={() => { onForceWander(); onClose(); }}>Force Wander</button>
      </div>

      <div className="debug-section">
        <div className="debug-label">Data</div>
        <button onClick={() => {
          if (confirm('Reset all progress data?')) {
            onReset();
          }
        }}>
          Reset All Data
        </button>
      </div>

      {onOpenDebugPage && (
        <div className="debug-section">
          <button onClick={() => { onOpenDebugPage(); onClose(); }}>
            Open Debug Page
          </button>
        </div>
      )}

      <button onClick={onClose}>Close</button>
    </div>
  );
}
