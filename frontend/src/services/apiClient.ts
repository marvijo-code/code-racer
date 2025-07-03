export class ApiClient {
  private baseUrl: string;

  constructor() {
    // Use environment variable for API base URL, with fallback to localhost for development
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  }

  async getRandomQuestion(topic?: string, difficulty?: number): Promise<Question> {
    const url = new URL(`${this.baseUrl}/api/v1/questions/random`);
    
    if (topic) {
      url.searchParams.append('topic', topic);
    }
    
    if (difficulty) {
      url.searchParams.append('difficulty', difficulty.toString());
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Failed to fetch random question: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async submitAnswer(questionId: number, answer: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/api/v1/questions/${questionId}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answer }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit answer: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async getLeaderboard(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<LeaderboardEntry[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/leaderboard?period=${period}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async submitRaceResult(playerName: string, completionTime: number, correctAnswers: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/leaderboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerName,
        completionTime,
        correctAnswers,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit race result: ${response.status} ${response.statusText}`);
    }
  }
}

export interface Question {
  questionId: number;
  bodyMarkup: string;
  topic: string;
  difficulty: number;
  optionA: string;
  optionB: string;
  optionC: string;
  correctOption: string;
}

export interface LeaderboardEntry {
  playerName: string;
  bestTime: number;
  completedRaces: number;
  correctAnswers: number;
}

export const apiClient = new ApiClient(); 