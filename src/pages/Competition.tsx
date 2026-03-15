import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Competition } from '../types';
import { Trophy, Info, CheckCircle2, Users, Zap, Target, Rocket, Sparkles, Shield } from 'lucide-react';

const CompetitionPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Move useAuth to the top, before any conditional returns
  
  const { data: competitions, isLoading } = useQuery<Competition[]>({
    queryKey: ['competitions'],
    queryFn: async () => {
      const res = await api.get('/competitions');
      return res.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await api.get('/stats');
      return res.data;
    },
  });

  // Real deadline dates
  const submissionDeadline = new Date('2026-04-13T23:59:59');
  const resultsDate = new Date('2026-04-15T10:00:00');

  // Countdown timer state
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Update countdown every second
  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = submissionDeadline.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }, 30000);
    
    return () => clearInterval(interval);
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="pt-32 px-4 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="text-gray-400">Loading battle arena...</p>
      </div>
    );
  }

  const activeComp = competitions?.find(c => c.status === 'active');
  const hasSubmitted = user?.submissions?.some(s => s.competitionId === activeComp?._id);

  return (
    <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto relative">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="cyber-grid opacity-10" />
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-indigo-400 rounded-full"
            animate={{
              x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
              y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-4"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-xl opacity-50" />
            <Shield className="relative w-12 h-12 text-indigo-400" />
          </div>
          <h1 className="text-5xl font-black">
            <span className="gradient-text">Active Battle</span>
          </h1>
        </motion.div>
        <p className="text-gray-400 text-lg">Join the arena and prove your worth</p>
      </header>

      <div className="space-y-8">
        {/* Main Competition Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-gaming p-8 relative overflow-hidden holographic"
        >
          <div className="scan-line" />
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-4xl font-black text-white mb-3">
                {activeComp?.title || 'Spring 2026 Battle Arena'}
              </h2>
              <p className="text-gray-300 text-lg">
                {activeComp?.description || 'Submit your innovative startup idea and compete for glory'}
              </p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-2 border-green-500/50 backdrop-blur-xl"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-400" />
                <span className="text-sm font-black text-green-400 uppercase tracking-wider">Battle Active</span>
              </div>
            </motion.div>
          </div>

          {/* Countdown Timer */}
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500 uppercase tracking-widest mb-6 font-black">Time Remaining</p>
            <div className="flex justify-center gap-4">
              {[
                { label: 'Days', value: String(timeLeft.days).padStart(2, '0') },
                { label: 'Hours', value: String(timeLeft.hours).padStart(2, '0') },
                { label: 'Minutes', value: String(timeLeft.minutes).padStart(2, '0') },
                { label: 'Seconds', value: String(timeLeft.seconds).padStart(2, '0') },
              ].map((t, i) => (
                <motion.div
                  key={t.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 blur-xl opacity-50" />
                    <div className="relative w-20 h-20 glass border-2 border-indigo-500/50 rounded-2xl flex items-center justify-center">
                      <span className="text-3xl font-black gradient-text">{t.value}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-3 uppercase font-bold tracking-wider">{t.label}</span>
                </motion.div>
              ))}
            </div>
            
            {/* Deadline Information */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 glass border border-red-500/30 rounded-xl">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-gray-400">Submission Deadline:</span>
                <span className="font-black text-red-400">April 13, 2026</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 glass border border-green-500/30 rounded-xl">
                <Trophy className="w-4 h-4 text-green-400" />
                <span className="text-gray-400">Results Announced:</span>
                <span className="font-black text-green-400">April 15, 2026</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="hud-element text-center relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
              <div className="text-3xl font-black text-white mb-2 blur-md select-none">₹X,XX,XXX</div>
              <p className="text-xs text-gray-500 uppercase font-bold">Prize Pool</p>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] bg-yellow-600/80 text-white px-3 py-1 rounded-full font-black uppercase">Revealing Soon</span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="hud-element text-center relative"
            >
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              <Users className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              <div className="text-3xl font-black gradient-text mb-2">
                {stats?.registeredCount || 0}
              </div>
              <p className="text-xs text-gray-500 uppercase font-bold">Warriors Registered</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="hud-element text-center"
            >
              <Target className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <div className="text-3xl font-black text-green-400 mb-2">₹{activeComp?.entryFee || 9}</div>
              <p className="text-xs text-gray-500 uppercase font-bold">Battle Fee</p>
            </motion.div>
          </div>

          {/* CTA Button */}
          {hasSubmitted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full py-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-2 border-green-500/50 text-green-400 font-black rounded-xl flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>Already in the Arena</span>
            </motion.div>
          ) : (
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-lg rounded-xl shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all flex items-center justify-center gap-3"
              >
                <Rocket className="w-6 h-6" />
                <span>Pay ₹{activeComp?.entryFee || 9} & Enter the Arena →</span>
              </motion.button>
            </Link>
          )}
        </motion.div>

        {/* Battle Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card-gaming p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-600/20 rounded-xl">
                <Info className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-black text-white">Battle Rules</h3>
            </div>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>Submit your most innovative startup idea</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>AI + Expert judges evaluate your submission</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>Top 3 warriors win cash prizes</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>Fair, transparent, skill-based competition</span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card-gaming p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-600/20 rounded-xl">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-2xl font-black text-white">Why Join?</h3>
            </div>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start gap-3">
                <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span>Win real cash prizes</span>
              </li>
              <li className="flex items-start gap-3">
                <Target className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>Get expert feedback on your idea</span>
              </li>
              <li className="flex items-start gap-3">
                <Users className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>Compete with other innovators</span>
              </li>
              <li className="flex items-start gap-3">
                <Rocket className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <span>Validate your startup concept</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionPage;
