import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Target, Users, Trophy, Medal, Sparkles, Rocket, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  const hasSubmitted = user?.submissions && user.submissions.length > 0;

  return (
    <div className="pt-20 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-indigo-400 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:py-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[120px]"
          />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Floating Badge */}
            <motion.div
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-6"
            >
              <div className="px-6 py-2 rounded-full bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/50 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold gradient-text">AI-Powered Competition Platform</span>
                </div>
              </div>
            </motion.div>

            <h1 className="text-5xl sm:text-8xl font-black tracking-tight text-white mb-8 leading-tight">
              <span className="block">Battle of</span>
              <span className="block neon-text gradient-text">Epic Ideas</span>
            </h1>
            
            <p className="max-w-3xl mx-auto text-lg sm:text-xl text-gray-300 mb-12 leading-relaxed">
              <span className="font-bold text-indigo-400">Compete.</span>{' '}
              <span className="font-bold text-purple-400">Get Judged.</span>{' '}
              <span className="font-bold text-pink-400">Win Rewards.</span>
              <br />
              Submit your startup idea and let AI + Expert judges decide your fate.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              {hasSubmitted ? (
                <Link to="/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black rounded-xl shadow-lg shadow-green-500/50 hover:shadow-green-500/70 transition-all flex items-center justify-center gap-2"
                  >
                    <Trophy className="w-5 h-5" />
                    <span>View Your Battle Status</span>
                  </motion.button>
                </Link>
              ) : (
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-gaming w-full sm:w-auto text-white flex items-center gap-2"
                  >
                    <Rocket className="w-5 h-5" />
                    <span>Enter the Arena →</span>
                  </motion.button>
                </Link>
              )}
              
              <Link to="/leaderboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-8 py-4 glass border-2 border-indigo-500/50 text-white font-bold rounded-xl hover:border-indigo-500 transition-all flex items-center justify-center gap-2"
                >
                  <Target className="w-5 h-5" />
                  <span>View Rankings</span>
                </motion.button>
              </Link>
            </div>

            {/* Stats Bar */}
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              {[
                { icon: Zap, label: 'AI-Powered', color: 'text-yellow-400' },
                { icon: Shield, label: 'Fair Judging', color: 'text-indigo-400' },
                { icon: Trophy, label: 'Real Prizes', color: 'text-purple-400' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-gray-300 font-bold">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Battle Stages */}
      <section className="py-24 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              <span className="gradient-text">Battle Stages</span>
            </h2>
            <p className="text-gray-400 text-lg">Your journey to victory</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { 
                stage: '01', 
                title: 'Register', 
                desc: 'Pay ₹1 entry fee', 
                icon: Users,
                color: 'from-blue-600 to-cyan-600'
              },
              { 
                stage: '02', 
                title: 'Submit Idea', 
                desc: 'Share your vision', 
                icon: Rocket,
                color: 'from-indigo-600 to-purple-600'
              },
              { 
                stage: '03', 
                title: 'Get Judged', 
                desc: 'AI + Expert scoring', 
                icon: Zap,
                color: 'from-purple-600 to-pink-600'
              },
              { 
                stage: '04', 
                title: 'Win Rewards', 
                desc: 'Top ideas win big', 
                icon: Trophy,
                color: 'from-yellow-600 to-orange-600'
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="card-gaming p-8 relative group"
              >
                {/* Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-2xl`} />
                
                {/* Stage Number */}
                <div className="absolute top-4 right-4 text-5xl font-black text-white/5">
                  {step.stage}
                </div>

                {/* Icon */}
                <div className="relative mb-6">
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} blur-xl opacity-50`} />
                  <div className={`relative w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                </div>

                <h3 className="text-2xl font-black text-white mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.desc}</p>

                {/* Progress Line */}
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-indigo-500 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Prize Pool */}
      <section className="py-24 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="card-gaming p-12 text-center relative overflow-hidden holographic"
          >
            <div className="scan-line" />
            
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-full blur-3xl"
            />

            <div className="relative z-10">
              <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6 float" />
              
              <h2 className="text-4xl font-black text-white mb-2">
                <span className="gradient-text-gold">Prize Pool</span>
              </h2>
              <p className="text-gray-400 mb-8">Growing with every warrior</p>
              
              <div className="text-7xl sm:text-9xl font-black mb-12 blur-md select-none">
                <span className="gradient-text-gold">₹X,XX,XXX</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { place: '1st', icon: Trophy, color: 'from-yellow-600 to-orange-600', prize: 'XX,XXX' },
                  { place: '2nd', icon: Medal, color: 'from-gray-400 to-gray-600', prize: 'XX,XXX' },
                  { place: '3rd', icon: Medal, color: 'from-orange-600 to-orange-800', prize: 'XX,XXX' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    className="glass p-6 border-2 border-white/10 hover:border-white/30 transition-all"
                  >
                    <item.icon className={`w-10 h-10 mx-auto mb-4 bg-gradient-to-br ${item.color} bg-clip-text text-transparent`} />
                    <div className="text-sm text-gray-500 mb-2">{item.place} Place</div>
                    <div className="text-3xl font-black text-white blur-sm">₹{item.prize}</div>
                  </motion.div>
                ))}
              </div>

              <p className="text-xs text-gray-600 mt-8 italic">
                <Star className="w-4 h-4 inline text-yellow-400" /> Prize pool increases with each entry
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card-gaming p-12 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10" />
            
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
                Ready to <span className="gradient-text">Compete?</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join the arena and prove your idea is the best
              </p>
              
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-gaming text-white text-lg px-12 py-4"
                >
                  <span className="flex items-center gap-3">
                    <Rocket className="w-6 h-6" />
                    <span>Start Your Battle</span>
                    <ArrowRight className="w-6 h-6" />
                  </span>
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
