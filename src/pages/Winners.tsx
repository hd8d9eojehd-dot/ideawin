import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import api from '../services/api';
import { Submission, Competition } from '../types';
import { Trophy, Sparkles, Zap, Star, Crown, Medal, AlertCircle } from 'lucide-react';

const Winners = () => {
  const { data: activeCompetition } = useQuery<Competition>({
    queryKey: ['active-competition'],
    queryFn: async () => {
      const res = await api.get('/competitions/active');
      return res.data;
    },
  });

  const { data: leaderboardData } = useQuery<{ submissions: Submission[], resultsPublished: boolean }>({
    queryKey: ['leaderboard', activeCompetition?.id],
    queryFn: async () => {
      if (!activeCompetition?.id) return { submissions: [], resultsPublished: false };
      const res = await api.get(`/leaderboard/${activeCompetition.id}`);
      return res.data;
    },
    enabled: !!activeCompetition?.id,
    refetchInterval: 30000,
  });

  const resultsPublished = leaderboardData?.resultsPublished || activeCompetition?.results_published || activeCompetition?.resultsPublished || false;
  
  // Get all submissions sorted by score
  const allSubmissions = leaderboardData?.submissions || [];
  
  // Filter and sort to get top 3
  const topThree = allSubmissions
    .filter(s => {
      const finalScore = Number(s.finalScore || s.final_score || 0);
      // Only show submissions with scores > 0, and only when results are published
      return resultsPublished && finalScore > 0;
    })
    .sort((a, b) => {
      const scoreA = Number(a.finalScore || a.final_score || 0);
      const scoreB = Number(b.finalScore || b.final_score || 0);
      return scoreB - scoreA;
    })
    .slice(0, 3);

  console.log('Winners Debug:', {
    resultsPublished,
    totalSubmissions: allSubmissions.length,
    topThreeCount: topThree.length,
    topThreeScores: topThree.map(s => ({
      name: s.fullName || s.full_name,
      score: Number(s.finalScore || s.final_score || 0)
    }))
  });

  const getPrizeAmount = (position: number) => {
    const prizes = activeCompetition?.prizes_json || activeCompetition?.prizesJson;
    if (!prizes) return null;
    try {
      const parsed = typeof prizes === 'string' ? JSON.parse(prizes) : prizes;
      if (position === 0) return parsed.first;
      if (position === 1) return parsed.second;
      if (position === 2) return parsed.third;
    } catch {
      return null;
    }
    return null;
  };

  if (!resultsPublished && topThree.length === 0) {
    return (
      <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative inline-block mb-8"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 blur-3xl opacity-30 animate-pulse" />
            <Trophy className="w-24 h-24 text-indigo-400 relative" />
          </motion.div>
          
          <h1 className="text-5xl font-black text-white mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Winners Arena
          </h1>
          <p className="text-gray-400 mb-12">The champions will be revealed soon!</p>

          <div className="glass p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse" />
            <Sparkles className="w-16 h-16 text-indigo-400 mx-auto mb-6 animate-pulse" />
            <h3 className="text-2xl font-bold text-white mb-4">Evaluation in Progress</h3>
            <p className="text-gray-400">Our expert judges are reviewing the submissions. Check back soon for the results!</p>
          </div>
        </div>
      </div>
    );
  }

  if (resultsPublished && topThree.length === 0) {
    return (
      <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <Trophy className="w-24 h-24 text-gray-600 mx-auto mb-8" />
          <h1 className="text-5xl font-black text-white mb-4">Winners Arena</h1>
          <div className="glass p-12">
            <h3 className="text-2xl font-bold text-white mb-4">No Winners Yet</h3>
            <p className="text-gray-400">Submissions are still being evaluated</p>
          </div>
        </div>
      </div>
    );
  }

  const rankColors = [
    { bg: 'from-yellow-500/20 to-orange-500/20', border: 'border-yellow-500/50', glow: 'shadow-yellow-500/50', text: 'text-yellow-400', icon: Crown },
    { bg: 'from-gray-400/20 to-gray-500/20', border: 'border-gray-400/50', glow: 'shadow-gray-400/50', text: 'text-gray-300', icon: Medal },
    { bg: 'from-orange-600/20 to-orange-700/20', border: 'border-orange-600/50', glow: 'shadow-orange-600/50', text: 'text-orange-400', icon: Medal },
  ];

  return (
    <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative inline-block mb-6"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 blur-3xl opacity-40 animate-pulse" />
          <Trophy className="w-20 h-20 text-yellow-400 relative" />
        </motion.div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-6xl font-black text-white mb-4"
        >
          <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
            🎉 Champions Revealed! 🎉
          </span>
        </motion.h1>
        <p className="text-gray-400 text-lg">{activeCompetition?.title || 'Competition'}</p>
      </div>

      {/* Preview Banner */}
      {!resultsPublished && topThree.length > 0 && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-4xl mx-auto mb-8 bg-yellow-600/10 border border-yellow-600/30 rounded-2xl p-4 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 animate-pulse" />
            <div>
              <h4 className="text-sm font-bold text-yellow-400">Preview Mode</h4>
              <p className="text-xs text-gray-400">Results not published yet. Only admins can see this.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Winners Grid - Gaming Style */}
      <div className={`max-w-5xl mx-auto grid gap-6 mb-12 ${
        topThree.length === 1 ? 'grid-cols-1 max-w-md' : 
        topThree.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-3xl' : 
        'grid-cols-1 md:grid-cols-3'
      }`}>
        {topThree.map((winner, idx) => {
          const rank = idx + 1;
          const colors = rankColors[idx];
          const Icon = colors.icon;
          const prize = getPrizeAmount(idx);
          const finalScore = Number(winner.finalScore || winner.final_score || 0);

          return (
            <motion.div
              key={winner.id}
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15, type: 'spring', stiffness: 200 }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="relative group"
            >
              {/* Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`} />
              
              {/* Card */}
              <div className={`relative glass border-2 ${colors.border} rounded-3xl overflow-hidden backdrop-blur-xl`}>
                {/* Animated Top Border */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colors.bg} animate-pulse`} />
                
                {/* Rank Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors.bg} border-2 ${colors.border} flex items-center justify-center backdrop-blur-xl shadow-lg ${colors.glow}`}>
                    <span className={`text-xl font-black ${colors.text}`}>{rank}</span>
                  </div>
                </div>

                {/* Icon */}
                <div className="pt-8 pb-4 flex justify-center">
                  <div className={`relative`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} blur-2xl opacity-50 animate-pulse`} />
                    <Icon className={`w-16 h-16 ${colors.text} relative animate-bounce`} style={{ animationDuration: '2s' }} />
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 text-center">
                  {/* Avatar */}
                  <div className="relative inline-block mb-4">
                    <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} blur-lg opacity-50 rounded-full`} />
                    <img
                      src={winner.picture || 'https://picsum.photos/seed/user/200'}
                      alt={winner.fullName || winner.full_name || 'Winner'}
                      className={`w-20 h-20 rounded-full border-4 ${colors.border} relative object-cover`}
                    />
                    <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br ${colors.bg} border-2 ${colors.border} flex items-center justify-center`}>
                      <Star className={`w-4 h-4 ${colors.text} fill-current`} />
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className={`text-lg font-black ${colors.text} mb-1 line-clamp-1`}>
                    {winner.fullName || winner.full_name}
                  </h3>

                  {/* Idea Title */}
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
                    {winner.title}
                  </p>

                  {/* Score Display */}
                  <div className="bg-black/30 rounded-xl p-3 mb-3 border border-white/5">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Zap className={`w-4 h-4 ${colors.text}`} />
                      <span className="text-xs text-gray-500 uppercase font-bold">Final Score</span>
                    </div>
                    <div className={`text-3xl font-black ${colors.text}`}>
                      {finalScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">out of 100</div>
                  </div>

                  {/* Prize Money */}
                  {prize && (
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse' }}
                      className={`bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-2 border-green-500/50 rounded-xl p-3 shadow-lg shadow-green-500/20`}
                    >
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400 font-bold uppercase">Prize</span>
                      </div>
                      <div className="text-2xl font-black text-green-400">
                        ₹{prize.toLocaleString()}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Particle Effect on Hover */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-2 h-2 rounded-full ${colors.text}`}
                      initial={{ x: '50%', y: '50%', opacity: 0 }}
                      animate={{
                        x: `${50 + Math.cos(i * 60 * Math.PI / 180) * 100}%`,
                        y: `${50 + Math.sin(i * 60 * Math.PI / 180) * 100}%`,
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Congratulations Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center max-w-3xl mx-auto"
      >
        <div className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Congratulations to All Winners!</h2>
          <p className="text-gray-400">
            Your innovative ideas have impressed our judges. Keep building and making an impact!
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Winners;
