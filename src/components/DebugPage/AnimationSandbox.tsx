import { useState, useCallback } from 'react';
import { DebugPet } from '../DebugPet';
import { EMOTIONAL_STATES, ANIMATION_TYPES, MOUTH_TYPES } from '../../constants';
import type { EmotionalStateName, MouthType, AnimationType } from '../../types';

const emotionalStateNames = Object.keys(EMOTIONAL_STATES) as EmotionalStateName[];

interface SandboxParams {
  color: string;
  scaleX: number;
  scaleY: number;
  eyeW: number;
  eyeH: number;
  pupilR: number;
  lidTop: number;
  mouth: MouthType;
  blush: boolean;
  anim: AnimationType;
}

const DEFAULT_PARAMS: SandboxParams = {
  color: '#FFD166',
  scaleX: 1.0,
  scaleY: 1.0,
  eyeW: 17,
  eyeH: 20,
  pupilR: 8,
  lidTop: 0,
  mouth: 'smile',
  blush: false,
  anim: 'bounce',
};

export function AnimationSandbox() {
  const [params, setParams] = useState<SandboxParams>(DEFAULT_PARAMS);

  const updateParam = useCallback(<K extends keyof SandboxParams>(
    key: K,
    value: SandboxParams[K]
  ) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const applyPreset = useCallback((state: EmotionalStateName) => {
    const config = EMOTIONAL_STATES[state];
    setParams({
      color: config.color,
      scaleX: config.scaleX,
      scaleY: config.scaleY,
      eyeW: config.eyeW,
      eyeH: config.eyeH,
      pupilR: config.pupilR,
      lidTop: config.lidTop,
      mouth: config.mouth,
      blush: config.blush,
      anim: config.anim,
    });
  }, []);

  return (
    <div className="debug-sandbox">
      <div className="debug-sandbox-pet">
        <DebugPet
          emotionalState="happy"
          size="large"
          color={params.color}
          scaleX={params.scaleX}
          scaleY={params.scaleY}
          eyeW={params.eyeW}
          eyeH={params.eyeH}
          pupilR={params.pupilR}
          lidTop={params.lidTop}
          mouth={params.mouth}
          blush={params.blush}
          anim={params.anim}
        />
      </div>

      <div className="debug-sandbox-controls">
        <div className="debug-control-section">
          <label className="debug-control-label">Presets</label>
          <div className="debug-preset-buttons">
            {emotionalStateNames.map((state) => (
              <button
                key={state}
                onClick={() => applyPreset(state)}
                className="debug-preset-btn"
              >
                {state}
              </button>
            ))}
          </div>
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">Animation Type</label>
          <div className="debug-option-buttons">
            {ANIMATION_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => updateParam('anim', type)}
                className={`debug-option-btn ${params.anim === type ? 'active' : ''}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">Mouth Type</label>
          <div className="debug-option-buttons">
            {MOUTH_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => updateParam('mouth', type)}
                className={`debug-option-btn ${params.mouth === type ? 'active' : ''}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">Color</label>
          <input
            type="color"
            value={params.color}
            onChange={(e) => updateParam('color', e.target.value)}
            className="debug-color-input"
          />
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">
            <input
              type="checkbox"
              checked={params.blush}
              onChange={(e) => updateParam('blush', e.target.checked)}
            />
            {' '}Blush
          </label>
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">Eye Width: {params.eyeW}</label>
          <input
            type="range"
            min="10"
            max="25"
            step="1"
            value={params.eyeW}
            onChange={(e) => updateParam('eyeW', Number(e.target.value))}
            className="debug-slider"
          />
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">Eye Height: {params.eyeH}</label>
          <input
            type="range"
            min="8"
            max="28"
            step="1"
            value={params.eyeH}
            onChange={(e) => updateParam('eyeH', Number(e.target.value))}
            className="debug-slider"
          />
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">Pupil Radius: {params.pupilR}</label>
          <input
            type="range"
            min="4"
            max="12"
            step="1"
            value={params.pupilR}
            onChange={(e) => updateParam('pupilR', Number(e.target.value))}
            className="debug-slider"
          />
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">Lid Position: {params.lidTop.toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="0.9"
            step="0.05"
            value={params.lidTop}
            onChange={(e) => updateParam('lidTop', Number(e.target.value))}
            className="debug-slider"
          />
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">Body Scale X: {params.scaleX.toFixed(2)}</label>
          <input
            type="range"
            min="0.8"
            max="1.2"
            step="0.01"
            value={params.scaleX}
            onChange={(e) => updateParam('scaleX', Number(e.target.value))}
            className="debug-slider"
          />
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">Body Scale Y: {params.scaleY.toFixed(2)}</label>
          <input
            type="range"
            min="0.8"
            max="1.2"
            step="0.01"
            value={params.scaleY}
            onChange={(e) => updateParam('scaleY', Number(e.target.value))}
            className="debug-slider"
          />
        </div>
      </div>
    </div>
  );
}
