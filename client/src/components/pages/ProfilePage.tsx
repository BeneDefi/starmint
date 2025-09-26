import { ArrowLeft, User, Trophy, Target, Package, Star, Zap, Shield, Rocket, Crown, Medal, TrendingUp, Clock, Gamepad2, Calendar, Award, Users, Flame, ShoppingBag, Gift, Activity, Heart } from "lucide-react";
import { useMiniKit } from "../../lib/miniapp/minikit";
import { usePlayerStats } from "../../lib/stores/usePlayerStats";
import { useEffect, useState } from "react";
import { ACHIEVEMENTS } from "../../lib/web3/achievements";
import { SocialLeaderboard } from "../../lib/social/leaderboard";

interface ProfilePageProps {
  onBack: () => void;
}

// Real inventory will be loaded from purchase history

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { user } = useMiniKit();
  const { stats, isLoading, loadPlayerStats, setUserData, checkDailyLogin, purchaseHistory, currentStreak, lastLoginDate } = usePlayerStats();
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [friendsRanking, setFriendsRanking] = useState<any[]>([]);
  const [totalRewards, setTotalRewards] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [gameSessions, setGameSessions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    console.log('🔍 ProfilePage useEffect triggered with user:', user);
    if (user) {
      console.log('👤 User context available:', { fid: user.fid, displayName: user.displayName });
      // Set user data in the store
      setUserData(user.fid, user.displayName || `Player ${user.fid}`, user.pfpUrl || '');
      // Load player statistics
      console.log('📊 About to call loadPlayerStats with FID:', user.fid);
      loadPlayerStats(user.fid);
      
      // Check daily login
      checkDailyLogin();
      
      // Load social data
      loadSocialData(user.fid);
      
      // Load detailed game history
      loadGameHistory(user.fid);
    } else {
      console.log('❌ No user context available in ProfilePage');
    }
  }, [user, loadPlayerStats, setUserData, checkDailyLogin]);

  // Listen for game completion events to refresh profile data
  useEffect(() => {
    const handleGameCompleted = (event: CustomEvent) => {
      console.log('🎮 Game completed event received:', event.detail);
      if (user) {
        // Refresh player stats and game history after game completion
        setTimeout(() => {
          loadPlayerStats(user.fid);
          loadGameHistory(user.fid);
          console.log('📊 Profile data refreshed after game completion');
        }, 1000); // Small delay to ensure server-side processing is complete
      }
    };

    window.addEventListener('gameCompleted', handleGameCompleted as EventListener);
    
    return () => {
      window.removeEventListener('gameCompleted', handleGameCompleted as EventListener);
    };
  }, [user, loadPlayerStats]);

  const loadSocialData = async (fid: number) => {
    try {
      const leaderboard = SocialLeaderboard.getInstance();
      
      // Get player's global rank (mock implementation)
      const globalBoard = await leaderboard.getLeaderboard({ timeframe: 'allTime', friends: false });
      const rank = globalBoard.findIndex(entry => entry.fid === fid) + 1;
      setPlayerRank(rank > 0 ? rank : null);
      
      // Get friends ranking
      const friends = await leaderboard.getFriendsRanking(fid);
      setFriendsRanking(friends.slice(0, 3)); // Top 3 friends
    } catch (error) {
      console.error('Failed to load social data:', error);
    }
  };

  const loadGameHistory = async (fid: number) => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/player-sessions/${fid}?limit=20`);
      if (response.ok) {
        const data = await response.json();
        const sessions = Array.isArray(data.sessions) ? data.sessions : [];
        setGameSessions(sessions);
        
        // Create recent activity from game sessions with validation
        const activities = sessions.slice(0, 5).map((session: any, index: number) => {
          // Validate session data and provide fallbacks
          const safeScore = typeof session.score === 'number' ? session.score : 0;
          const safeLevel = typeof session.level === 'number' ? session.level : 1;
          const safeGameTime = typeof session.gameTime === 'number' ? session.gameTime : 0;
          const safePlayedAt = session.playedAt ? new Date(session.playedAt) : new Date();
          
          return {
            id: `session-${session.id || index}`,
            type: 'game',
            title: `Game Session #${sessions.length - index}`,
            description: `Score: ${safeScore.toLocaleString()} | Level: ${safeLevel} | ${Math.round(safeGameTime / 60000)}m ${Math.round((safeGameTime % 60000) / 1000)}s`,
            timestamp: safePlayedAt,
            icon: 'gamepad',
            value: safeScore
          };
        });
        setRecentActivity(activities);
      } else {
        console.warn('Failed to fetch game sessions:', response.status, response.statusText);
        setGameSessions([]);
        setRecentActivity([]);
      }
    } catch (error) {
      console.error('Failed to load game history:', error);
      setGameSessions([]);
      setRecentActivity([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Calculate experience level based on total score
  const experienceLevel = Math.floor(stats.totalScore / 1000) + 1;
  const nextLevelXP = experienceLevel * 1000;
  const currentLevelProgress = stats.totalScore % 1000;

  // Format time played
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format game time from milliseconds
  const formatGameTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Calculate average score
  const averageScore = stats.gamesPlayed > 0 ? Math.round(stats.totalScore / stats.gamesPlayed) : 0;
  
  // Calculate accuracy from game sessions with error handling
  const calculateOverallAccuracy = () => {
    if (!Array.isArray(gameSessions) || gameSessions.length === 0) return 0;
    const accuracySessions = gameSessions.filter(s => 
      s && typeof s.accuracy === 'number' && s.accuracy >= 0 && s.accuracy <= 1
    );
    if (accuracySessions.length === 0) return 0;
    const totalAccuracy = accuracySessions.reduce((sum, s) => sum + (s.accuracy * 100), 0);
    return Math.round(totalAccuracy / accuracySessions.length);
  };
  
  const overallAccuracy = calculateOverallAccuracy();

  // Calculate total GALAXIGA rewards
  useEffect(() => {
    const unlockedAchievements = ACHIEVEMENTS.filter(achievement => achievement.condition(stats));
    const totalTokens = unlockedAchievements.reduce((sum, achievement) => sum + achievement.reward, 0);
    setTotalRewards(totalTokens);
  }, [stats]);

  // Map achievements with unlock status - show all achievements
  const achievementsWithStatus = ACHIEVEMENTS.map(achievement => ({
    ...achievement,
    unlocked: achievement.condition(stats),
    progress: getAchievementProgress(achievement, stats)
  }));

  // Calculate progress for locked achievements
  function getAchievementProgress(achievement: any, stats: any): number {
    if (achievement.condition(stats)) return 100;
    
    switch (achievement.id) {
      case 'centurion': return Math.min((stats.enemiesDestroyed / 100) * 100, 100);
      case 'high_scorer': return Math.min((stats.highScore / 10000) * 100, 100);
      case 'social_butterfly': return Math.min((stats.socialShares / 5) * 100, 100);
      case 'friend_magnet': return Math.min((stats.friendsInvited / 3) * 100, 100);
      case 'dedicated_player': return Math.min((stats.streakDays / 7) * 100, 100);
      case 'marathon_gamer': return Math.min((stats.timePlayedMinutes / 60) * 100, 100);
      default: return 0;
    }
  }

  // Get player title based on achievements and stats
  const getPlayerTitle = () => {
    if (stats.highScore > 50000) return { title: "Space Legend", color: "text-purple-400", icon: Crown };
    if (stats.enemiesDestroyed > 500) return { title: "Elite Warrior", color: "text-orange-400", icon: Medal };
    if (stats.gamesPlayed > 50) return { title: "Veteran Pilot", color: "text-blue-400", icon: Award };
    if (achievementsWithStatus.filter(a => a.unlocked).length > 3) return { title: "Achievement Hunter", color: "text-green-400", icon: Trophy };
    return { title: "Space Cadet", color: "text-gray-400", icon: User };
  };

  const playerTitle = getPlayerTitle();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Space background elements */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute top-10 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-400/30 rounded-full blur-2xl" />
      
      {/* Stars */}
      {Array.from({ length: 50 }, (_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}

      <div className="relative z-10 p-3 sm:p-4 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center space-x-2 sm:space-x-4 mb-4 sm:mb-6">
          <button
            onClick={onBack}
            className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-2 sm:p-3 border border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
          </button>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">PROFILE</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 md:space-y-6">
          {/* Player Stats */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-cyan-500/30">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
              {user ? (
                <div className="relative w-12 h-12 sm:w-16 sm:h-16">
                  {user.pfpUrl ? (
                    <img
                      src={user.pfpUrl}
                      alt={user.displayName || 'User profile'}
                      className="w-full h-full rounded-full border-2 border-cyan-400 object-cover"
                      onError={(e) => {
                        // Fallback to default avatar if image fails to load
                        console.log('Profile picture failed to load:', user.pfpUrl);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallbackDiv = target.nextElementSibling as HTMLDivElement;
                        if (fallbackDiv) {
                          fallbackDiv.classList.remove('hidden');
                        }
                      }}
                      onLoad={() => {
                        console.log('Profile picture loaded successfully:', user.pfpUrl);
                      }}
                    />
                  ) : null}
                  <div className={`absolute inset-0 w-full h-full bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center border-2 border-cyan-400 ${user.pfpUrl ? 'hidden' : ''}`}>
                    <span className="text-white font-bold text-sm sm:text-base">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center border-2 border-cyan-400">
                  <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">
                    {user ? user.displayName : 'Player'}
                  </h2>
                  {playerRank && playerRank <= 10 && (
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 mt-1 sm:mt-0" />
                  )}
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                  <playerTitle.icon className={`w-3 h-3 sm:w-4 sm:h-4 ${playerTitle.color}`} />
                  <span className={`text-xs sm:text-sm font-medium ${playerTitle.color}`}>{playerTitle.title}</span>
                </div>
                <div className="text-gray-300 text-xs sm:text-sm space-y-1">
                  {user && (
                    <div className="text-cyan-400">@{user.username}</div>
                  )}
                  {playerRank && (
                    <div>Rank #{playerRank.toLocaleString()}</div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-3 mt-2">
                  <div className="text-xs sm:text-sm shrink-0">
                    <span className="text-gray-400">Level </span>
                    <span className="text-white font-bold">{experienceLevel}</span>
                  </div>
                  <div className="flex-1 bg-slate-700 rounded-full h-1.5 sm:h-2">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentLevelProgress / 1000) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400 shrink-0">
                    {currentLevelProgress}/{1000} XP
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
              <div className="text-center bg-slate-700/30 rounded-lg p-2 sm:p-3">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-cyan-400">{stats.highScore.toLocaleString()}</div>
                <div className="text-xs sm:text-sm text-gray-400">High Score</div>
              </div>
              <div className="text-center bg-slate-700/30 rounded-lg p-2 sm:p-3">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-cyan-400">{stats.enemiesDestroyed.toLocaleString()}</div>
                <div className="text-xs sm:text-sm text-gray-400">Enemies Defeated</div>
              </div>
              <div className="text-center bg-slate-700/30 rounded-lg p-2 sm:p-3">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-cyan-400">{stats.gamesPlayed}</div>
                <div className="text-xs sm:text-sm text-gray-400">Games Played</div>
              </div>
              <div className="text-center bg-slate-700/30 rounded-lg p-2 sm:p-3">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-cyan-400">{formatTime(stats.timePlayedMinutes)}</div>
                <div className="text-xs sm:text-sm text-gray-400">Time Played</div>
              </div>
            </div>
            
            {/* GALAXIGA Token Balance */}
            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg p-3 sm:p-4 border border-cyan-500/30">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 shrink-0" />
                  <span className="text-sm sm:text-base text-white font-medium truncate">GALAXIGA Tokens</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-yellow-400">{totalRewards.toLocaleString()}</div>
              </div>
            </div>

            {/* Enhanced Streak & Login Stats */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-3 sm:mt-4">
              {/* Current Streak */}
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-3 sm:p-4 border border-orange-500/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 shrink-0" />
                    <span className="text-xs sm:text-sm text-white font-medium truncate">Current Streak</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg sm:text-xl font-bold text-orange-400">{currentStreak}</div>
                    <div className="text-xs text-gray-400">days</div>
                  </div>
                </div>
              </div>

              {/* Max Streak */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-3 sm:p-4 border border-purple-500/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />
                    <span className="text-xs sm:text-sm text-white font-medium truncate">Best Streak</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg sm:text-xl font-bold text-purple-400">{stats.maxStreak}</div>
                    <div className="text-xs text-gray-400">days</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Login Status */}
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-3 sm:p-4 border border-green-500/30 mt-3 sm:mt-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 shrink-0" />
                  <span className="text-sm sm:text-base text-white font-medium truncate">Login Days</span>
                </div>
                <div className="text-right">
                  <div className="text-xl sm:text-2xl font-bold text-green-400">{stats.dailyLogins}</div>
                  <div className="text-xs text-gray-400">total days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Friends Ranking */}
          {friendsRanking.length > 0 && (
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/30">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-6 h-6 text-cyan-400" />
                <h3 className="text-xl font-bold text-white">Friends Ranking</h3>
              </div>
              <div className="space-y-3">
                {friendsRanking.map((friend, index) => (
                  <div key={friend.fid} className="flex items-center space-x-4 p-3 bg-slate-700/30 rounded-lg">
                    <div className="text-2xl font-bold text-cyan-400">#{index + 1}</div>
                    <img src={friend.pfpUrl} alt={friend.displayName} className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{friend.displayName}</h4>
                      <p className="text-sm text-gray-400">{friend.score.toLocaleString()} pts</p>
                    </div>
                    {index === 0 && <Crown className="w-5 h-5 text-yellow-400" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-cyan-500/30">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                <h3 className="text-lg sm:text-xl font-bold text-white">Achievements</h3>
              </div>
              <div className="text-xs sm:text-sm text-gray-400">
                {achievementsWithStatus.filter(a => a.unlocked).length}/{achievementsWithStatus.length}
              </div>
            </div>
            
            <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-4 text-gray-400">
                  Loading achievements...
                </div>
              ) : (
                achievementsWithStatus.map((achievement) => {
                  // Get the appropriate icon component
                  const getAchievementIcon = (id: string) => {
                    switch (id) {
                      case 'first_blood': return Target;
                      case 'centurion': return Zap;
                      case 'high_scorer': return Trophy;
                      case 'social_butterfly': return Star;
                      case 'friend_magnet': return Users;
                      case 'dedicated_player': return Calendar;
                      case 'marathon_gamer': return Clock;
                      default: return Shield;
                    }
                  };
                  
                  const IconComponent = getAchievementIcon(achievement.id);
                  
                  return (
                    <div
                      key={achievement.id}
                      className={`p-2 sm:p-3 rounded-lg border transition-all duration-300 ${
                        achievement.unlocked
                          ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
                          : 'bg-slate-700/50 border-gray-600/30'
                      }`}
                    >
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="text-lg sm:text-xl md:text-2xl shrink-0">{achievement.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                            <h4 className={`font-medium text-sm sm:text-base truncate ${achievement.unlocked ? 'text-white' : 'text-gray-400'}`}>
                              {achievement.name}
                            </h4>
                            {achievement.unlocked && <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 shrink-0" />}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2 line-clamp-2">{achievement.description}</p>
                          
                          {/* Progress bar for locked achievements */}
                          {!achievement.unlocked && achievement.progress > 0 && (
                            <div className="space-y-1 mb-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">Progress</span>
                                <span className="text-xs text-cyan-400">{Math.round(achievement.progress)}%</span>
                              </div>
                              <div className="w-full bg-slate-600 rounded-full h-1">
                                <div 
                                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${achievement.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Reward display */}
                          <div className="flex items-center space-x-1 sm:space-x-2 mt-1 sm:mt-2">
                            <Trophy className="w-3 h-3 text-yellow-400" />
                            <span className={`text-xs font-medium ${achievement.unlocked ? 'text-yellow-400' : 'text-gray-500'}`}>
                              {achievement.reward} GALAXIGA
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Enhanced Statistics */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-cyan-500/30">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              <h3 className="text-lg sm:text-xl font-bold text-white">Performance Analytics</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
              <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-3 sm:p-4 border border-purple-500/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />
                    <span className="text-xs sm:text-sm text-white font-medium truncate">Avg Score</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg sm:text-xl font-bold text-purple-400">{averageScore.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">per game</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg p-3 sm:p-4 border border-cyan-500/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
                    <span className="text-xs sm:text-sm text-white font-medium truncate">Accuracy</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg sm:text-xl font-bold text-cyan-400">{overallAccuracy}%</div>
                    <div className="text-xs text-gray-400">overall</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-3 sm:p-4 border border-green-500/30">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 shrink-0" />
                  <span className="text-sm sm:text-base text-white font-medium truncate">Total Score Accumulated</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-green-400">{stats.totalScore.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Game History */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-cyan-500/30">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                <h3 className="text-lg sm:text-xl font-bold text-white">Game History</h3>
              </div>
              {gameSessions.length > 0 && (
                <div className="text-xs sm:text-sm text-gray-400">
                  {gameSessions.length} recent games
                </div>
              )}
            </div>
            
            <div className="space-y-2 sm:space-y-3 max-h-80 overflow-y-auto">
              {loadingHistory ? (
                <div className="text-center py-4 text-gray-400">
                  Loading game history...
                </div>
              ) : gameSessions.length > 0 ? (
                gameSessions.map((session, index) => {
                  const gameDate = new Date(session.playedAt);
                  const isToday = gameDate.toDateString() === new Date().toDateString();
                  const isYesterday = gameDate.toDateString() === new Date(Date.now() - 86400000).toDateString();
                  
                  let dateLabel = gameDate.toLocaleDateString();
                  if (isToday) dateLabel = 'Today';
                  else if (isYesterday) dateLabel = 'Yesterday';
                  
                  return (
                    <div key={session.id || index} className="p-3 sm:p-4 bg-slate-700/50 rounded-lg border border-gray-600/30 hover:border-cyan-500/30 transition-all duration-300">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-xs sm:text-sm">#{gameSessions.length - index}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-white font-medium text-sm sm:text-base truncate">Game #{gameSessions.length - index}</h4>
                              <div className="text-xs text-gray-400">{dateLabel}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                              <div>
                                <span className="text-gray-400">Score: </span>
                                <span className="text-cyan-400 font-medium">{session.score.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Level: </span>
                                <span className="text-white font-medium">{session.level}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Enemies: </span>
                                <span className="text-orange-400 font-medium">{session.enemiesKilled}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Time: </span>
                                <span className="text-green-400 font-medium">{formatGameTime(session.gameTime)}</span>
                              </div>
                              {session.accuracy && (
                                <div className="col-span-2">
                                  <span className="text-gray-400">Accuracy: </span>
                                  <span className="text-purple-400 font-medium">{Math.round(session.accuracy * 100)}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end text-right shrink-0">
                          <div className="text-lg sm:text-xl font-bold text-cyan-400">{session.score.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">
                            {gameDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No games played yet</p>
                  <p className="text-sm">Start playing to see your game history!</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-cyan-500/30">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              <h3 className="text-lg sm:text-xl font-bold text-white">Recent Activity</h3>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Gamepad2 className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{activity.title}</p>
                        <p className="text-gray-400 text-xs">{activity.description}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {activity.timestamp ? 
                        activity.timestamp.toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' :
                        activity.timestamp.toLocaleDateString() === new Date(Date.now() - 86400000).toLocaleDateString() ? 'Yesterday' :
                        activity.timestamp.toLocaleDateString()
                        : 'Recent'
                      }
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Gamepad2 className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">High Score</p>
                        <p className="text-gray-400 text-xs">
                          {stats.highScore.toLocaleString()} points
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">Best</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">Total Games</p>
                        <p className="text-gray-400 text-xs">
                          {stats.gamesPlayed} sessions played
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">All time</div>
                  </div>
                  
                  {achievementsWithStatus.filter(a => a.unlocked).length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                          <Award className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">Achievement Progress</p>
                          <p className="text-gray-400 text-xs">
                            {achievementsWithStatus.filter(a => a.unlocked).length} of {achievementsWithStatus.length} unlocked
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round((achievementsWithStatus.filter(a => a.unlocked).length / achievementsWithStatus.length) * 100)}%
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Enhanced Inventory */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/30">
            <div className="flex items-center space-x-3 mb-4">
              <Package className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-bold text-white">Inventory & Power-ups</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Show power-up collection stats */}
              <div className="bg-slate-700/50 rounded-lg p-3 border border-cyan-500/30">
                <div className="flex items-center space-x-2 mb-1">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-white text-sm font-medium">Shield</span>
                </div>
                <p className="text-xs text-gray-400">Protection power-up</p>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-3 border border-orange-500/30">
                <div className="flex items-center space-x-2 mb-1">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <span className="text-white text-sm font-medium">Rapid Fire</span>
                </div>
                <p className="text-xs text-gray-400">Speed boost power-up</p>
              </div>
              
              {/* Inventory items from purchase history will be shown here */}
            </div>
            
            <div className="text-center py-4 text-gray-400">
              <p className="text-sm">Collect items by playing the game!</p>
            </div>
          </div>

          {/* Purchase History */}
          {purchaseHistory.length > 0 && (
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/30">
              <div className="flex items-center space-x-3 mb-4">
                <ShoppingBag className="w-6 h-6 text-cyan-400" />
                <h3 className="text-xl font-bold text-white">Purchase History</h3>
                <div className="bg-cyan-500/20 px-2 py-1 rounded-full">
                  <span className="text-cyan-400 text-xs font-medium">{purchaseHistory.length}</span>
                </div>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {purchaseHistory.slice(0, 10).map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        purchase.itemType === 'weapons' ? 'bg-red-500/20 border border-red-500/50' :
                        purchase.itemType === 'defense' ? 'bg-blue-500/20 border border-blue-500/50' :
                        'bg-green-500/20 border border-green-500/50'
                      }`}>
                        {purchase.itemType === 'weapons' ? <Zap className="w-4 h-4 text-red-400" /> :
                         purchase.itemType === 'defense' ? <Shield className="w-4 h-4 text-blue-400" /> :
                         <Rocket className="w-4 h-4 text-green-400" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-white text-sm">{purchase.itemName}</h4>
                        <p className="text-xs text-gray-400 capitalize">{purchase.itemType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-cyan-400">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full" />
                        <span className="text-sm font-medium">{purchase.price}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(purchase.purchasedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {purchaseHistory.length > 10 && (
                  <div className="text-center py-2">
                    <span className="text-xs text-gray-400">
                      +{purchaseHistory.length - 10} more purchases
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Social Features */}
          {user && (
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/30">
              <div className="flex items-center space-x-3 mb-4">
                <Heart className="w-6 h-6 text-pink-400" />
                <h3 className="text-xl font-bold text-white">Farcaster Profile</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/30">
                  <img 
                    src={user.pfpUrl} 
                    alt={user.displayName || 'Profile'} 
                    className="w-12 h-12 rounded-full border-2 border-cyan-400"
                  />
                  <div>
                    <h4 className="font-bold text-white">{user.displayName}</h4>
                    <p className="text-cyan-400">@{user.username || `fid:${user.fid}`}</p>
                    <p className="text-xs text-gray-400">FID: {user.fid}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-cyan-400">{stats.socialShares}</div>
                    <div className="text-xs text-gray-400">Shares</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-cyan-400">{stats.friendsInvited}</div>
                    <div className="text-xs text-gray-400">Invited</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}