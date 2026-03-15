import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Trophy, Shield, Zap, Swords } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = async (response: any) => {
    try {
      await login(response.credential);
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 cyber-grid opacity-10" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Floating Particles */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card-gaming p-12 w-full max-w-md text-center relative overflow-hidden"
      >
        <div className="scan-line" />
        
        {/* Logo with Glow */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-2xl opacity-50" />
          <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto glow neon-border">
            <Swords className="text-white w-10 h-10" />
          </div>
        </div>
        
        <h1 className="text-4xl font-black mb-3">
          <span className="gradient-text">Enter the Arena</span>
        </h1>
        <p className="text-gray-400 mb-10 text-lg">Authenticate to join the battle</p>

        <div className="flex justify-center mb-8 relative">
          <div className="absolute inset-0 bg-indigo-600/20 blur-2xl rounded-full" />
          <div className="relative">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => toast.error('Google Login Failed')}
              theme="filled_blue"
              shape="pill"
              text="continue_with"
            />
          </div>
        </div>

        <div className="hud-element p-4 mb-6">
          <div className="flex items-center justify-center space-x-3 text-gray-400 text-sm">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Secure Warrior Authentication</span>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3 text-left">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-indigo-400" />
            </div>
            <span>Compete for epic prizes</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <span>AI-powered battle analysis</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="w-8 h-8 rounded-lg bg-pink-600/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-pink-400" />
            </div>
            <span>Expert warrior feedback</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
