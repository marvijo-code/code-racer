import React, { useEffect, useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { apiClient } from '../lib/api';
import { RaceTrack } from './RaceTrack';
import { QuizOverlay } from './QuizOverlay';
import { Leaderboard } from './Leaderboard';
import { ToastContainer } from './Toast';
import { GameMenu } from './GameMenu';
import { RandomQuestions } from './RandomQuestions';

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
  const [screenDimensions, setScreenDimensions] = useState({ width: 900, height: 800 });

  // Calculate responsive dimensions for the race track
  useEffect(() => {
    const calculateDimensions = () => {
      const isMobile = window.innerWidth <= 768;
      const padding = isMobile ? 10 : 40;
      // Much more compact header now
      const headerHeight = isMobile ? 60 : 160; 
      const controlsHeight = isMobile ? 50 : 60;
      
      const availableWidth = window.innerWidth - padding;
      const availableHeight = window.innerHeight - headerHeight - controlsHeight;
      
      if (isMobile) {
        // Mobile: Use more of the screen, maintain good aspect ratio
        const maxWidth = Math.min(availableWidth, window.innerWidth * 0.95);
        const maxHeight = Math.min(availableHeight, window.innerHeight * 0.75);
        
        // Maintain 4:3 aspect ratio for better gameplay
        const aspectRatio = 4 / 3;
        let width = Math.max(320, maxWidth);
        let height = width / aspectRatio;
        
        // If height exceeds available space, adjust width accordingly
        if (height > maxHeight) {
          height = Math.max(240, maxHeight);
          width = height * aspectRatio;
        }
        
        setScreenDimensions({ 
          width: Math.round(width), 
          height: Math.round(height) 
        });
      } else {
        // Desktop: use fixed large size or scale down if needed
        const width = Math.min(900, availableWidth);
        const height = Math.min(800, availableHeight);
        setScreenDimensions({ width, height });
      }
    };

    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);
    window.addEventListener('orientationchange', calculateDimensions);
    
    return () => {
      window.removeEventListener('resize', calculateDimensions);
      window.removeEventListener('orientationchange', calculateDimensions);
    };
  }, []);

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
    console.log('Starting new race...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('Calling apiClient.startSession()...');
      const session = await apiClient.startSession();
      console.log('Session created:', session);
      
      setSession(session);
      setRacing(true);
      setGameMode('racing');
      setStartTime(Date.now());
      
      console.log('Race started successfully!');
      console.log('Current game state:', {
        isRacing: true,
        gameMode: 'racing',
        sessionId: session.sessionId
      });
    } catch (err) {
      setError('Failed to start race session');
      console.error('Start race error:', err);
      
      // Fallback: Start race without backend session for testing
      console.log('Attempting to start race without backend session...');
      const mockSession = {
        sessionId: Date.now(),
        userId: undefined,
        startUtc: new Date().toISOString(),
        endUtc: undefined,
        finalTimeMs: undefined,
        livesUsed: 0,
        isCompleted: false
      };
      
      setSession(mockSession);
      setRacing(true);
      setGameMode('racing');
      setStartTime(Date.now());
      
      console.log('Mock race started!');
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
                  <div key={bot.id} style={{color: `#${(bot.color || 0xFFFFFF).toString(16).padStart(6, '0')}`}}>
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
    <div className={`game-container ${currentSession && gameMode === 'racing' ? 'racing' : 'main-page'}`}>
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
            <p>Sharpen your software engineering skills while racing - from fundamentals to advanced concepts!</p>
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

      {/* Random Questions Preview - Only show when not racing */}
      {!currentSession && (
        <RandomQuestions />
      )}

      {currentSession && gameMode === 'racing' && (
        <>
          <RaceTrack width={screenDimensions.width} height={screenDimensions.height} />
          <GameMenu 
            onFinishRace={finishRace}
            onShowLeaderboard={() => setShowLeaderboard(true)}
            onRestartRace={handleRestart}
          />
        </>
      )}

      {gameMode === 'spectating' && (
        <>
          <div className="spectator-mode">
            <h2>👁️ Spectator Mode</h2>
            <p>You've run out of lives! Watch the AI complete the race.</p>
          </div>
          <GameMenu 
            onFinishRace={finishRace}
            onShowLeaderboard={() => setShowLeaderboard(true)}
            onRestartRace={handleRestart}
          />
        </>
      )}

      <QuizOverlay />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}; 