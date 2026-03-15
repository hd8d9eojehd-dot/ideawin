import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, MapPin, Phone, ShieldCheck, ExternalLink, Trophy, BarChart3, Zap, Target, Award, Activity, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, token, updateUser } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState({
    phone: user?.phone || '',
    city: user?.city || ''
  });
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setFormData({
        phone: user.phone || '',
        city: user.city || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.patch('/auth/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      updateUser(res.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto relative">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 cyber-grid opacity-10" />

      {/* Header */}
      <header className="mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-4"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-xl opacity-50" />
            <User className="relative w-12 h-12 text-indigo-400" />
          </div>
          <h1 className="text-5xl font-black">
            <span className="gradient-text">Warrior Profile</span>
          </h1>
        </motion.div>
        <p className="text-gray-400 text-lg">Your battle stats and arena status</p>
      </header>

      {/* Phone Number Warning */}
      {!user.phone && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-yellow-400 font-bold">Phone Number Required</p>
              <p className="text-gray-400 text-sm">Add your phone number below to register for competitions</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-gaming p-8 text-center relative overflow-hidden"
          >
            <div className="scan-line" />
            
            {/* Avatar */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-2xl opacity-50 animate-pulse" />
              <div className="relative">
                <img
                  src={user.picture}
                  alt={user.fullName}
                  className="w-32 h-32 rounded-full border-4 border-indigo-500/50 mx-auto"
                />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full border-4 border-[#0F0F1E] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-black text-white mb-2">{user.fullName}</h2>
            <p className="text-gray-400 text-sm mb-6">{user.email}</p>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-2 border-green-500/50 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span className="text-xs font-black text-green-400 uppercase tracking-wider">Active Warrior</span>
            </div>
          </motion.div>

          {/* Account Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-gaming p-6"
          >
            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              <span>Battle Info</span>
            </h3>
            
            <div className="space-y-4">
              <div className="hud-element p-3">
                <div className="flex items-center gap-3 text-gray-300">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm">{user.email}</span>
                </div>
              </div>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Contact</label>
                    <div className="hud-element p-3">
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-indigo-400" />
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="bg-transparent border-none focus:ring-0 text-sm w-full text-white placeholder-gray-600"
                          placeholder="Enter mobile number"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Location</label>
                    <div className="hud-element p-3">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-indigo-400" />
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="bg-transparent border-none focus:ring-0 text-sm w-full text-white placeholder-gray-600"
                          placeholder="Enter city"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-black rounded-xl shadow-lg shadow-indigo-500/50 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 glass border border-white/20 text-white text-sm font-bold rounded-xl"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="hud-element p-3">
                    <div className="flex items-center gap-3 text-gray-300">
                      <Phone className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm">{user.phone || 'Not set'}</span>
                    </div>
                  </div>
                  
                  <div className="hud-element p-3">
                    <div className="flex items-center gap-3 text-gray-300">
                      <MapPin className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm">{user.city || 'Not set'}</span>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(true)}
                    className="w-full mt-4 py-3 glass border border-indigo-500/30 hover:border-indigo-500/60 text-white text-sm font-bold rounded-xl transition-all"
                  >
                    Edit Profile
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Admin Panel */}
          {user.isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-gaming p-8 relative overflow-hidden holographic"
            >
              <div className="scan-line" />
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-600/20 rounded-xl">
                    <ShieldCheck className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">Command Center</h3>
                    <p className="text-sm text-gray-400">Admin control panel access</p>
                  </div>
                </div>
                <Link to="/admin-portal">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-gaming text-white flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Portal</span>
                  </motion.button>
                </Link>
              </div>
              
              <div className="hud-element p-4">
                <p className="text-sm text-gray-300 mb-4">
                  Access the command center to evaluate warriors, manage battles, and export battle data.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/admin-portal" className="text-indigo-400 hover:text-indigo-300 text-sm font-bold">
                    Evaluate Warriors →
                  </Link>
                  <button
                    onClick={async () => {
                      const res = await api.get('/admin/submissions');
                      const submissions = res.data;
                      const headers = ['Title', 'Warrior', 'Email', 'Problem', 'Solution', 'AI Score', 'Judge Score', 'Final Score', 'Status'];
                      const rows = submissions.map((s: any) => [
                        `"${s.title}"`,
                        `"${s.fullName}"`,
                        `"${s.email || ''}"`,
                        `"${s.problem.replace(/"/g, '""')}"`,
                        `"${s.solution.replace(/"/g, '""')}"`,
                        s.aiScore,
                        s.judgeScore,
                        ((s.aiScore || 0) * 0.4) + ((s.judgeScore || 0) * 0.6),
                        s.status
                      ]);
                      const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement('a');
                      const url = URL.createObjectURL(blob);
                      link.setAttribute('href', url);
                      link.setAttribute('download', `battle_data_${new Date().toISOString().split('T')[0]}.csv`);
                      link.style.visibility = 'hidden';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 text-green-400 text-xs font-black rounded-lg hover:border-green-500/60 transition-all"
                  >
                    Export Battle Data
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Battle Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-gaming p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 blur-3xl" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-3xl font-black text-white mb-2">
                    <span className="gradient-text">Active Battles</span>
                  </h3>
                  <p className="text-gray-400">Ready to enter the arena?</p>
                </div>
                <Trophy className="w-16 h-16 text-indigo-600/40 float" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link to="/competition">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full p-6 glass border-2 border-indigo-500/30 hover:border-indigo-500/60 rounded-xl transition-all group"
                  >
                    <Trophy className="w-8 h-8 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <div className="text-lg font-black text-white mb-1">View Battle</div>
                      <div className="text-xs text-gray-400">Check active arena</div>
                    </div>
                  </motion.button>
                </Link>

                <Link to="/leaderboard">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full p-6 glass border-2 border-purple-500/30 hover:border-purple-500/60 rounded-xl transition-all group"
                  >
                    <BarChart3 className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <div className="text-lg font-black text-white mb-1">Rankings</div>
                      <div className="text-xs text-gray-400">View leaderboard</div>
                    </div>
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Activity Log */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-gaming p-8"
          >
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <span>Recent Activity</span>
            </h3>
            
            <div className="space-y-4">
              {/* Account Created */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="hud-element p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white/5 rounded-lg text-green-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-bold">Warrior account created</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Recently'}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Last Login */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="hud-element p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white/5 rounded-lg text-indigo-400">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-bold">Logged in via Google</p>
                    <p className="text-gray-500 text-xs mt-1">Just now</p>
                  </div>
                </div>
              </motion.div>

              {/* Submissions Activity */}
              {user.submissions && user.submissions.length > 0 && (
                <>
                  {user.submissions.map((submission: any, i: number) => (
                    <motion.div
                      key={submission.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="hud-element p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 bg-white/5 rounded-lg ${
                          submission.payment_status === 'paid' || submission.paymentStatus === 'paid'
                            ? 'text-green-400'
                            : 'text-yellow-400'
                        }`}>
                          {submission.payment_status === 'paid' || submission.paymentStatus === 'paid' ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Clock className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-bold">
                            {submission.payment_status === 'paid' || submission.paymentStatus === 'paid'
                              ? 'Battle entry completed'
                              : 'Battle entry pending payment'}
                          </p>
                          <p className="text-gray-400 text-xs mt-1">"{submission.title}"</p>
                          <p className="text-gray-500 text-xs mt-1">
                            {new Date(submission.created_at || submission.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {(submission.payment_status === 'pending' || submission.paymentStatus === 'pending') && (
                            <p className="text-xs text-yellow-400 mt-2">
                              Payment pending - Please complete your payment
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}

              {/* No submissions yet */}
              {(!user.submissions || user.submissions.length === 0) && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="hud-element p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-white/5 rounded-lg text-gray-400">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-bold">No battle entries yet</p>
                      <p className="text-gray-500 text-xs mt-1">
                        <Link to="/register" className="text-indigo-400 hover:text-indigo-300">
                          Enter the arena →
                        </Link>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
