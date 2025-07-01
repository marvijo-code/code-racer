import React, { useEffect, useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { apiClient } from '../lib/api';
import { RaceTrack } from './RaceTrack';
import { QuizOverlay } from './QuizOverlay';
import { Leaderboard } from './Leaderboard';
import { ToastContainer } from './Toast';

export const Game: React.FC = () => {
  const {
    currentSession,
    setSession,
    setLoading,
    setError,
    isLoading,
    error,
    setRacing,
    isRacing,
    gameMode,
    setGameMode,
    lapTime,
    updateLapTime,
    lives,
    resetGame,
    hasFinished,
    speedBoost,
    bots,
    toasts,
    removeToast
  } = useGameStore();

  const [startTime, setStartTime] = useState<number>(0);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  useEffect(() => {
    // Update lap time every 100ms when racing
    if (isRacing && startTime > 0) {
      const timer = setInterval(() => {
        const currentTime = Date.now() - startTime;
        updateLapTime(currentTime);
      }, 100);

      return () => clearInterval(timer);
    }
  }, [isRacing, startTime, updateLapTime]);

  const startNewRace = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const session = await apiClient.startSession();
      setSession(session);
      setRacing(true);
      setGameMode('racing');
      setStartTime(Date.now());
    } catch (err) {
      setError('Failed to start race session');
      console.error('Start race error:', err);
    } finally {
      setLoading(false);
    }
  };

  const finishRace = async () => {
    if (!currentSession || !isRacing) return;

    setLoading(true);
    
    try {
      await apiClient.completeSession(currentSession.sessionId, {
        finalTimeMs: lapTime
      });
      
      setRacing(false);
      setGameMode('finished');
      setShowLeaderboard(true);
    } catch (err) {
      setError('Failed to complete race');
      console.error('Finish race error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    resetGame();
    setShowLeaderboard(false);
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

  if (showLeaderboard) {
    return (
      <div className="game-container">
        <div className="game-header">
          <h1>🏁 Code Racer</h1>
          <div className="final-results">
            <h2>Race Complete!</h2>
            <p>Your time: {formatTime(lapTime)}</p>
            <p>Max speed boost achieved: {speedBoost.toFixed(1)}x</p>
            
            <div className="final-bot-standings">
              <h3>Final Bot Standings:</h3>
              {bots
                .sort((a, b) => b.progress - a.progress)
                .map((bot, index) => (
                  <div key={bot.id} style={{color: `#${bot.color.toString(16).padStart(6, '0')}`}}>
                    {index + 1}. {bot.name} ({bot.skillLevel}) - {(bot.progress * 100).toFixed(1)}% complete
                  </div>
                ))
              }
            </div>
            
            <button onClick={handleRestart} className="restart-button">
              🔄 Race Again
            </button>
          </div>
        </div>
        <Leaderboard />
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>🏁 Code Racer</h1>
        <div className="game-stats">
          <div className="lap-time">
            ⏱️ Time: {formatTime(lapTime)}
          </div>
          <div className="lives-display">
            ❤️ Lives: {3 - lives}/3
          </div>
          <div className="speed-boost-display">
            ⚡ Speed: {speedBoost.toFixed(1)}x
          </div>
          <div className="bot-count">
            🤖 Bots: {bots.length}
          </div>
          <div className="game-mode">
            {gameMode === 'racing' && (hasFinished ? '🏁 Finished!' : '🏎️ Racing')}
            {gameMode === 'spectating' && '👁️ Spectating'}
            {gameMode === 'finished' && '🏁 Race Complete!'}
          </div>
        </div>
        
        {!currentSession && (
          <div className="start-section">
            <p>Test your software engineering knowledge while racing!</p>
            <button 
              onClick={startNewRace} 
              disabled={isLoading}
              className="start-race-button"
            >
              {isLoading ? 'Starting...' : '🚀 Start Race'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {currentSession && gameMode === 'racing' && (
        <>
          <RaceTrack width={900} height={800} />
          <div className="race-controls">
            <button onClick={finishRace} className="finish-button">
              🏁 Finish Race
            </button>
            <button onClick={() => setShowLeaderboard(true)} className="leaderboard-button">
              🏆 View Leaderboard
            </button>
          </div>
        </>
      )}

      {gameMode === 'spectating' && (
        <div className="spectator-mode">
          <h2>👁️ Spectator Mode</h2>
          <p>You've run out of lives! Watch the AI complete the race.</p>
          <div className="spectator-controls">
            <button onClick={handleRestart} className="restart-button">
              🔄 Try Again
            </button>
            <button onClick={() => setShowLeaderboard(true)} className="leaderboard-button">
              🏆 View Leaderboard
            </button>
          </div>
        </div>
      )}

      <QuizOverlay />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}; 