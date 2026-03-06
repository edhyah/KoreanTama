import { useReducer, useCallback, useRef, useEffect } from 'react';
import type { GameStateName, WanderState, QuizFrequency } from '../types';
import {
  HUNGER_PER_TICK,
  HAPPINESS_PER_TICK,
  TICK_INTERVAL,
  QUIZ_FREQUENCY_INTERVALS,
} from '../constants';

export interface GameState {
  gameState: GameStateName;
  awake: boolean;
  hunger: number;
  happiness: number;
  dailyGoalMet: boolean;
  foodMenuOpen: boolean;
  wanderState: WanderState;
  wanderTarget: { x: number; y: number };
  quizFrequency: QuizFrequency;
}

type GameAction =
  | { type: 'WAKE_UP' }
  | { type: 'SET_STATE'; state: GameStateName }
  | { type: 'SET_HUNGER'; value: number }
  | { type: 'SET_HAPPINESS'; value: number }
  | { type: 'TICK_DECAY'; dailyGoalMet: boolean }
  | { type: 'FEED'; amount: number }
  | { type: 'BOOST_HAPPINESS'; amount: number }
  | { type: 'SET_FOOD_MENU_OPEN'; open: boolean }
  | { type: 'SET_DAILY_GOAL_MET'; met: boolean }
  | { type: 'SET_WANDER_STATE'; state: WanderState; target?: { x: number; y: number } }
  | { type: 'SET_QUIZ_FREQUENCY'; frequency: QuizFrequency }
  | { type: 'RESET_WANDER' };

const initialState: GameState = {
  gameState: 'sleeping',
  awake: false,
  hunger: 100,
  happiness: 100,
  dailyGoalMet: false,
  foodMenuOpen: false,
  wanderState: 'resting',
  wanderTarget: { x: 0, y: 0 },
  quizFrequency: 'normal',
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'WAKE_UP':
      return { ...state, awake: true, gameState: 'waking' };

    case 'SET_STATE':
      return { ...state, gameState: action.state };

    case 'SET_HUNGER':
      return { ...state, hunger: Math.max(0, Math.min(100, action.value)) };

    case 'SET_HAPPINESS':
      return { ...state, happiness: Math.max(0, Math.min(100, action.value)) };

    case 'TICK_DECAY': {
      const hungerRate = action.dailyGoalMet ? HUNGER_PER_TICK * 0.5 : HUNGER_PER_TICK;
      const happinessRate = action.dailyGoalMet ? HAPPINESS_PER_TICK * 0.5 : HAPPINESS_PER_TICK;
      return {
        ...state,
        hunger: Math.max(0, state.hunger - hungerRate),
        happiness: Math.max(0, state.happiness - happinessRate),
      };
    }

    case 'FEED':
      return { ...state, hunger: Math.min(100, state.hunger + action.amount) };

    case 'BOOST_HAPPINESS':
      return { ...state, happiness: Math.min(100, state.happiness + action.amount) };

    case 'SET_FOOD_MENU_OPEN':
      return { ...state, foodMenuOpen: action.open };

    case 'SET_DAILY_GOAL_MET':
      return { ...state, dailyGoalMet: action.met };

    case 'SET_WANDER_STATE':
      return {
        ...state,
        wanderState: action.state,
        wanderTarget: action.target || state.wanderTarget,
      };

    case 'SET_QUIZ_FREQUENCY':
      return { ...state, quizFrequency: action.frequency };

    case 'RESET_WANDER':
      return { ...state, wanderState: 'resting', wanderTarget: { x: 0, y: 0 } };

    default:
      return state;
  }
}

export interface UseGameStateProps {
  initialAwake?: boolean;
  initialDailyGoalMet?: boolean;
}

