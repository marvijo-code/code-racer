import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { useGameStore } from '../state/gameStore';
import type { BotCar, DifficultyCheckpoint } from '../state/gameStore';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
import { soundManager } from '../utils/SoundManager';

interface RaceTrackProps {
  width: number;
  height: number;
}

export const RaceTrack: React.FC<RaceTrackProps> = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const carSpriteRef = useRef<PIXI.Graphics | null>(null);
  const trackRef = useRef<PIXI.Graphics | null>(null);

  const botSpritesRef = useRef<Map<string, PIXI.Graphics>>(new Map());
  const exhaustParticlesRef = useRef<PIXI.ParticleContainer | null>(null);
  const difficultyCheckpointSpritesRef = useRef<Map<string, PIXI.Container>>(new Map());
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const [pixiInitialized, setPixiInitialized] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [webglContextLost, setWebglContextLost] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  const {
    carPosition,
    updateCarPosition,
    isRacing,
    bots,
    setBots,
    updateBotPosition,
    difficultyCheckpoints,
    setDifficultyCheckpoints,
    updateCheckpoint,
    speedBoost,
    setSpeedBoost,
  } = useGameStore();

  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);
  const [engineStarted, setEngineStarted] = useState<boolean>(false);
  const [isBraking, setIsBraking] = useState<boolean>(false);

  // WebGL context recovery function
  const handleWebGLContextLost = (event: Event) => {
    console.warn('WebGL context lost, attempting recovery...');
    event.preventDefault();
    setWebglContextLost(true);
    setPixiInitialized(false);
    
    // Clean up current PIXI instance
    if (appRef.current) {
      appRef.current.destroy(true, true);
      appRef.current = null;
    }
  };

  const handleWebGLContextRestored = () => {
    console.log('WebGL context restored, reinitializing PIXI...');
    setWebglContextLost(false);
    
    // Retry initialization with a delay
    setTimeout(() => {
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        initializePixi();
      } else {
        console.error('Max WebGL recovery retries reached');
      }
    }, 1000);
  };

  // Auto-collapse HUD on small mobile screens
  useEffect(() => {
    const checkScreenSize = () => {
      const isSmallScreen = window.innerWidth <= 480;
      if (isSmallScreen && !hudCollapsed) {
        setHudCollapsed(true);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [hudCollapsed]);

  // Function to create realistic car graphics with optimized textures
  const createRealisticCar = (bodyColor: number, isPlayer: boolean = false) => {
    const car = new PIXI.Graphics();
    
    // Ensure bodyColor is valid, fallback to white if undefined
    const safeBodyColor = bodyColor || 0xFFFFFF;
    
    // Car body (main rectangle)
    car.roundRect(-15, -8, 30, 16, 3).fill({ color: safeBodyColor });
    
    // Car roof (darker shade)
    const roofColor = Math.max(0, safeBodyColor - 0x222222); // Ensure valid color
    car.roundRect(-10, -6, 20, 12, 2).fill({ color: roofColor });
    
    // Windshield (front)
    car.roundRect(-14, -6, 6, 12, 1).fill({ color: 0x87CEEB });
    
    // Rear window
    car.roundRect(8, -6, 6, 12, 1).fill({ color: 0x87CEEB });
    
    // Side windows
    car.roundRect(-6, -7, 12, 3, 1).fill({ color: 0x87CEEB });
    car.roundRect(-6, 4, 12, 3, 1).fill({ color: 0x87CEEB });
    
    // Headlights
    car.circle(-16, -5, 2).fill({ color: 0xFFFFFF });
    car.circle(-16, 5, 2).fill({ color: 0xFFFFFF });
    
    // Taillights
    car.circle(16, -5, 1.5).fill({ color: 0xFF0000 });
    car.circle(16, 5, 1.5).fill({ color: 0xFF0000 });
    
    // Wheels
    car.circle(-8, -9, 3).fill({ color: 0x333333 });
    car.circle(-8, 9, 3).fill({ color: 0x333333 });
    car.circle(8, -9, 3).fill({ color: 0x333333 });
    car.circle(8, 9, 3).fill({ color: 0x333333 });
    
    // Wheel rims
    car.circle(-8, -9, 1.5).fill({ color: 0x666666 });
    car.circle(-8, 9, 1.5).fill({ color: 0x666666 });
    car.circle(8, -9, 1.5).fill({ color: 0x666666 });
    car.circle(8, 9, 1.5).fill({ color: 0x666666 });
    
    // Player car gets special details
    if (isPlayer) {
      // Racing stripes
      car.roundRect(-2, -8, 4, 16, 1).fill({ color: 0xFFFFFF });
      // Racing number
      car.circle(0, 0, 4).fill({ color: 0xFFFFFF });
      // Add a subtle glow effect
      car.circle(0, 0, 18).fill({ color: safeBodyColor, alpha: 0.3 });
    } else {
      // Bot car gets a simple identifier
      car.circle(0, 0, 3).fill({ color: 0xFFFFFF });
      // Add slight transparency to distinguish from player
      car.alpha = 0.9;
    }
    
    return car;
  };

  // Generate AI bots with different skill levels
  const generateBots = (): BotCar[] => {
    const skillLevels: BotCar['skillLevel'][] = ['Beginner', 'Intermediate', 'Expert', 'Master'];
    const botColors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFECA57];
    
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
          x: 0, // Will be set properly in initPixi
          y: 0, // Will be set properly in initPixi
          rotation: -Math.PI / 2, // Point upward like player
          speed: 0, // Start stationary like player for realistic physics
        },
        color: botColors[index] || 0xFFFFFF, // Fallback to white if color is undefined
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
    const colors = [
      0xFF6B6B, // Red - Easy (1-2)
      0xFF8E53, // Orange - Easy-Medium (2-3)
      0xFF9F43, // Orange-Yellow - Medium (3-4)
      0xFFD93D, // Yellow - Medium (4-5)
      0x6BCF7F, // Light Green - Medium-Hard (5-6)
      0x4ECDC4, // Teal - Hard (6-7)
      0x45B7D1, // Light Blue - Hard (7-8)
      0x96CEB4, // Mint - Very Hard (8-9)
      0xB19CD9  // Purple - Expert (9-10)
    ];

    for (let i = 0; i < 9; i++) {
      const difficulty = i + 1;
      const speedBoost = 1.0 + (difficulty * 0.05); // 1.05x to 1.45x boost
      
      checkpoints.push({
        id: `checkpoint_${i}`,
        x: 300 + (i % 2) * 200 + Math.random() * 100, // Alternate left/right with variation
        y: 1500 - (i * 150), // Spread vertically up the track
        difficulty,
        completed: false,
        speedBoost,
        color: colors[i]
      });
    }
    
    return checkpoints;
  };

  // Separated PIXI initialization function for reuse
  const initializePixi = async () => {
    if (!canvasReady) return;

    const container = canvasRef.current;
    if (!container) return;

    try {
      console.log('Starting PIXI initialization...');
      
      // Create new PIXI application with WebGL optimizations
      const app = new PIXI.Application();
      
      // Enhanced initialization with WebGL context recovery
      await app.init({
        resizeTo: container,
        backgroundColor: '#228B22',
        antialias: true,
        powerPreference: 'high-performance', // Request high-performance GPU
        premultipliedAlpha: false, // Fix alpha-premult warning
        preserveDrawingBuffer: false, // Optimize memory usage
        clearBeforeRender: true,
        resolution: Math.min(window.devicePixelRatio, 2), // Limit resolution for performance
        autoDensity: true
      });

      console.log('PIXI app initialized successfully');

      // Clear container and add canvas
      container.innerHTML = '';
      container.appendChild(app.canvas);
      appRef.current = app;
      
      // Add WebGL context event listeners to the canvas
      const canvas = app.canvas as HTMLCanvasElement;
      canvas.addEventListener('webglcontextlost', handleWebGLContextLost, false);
      canvas.addEventListener('webglcontextrestored', handleWebGLContextRestored, false);
      
      console.log('Canvas added to DOM with WebGL context handlers');

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

      // --- Create Professional Vertical Race Track ---
      const track = new PIXI.Graphics();
      
      // Track background (asphalt gray)
      track.roundRect(200, 200, worldWidth - 400, worldHeight - 400, 20).fill({ color: 0x2a2a2a });
      
      // Track borders (white lines)
      track.roundRect(200, 200, worldWidth - 400, worldHeight - 400, 20).stroke({ width: 8, color: 0xffffff });
      
      // Center dividing lines (dashed yellow lines down the middle)
      const centerX = worldWidth / 2;
      const dashLength = 40;
      const gapLength = 30;
      const lineWidth = 4;
      
      for (let y = 220; y < worldHeight - 220; y += dashLength + gapLength) {
        track.roundRect(centerX - lineWidth/2, y, lineWidth, Math.min(dashLength, worldHeight - 220 - y), 2).fill({ color: 0xffff00 });
      }
      
      // Start/Finish line at bottom (checkered pattern)
      const finishY = worldHeight - 250;
      const squareSize = 20;
      for (let x = 220; x < worldWidth - 220; x += squareSize) {
        for (let i = 0; i < 2; i++) {
          const color = ((x - 220) / squareSize + i) % 2 === 0 ? 0xffffff : 0x000000;
          track.roundRect(x, finishY + i * squareSize, squareSize, squareSize, 0).fill({ color });
        }
      }
      
      viewport.addChild(track);
      trackRef.current = track;

      // Create realistic player car
      const car = createRealisticCar(0x0066FF, true);
      
      // Position car at the bottom center of the track (within track boundaries)
      const trackMargin = 250; // Distance from track edge
      car.x = worldWidth / 2; // Center horizontally
      car.y = worldHeight - trackMargin; // Near bottom, within track
      car.rotation = -Math.PI / 2; // Point upward
      
      viewport.addChild(car);
      carSpriteRef.current = car;

      // Configure viewport following with better settings
      viewport.follow(car, { 
        speed: 12, // Faster following
        acceleration: 0.08, // Smoother acceleration
        radius: 100 // Larger follow radius for smoother movement
      });
      
      // Center the viewport on the car initially
      viewport.moveCenter(car.x, car.y);
      
      if (isMobileDevice) {
        viewport.setZoom(0.6, true); // Zoom out more on mobile for better view
      } else {
        viewport.setZoom(0.8, true); // Slightly zoomed out on desktop
      }
      
      // Update the game store with correct initial position
      updateCarPosition({
        x: car.x,
        y: car.y,
        rotation: car.rotation,
        speed: 0
      });

      // Create bot cars (if bots exist in game state)
      bots.forEach((bot, index) => {
        const botCar = createRealisticCar(bot.color, false);
        
        // Position bots near the player car but spread out horizontally
        const trackMargin = 250; // Distance from track edge
        botCar.x = (worldWidth / 2) + (index - 2) * 80; // Spread around center with more spacing
        botCar.y = worldHeight - trackMargin + (index * 15); // Slightly staggered
        botCar.rotation = -Math.PI / 2; // Point upward like player
        
        viewport.addChild(botCar);
        botSpritesRef.current.set(bot.id, botCar);
        
        // Update bot position in store
        updateBotPosition(bot.id, {
          x: botCar.x,
          y: botCar.y,
          rotation: botCar.rotation,
          speed: 0
        });
      });
      
      // If no bots exist yet, create them
      if (bots.length === 0) {
        const newBots = generateBots();
        setBots(newBots);
        
        // Create bot sprites for the newly generated bots
        newBots.forEach((bot, index) => {
          const botCar = createRealisticCar(bot.color, false);
          
          const trackMargin = 250;
          botCar.x = (worldWidth / 2) + (index - 2) * 80;
          botCar.y = worldHeight - trackMargin + (index * 15);
          botCar.rotation = -Math.PI / 2;
          
          viewport.addChild(botCar);
          botSpritesRef.current.set(bot.id, botCar);
        });
      }

      // Create professional difficulty checkpoints with numbers
      difficultyCheckpoints.forEach(checkpoint => {
        const checkpointContainer = new PIXI.Container();
        
        // Balloon shape (circle with pointer at bottom)
        const balloon = new PIXI.Graphics();
        
        // Main balloon circle
        balloon.circle(0, -10, 30).fill({ color: checkpoint.color });
        balloon.circle(0, -10, 28).stroke({ width: 3, color: 0xffffff });
        
        // Balloon pointer (triangle at bottom)
        balloon.moveTo(-8, 15).lineTo(8, 15).lineTo(0, 25).lineTo(-8, 15).fill({ color: checkpoint.color });
        balloon.moveTo(-8, 15).lineTo(8, 15).lineTo(0, 25).lineTo(-8, 15).stroke({ width: 2, color: 0xffffff });
        
        // Add difficulty number text
        const difficultyText = new PIXI.Text({
          text: checkpoint.difficulty.toString(),
          style: {
            fontFamily: 'Arial, sans-serif',
            fontSize: 24,
            fontWeight: 'bold',
            fill: 0xffffff,
            align: 'center'
          }
        });
        difficultyText.anchor.set(0.5);
        difficultyText.x = 0;
        difficultyText.y = -10;
        
        checkpointContainer.addChild(balloon);
        checkpointContainer.addChild(difficultyText);
        
        checkpointContainer.x = checkpoint.x;
        checkpointContainer.y = checkpoint.y;
        viewport.addChild(checkpointContainer);
        difficultyCheckpointSpritesRef.current.set(checkpoint.id, checkpointContainer);
      });

      // Create optimized exhaust particle system
      const exhaustParticles = new PIXI.ParticleContainer();
      viewport.addChild(exhaustParticles);
      exhaustParticlesRef.current = exhaustParticles;
      
      // Define track boundaries once (accessible in game loop)
      const carMargin = 30; // Half car width/height plus some buffer
      const trackBounds = {
        left: 200 + carMargin,
        right: worldWidth - 200 - carMargin,
        top: 200 + carMargin,
        bottom: worldHeight - 200 - carMargin
      };

      console.log('PIXI initialization completed successfully!');
      setPixiInitialized(true);
      setRetryCount(0); // Reset retry count on successful initialization

      // --- Game Loop ---
      app.ticker.add(() => {
        const state = useGameStore.getState();
        if (!state.isRacing || !carSpriteRef.current) return;
        
        let newSpeed = state.carPosition.speed;
        const maxSpeed = 15; // Increased maximum speed for better movement
        const acceleration = 0.5; // Much higher acceleration for better responsiveness
        const deceleration = 0.8; // Increased braking for better control
        const friction = 0.85; // Slightly increased friction for better feel
        
        // Start engine sound when racing begins
        if (!engineStarted) {
          soundManager.startEngine();
          setEngineStarted(true);
        }
        
        // Speed control with realistic physics
        const isAccelerating = keysRef.current['ArrowUp'] || keysRef.current['KeyW'];
        const isBrakingNow = keysRef.current['ArrowDown'] || keysRef.current['KeyS'];
        
        if (isAccelerating) {
          newSpeed = Math.min(maxSpeed, newSpeed + acceleration);
        } else if (isBrakingNow) {
          newSpeed = Math.max(-maxSpeed * 0.5, newSpeed - deceleration); // Reverse at half max speed
          
          // Play brake sound if just started braking and moving forward
          if (!isBraking && Math.abs(newSpeed) > 0.5) {
            soundManager.playBrakeSound();
            setIsBraking(true);
          }
        } else {
          newSpeed *= friction; // Natural friction when no input
          setIsBraking(false);
        }
        
        // Update engine sound based on speed
        soundManager.updateEngineSound(newSpeed, maxSpeed);
        
        // Speed-dependent turning for more realistic handling
        const currentSpeedRatio = Math.abs(newSpeed) / maxSpeed;
        const baseTurningSpeed = 0.04; // Increased for better responsiveness
        const turningSpeed = baseTurningSpeed * (0.5 + 0.5 * currentSpeedRatio); // Better turning at all speeds
        
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
          carSpriteRef.current.rotation -= turningSpeed;
        }
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
          carSpriteRef.current.rotation += turningSpeed;
        }

        // Apply speed boost from checkpoints
        const effectiveSpeed = newSpeed * state.speedBoost;
        
        // Calculate new position
        const newX = carSpriteRef.current.x + Math.cos(carSpriteRef.current.rotation) * effectiveSpeed;
        const newY = carSpriteRef.current.y + Math.sin(carSpriteRef.current.rotation) * effectiveSpeed;
        
        // Boundary checking
        const constrainedX = Math.max(trackBounds.left, Math.min(trackBounds.right, newX));
        const constrainedY = Math.max(trackBounds.top, Math.min(trackBounds.bottom, newY));
        
        carSpriteRef.current.x = constrainedX;
        carSpriteRef.current.y = constrainedY;
        
        // If hitting a boundary, reduce speed for realistic collision
        if (newX !== constrainedX || newY !== constrainedY) {
          newSpeed *= 0.3; // Reduce speed when hitting walls
          soundManager.playBrakeSound(); // Play collision sound
        }
        
        // Generate optimized exhaust particles when accelerating
        if (isAccelerating && Math.abs(newSpeed) > 0.5 && exhaustParticlesRef.current) {
          // Limit particle generation to prevent memory issues
          if (exhaustParticlesRef.current.children.length < 500) {
            // Create exhaust particle behind the car
            const exhaustX = carSpriteRef.current.x - Math.cos(carSpriteRef.current.rotation) * 20;
            const exhaustY = carSpriteRef.current.y - Math.sin(carSpriteRef.current.rotation) * 20;
            
            for (let i = 0; i < 2; i++) {
              const particle = new PIXI.Graphics();
              const size = 2 + Math.random() * 3;
              const alpha = 0.3 + Math.random() * 0.4;
              
              particle.circle(0, 0, size).fill({ color: 0x666666, alpha });
              particle.x = exhaustX + (Math.random() - 0.5) * 10;
              particle.y = exhaustY + (Math.random() - 0.5) * 10;
              
              // Add random velocity away from car
              const particleVelX = -Math.cos(carSpriteRef.current.rotation) * (1 + Math.random());
              const particleVelY = -Math.sin(carSpriteRef.current.rotation) * (1 + Math.random());
              
              exhaustParticlesRef.current.addChild(particle);
              
              // Animate particle with cleanup
              const startTime = Date.now();
              const animateParticle = () => {
                const elapsed = Date.now() - startTime;
                if (elapsed > 1000 || !exhaustParticlesRef.current || !particle.parent) {
                  if (particle.parent) {
                    particle.parent.removeChild(particle);
                    particle.destroy();
                  }
                  return;
                }
                
                particle.x += particleVelX;
                particle.y += particleVelY;
                particle.alpha = Math.max(0, alpha * (1 - elapsed / 1000));
                
                requestAnimationFrame(animateParticle);
              };
              
              animateParticle();
            }
          }
        }
        
        // Check checkpoint collisions
        state.difficultyCheckpoints.forEach(checkpoint => {
          if (!checkpoint.completed) {
            const distance = Math.sqrt(
              Math.pow(carSpriteRef.current!.x - checkpoint.x, 2) + 
              Math.pow(carSpriteRef.current!.y - checkpoint.y, 2)
            );
            
            // Collision radius of ~40 pixels
            if (distance < 40) {
              // Play checkpoint sound
              soundManager.playCheckpointSound();
              
              // Apply speed boost
              const newBoost = checkpoint.speedBoost;
              setSpeedBoost(newBoost);
              
              // Play boost sound if significant boost
              if (newBoost > 1.3) {
                soundManager.playBoostSound();
              }
              
              // Mark checkpoint as completed
              updateCheckpoint(checkpoint.id, true);
              
              // Start boost decay after 3 seconds
              setTimeout(() => {
                const currentState = useGameStore.getState();
                if (currentState.speedBoost === newBoost) {
                  setSpeedBoost(Math.max(1.0, newBoost - 0.1));
                }
              }, 3000);
            }
          }
        });
        
        updateCarPosition({
          x: carSpriteRef.current.x,
          y: carSpriteRef.current.y,
          rotation: carSpriteRef.current.rotation,
          speed: newSpeed,
        });

        // Update bot AI movement
        state.bots.forEach(bot => {
          const botSprite = botSpritesRef.current.get(bot.id);
          if (!botSprite) return;

          // Simple AI: move towards finish line (top of track) with some variation
          const botSpeed = 2 + (bot.aiPersonality.aggressiveness * 3); // 2-5 speed based on personality
          
          // Add some random movement for realism
          const randomOffset = (Math.random() - 0.5) * bot.aiPersonality.consistency * 20;
          
          // Move bot upward with slight horizontal variation
          botSprite.y -= botSpeed;
          botSprite.x += randomOffset;
          
          // Keep bots within track bounds
          const botTrackBounds = {
            left: 230,
            right: worldWidth - 230,
            top: 230,
            bottom: worldHeight - 230
          };
          
          botSprite.x = Math.max(botTrackBounds.left, Math.min(botTrackBounds.right, botSprite.x));
          botSprite.y = Math.max(botTrackBounds.top, Math.min(botTrackBounds.bottom, botSprite.y));
          
          // Calculate progress (0 = start, 1 = finish)
          const startY = worldHeight - 250;
          const finishY = 300;
          const progress = Math.max(0, Math.min(1, (startY - botSprite.y) / (startY - finishY)));
          
          // Update bot position in store
          updateBotPosition(bot.id, {
            x: botSprite.x,
            y: botSprite.y,
            rotation: botSprite.rotation,
            speed: botSpeed
          });
          
          // Update progress
          const updatedBot = { ...bot, progress };
          if (progress >= 1 && !bot.hasFinished) {
            updatedBot.hasFinished = true;
          }
        });
      });
    } catch (error) {
      console.error('PIXI initialization failed:', error);
      setPixiInitialized(false);
      
      // Attempt recovery if not at max retries
      if (retryCount < maxRetries) {
        console.log(`Retrying PIXI initialization (${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          initializePixi();
        }, 2000);
      }
    }
  };

  useEffect(() => {
    // Checkpoints are now generated in PIXI initialization
    if (isRacing && difficultyCheckpoints.length === 0) {
      setDifficultyCheckpoints(generateDifficultyCheckpoints());
    }
  }, [isRacing, difficultyCheckpoints.length, setDifficultyCheckpoints]);

  useEffect(() => {
    if (canvasRef.current) {
      setCanvasReady(true);
    }
  }, []);

  useEffect(() => {
    if (canvasReady && !webglContextLost) {
      initializePixi();
    }

    return () => {
      if (appRef.current) {
        // Remove WebGL context event listeners
        const canvas = appRef.current.canvas as HTMLCanvasElement;
        canvas.removeEventListener('webglcontextlost', handleWebGLContextLost);
        canvas.removeEventListener('webglcontextrestored', handleWebGLContextRestored);
        
        appRef.current.destroy(true, true);
        appRef.current = null;
      }
      // Clean up sound manager
      soundManager.stopEngine();
    };
  }, [canvasReady, webglContextLost]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('Key down:', event.code);
      keysRef.current = { ...keysRef.current, [event.code]: true };
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      console.log('Key up:', event.code);
      keysRef.current = { ...keysRef.current, [event.code]: false };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  if (!pixiInitialized) {
    return (
      <div className="race-track-container">
        <div className="race-track">
          <div ref={canvasRef} className="race-canvas" style={{ display: 'none' }} />
          <div className="loading-track">
            <p>Loading race track...</p>
            <p style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
              Canvas Ready: {canvasReady ? 'Yes' : 'No'} | Check browser console for details
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="race-track-container">
      <div className="race-track">
        {/* PIXI Canvas */}
        <div ref={canvasRef} className="race-canvas" />
        
        {/* HUD Overlay - Full Screen Game UI */}
        <div className={`race-hud ${hudCollapsed ? 'collapsed' : ''}`}>
          {/* Top Section - Speed and Status */}
          <div className="hud-top">
        <div className="speed-meter">
              🏎️ Speed: {Math.abs(carPosition.speed).toFixed(1)} 
              {speedBoost > 1 && <span style={{color: '#00ff00'}}> ⚡ BOOST {speedBoost.toFixed(1)}x</span>}
        </div>
        <div className="position">
              📍 Position: ({carPosition.x.toFixed(0)}, {carPosition.y.toFixed(0)})
            </div>
        </div>

          {/* Left Side - Bot Info */}
          {!hudCollapsed && (
            <div className="hud-left">
        <div className="bot-info">
                <h4>🏆 Race Standings</h4>
          {bots.map((bot, index) => (
            <div key={bot.id} style={{color: `#${(bot.color || 0xFFFFFF).toString(16).padStart(6, '0')}`}}>
              {index + 1}. {bot.name} ({bot.skillLevel}) - {(bot.progress * 100).toFixed(1)}%
            </div>
          ))}
        </div>
            </div>
          )}

          {/* Bottom Section - Controls Help */}
          {!hudCollapsed && (
            <div className="hud-bottom">
        <div className="controls">
                <div className="control-hint">
                  <span className="key">WASD</span> or <span className="key">Arrow Keys</span> to drive
                </div>
                <div className="control-hint">
                  Drive through <span style={{color: '#00ff00'}}>colored checkpoints</span> for speed boosts!
                </div>
                <div className="control-hint">
                  🍔 Open menu (top-right) for more options
                </div>
              </div>
            </div>
          )}

          {/* Mobile Toggle Button */}
          <div className="hud-toggle" onClick={() => setHudCollapsed(!hudCollapsed)}>
            {hudCollapsed ? '📊' : '📉'}
          </div>
          
          {/* Minimal HUD when collapsed */}
          {hudCollapsed && (
            <div className="hud-minimal">
              <div className="speed-compact">
                🏎️ {Math.abs(carPosition.speed).toFixed(1)}
                {speedBoost > 1 && <span style={{color: '#00ff00'}}>⚡</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 