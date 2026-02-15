'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Game constants
const GRAVITY = 0.6;
const JUMP_FORCE = -14;
const MOVE_SPEED = 6;
const CLIMB_SPEED = 3;
const GROUND_Y = 400;

// Colors for unicorn customization
const UNICORN_COLORS = {
  body: ['#FFB6C1', '#DDA0DD', '#87CEEB', '#98FB98', '#FFE4B5', '#FFC0CB', '#E6E6FA', '#B0E0E6'],
  mane: ['#FF69B4', '#FF1493', '#DA70D6', '#9370DB', '#8A2BE2', '#FFD700', '#FF6347', '#00CED1'],
  horn: ['#FFD700', '#FFC0CB', '#FFFFFF', '#FF69B4', '#00FFFF'],
};

type BiomeType = 'MEADOW' | 'CANDY' | 'SKY';

interface Biome {
  type: BiomeType;
  skyColors: [string, string, string];
  groundColors: [string, string, string];
  obstacleTypes: string[];
}

const BIOMES: Record<BiomeType, Biome> = {
  MEADOW: {
    type: 'MEADOW',
    skyColors: ['#87CEEB', '#B0E0E6', '#FFE4E1'],
    groundColors: ['#90EE90', '#98FB98', '#228B22'],
    obstacleTypes: ['rock', 'tree', 'tallTree', 'hole'],
  },
  CANDY: {
    type: 'CANDY',
    skyColors: ['#FFC0CB', '#FFB6C1', '#FFF0F5'],
    groundColors: ['#FF69B4', '#FF1493', '#C71585'],
    obstacleTypes: ['lollipop', 'cake', 'cookie', 'chocolate_pit'],
  },
  SKY: {
    type: 'SKY',
    skyColors: ['#00BFFF', '#1E90FF', '#E0FFFF'],
    groundColors: ['#F0F8FF', '#E6E6FA', '#B0C4DE'],
    obstacleTypes: ['cloud_obstacle', 'storm_cloud', 'rainbow_bridge'],
  }
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
  type: string;
  platform?: { x: number; y: number; width: number; height: number }[];
}

interface Collectible {
  x: number;
  y: number;
  type: 'STAR' | 'GEM';
  value: number;
  collected: boolean;
  floatOffset: number;
}

interface Cloud {
  x: number;
  y: number;
  width: number;
  speed: number;
  layer: number;
}

