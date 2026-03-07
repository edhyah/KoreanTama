import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { Pet, PetRef } from '../Pet';
import { useSpatialZones } from '../../hooks';
import type { BlinkType, IdleBehaviorType, ExplorationBehavior } from '../../hooks/useIdleAnimations';
import type { ZoneType, BehaviorConfidence } from '../../types';

export function BehaviorTester() {
  const petRef = useRef<PetRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Mood controls
  const [hunger, setHunger] = useState(100);
  const [happiness, setHappiness] = useState(100);

  // Zone visualization
  const [showZoneOverlay, setShowZoneOverlay] = useState(false);
  const [currentZone, setCurrentZone] = useState<ZoneType>('center');
  const [wanderPosition, setWanderPosition] = useState({ x: 0, y: 0 });

  // Behavior log
  const [behaviorLog, setBehaviorLog] = useState<string[]>([]);

  const spatialZones = useSpatialZones();

  // Calculate confidence
  const confidence = useMemo<BehaviorConfidence>(() => {
    return spatialZones.calculateConfidence(hunger, happiness);
  }, [hunger, happiness, spatialZones]);

  // Clear status message after delay
  useEffect(() => {
    if (statusMessage) {
      const timeout = setTimeout(() => setStatusMessage(''), 2000);
      return () => clearTimeout(timeout);
    }
  }, [statusMessage]);

  const showStatus = useCallback((msg: string) => {
    setStatusMessage(msg);
    setBehaviorLog(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${msg}`]);
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

  // New environmental behaviors
  const handleWallBounce = useCallback((edge: 'left' | 'right' | 'top' | 'bottom') => {
    const exploration: ExplorationBehavior = { type: 'wallBounce', edge };
    petRef.current?.triggerExploration(exploration);
    showStatus(`Wall bounce ${edge}`);
  }, [showStatus]);

  const handleCornerHide = useCallback((corner: 'tl' | 'tr' | 'bl' | 'br') => {
    const exploration: ExplorationBehavior = { type: 'cornerHide', corner };
    petRef.current?.triggerExploration(exploration);
    showStatus(`Hiding in corner ${corner.toUpperCase()}`);
  }, [showStatus]);

  const handleEdgePeek = useCallback((side: 'left' | 'right') => {
    const exploration: ExplorationBehavior = { type: 'edgePeek', edge: side };
    petRef.current?.triggerExploration(exploration);
    showStatus(`Edge peek ${side}`);
  }, [showStatus]);

  const handleWallClimb = useCallback((wall: 'left' | 'right', direction: 'up' | 'down') => {
    const exploration: ExplorationBehavior = { type: 'wallClimb', edge: wall, direction };
    petRef.current?.triggerExploration(exploration);
    showStatus(`Wall climb ${wall}-${direction}`);
  }, [showStatus]);

  const handleScreenTap = useCallback(() => {
    const exploration: ExplorationBehavior = {
      type: 'screenTap',
      target: {
        x: (Math.random() - 0.5) * 80,
        y: (Math.random() - 0.5) * 40,
      },
    };
    petRef.current?.triggerExploration(exploration);
    showStatus('Screen tap');
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

  // Mood presets
  const handleLowNeeds = useCallback(() => {
    setHunger(25);
    setHappiness(25);
    showStatus('Simulating low needs (timid)');
  }, [showStatus]);

  const handleHighNeeds = useCallback(() => {
    setHunger(90);
    setHappiness(90);
    showStatus('Simulating high needs (bold)');
  }, [showStatus]);

  // Zone click handler
  const handleZoneClick = useCallback((zone: ZoneType) => {
    const pos = spatialZones.getRandomPositionInZone(zone);
    petRef.current?.setWanderTarget(pos.x, pos.y);
    setWanderPosition(pos);
    setCurrentZone(zone);
    showStatus(`Moving to ${zone}`);
  }, [spatialZones, showStatus]);

  // Get zone color for visualization
  const getZoneColor = (zone: ZoneType): string => {
    if (zone === 'center') return 'rgba(0, 200, 0, 0.2)';
    if (zone.startsWith('edge-')) return 'rgba(200, 200, 0, 0.2)';
    if (zone.startsWith('corner-')) return 'rgba(255, 150, 0, 0.2)';
    if (zone.startsWith('offscreen-')) return 'rgba(255, 0, 0, 0.2)';
    return 'rgba(128, 128, 128, 0.2)';
  };

  return (
    <div className="debug-behavior-tester">
      {/* Main Pet Display with Zone Overlay */}
      <div className="debug-behavior-pet" ref={containerRef} style={{ position: 'relative' }}>
        {showZoneOverlay && (
          <div className="zone-overlay" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 10,
          }}>
            {/* Zone visualization */}
            {(['center', 'edge-left', 'edge-right', 'edge-top', 'edge-bottom',
              'corner-tl', 'corner-tr', 'corner-bl', 'corner-br'] as ZoneType[]).map(zone => {
              const bounds = spatialZones.getZoneBounds(zone);
              const containerWidth = 220;
              const containerHeight = 220;
              const centerX = containerWidth / 2;
              const centerY = containerHeight / 2;

              return (
                <div
                  key={zone}
                  onClick={() => handleZoneClick(zone)}
                  style={{
                    position: 'absolute',
                    left: centerX + bounds.minX,
                    top: centerY + bounds.minY,
                    width: bounds.maxX - bounds.minX,
                    height: bounds.maxY - bounds.minY,
                    backgroundColor: getZoneColor(zone),
                    border: currentZone === zone ? '2px solid #333' : '1px dashed #999',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    fontSize: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {zone.split('-').pop()}
                </div>
              );
            })}
          </div>
        )}

        <Pet
          ref={petRef}
          gameState="idle"
          isQuizActive={false}
          hunger={hunger}
          happiness={happiness}
        />
        {statusMessage && (
          <div className="debug-behavior-status">{statusMessage}</div>
        )}
      </div>

      {/* Controls Panel */}
      <div className="debug-behavior-controls" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Mood/Confidence Controls */}
        <div className="debug-control-section">
          <label className="debug-control-label">Mood / Confidence</label>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ width: '80px' }}>Hunger:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={hunger}
                onChange={(e) => setHunger(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ width: '30px' }}>{hunger}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ width: '80px' }}>Happiness:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={happiness}
                onChange={(e) => setHappiness(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ width: '30px' }}>{happiness}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Confidence: <strong style={{
                color: confidence.level === 'bold' ? '#4a4' :
                       confidence.level === 'timid' ? '#a44' :
                       confidence.level === 'cautious' ? '#a84' : '#666'
              }}>{confidence.level}</strong>
              {' | '}Freq: {confidence.explorationFrequency.toFixed(1)}x
              {' | '}Range: {confidence.movementRange.toFixed(1)}x
            </div>
          </div>
          <div className="debug-action-buttons">
            <button onClick={handleLowNeeds} className="debug-action-btn">
              Low Needs
            </button>
            <button onClick={handleHighNeeds} className="debug-action-btn">
              High Needs
            </button>
          </div>
        </div>

        {/* Zone Visualization */}
        <div className="debug-control-section">
          <label className="debug-control-label">Spatial Zones</label>
          <div className="debug-action-buttons">
            <button
              onClick={() => setShowZoneOverlay(!showZoneOverlay)}
              className="debug-action-btn"
              style={{ backgroundColor: showZoneOverlay ? '#4CAF50' : undefined }}
            >
              {showZoneOverlay ? 'Hide' : 'Show'} Zones
            </button>
            <button onClick={() => petRef.current?.resetWander()} className="debug-action-btn">
              Reset Position
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
            Current: {currentZone} | Pos: ({wanderPosition.x.toFixed(0)}, {wanderPosition.y.toFixed(0)})
          </div>
        </div>

        {/* Micro-Expressions */}
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

        {/* Idle Behaviors */}
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

        {/* Original Exploration */}
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

        {/* Original Discovery */}
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

        {/* NEW: Environmental Behaviors */}
        <div className="debug-control-section">
          <label className="debug-control-label">Environmental - Wall Bounce</label>
          <div className="debug-action-buttons">
            <button onClick={() => handleWallBounce('left')} className="debug-action-btn">
              Left
            </button>
            <button onClick={() => handleWallBounce('right')} className="debug-action-btn">
              Right
            </button>
            <button onClick={() => handleWallBounce('top')} className="debug-action-btn">
              Top
            </button>
            <button onClick={() => handleWallBounce('bottom')} className="debug-action-btn">
              Bottom
            </button>
          </div>
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">Environmental - Corner Hide</label>
          <div className="debug-action-buttons">
            <button onClick={() => handleCornerHide('tl')} className="debug-action-btn">
              TL
            </button>
            <button onClick={() => handleCornerHide('tr')} className="debug-action-btn">
              TR
            </button>
            <button onClick={() => handleCornerHide('bl')} className="debug-action-btn">
              BL
            </button>
            <button onClick={() => handleCornerHide('br')} className="debug-action-btn">
              BR
            </button>
          </div>
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">Environmental - Edge Peek</label>
          <div className="debug-action-buttons">
            <button onClick={() => handleEdgePeek('left')} className="debug-action-btn">
              Peek Left
            </button>
            <button onClick={() => handleEdgePeek('right')} className="debug-action-btn">
              Peek Right
            </button>
          </div>
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">Environmental - Wall Climb</label>
          <div className="debug-action-buttons">
            <button onClick={() => handleWallClimb('left', 'up')} className="debug-action-btn">
              L-Up
            </button>
            <button onClick={() => handleWallClimb('left', 'down')} className="debug-action-btn">
              L-Down
            </button>
            <button onClick={() => handleWallClimb('right', 'up')} className="debug-action-btn">
              R-Up
            </button>
            <button onClick={() => handleWallClimb('right', 'down')} className="debug-action-btn">
              R-Down
            </button>
          </div>
        </div>

        <div className="debug-control-section">
          <label className="debug-control-label">Environmental - Screen Tap</label>
          <div className="debug-action-buttons">
            <button onClick={handleScreenTap} className="debug-action-btn">
              Random Tap
            </button>
          </div>
        </div>

        {/* Awareness */}
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

        {/* Behavior Log */}
        <div className="debug-control-section">
          <label className="debug-control-label">Behavior Log</label>
          <div style={{
            fontSize: '10px',
            fontFamily: 'monospace',
            maxHeight: '100px',
            overflowY: 'auto',
            backgroundColor: '#f5f5f5',
            padding: '4px',
            borderRadius: '4px',
          }}>
            {behaviorLog.length === 0 ? (
              <div style={{ color: '#999' }}>No behaviors triggered yet</div>
            ) : (
              behaviorLog.map((log, i) => (
                <div key={i} style={{ whiteSpace: 'nowrap' }}>{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
