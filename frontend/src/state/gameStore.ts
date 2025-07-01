import { create } from 'zustand';
import type { Question, RaceSession, LeaderboardEntry } from '../lib/api';

export interface CarPosition {
  x: number;
  y: number;
  rotation: number;
  speed: number;
}

export interface GameState {
  // Session management
  currentSession: RaceSession | null;
  isLoading: boolean;
  error: string | null;
  
  // Race state
  carPosition: CarPosition;
  lapTime: number;
  isRacing: boolean;
  isPaused: boolean;
  lives: number;
  maxLives: number;
  
  // Quiz state
  currentQuestion: Question | null;
  isQuizActive: boolean;
  questionStartTime: number;
  streak: number;
  
  // Leaderboard
  leaderboard: LeaderboardEntry[];
  
  // Game mode
  gameMode: 'racing' | 'spectating' | 'finished';
  
  // Actions
  setSession: (session: RaceSession | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateCarPosition: (position: Partial<CarPosition>) => void;
  setRacing: (racing: boolean) => void;
  setPaused: (paused: boolean) => void;
  setLives: (lives: number) => void;
  setCurrentQuestion: (question: Question | null) => void;
  setQuizActive: (active: boolean) => void;
  setQuestionStartTime: (time: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  setGameMode: (mode: 'racing' | 'spectating' | 'finished') => void;
  updateLapTime: (time: number) => void;
  resetGame: () => void;
}

const initialCarPosition: CarPosition = {
  x: 100,
  y: 300,
  rotation: 0,
  speed: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  currentSession: null,
  isLoading: false,
  error: null,
  carPosition: initialCarPosition,
  lapTime: 0,
  isRacing: false,
  isPaused: false,
  lives: 3,
  maxLives: 3,
  currentQuestion: null,
  isQuizActive: false,
  questionStartTime: 0,
  streak: 0,
  leaderboard: [],
  gameMode: 'racing',
  
  // Actions
  setSession: (session) => set({ currentSession: session }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  updateCarPosition: (position) => set((state) => ({
    carPosition: { ...state.carPosition, ...position }
  })),
  
  setRacing: (racing) => set({ isRacing: racing }),
  setPaused: (paused) => set({ isPaused: paused }),
  setLives: (lives) => set({ lives }),
  
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  setQuizActive: (active) => set({ isQuizActive: active }),
  setQuestionStartTime: (time) => set({ questionStartTime: time }),
  
  incrementStreak: () => set((state) => ({ streak: state.streak + 1 })),
  resetStreak: () => set({ streak: 0 }),
  
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setGameMode: (mode) => set({ gameMode: mode }),
  updateLapTime: (time) => set({ lapTime: time }),
  
  resetGame: () => set({
    currentSession: null,
    error: null,
    carPosition: initialCarPosition,
    lapTime: 0,
    isRacing: false,
    isPaused: false,
    lives: 3,
    currentQuestion: null,
    isQuizActive: false,
    questionStartTime: 0,
    streak: 0,
    gameMode: 'racing',
  }),
})); 