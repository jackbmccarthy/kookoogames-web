# KooKoo Games - Web Games for Kids

**Version:** 1.0.0
**Status:** In Development
**Last Updated:** March 1, 2026
**Location:** `/home/jack/clawd/old-projects/kookoogames`

---

## Overview

KooKoo Games is a collection of fun, educational web games built for kids. The platform features touch-friendly HTML5 canvas games accessible from any device.

### Key Features
- **Web Games** - HTML5 canvas-based games
- **Mobile App** - Expo/React Native wrapper
- **Touch-Friendly** - Designed for tablets and phones
- **Kid-Safe** - No ads, no in-app purchases

---

## Games

### 🔍 Word Search
Classic word search puzzle with touch-friendly word selection.

**Features:**
- Touch/drag word selection
- Multiple word categories
- Star animations on completion
- Responsive design

### 🦄 Unicorn Run
Endless runner game with a jumping unicorn.

**Features:**
- Tap to jump
- Climb platforms
- Score tracking
- Colorful graphics

---

## Technology Stack

### Web App
- **Framework:** Next.js 14
- **Language:** TypeScript
- **Rendering:** HTML5 Canvas
- **Styling:** CSS

### Mobile App
- **Framework:** Expo (React Native)
- **Language:** TypeScript
- **Navigation:** React Navigation

---

## Project Structure

```
kookoogames/
├── apps/
│   ├── web/                    # Next.js Web App
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── games/
│   │   │   │   │   ├── word-search/
│   │   │   │   │   └── unicorn-run/
│   │   │   │   ├── globals.css
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   └── ...
│   │   ├── package.json
│   │   └── next.config.js
│   └── mobile/                 # Expo Mobile App
│       ├── src/
│       ├── App.tsx
│       ├── app.json
│       └── package.json
└── packages/                   # Shared packages
```

---

## Getting Started

### Web App
```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000

### Mobile App
```bash
cd apps/mobile
npm install
npx expo start
```

---

## Deployment

### Web (Vercel)
```bash
cd apps/web
vercel --prod
```

### Mobile (EAS)
```bash
cd apps/mobile
eas build --platform ios
eas build --platform android
```

---

## Future Games (Planned)

- [ ] Memory Match
- [ ] Coloring Book
- [ ] Puzzle Pieces
- [ ] Number Bingo
- [ ] Letter Tracing
- [ ] Shape Sorter

---

## License

Private project - All rights reserved

---

## Authors

- **Jack McCarthy** - Project Owner
