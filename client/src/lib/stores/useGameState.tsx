import { create } from "zustand";
import { usePlayerStats } from "./usePlayerStats";

export type GamePhase = "ready" | "playing" | "paused" | "ended";

interface GameSessionData {
  startTime: number;
  endTime?: number;
  enemiesKilled: number;
  powerUpsCollected: number;
  bulletsShot: number;
  bulletsHit: number;
  maxLevel: number;
}

interface GameState {
  gamePhase: GamePhase;
  score: number;
  lives: number;
  level: number;
  sessionData: GameSessionData;
  
  // Actions
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: (finalStats?: Partial<GameSessionData>) => Promise<void>;
  restartGame: () => void;
  setScore: (score: number) => void;
  setLives: (lives: number) => void;
  setLevel: (level: number) => void;
  incrementLevel: () => void;
  updateSessionData: (data: Partial<GameSessionData>) => void;
  incrementEnemiesKilled: () => void;
  incrementPowerUpsCollected: () => void;
  incrementBulletStats: (shot?: boolean, hit?: boolean) => void;
}

export const useGameState = create<GameState>((set, get) => ({
  gamePhase: "ready",
  score: 0,
  lives: 3,
  level: 1,
  sessionData: {
    startTime: 0,
    enemiesKilled: 0,
    powerUpsCollected: 0,
    bulletsShot: 0,
    bulletsHit: 0,
    maxLevel: 1,
  },
  
  startGame: () => {
    const now = Date.now();
    set({ 
      gamePhase: "playing",
      sessionData: {
        startTime: now,
        enemiesKilled: 0,
        powerUpsCollected: 0,
        bulletsShot: 0,
        bulletsHit: 0,
        maxLevel: 1,
      }
    });
  },
  
  pauseGame: () => set({ gamePhase: "paused" }),
  resumeGame: () => set({ gamePhase: "playing" }),
  
  endGame: async (finalStats?: Partial<GameSessionData>) => {
    const state = get();
    const endTime = Date.now();
    
    // Guard against invalid startTime (0 = game never started properly)
    const gameTime = state.sessionData.startTime > 0 
      ? endTime - state.sessionData.startTime 
      : 0;
    
    // Update session data with final stats
    const finalSessionData = {
      ...state.sessionData,
      endTime,
      ...finalStats,
    };
    
    // Calculate accuracy
    const accuracy = finalSessionData.bulletsShot > 0 
      ? finalSessionData.bulletsHit / finalSessionData.bulletsShot 
      : 0;
    
    // Helper function to get user FID from multiple sources
    const getUserFid = () => {
      const playerStatsState = usePlayerStats.getState();
      let fid = playerStatsState.farcasterFid;
      let displayName = playerStatsState.displayName || 'Player';
      
      if (!fid) {
        const globalContext = (window as any).__miniKitContext__;
        if (globalContext?.user) {
          fid = globalContext.user.fid;
          displayName = globalContext.user.displayName || 'Player';
        }
      }
      
      return { fid, displayName };
    };
    
    // Helper function to get or refresh auth token
    const getAuthToken = async (fid: number, displayName: string, forceRefresh = false): Promise<string | null> => {
      let token = localStorage.getItem('authToken');
      
      if (!forceRefresh && token) {
        console.log('✅ Using existing auth token from localStorage');
        return token;
      }
      
      console.log(forceRefresh ? '🔄 Refreshing auth token...' : '🔐 Getting new auth token...');
      
      try {
        const authResponse = await fetch('/api/farcaster/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fid,
            username: `farcaster_${fid}`,
            displayName,
          }),
        });
        
        if (authResponse.ok) {
          const authData = await authResponse.json();
          if (authData.token) {
            localStorage.setItem('authToken', authData.token);
            console.log('✅ Auth token obtained and saved');
            return authData.token;
          }
        }
        
        console.error('❌ Failed to get auth token:', authResponse.status);
        return null;
      } catch (error) {
        console.error('❌ Error getting auth token:', error);
        return null;
      }
    };
    
    // Helper function to save game session with retry logic
    const saveGameSession = async (authToken: string, gameData: any): Promise<{ success: boolean; shouldRetry: boolean }> => {
      try {
        const response = await fetch('/api/game/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(gameData),
        });
        
        console.log('🌐 Game save API response:', response.status, response.statusText);
        
        if (response.ok) {
          const responseData = await response.json();
          console.log('✅ Game session saved successfully:', responseData);
          return { success: true, shouldRetry: false };
        } else if (response.status === 401) {
          console.log('⚠️ Auth token expired or invalid (401 response) - will retry with fresh token');
          return { success: false, shouldRetry: true };
        } else {
          const errorText = await response.text();
          console.error('❌ Failed to save game session (non-auth error):', response.status, errorText);
          return { success: false, shouldRetry: false };
        }
      } catch (error) {
        console.error('❌ Network error during game save:', error);
        return { success: false, shouldRetry: false };
      }
    };
    
    try {
      console.log('🎮 Starting game save process...');
      console.log('📊 Game session data:', {
        score: state.score,
        level: finalSessionData.maxLevel,
        enemiesKilled: finalSessionData.enemiesKilled,
        powerUps: finalSessionData.powerUpsCollected,
        gameTime,
        startTime: state.sessionData.startTime
      });
      
      // Get user FID
      const { fid, displayName } = getUserFid();
      
      if (!fid) {
        console.error('❌ CRITICAL: No Farcaster FID available - cannot save game');
        console.log('🔧 Check: playerStats store:', usePlayerStats.getState().farcasterFid);
        console.log('🔧 Check: global context:', (window as any).__miniKitContext__?.user);
        set({ gamePhase: "ended", sessionData: finalSessionData });
        return;
      }
      
      console.log('👤 User identified:', { fid, displayName });
      
      // Get auth token
      let authToken = await getAuthToken(fid, displayName);
      
      if (!authToken) {
        console.error('❌ CRITICAL: Failed to obtain auth token - cannot save game');
        set({ gamePhase: "ended", sessionData: finalSessionData });
        return;
      }
      
      // Prepare game session data
      const gameSessionData = {
        score: state.score,
        level: finalSessionData.maxLevel,
        gameTime,
        enemiesKilled: finalSessionData.enemiesKilled,
        powerUpsCollected: finalSessionData.powerUpsCollected,
        accuracy,
      };
      
      console.log('💾 Attempting to save game session...');
      
      // Try to save with current token
      let saveResult = await saveGameSession(authToken, gameSessionData);
      
      // Only retry if we got a 401 (auth failure) - not for other errors
      if (!saveResult.success && saveResult.shouldRetry && authToken) {
        console.log('🔄 Token expired - retrying with fresh auth token...');
        authToken = await getAuthToken(fid, displayName, true);
        
        if (authToken) {
          saveResult = await saveGameSession(authToken, gameSessionData);
        }
      }
      
      // If save was successful, update local stats (with null-safe defaults)
      if (saveResult.success) {
        const playerStats = usePlayerStats.getState();
        const currentStats = playerStats.stats || {
          gamesPlayed: 0,
          totalScore: 0,
          enemiesDestroyed: 0,
          timePlayedMinutes: 0,
          highScore: 0
        };
        
        // Only update timePlayedMinutes if gameTime is valid
        const timePlayedUpdate = gameTime > 0 ? Math.round(gameTime / 60000) : 0;
        
        playerStats.updateStats({
          gamesPlayed: (currentStats.gamesPlayed ?? 0) + 1,
          totalScore: (currentStats.totalScore ?? 0) + state.score,
          enemiesDestroyed: (currentStats.enemiesDestroyed ?? 0) + finalSessionData.enemiesKilled,
          timePlayedMinutes: (currentStats.timePlayedMinutes ?? 0) + timePlayedUpdate,
        });
        
        if (state.score > (currentStats.highScore ?? 0)) {
          playerStats.updateStats({ highScore: state.score });
        }
        
        console.log('📊 Local player stats updated successfully');
        
        // Dispatch event to notify profile page to refresh data
        window.dispatchEvent(new CustomEvent('gameCompleted', { 
          detail: { 
            score: state.score, 
            level: finalSessionData.maxLevel,
            enemiesKilled: finalSessionData.enemiesKilled,
            gameTime 
          } 
        }));
      } else {
        console.error('❌ Game session save failed - no retry needed for non-auth errors');
      }
      
    } catch (error) {
      console.error('❌ Unexpected error in endGame:', error);
    }
    
    set({ 
      gamePhase: "ended",
      sessionData: finalSessionData
    });
  },
  
  restartGame: () => set({ 
    gamePhase: "ready", 
    score: 0, 
    lives: 3, 
    level: 1,
    sessionData: {
      startTime: 0,
      enemiesKilled: 0,
      powerUpsCollected: 0,
      bulletsShot: 0,
      bulletsHit: 0,
      maxLevel: 1,
    }
  }),
  
  setScore: (score: number) => set({ score }),
  setLives: (lives: number) => set({ lives }),
  setLevel: (level: number) => set((state) => ({ 
    level,
    sessionData: {
      ...state.sessionData,
      maxLevel: Math.max(state.sessionData.maxLevel, level)
    }
  })),
  incrementLevel: () => set((state) => ({ 
    level: state.level + 1,
    sessionData: {
      ...state.sessionData,
      maxLevel: Math.max(state.sessionData.maxLevel, state.level + 1)
    }
  })),
  
  updateSessionData: (data: Partial<GameSessionData>) => 
    set((state) => ({
      sessionData: { ...state.sessionData, ...data }
    })),
    
  incrementEnemiesKilled: () => 
    set((state) => ({
      sessionData: {
        ...state.sessionData,
        enemiesKilled: state.sessionData.enemiesKilled + 1
      }
    })),
    
  incrementPowerUpsCollected: () => 
    set((state) => ({
      sessionData: {
        ...state.sessionData,
        powerUpsCollected: state.sessionData.powerUpsCollected + 1
      }
    })),
    
  incrementBulletStats: (shot = false, hit = false) => 
    set((state) => ({
      sessionData: {
        ...state.sessionData,
        bulletsShot: state.sessionData.bulletsShot + (shot ? 1 : 0),
        bulletsHit: state.sessionData.bulletsHit + (hit ? 1 : 0)
      }
    })),
}));

// Helper function to access game session data
export const getGameSessionStats = () => {
  const state = useGameState.getState();
  return {
    ...state.sessionData,
    gameTime: state.sessionData.endTime 
      ? state.sessionData.endTime - state.sessionData.startTime 
      : Date.now() - state.sessionData.startTime,
    accuracy: state.sessionData.bulletsShot > 0 
      ? state.sessionData.bulletsHit / state.sessionData.bulletsShot 
      : 0,
  };
};
