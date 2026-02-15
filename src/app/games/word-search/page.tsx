'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Grade-appropriate word lists (1st-5th grade)
const WORD_LISTS: Record<string, Record<string, string[]>> = {
  '1st Grade': {
    animals: ['CAT', 'DOG', 'BIRD', 'FISH', 'COW', 'PIG', 'HEN', 'FOX', 'BEE', 'ANT'],
    colors: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PINK', 'BLACK', 'WHITE', 'BROWN', 'ORANGE', 'PURPLE'],
    numbers: ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN'],
    family: ['MOM', 'DAD', 'SIS', 'BRO', 'BABY', 'GRAN', 'AUNT', 'UNCLE'],
    body: ['EYE', 'EAR', 'NOSE', 'HAND', 'FOOT', 'LEG', 'ARM', 'HEAD'],
    weather: ['SUN', 'RAIN', 'SNOW', 'WIND', 'COLD', 'HOT', 'WARM', 'CLOUD'],
    food: ['APPLE', 'BREAD', 'MILK', 'EGG', 'RICE', 'SOUP', 'CAKE', 'CORN'],
    nature: ['TREE', 'FLOWER', 'GRASS', 'LEAF', 'ROCK', 'WATER', 'SKY', 'MOON'],
    school: ['BOOK', 'PEN', 'DESK', 'BAG', 'BUS', 'BELL', 'MAP', 'CHALK'],
    actions: ['RUN', 'JUMP', 'WALK', 'PLAY', 'READ', 'SING', 'DRAW', 'SWIM']
  },
  '2nd Grade': {
    animals: ['LION', 'TIGER', 'BEAR', 'WOLF', 'DEER', 'RABBIT', 'SNAKE', 'EAGLE', 'SHARK', 'WHALE'],
    nature: ['RIVER', 'OCEAN', 'MOUNTAIN', 'DESERT', 'FOREST', 'ISLAND', 'VALLEY', 'BEACH'],
    weather: ['STORM', 'THUNDER', 'LIGHTNING', 'FOGGY', 'FREEZE', 'SUNNY', 'BREEZY', 'RAINY'],
    home: ['HOUSE', 'ROOM', 'DOOR', 'WINDOW', 'KITCHEN', 'BEDROOM', 'GARAGE', 'YARD'],
    school: ['TEACHER', 'STUDENT', 'CLASS', 'LESSON', 'SPELLING', 'MATH', 'SCIENCE', 'MUSIC'],
    food: ['BANANA', 'ORANGE', 'CARROT', 'POTATO', 'CHEESE', 'BUTTER', 'SALAD', 'PIZZA'],
    sports: ['SOCCER', 'BASEBALL', 'TENNIS', 'HOCKEY', 'SKIING', 'BIKING', 'SKATING', 'SWIMMING'],
    jobs: ['DOCTOR', 'NURSE', 'FARMER', 'DRIVER', 'PILOT', 'CHEF', 'ARTIST', 'DANCER'],
    time: ['MORNING', 'NOON', 'AFTERNOON', 'EVENING', 'NIGHT', 'TODAY', 'TOMORROW', 'YESTERDAY'],
    places: ['PARK', 'STORE', 'LIBRARY', 'MUSEUM', 'HOSPITAL', 'AIRPORT', 'CHURCH', 'ZOO']
  },
  '3rd Grade': {
    science: ['ENERGY', 'MATTER', 'FORCE', 'MOTION', 'GRAVITY', 'MAGNET', 'ELECTRIC', 'SOLAR'],
    space: ['PLANET', 'STAR', 'GALAXY', 'ASTEROID', 'COMET', 'ORBIT', 'ROCKET', 'SHUTTLE'],
    geography: ['COUNTRY', 'STATE', 'CAPITAL', 'CITY', 'TOWN', 'VILLAGE', 'BORDER', 'REGION'],
    animals: ['DOLPHIN', 'PENGUIN', 'KANGAROO', 'ELEPHANT', 'GIRAFFE', 'CHEETAH', 'GORILLA', 'PANDA'],
    body: ['SKELETON', 'MUSCLE', 'BRAIN', 'HEART', 'LUNGS', 'STOMACH', 'BLOOD', 'NERVE'],
    plants: ['SEED', 'ROOT', 'STEM', 'TRUNK', 'BRANCH', 'PETAL', 'POLLEN', 'GROWTH'],
    weather: ['TORNADO', 'HURRICANE', 'DROUGHT', 'FLOOD', 'QUAKE', 'VOLCANO', 'AVALANCHE', 'BLIZZARD'],
    math: ['FRACTION', 'DECIMAL', 'DIVISION', 'MULTIPLY', 'GEOMETRY', 'ANGLE', 'MEASURE', 'WEIGHT'],
    history: ['ANCIENT', 'MODERN', 'CENTURY', 'DECADE', 'COLONY', 'REVOLUTION', 'PRESIDENT', 'INVENTOR'],
    adjectives: ['BEAUTIFUL', 'WONDERFUL', 'TERRIBLE', 'MYSTERIOUS', 'ENORMOUS', 'TINY', 'FAMOUS', 'BRAVE']
  },
  '4th Grade': {
    science: ['MOLECULE', 'ATOM', 'ELEMENT', 'COMPOUND', 'REACTION', 'DENSITY', 'VOLUME', 'PRESSURE'],
    ecosystems: ['HABITAT', 'ECOSYSTEM', 'POPULATION', 'COMMUNITY', 'PREDATOR', 'PREY', 'OMNIVORE', 'CARNIVORE'],
    government: ['DEMOCRACY', 'REPUBLIC', 'CONGRESS', 'SENATE', 'CONSTITUTION', 'AMENDMENT', 'ELECTION', 'VOTE'],
    geography: ['CONTINENT', 'HEMISPHERE', 'EQUATOR', 'LATITUDE', 'LONGITUDE', 'CLIMATE', 'TROPICAL', 'ARCTIC'],
    literature: ['CHAPTER', 'PARAGRAPH', 'SENTENCE', 'CHARACTER', 'SETTING', 'PLOT', 'DIALOGUE', 'NARRATOR'],
    grammar: ['NOUN', 'VERB', 'ADJECTIVE', 'ADVERB', 'PRONOUN', 'PREPOSITION', 'CONJUNCTION', 'ARTICLE'],
    history: ['COLONIAL', 'REVOLUTIONARY', 'INDUSTRIAL', 'CIVILIZATION', 'IMMIGRANT', 'EXPLORER', 'PIONEER', 'NATIVE'],
    math: ['EQUATION', 'VARIABLE', 'SOLUTION', 'ALGEBRA', 'PERIMETER', 'AREA', 'VOLUME', 'COORDINATE'],
    technology: ['COMPUTER', 'INTERNET', 'SOFTWARE', 'HARDWARE', 'PROGRAM', 'DATABASE', 'NETWORK', 'DIGITAL'],
    health: ['NUTRITION', 'EXERCISE', 'HYGIENE', 'BACTERIA', 'VIRUS', 'IMMUNE', 'CALORIES', 'PROTEIN']
  },
  '5th Grade': {
    science: ['PHOTOSYNTHESIS', 'CHROMOSOME', 'GENETICS', 'EVOLUTION', 'ADAPTATION', 'SPECIES', 'ORGANISM', 'CELL'],
    chemistry: ['CHEMICAL', 'SOLUTION', 'SOLVENT', 'MIXTURE', 'SUSPENSION', 'SATURATED', 'PRECIPITATE', 'ACID'],
    physics: ['VELOCITY', 'ACCELERATION', 'FRICTION', 'INERTIA', 'MOMENTUM', 'KINETIC', 'POTENTIAL', 'CONDUCTOR'],
    astronomy: ['CONSTELLATION', 'TELESCOPE', 'SATELLITE', 'ATMOSPHERE', 'ECLIPSE', 'SOLAR', 'LUNAR', 'GALAXY'],
    government: ['LEGISLATIVE', 'EXECUTIVE', 'JUDICIAL', 'FEDERAL', 'SOVEREIGNTY', 'RATIFICATION', 'VETO', 'TREATY'],
    history: ['RENAISSANCE', 'ENLIGHTENMENT', 'IMPERIALISM', 'COLONIZATION', 'REVOLUTION', 'DEMOCRACY', 'DICTATOR', 'MONARCHY'],
    literature: ['PROTAGONIST', 'ANTAGONIST', 'METAPHOR', 'SIMILE', 'FORESHADOW', 'SYMBOLISM', 'IRONY', 'THEME'],
    economics: ['SUPPLY', 'DEMAND', 'INFLATION', 'RECESSION', 'TARIFF', 'EXPORT', 'IMPORT', 'CURRENCY'],
    biology: ['VERTEBRATE', 'INVERTEBRATE', 'AMPHIBIAN', 'REPTILE', 'MAMMAL', 'RESPIRATION', 'CIRCULATION', 'DIGESTION'],
    geography: ['ARCHIPELAGO', 'PENINSULA', 'TRIBUTARY', 'DELTA', 'PLATEAU', 'SAVANNAH', 'TUNDRA', 'RAINFOREST']
  }
};

