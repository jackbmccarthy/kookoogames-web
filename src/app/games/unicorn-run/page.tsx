'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Game constants
const GRAVITY = 0.6;
const JUMP_FORCE = -14;
const MOVE_SPEED = 5;
const CLIMB_SPEED = 3;
const GROUND_Y = 400;

// Colors for unicorn customization
const UNICORN_COLORS = {
  body: ['#FFB6C1', '#DDA0DD', '#87CEEB', '#98FB98', '#FFE4B5', '#FFC0CB', '#E6E6FA', '#B0E0E6'],
  mane: ['#FF69B4', '#FF1493', '#DA70D6', '#9370DB', '#8A2BE2', '#FFD700', '#FF6347', '#00CED1'],
  horn: ['#FFD700', '#FFC0CB', '#FFFFFF', '#FF69B4', '#00FFFF'],
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'hole' | 'tree' | 'rock' | 'tallTree';
  platform?: { x: number; y: number; width: number; height: number }[];
}

interface Cloud {
  x: number;
  y: number;
  width: number;
  speed: number;
}

interface Flower {
  x: number;
  y: number;
  color: string;
  size: number;
}

interface Rainbow {
  x: number;
  y: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  twinkle: number;
}

interface Butterfly {
  x: number;
  y: number;
  color: string;
  wingPhase: number;
  speed: number;
}

interface GameState {
  unicorn: {
    x: number;
    y: number;
    vy: number;
    vx: number;
    width: number;
    height: number;
    isJumping: boolean;
    isClimbing: boolean;
    isOnGround: boolean;
    facingRight: boolean;
    animFrame: number;
  };
  camera: {
    x: number;
  };
  score: number;
  gameOver: boolean;
  started: boolean;
  obstacles: Obstacle[];
  particles: Particle[];
  clouds: Cloud[];
  flowers: Flower[];
  rainbows: Rainbow[];
  stars: Star[];
  butterflies: Butterfly[];
}

