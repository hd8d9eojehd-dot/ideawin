import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Submission, Competition } from '../types';
import { Trophy, Search, Info, Activity, MessageSquare } from 'lucide-react';

const Leaderboard = () => {
  const { user } = useAuth();
  const [selectedComp, setSelectedComp] = React.useState<string>('');
  const [filter, setFilter] = React.useState<'All' | 'Judged' | 'Pending'>('All');
  const [viewingFeedback, setViewingFeedback] = React.useState<Submission | null>(null);
  const queryClient = useQueryClient();

  const { data: competitions } = useQuery<Competition[]>({
    queryKey: ['competitions'],
    queryFn: async () => {
      const res = await api.get('/competitions');
      return res.data;
    },
  });

  React.useEffect(() => {
    if (competitions && competitions.length > 0 && !selectedComp) {
      const active = competitions.find(c => c.status === 'active') || competitions[0];
      setSelectedComp(active.id.toString());
    }
  }, [competitions, selectedComp]);

  const { data: leaderboardData, isLoading } = useQuery<{ submissions: Submission[], resultsPublished: boolean }>({
    queryKey: ['leaderboard', selectedComp],
    queryFn: async () => {
      const res = await api.get(`/leaderboard/${selectedComp}`);
      return res.data;
    },
    enabled: !!selectedComp,
  });

  const leaderboard = leaderboardData?.submissions || [];
  const resultsPublished = leaderboardData?.resultsPublished || false;

  React.useEffect(() => {
    // Disable WebSocket on Vercel (serverless doesn't support it)
    // Real-time updates disabled for now
    // const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // const ws = new WebSocket(`${protocol}//${window.location.host}`);
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   if (data.type === 'NEW_SUBMISSION' || data.type === 'SCORE_UPDATED' || data.type === 'RESULTS_PUBLISHED') {
    //     queryClient.invalidateQueries({ queryKey: ['leaderboard', selectedComp] });
    //   }
    // };
    // return () => ws.close();
    
    // Poll for updates every 30 seconds instead
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard', selectedComp] });
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedComp, queryClient]);

  const filteredLeaderboard = leaderboard?.filter(sub => {
    if (filter === 'All') return true;
    if (filter === 'Judged') return sub.status === 'judged';
    if (filter === 'Pending') return sub.status === 'pending';
    return true;
  }).sort((a, b) => {
    // Primary sort: finalScore descending
    const aScore = a.finalScore || a.final_score || 0;
    const bScore = b.finalScore || b.final_score || 0;
    if (bScore !== aScore) {
      return bScore - aScore;
    }
    // Secondary sort: createdAt descending (most recent first)
    const aDate = new Date(a.createdAt || a.created_at || 0).getTime();
    const bDate = new Date(b.createdAt || b.created_at || 0).getTime();
    return bDate - aDate;
  }) || [];

  return (
    <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center space-x-4">
          <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
            <Activity className="w-3 h-3 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Live Updates</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedComp}
            onChange={(e) => setSelectedComp(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {competitions?.map(c => (
              <option key={c.id} value={c.id} className="bg-gray-900">{c.title}</option>
            ))}
          </select>
          <div className="text-right text-xs text-gray-500">
            Last updated<br />{new Date().toLocaleTimeString()}
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex space-x-2">
          {['All', 'Judged', 'Pending'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="glass overflow-hidden">
        {(!leaderboard || leaderboard.length === 0) && !isLoading ? (
          <div className="p-20 text-center">
            <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Submissions Yet</h3>
            <p className="text-gray-500">Be the first one to submit your idea and top the leaderboard!</p>
          </div>
        ) : (
          <>
            {!resultsPublished && (
              <div className="bg-yellow-600/10 border-b border-yellow-600/20 p-4 text-center">
                <div className="flex items-center justify-center space-x-2 text-yellow-400">
                  <Info className="w-5 h-5" />
                  <span className="text-sm font-bold">Evaluation in Progress - Scores will be revealed when results are published</span>
                </div>
              </div>
            )}
            
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Idea Title</th>
                  <th className="px-6 py-4">Participant</th>
                  {resultsPublished ? (
                    <>
                      <th className="px-6 py-4">AI Score</th>
                      <th className="px-6 py-4">Judge Score</th>
                      <th className="px-6 py-4">Final Score</th>
                    </>
                  ) : (
                    <th className="px-6 py-4">Status</th>
                  )}
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredLeaderboard.map((row, index) => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {resultsPublished && index < 3 && (
                          <span className="text-2xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                        <span className="text-gray-400">{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{row.title}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <img src={row.picture} alt="" className="w-6 h-6 rounded-full" />
                        <span className="text-xs text-gray-400">{row.fullName || row.full_name}</span>
                      </div>
                    </td>
                    
                    {resultsPublished ? (
                      <>
                        <td className="px-6 py-4 text-indigo-400 font-bold">
                          {Number(row.aiScore || row.ai_score || 0).toFixed(1)}
                        </td>
                        <td className="px-6 py-4 text-indigo-400 font-bold">
                          {Number(row.judgeScore || row.judge_score || 0).toFixed(1)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-green-400 font-bold text-lg">
                              {Number(row.finalScore || row.final_score || 0).toFixed(1)}
                            </span>
                            {index < 3 && (
                              <span className="text-xs text-green-400">🎉</span>
                            )}
                          </div>
                        </td>
                      </>
                    ) : (
                      <td className="px-6 py-4">
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center space-x-2 w-fit">
                          <Activity className="w-3 h-3 animate-pulse" />
                          <span>Evaluating</span>
                        </span>
                      </td>
                    )}
                    
                    <td className="px-6 py-4">
                      {resultsPublished ? (
                        <button
                          onClick={() => setViewingFeedback(row)}
                          className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all border border-white/10"
                          title="View Feedback"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-600 italic">Hidden</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {resultsPublished && (
        <div className="mt-12 text-center">
          <div className="glass p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-4">🎊 Results Published!</h3>
            <p className="text-gray-400 mb-4">
              Congratulations to all participants! The evaluation is complete and scores are now visible.
            </p>
            <p className="text-gray-500 font-mono text-xs">
              Scoring Formula: Final Score = (AI Score × 40%) + (Judge Score × 60%)
            </p>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {viewingFeedback && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass max-w-2xl w-full p-8 relative overflow-hidden"
          >
            <button
              onClick={() => setViewingFeedback(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold text-white mb-2">{viewingFeedback.title}</h3>
            <p className="text-indigo-400 text-sm font-bold mb-6">Evaluation Feedback</p>
            
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
              {viewingFeedback.aiFeedback || viewingFeedback.ai_feedback ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center space-x-2">
                    <Activity className="w-3 h-3 text-indigo-400" />
                    <span>AI Evaluation</span>
                  </h4>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {viewingFeedback.aiFeedback || viewingFeedback.ai_feedback}
                  </div>
                </div>
              ) : null}
              
              {viewingFeedback.judgeFeedback || viewingFeedback.judge_feedback ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center space-x-2">
                    <Info className="w-3 h-3 text-yellow-400" />
                    <span>Expert Panel Feedback</span>
                  </h4>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {viewingFeedback.judgeFeedback || viewingFeedback.judge_feedback}
                  </div>
                </div>
              ) : null}

              {!viewingFeedback.aiFeedback && !viewingFeedback.ai_feedback && !viewingFeedback.judgeFeedback && !viewingFeedback.judge_feedback && (
                <p className="text-center text-gray-500 py-8">No feedback available yet. Evaluation is in progress.</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
