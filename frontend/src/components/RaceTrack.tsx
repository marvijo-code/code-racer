import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useGameStore } from '../state/gameStore';

interface RaceTrackProps {
  width: number;
  height: number;
}

export const RaceTrack: React.FC<RaceTrackProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const carSpriteRef = useRef<PIXI.Graphics | null>(null);
  const trackRef = useRef<PIXI.Graphics | null>(null);
  const checkpointRef = useRef<PIXI.Graphics | null>(null);
  
  const {
    carPosition,
    updateCarPosition,
    isRacing,
    isPaused,
    setQuizActive,
    setQuestionStartTime,
    gameMode
  } = useGameStore();

  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize PIXI Application
    const app = new PIXI.Application();
    appRef.current = app;

    const initPixi = async () => {
      await app.init({
        width,
        height,
        backgroundColor: '#228B22', // Green background for grass
        antialias: true,
      });

      if (canvasRef.current) {
        canvasRef.current.appendChild(app.canvas);
      }

      // Create track
      const track = new PIXI.Graphics();
      track.rect(50, 50, width - 100, height - 100);
      track.stroke({ width: 20, color: 0x444444 });
      track.rect(100, 100, width - 200, height - 200);
      track.stroke({ width: 20, color: 0x444444 });
      
      // Add track markings
      track.rect(width / 2 - 5, 50, 10, height - 100);
      track.fill({ color: 0xFFFFFF });
      
      trackRef.current = track;
      app.stage.addChild(track);

      // Create checkpoint (mid-track)
      const checkpoint = new PIXI.Graphics();
      checkpoint.rect(width / 2 - 25, height / 2 - 50, 50, 100);
      checkpoint.fill({ color: 0xFF0000, alpha: 0.5 });
      checkpointRef.current = checkpoint;
      app.stage.addChild(checkpoint);

      // Create car
      const car = new PIXI.Graphics();
      car.rect(-10, -5, 20, 10);
      car.fill({ color: 0x0000FF });
      car.x = carPosition.x;
      car.y = carPosition.y;
      car.rotation = carPosition.rotation;
      
      carSpriteRef.current = car;
      app.stage.addChild(car);

      // Start game loop
      app.ticker.add(gameLoop);
    };

    initPixi();

    return () => {
      if (appRef.current) {
        appRef.current.destroy();
      }
    };
  }, [width, height]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [event.code]: true }));
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [event.code]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const gameLoop = () => {
    if (!isRacing || isPaused || gameMode !== 'racing') return;

    let newX = carPosition.x;
    let newY = carPosition.y;
    let newRotation = carPosition.rotation;
    let newSpeed = carPosition.speed;

    // Handle input
    if (keys['ArrowUp'] || keys['KeyW']) {
      newSpeed = Math.min(newSpeed + 0.5, 5);
    } else if (keys['ArrowDown'] || keys['KeyS']) {
      newSpeed = Math.max(newSpeed - 0.5, -2);
    } else {
      newSpeed *= 0.95; // Friction
    }

    if (keys['ArrowLeft'] || keys['KeyA']) {
      newRotation -= 0.05 * Math.abs(newSpeed);
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
      newRotation += 0.05 * Math.abs(newSpeed);
    }

    // Update position based on rotation and speed
    newX += Math.cos(newRotation) * newSpeed;
    newY += Math.sin(newRotation) * newSpeed;

    // Keep car within track bounds (simplified)
    newX = Math.max(70, Math.min(newX, width - 70));
    newY = Math.max(70, Math.min(newY, height - 70));

    // Check for checkpoint collision (simplified)
    const checkpointX = width / 2;
    const checkpointY = height / 2;
    const distance = Math.sqrt(Math.pow(newX - checkpointX, 2) + Math.pow(newY - checkpointY, 2));
    
    if (distance < 50) {
      // Trigger quiz
      setQuizActive(true);
      setQuestionStartTime(Date.now());
    }

    // Update car sprite
    if (carSpriteRef.current) {
      carSpriteRef.current.x = newX;
      carSpriteRef.current.y = newY;
      carSpriteRef.current.rotation = newRotation;
    }

    // Update store
    updateCarPosition({
      x: newX,
      y: newY,
      rotation: newRotation,
      speed: newSpeed
    });
  };

  return (
    <div className="race-track-container">
      <div ref={canvasRef} className="race-track" />
      <div className="race-hud">
        <div className="speed-meter">
          Speed: {Math.abs(carPosition.speed).toFixed(1)}
        </div>
        <div className="position">
          Position: ({carPosition.x.toFixed(0)}, {carPosition.y.toFixed(0)})
        </div>
        <div className="controls">
          <p>Use WASD or Arrow Keys to control the car</p>
          <p>Drive through the red checkpoint to answer questions!</p>
        </div>
      </div>
    </div>
  );
}; 