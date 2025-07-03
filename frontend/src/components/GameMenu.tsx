import React, { useState, useEffect } from 'react';
import { useGameStore } from '../state/gameStore';
import { soundManager } from '../utils/SoundManager';

interface GameMenuProps {
  onFinishRace: () => void;
  onShowLeaderboard: () => void;
  onRestartRace: () => void;
}

export const GameMenu: React.FC<GameMenuProps> = ({ 
  onFinishRace, 
  onShowLeaderboard, 
  onRestartRace 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isRacing, isPaused, setPaused, hasFinished, gameMode } = useGameStore();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isOpen && !target.closest('.game-menu')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    // UI sounds disabled - only engine sounds allowed
  };

  const handlePauseToggle = () => {
    if (isRacing && !hasFinished) {
      setPaused(!isPaused);
      if (!isPaused) {
        soundManager.stopEngine();
      } else {
        soundManager.startEngine();
      }
    }
    setIsOpen(false);
  };

  const handleFinishRace = () => {
    // UI sounds disabled - only engine sounds allowed
    onFinishRace();
    setIsOpen(false);
  };

  const handleShowLeaderboard = () => {
    // UI sounds disabled - only engine sounds allowed
    onShowLeaderboard();
    setIsOpen(false);
  };

  const handleRestartRace = () => {
    // UI sounds disabled - only engine sounds allowed
    onRestartRace();
    setIsOpen(false);
  };

  const handleVolumeChange = (volume: number) => {
    soundManager.setMasterVolume(volume);
  };

  return (
    <div className="game-menu">
      {/* Hamburger Menu Button */}
      <button 
        className={`menu-toggle ${isOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="Game Menu"
      >
        <div className="hamburger-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* Menu Overlay */}
      {isOpen && <div className="menu-overlay" onClick={() => setIsOpen(false)} />}

      {/* Menu Panel */}
      <div className={`menu-panel ${isOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <h3>🏁 RACE MENU</h3>
          <button className="menu-close" onClick={() => setIsOpen(false)}>×</button>
        </div>

        <div className="menu-content">
          {/* Game Controls */}
          <div className="menu-section">
            <h4>🎮 Game Controls</h4>
            
            {isRacing && !hasFinished && (
              <button 
                className={`menu-button ${isPaused ? 'resume' : 'pause'}`}
                onClick={handlePauseToggle}
              >
                {isPaused ? '▶️ Resume Race' : '⏸️ Pause Race'}
              </button>
            )}

            {isRacing && (
              <button 
                className="menu-button finish"
                onClick={handleFinishRace}
              >
                🏁 Finish Race
              </button>
            )}

            <button 
              className="menu-button leaderboard"
              onClick={handleShowLeaderboard}
            >
              🏆 Leaderboard
            </button>

            <button 
              className="menu-button restart"
              onClick={handleRestartRace}
            >
              🔄 Restart Race
            </button>
          </div>

          {/* Audio Settings */}
          <div className="menu-section">
            <h4>🔊 Audio Settings</h4>
            <div className="volume-setting">
              <label>
                Master Volume
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={soundManager.getMasterVolume()} 
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="volume-slider"
                />
                <span className="volume-value">
                  {Math.round(soundManager.getMasterVolume() * 100)}%
                </span>
              </label>
            </div>
          </div>

          {/* Game Info */}
          <div className="menu-section">
            <h4>ℹ️ Game Info</h4>
            <div className="game-info">
              <div className="info-item">
                <span>Mode:</span>
                <span className="info-value">{gameMode}</span>
              </div>
              <div className="info-item">
                <span>Status:</span>
                <span className="info-value">
                  {hasFinished ? 'Finished' : isRacing ? (isPaused ? 'Paused' : 'Racing') : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* Controls Help */}
          <div className="menu-section">
            <h4>🎯 Controls</h4>
            <div className="controls-help">
              <div className="control-item">
                <span className="keys">WASD / Arrow Keys</span>
                <span>Drive</span>
              </div>
              <div className="control-item">
                <span className="keys">Mouse/Touch</span>
                <span>Camera</span>
              </div>
              <div className="control-item">
                <span className="keys">Checkpoints</span>
                <span>Speed Boost</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 