export default function UnicornRun() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  
  const [customization, setCustomization] = useState({
    bodyColor: UNICORN_COLORS.body[0],
    maneColor: UNICORN_COLORS.mane[0],
    hornColor: UNICORN_COLORS.horn[0],
  });
  const [showCustomize, setShowCustomize] = useState(false);
  const [highScore, setHighScore] = useState(0);
  
  const gameStateRef = useRef<GameState>({
    unicorn: {
      x: 100,
      y: GROUND_Y - 60,
      vy: 0,
      vx: 0,
      width: 60,
      height: 60,
      isJumping: false,
      isClimbing: false,
      isOnGround: true,
      facingRight: true,
      animFrame: 0,
    },
    camera: { x: 0 },
    score: 0,
    gameOver: false,
    started: false,
    obstacles: [],
    particles: [],
    clouds: [],
    flowers: [],
    rainbows: [],
    stars: [],
    butterflies: [],
  });

  // Generate obstacles
  const generateObstacles = useCallback((startX: number, count: number): Obstacle[] => {
    const obstacles: Obstacle[] = [];
    let lastX = startX;
    
    for (let i = 0; i < count; i++) {
      const gap = 300 + Math.random() * 400;
      const type = ['hole', 'tree', 'rock', 'tallTree'][Math.floor(Math.random() * 4)] as Obstacle['type'];
      
      let obstacle: Obstacle = {
        x: lastX + gap,
        y: GROUND_Y,
        width: 0,
        height: 0,
        type,
      };
      
      switch (type) {
        case 'hole':
          obstacle.width = 80 + Math.random() * 60;
          obstacle.height = 60;
          obstacle.y = GROUND_Y;
          break;
        case 'tree':
          obstacle.width = 40;
          obstacle.height = 100;
          obstacle.y = GROUND_Y - 100;
          break;
        case 'rock':
          obstacle.width = 50 + Math.random() * 30;
          obstacle.height = 40;
          obstacle.y = GROUND_Y - 40;
          break;
        case 'tallTree':
          obstacle.width = 50;
          obstacle.height = 250;
          obstacle.y = GROUND_Y - 250;
          obstacle.platform = [
            { x: obstacle.x - 30, y: obstacle.y + 80, width: 110, height: 20 },
            { x: obstacle.x - 20, y: obstacle.y + 150, width: 90, height: 20 },
          ];
          break;
      }
      
      obstacles.push(obstacle);
      lastX = obstacle.x + obstacle.width;
    }
    
    return obstacles;
  }, []);

  // Generate background elements
  const generateBackground = useCallback(() => {
    const state = gameStateRef.current;
    
    // Clouds
    state.clouds = [];
    for (let i = 0; i < 10; i++) {
      state.clouds.push({
        x: Math.random() * 2000,
        y: 30 + Math.random() * 100,
        width: 80 + Math.random() * 120,
        speed: 0.3 + Math.random() * 0.5,
      });
    }
    
    // Flowers
    state.flowers = [];
    const flowerColors = ['#FF69B4', '#FFB6C1', '#DDA0DD', '#FFE4E1', '#FFC0CB', '#FFD700'];
    for (let i = 0; i < 50; i++) {
      state.flowers.push({
        x: Math.random() * 5000,
        y: GROUND_Y - 5 - Math.random() * 15,
        color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
        size: 8 + Math.random() * 12,
      });
    }
    
    // Rainbows
    state.rainbows = [];
    for (let i = 0; i < 3; i++) {
      state.rainbows.push({
        x: 500 + i * 1500 + Math.random() * 500,
        y: 50,
      });
    }
    
    // Stars
    state.stars = [];
    for (let i = 0; i < 30; i++) {
      state.stars.push({
        x: Math.random() * 3000,
        y: 20 + Math.random() * 150,
        size: 2 + Math.random() * 4,
        twinkle: Math.random() * Math.PI * 2,
      });
    }
    
    // Butterflies
    state.butterflies = [];
    const butterflyColors = ['#FF69B4', '#FFD700', '#00CED1', '#FF6347', '#9370DB'];
    for (let i = 0; i < 8; i++) {
      state.butterflies.push({
        x: Math.random() * 2000,
        y: 100 + Math.random() * 200,
        color: butterflyColors[Math.floor(Math.random() * butterflyColors.length)],
        wingPhase: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 2,
      });
    }
  }, []);

  // Initialize game
  const initGame = useCallback(() => {
    const state = gameStateRef.current;
    state.unicorn = {
      x: 100,
      y: GROUND_Y - 60,
      vy: 0,
      vx: 0,
      width: 60,
      height: 60,
      isJumping: false,
      isClimbing: false,
      isOnGround: true,
      facingRight: true,
      animFrame: 0,
    };
    state.camera = { x: 0 };
    state.score = 0;
    state.gameOver = false;
    state.started = true;
    state.obstacles = generateObstacles(500, 20);
    state.particles = [];
    generateBackground();
  }, [generateObstacles, generateBackground]);

  // Draw functions
  const drawCloud = (ctx: CanvasRenderingContext2D, cloud: Cloud, cameraX: number) => {
    const x = cloud.x - cameraX * 0.3;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x, cloud.y, cloud.width * 0.3, 0, Math.PI * 2);
    ctx.arc(x + cloud.width * 0.25, cloud.y - 10, cloud.width * 0.25, 0, Math.PI * 2);
    ctx.arc(x + cloud.width * 0.5, cloud.y, cloud.width * 0.35, 0, Math.PI * 2);
    ctx.arc(x + cloud.width * 0.75, cloud.y - 5, cloud.width * 0.2, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawRainbow = (ctx: CanvasRenderingContext2D, rainbow: Rainbow, cameraX: number) => {
    const x = rainbow.x - cameraX * 0.2;
    const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
    const radius = 120;
    
    colors.forEach((color, i) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(x, rainbow.y + 150, radius - i * 8, Math.PI, 0, false);
      ctx.stroke();
    });
  };

  const drawFlower = (ctx: CanvasRenderingContext2D, flower: Flower, cameraX: number) => {
    const x = flower.x - cameraX;
    if (x < -50 || x > 850) return;
    
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x - 1, flower.y, 2, 15);
    
    ctx.fillStyle = flower.color;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(
        x + Math.cos(angle) * flower.size * 0.4,
        flower.y + Math.sin(angle) * flower.size * 0.4,
        flower.size * 0.4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, flower.y, flower.size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawStar = (ctx: CanvasRenderingContext2D, star: Star, cameraX: number, time: number) => {
    const x = star.x - cameraX * 0.1;
    const twinkle = Math.sin(time * 0.005 + star.twinkle) * 0.5 + 0.5;
    
    ctx.fillStyle = `rgba(255, 255, 200, ${0.5 + twinkle * 0.5})`;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const r = star.size * (i % 2 === 0 ? 1 : 0.5);
      if (i === 0) ctx.moveTo(x + Math.cos(angle) * r, star.y + Math.sin(angle) * r);
      else ctx.lineTo(x + Math.cos(angle) * r, star.y + Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
  };

  const drawButterfly = (ctx: CanvasRenderingContext2D, butterfly: Butterfly, cameraX: number, time: number) => {
    const x = butterfly.x - cameraX;
    const wingAngle = Math.sin(time * 0.02 + butterfly.wingPhase) * 0.5;
    
    ctx.fillStyle = butterfly.color;
    ctx.save();
    ctx.translate(x, butterfly.y);
    
    // Left wing
    ctx.save();
    ctx.rotate(-wingAngle);
    ctx.beginPath();
    ctx.ellipse(-10, 0, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Right wing
    ctx.save();
    ctx.rotate(wingAngle);
    ctx.beginPath();
    ctx.ellipse(10, 0, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Body
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(0, 0, 3, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };

  const drawUnicorn = (ctx: CanvasRenderingContext2D, cameraX: number, time: number) => {
    const state = gameStateRef.current;
    const u = state.unicorn;
    const x = u.x - cameraX;
    const y = u.y;
    
    ctx.save();
    ctx.translate(x, y);
    if (!u.facingRight) {
      ctx.scale(-1, 1);
      ctx.translate(-u.width, 0);
    }
    
    // Leg animation
    const legOffset = u.isOnGround ? Math.sin(time * 0.01) * 5 : 0;
    
    // Back legs
    ctx.fillStyle = customization.bodyColor;
    ctx.fillRect(10, 40, 10, 25 + (u.isOnGround ? legOffset : 0));
    ctx.fillRect(35, 40, 10, 25 + (u.isOnGround ? -legOffset : 0));
    
    // Hooves
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(10, 62 + (u.isOnGround ? legOffset : 0), 10, 6);
    ctx.fillRect(35, 62 + (u.isOnGround ? -legOffset : 0), 10, 6);
    
    // Body
    ctx.fillStyle = customization.bodyColor;
    ctx.beginPath();
    ctx.ellipse(30, 35, 25, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Tail
    ctx.strokeStyle = customization.maneColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(5, 30);
    const tailWave = Math.sin(time * 0.008) * 10;
    ctx.quadraticCurveTo(-15 + tailWave, 35, -20 + tailWave, 50);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5, 35);
    ctx.quadraticCurveTo(-10 + tailWave, 45, -15 + tailWave, 60);
    ctx.stroke();
    
    // Front legs
    ctx.fillStyle = customization.bodyColor;
    ctx.fillRect(15, 40, 10, 25 + (u.isOnGround ? -legOffset : 0));
    ctx.fillRect(40, 40, 10, 25 + (u.isOnGround ? legOffset : 0));
    
    // Hooves (front)
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(15, 62 + (u.isOnGround ? -legOffset : 0), 10, 6);
    ctx.fillRect(40, 62 + (u.isOnGround ? legOffset : 0), 10, 6);
    
    // Neck
    ctx.fillStyle = customization.bodyColor;
    ctx.beginPath();
    ctx.moveTo(45, 25);
    ctx.lineTo(55, 5);
    ctx.lineTo(65, 5);
    ctx.lineTo(55, 35);
    ctx.closePath();
    ctx.fill();
    
    // Head
    ctx.beginPath();
    ctx.ellipse(62, 8, 15, 12, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Ear
    ctx.beginPath();
    ctx.moveTo(55, -5);
    ctx.lineTo(52, -15);
    ctx.lineTo(58, -8);
    ctx.closePath();
    ctx.fill();
    
    // Horn
    const gradient = ctx.createLinearGradient(62, -10, 62, -35);
    gradient.addColorStop(0, customization.hornColor);
    gradient.addColorStop(0.5, '#FFFFFF');
    gradient.addColorStop(1, customization.hornColor);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(58, -10);
    ctx.lineTo(62, -40);
    ctx.lineTo(66, -10);
    ctx.closePath();
    ctx.fill();
    
    // Horn spiral
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(62, -15 - i * 5, 3 - i * 0.3, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Mane
    ctx.fillStyle = customization.maneColor;
    for (let i = 0; i < 6; i++) {
      const maneWave = Math.sin(time * 0.01 + i * 0.5) * 3;
      ctx.beginPath();
      ctx.arc(50 - i * 6, 10 + i * 4 + maneWave, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(68, 5, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(69, 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyelashes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(70 + i * 2, 2);
      ctx.lineTo(72 + i * 2, -2);
      ctx.stroke();
    }
    
    // Blush
    ctx.fillStyle = 'rgba(255, 150, 150, 0.5)';
    ctx.beginPath();
    ctx.ellipse(58, 12, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Sparkles around unicorn
    if (Math.random() < 0.1) {
      state.particles.push({
        x: x + Math.random() * u.width,
        y: y + Math.random() * u.height,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 2,
        life: 30,
        color: ['#FFD700', '#FF69B4', '#00FFFF', '#FFB6C1'][Math.floor(Math.random() * 4)],
        size: 3 + Math.random() * 3,
      });
    }
    
    ctx.restore();
  };

  const drawObstacle = (ctx: CanvasRenderingContext2D, obstacle: Obstacle, cameraX: number) => {
    const x = obstacle.x - cameraX;
    if (x < -100 || x > 950) return;
    
    switch (obstacle.type) {
      case 'hole':
        ctx.fillStyle = '#1a0a2e';
        ctx.fillRect(x, GROUND_Y, obstacle.width, 60);
        ctx.fillStyle = '#2d1b4e';
        ctx.fillRect(x + 5, GROUND_Y + 5, obstacle.width - 10, 50);
        break;
        
      case 'tree':
        // Trunk
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 15, obstacle.y + 40, 20, 60);
        // Leaves
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(x + 25, obstacle.y + 30, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.arc(x + 15, obstacle.y + 45, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 35, obstacle.y + 45, 25, 0, Math.PI * 2);
        ctx.fill();
        // Flowers on tree
        ctx.fillStyle = '#FF69B4';
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(x + 10 + i * 8, obstacle.y + 20 + Math.sin(i) * 10, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
        
      case 'rock':
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(x + obstacle.width * 0.3, obstacle.y);
        ctx.lineTo(x + obstacle.width * 0.7, obstacle.y + 5);
        ctx.lineTo(x + obstacle.width, GROUND_Y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.moveTo(x + obstacle.width * 0.2, GROUND_Y);
        ctx.lineTo(x + obstacle.width * 0.4, obstacle.y + 10);
        ctx.lineTo(x + obstacle.width * 0.6, GROUND_Y);
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'tallTree':
        // Trunk with climbing texture
        ctx.fillStyle = '#654321';
        ctx.fillRect(x + 15, obstacle.y, 30, obstacle.height);
        ctx.fillStyle = '#8B4513';
        for (let i = 0; i < obstacle.height; i += 20) {
          ctx.fillRect(x + 15, obstacle.y + i, 30, 10);
        }
        // Branches and leaves
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(x + 30, obstacle.y + 20, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.arc(x + 10, obstacle.y + 60, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 50, obstacle.y + 60, 30, 0, Math.PI * 2);
        ctx.fill();
        // Platforms (treehouse-like)
        if (obstacle.platform) {
          obstacle.platform.forEach(p => {
            ctx.fillStyle = '#DEB887';
            ctx.fillRect(p.x - cameraX, p.y, p.width, p.height);
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.strokeRect(p.x - cameraX, p.y, p.width, p.height);
          });
        }
        break;
    }
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    state.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 30;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, time: number) => {
    const state = gameStateRef.current;
    
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#B0E0E6');
    gradient.addColorStop(1, '#FFE4E1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, GROUND_Y);
    
    // Draw elements
    state.rainbows.forEach(r => drawRainbow(ctx, r, state.camera.x));
    state.clouds.forEach(c => drawCloud(ctx, c, state.camera.x));
    state.stars.forEach(s => drawStar(ctx, s, state.camera.x, time));
    state.butterflies.forEach(b => drawButterfly(ctx, b, state.camera.x, time));
    
    // Ground
    const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 100);
    groundGradient.addColorStop(0, '#90EE90');
    groundGradient.addColorStop(0.3, '#98FB98');
    groundGradient.addColorStop(1, '#228B22');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, GROUND_Y, 800, 100);
    
    // Grass tufts
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 2;
    for (let i = 0; i < 100; i++) {
      const gx = (i * 50 - state.camera.x % 50);
      if (gx < 0 || gx > 800) continue;
      ctx.beginPath();
      ctx.moveTo(gx, GROUND_Y);
      ctx.lineTo(gx - 3, GROUND_Y - 10);
      ctx.moveTo(gx, GROUND_Y);
      ctx.lineTo(gx + 3, GROUND_Y - 12);
      ctx.moveTo(gx, GROUND_Y);
      ctx.lineTo(gx + 6, GROUND_Y - 8);
      ctx.stroke();
    }
    
    // Flowers
    state.flowers.forEach(f => drawFlower(ctx, f, state.camera.x));
  };

  // Collision detection
  const checkCollision = (rect1: { x: number; y: number; width: number; height: number }, 
                          rect2: { x: number; y: number; width: number; height: number }) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  };

  // Game loop
  const gameLoop = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const state = gameStateRef.current;
    
    if (!state.started || state.gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    
    // Update
    const u = state.unicorn;
    const keys = keysRef.current;
    
    // Handle input
    if (keys.has('ArrowLeft') || keys.has('a')) {
      u.vx = -MOVE_SPEED;
      u.facingRight = false;
    } else if (keys.has('ArrowRight') || keys.has('d')) {
      u.vx = MOVE_SPEED;
      u.facingRight = true;
    } else {
      u.vx *= 0.8;
    }
    
    // Jump
    if ((keys.has('ArrowUp') || keys.has('w') || keys.has(' ')) && u.isOnGround && !u.isJumping) {
      u.vy = JUMP_FORCE;
      u.isJumping = true;
      u.isOnGround = false;
      // Jump particles
      for (let i = 0; i < 10; i++) {
        state.particles.push({
          x: u.x + u.width / 2,
          y: u.y + u.height,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 2,
          life: 20,
          color: '#90EE90',
          size: 3 + Math.random() * 3,
        });
      }
    }
    
    // Check for climbing (near tall tree)
    u.isClimbing = false;
    state.obstacles.forEach(obs => {
      if (obs.type === 'tallTree') {
        const nearTrunk = u.x + u.width > obs.x && u.x < obs.x + 50;
        if (nearTrunk && (keys.has('ArrowUp') || keys.has('w'))) {
          u.isClimbing = true;
          u.vy = -CLIMB_SPEED;
          u.isJumping = false;
        }
        // Check platform collisions
        if (obs.platform) {
          obs.platform.forEach(p => {
            if (checkCollision(
              { x: u.x, y: u.y + u.height - 5, width: u.width, height: 10 },
              { x: p.x, y: p.y, width: p.width, height: p.height }
            ) && u.vy > 0) {
              u.y = p.y - u.height;
              u.vy = 0;
              u.isOnGround = true;
              u.isJumping = false;
            }
          });
        }
      }
    });
    
    // Apply gravity
    if (!u.isClimbing) {
      u.vy += GRAVITY;
    }
    
    // Update position
    u.x += u.vx;
    u.y += u.vy;
    
    // Ground collision
    if (u.y + u.height > GROUND_Y) {
      u.y = GROUND_Y - u.height;
      u.vy = 0;
      u.isOnGround = true;
      u.isJumping = false;
    }
    
    // Keep unicorn on screen (left bound)
    if (u.x < 50) u.x = 50;
    
    // Update camera
    state.camera.x = u.x - 200;
    
    // Check obstacle collisions
    state.obstacles.forEach(obs => {
      const obsRect = { x: obs.x, y: obs.y, width: obs.width, height: obs.height };
      
      if (obs.type === 'hole') {
        // Fall into hole
        if (u.x + u.width > obs.x + 10 && u.x < obs.x + obs.width - 10 && 
            u.y + u.height >= GROUND_Y) {
          state.gameOver = true;
          if (state.score > highScore) setHighScore(state.score);
        }
      } else {
        // Side collision with tree/rock
        if (checkCollision({ x: u.x, y: u.y, width: u.width, height: u.height }, obsRect)) {
          if (obs.type === 'tree' || obs.type === 'rock') {
            // Push back
            if (u.vx > 0) u.x = obs.x - u.width;
            else if (u.vx < 0) u.x = obs.x + obs.width;
          }
        }
      }
    });
    
    // Update score
    state.score = Math.floor(u.x / 10);
    
    // Generate more obstacles
    const lastObs = state.obstacles[state.obstacles.length - 1];
    if (lastObs && lastObs.x < state.camera.x + 2000) {
      state.obstacles.push(...generateObstacles(lastObs.x + lastObs.width, 5));
    }
    
    // Remove off-screen obstacles
    state.obstacles = state.obstacles.filter(o => o.x > state.camera.x - 200);
    
    // Update particles
    state.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    state.particles = state.particles.filter(p => p.life > 0);
    
    // Update butterflies
    state.butterflies.forEach(b => {
      b.x += b.speed;
      if (b.x > state.camera.x + 1000) b.x = state.camera.x - 100;
    });
    
    // Update clouds
    state.clouds.forEach(c => {
      c.x += c.speed;
      if (c.x > state.camera.x + 1500) c.x = state.camera.x - 300;
    });
    
    // Draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(ctx, time);
    state.obstacles.forEach(o => drawObstacle(ctx, o, state.camera.x));
    drawUnicorn(ctx, state.camera.x, time);
    drawParticles(ctx);
    
    // Draw UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 150, 40);
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`⭐ ${state.score}`, 25, 38);
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [generateObstacles, highScore, customization]);

  // Draw game over / start screen
  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = gameStateRef.current;
    
    if (!state.started || state.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FF69B4';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      
      if (state.gameOver) {
        ctx.fillText('💔 Oh no!', canvas.width / 2, 150);
        ctx.fillStyle = '#FFB6C1';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(`Score: ${state.score}`, canvas.width / 2, 200);
        if (highScore > 0) {
          ctx.fillStyle = '#FFD700';
          ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, 240);
        }
      } else {
        ctx.fillText('🦄 Unicorn Run!', canvas.width / 2, 150);
        ctx.fillStyle = '#FFB6C1';
        ctx.font = '24px Arial';
        ctx.fillText('Help the unicorn run and jump!', canvas.width / 2, 200);
      }
      
      ctx.fillStyle = '#90EE90';
      ctx.font = '20px Arial';
      ctx.fillText('Press SPACE or TAP to start', canvas.width / 2, 300);
      ctx.fillText('← → or A D to move', canvas.width / 2, 340);
      ctx.fillText('↑ or W or SPACE to jump', canvas.width / 2, 370);
      ctx.fillText('Climb tall trees by holding ↑', canvas.width / 2, 400);
      
      ctx.textAlign = 'left';
    }
  }, [highScore]);

  // Event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      
      if (e.key === ' ' || e.key === 'Enter') {
        const state = gameStateRef.current;
        if (!state.started || state.gameOver) {
          initGame();
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    
    const handleTouch = () => {
      const state = gameStateRef.current;
      if (!state.started || state.gameOver) {
        initGame();
      } else {
        keysRef.current.add(' ');
        setTimeout(() => keysRef.current.delete(' '), 100);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvasRef.current?.addEventListener('touchstart', handleTouch);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvasRef.current?.removeEventListener('touchstart', handleTouch);
    };
  }, [initGame]);

  // Start game loop
  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameLoop]);

  // Draw overlay on state change
  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '15px',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 50%, #FFE4E1 100%)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 800,
        marginBottom: '10px'
      }}>
        <h1 style={{
          color: '#FF69B4',
          textShadow: '3px 3px 0 #FFB6C1, -1px -1px 0 #FF1493',
          fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
          textAlign: 'center',
          flex: 1
        }}>
          🦄 Unicorn Run!
        </h1>
        
        <button
          onClick={() => setShowCustomize(true)}
          style={{
            padding: '10px 15px',
            borderRadius: '25px',
            border: 'none',
            background: 'linear-gradient(135deg, #FF69B4, #FF1493)',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(255, 105, 180, 0.4)'
          }}
        >
          🎨 Customize
        </button>
      </div>

      {/* Game Canvas */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '10px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        overflow: 'hidden'
      }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '15px'
          }}
        />
      </div>

      {/* Mobile Controls */}
      <div style={{
        marginTop: '20px',
        display: 'flex',
        gap: '15px'
      }}>
        <button
          onTouchStart={() => keysRef.current.add('ArrowLeft')}
          onTouchEnd={() => keysRef.current.delete('ArrowLeft')}
          onMouseDown={() => keysRef.current.add('ArrowLeft')}
          onMouseUp={() => keysRef.current.delete('ArrowLeft')}
          onMouseLeave={() => keysRef.current.delete('ArrowLeft')}
          style={{
            width: 70,
            height: 70,
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #FFB6C1, #FF69B4)',
            fontSize: '2rem',
            boxShadow: '0 4px 15px rgba(255, 105, 180, 0.4)',
            cursor: 'pointer'
          }}
        >
          ←
        </button>
        <button
          onTouchStart={() => keysRef.current.add(' ')}
          onTouchEnd={() => keysRef.current.delete(' ')}
          onMouseDown={() => keysRef.current.add(' ')}
          onMouseUp={() => keysRef.current.delete(' ')}
          onMouseLeave={() => keysRef.current.delete(' ')}
          style={{
            width: 90,
            height: 70,
            borderRadius: '35px',
            border: 'none',
            background: 'linear-gradient(135deg, #90EE90, #32CD32)',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: 'white',
            boxShadow: '0 4px 15px rgba(50, 205, 50, 0.4)',
            cursor: 'pointer'
          }}
        >
          JUMP
        </button>
        <button
          onTouchStart={() => keysRef.current.add('ArrowRight')}
          onTouchEnd={() => keysRef.current.delete('ArrowRight')}
          onMouseDown={() => keysRef.current.add('ArrowRight')}
          onMouseUp={() => keysRef.current.delete('ArrowRight')}
          onMouseLeave={() => keysRef.current.delete('ArrowRight')}
          style={{
            width: 70,
            height: 70,
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #FFB6C1, #FF69B4)',
            fontSize: '2rem',
            boxShadow: '0 4px 15px rgba(255, 105, 180, 0.4)',
            cursor: 'pointer'
          }}
        >
          →
        </button>
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '20px',
        padding: '15px 25px',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '15px',
        textAlign: 'center',
        maxWidth: 500
      }}>
        <p style={{ margin: 0, color: '#666' }}>
          🌈 Jump over holes and obstacles! 🦄 Climb tall trees for bonus points! ⭐
        </p>
      </div>

      {/* Customize Modal */}
      {showCustomize && (
        <div
          onClick={() => setShowCustomize(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #FFF0F5, #FFE4E1)',
              borderRadius: '25px',
              padding: '30px',
              maxWidth: 400,
              width: '100%'
            }}
          >
            <h2 style={{ textAlign: 'center', color: '#FF69B4', marginBottom: 20 }}>
              🎨 Customize Your Unicorn
            </h2>
            
            {/* Body Color */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ color: '#666', marginBottom: 10 }}>Body Color</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {UNICORN_COLORS.body.map(color => (
                  <button
                    key={color}
                    onClick={() => setCustomization(c => ({ ...c, bodyColor: color }))}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      border: customization.bodyColor === color ? '3px solid #FF69B4' : '2px solid #ddd',
                      background: color,
                      cursor: 'pointer',
                      transform: customization.bodyColor === color ? 'scale(1.1)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Mane Color */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ color: '#666', marginBottom: 10 }}>Mane & Tail</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {UNICORN_COLORS.mane.map(color => (
                  <button
                    key={color}
                    onClick={() => setCustomization(c => ({ ...c, maneColor: color }))}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      border: customization.maneColor === color ? '3px solid #FF69B4' : '2px solid #ddd',
                      background: color,
                      cursor: 'pointer',
                      transform: customization.maneColor === color ? 'scale(1.1)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Horn Color */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ color: '#666', marginBottom: 10 }}>Horn</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {UNICORN_COLORS.horn.map(color => (
                  <button
                    key={color}
                    onClick={() => setCustomization(c => ({ ...c, hornColor: color }))}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      border: customization.hornColor === color ? '3px solid #FF69B4' : '2px solid #ddd',
                      background: color,
                      cursor: 'pointer',
                      transform: customization.hornColor === color ? 'scale(1.1)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
            </div>
            
            <button
              onClick={() => setShowCustomize(false)}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: 15,
                border: 'none',
                background: 'linear-gradient(135deg, #FF69B4, #FF1493)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: 'pointer'
              }}
            >
              Done! ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