const GRID_OPTIONS = [
  { label: 'Easy (8×8)', size: 8, wordCount: 5 },
  { label: 'Medium (12×12)', size: 12, wordCount: 8 },
  { label: 'Hard (15×15)', size: 15, wordCount: 10 },
  { label: 'Expert (20×20)', size: 20, wordCount: 12 },
];

interface Cell {
  letter: string;
  highlighted: boolean;
  found: boolean;
  row: number;
  col: number;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  velocity: { x: number; y: number };
}

export default function WordSearch() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState<Cell[]>([]);
  const [stars, setStars] = useState<Star[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [score, setScore] = useState(0);
  
  // Settings state
  const [currentGrade, setCurrentGrade] = useState<string>('3rd Grade');
  const [currentCategory, setCurrentCategory] = useState<string>('science');
  const [gridOption, setGridOption] = useState(GRID_OPTIONS[1]); // Default to Medium 12x12
  const [cellSize, setCellSize] = useState(28); // Will be calculated dynamically
  
  const starIdRef = useRef(0);

  const GRID_SIZE = gridOption.size;

  // Calculate cell size to fit screen
  useEffect(() => {
    const calculateCellSize = () => {
      const viewportWidth = window.innerWidth;
      const pagePadding = 40; // Page padding (20px each side)
      const gridPadding = 30; // Grid container padding (15px each side)
      const gap = 2; // Gap between cells
      const availableWidth = viewportWidth - pagePadding - gridPadding;
      const totalGaps = (GRID_SIZE - 1) * gap;
      const maxCellSize = Math.floor((availableWidth - totalGaps) / GRID_SIZE);
      // Clamp between reasonable min/max values
      const clampedSize = Math.max(18, Math.min(maxCellSize, 45));
      setCellSize(clampedSize);
    };
    
    calculateCellSize();
    window.addEventListener('resize', calculateCellSize);
    return () => window.removeEventListener('resize', calculateCellSize);
  }, [GRID_SIZE]);

  // Generate the word search grid
  const generateGrid = useCallback(() => {
    const newGrid: Cell[][] = Array(GRID_SIZE).fill(null).map((_, row) =>
      Array(GRID_SIZE).fill(null).map((_, col) => ({
        letter: '',
        highlighted: false,
        found: false,
        row,
        col
      }))
    );

    // Select random words from current category
    const gradeWords = WORD_LISTS[currentGrade] || WORD_LISTS['1st Grade'];
    const categoryWords = [...(gradeWords[currentCategory] || gradeWords[Object.keys(gradeWords)[0]])];
    const selectedWords: string[] = [];
    const wordCount = Math.min(gridOption.wordCount, categoryWords.length);
    
    for (let i = 0; i < wordCount && categoryWords.length > 0; i++) {
      const idx = Math.floor(Math.random() * categoryWords.length);
      selectedWords.push(categoryWords.splice(idx, 1)[0]);
    }
    setWords(selectedWords);

    // Place words in grid
    const directions = [
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 1 },
      { dx: 1, dy: -1 }
    ];

    selectedWords.forEach(word => {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 200) {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const startRow = Math.floor(Math.random() * GRID_SIZE);
        const startCol = Math.floor(Math.random() * GRID_SIZE);
        
        const endRow = startRow + dir.dy * (word.length - 1);
        const endCol = startCol + dir.dx * (word.length - 1);
        
        if (endRow >= 0 && endRow < GRID_SIZE && endCol >= 0 && endCol < GRID_SIZE) {
          let canPlace = true;
          for (let i = 0; i < word.length; i++) {
            const row = startRow + dir.dy * i;
            const col = startCol + dir.dx * i;
            const cell = newGrid[row][col];
            if (cell.letter !== '' && cell.letter !== word[i]) {
              canPlace = false;
              break;
            }
          }
          
          if (canPlace) {
            for (let i = 0; i < word.length; i++) {
              const row = startRow + dir.dy * i;
              const col = startCol + dir.dx * i;
              newGrid[row][col].letter = word[i];
            }
            placed = true;
          }
        }
        attempts++;
      }
    });

    // Fill remaining cells
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (newGrid[row][col].letter === '') {
          newGrid[row][col].letter = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }

    setGrid(newGrid);
    setFoundWords(new Set());
    setShowCelebration(false);
    setScore(0);
  }, [currentGrade, currentCategory, GRID_SIZE, gridOption.wordCount]);

  useEffect(() => {
    generateGrid();
  }, [generateGrid]);

  // Create star explosion
  const createStars = (x: number, y: number) => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98FB98', '#FF69B4', '#00CED1'];
    const newStars: Star[] = [];
    
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.5;
      const speed = 4 + Math.random() * 8;
      newStars.push({
        id: starIdRef.current++,
        x,
        y,
        size: 25 + Math.random() * 25,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        }
      });
    }
    
    setStars(prev => [...prev, ...newStars]);
    
    setTimeout(() => {
      setStars(prev => prev.filter(s => !newStars.find(ns => ns.id === s.id)));
    }, 1200);
  };

  // Animate stars
  useEffect(() => {
    if (stars.length === 0) return;
    
    const interval = setInterval(() => {
      setStars(prev => prev.map(star => ({
        ...star,
        x: star.x + star.velocity.x,
        y: star.y + star.velocity.y,
        velocity: { x: star.velocity.x * 0.94, y: star.velocity.y * 0.94 + 0.8 },
        rotation: star.rotation + 15,
        size: star.size * 0.96
      })));
    }, 16);
    
    return () => clearInterval(interval);
  }, [stars.length]);

  // Handle touch/mouse selection
  const handleStart = (row: number, col: number) => {
    setIsSelecting(true);
    const cell = grid[row][col];
    setSelectedCells([cell]);
    setGrid(prev => prev.map(r => r.map(c => ({ ...c, highlighted: c.found }))));
    setGrid(prev => {
      const newGrid = [...prev];
      newGrid[row][col].highlighted = true;
      return newGrid;
    });
  };

  const handleMove = (row: number, col: number) => {
    if (!isSelecting) return;
    
    const cell = grid[row][col];
    
    // Correction Logic: Allow changing direction if we only have 2 cells selected
    if (selectedCells.length === 2) {
      const first = selectedCells[0];
      const second = selectedCells[1];
      const dRow = row - first.row;
      const dCol = col - first.col;
      
      // If we moved to a neighbor of the start cell that isn't the current second cell
      if ((row !== second.row || col !== second.col) && 
          Math.abs(dRow) <= 1 && Math.abs(dCol) <= 1 && 
          (dRow !== 0 || dCol !== 0)) {
        
        setSelectedCells([first, cell]);
        setGrid(prev => {
          const newGrid = [...prev];
          // Clear highlight of the old second cell (unless it's found)
          if (!second.found) {
            newGrid[second.row][second.col].highlighted = false;
          }
          // Highlight the new cell
          newGrid[row][col].highlighted = true;
          return newGrid;
        });
        return;
      }
    }

    if (selectedCells.some(c => c.row === row && c.col === col)) return;
    
    if (selectedCells.length === 1) {
      setSelectedCells(prev => [...prev, cell]);
      setGrid(prev => {
        const newGrid = [...prev];
        newGrid[row][col].highlighted = true;
        return newGrid;
      });
    } else if (selectedCells.length > 1) {
      const first = selectedCells[0];
      const last = selectedCells[selectedCells.length - 1];
      const dRow = last.row - first.row;
      const dCol = last.col - first.col;
      const stepRow = dRow === 0 ? 0 : dRow / Math.abs(dRow);
      const stepCol = dCol === 0 ? 0 : dCol / Math.abs(dCol);
      
      const nextRow = last.row + stepRow;
      const nextCol = last.col + stepCol;
      
      const rowDiff = Math.abs(row - nextRow);
      const colDiff = Math.abs(col - nextCol);
      
      const isExactMatch = row === nextRow && col === nextCol;
      const isCloseEnough = rowDiff <= 1 && colDiff <= 1 && 
                            (row === nextRow || col === nextCol || (rowDiff === colDiff));
      
      if (isExactMatch || isCloseEnough) {
        const expectedCell = grid[nextRow]?.[nextCol];
        if (expectedCell && !selectedCells.some(c => c.row === nextRow && c.col === nextCol)) {
          setSelectedCells(prev => [...prev, expectedCell]);
          setGrid(prev => {
            const newGrid = [...prev];
            newGrid[nextRow][nextCol].highlighted = true;
            return newGrid;
          });
        }
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSelecting || selectedCells.length < 1) return;
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element) {
      const match = element.getAttribute('data-cell');
      if (match) {
        const [row, col] = match.split('-').map(Number);
        const rect = element.getBoundingClientRect();
        const cellCenterX = rect.left + rect.width / 2;
        const cellCenterY = rect.top + rect.height / 2;
        const distance = Math.sqrt(
          Math.pow(touch.clientX - cellCenterX, 2) + 
          Math.pow(touch.clientY - cellCenterY, 2)
        );
        
        if (distance < rect.width * 1.2) {
          handleMove(row, col);
        }
      }
    }
  };

  const handleEnd = () => {
    if (!isSelecting) return;
    setIsSelecting(false);
    
    const selectedWord = selectedCells.map(c => c.letter).join('');
    const reversedWord = selectedWord.split('').reverse().join('');
    
    if (words.includes(selectedWord) || words.includes(reversedWord)) {
      const foundWord = words.includes(selectedWord) ? selectedWord : reversedWord;
      
      if (!foundWords.has(foundWord)) {
        setGrid(prev => prev.map(row => row.map(cell => {
          if (selectedCells.some(s => s.row === cell.row && s.col === cell.col)) {
            return { ...cell, found: true, highlighted: true };
          }
          return { ...cell, highlighted: cell.found };
        })));
        
        const avgX = selectedCells.reduce((sum, c) => sum + c.col * cellSize + cellSize / 2, 0) / selectedCells.length;
        const avgY = selectedCells.reduce((sum, c) => sum + c.row * cellSize + cellSize / 2, 0) / selectedCells.length;
        createStars(avgX, avgY);
        
        setScore(prev => prev + foundWord.length * 10);
        setFoundWords(prev => new Set([...prev, foundWord]));
      }
    } else {
      setGrid(prev => prev.map(row => row.map(cell => ({
        ...cell,
        highlighted: cell.found
      }))));
    }
    
    setSelectedCells([]);
  };

  useEffect(() => {
    if (words.length > 0 && foundWords.size === words.length) {
      setShowCelebration(true);
    }
  }, [foundWords, words]);

  const categories = Object.keys(WORD_LISTS[currentGrade] || WORD_LISTS['1st Grade']);
  const grades = Object.keys(WORD_LISTS);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '15px',
      minHeight: '100vh',
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      {/* Header with Settings Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 600,
        marginBottom: '10px'
      }}>
        <h1 style={{
          color: 'white',
          textShadow: '3px 3px 0 #ff6b6b, -1px -1px 0 #4ECDC4',
          fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
          textAlign: 'center',
          flex: 1
        }}>
          🔍 Word Search
        </h1>
        
        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          style={{
            padding: '10px 12px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.9)',
            fontSize: '1.5rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          ⚙️
        </button>
      </div>

      {/* Current Settings Display */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        padding: '8px 20px',
        borderRadius: '15px',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '1rem',
        marginBottom: '15px'
      }}>
        {currentGrade} • {currentCategory} • {gridOption.label}
      </div>

      {/* Score */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        padding: '8px 20px',
        borderRadius: '15px',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '1.2rem',
        marginBottom: '15px'
      }}>
        ⭐ Score: {score}
      </div>

      {/* Word List */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '15px',
        justifyContent: 'center',
        maxWidth: '100%',
        padding: '0 10px'
      }}>
        {words.map(word => (
          <div
            key={word}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: foundWords.has(word) ? '#4CAF50' : 'rgba(255,255,255,0.9)',
              color: foundWords.has(word) ? 'white' : '#333',
              fontWeight: 'bold',
              fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
              textDecoration: foundWords.has(word) ? 'line-through' : 'none',
              transition: 'all 0.3s'
            }}
          >
            {foundWords.has(word) && '✓ '}{word}
          </div>
        ))}
      </div>

      {/* Game Grid */}
      <div
        data-grid
        style={{
          position: 'relative',
          background: 'white',
          borderRadius: '15px',
          padding: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          touchAction: 'none'
        }}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchEnd={handleEnd}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
            gap: '2px',
            userSelect: 'none',
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                onMouseDown={() => handleStart(rowIndex, colIndex)}
                onMouseEnter={() => handleMove(rowIndex, colIndex)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleStart(rowIndex, colIndex);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  handleTouchMove(e);
                }}
                data-cell={`${rowIndex}-${colIndex}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `clamp(${cellSize * 0.4}px, ${cellSize * 0.5}px, ${cellSize * 0.6}px)`,
                  fontWeight: 'bold',
                  borderRadius: '6px',
                  background: selectedCells.some(s => s.row === rowIndex && s.col === colIndex)
                    ? '#FFD700'
                    : cell.found 
                      ? '#4CAF50' 
                      : cell.highlighted 
                        ? '#FFD700' 
                        : '#f0f0f0',
                  color: cell.found || cell.highlighted ? 'white' : '#333',
                  cursor: 'pointer',
                  transition: 'background 0.15s, transform 0.1s',
                  transform: cell.highlighted ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                {cell.letter}
              </div>
            ))
          )}
        </div>

        {/* Star Animations */}
        {stars.map(star => (
          <div
            key={star.id}
            style={{
              position: 'absolute',
              left: star.x,
              top: star.y,
              fontSize: star.size,
              transform: `rotate(${star.rotation}deg)`,
              pointerEvents: 'none',
              transition: 'none',
              filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.8))'
            }}
          >
            ⭐
          </div>
        ))}

        {/* Celebration Overlay */}
        {showCelebration && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              borderRadius: '15px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              textAlign: 'center',
              padding: '20px'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎉🎊🌟🏆</div>
            <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 2rem)', marginBottom: '10px' }}>YOU FOUND ALL THE WORDS!</h2>
            <div style={{ fontSize: '1.5rem', marginBottom: '20px' }}>⭐ Final Score: {score}</div>
            <button
              onClick={generateGrid}
              style={{
                padding: '12px 25px',
                fontSize: 'clamp(1rem, 3vw, 1.3rem)',
                borderRadius: '25px',
                border: 'none',
                background: '#FFD700',
                color: '#333',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
              }}
            >
              Play Again! 🎮
            </button>
          </div>
        )}
      </div>

      {/* New Game Button */}
      <button
        onClick={generateGrid}
        style={{
          marginTop: '20px',
          padding: '12px 25px',
          fontSize: '1.1rem',
          borderRadius: '25px',
          border: 'none',
          background: '#FF6B6B',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
        }}
      >
        New Game 🔄
      </button>

      {/* Progress */}
      <div style={{
        marginTop: '15px',
        color: 'white',
        fontSize: '1rem',
        textAlign: 'center'
      }}>
        Found: {foundWords.size} / {words.length} words
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div
          onClick={() => setShowSettings(false)}
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
              background: 'white',
              borderRadius: '20px',
              padding: '25px',
              maxWidth: 400,
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <h2 style={{ textAlign: 'center', marginBottom: 20, color: '#333' }}>⚙️ Settings</h2>
            
            {/* Grid Size */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 10, color: '#555' }}>Grid Size</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {GRID_OPTIONS.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      setGridOption(opt);
                      generateGrid();
                    }}
                    style={{
                      padding: '10px 15px',
                      borderRadius: 10,
                      border: 'none',
                      background: gridOption.label === opt.label ? '#4ECDC4' : '#f0f0f0',
                      color: gridOption.label === opt.label ? 'white' : '#333',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grade Level */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 10, color: '#555' }}>Grade Level</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {grades.map(grade => (
                  <button
                    key={grade}
                    onClick={() => {
                      setCurrentGrade(grade);
                      setCurrentCategory(Object.keys(WORD_LISTS[grade])[0]);
                      generateGrid();
                    }}
                    style={{
                      padding: '10px 15px',
                      borderRadius: 10,
                      border: 'none',
                      background: currentGrade === grade ? '#FF6B6B' : '#f0f0f0',
                      color: currentGrade === grade ? 'white' : '#333',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 10, color: '#555' }}>Category</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCurrentCategory(cat);
                      generateGrid();
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: 'none',
                      background: currentCategory === cat ? '#FFD700' : '#f0f0f0',
                      color: '#333',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowSettings(false)}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: 15,
                border: 'none',
                background: '#4ECDC4',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: 'pointer'
              }}
            >
              Done ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
