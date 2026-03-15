/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Competition from './pages/Competition';
import Leaderboard from './pages/Leaderboard';
import Winners from './pages/Winners';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { Terms, Privacy, Refund, IPPolicy } from './pages/Legal';
import JudgingCriteria from './pages/JudgingCriteria';

import RegisterIdea from './pages/RegisterIdea';
import JudgePanel from './pages/JudgePanel';
import PaymentStatus from './pages/PaymentStatus';

const queryClient = new QueryClient();

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '648839730477-g5hjgtbssndeckn267742aj1auf3p3to.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-[#0F0F1E] text-white selection:bg-indigo-500/30">
              <Navbar />
              <main>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/competition" element={<Competition />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/winners" element={<Winners />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<RegisterIdea />} />
                  <Route path="/admin-portal" element={<JudgePanel />} />
                  <Route path="/payment-status" element={<PaymentStatus />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/refund" element={<Refund />} />
                  <Route path="/ip-policy" element={<IPPolicy />} />
                  <Route path="/judging-criteria" element={<JudgingCriteria />} />
                </Routes>
              </main>
              
              <footer className="bg-black/40 border-t border-white/5 py-12 mt-20">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white">IdeaWin by CAFYO</h3>
                    <p className="text-sm text-gray-500">The premier platform for startup idea competitions.</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase mb-4">Platform</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                      <li><Link to="/competition" className="hover:text-indigo-400">Competition</Link></li>
                      <li><Link to="/leaderboard" className="hover:text-indigo-400">Leaderboard</Link></li>
                      <li><Link to="/winners" className="hover:text-indigo-400">Winners</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase mb-4">Legal</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                      <li><Link to="/terms" className="hover:text-indigo-400">Terms of Service</Link></li>
                      <li><Link to="/privacy" className="hover:text-indigo-400">Privacy Policy</Link></li>
                      <li><Link to="/refund" className="hover:text-indigo-400">Refund Policy</Link></li>
                      <li><Link to="/ip-policy" className="hover:text-indigo-400">IP Policy</Link></li>
                      <li><Link to="/judging-criteria" className="hover:text-indigo-400">Judging Criteria</Link></li>
                    </ul>
                  </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-white/5 text-center text-xs text-gray-600">
                  © {new Date().getFullYear()} IdeaWin by CAFYO. All rights reserved.
                </div>
              </footer>
            </div>
            <Toaster position="bottom-right" />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

