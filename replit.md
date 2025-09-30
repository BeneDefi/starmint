# Farcaster Miniapp Game Project

## Overview
This is a full-stack React + Express.js application featuring a Farcaster miniapp game. The project includes:
- Interactive 3D space shooter game built with React Three Fiber
- Real-time leaderboards and social features
- Farcaster authentication integration
- PostgreSQL database with comprehensive player statistics
- Web3 wallet integration with wagmi

## Architecture
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Game Engine**: React Three Fiber + WebGL
- **Authentication**: JWT + Farcaster integration
- **Deployment**: Configured for Replit autoscale

## Project Structure
```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # React components including game engine
│   │   ├── lib/           # Utility libraries and game logic
│   │   ├── hooks/         # Custom React hooks
│   │   └── styles/        # CSS and styling
├── server/                # Express.js backend
│   ├── api/              # API route handlers
│   ├── db.ts             # Database configuration
│   ├── storage.ts        # Data access layer
│   └── routes.ts         # API route definitions
├── shared/               # Shared TypeScript types and schemas
└── public/              # Static assets and Farcaster manifest
```

## Recent Changes
- **2025-09-30**: Successfully imported GitHub repository to Replit environment
  - ✅ Verified all npm dependencies installed (1213 packages)
  - ✅ Created fresh PostgreSQL database with Neon backend (DATABASE_URL configured)
  - ✅ Pushed database schema successfully with Drizzle (`npm run db:push`)
  - ✅ Configured "Game Server" workflow with webview output on port 5000
  - ✅ Environment variables configured in start-dev.sh: JWT_SECRET and GAME_ENCRYPTION_KEY
  - ✅ Vite dev server pre-configured with `allowedHosts: true` for Replit proxy compatibility
  - ✅ Frontend confirmed working: STARMINT space shooter game UI loads correctly
  - ✅ Backend confirmed working: Express server running on port 5000, Farcaster manifest served
  - ✅ Deployment configured for production autoscale with build and start scripts
  - ✅ All systems operational: frontend, backend, database, and Farcaster miniapp integration

## Development Setup
1. Environment variables are set in the workflow:
   - `JWT_SECRET`: For user authentication tokens
   - `GAME_ENCRYPTION_KEY`: For game state encryption
   - `DATABASE_URL`: PostgreSQL connection (automatically configured)

2. Database schema includes:
   - User management with Farcaster FID support
   - Player statistics and game sessions
   - Leaderboards and rankings
   - Achievement tracking
   - Daily login streaks

## Running the Project
- **Development**: Workflow "Server" runs `npm run dev` on port 5000
- **Database**: Automatically configured PostgreSQL with Drizzle ORM
- **Build**: `npm run build` creates production bundle
- **Production**: `npm start` serves built application

## Key Features
- 3D space shooter game with multiple enemy types and power-ups
- Real-time score validation and anti-cheat measures
- Social leaderboards with daily/weekly/monthly rankings
- Farcaster integration for social sharing
- Web3 wallet connection with wagmi
- Progressive Web App capabilities
- Responsive design for mobile and desktop

## User Preferences
- Full-stack TypeScript application
- Modern React patterns with hooks and functional components
- Tailwind CSS for styling
- Comprehensive error handling and validation
- Security-focused development with encryption and JWT