import React, { useEffect, useRef, useState, useCallback } from 'react';
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

  // Initialize bots and checkpoints when game starts
  useEffect(() => {
    if (isRacing && bots.length === 0) {
      setBots(generateBots());
    }
    if (isRacing && difficultyCheckpoints.length === 0) {
      setDifficultyCheckpoints(generateDifficultyCheckpoints());
    }
  }, [isRacing, bots.length, difficultyCheckpoints.length, setBots, setDifficultyCheckpoints]);

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

        // Create viewport for camera following
        const worldWidth = width * 2; // Make world larger than screen
        const worldHeight = height * 3; // Much taller world
        const viewport = new Viewport({
          screenWidth: width,
          screenHeight: height,
          worldWidth: worldWidth,
          worldHeight: worldHeight,
          events: app.renderer.events
        });

        // Add viewport to stage
        app.stage.addChild(viewport);
        viewportRef.current = viewport;
        
        // Enable camera following and bounds
        viewport
          .drag()
          .pinch()
          .wheel()
          .decelerate()
          .clampZoom({
            minScale: 0.5,
            maxScale: 2
          });

        console.log('Viewport created and configured');

        // Create F1-style track with realistic curves (larger world)
        const track = new PIXI.Graphics();
        
        // Outer track boundary - larger oval track
        track.roundRect(100, 100, worldWidth - 200, worldHeight - 200, 50);
        track.stroke({ width: 30, color: 0x444444 });
        
        // Inner track boundary  
        track.roundRect(200, 200, worldWidth - 400, worldHeight - 400, 40);
        track.stroke({ width: 30, color: 0x444444 });
        
        // Start/finish line area (at bottom of world)
        track.rect(200, worldHeight - 300, worldWidth - 400, 150);
        track.fill({ color: 0x666666, alpha: 0.3 });
        
        // Add center line markings along the track
        const centerX = worldWidth / 2;
        for (let y = 120; y < worldHeight - 120; y += 60) {
          track.rect(centerX - 4, y, 8, 30);
          track.fill({ color: 0xFFFFFF });
        }
        
        // Add many direction arrows around the track for guidance
        const arrowPositions = [
          // Bottom straight - going up
          { x: worldWidth / 2, y: worldHeight - 400, rotation: -Math.PI / 2 },
          { x: worldWidth / 2, y: worldHeight - 600, rotation: -Math.PI / 2 },
          { x: worldWidth / 2, y: worldHeight - 800, rotation: -Math.PI / 2 },
          // Right side going up
          { x: worldWidth - 300, y: 1600, rotation: -Math.PI / 2 },
          { x: worldWidth - 300, y: 1200, rotation: -Math.PI / 2 },
          { x: worldWidth - 300, y: 800, rotation: -Math.PI / 2 },
          // Right turn at top
          { x: worldWidth - 400, y: 400, rotation: -Math.PI / 4 },
          { x: worldWidth - 600, y: 300, rotation: Math.PI },
          // Top straight - going left
          { x: worldWidth - 800, y: 250, rotation: Math.PI },
          { x: worldWidth / 2, y: 250, rotation: Math.PI },
          { x: 800, y: 250, rotation: Math.PI },
          // Left turn at top
          { x: 400, y: 300, rotation: 3 * Math.PI / 4 },
          { x: 300, y: 400, rotation: Math.PI / 2 },
          // Left side going down
          { x: 300, y: 800, rotation: Math.PI / 2 },
          { x: 300, y: 1200, rotation: Math.PI / 2 },
          { x: 300, y: 1600, rotation: Math.PI / 2 },
          // Left turn at bottom
          { x: 400, y: worldHeight - 400, rotation: Math.PI / 4 },
          { x: 600, y: worldHeight - 300, rotation: 0 },
          // Bottom straight - going right
          { x: 800, y: worldHeight - 250, rotation: 0 },
          { x: worldWidth / 2, y: worldHeight - 250, rotation: 0 },
          { x: worldWidth - 800, y: worldHeight - 250, rotation: 0 },
          // Right turn at bottom
          { x: worldWidth - 600, y: worldHeight - 300, rotation: -Math.PI / 4 },
          { x: worldWidth - 400, y: worldHeight - 400, rotation: -Math.PI / 2 }
        ];
        
        arrowPositions.forEach(arrow => {
          const arrowSprite = new PIXI.Graphics();
          arrowSprite.moveTo(0, -15);
          arrowSprite.lineTo(20, 0);
          arrowSprite.lineTo(0, 15);
          arrowSprite.lineTo(8, 0);
          arrowSprite.closePath();
          arrowSprite.fill({ color: 0x00FF00 });
          arrowSprite.x = arrow.x;
          arrowSprite.y = arrow.y;
          arrowSprite.rotation = arrow.rotation;
          viewport.addChild(arrowSprite);
        });
        
        trackRef.current = track;
        viewport.addChild(track);
        console.log('Large F1-style track created and added to viewport');

        // Create finish line at the top of world
        const finishLine = new PIXI.Graphics();
        finishLine.rect(200, 150, worldWidth - 400, 20);
        finishLine.fill({ color: 0x000000 });
        // Add checkered pattern
        for (let i = 0; i < (worldWidth - 400) / 30; i++) {
          if (i % 2 === 0) {
            finishLine.rect(200 + i * 30, 150, 30, 20);
            finishLine.fill({ color: 0xFFFFFF });
          }
        }
        
        // Add "FINISH" text
        const finishText = new PIXI.Text({
          text: 'FINISH',
          style: {
            fontSize: 32,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
          }
        });
        finishText.anchor.set(0.5);
        finishText.x = worldWidth / 2;
        finishText.y = 120;
        viewport.addChild(finishText);
        
        finishLineRef.current = finishLine;
        viewport.addChild(finishLine);
        console.log('Finish line created and added to viewport');

        // Create checkpoint (mid-track)
        const checkpoint = new PIXI.Graphics();
        checkpoint.rect(worldWidth / 2 - 30, worldHeight / 2 - 60, 60, 120);
        checkpoint.fill({ color: 0xFF0000, alpha: 0.5 });
        checkpointRef.current = checkpoint;
        viewport.addChild(checkpoint);
        console.log('Checkpoint created and added to viewport');

        // Create realistic player car
        const car = new PIXI.Graphics();
        // Car body
        car.roundRect(-12, -6, 24, 12, 2);
        car.fill({ color: 0x0000FF });
        // Car front
        car.roundRect(-12, -4, 4, 8, 1);
        car.fill({ color: 0x000088 });
        // Car rear spoiler
        car.rect(8, -3, 4, 6);
        car.fill({ color: 0x000088 });
        // Windshield
        car.roundRect(-6, -3, 8, 6, 1);
        car.fill({ color: 0x87CEEB, alpha: 0.7 });
        
        car.x = carPosition.x;
        car.y = carPosition.y;
        car.rotation = carPosition.rotation;
        
        carSpriteRef.current = car;
        viewport.addChild(car);
        console.log('Realistic player car created and added to viewport');

        // Create difficulty checkpoints
        const state = useGameStore.getState();
        state.difficultyCheckpoints.forEach(checkpoint => {
          const checkpointSprite = new PIXI.Graphics();
          checkpointSprite.circle(0, 0, 25);
          checkpointSprite.fill({ color: checkpoint.color, alpha: 0.7 });
          checkpointSprite.x = checkpoint.x;
          checkpointSprite.y = checkpoint.y;
          
          // Add difficulty text
          const text = new PIXI.Text({
            text: checkpoint.difficulty.toString(),
            style: {
              fontSize: 16,
              fill: 0xFFFFFF,
              fontWeight: 'bold'
            }
          });
          text.anchor.set(0.5);
          checkpointSprite.addChild(text);
          
          difficultyCheckpointSpritesRef.current.set(checkpoint.id, checkpointSprite);
          viewport.addChild(checkpointSprite);
        });
        console.log('Difficulty checkpoints created and added to viewport');

        // Create realistic bot cars
        state.bots.forEach(bot => {
          const botSprite = new PIXI.Graphics();
          // Bot car body
          botSprite.roundRect(-12, -6, 24, 12, 2);
          botSprite.fill({ color: bot.color });
          // Bot car front
          botSprite.roundRect(-12, -4, 4, 8, 1);
          botSprite.fill({ color: bot.color, alpha: 0.8 });
          // Bot car rear spoiler
          botSprite.rect(8, -3, 4, 6);
          botSprite.fill({ color: bot.color, alpha: 0.8 });
          // Bot windshield
          botSprite.roundRect(-6, -3, 8, 6, 1);
          botSprite.fill({ color: 0x87CEEB, alpha: 0.5 });
          
          botSprite.x = bot.position.x;
          botSprite.y = bot.position.y;
          botSprite.rotation = bot.position.rotation;
          
          // Add skill level text above bot
          const skillText = new PIXI.Text({
            text: bot.skillLevel.charAt(0), // Just first letter to save space
            style: {
              fontSize: 12,
              fill: 0xFFFFFF,
              fontWeight: 'bold'
            }
          });
          skillText.anchor.set(0.5, 1);
          skillText.x = 0;
          skillText.y = -18;
          botSprite.addChild(skillText);
          
          botSpritesRef.current.set(bot.id, botSprite);
          viewport.addChild(botSprite);
        });
        console.log('Realistic bot cars created and added to viewport');

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

          // Handle input with speed boost - gentler physics
          const currentSpeedBoost = state.speedBoost;
          if (currentKeys['ArrowUp'] || currentKeys['KeyW']) {
            newSpeed = Math.min(newSpeed + (0.2 * currentSpeedBoost), 3 * currentSpeedBoost);
          } else if (currentKeys['ArrowDown'] || currentKeys['KeyS']) {
            newSpeed = Math.max(newSpeed - 0.3, -1.5);
          } else {
            newSpeed *= 0.92; // More friction for smoother stopping
          }

          if (currentKeys['ArrowLeft'] || currentKeys['KeyA']) {
            newRotation -= 0.03 * Math.abs(newSpeed); // Reduced turning sensitivity
          }
          if (currentKeys['ArrowRight'] || currentKeys['KeyD']) {
            newRotation += 0.03 * Math.abs(newSpeed); // Reduced turning sensitivity
          }

          // Update position based on rotation and speed
          newX += Math.cos(newRotation) * newSpeed;
          newY += Math.sin(newRotation) * newSpeed;

          // Keep car within track bounds (larger world track)  
          newX = Math.max(230, Math.min(newX, worldWidth - 230));
          newY = Math.max(230, Math.min(newY, worldHeight - 230));

          // Check for finish line collision (at top of world)
          if (newY <= 170 && newX >= 200 && newX <= worldWidth - 200 && !state.hasFinished) {
            state.setHasFinished(true);
            state.setGameMode('finished');
            console.log('Player crossed finish line!');
          }

          // Check for difficulty checkpoint collisions
          state.difficultyCheckpoints.forEach(checkpoint => {
            if (!checkpoint.completed) {
              const distance = Math.sqrt(Math.pow(newX - checkpoint.x, 2) + Math.pow(newY - checkpoint.y, 2));
              if (distance < 30) {
                // Apply speed boost
                state.setSpeedBoost(checkpoint.speedBoost);
                state.updateCheckpoint(checkpoint.id, true);
                
                // Trigger quiz based on difficulty
                state.setQuizActive(true);
                state.setQuestionStartTime(Date.now());
                console.log(`Hit difficulty checkpoint ${checkpoint.difficulty}, speed boost: ${checkpoint.speedBoost}x`);
              }
            }
          });

          // Check for original checkpoint collision (simplified)
          const checkpointX = worldWidth / 2;
          const checkpointY = worldHeight / 2;
          const distance = Math.sqrt(Math.pow(newX - checkpointX, 2) + Math.pow(newY - checkpointY, 2));
          
          if (distance < 60) {
            // Trigger quiz
            state.setQuizActive(true);
            state.setQuestionStartTime(Date.now());
          }

          // Update bot AI
          state.bots.forEach(bot => {
            if (bot.hasFinished) return; // Don't move if finished
            
            const botState = { ...bot };
            
            // Check if bot finished (using world coordinates)
            if (botState.position.y <= 170 && botState.position.x >= 200 && botState.position.x <= worldWidth - 200) {
              botState.hasFinished = true;
              botState.position.speed = 0;
              state.setBots(state.bots.map(b => b.id === bot.id ? botState : b));
              console.log(`Bot ${bot.name} finished the race!`);
              return;
            }
            
            // Check if bot hits difficulty checkpoints
            state.difficultyCheckpoints.forEach(checkpoint => {
              if (!checkpoint.completed) {
                const distance = Math.sqrt(Math.pow(botState.position.x - checkpoint.x, 2) + Math.pow(botState.position.y - checkpoint.y, 2));
                if (distance < 30) {
                  // Bot has chance to answer correctly based on skill level and accuracy
                  const accuracy = bot.aiPersonality.accuracy;
                  const skillBonus = bot.skillLevel === 'Beginner' ? 0 : 
                                   bot.skillLevel === 'Intermediate' ? 0.1 :
                                   bot.skillLevel === 'Expert' ? 0.2 : 0.3;
                  const answerCorrect = Math.random() < (accuracy + skillBonus);
                  
                  if (answerCorrect) {
                    // Apply speed boost to bot
                    botState.position.speed *= checkpoint.speedBoost;
                    console.log(`Bot ${bot.name} answered correctly! Speed boost: ${checkpoint.speedBoost}x`);
                  }
                  
                  // Mark checkpoint as used (temporarily)
                  setTimeout(() => {
                    state.updateCheckpoint(checkpoint.id, false);
                  }, 3000);
                }
              }
            });
            
            // Simple AI: move towards finish line following track (world coordinates)
            const centerX = worldWidth / 2;
            const targetY = 170; // Finish line
            
            // Follow the track by staying near center horizontally and moving up
            const targetX = centerX + (Math.random() - 0.5) * 300; // Some variation
            
            const dx = targetX - botState.position.x;
            const dy = targetY - botState.position.y;
            const targetRotation = Math.atan2(dy, dx);
            
            // Adjust rotation towards target
            let rotationDiff = targetRotation - botState.position.rotation;
            if (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
            if (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;
            
            botState.position.rotation += rotationDiff * 0.1 * bot.aiPersonality.aggressiveness;
            
            // Update speed based on skill level (slower default speed)
            const baseSpeed = bot.skillLevel === 'Beginner' ? 1.2 : 
                              bot.skillLevel === 'Intermediate' ? 1.5 :
                              bot.skillLevel === 'Expert' ? 1.8 : 2.2;
            
            botState.position.speed = Math.max(1, baseSpeed + (Math.random() - 0.5) * bot.aiPersonality.consistency);
            
            // Update position
            botState.position.x += Math.cos(botState.position.rotation) * botState.position.speed;
            botState.position.y += Math.sin(botState.position.rotation) * botState.position.speed;
            
            // Keep within track bounds (more realistic)
            botState.position.x = Math.max(130, Math.min(botState.position.x, width - 130));
            botState.position.y = Math.max(70, Math.min(botState.position.y, height - 70));
            
            // Update progress (0-1 based on distance to finish)
            const distanceToFinish = Math.abs(botState.position.y - 60);
            botState.progress = Math.max(0, 1 - (distanceToFinish / (height - 130)));
            
            // Update bot in store
            state.updateBotPosition(bot.id, botState.position);
            
            // Update bot sprite
            const botSprite = botSpritesRef.current.get(bot.id);
            if (botSprite) {
              botSprite.x = botState.position.x;
              botSprite.y = botState.position.y;
              botSprite.rotation = botState.position.rotation;
            }
          });

          // Don't allow movement after finishing
          if (state.hasFinished) {
            return;
          }

          // Update car sprite
          if (carSpriteRef.current) {
            carSpriteRef.current.x = newX;
            carSpriteRef.current.y = newY;
            carSpriteRef.current.rotation = newRotation;
          }

          // Make camera follow player car
          if (viewportRef.current && carSpriteRef.current) {
            const viewport = viewportRef.current;
            viewport.follow(carSpriteRef.current, {
              speed: 8,
              radius: 50,
              acceleration: 0.02
            });
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
      finishLineRef.current = null;
      botSpritesRef.current.clear();
      difficultyCheckpointSpritesRef.current.clear();
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