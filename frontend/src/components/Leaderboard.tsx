import React, { useEffect, useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { apiClient } from '../lib/api';
import type { LeaderboardEntry } from '../lib/api';

export const Leaderboard: React.FC = () => {
  const { leaderboard, setLeaderboard } = useGameStore();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('daily');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedPeriod]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await apiClient.getLeaderboard(selectedPeriod);
      setLeaderboard(data);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Leaderboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timeMs: number): string => {
    const seconds = timeMs / 1000;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(2);
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.padStart(5, '0')}`;
    }
    return `${remainingSeconds}s`;
  };

  const getRankEmoji = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h2>🏆 Leaderboard</h2>
        <div className="period-selector">
          {['daily', 'weekly', 'monthly', 'all-time'].map(period => (
            <button
              key={period}
              className={`period-button ${selectedPeriod === period ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="leaderboard-content">
        {isLoading ? (
          <div className="loading">Loading leaderboard...</div>
        ) : error ? (
          <div className="error">
            <p>{error}</p>
            <button onClick={loadLeaderboard}>Retry</button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="empty">
            <p>No races completed yet!</p>
            <p>Be the first to complete a race and claim the top spot! 🏁</p>
          </div>
        ) : (
          <div className="leaderboard-list">
            <div className="leaderboard-headers">
              <div className="rank-header">Rank</div>
              <div className="name-header">Player</div>
              <div className="time-header">Best Time</div>
              <div className="races-header">Races</div>
            </div>
            
            {leaderboard.map((entry, index) => (
              <div key={entry.userId || index} className="leaderboard-entry">
                <div className="rank">
                  {getRankEmoji(index + 1)}
                </div>
                <div className="player-name">
                  {entry.displayName || 'Anonymous Racer'}
                </div>
                <div className="best-time">
                  {formatTime(entry.bestTime)}
                </div>
                <div className="completed-races">
                  {entry.completedRaces}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="leaderboard-footer">
        <button onClick={loadLeaderboard} disabled={isLoading}>
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}; 