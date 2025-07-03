import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { useGameStore } from '../state/gameStore';
import type { BotCar, DifficultyCheckpoint } from '../state/gameStore';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

interface RaceTrackProps {
  width: number;
  height: number;
}

export const RaceTrack: React.FC<RaceTrackProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const carSpriteRef = useRef<PIXI.Graphics | null>(null);
  const trackRef = useRef<PIXI.Graphics | null>(null);
  const checkpointRef = useRef<PIXI.Graphics | null>(null);
  const finishLineRef = useRef<PIXI.Graphics | null>(null);
  const botSpritesRef = useRef<Map<string, PIXI.Graphics>>(new Map());
  const difficultyCheckpointSpritesRef = useRef<Map<string, PIXI.Graphics>>(new Map());
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const [pixiInitialized, setPixiInitialized] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  
  const {
    carPosition,
    updateCarPosition,
    isRacing,
    isPaused,
    setQuizActive,
    setQuestionStartTime,
    gameMode,
    bots,
    setBots,
    updateBotPosition,
    difficultyCheckpoints,
    setDifficultyCheckpoints,
    updateCheckpoint,
    speedBoost,
    setSpeedBoost,
    hasFinished,
    setHasFinished
  } = useGameStore();

  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});

  // Generate AI bots with different skill levels
  const generateBots = (): BotCar[] => {
    const skillLevels: BotCar['skillLevel'][] = ['Beginner', 'Intermediate', 'Expert', 'Master'];
    const botColors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFECA57];
    const worldHeight = height * 3; // Match the world height
    
    return skillLevels.map((skillLevel, index) => {
      const randomName = uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals],
        separator: '',
        style: 'capital'
      });
      
      return {
        id: `bot_${index}`,
        name: randomName,
        skillLevel,
        position: {
          x: 300 + index * 50, // Spread out horizontally at start line, next to player
          y: worldHeight - 90, // All start at bottom of world (2310)
          rotation: -Math.PI / 2, // Point upward like player
          speed: 1, // Default speed 1
        },
        color: botColors[index],
        progress: 0,
        hasFinished: false,
        aiPersonality: {
          aggressiveness: 0.2 + (index * 0.2),
          accuracy: 0.3 + (index * 0.2),
          consistency: 0.4 + (index * 0.15)
        }
      };
    });
  };

  // Generate difficulty checkpoints
  const generateDifficultyCheckpoints = (): DifficultyCheckpoint[] => {
    const checkpoints: DifficultyCheckpoint[] = [];
    const colors = [0x00FF00, 0xFFFF00, 0xFFA500, 0xFF0000, 0x800080];
    const worldWidth = width * 2;
    const worldHeight = height * 3;
    
    // Create more checkpoints scattered around the track
    const checkpointPositions = [
      // Right side going up
      { x: worldWidth - 400, y: 1800, difficulty: 2 },
      { x: worldWidth - 350, y: 1400, difficulty: 4 },
      { x: worldWidth - 400, y: 1000, difficulty: 3 },
      { x: worldWidth - 350, y: 600, difficulty: 6 },
      // Top section
      { x: worldWidth - 600, y: 400, difficulty: 5 },
      { x: worldWidth / 2, y: 350, difficulty: 8 },
      { x: 600, y: 400, difficulty: 7 },
      // Left side going down
      { x: 350, y: 600, difficulty: 4 },
      { x: 400, y: 1000, difficulty: 6 },
      { x: 350, y: 1400, difficulty: 3 },
      { x: 400, y: 1800, difficulty: 5 },
      // Bottom section
      { x: 600, y: 2000, difficulty: 2 },
      { x: worldWidth / 2, y: 2050, difficulty: 9 },
      { x: worldWidth - 600, y: 2000, difficulty: 7 }
    ];
    
    checkpointPositions.forEach((pos, i) => {
      checkpoints.push({
        id: `checkpoint_${i}`,
        x: pos.x,
        y: pos.y,
        difficulty: pos.difficulty,
        speedBoost: 1 + (pos.difficulty * 0.1), // 1.1x to 2.0x speed boost
        color: colors[Math.floor((pos.difficulty - 1) / 2)],
        completed: false
      });
    });
    
    return checkpoints;
  };

  useEffect(() => {
    if (isRacing && bots.length === 0) {
      setBots(generateBots());
    }
    if (isRacing && difficultyCheckpoints.length === 0) {
      setDifficultyCheckpoints(generateDifficultyCheckpoints());
    }
  }, [isRacing, bots.length, difficultyCheckpoints.length, setBots, setDifficultyCheckpoints]);

  useEffect(() => {
    if (canvasRef.current) {
      setCanvasReady(true);
    }
  }, []);

  useEffect(() => {
    if (!canvasReady) {
      return;
    }

    const container = canvasRef.current;
    if (!container) {
      return;
    }

    let app = new PIXI.Application();

    const initPixi = async () => {
      await app.init({
        resizeTo: container,
        backgroundColor: '#228B22',
        antialias: true,
      });

      container.innerHTML = '';
      container.appendChild(app.canvas);
      appRef.current = app;

      const worldWidth = container.clientWidth * 2;
      const worldHeight = container.clientHeight * 3;

      const viewport = new Viewport({
        screenWidth: container.clientWidth,
        screenHeight: container.clientHeight,
        worldWidth,
        worldHeight,
        events: app.renderer.events,
      });

      app.stage.addChild(viewport);
      viewportRef.current = viewport;

      const isMobileDevice = container.clientWidth <= 768;
      viewport.drag().pinch().wheel().decelerate({ friction: 0.95 });

      // --- PIXI objects setup ---
      const track = new PIXI.Graphics()
        .roundRect(100, 100, worldWidth - 200, worldHeight - 200, 50).stroke({ width: 30, color: 0x444444 })
        .roundRect(200, 200, worldWidth - 400, worldHeight - 400, 40).stroke({ width: 30, color: 0x444444 });
      viewport.addChild(track);
      trackRef.current = track;

      const car = new PIXI.Graphics().roundRect(-12, -6, 24, 12, 2).fill({ color: 0x0000FF });
      car.x = carPosition.x;
      car.y = carPosition.y;
      car.rotation = carPosition.rotation;
      viewport.addChild(car);
      carSpriteRef.current = car;

      viewport.follow(car, { speed: 8, acceleration: 0.05, radius: 50 });
      if (isMobileDevice) {
        viewport.setZoom(0.7, true);
      }
      
      setPixiInitialized(true);

      // --- Game Loop ---
      app.ticker.add((time) => {
        const state = useGameStore.getState();
        if (!state.isRacing || state.isPaused || !carSpriteRef.current) return;
        
        let newSpeed = state.carPosition.speed;
        if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) newSpeed += 0.2;
        else if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) newSpeed -= 0.3;
        else newSpeed *= 0.92;
        
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) carSpriteRef.current.rotation -= 0.05;
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) carSpriteRef.current.rotation += 0.05;

        carSpriteRef.current.x += Math.cos(carSpriteRef.current.rotation) * newSpeed;
        carSpriteRef.current.y += Math.sin(carSpriteRef.current.rotation) * newSpeed;
        
        updateCarPosition({
          x: carSpriteRef.current.x,
          y: carSpriteRef.current.y,
          rotation: carSpriteRef.current.rotation,
          speed: newSpeed,
        });
      });
    };

    initPixi();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, true);
        appRef.current = null;
      }
    };
  }, [canvasReady]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('Key down:', event.code);
      keysRef.current = { ...keysRef.current, [event.code]: true };
      setKeys(prev => ({ ...prev, [event.code]: true }));
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      console.log('Key up:', event.code);
      keysRef.current = { ...keysRef.current, [event.code]: false };
      setKeys(prev => ({ ...prev, [event.code]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  console.log('RaceTrack render - canvasReady:', canvasReady, 'pixiInitialized:', pixiInitialized);

  if (!pixiInitialized) {
    return (
      <div className="race-track-container">
        <div className="race-track">
          <div className="loading-track">
            <p>Loading race track...</p>
            <p style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
              Canvas Ready: {canvasReady ? 'Yes' : 'No'} | Check browser console for details
            </p>
          </div>
        </div>
        <div ref={canvasRef} style={{ display: 'none' }} />
      </div>
    );
  }

  return (
    <div className="race-track-container">
      <div ref={canvasRef} className="race-track" />
      <div className="race-hud">
        <div className="speed-meter">
          Speed: {Math.abs(carPosition.speed).toFixed(1)} 
          {speedBoost > 1 && <span style={{color: '#00ff00'}}> (BOOST {speedBoost.toFixed(1)}x)</span>}
        </div>
        <div className="position">
          Position: ({carPosition.x.toFixed(0)}, {carPosition.y.toFixed(0)})
        </div>
        <div className="bot-info">
          <h4>Bot Standings:</h4>
          {bots.map((bot, index) => (
            <div key={bot.id} style={{color: `#${bot.color.toString(16).padStart(6, '0')}`}}>
              {index + 1}. {bot.name} ({bot.skillLevel}) - {(bot.progress * 100).toFixed(1)}%
            </div>
          ))}
        </div>
        <div className="controls">
          <p>Use WASD or Arrow Keys to control the car</p>
          <p>Drive through colored checkpoints for speed boosts!</p>
          <p>Reach the checkered finish line at the top!</p>
        </div>
      </div>
    </div>
  );
}; 