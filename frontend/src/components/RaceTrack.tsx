import React, { useEffect, useRef, useState, useCallback } from 'react';
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
    gameMode
  } = useGameStore();

  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});

  // Check if canvas ref is ready
  useEffect(() => {
    console.log('Checking canvas ref availability...');
    if (canvasRef.current) {
      console.log('Canvas ref is available, setting canvasReady to true');
      setCanvasReady(true);
    } else {
      console.log('Canvas ref not yet available');
      // Try again after a short delay
      const timer = setTimeout(() => {
        if (canvasRef.current) {
          console.log('Canvas ref available after delay');
          setCanvasReady(true);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  // Initialize PIXI only when canvas is ready
  useEffect(() => {
    if (!canvasReady || !canvasRef.current) {
      console.log('Canvas not ready for PIXI initialization');
      return;
    }

    let mounted = true;
    console.log('Starting PIXI initialization...');

    const initPixi = async () => {
      try {
        console.log('Creating PIXI Application...');
        // Initialize PIXI Application
        const app = new PIXI.Application();
        
        console.log('Initializing PIXI Application...');
        await app.init({
          width,
          height,
          backgroundColor: '#228B22', // Green background for grass
          antialias: true,
        });

        console.log('PIXI Application initialized successfully');

        // Check if component is still mounted
        if (!mounted || !canvasRef.current) {
          console.log('Component unmounted, destroying app');
          app.destroy();
          return;
        }

        appRef.current = app;
        canvasRef.current.appendChild(app.canvas);
        console.log('Canvas added to DOM');

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
        console.log('Track created and added to stage');

        // Create checkpoint (mid-track)
        const checkpoint = new PIXI.Graphics();
        checkpoint.rect(width / 2 - 25, height / 2 - 50, 50, 100);
        checkpoint.fill({ color: 0xFF0000, alpha: 0.5 });
        checkpointRef.current = checkpoint;
        app.stage.addChild(checkpoint);
        console.log('Checkpoint created and added to stage');

        // Create car
        const car = new PIXI.Graphics();
        car.rect(-10, -5, 20, 10);
        car.fill({ color: 0x0000FF });
        car.x = carPosition.x;
        car.y = carPosition.y;
        car.rotation = carPosition.rotation;
        
        carSpriteRef.current = car;
        app.stage.addChild(car);
        console.log('Car created and added to stage');

        // Define game loop function
        let frameCount = 0;
        const gameLoop = () => {
          frameCount++;
          if (frameCount % 60 === 0) { // Log every 60 frames (roughly once per second)
            console.log('Game loop running, frame:', frameCount);
          }
          
          if (!appRef.current) return;
          
          const state = useGameStore.getState();
          if (!state.isRacing || state.isPaused || state.gameMode !== 'racing') {
            if (frameCount % 60 === 0) {
              console.log('Game loop paused - isRacing:', state.isRacing, 'isPaused:', state.isPaused, 'gameMode:', state.gameMode);
            }
            return;
          }

          const currentCarPosition = state.carPosition;
          
          let newX = currentCarPosition.x;
          let newY = currentCarPosition.y;
          let newRotation = currentCarPosition.rotation;
          let newSpeed = currentCarPosition.speed;

          // Get current keys from the component's state
          const currentKeys = keysRef.current;

          // Handle input
          if (currentKeys['ArrowUp'] || currentKeys['KeyW']) {
            newSpeed = Math.min(newSpeed + 0.5, 5);
            console.log('Moving forward, speed:', newSpeed);
          } else if (currentKeys['ArrowDown'] || currentKeys['KeyS']) {
            newSpeed = Math.max(newSpeed - 0.5, -2);
            console.log('Moving backward, speed:', newSpeed);
          } else {
            newSpeed *= 0.95; // Friction
          }

          if (currentKeys['ArrowLeft'] || currentKeys['KeyA']) {
            newRotation -= 0.05 * Math.abs(newSpeed);
            console.log('Turning left, rotation:', newRotation);
          }
          if (currentKeys['ArrowRight'] || currentKeys['KeyD']) {
            newRotation += 0.05 * Math.abs(newSpeed);
            console.log('Turning right, rotation:', newRotation);
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
            state.setQuizActive(true);
            state.setQuestionStartTime(Date.now());
          }

          // Update car sprite
          if (carSpriteRef.current) {
            carSpriteRef.current.x = newX;
            carSpriteRef.current.y = newY;
            carSpriteRef.current.rotation = newRotation;
          }

          // Update store
          state.updateCarPosition({
            x: newX,
            y: newY,
            rotation: newRotation,
            speed: newSpeed
          });
        };

        // Start game loop
        app.ticker.add(gameLoop);
        console.log('Game loop added to ticker');
        
        console.log('PIXI initialization complete, setting pixiInitialized to true');
        setPixiInitialized(true);
      } catch (error) {
        console.error('Failed to initialize PIXI.js:', error);
        if (mounted) {
          setPixiInitialized(false);
        }
      }
    };

    initPixi();

    return () => {
      mounted = false;
      console.log('Cleaning up PIXI application...');
      setPixiInitialized(false);
      
      if (appRef.current) {
        try {
          appRef.current.destroy(true, {
            children: true,
            texture: true
          });
          console.log('PIXI application destroyed successfully');
        } catch (error) {
          console.error('Error destroying PIXI app:', error);
        }
        appRef.current = null;
      }
      
      // Clear refs
      carSpriteRef.current = null;
      trackRef.current = null;
      checkpointRef.current = null;
    };
  }, [canvasReady, width, height]); // Depend on canvasReady

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
        <div className="loading-track">
          <p>Loading race track...</p>
          <p style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
            Canvas Ready: {canvasReady ? 'Yes' : 'No'} | Check browser console for details
          </p>
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