interface Decoration {
  x: number;
  y: number;
  type: string;
  color: string;
  size: number;
  layer: number;
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
    invincible: number;
  };
  camera: {
    x: number;
  };
  score: number;
  distance: number;
  gameOver: boolean;
  started: boolean;
  biome: BiomeType;
  obstacles: Obstacle[];
  collectibles: Collectible[];
  particles: Particle[];
  clouds: Cloud[];
  decorations: Decoration[];
  stars: { x: number; y: number; size: number; twinkle: number }[];
  lastBiomeSwitch: number;
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
      invincible: 0,
    },
    camera: { x: 0 },
    score: 0,
    distance: 0,
    gameOver: false,
    started: false,
    biome: 'MEADOW',
    obstacles: [],
    collectibles: [],
    particles: [],
    clouds: [],
    decorations: [],
    stars: [],
    lastBiomeSwitch: 0,
  });

  const createObstacle = useCallback((x: number, type: string, biome: BiomeType, widthOverride?: number): Obstacle => {
     let obs: Obstacle = { x, y: GROUND_Y, width: 60, height: 60, type };
     
     switch(type) {
         // Meadow
         case 'hole': 
             obs.width = widthOverride || 100; obs.height = 60; obs.y = GROUND_Y; break;
         case 'rock':
             obs.width = 50; obs.height = 40; obs.y = GROUND_Y - 40; break;
         case 'tree':
             obs.width = 40; obs.height = 100; obs.y = GROUND_Y - 100; break;
         case 'tallTree':
             obs.width = 50; obs.height = 250; obs.y = GROUND_Y - 250;
             obs.platform = [
                { x: x - 30, y: obs.y + 80, width: 110, height: 20 },
                { x: x - 20, y: obs.y + 150, width: 90, height: 20 },
             ];
             break;
             
         // Candy
         case 'chocolate_pit':
             obs.width = widthOverride || 120; obs.height = 60; obs.y = GROUND_Y; break;
         case 'lollipop':
             obs.width = 30; obs.height = 120; obs.y = GROUND_Y - 120; break;
         case 'cake':
             obs.width = 80; obs.height = 80; obs.y = GROUND_Y - 80; break;
         case 'cookie':
             obs.width = 40; obs.height = 40; obs.y = GROUND_Y - 40; break;
             
         // Sky
         case 'cloud_obstacle':
             obs.width = 100; obs.height = 40; obs.y = GROUND_Y - 150; break;
         case 'storm_cloud':
             obs.width = 80; obs.height = 80; obs.y = GROUND_Y - 200; break;
         default:
             break;
     }
     return obs;
  }, []);

  const generateChunk = useCallback((startX: number, biome: BiomeType): { obstacles: Obstacle[], collectibles: Collectible[], width: number } => {
    const obstacles: Obstacle[] = [];
    const collectibles: Collectible[] = [];
    let currentX = startX;
    
    const patterns = ['FLAT_RUN', 'JUMP_GAP', 'DOUBLE_JUMP', 'STAIRCASE'];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    // const difficulty = Math.min(gameStateRef.current.distance / 5000, 1);

    const addCollectible = (x: number, y: number) => {
      if (Math.random() > 0.3) {
        collectibles.push({
          x, y,
          type: Math.random() > 0.8 ? 'GEM' : 'STAR',
          value: Math.random() > 0.8 ? 50 : 10,
          collected: false,
          floatOffset: Math.random() * Math.PI * 2
        });
      }
    };

    switch (pattern) {
      case 'FLAT_RUN':
        const length = 400 + Math.random() * 400;
        const numObs = Math.floor(length / 200);
        for(let i=0; i<numObs; i++) {
          if (Math.random() > 0.4) {
             const type = BIOMES[biome].obstacleTypes[Math.floor(Math.random() * 2)];
             obstacles.push(createObstacle(currentX + 100 + i * 200, type, biome));
             addCollectible(currentX + 100 + i * 200, GROUND_Y - 150);
          }
        }
        currentX += length;
        break;

      case 'JUMP_GAP':
        const pitWidth = 100 + Math.random() * 50;
        obstacles.push(createObstacle(currentX, biome === 'CANDY' ? 'chocolate_pit' : 'hole', biome, pitWidth));
        addCollectible(currentX + pitWidth/2, GROUND_Y - 120);
        addCollectible(currentX + pitWidth/2 + 40, GROUND_Y - 140);
        addCollectible(currentX + pitWidth/2 - 40, GROUND_Y - 140);
        currentX += pitWidth + 200;
        break;
        
      case 'DOUBLE_JUMP':
        const tallType = biome === 'MEADOW' ? 'tallTree' : (biome === 'CANDY' ? 'cake' : 'cloud_obstacle');
        obstacles.push(createObstacle(currentX, tallType, biome));
        addCollectible(currentX, GROUND_Y - 250);
        addCollectible(currentX, GROUND_Y - 200);
        currentX += 300;
        break;
        
      case 'STAIRCASE':
        for(let i=0; i<3; i++) {
            const h = 50 + i * 50;
            const obs = createObstacle(currentX + i * 150, 'rock', biome);
            obs.y = GROUND_Y - h;
            obs.height = h;
            obstacles.push(obs);
            addCollectible(currentX + i * 150, GROUND_Y - h - 50);
        }
        currentX += 450;
        break;
    }
    
    return { obstacles, collectibles, width: currentX - startX };
  }, [createObstacle]);

  const generateBackground = useCallback(() => {
    const state = gameStateRef.current;
    
    state.clouds = [];
    for (let i = 0; i < 20; i++) {
      state.clouds.push({
        x: Math.random() * 2000,
        y: Math.random() * 300,
        width: 60 + Math.random() * 100,
        speed: 0.1 + Math.random() * 0.4,
        layer: Math.floor(Math.random() * 3)
      });
    }
    
    state.decorations = [];
    const decorColors = ['#FF69B4', '#FFB6C1', '#DDA0DD', '#FFE4E1', '#FFC0CB', '#FFD700'];
    for (let i = 0; i < 60; i++) {
      state.decorations.push({
        x: Math.random() * 5000,
        y: GROUND_Y - 5 - Math.random() * 15,
        color: decorColors[Math.floor(Math.random() * decorColors.length)],
        size: 8 + Math.random() * 12,
        type: Math.random() > 0.5 ? 'flower' : 'mushroom',
        layer: 2
      });
    }
    
    state.stars = [];
    for (let i = 0; i < 50; i++) {
      state.stars.push({
        x: Math.random() * 3000,
        y: Math.random() * 300,
        size: 1 + Math.random() * 3,
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  }, []);

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
      invincible: 0,
    };
    state.camera = { x: 0 };
    state.score = 0;
    state.distance = 0;
    state.gameOver = false;
    state.started = true;
    state.biome = 'MEADOW';
    state.obstacles = [];
    state.collectibles = [];
    state.lastBiomeSwitch = 0;
    
    let currentX = 500;
    for(let i=0; i<5; i++) {
        const chunk = generateChunk(currentX, state.biome);
        state.obstacles.push(...chunk.obstacles);
        state.collectibles.push(...chunk.collectibles);
        currentX += chunk.width;
    }
    
    state.particles = [];
    generateBackground();
  }, [generateChunk, generateBackground]);

  const drawBackground = (ctx: CanvasRenderingContext2D, time: number) => {
    const state = gameStateRef.current;
    const biome = BIOMES[state.biome];
    const camX = state.camera.x;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    gradient.addColorStop(0, biome.skyColors[0]);
    gradient.addColorStop(0.5, biome.skyColors[1]);
    gradient.addColorStop(1, biome.skyColors[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, GROUND_Y);
    
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFA500';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(700, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    state.clouds.filter(c => c.layer === 0).forEach(c => {
        const x = (c.x - camX * 0.1) % 2000;
        const drawX = x < -100 ? x + 2000 : x;
        ctx.beginPath();
        ctx.arc(drawX, c.y, c.width, 0, Math.PI * 2);
        ctx.fill();
    });

    if (state.biome === 'MEADOW') {
        ctx.fillStyle = '#65A965';
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y);
        for(let i=0; i<=800; i+=100) {
            const h = Math.sin((i + camX * 0.2) * 0.01) * 50 + 100;
            ctx.lineTo(i, GROUND_Y - h);
        }
        ctx.lineTo(800, GROUND_Y);
        ctx.fill();
    } else if (state.biome === 'CANDY') {
        ctx.fillStyle = '#FF69B4'; 
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y);
        for(let i=0; i<=800; i+=100) {
            const h = Math.abs(Math.sin((i + camX * 0.2) * 0.01)) * 150 + 50;
            ctx.lineTo(i, GROUND_Y - h);
        }
        ctx.lineTo(800, GROUND_Y);
        ctx.fill();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    state.clouds.filter(c => c.layer === 1).forEach(c => {
        const x = (c.x - camX * 0.4) % 2000;
        const drawX = x < -100 ? x + 2000 : x;
        ctx.beginPath();
        ctx.arc(drawX, c.y, c.width * 0.8, 0, Math.PI * 2);
        ctx.arc(drawX + 30, c.y - 10, c.width * 0.6, 0, Math.PI * 2);
        ctx.fill();
    });

    const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 100);
    groundGradient.addColorStop(0, biome.groundColors[0]);
    groundGradient.addColorStop(0.3, biome.groundColors[1]);
    groundGradient.addColorStop(1, biome.groundColors[2]);
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, GROUND_Y, 800, 100);
    
    ctx.strokeStyle = biome.groundColors[2];
    ctx.lineWidth = 2;
    const scrollOffset = camX % 50;
    for (let i = -50; i < 850; i+=20) {
        if ((i * 1234.56) % 1 > 0.5) continue;
        const x = i - scrollOffset;
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(x - 5, GROUND_Y - 8);
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(x + 5, GROUND_Y - 6);
        ctx.stroke();
    }

    state.decorations.forEach(d => {
        const x = d.x - camX;
        if (x < -50 || x > 850) return;
        
        if (d.type === 'flower') {
            ctx.fillStyle = '#228B22';
            ctx.fillRect(x - 1, d.y, 2, 15);
            ctx.fillStyle = d.color;
            ctx.beginPath();
            ctx.arc(x, d.y, d.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(x, d.y, d.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        } else {
             ctx.fillStyle = '#FFF8DC';
             ctx.fillRect(x - d.size/4, d.y, d.size/2, d.size);
             ctx.fillStyle = d.color;
             ctx.beginPath();
             ctx.arc(x, d.y, d.size, Math.PI, 0);
             ctx.fill();
             ctx.fillStyle = '#FFF';
             ctx.beginPath();
             ctx.arc(x - d.size/2, d.y - d.size/2, d.size/5, 0, Math.PI*2);
             ctx.arc(x + d.size/2, d.y - d.size/3, d.size/5, 0, Math.PI*2);
             ctx.fill();
        }
    });
  };

  const drawUnicorn = (ctx: CanvasRenderingContext2D, cameraX: number, time: number) => {
    const state = gameStateRef.current;
    const u = state.unicorn;
    const x = u.x - cameraX;
    const y = u.y;
    
    if (u.invincible > 0 && Math.floor(time / 100) % 2 === 0) return;

    ctx.save();
    ctx.translate(x, y);
    if (!u.facingRight) {
      ctx.scale(-1, 1);
      ctx.translate(-u.width, 0);
    }
    
    const runCycle = time * 0.02;
    const legL = u.isOnGround ? Math.sin(runCycle) * 10 : 5;
    const legR = u.isOnGround ? Math.sin(runCycle + Math.PI) * 10 : -5;
    
    ctx.fillStyle = customization.bodyColor;
    ctx.save();
    ctx.translate(15, 45);
    ctx.rotate(legL * 0.05);
    ctx.fillRect(-5, 0, 10, 25); 
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(-5, 25, 10, 6);
    ctx.restore();

    ctx.fillStyle = customization.bodyColor;
    ctx.save();
    ctx.translate(35, 45);
    ctx.rotate(legR * 0.05);
    ctx.fillRect(-5, 0, 10, 25);
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(-5, 25, 10, 6);
    ctx.restore();
    
    ctx.fillStyle = customization.bodyColor;
    ctx.beginPath();
    ctx.ellipse(30, 35, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = customization.maneColor;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(5, 30);
    const tailWave = Math.sin(time * 0.008) * 10;
    ctx.quadraticCurveTo(-20 + tailWave, 35, -25 + tailWave, 55);
    ctx.stroke();

    ctx.fillStyle = customization.bodyColor;
    ctx.save();
    ctx.translate(45, 45);
    ctx.rotate(legR * 0.05);
    ctx.fillRect(-5, 0, 10, 25);
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(-5, 25, 10, 6);
    ctx.restore();

    ctx.fillStyle = customization.bodyColor;
    ctx.save();
    ctx.translate(50, 25);
    ctx.rotate(-0.2);
    ctx.fillRect(0, -20, 15, 30);
    ctx.restore();
    
    ctx.fillStyle = customization.bodyColor;
    ctx.save();
    ctx.translate(62, 10);
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 13, 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    const gradient = ctx.createLinearGradient(0, -10, 5, -40);
    gradient.addColorStop(0, customization.hornColor);
    gradient.addColorStop(1, '#FFF');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(2, -10);
    ctx.lineTo(8, -40);
    ctx.lineTo(14, -8);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(5, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = customization.maneColor;
    for(let i=0; i<5; i++) {
        ctx.beginPath();
        ctx.arc(-8 - i*3, -5 + i*5, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
    ctx.restore();
  };

  const drawCollectible = (ctx: CanvasRenderingContext2D, c: Collectible, cameraX: number, time: number) => {
      const x = c.x - cameraX;
      if (x < -50 || x > 850) return;
      const y = c.y + Math.sin(time * 0.005 + c.floatOffset) * 10;
      
      ctx.save();
      ctx.translate(x, y);
      
      if (c.type === 'STAR') {
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          for(let i=0; i<5; i++) {
              ctx.lineTo(Math.cos((18+i*72)*Math.PI/180)*15, -Math.sin((18+i*72)*Math.PI/180)*15);
              ctx.lineTo(Math.cos((54+i*72)*Math.PI/180)*7, -Math.sin((54+i*72)*Math.PI/180)*7);
          }
          ctx.closePath();
          ctx.fill();
          ctx.shadowColor = '#FFF';
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;
      } else if (c.type === 'GEM') {
          ctx.fillStyle = '#00FFFF';
          ctx.beginPath();
          ctx.moveTo(0, -15);
          ctx.lineTo(12, -5);
          ctx.lineTo(12, 5);
          ctx.lineTo(0, 15);
          ctx.lineTo(-12, 5);
          ctx.lineTo(-12, -5);
          ctx.closePath();
          ctx.fill();
          
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.beginPath();
          ctx.moveTo(-12, -5); ctx.lineTo(12, -5);
          ctx.moveTo(0, -15); ctx.lineTo(0, 15);
          ctx.stroke();
      }
      
      ctx.restore();
  };

  const drawObstacle = (ctx: CanvasRenderingContext2D, obstacle: Obstacle, cameraX: number) => {
    const x = obstacle.x - cameraX;
    if (x < -100 || x > 950) return;
    
    switch (obstacle.type) {
      case 'hole':
      case 'chocolate_pit':
        const holeGrad = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 60);
        holeGrad.addColorStop(0, obstacle.type === 'hole' ? '#1a0a2e' : '#3E2723');
        holeGrad.addColorStop(1, obstacle.type === 'hole' ? '#000' : '#281815');
        ctx.fillStyle = holeGrad;
        ctx.fillRect(x, GROUND_Y, obstacle.width, 60);
        break;
        
      case 'tree':
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 10, obstacle.y + 40, 20, 60);
        ctx.fillStyle = '#228B22';
        ctx.beginPath(); ctx.arc(x + 20, obstacle.y + 30, 25, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 10, obstacle.y + 50, 20, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 30, obstacle.y + 50, 20, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FF0000';
        ctx.beginPath(); ctx.arc(x+15, obstacle.y+35, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+28, obstacle.y+45, 3, 0, Math.PI*2); ctx.fill();
        break;
        
      case 'tallTree':
        ctx.fillStyle = '#654321';
        ctx.fillRect(x + 15, obstacle.y, 20, obstacle.height);
        ctx.strokeStyle = '#543210';
        for(let i=0; i<obstacle.height; i+=15) {
            ctx.beginPath(); ctx.moveTo(x+15, obstacle.y+i); ctx.lineTo(x+35, obstacle.y+i+5); ctx.stroke();
        }
        ctx.fillStyle = '#006400';
        ctx.beginPath(); ctx.arc(x + 25, obstacle.y, 40, 0, Math.PI*2); ctx.fill();
        
        if (obstacle.platform) {
            obstacle.platform.forEach(p => {
                const px = p.x - cameraX;
                ctx.fillStyle = '#DEB887';
                ctx.fillRect(px, p.y, p.width, p.height);
                ctx.fillStyle = '#555';
                ctx.fillRect(px+5, p.y+8, 4, 4);
                ctx.fillRect(px+p.width-9, p.y+8, 4, 4);
            });
        }
        break;

      case 'rock':
          ctx.fillStyle = '#777';
          ctx.beginPath();
          ctx.moveTo(x, GROUND_Y);
          ctx.lineTo(x+10, obstacle.y+10);
          ctx.lineTo(x+25, obstacle.y);
          ctx.lineTo(x+40, obstacle.y+15);
          ctx.lineTo(x+50, GROUND_Y);
          ctx.fill();
          ctx.fillStyle = '#999';
          ctx.beginPath();
          ctx.moveTo(x+10, obstacle.y+10);
          ctx.lineTo(x+25, obstacle.y);
          ctx.lineTo(x+20, obstacle.y+20);
          ctx.fill();
          break;

      case 'lollipop':
          ctx.fillStyle = '#FFF';
          ctx.fillRect(x + 12, obstacle.y + 30, 6, 90);
          ctx.fillStyle = '#FF1493';
          ctx.beginPath(); ctx.arc(x + 15, obstacle.y + 30, 25, 0, Math.PI*2); ctx.fill();
          ctx.strokeStyle = '#FFF'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(x+15, obstacle.y+30, 15, 0, Math.PI*2); ctx.stroke();
          ctx.beginPath(); ctx.arc(x+15, obstacle.y+30, 8, 0, Math.PI*2); ctx.stroke();
          break;
          
      case 'cake':
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(x, obstacle.y + 50, 80, 30);
          ctx.fillStyle = '#FF69B4';
          ctx.fillRect(x + 5, obstacle.y + 25, 70, 25);
          ctx.fillStyle = '#FFF';
          ctx.fillRect(x + 10, obstacle.y, 60, 25);
          ctx.fillStyle = '#F00';
          ctx.beginPath(); ctx.arc(x+40, obstacle.y, 8, 0, Math.PI*2); ctx.fill();
          break;
    }
  };

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
    
    const u = state.unicorn;
    const keys = keysRef.current;
    
    if (keys.has('ArrowLeft') || keys.has('a')) {
      u.vx = -MOVE_SPEED; u.facingRight = false;
    } else if (keys.has('ArrowRight') || keys.has('d')) {
      u.vx = MOVE_SPEED; u.facingRight = true;
    } else {
      u.vx *= 0.8;
    }
    
    if ((keys.has('ArrowUp') || keys.has('w') || keys.has(' ')) && u.isOnGround && !u.isJumping) {
      u.vy = JUMP_FORCE;
      u.isJumping = true;
      u.isOnGround = false;
    }
    
    u.vy += GRAVITY;
    u.x += u.vx;
    u.y += u.vy;
    
    if (u.y + u.height > GROUND_Y) {
      u.y = GROUND_Y - u.height;
      u.vy = 0;
      u.isOnGround = true;
      u.isJumping = false;
    }
    
    u.isClimbing = false;
    state.obstacles.forEach(obs => {
      if (obs.type === 'tallTree' && u.x + u.width > obs.x && u.x < obs.x + 50) {
         if (keys.has('ArrowUp') || keys.has('w')) {
             u.vy = -CLIMB_SPEED; u.isClimbing = true;
         }
      }
      if (obs.platform) {
          obs.platform.forEach(p => {
              if (u.x + u.width > p.x && u.x < p.x + p.width &&
                  u.y + u.height > p.y && u.y + u.height < p.y + 20 && u.vy > 0) {
                  u.y = p.y - u.height;
                  u.vy = 0;
                  u.isOnGround = true;
                  u.isJumping = false;
              }
          });
      }
    });

    if (u.x < 50) u.x = 50;
    
    const targetCamX = u.x - 200;
    state.camera.x += (targetCamX - state.camera.x) * 0.1;
    
    if (u.invincible > 0) u.invincible--;

    const unicornRect = { x: u.x + 10, y: u.y + 10, width: u.width - 20, height: u.height - 10 };
    
    state.obstacles.forEach(obs => {
        const obsRect = { x: obs.x, y: obs.y, width: obs.width, height: obs.height };
        
        if (unicornRect.x < obsRect.x + obsRect.width &&
            unicornRect.x + unicornRect.width > obsRect.x &&
            unicornRect.y < obsRect.y + obsRect.height &&
            unicornRect.y + unicornRect.height > obsRect.y) {
                
            if (obs.type === 'hole' || obs.type === 'chocolate_pit') {
                if (u.y + u.height >= GROUND_Y) {
                     state.gameOver = true;
                     if (state.score > highScore) setHighScore(state.score);
                }
            } else if (u.invincible <= 0) {
                 if (u.vx > 0) u.x = obsRect.x - u.width;
                 else if (u.vx < 0) u.x = obsRect.x + obsRect.width;
            }
        }
    });

    state.collectibles.forEach(c => {
        if (c.collected) return;
        if (unicornRect.x < c.x + 30 && unicornRect.x + unicornRect.width > c.x &&
            unicornRect.y < c.y + 30 && unicornRect.y + unicornRect.height > c.y) {
                c.collected = true;
                state.score += c.value;
                for(let i=0; i<5; i++) {
                    state.particles.push({
                        x: c.x, y: c.y,
                        vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5,
                        life: 20, color: '#FFD700', size: 3
                    });
                }
        }
    });

    state.distance = Math.floor(u.x / 10);
    
    // Biome Progression
    if (state.distance > 0 && state.distance % 1000 === 0 && state.distance !== state.lastBiomeSwitch) {
        const biomes: BiomeType[] = ['MEADOW', 'CANDY', 'SKY'];
        const nextBiomeIndex = (biomes.indexOf(state.biome) + 1) % biomes.length;
        state.biome = biomes[nextBiomeIndex];
        state.lastBiomeSwitch = state.distance;
    }

    const lastObs = state.obstacles[state.obstacles.length - 1];
    if (lastObs && lastObs.x < state.camera.x + 1500) {
        const chunk = generateChunk(lastObs.x + lastObs.width + 200, state.biome);
        state.obstacles.push(...chunk.obstacles);
        state.collectibles.push(...chunk.collectibles);
    }
    
    state.obstacles = state.obstacles.filter(o => o.x > state.camera.x - 500);
    state.collectibles = state.collectibles.filter(c => c.x > state.camera.x - 500);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(ctx, time);
    
    state.obstacles.forEach(o => drawObstacle(ctx, o, state.camera.x));
    state.collectibles.filter(c => !c.collected).forEach(c => drawCollectible(ctx, c, state.camera.x, time));
    
    drawUnicorn(ctx, state.camera.x, time);
    
    state.particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life--;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 20;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.roundRect(10, 10, 200, 50, 10);
    ctx.fill();
    ctx.fillStyle = '#FF69B4';
    ctx.font = 'bold 24px Comic Sans MS, Arial';
    ctx.fillText(`⭐ ${state.score}`, 25, 42);
    ctx.fillStyle = '#666';
    ctx.font = '16px Arial';
    ctx.fillText(`Dist: ${state.distance}m`, 110, 42);

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [highScore, customization, createObstacle, generateChunk, drawBackground, drawObstacle, drawUnicorn]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === ' ' || e.key === 'Enter') {
        const state = gameStateRef.current;
        if (!state.started || state.gameOver) initGame();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    }
  }, [initGame]);

  useEffect(() => {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [gameLoop]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFB6C1 0%, #87CEEB 100%)',
      fontFamily: 'Comic Sans MS, cursive, sans-serif'
    }}>
      <h1 style={{ 
          fontSize: '3rem', 
          color: '#FFF', 
          textShadow: '3px 3px 0 #FF1493',
          marginBottom: '20px'
      }}>
        🦄 Unicorn Run 2.0
      </h1>

      <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <canvas 
            ref={canvasRef} 
            width={800} 
            height={500} 
            style={{ background: '#FFF', display: 'block' }}
        />
        
        {(!gameStateRef.current.started || gameStateRef.current.gameOver) && (
            <div style={{
                position: 'absolute', inset: 0, 
                background: 'rgba(0,0,0,0.6)', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: 'white', textAlign: 'center'
            }}>
                <h2 style={{ fontSize: '3rem', margin: 0 }}>
                    {gameStateRef.current.gameOver ? 'Game Over!' : 'Ready to Run?'}
                </h2>
                <p style={{ fontSize: '1.5rem' }}>
                    {gameStateRef.current.gameOver ? `Score: ${gameStateRef.current.score}` : 'Press SPACE to Start'}
                </p>
                <button 
                    onClick={initGame}
                    style={{
                        padding: '15px 40px', fontSize: '1.5rem', borderRadius: '50px',
                        background: '#FF1493', color: 'white', border: 'none', cursor: 'pointer',
                        marginTop: '20px', boxShadow: '0 5px 15px rgba(255,20,147,0.4)'
                    }}
                >
                    {gameStateRef.current.gameOver ? 'Try Again' : 'Let\'s Go!'}
                </button>
                <button
                    onClick={() => setShowCustomize(true)}
                    style={{
                        marginTop: '15px', background: 'transparent', border: '2px solid white',
                        color: 'white', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer'
                    }}
                >
                    🎨 Customize Unicorn
                </button>
            </div>
        )}
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center', color: '#FFF' }}>
        <p>Controls: Arrows / WASD to Move & Jump</p>
      </div>

      {showCustomize && (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'white', padding: '30px', borderRadius: '20px', maxWidth: '400px', width: '90%'
            }}>
                <h2 style={{ textAlign: 'center', color: '#FF1493' }}>Style Your Unicorn</h2>
                
                {['Body', 'Mane', 'Horn'].map(part => (
                    <div key={part} style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{part} Color</label>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {UNICORN_COLORS[part.toLowerCase() as keyof typeof UNICORN_COLORS].map(c => (
                                <div 
                                    key={c}
                                    onClick={() => setCustomization(prev => ({
                                        ...prev, 
                                        [`${part.toLowerCase()}Color`]: c
                                    }))}
                                    style={{
                                        width: '30px', height: '30px', borderRadius: '50%', background: c,
                                        cursor: 'pointer', border: '2px solid #ddd',
                                        transform: customization[`${part.toLowerCase()}Color` as keyof typeof customization] === c ? 'scale(1.2)' : 'none',
                                        borderColor: customization[`${part.toLowerCase()}Color` as keyof typeof customization] === c ? '#FF1493' : '#ddd'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                
                <button 
                    onClick={() => setShowCustomize(false)}
                    style={{
                        width: '100%', padding: '15px', background: '#FF1493', color: 'white',
                        border: 'none', borderRadius: '10px', fontSize: '1.2rem', cursor: 'pointer'
                    }}
                >
                    Done
                </button>
            </div>
        </div>
      )}
    </div>
  );
}
