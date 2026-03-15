import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lightbulb, Target, CreditCard, CheckCircle, ArrowRight, ArrowLeft, Shield, Loader2, Zap, Trophy, Users, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Cashfree: any;
  }
}

const steps = [
  { id: 1, title: 'Identity', icon: Mail },
  { id: 2, title: 'Idea Details', icon: Lightbulb },
  { id: 3, title: 'Market & Impact', icon: Target },
  { id: 4, title: 'Payment', icon: CreditCard },
  { id: 5, title: 'Confirmation', icon: CheckCircle },
];

const RegisterIdea = () => {
  const { user, login, token, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [activeCompetition, setActiveCompetition] = useState<any>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    problem: '',
    solution: '',
    market: '',
    impact: '',
  });

  // Fetch active competition
  useEffect(() => {
    const fetchActiveCompetition = async () => {
      try {
        const response = await fetch('/api/competitions/active');
        if (response.ok) {
          const data = await response.json();
          setActiveCompetition(data);
        }
      } catch (error) {
        console.error('Failed to fetch active competition', error);
      }
    };
    fetchActiveCompetition();
  }, []);

  // If user is already logged in, skip step 1 and check for pending submission
  useEffect(() => {
    if (user && currentStep === 1) {
      setCurrentStep(2);
      
      // Check if user has a pending submission
      const pendingSubmission = user.submissions?.find(s => 
        s.payment_status === 'pending' || s.paymentStatus === 'pending'
      );
      
      if (pendingSubmission) {
        // Pre-fill form with existing submission data
        setFormData({
          title: pendingSubmission.title || '',
          problem: pendingSubmission.problem || '',
          solution: pendingSubmission.solution || '',
          market: pendingSubmission.market || '',
          impact: pendingSubmission.impact || '',
        });
        
        // Show message about pending payment
        toast('You have a pending submission. Payment will be verified automatically.', {
          duration: 5000,
          icon: 'ℹ️'
        });
      }
    }
  }, [user, currentStep]);

  const handleGoogleSuccess = async (response: any) => {
    try {
      await login(response.credential);
      toast.success('Successfully logged in with Google!');
      setCurrentStep(2);
    } catch (error) {
      toast.error('Google Login failed.');
    }
  };

  const handlePayment = async () => {
    if (!activeCompetition) {
      return toast.error('No active competition found. Please try again later.');
    }

    // Check if user has phone number
    if (!user?.phone) {
      toast.error('Please add your phone number in Dashboard → Profile first');
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Create payment order with submission data
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          competitionId: activeCompetition.id,
          submissionData: formData // Send submission data with payment
        })
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Failed to create payment order');
      }

      const { paymentSessionId, orderId, paymentLink } = await orderRes.json();

      console.log('Payment order created:', orderId);
      console.log('Payment link:', paymentLink);

      // Use payment link if available (bypasses SDK domain issues)
      if (paymentLink) {
        console.log('Using direct payment link');
        window.location.href = paymentLink;
        return;
      }

      // Try SDK first, fallback to direct redirect
      try {
        // Check if Cashfree SDK is loaded
        if (window.Cashfree) {
          console.log('Using Cashfree SDK');
          const cashfree = new window.Cashfree({
            mode: "production",
          });

          await cashfree.checkout({
            paymentSessionId,
            redirectTarget: "_self",
          });
        } else {
          throw new Error('SDK not loaded');
        }
      } catch (sdkError) {
        // Fallback: Use direct redirect to payment link
        console.log('SDK failed, using direct redirect:', sdkError.message);
        
        // Construct payment URL manually
        const paymentUrl = `https://payments.cashfree.com/order/#${paymentSessionId}`;
        console.log('Redirecting to:', paymentUrl);
        
        // Redirect to Cashfree payment page
        window.location.href = paymentUrl;
      }
      
    } catch (error: any) {
      setIsProcessingPayment(false);
      toast.error(error.message || 'Payment initiation failed');
      console.error('Payment error:', error);
    }
  };

  const nextStep = () => {
    // Basic validation
    if (currentStep === 2) {
      if (!formData.title || !formData.problem || !formData.solution) {
        return toast.error('Please fill in all idea details');
      }
    }
    if (currentStep === 3) {
      if (!formData.market || !formData.impact) {
        return toast.error('Please fill in market and impact details');
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderStep = () => {
    // Check for paid submission
    const paidSubmission = user?.submissions?.find(s => 
      s.payment_status === 'paid' || s.paymentStatus === 'paid'
    );
    
    // Check for pending submission
    const pendingSubmission = user?.submissions?.find(s => 
      s.payment_status === 'pending' || s.paymentStatus === 'pending'
    );
    
    if (paidSubmission) {
      return (
        <div className="text-center space-y-6 py-12">
          <div className="w-24 h-24 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-6 glow">
            <CheckCircle className="w-12 h-12 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-black text-white">
            <span className="gradient-text">Already Registered</span>
          </h2>
          <p className="text-gray-400 max-w-md mx-auto text-lg">
            You have already registered and completed payment. View your submission status in your dashboard.
          </p>
          <div className="pt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/dashboard'}
              className="px-10 py-4 btn-gaming text-white text-lg"
            >
              View Dashboard
            </motion.button>
          </div>
        </div>
      );
    }
    
    // If pending submission exists, show message but allow to continue
    if (pendingSubmission && currentStep === 2) {
      return (
        <div className="space-y-6">
          <div className="p-4 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-bold">Payment Pending</p>
                <p className="text-gray-400 text-sm">Complete your payment to finalize registration</p>
              </div>
            </div>
          </div>
          {renderStepContent()}
        </div>
      );
    }
    
    return renderStepContent();
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-3">
                <span className="gradient-text">Warrior Identity</span>
              </h2>
              <p className="text-gray-400">Authenticate to enter the battle arena</p>
            </div>

            <div className="flex justify-center mb-8 relative">
              <div className="absolute inset-0 bg-indigo-600/20 blur-2xl rounded-full" />
              <div className="relative">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google Login Failed')}
                  theme="filled_blue"
                  shape="pill"
                  text="continue_with"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-2 text-gray-500 text-[10px] uppercase tracking-widest pt-4">
              <Shield className="w-3 h-3 text-green-500" />
              <span>Secure Battle Authentication</span>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-3">
                <span className="gradient-text">Battle Idea</span>
              </h2>
              <p className="text-gray-400">Define your warrior strategy</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <Lightbulb className="w-3 h-3 text-indigo-400" />
                  Battle Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. EcoCharge Solutions"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <Target className="w-3 h-3 text-indigo-400" />
                  The Challenge
                </label>
                <textarea
                  placeholder="What enemy are you defeating?"
                  value={formData.problem}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                  className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/20 h-32 resize-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <Zap className="w-3 h-3 text-indigo-400" />
                  Your Weapon
                </label>
                <textarea
                  placeholder="How does your solution dominate?"
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/20 h-32 resize-none transition-all"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                className="w-full py-4 btn-gaming text-white flex items-center justify-center space-x-2"
              >
                <span>Next Battle Phase</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-3">
                <span className="gradient-text">Battle Territory</span>
              </h2>
              <p className="text-gray-400">Define your conquest zone and victory impact</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <Users className="w-3 h-3 text-indigo-400" />
                  Target Warriors
                </label>
                <textarea
                  placeholder="Who are your allies and what territory will you conquer?"
                  value={formData.market}
                  onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                  className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/20 h-32 resize-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <Trophy className="w-3 h-3 text-indigo-400" />
                  Victory Impact
                </label>
                <textarea
                  placeholder="What legendary impact will your victory create?"
                  value={formData.impact}
                  onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                  className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/20 h-32 resize-none transition-all"
                />
              </div>
              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={prevStep}
                  className="flex-1 py-3 glass border-2 border-white/20 hover:border-white/40 text-white font-bold rounded-xl flex items-center justify-center space-x-2 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={nextStep}
                  className="flex-[2] py-4 btn-gaming text-white flex items-center justify-center space-x-2"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-3">
                <span className="gradient-text">Battle Entry Fee</span>
              </h2>
              <p className="text-gray-400">Secure your spot in the arena</p>
            </div>
            <div className="card-gaming p-8 text-center relative overflow-hidden">
              <div className="scan-line" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              
              <p className="text-gray-400 mb-2 text-sm font-black uppercase tracking-wider">Arena Entry</p>
              <p className="text-6xl font-black mb-8">
                <span className="gradient-text">₹9</span>
              </p>
              
              <div className="text-left hud-element p-6 mb-8 space-y-4">
                <div className="flex items-center space-x-3 text-sm text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <span>AI-Powered Battle Analysis</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <span>Expert Warrior Feedback</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <span>Leaderboard Glory</span>
                </div>
              </div>

              {isProcessingPayment ? (
                <div className="py-6 space-y-4">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-sm text-indigo-400 font-black animate-pulse uppercase tracking-wider">Processing Battle Entry...</p>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest">Do not leave the arena</p>
                </div>
              ) : paymentConfirmed ? (
                <div className="py-6 space-y-4">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto glow">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-xl font-black text-green-400 uppercase tracking-wider">Entry Confirmed!</p>
                  <p className="text-sm text-gray-500">Entering the arena...</p>
                </div>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePayment} 
                    className="w-full py-5 btn-gaming text-white flex items-center justify-center space-x-3 text-lg"
                  >
                    <CreditCard className="w-6 h-6" />
                    <span>Pay ₹9 & Register</span>
                  </motion.button>
                  <p className="mt-4 text-[10px] text-gray-600 uppercase tracking-widest">
                    Secure transaction via Cashfree Gateway
                  </p>
                </>
              )}
              
              {!isProcessingPayment && !paymentConfirmed && (
                <button onClick={prevStep} className="mt-6 text-sm text-gray-500 hover:text-indigo-400 transition-colors font-bold">
                  ← Edit Battle Details
                </button>
              )}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="text-center space-y-8 py-8">
            <div className="relative inline-block">
              <div className="w-28 h-28 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 glow">
                <CheckCircle className="w-16 h-16 text-emerald-400" />
              </div>
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl -z-0 animate-pulse" />
            </div>
            
            <div>
              <h2 className="text-5xl font-black mb-4">
                <span className="gradient-text">Victory Registered!</span>
              </h2>
              <p className="text-gray-400 max-w-md mx-auto leading-relaxed text-lg">
                Your battle idea <span className="text-indigo-400 font-black">"{formData.title}"</span> has entered the arena.
              </p>
            </div>

            <div className="card-gaming p-8 max-w-sm mx-auto text-left space-y-4">
              <div className="scan-line" />
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-xs text-gray-500 uppercase font-black tracking-wider">Battle ID</span>
                <span className="text-sm font-mono text-indigo-400 font-black">#IW-{submissionId || Math.floor(Math.random() * 90000) + 10000}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-xs text-gray-500 uppercase font-black tracking-wider">Status</span>
                <span className="text-xs font-black text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  Awaiting Evaluation
                </span>
              </div>
              <div className="hud-element p-4">
                <p className="text-xs text-gray-400">
                  Your AI battle analysis and expert warrior feedback will arrive within 24-48 hours.
                </p>
              </div>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/leaderboard'}
                className="px-10 py-4 btn-gaming text-white text-lg"
              >
                View Battle Rankings
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/dashboard'}
                className="px-10 py-4 glass border-2 border-indigo-500/30 hover:border-indigo-500/60 text-white font-bold rounded-xl transition-all text-lg"
              >
                Warrior Dashboard
              </motion.button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pt-24 pb-20 px-4 max-w-3xl mx-auto relative">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 cyber-grid opacity-10" />
      <div className="fixed top-20 left-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="fixed bottom-20 right-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Header */}
      <div className="text-center mb-12">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-black mb-4"
        >
          <span className="gradient-text">Register Your Idea</span>
        </motion.h1>
        <p className="text-gray-400 text-lg">Submit your startup idea and compete for prizes</p>
      </div>

      <div className="mb-12">
        <div className="flex justify-between items-center mb-8 relative">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center space-y-2 relative z-10">
              <motion.div
                animate={{
                  scale: currentStep >= step.id ? [1, 1.1, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                  currentStep >= step.id ? 'bg-indigo-600 text-white glow scale-110 neon-border' : 'bg-white/5 text-gray-600'
                }`}
              >
                <step.icon className="w-6 h-6" />
              </motion.div>
              <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:block ${
                currentStep >= step.id ? 'text-indigo-400' : 'text-gray-600'
              }`}>
                {step.title}
              </span>
            </div>
          ))}
          
          {/* Progress Line with Glow */}
          <div className="absolute top-6 left-0 w-full h-[2px] bg-white/5 -z-0">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/50"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
          className="card-gaming p-8 md:p-12 relative overflow-hidden"
        >
          <div className="scan-line" />
          {/* Decorative background element */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -z-10" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl -z-10" />
          
          {renderStep()}
        </motion.div>
      </AnimatePresence>
      
      <div className="mt-8 text-center">
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">
          IdeaWin by CAFYO • Secure Battle Registration
        </p>
      </div>
    </div>
  );
};


export default RegisterIdea;
