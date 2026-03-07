import { useRef, useCallback, useState, useEffect } from 'react';
import { Pet, PetRef } from '../Pet';
import type { BlinkType, IdleBehaviorType, ExplorationBehavior } from '../../hooks/useIdleAnimations';

export function BehaviorTester() {
  const petRef = useRef<PetRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Clear status message after delay
  useEffect(() => {
    if (statusMessage) {
      const timeout = setTimeout(() => setStatusMessage(''), 2000);
      return () => clearTimeout(timeout);
    }
  }, [statusMessage]);

  const showStatus = useCallback((msg: string) => {
    setStatusMessage(msg);
  }, []);

  // Micro-expressions
  const handleBlink = useCallback((type: BlinkType) => {
    petRef.current?.triggerBlink(type);
    showStatus(`Triggered ${type} blink`);
  }, [showStatus]);

  const handleSigh = useCallback(() => {
    petRef.current?.triggerSigh();
    showStatus('Triggered sigh');
  }, [showStatus]);

  // Idle behaviors
  const handleIdleBehavior = useCallback((type: IdleBehaviorType) => {
    petRef.current?.triggerBehavior(type);
    showStatus(`Triggered ${type}`);
  }, [showStatus]);

  // Exploration behaviors
  const handleEdgeWander = useCallback((edge: 'left' | 'right' | 'top' | 'bottom') => {
    const exploration: ExplorationBehavior = { type: 'edgeWander', edge };
    petRef.current?.triggerExploration(exploration);
    showStatus(`Wandering to ${edge} edge`);
  }, [showStatus]);

  const handleEdgePeer = useCallback((edge: 'left' | 'right') => {
    const exploration: ExplorationBehavior = { type: 'edgePeer', edge };
    petRef.current?.triggerExploration(exploration);
    showStatus(`Peering ${edge}`);
  }, [showStatus]);

  const handleSpotInvestigate = useCallback(() => {
    const exploration: ExplorationBehavior = {
      type: 'spotInvestigate',
      target: { x: (Math.random() - 0.5) * 60, y: 15 + Math.random() * 15 },
    };
    petRef.current?.triggerExploration(exploration);
    showStatus('Investigating spot');
  }, [showStatus]);

  const handleFollowThing = useCallback(() => {
    // Generate a random path for eyes to follow
    const path: Array<{ x: number; y: number }> = [];
    let x = (Math.random() - 0.5) * 6;
    let y = (Math.random() - 0.5) * 3;
    for (let i = 0; i < 8; i++) {
      path.push({ x, y });
      x += (Math.random() - 0.5) * 4;
      y += (Math.random() - 0.5) * 2;
      x = Math.max(-5, Math.min(5, x));
      y = Math.max(-3, Math.min(3, y));
    }
    const exploration: ExplorationBehavior = { type: 'followThing', path };
    petRef.current?.triggerExploration(exploration);
    showStatus('Following imaginary thing');
  }, [showStatus]);

  const handleStartle = useCallback(() => {
    const exploration: ExplorationBehavior = { type: 'startle' };
    petRef.current?.triggerExploration(exploration);
    showStatus('Startled!');
  }, [showStatus]);

  const handleReach = useCallback(() => {
    const exploration: ExplorationBehavior = { type: 'reaching' };
    petRef.current?.triggerExploration(exploration);
    showStatus('Reaching up');
  }, [showStatus]);

  // Awareness
  const handleGlance = useCallback(() => {
    petRef.current?.triggerAwareness('glance');
    showStatus('Glancing');
  }, [showStatus]);

  const handleIgnore = useCallback(() => {
    petRef.current?.triggerAwareness('ignore');
    showStatus('Ignoring cursor (daydreaming)');
  }, [showStatus]);

  return (
    <div className="debug-behavior-tester">
      <div className="debug-behavior-pet" ref={containerRef}>
        <Pet
          ref={petRef}
          gameState="idle"
          isQuizActive={false}
          hunger={100}
          happiness={100}
        />
        {statusMessage && (
          <div className="debug-behavior-status">{statusMessage}</div>
        )}
      </div>

      <div className="debug-behavior-controls">
        <div className="debug-control-section">
          <label className="debug-control-label">Micro-Expressions</label>
          <div className="debug-action-buttons">
            <button onClick={() => handleBlink('double')} className="debug-action-btn">
              Double Blink
            </button>
            <button onClick={() => handleBlink('slow')} className="debug-action-btn">
              Slow Blink
            </button>
            <button onClick={handleSigh} className="debug-action-btn">
              Sigh
            </button>
          </div>
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">Idle Behaviors</label>
          <div className="debug-action-buttons">
            <button onClick={() => handleIdleBehavior('yawn')} className="debug-action-btn">
              Yawn
            </button>
            <button onClick={() => handleIdleBehavior('twitch')} className="debug-action-btn">
              Twitch
            </button>
            <button onClick={() => handleIdleBehavior('daydream')} className="debug-action-btn">
              Daydream
            </button>
          </div>
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">Exploration - Edge</label>
          <div className="debug-action-buttons">
            <button onClick={() => handleEdgeWander('left')} className="debug-action-btn">
              Edge Left
            </button>
            <button onClick={() => handleEdgeWander('right')} className="debug-action-btn">
              Edge Right
            </button>
            <button onClick={() => handleEdgeWander('top')} className="debug-action-btn">
              Edge Top
            </button>
            <button onClick={() => handleEdgeWander('bottom')} className="debug-action-btn">
              Edge Bottom
            </button>
          </div>
          <div className="debug-action-buttons" style={{ marginTop: '8px' }}>
            <button onClick={() => handleEdgePeer('left')} className="debug-action-btn">
              Peer Left
            </button>
            <button onClick={() => handleEdgePeer('right')} className="debug-action-btn">
              Peer Right
            </button>
          </div>
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">Exploration - Discovery</label>
          <div className="debug-action-buttons">
            <button onClick={handleSpotInvestigate} className="debug-action-btn">
              Investigate Spot
            </button>
            <button onClick={handleFollowThing} className="debug-action-btn">
              Follow Thing
            </button>
            <button onClick={handleStartle} className="debug-action-btn">
              Startle
            </button>
            <button onClick={handleReach} className="debug-action-btn">
              Reach Up
            </button>
          </div>
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">Awareness</label>
          <div className="debug-action-buttons">
            <button onClick={handleGlance} className="debug-action-btn">
              Glance at Cursor
            </button>
            <button onClick={handleIgnore} className="debug-action-btn">
              Ignore Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
