export type ZoneType =
  | 'center'
  | 'edge-left'
  | 'edge-right'
  | 'edge-top'
  | 'edge-bottom'
  | 'corner-tl'
  | 'corner-tr'
  | 'corner-bl'
  | 'corner-br'
  | 'offscreen-left'
  | 'offscreen-right';

export interface SpatialConfig {
  maxWanderX: number;
  maxWanderY: number;
  offscreenX: number;
  edgeThreshold: number;
  cornerSize: number;
}

export const DEFAULT_SPATIAL_CONFIG: SpatialConfig = {
  maxWanderX: 120,   // Expand from previous 80
  maxWanderY: 60,    // Expand from previous 40
  offscreenX: 150,   // Partially visible at edges
  edgeThreshold: 40, // Distance from center to be considered "at edge"
  cornerSize: 30,    // Size of corner zones
};

export interface ZoneBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface BehaviorConfidence {
  level: 'bold' | 'normal' | 'cautious' | 'timid';
  explorationFrequency: number;  // Multiplier for delay (lower = more frequent)
  movementRange: number;         // Multiplier for wander bounds
  favorCorners: boolean;
  preferCenter: boolean;
}
