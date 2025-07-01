import { create } from 'zustand';
import type { Question, RaceSession, LeaderboardEntry } from '../lib/api';

export interface CarPosition {
  x: number;
  y: number;
  rotation: number;
  speed: number;
}

export interface BotCar {
  id: string;
  name: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Expert' | 'Master';
  position: CarPosition;
  color: number;
  progress: number; // 0-1, how far through the race
  hasFinished: boolean;
  aiPersonality: {
    aggressiveness: number; // 0-1
    accuracy: number; // 0-1, affects question answering
    consistency: number; // 0-1, affects speed variation
  };
}

export interface DifficultyCheckpoint {
  id: string;
  x: number;
  y: number;
  difficulty: number; // 1-10
  speedBoost: number; // multiplier
  color: number;
  completed: boolean;
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
  hasFinished: boolean;
  speedBoost: number; // Current speed multiplier from difficulty checkpoints
  
  // Bots and AI
  bots: BotCar[];
  difficultyCheckpoints: DifficultyCheckpoint[];
  
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
  setHasFinished: (finished: boolean) => void;
  setSpeedBoost: (boost: number) => void;
  setBots: (bots: BotCar[]) => void;
  updateBotPosition: (botId: string, position: Partial<CarPosition>) => void;
  setDifficultyCheckpoints: (checkpoints: DifficultyCheckpoint[]) => void;
  updateCheckpoint: (checkpointId: string, completed: boolean) => void;
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
  x: 200,
  y: 720, // Start at bottom of taller track
  rotation: 0,
  speed: 1, // Default speed to 1 (slow)
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
  hasFinished: false,
  speedBoost: 1.0,
  bots: [],
  difficultyCheckpoints: [],
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
  setHasFinished: (finished) => set({ hasFinished: finished }),
  setSpeedBoost: (boost) => set({ speedBoost: boost }),
  
  setBots: (bots) => set({ bots }),
  updateBotPosition: (botId, position) => set((state) => ({
    bots: state.bots.map(bot => 
      bot.id === botId 
        ? { ...bot, position: { ...bot.position, ...position } }
        : bot
    )
  })),
  
  setDifficultyCheckpoints: (checkpoints) => set({ difficultyCheckpoints: checkpoints }),
  updateCheckpoint: (checkpointId, completed) => set((state) => ({
    difficultyCheckpoints: state.difficultyCheckpoints.map(cp =>
      cp.id === checkpointId ? { ...cp, completed } : cp
    )
  })),
  
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
    hasFinished: false,
    speedBoost: 1.0,
    bots: [],
    difficultyCheckpoints: [],
    currentQuestion: null,
    isQuizActive: false,
    questionStartTime: 0,
    streak: 0,
    gameMode: 'racing',
  }),
})); 