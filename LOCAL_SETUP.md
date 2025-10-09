# Local Development Setup Guide

## Problem: Stats & Leaderboard Not Showing Locally or on Farcaster

This happens because **environment variables** (especially the database connection) aren't configured on your local machine or Farcaster deployment.

## ✅ Quick Fix for Local Development

### 1. **Create `.env` file** (Copy from `.env.example`)

```bash
cp .env.example .env
```

### 2. **Configure Your Database URL**

Edit `.env` and add your PostgreSQL database URL:

```env
# Option A: Use Replit's database URL (from your Replit Secrets)
DATABASE_URL=your_postgres_connection_string

# Option B: Use local PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/starmint

# Option C: Use Neon, Supabase, or other hosted Postgres
DATABASE_URL=your_hosted_postgres_url
```

### 3. **Push Database Schema**

```bash
npm run db:push
```

### 4. **Start Development Server**

```bash
npm run dev
# or
./start-dev.sh
```

The app will run on **http://localhost:5000** with both frontend and backend working.

---

## ✅ Fix for Farcaster Deployment

### Option 1: Deploy on Replit (Recommended)

1. **Click "Publish" button** in Replit
2. Replit automatically:
   - Uses the same DATABASE_URL from Secrets
   - Sets up JWT_SECRET and GAME_ENCRYPTION_KEY
   - Serves on production URL

### Option 2: Deploy Elsewhere (Render, Vercel, etc.)

Set these environment variables in your deployment platform:

```env
DATABASE_URL=your_postgres_connection_string
NODE_ENV=production
JWT_SECRET=your_jwt_secret
GAME_ENCRYPTION_KEY=your_game_encryption_key
```

---

## Common Issues

### ❌ "Stats show 0 or don't load"
**Cause:** Database not connected  
**Fix:** Check DATABASE_URL is set correctly in `.env`

### ❌ "Leaderboard is empty"
**Cause:** No game sessions in database  
**Fix:** Play a game to generate data

### ❌ "Profile picture not showing"  
**Cause:** CORS or image loading issues  
**Fix:** Already fixed in latest code (uses fallbacks)

### ❌ "Works on Replit but not locally"
**Cause:** Missing `.env` file  
**Fix:** Create `.env` with DATABASE_URL (see step 1 above)

---

## Database Commands

```bash
# Push schema changes to database
npm run db:push

# Force push (if you get conflicts)
npm run db:push --force

# Build production bundle
npm run build

# Run production server
npm start
```

---

## Architecture Overview

- **Single Server:** Frontend + Backend run together on port 5000
- **API Endpoints:** `/api/*` routes handled by Express
- **Frontend:** Served via Vite (dev) or static files (production)
- **Database:** PostgreSQL with Drizzle ORM

---

## Need Help?

- Check server logs for database connection errors
- Verify `.env` file exists and has valid DATABASE_URL
- Make sure PostgreSQL is running (if using local DB)
