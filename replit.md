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
- **2024-09-24**: Project imported and configured for Replit environment
  - Set up PostgreSQL database with complete schema migration
  - Configured Vite dev server for port 5000 with proper host allowance
  - Fixed database connection issues by updating storage layer
  - Created workflow for full-stack development server
  - Configured deployment settings for production

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