export function useGameState({ initialAwake = false, initialDailyGoalMet = false }: UseGameStateProps = {}) {
  const [state, dispatch] = useReducer(gameReducer, {
    ...initialState,
    awake: initialAwake,
    gameState: initialAwake ? 'idle' : 'sleeping',
    dailyGoalMet: initialDailyGoalMet,
  });

  const timersRef = useRef<{
    walkTimer: number | null;
    flyTimer: number | null;
    discoveryTimer: number | null;
    decayInterval: number | null;
    lastRandomQuizTime: number;
    nextRandomQuizDelay: number;
  }>({
    walkTimer: null,
    flyTimer: null,
    discoveryTimer: null,
    decayInterval: null,
    lastRandomQuizTime: performance.now(),
    nextRandomQuizDelay: 30000,
  });

  const wanderStartTimeRef = useRef(performance.now());

  // Decay interval
  useEffect(() => {
    if (!state.awake) return;

    timersRef.current.decayInterval = window.setInterval(() => {
      dispatch({ type: 'TICK_DECAY', dailyGoalMet: state.dailyGoalMet });
    }, TICK_INTERVAL);

    return () => {
      if (timersRef.current.decayInterval) {
        clearInterval(timersRef.current.decayInterval);
      }
    };
  }, [state.awake, state.dailyGoalMet]);

  const wakeUp = useCallback(() => {
    dispatch({ type: 'WAKE_UP' });
    timersRef.current.lastRandomQuizTime = performance.now();
    const freq = QUIZ_FREQUENCY_INTERVALS[state.quizFrequency];
    timersRef.current.nextRandomQuizDelay = freq.min + Math.random() * (freq.max - freq.min);
  }, [state.quizFrequency]);

  const setGameState = useCallback((newState: GameStateName) => {
    dispatch({ type: 'SET_STATE', state: newState });
    if (newState !== 'idle') {
      dispatch({ type: 'RESET_WANDER' });
    }
  }, []);

  const feed = useCallback((amount: number = 100) => {
    dispatch({ type: 'FEED', amount });
  }, []);

  const boostHappiness = useCallback((amount: number) => {
    dispatch({ type: 'BOOST_HAPPINESS', amount });
  }, []);

  const setHunger = useCallback((value: number) => {
    dispatch({ type: 'SET_HUNGER', value });
  }, []);

  const setHappiness = useCallback((value: number) => {
    dispatch({ type: 'SET_HAPPINESS', value });
  }, []);

  const setFoodMenuOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_FOOD_MENU_OPEN', open });
  }, []);

  const setDailyGoalMet = useCallback((met: boolean) => {
    dispatch({ type: 'SET_DAILY_GOAL_MET', met });
  }, []);

  const setQuizFrequency = useCallback((frequency: QuizFrequency) => {
    dispatch({ type: 'SET_QUIZ_FREQUENCY', frequency });
    timersRef.current.lastRandomQuizTime = performance.now();
    const freq = QUIZ_FREQUENCY_INTERVALS[frequency];
    timersRef.current.nextRandomQuizDelay = freq.min + Math.random() * (freq.max - freq.min);
  }, []);

  const decideDefaultState = useCallback(() => {
    if (state.hunger < 40) {
      setGameState('hungry');
    } else if (state.happiness < 40) {
      setGameState('bored');
    } else {
      setGameState('idle');
    }
  }, [state.hunger, state.happiness, setGameState]);

  const shouldTriggerRandomQuiz = useCallback((): boolean => {
    if (!state.awake || state.quizFrequency === 'off') return false;
    if (state.gameState !== 'idle') return false;
    if (state.hunger < 40) return false;

    const now = performance.now();
    if (now - timersRef.current.lastRandomQuizTime > timersRef.current.nextRandomQuizDelay) {
      timersRef.current.lastRandomQuizTime = now;
      const freq = QUIZ_FREQUENCY_INTERVALS[state.quizFrequency];
      timersRef.current.nextRandomQuizDelay = freq.min + Math.random() * (freq.max - freq.min);
      return true;
    }
    return false;
  }, [state.awake, state.gameState, state.hunger, state.quizFrequency]);

  const startWandering = useCallback(() => {
    if (state.wanderState === 'resting') {
      dispatch({ type: 'SET_WANDER_STATE', state: 'curious' });
      wanderStartTimeRef.current = performance.now();
    }
  }, [state.wanderState]);

  const updateWandering = useCallback((): { x: number; y: number } | null => {
    if (state.gameState !== 'idle') return null;

    const now = performance.now();
    const stateTime = now - wanderStartTimeRef.current;

    switch (state.wanderState) {
      case 'resting':
        // Occasionally decide to explore
        if (stateTime > 8000 && Math.random() < 0.003) {
          dispatch({ type: 'SET_WANDER_STATE', state: 'curious' });
          wanderStartTimeRef.current = now;
        }
        return null;

      case 'curious':
        // Look around briefly, then pick destination
        if (stateTime > 1500) {
          const maxX = 80;
          const maxY = 40;
          const target = {
            x: (Math.random() - 0.5) * maxX * 2,
            y: (Math.random() - 0.3) * maxY,
          };
          dispatch({ type: 'SET_WANDER_STATE', state: 'walking', target });
          wanderStartTimeRef.current = now;
          return target;
        }
        return null;

      case 'walking':
        // Check if arrived or timeout
        if (stateTime > 4000) {
          dispatch({ type: 'SET_WANDER_STATE', state: 'investigating' });
          wanderStartTimeRef.current = now;
        }
        return state.wanderTarget;

      case 'investigating':
        // Pause and look around
        if (stateTime > 2000 + Math.random() * 1500) {
          dispatch({ type: 'SET_WANDER_STATE', state: 'resting', target: { x: 0, y: 0 } });
          wanderStartTimeRef.current = now;
          return { x: 0, y: 0 };
        }
        return state.wanderTarget;

      default:
        return null;
    }
  }, [state.gameState, state.wanderState, state.wanderTarget]);

  return {
    state,
    wakeUp,
    setGameState,
    feed,
    boostHappiness,
    setHunger,
    setHappiness,
    setFoodMenuOpen,
    setDailyGoalMet,
    setQuizFrequency,
    decideDefaultState,
    shouldTriggerRandomQuiz,
    startWandering,
    updateWandering,
  };
}
