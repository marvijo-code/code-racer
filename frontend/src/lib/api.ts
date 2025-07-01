const API_BASE_URL = 'http://localhost:8080/api/v1';

export interface Question {
  questionId: number;
  topic: string;
  difficulty: number;
  bodyMarkup: string;
  options: {
    A: string;
    B: string;
    C: string;
  };
  correctOption: 'A' | 'B' | 'C';
  timeLimit: number;
}

export interface RaceSession {
  sessionId: number;
  userId?: string;
  startUtc: string;
  endUtc?: string;
  finalTimeMs?: number;
  livesUsed: number;
  isCompleted: boolean;
}

export interface LeaderboardEntry {
  userId?: string;
  displayName?: string;
  bestTime: number;
  completedRaces: number;
}

export interface SubmitAnswerRequest {
  questionId: number;
  userAnswer: string;
  responseMs: number;
}

export interface CompleteSessionRequest {
  finalTimeMs: number;
}

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Sessions API
  async startSession(): Promise<RaceSession> {
    return this.request<RaceSession>('/sessions', {
      method: 'POST',
    });
  }

  async getSession(id: number): Promise<RaceSession> {
    return this.request<RaceSession>(`/sessions/${id}`);
  }

  async submitAnswer(sessionId: number, answer: SubmitAnswerRequest): Promise<{ isCorrect: boolean; livesUsed: number }> {
    return this.request<{ isCorrect: boolean; livesUsed: number }>(`/sessions/${sessionId}/answer`, {
      method: 'PATCH',
      body: JSON.stringify(answer),
    });
  }

  async completeSession(sessionId: number, request: CompleteSessionRequest): Promise<void> {
    return this.request<void>(`/sessions/${sessionId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  // Questions API
  async getRandomQuestion(topic?: string, difficulty?: number): Promise<Question> {
    const params = new URLSearchParams();
    if (topic) params.append('topic', topic);
    if (difficulty) params.append('difficulty', difficulty.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Question>(`/questions/random${query}`);
  }

  async getTopics(): Promise<string[]> {
    return this.request<string[]>('/questions/topics');
  }

  // Leaderboard API
  async getLeaderboard(period: string = 'daily'): Promise<LeaderboardEntry[]> {
    return this.request<LeaderboardEntry[]>(`/leaderboard?period=${period}`);
  }
}

export const apiClient = new ApiClient(); 