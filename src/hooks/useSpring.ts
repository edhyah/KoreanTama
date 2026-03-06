import { useRef, useCallback } from 'react';

export interface SpringRef {
  value: number;
  target: number;
  velocity: number;
  stiffness: number;
  damping: number;
}

export interface SpringActions {
  update: () => number;
  impulse: (amount: number) => void;
  set: (value: number) => void;
  setTarget: (target: number) => void;
  getValue: () => number;
  getTarget: () => number;
}

export function useSpring(
  initialValue: number,
  stiffness: number = 0.15,
  damping: number = 0.7
): SpringActions {
  const springRef = useRef<SpringRef>({
    value: initialValue,
    target: initialValue,
    velocity: 0,
    stiffness,
    damping,
  });

  const update = useCallback((): number => {
    const s = springRef.current;
    const force = (s.target - s.value) * s.stiffness;
    s.velocity += force;
    s.velocity *= s.damping;
    s.value += s.velocity;
    return s.value;
  }, []);

  const impulse = useCallback((amount: number): void => {
    springRef.current.velocity += amount;
  }, []);

  const set = useCallback((value: number): void => {
    springRef.current.value = value;
    springRef.current.target = value;
    springRef.current.velocity = 0;
  }, []);

  const setTarget = useCallback((target: number): void => {
    springRef.current.target = target;
  }, []);

  const getValue = useCallback((): number => {
    return springRef.current.value;
  }, []);

  const getTarget = useCallback((): number => {
    return springRef.current.target;
  }, []);

  return { update, impulse, set, setTarget, getValue, getTarget };
}

// Class-based Spring for use in refs (when we need multiple springs managed together)
export class Spring {
  value: number;
  target: number;
  velocity: number;
  stiffness: number;
  damping: number;

  constructor(target: number, stiffness: number = 0.15, damping: number = 0.7) {
    this.value = target;
    this.target = target;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  update(): number {
    const force = (this.target - this.value) * this.stiffness;
    this.velocity += force;
    this.velocity *= this.damping;
    this.value += this.velocity;
    return this.value;
  }

  impulse(amount: number): void {
    this.velocity += amount;
  }

  set(value: number): void {
    this.value = value;
    this.target = value;
    this.velocity = 0;
  }
}
