import { useCallback, useMemo } from 'react';
import type { ZoneType, SpatialConfig, ZoneBounds, BehaviorConfidence } from '../types/spatial';
import { DEFAULT_SPATIAL_CONFIG } from '../types/spatial';

export function useSpatialZones(config: Partial<SpatialConfig> = {}) {
  const spatialConfig = useMemo<SpatialConfig>(() => ({
    ...DEFAULT_SPATIAL_CONFIG,
    ...config,
  }), [config]);

  /**
   * Determine which zone a position falls into
   */
  const getCurrentZone = useCallback((x: number, y: number): ZoneType => {
    const { maxWanderY, edgeThreshold, cornerSize, offscreenX } = spatialConfig;

    // Check offscreen first
    if (x < -offscreenX + 20) return 'offscreen-left';
    if (x > offscreenX - 20) return 'offscreen-right';

    // Check corners
    const isLeft = x < -edgeThreshold;
    const isRight = x > edgeThreshold;
    const isTop = y < -maxWanderY + cornerSize;
    const isBottom = y > maxWanderY - cornerSize;

    if (isLeft && isTop) return 'corner-tl';
    if (isRight && isTop) return 'corner-tr';
    if (isLeft && isBottom) return 'corner-bl';
    if (isRight && isBottom) return 'corner-br';

    // Check edges
    if (x < -edgeThreshold) return 'edge-left';
    if (x > edgeThreshold) return 'edge-right';
    if (y < -maxWanderY + cornerSize) return 'edge-top';
    if (y > maxWanderY - cornerSize) return 'edge-bottom';

    return 'center';
  }, [spatialConfig]);

  /**
   * Get the bounds for a specific zone
   */
  const getZoneBounds = useCallback((zone: ZoneType): ZoneBounds => {
    const { maxWanderX, maxWanderY, edgeThreshold, cornerSize, offscreenX } = spatialConfig;

    switch (zone) {
      case 'center':
        return {
          minX: -edgeThreshold,
          maxX: edgeThreshold,
          minY: -maxWanderY + cornerSize,
          maxY: maxWanderY - cornerSize,
        };

      case 'edge-left':
        return {
          minX: -maxWanderX,
          maxX: -edgeThreshold,
          minY: -maxWanderY + cornerSize,
          maxY: maxWanderY - cornerSize,
        };

      case 'edge-right':
        return {
          minX: edgeThreshold,
          maxX: maxWanderX,
          minY: -maxWanderY + cornerSize,
          maxY: maxWanderY - cornerSize,
        };

      case 'edge-top':
        return {
          minX: -edgeThreshold,
          maxX: edgeThreshold,
          minY: -maxWanderY,
          maxY: -maxWanderY + cornerSize,
        };

      case 'edge-bottom':
        return {
          minX: -edgeThreshold,
          maxX: edgeThreshold,
          minY: maxWanderY - cornerSize,
          maxY: maxWanderY,
        };

      case 'corner-tl':
        return {
          minX: -maxWanderX,
          maxX: -edgeThreshold,
          minY: -maxWanderY,
          maxY: -maxWanderY + cornerSize,
        };

      case 'corner-tr':
        return {
          minX: edgeThreshold,
          maxX: maxWanderX,
          minY: -maxWanderY,
          maxY: -maxWanderY + cornerSize,
        };

      case 'corner-bl':
        return {
          minX: -maxWanderX,
          maxX: -edgeThreshold,
          minY: maxWanderY - cornerSize,
          maxY: maxWanderY,
        };

      case 'corner-br':
        return {
          minX: edgeThreshold,
          maxX: maxWanderX,
          minY: maxWanderY - cornerSize,
          maxY: maxWanderY,
        };

      case 'offscreen-left':
        return {
          minX: -offscreenX,
          maxX: -maxWanderX,
          minY: -maxWanderY / 2,
          maxY: maxWanderY / 2,
        };

      case 'offscreen-right':
        return {
          minX: maxWanderX,
          maxX: offscreenX,
          minY: -maxWanderY / 2,
          maxY: maxWanderY / 2,
        };

      default:
        return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }
  }, [spatialConfig]);

  /**
   * Get a random position within a zone
   */
  const getRandomPositionInZone = useCallback((zone: ZoneType): { x: number; y: number } => {
    const bounds = getZoneBounds(zone);
    return {
      x: bounds.minX + Math.random() * (bounds.maxX - bounds.minX),
      y: bounds.minY + Math.random() * (bounds.maxY - bounds.minY),
    };
  }, [getZoneBounds]);

  /**
   * Get position at edge (for edge wander behaviors)
   */
  const getEdgePosition = useCallback((edge: 'left' | 'right' | 'top' | 'bottom'): { x: number; y: number } => {
    const { maxWanderX, maxWanderY } = spatialConfig;

    switch (edge) {
      case 'left':
        return { x: -maxWanderX * 0.9, y: 0 };
      case 'right':
        return { x: maxWanderX * 0.9, y: 0 };
      case 'top':
        return { x: 0, y: -maxWanderY * 0.8 };
      case 'bottom':
        return { x: 0, y: maxWanderY * 0.6 };
      default:
        return { x: 0, y: 0 };
    }
  }, [spatialConfig]);

  /**
   * Get position for corner hide behavior
   */
  const getCornerPosition = useCallback((corner: 'tl' | 'tr' | 'bl' | 'br'): { x: number; y: number } => {
    const { maxWanderX, maxWanderY } = spatialConfig;

    switch (corner) {
      case 'tl':
        return { x: -maxWanderX * 0.85, y: -maxWanderY * 0.7 };
      case 'tr':
        return { x: maxWanderX * 0.85, y: -maxWanderY * 0.7 };
      case 'bl':
        return { x: -maxWanderX * 0.85, y: maxWanderY * 0.5 };
      case 'br':
        return { x: maxWanderX * 0.85, y: maxWanderY * 0.5 };
      default:
        return { x: 0, y: 0 };
    }
  }, [spatialConfig]);

  /**
   * Get offscreen position for edge peek behavior
   */
  const getOffscreenPosition = useCallback((side: 'left' | 'right'): { x: number; y: number } => {
    const { offscreenX } = spatialConfig;

    return {
      x: side === 'left' ? -offscreenX * 0.9 : offscreenX * 0.9,
      y: 0,
    };
  }, [spatialConfig]);

  /**
   * Get wall climb path positions
   */
  const getWallClimbPath = useCallback((wall: 'left' | 'right', direction: 'up' | 'down'): Array<{ x: number; y: number }> => {
    const { maxWanderX, maxWanderY } = spatialConfig;
    const wallX = wall === 'left' ? -maxWanderX * 0.85 : maxWanderX * 0.85;
    const points: Array<{ x: number; y: number }> = [];

    const startY = direction === 'up' ? maxWanderY * 0.4 : -maxWanderY * 0.5;
    const endY = direction === 'up' ? -maxWanderY * 0.5 : maxWanderY * 0.4;
    const steps = 6;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = startY + (endY - startY) * t;
      // Add small oscillation for climbing effect
      const xOscillation = Math.sin(t * Math.PI * 2) * 5;
      points.push({ x: wallX + xOscillation, y });
    }

    return points;
  }, [spatialConfig]);

  /**
   * Calculate confidence level based on hunger and happiness
   */
  const calculateConfidence = useCallback((hunger: number, happiness: number): BehaviorConfidence => {
    // Bold: well-fed and happy
    if (hunger > 70 && happiness > 70) {
      return {
        level: 'bold',
        explorationFrequency: 0.6,  // More frequent exploration
        movementRange: 1.3,         // Wider movement range
        favorCorners: false,
        preferCenter: false,
      };
    }

    // Normal: average needs
    const average = (hunger + happiness) / 2;
    if (average >= 55) {
      return {
        level: 'normal',
        explorationFrequency: 1.0,
        movementRange: 1.0,
        favorCorners: false,
        preferCenter: false,
      };
    }

    // Cautious: lower needs
    if (average >= 40) {
      return {
        level: 'cautious',
        explorationFrequency: 1.5,   // Less frequent
        movementRange: 0.7,          // Smaller range
        favorCorners: false,
        preferCenter: true,          // Stay closer to center
      };
    }

    // Timid: poor condition
    return {
      level: 'timid',
      explorationFrequency: 2.5,     // Much less frequent
      movementRange: 0.4,            // Very limited range
      favorCorners: true,            // Hide in corners
      preferCenter: false,
    };
  }, []);

  return {
    config: spatialConfig,
    getCurrentZone,
    getZoneBounds,
    getRandomPositionInZone,
    getEdgePosition,
    getCornerPosition,
    getOffscreenPosition,
    getWallClimbPath,
    calculateConfidence,
  };
}
