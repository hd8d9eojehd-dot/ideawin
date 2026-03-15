import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Submission, Competition } from '../types';
import { Shield, Star, Brain, CheckCircle2, AlertCircle, Loader2, Play, Download, Eye, EyeOff, Users, TrendingUp, Trophy, ExternalLink, Trash2, CreditCard, DollarSign, Clock, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const JudgePanel = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = React.useState<Submission | null>(null);
  const [scores, setScores] = React.useState({
    judgeScore: 0,
    judgeFeedback: '',
    aiScore: 0,
    aiFeedback: ''
  });
  const [isEvaluatingAI, setIsEvaluatingAI] = React.useState(false);
  const [showPrizeModal, setShowPrizeModal] = React.useState(false);
  const [prizeAmounts, setPrizeAmounts] = React.useState({
    first: 50000,
    second: 30000,
    third: 20000
  });
  const [showEnvCheck, setShowEnvCheck] = React.useState(false);
  const [envStatus, setEnvStatus] = React.useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [secretClickCount, setSecretClickCount] = React.useState(0);
  const [showDeleteUserModal, setShowDeleteUserModal] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<Submission | null>(null);
  const [showPaymentDashboard, setShowPaymentDashboard] = React.useState(false);
  const [showUserActivityDashboard, setShowUserActivityDashboard] = React.useState(false);

  const { data: submissions, isLoading } = useQuery<Submission[]>({
    queryKey: ['all-submissions'],
    queryFn: async () => {
      const res = await api.get('/admin/submissions');
      return res.data;
    },
  });

  const { data: payments } = useQuery<any[]>({
    queryKey: ['all-payments'],
    queryFn: async () => {
      const res = await api.get('/admin/payments');
      return res.data;
    },
  });

  const { data: paymentStats } = useQuery<any>({
    queryKey: ['payment-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/payment-stats');
      return res.data;
    },
  });

  const { data: activeCompetition } = useQuery<Competition>({
    queryKey: ['active-competition'],
    queryFn: async () => {
      const res = await api.get('/competitions/active');
      return res.data;
    },
  });

  // Load prize amounts from competition
  React.useEffect(() => {
    if (activeCompetition) {
      const prizes = activeCompetition.prizes_json || activeCompetition.prizesJson;
      if (prizes) {
        try {
          const parsed = typeof prizes === 'string' ? JSON.parse(prizes) : prizes;
          setPrizeAmounts({
            first: parsed.first || 50000,
            second: parsed.second || 30000,
            third: parsed.third || 20000
          });
        } catch (e) {
          console.error('Failed to parse prizes', e);
        }
      }
    }
  }, [activeCompetition]);

  const handlePublishToggle = async () => {
    if (!activeCompetition) return;
    try {
      const currentStatus = activeCompetition.results_published || activeCompetition.resultsPublished;
      await api.post('/admin/publish-results', {
        competitionId: activeCompetition.id,
        publish: !currentStatus
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success(currentStatus ? 'Results unpublished successfully!' : 'Results published to all users!');
      queryClient.invalidateQueries({ queryKey: ['active-competition'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    } catch (error) {
      toast.error('Failed to toggle publish status');
    }
  };

  const handleSavePrizes = async () => {
    if (!activeCompetition) return;
    try {
      await api.post('/admin/update-prizes', {
        competitionId: activeCompetition.id,
        prizes: prizeAmounts
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success('Prize amounts updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['active-competition'] });
      setShowPrizeModal(false);
    } catch (error) {
      toast.error('Failed to update prizes');
    }
  };

  const handleUndoEvaluation = async () => {
    if (!selectedSubmission) return;
    
    if (!confirm('Are you sure you want to undo this evaluation? All scores and feedback will be reset.')) {
      return;
    }

    try {
      await api.post('/judging/undo-evaluation', {
        submissionId: selectedSubmission.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Reset local state
      setScores({
        judgeScore: 0,
        judgeFeedback: '',
        aiScore: 0,
        aiFeedback: ''
      });
      
      toast.success('Evaluation reset successfully!');
      queryClient.invalidateQueries({ queryKey: ['all-submissions'] });
      setSelectedSubmission(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to undo evaluation');
    }
  };

  const checkEnvironmentVariables = async () => {
    try {
      const response = await api.get('/admin/check-env', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEnvStatus(response.data);
      setShowEnvCheck(true);
    } catch (error: any) {
      toast.error('Failed to check environment variables');
      console.error(error);
    }
  };

  const handleDeleteAllUsers = async () => {
    if (deleteConfirmation !== 'DELETE ALL DATA') {
      toast.error('Please type "DELETE ALL DATA" to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      await api.post('/admin/delete-all-users', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('All users deleted (admin protected)!');
      setShowDeleteModal(false);
      setDeleteConfirmation('');
      queryClient.invalidateQueries({ queryKey: ['all-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      // Refresh page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete users');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSpecificUser = async () => {
    if (!userToDelete) return;

    try {
      await api.post('/admin/delete-user', {
        targetUserId: userToDelete.user_id || userToDelete.userId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`User ${userToDelete.full_name || userToDelete.fullName} deleted!`);
      setShowDeleteUserModal(false);
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['all-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
      console.error(error);
    }
  };

  const handleSecretClick = () => {
    setSecretClickCount(prev => prev + 1);
    if (secretClickCount + 1 >= 5) {
      toast.success('🔓 Secret mode activated!', { duration: 2000 });
    }
  };

  const exportToCSV = () => {
    if (!submissions) return;
    const headers = ['Title', 'Participant Name', 'Email', 'Problem', 'Solution', 'Market', 'Impact', 'AI Score', 'AI Feedback', 'Judge Score', 'Judge Feedback', 'Final Score', 'Status', 'Submitted Date'];
    const rows = submissions.map(s => [
      `"${s.title}"`,
      `"${s.full_name || s.fullName || 'N/A'}"`,
      `"${s.email || 'N/A'}"`,
      `"${s.problem?.replace(/"/g, '""') || ''}"`,
      `"${s.solution?.replace(/"/g, '""') || ''}"`,
      `"${s.market?.replace(/"/g, '""') || ''}"`,
      `"${s.impact?.replace(/"/g, '""') || ''}"`,
      s.ai_score || s.aiScore || 0,
      `"${(s.ai_feedback || s.aiFeedback || '').replace(/"/g, '""')}"`,
      s.judge_score || s.judgeScore || 0,
      `"${(s.judge_feedback || s.judgeFeedback || '').replace(/"/g, '""')}"`,
      s.final_score || s.finalScore || 0,
      s.status,
      new Date(s.created_at || s.createdAt).toLocaleDateString()
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ideawin_cafyo_submissions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully!');
  };

  if (!user || !user.is_admin) {
    return (
      <div className="pt-32 px-4 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400">You do not have permission to access the Admin Portal.</p>
        <p className="text-gray-500 text-sm mt-2">Only lokesh009.naik@gmail.com can access this page.</p>
      </div>
    );
  }

  const handleSubmitScores = async () => {
    if (!selectedSubmission) return;

    try {
      await api.post('/judging/score', {
        submissionId: selectedSubmission.id,
        score: scores.judgeScore,
        feedback: scores.judgeFeedback,
        aiScore: scores.aiScore,
        aiFeedback: scores.aiFeedback
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success('Evaluation submitted successfully!');
      setSelectedSubmission(null);
      queryClient.invalidateQueries({ queryKey: ['all-submissions'] });
    } catch (error) {
      toast.error('Failed to submit evaluation');
      console.error(error);
    }
  };

  const handleAIRun = async () => {
    if (!selectedSubmission) return;
    setIsEvaluatingAI(true);
    try {
      // Call the API endpoint instead of client-side service
      const response = await api.post('/judging/ai-evaluate', {
        submissionId: selectedSubmission.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { aiScore, aiFeedback } = response.data;
      
      setScores(prev => ({
        ...prev,
        aiScore: aiScore,
        aiFeedback: aiFeedback
      }));
      
      toast.success('AI Evaluation completed!');
      queryClient.invalidateQueries({ queryKey: ['all-submissions'] });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'AI Evaluation failed');
      console.error(error);
    } finally {
      setIsEvaluatingAI(false);
    }
  };

  const stats = {
    total: submissions?.length || 0,
    evaluated: submissions?.filter(s => s.status === 'judged').length || 0,
    pending: submissions?.filter(s => s.status === 'pending').length || 0,
    avgScore: submissions?.length ? Number((submissions.reduce((acc, s) => acc + Number(s.final_score || s.finalScore || 0), 0) / submissions.length)).toFixed(1) : 0
  };

  return (
    <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto relative">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 cyber-grid opacity-10" />
      <div className="fixed top-20 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="fixed bottom-20 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl font-black mb-3 flex items-center space-x-4"
            >
              <Shield className="w-12 h-12 text-indigo-400" />
              <span className="gradient-text">Command Center</span>
            </motion.h1>
            <p className="text-gray-400 text-lg">Evaluate warriors and manage battle results</p>
          </div>
          <div className="flex items-center space-x-2 px-5 py-3 bg-red-600/10 text-red-400 rounded-xl border-2 border-red-600/30 glow">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-black uppercase tracking-wider">Admin Access</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-gaming p-5 relative overflow-hidden"
          >
            <div className="scan-line" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-black mb-2 tracking-wider">Total Warriors</p>
                <p className="text-3xl font-black text-white">{stats.total}</p>
              </div>
              <Users className="w-10 h-10 text-indigo-400" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-gaming p-5 relative overflow-hidden"
          >
            <div className="scan-line" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-black mb-2 tracking-wider">Evaluated</p>
                <p className="text-3xl font-black text-green-400">{stats.evaluated}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-gaming p-5 relative overflow-hidden"
          >
            <div className="scan-line" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-black mb-2 tracking-wider">Pending</p>
                <p className="text-3xl font-black text-yellow-400">{stats.pending}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-yellow-400" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-gaming p-5 relative overflow-hidden"
          >
            <div className="scan-line" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-black mb-2 tracking-wider">Avg Score</p>
                <p className="text-3xl font-black text-indigo-400">{stats.avgScore}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-indigo-400" />
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              checkEnvironmentVariables();
              handleSecretClick();
            }}
            className="flex items-center space-x-2 px-5 py-3 glass border-2 border-gray-600/30 text-gray-400 font-black rounded-xl hover:border-gray-600/60 transition-all text-sm"
            title="Check if environment variables are configured"
          >
            <Shield className="w-4 h-4" />
            <span>Check Config</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPrizeModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600/20 text-purple-400 font-black rounded-xl border-2 border-purple-600/30 hover:bg-purple-600/30 transition-all"
          >
            <Trophy className="w-5 h-5" />
            <span>Set Prizes</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePublishToggle}
            className={`flex items-center space-x-2 px-6 py-3 font-black rounded-xl border-2 transition-all ${
              (activeCompetition?.results_published || activeCompetition?.resultsPublished)
                ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30 hover:bg-yellow-600/30' 
                : 'btn-gaming text-white'
            }`}
          >
            {(activeCompetition?.results_published || activeCompetition?.resultsPublished) ? (
              <>
                <EyeOff className="w-5 h-5" />
                <span>Unpublish Results</span>
              </>
            ) : (
              <>
                <Eye className="w-5 h-5" />
                <span>Publish Results</span>
              </>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-6 py-3 bg-indigo-600/20 text-indigo-400 font-black rounded-xl border-2 border-indigo-600/30 hover:bg-indigo-600/30 transition-all"
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPaymentDashboard(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600/20 text-green-400 font-black rounded-xl border-2 border-green-600/30 hover:bg-green-600/30 transition-all"
          >
            <CreditCard className="w-5 h-5" />
            <span>Payments</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUserActivityDashboard(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-cyan-600/20 text-cyan-400 font-black rounded-xl border-2 border-cyan-600/30 hover:bg-cyan-600/30 transition-all"
          >
            <Users className="w-5 h-5" />
            <span>User Activity</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600/20 text-red-400 font-black rounded-xl border-2 border-red-600/30 hover:bg-red-600/40 transition-all"
            title="Permanently delete all users and data"
          >
            <Trash2 className="w-5 h-5" />
            <span>Delete All Data</span>
          </motion.button>
          {activeCompetition?.results_published && (
            <div className="flex items-center space-x-2 px-5 py-3 bg-green-600/10 text-green-400 rounded-xl border-2 border-green-600/20">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-black uppercase tracking-wider">Results PUBLIC</span>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xl font-black text-white mb-4 flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-400" />
            <span className="gradient-text">Warriors ({submissions?.length || 0})</span>
          </h3>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto pr-2 custom-scrollbar">
              {submissions?.map((sub) => {
                const finalScore = sub.final_score || sub.finalScore || 0;
                const isAdmin = sub.email === 'lokesh009.naik@gmail.com';
                return (
                  <motion.div
                    key={sub.id}
                    whileHover={{ scale: 1.02 }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all relative group ${
                      selectedSubmission?.id === sub.id
                        ? 'bg-indigo-600/20 border-indigo-600 shadow-lg shadow-indigo-600/20 neon-border'
                        : 'glass border-white/10 hover:border-white/20'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setSelectedSubmission(sub);
                        setScores({
                          judgeScore: sub.judge_score || sub.judgeScore || 0,
                          judgeFeedback: sub.judge_feedback || sub.judgeFeedback || '',
                          aiScore: sub.ai_score || sub.aiScore || 0,
                          aiFeedback: sub.ai_feedback || sub.aiFeedback || ''
                        });
                      }}
                      className="w-full text-left"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-black text-white truncate pr-2">{sub.title}</h4>
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                          sub.status === 'judged' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <img src={sub.picture || 'https://picsum.photos/seed/user/200'} className="w-6 h-6 rounded-full border border-indigo-500/30" alt="" />
                        <span className="text-xs text-gray-400 font-bold">{sub.full_name || sub.fullName || 'Anonymous'}</span>
                        {isAdmin && (
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                            ADMIN
                          </span>
                        )}
                      </div>
                      {finalScore > 0 && (
                        <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-white/10">
                          <span className="text-gray-500 font-black uppercase tracking-wider">Battle Score:</span>
                          <span className="font-black text-indigo-400">{Number(finalScore).toFixed(1)}/100</span>
                        </div>
                      )}
                    </button>
                    
                    {/* Delete Button - Visible for non-admin users */}
                    {!isAdmin && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserToDelete(sub);
                          setShowDeleteUserModal(true);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 hover:border-red-600/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete this user"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </motion.button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Evaluation Form */}
        <div className="lg:col-span-2">
          {selectedSubmission ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card-gaming p-8 space-y-6 relative overflow-hidden"
            >
              <div className="scan-line" />
              
              {/* Submission Details */}
              <div className="border-b border-white/10 pb-6">
                <h2 className="text-3xl font-black text-white mb-4">
                  <span className="gradient-text">{selectedSubmission.title}</span>
                </h2>
                <div className="flex items-center space-x-3 mb-6">
                  <img src={selectedSubmission.picture || 'https://picsum.photos/seed/user/200'} className="w-10 h-10 rounded-full border-2 border-indigo-500/50" alt="" />
                  <div>
                    <p className="text-sm font-black text-white">{selectedSubmission.full_name || selectedSubmission.fullName}</p>
                    <p className="text-xs text-gray-500">{selectedSubmission.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="hud-element p-4">
                    <p className="text-gray-500 uppercase font-black text-xs mb-2 tracking-wider">Challenge</p>
                    <p className="text-gray-300">{selectedSubmission.problem}</p>
                  </div>
                  <div className="hud-element p-4">
                    <p className="text-gray-500 uppercase font-black text-xs mb-2 tracking-wider">Weapon</p>
                    <p className="text-gray-300">{selectedSubmission.solution}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="hud-element p-4">
                      <p className="text-gray-500 uppercase font-black text-xs mb-2 tracking-wider">Territory</p>
                      <p className="text-gray-300 text-sm">{selectedSubmission.market}</p>
                    </div>
                    <div className="hud-element p-4">
                      <p className="text-gray-500 uppercase font-black text-xs mb-2 tracking-wider">Impact</p>
                      <p className="text-gray-300 text-sm">{selectedSubmission.impact}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scoring Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Evaluation */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-indigo-400">
                      <Brain className="w-6 h-6" />
                      <h3 className="font-black uppercase tracking-wider text-sm">AI Analysis</h3>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAIRun}
                      disabled={isEvaluatingAI}
                      className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white text-xs font-black rounded-lg transition-all glow"
                    >
                      {isEvaluatingAI ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Run AI</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 uppercase font-black mb-2 tracking-wider">AI Score (0-100)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={scores.aiScore}
                        onChange={(e) => setScores({ ...scores, aiScore: Number(e.target.value) })}
                        className="w-full bg-white/5 border-2 border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/20 font-black text-lg transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 uppercase font-black mb-2 tracking-wider">AI Battle Report</label>
                      <textarea
                        value={scores.aiFeedback}
                        onChange={(e) => setScores({ ...scores, aiFeedback: e.target.value })}
                        className="w-full bg-white/5 border-2 border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/20 h-32 resize-none text-sm transition-all"
                        placeholder="AI-generated battle analysis..."
                      />
                    </div>
                  </div>
                </div>

                {/* Judge Scoring */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-yellow-400">
                    <Star className="w-6 h-6" />
                    <h3 className="font-black uppercase tracking-wider text-sm">Expert Verdict</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 uppercase font-black mb-2 tracking-wider">Judge Score (0-100)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={scores.judgeScore}
                        onChange={(e) => setScores({ ...scores, judgeScore: Number(e.target.value) })}
                        className="w-full bg-white/5 border-2 border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 focus:shadow-lg focus:shadow-yellow-500/20 font-black text-lg transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 uppercase font-black mb-2 tracking-wider">Expert Feedback</label>
                      <textarea
                        value={scores.judgeFeedback}
                        onChange={(e) => setScores({ ...scores, judgeFeedback: e.target.value })}
                        className="w-full bg-white/5 border-2 border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 focus:shadow-lg focus:shadow-yellow-500/20 h-32 resize-none text-sm transition-all"
                        placeholder="Your expert battle verdict..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Score & Submit */}
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-black mb-2 tracking-wider">Final Battle Score (40% AI + 60% Judge)</p>
                  <div className="text-5xl font-black">
                    <span className="gradient-text">{Number((scores.aiScore * 0.4) + (scores.judgeScore * 0.6)).toFixed(1)}</span>
                    <span className="text-xl text-gray-500">/100</span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmitScores}
                    className="px-8 py-4 btn-gaming text-white flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Submit Verdict</span>
                  </motion.button>
                  {(selectedSubmission.status === 'judged' || (scores.aiScore > 0 || scores.judgeScore > 0)) && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleUndoEvaluation}
                      className="px-6 py-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-black rounded-xl transition-all border-2 border-red-600/30 flex items-center space-x-2"
                      title="Reset all scores and feedback"
                    >
                      <AlertCircle className="w-5 h-5" />
                      <span>Undo</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="card-gaming p-20 text-center flex flex-col items-center justify-center min-h-[600px]">
              <Star className="w-20 h-20 text-gray-700 mb-6" />
              <h3 className="text-2xl font-black text-gray-500 mb-3">
                <span className="gradient-text">Select a Warrior</span>
              </h3>
              <p className="text-sm text-gray-600">Choose a warrior from the list to begin evaluation</p>
            </div>
          )}
        </div>
      </div>

      {/* Prize Money Modal */}
      {showPrizeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-gaming max-w-md w-full p-8 relative overflow-hidden"
          >
            <div className="scan-line" />
            <button
              onClick={() => setShowPrizeModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl"
            >
              ✕
            </button>
            <div className="flex items-center space-x-3 mb-6">
              <Trophy className="w-10 h-10 text-yellow-400" />
              <h3 className="text-3xl font-black">
                <span className="gradient-text-gold">Set Prize Pool</span>
              </h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                  <span className="text-2xl">🥇</span> First Place Prize (₹)
                </label>
                <input
                  type="number"
                  value={prizeAmounts.first}
                  onChange={(e) => setPrizeAmounts({ ...prizeAmounts, first: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border-2 border-yellow-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 focus:shadow-lg focus:shadow-yellow-500/20 font-black text-lg transition-all"
                />
              </div>
              
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                  <span className="text-2xl">🥈</span> Second Place Prize (₹)
                </label>
                <input
                  type="number"
                  value={prizeAmounts.second}
                  onChange={(e) => setPrizeAmounts({ ...prizeAmounts, second: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border-2 border-gray-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gray-500 focus:shadow-lg focus:shadow-gray-500/20 font-black text-lg transition-all"
                />
              </div>
              
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                  <span className="text-2xl">🥉</span> Third Place Prize (₹)
                </label>
                <input
                  type="number"
                  value={prizeAmounts.third}
                  onChange={(e) => setPrizeAmounts({ ...prizeAmounts, third: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border-2 border-orange-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:shadow-lg focus:shadow-orange-500/20 font-black text-lg transition-all"
                />
              </div>

              <div className="hud-element p-6 holographic">
                <div className="text-xs text-gray-500 mb-2 font-black uppercase tracking-wider">Total Prize Pool</div>
                <div className="text-3xl font-black">
                  <span className="gradient-text-gold">
                    ₹{(prizeAmounts.first + prizeAmounts.second + prizeAmounts.third).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPrizeModal(false)}
                className="flex-1 px-6 py-3 glass border-2 border-white/20 hover:border-white/40 text-white font-black rounded-xl transition-all"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSavePrizes}
                className="flex-1 px-6 py-3 btn-gaming text-white"
              >
                Save Prizes
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Environment Check Modal */}
      {showEnvCheck && envStatus && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass max-w-2xl w-full p-8 relative"
          >
            <button
              onClick={() => setShowEnvCheck(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              ✕
            </button>
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="w-8 h-8 text-indigo-400" />
              <h3 className="text-2xl font-bold text-white">Environment Configuration</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-400">Groq API Key</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    envStatus.hasGroqKey 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {envStatus.hasGroqKey ? '✓ Configured' : '✗ Missing'}
                  </span>
                </div>
                {envStatus.hasGroqKey && (
                  <div className="text-xs text-gray-500 font-mono">
                    {envStatus.groqKeyPrefix}... ({envStatus.groqKeyLength} chars)
                  </div>
                )}
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-400">Groq Model</span>
                  <span className="text-xs text-indigo-400 font-mono">{envStatus.groqModel}</span>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-400">Database URL</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    envStatus.hasDatabaseUrl 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {envStatus.hasDatabaseUrl ? '✓ Configured' : '✗ Missing'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-400">Google OAuth</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    envStatus.hasGoogleClientId 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {envStatus.hasGoogleClientId ? '✓ Configured' : '✗ Missing'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-400">JWT Secret</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    envStatus.hasJwtSecret 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {envStatus.hasJwtSecret ? '✓ Configured' : '✗ Missing'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-indigo-600/10 rounded-xl border border-indigo-600/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-indigo-400">Environment</span>
                  <span className="text-xs text-indigo-400 font-mono uppercase">{envStatus.nodeEnv}</span>
                </div>
              </div>
            </div>

            {!envStatus.hasGroqKey && (
              <div className="bg-red-600/10 border border-red-600/20 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-bold text-red-400 mb-2">⚠️ Groq API Key Missing</h4>
                <p className="text-xs text-gray-400 mb-3">
                  The AI evaluation will not work without the Groq API key. Please add it to your environment variables.
                </p>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all"
                >
                  <span>Get Groq API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <button
              onClick={() => setShowEnvCheck(false)}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all glow"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}

      {/* Delete All Users Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-gaming max-w-lg w-full p-8 relative overflow-hidden border-2 border-red-600/50"
          >
            <div className="scan-line" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-600" />
            
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmation('');
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-red-400">⚠️ DANGER ZONE</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Permanent Action</p>
              </div>
            </div>

            <div className="bg-red-600/10 border-2 border-red-600/30 rounded-xl p-6 mb-6">
              <h4 className="text-lg font-black text-red-400 mb-3">Delete All Users & Data</h4>
              <p className="text-sm text-gray-300 mb-4">
                This action will permanently delete:
              </p>
              <ul className="space-y-2 text-sm text-gray-400 mb-4">
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span>All user accounts and profiles (except admin)</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span>All submissions and evaluations</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span>All payment records</span>
                </li>
              </ul>
              <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-3 mb-3">
                <p className="text-xs font-black text-green-400 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Admin account is protected and will NOT be deleted
                </p>
              </div>
              <div className="bg-black/40 border border-red-600/30 rounded-lg p-3">
                <p className="text-xs font-black text-red-400 uppercase tracking-wider">
                  ⚠️ THIS CANNOT BE UNDONE!
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2 block">
                  Type "DELETE ALL DATA" to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE ALL DATA"
                  className="w-full bg-black/40 border-2 border-red-600/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600 focus:shadow-lg focus:shadow-red-600/20 font-mono text-sm transition-all"
                  disabled={isDeleting}
                />
              </div>

              <div className="hud-element p-4 bg-yellow-600/10 border-yellow-600/30">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-gray-300">
                    <p className="font-black text-yellow-400 mb-1">Admin Only Action</p>
                    <p>Only the admin (lokesh009.naik@gmail.com) can perform this action. Use this when the competition is completely finished and you want to start fresh.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 glass border-2 border-white/20 hover:border-white/40 text-white font-black rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: deleteConfirmation === 'DELETE ALL DATA' && !isDeleting ? 1.05 : 1 }}
                whileTap={{ scale: deleteConfirmation === 'DELETE ALL DATA' && !isDeleting ? 0.95 : 1 }}
                onClick={handleDeleteAllUsers}
                disabled={deleteConfirmation !== 'DELETE ALL DATA' || isDeleting}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    <span>Delete Everything</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Specific User Modal (Secret Feature) */}
      {showDeleteUserModal && userToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-gaming max-w-md w-full p-8 relative overflow-hidden border-2 border-red-600/50"
          >
            <div className="scan-line" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-600" />
            
            <button
              onClick={() => {
                setShowDeleteUserModal(false);
                setUserToDelete(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-red-400">🔒 Secret Action</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Delete User</p>
              </div>
            </div>

            <div className="bg-red-600/10 border-2 border-red-600/30 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={userToDelete.picture || 'https://picsum.photos/seed/user/200'} 
                  className="w-12 h-12 rounded-full border-2 border-red-500/50" 
                  alt="" 
                />
                <div>
                  <h4 className="text-lg font-black text-white">{userToDelete.full_name || userToDelete.fullName}</h4>
                  <p className="text-xs text-gray-400">{userToDelete.email}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-300 mb-4">
                This will permanently delete:
              </p>
              <ul className="space-y-2 text-sm text-gray-400 mb-4">
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span>User account and profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span>All submissions by this user</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span>All payment records</span>
                </li>
              </ul>
              <div className="bg-black/40 border border-red-600/30 rounded-lg p-3">
                <p className="text-xs font-black text-red-400 uppercase tracking-wider">
                  ⚠️ THIS CANNOT BE UNDONE!
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowDeleteUserModal(false);
                  setUserToDelete(null);
                }}
                className="flex-1 px-6 py-3 glass border-2 border-white/20 hover:border-white/40 text-white font-black rounded-xl transition-all"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDeleteSpecificUser}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                <span>Delete User</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Dashboard Modal */}
      {showPaymentDashboard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-gaming max-w-6xl w-full p-8 relative overflow-hidden border-2 border-green-600/50 my-8"
          >
            <div className="scan-line" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 to-emerald-600" />
            
            <button
              onClick={() => setShowPaymentDashboard(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl z-10"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-green-400">Payment Dashboard</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Real-time transaction monitoring</p>
              </div>
            </div>

            {/* Payment Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="hud-element p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase font-black tracking-wider">Total Registered</span>
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="text-3xl font-black text-indigo-400">{submissions?.length || 0}</div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-1">All Warriors</p>
              </div>
              
              <div className="hud-element p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase font-black tracking-wider">Payment Completed</span>
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-black text-green-400">{paymentStats?.successful_payments || 0}</div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-1">Paid Warriors</p>
              </div>
              
              <div className="hud-element p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase font-black tracking-wider">Total Payments</span>
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-3xl font-black text-white">{paymentStats?.total_payments || 0}</div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-1">All Transactions</p>
              </div>
              
              <div className="hud-element p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase font-black tracking-wider">Pending</span>
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-3xl font-black text-yellow-400">{paymentStats?.pending_payments || 0}</div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-1">Awaiting Payment</p>
              </div>
              
              <div className="hud-element p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase font-black tracking-wider">Total Revenue</span>
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-black text-green-400">₹{Number(paymentStats?.total_revenue || 0).toLocaleString()}</div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-1">Collected</p>
              </div>
            </div>

            {/* Payments Table */}
            <div className="hud-element p-6 max-h-[500px] overflow-y-auto">
              <h4 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-green-400" />
                Recent Transactions
              </h4>
              
              {!payments || payments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No payments yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment: any) => (
                    <div key={payment.id} className="glass p-4 rounded-xl border border-white/10 hover:border-green-500/30 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={payment.picture || 'https://picsum.photos/seed/user/200'} 
                            className="w-10 h-10 rounded-full border-2 border-green-500/30" 
                            alt="" 
                          />
                          <div>
                            <p className="text-sm font-black text-white">{payment.full_name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">{payment.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-green-400">₹{Number(payment.amount).toFixed(2)}</p>
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                            payment.status === 'paid' ? 'bg-green-500/20 text-green-400' : 
                            payment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500 uppercase font-black tracking-wider">Order ID:</span>
                          <p className="text-gray-300 font-mono">{payment.order_id}</p>
                        </div>
                        {payment.payment_method && (
                          <div>
                            <span className="text-gray-500 uppercase font-black tracking-wider">Method:</span>
                            <p className="text-gray-300">{payment.payment_method}</p>
                          </div>
                        )}
                        {payment.cf_payment_id && (
                          <div>
                            <span className="text-gray-500 uppercase font-black tracking-wider">Payment ID:</span>
                            <p className="text-gray-300 font-mono text-[10px]">{payment.cf_payment_id}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500 uppercase font-black tracking-wider">Date:</span>
                          <p className="text-gray-300">{new Date(payment.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPaymentDashboard(false)}
                className="px-8 py-3 btn-gaming text-white"
              >
                Close Dashboard
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* User Activity Dashboard Modal */}
      {showUserActivityDashboard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-gaming max-w-6xl w-full p-8 relative overflow-hidden border-2 border-cyan-600/50 my-8"
          >
            <div className="scan-line" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-600 to-blue-600" />
            
            <button
              onClick={() => setShowUserActivityDashboard(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl z-10"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-cyan-600/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-cyan-400">User Activity Dashboard</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Real-time user login/signup & payment status</p>
              </div>
            </div>

            {/* User Activity Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="hud-element p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase font-black tracking-wider">Total Users</span>
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="text-3xl font-black text-white">{submissions?.length || 0}</div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-1">Registered Warriors</p>
              </div>
              
              <div className="hud-element p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase font-black tracking-wider">Payment Completed</span>
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-black text-green-400">
                  {submissions?.filter(s => s.payment_status === 'paid' || s.paymentStatus === 'paid').length || 0}
                </div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-1">Paid Users</p>
              </div>
              
              <div className="hud-element p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase font-black tracking-wider">Payment Pending</span>
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-3xl font-black text-yellow-400">
                  {submissions?.filter(s => s.payment_status === 'pending' || s.paymentStatus === 'pending').length || 0}
                </div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-1">Awaiting Payment</p>
              </div>
              
              <div className="hud-element p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase font-black tracking-wider">Active Now</span>
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-3xl font-black text-cyan-400">1</div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-1">Admin Online</p>
              </div>
            </div>

            {/* Users Table */}
            <div className="hud-element p-6 max-h-[500px] overflow-y-auto">
              <h4 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                All Users Activity
              </h4>
              
              {!submissions || submissions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No users yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((submission: any) => {
                    const isPaid = submission.payment_status === 'paid' || submission.paymentStatus === 'paid';
                    const isPending = submission.payment_status === 'pending' || submission.paymentStatus === 'pending';
                    const isAdmin = submission.email === 'lokesh009.naik@gmail.com';
                    
                    return (
                      <div key={submission.id} className="glass p-4 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={submission.picture || 'https://picsum.photos/seed/user/200'} 
                              className="w-10 h-10 rounded-full border-2 border-cyan-500/30" 
                              alt="" 
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-black text-white">{submission.full_name || submission.fullName || 'Anonymous'}</p>
                                {isAdmin && (
                                  <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{submission.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded ${
                              isPaid ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                              isPending ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                              'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {isPaid ? '✓ Paid' : isPending ? '⏰ Pending' : '✗ Not Paid'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-gray-500 uppercase font-black tracking-wider">Joined:</span>
                            <p className="text-gray-300">{new Date(submission.created_at || submission.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 uppercase font-black tracking-wider">Submission:</span>
                            <p className="text-gray-300 truncate">{submission.title}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 uppercase font-black tracking-wider">Status:</span>
                            <p className={`font-black ${
                              submission.status === 'judged' ? 'text-green-400' : 'text-yellow-400'
                            }`}>
                              {submission.status === 'judged' ? 'Evaluated' : 'Pending'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUserActivityDashboard(false)}
                className="px-8 py-3 btn-gaming text-white"
              >
                Close Dashboard
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default JudgePanel;
