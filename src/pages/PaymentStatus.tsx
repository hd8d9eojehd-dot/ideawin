import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('Verifying your payment...');

  const verifyPayment = async (attempt = 1) => {
    if (!token) {
      navigate('/dashboard');
      return;
    }

    try {
      console.log('=== PAYMENT VERIFICATION START ===');
      console.log('Attempt:', attempt);
      
      // Get user's current data
      const userResponse = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('User submissions:', userResponse.data.submissions);
      
      const pendingSubmission = userResponse.data.submissions?.find((s: any) => 
        s.payment_status === 'pending' || s.paymentStatus === 'pending'
      );
      
      const paidSubmission = userResponse.data.submissions?.find((s: any) => 
        s.payment_status === 'paid' || s.paymentStatus === 'paid'
      );
      
      // Check if payment is already verified
      if (paidSubmission && !pendingSubmission) {
        console.log('✅ Payment already verified!');
        setStatus('success');
        await refreshUser();
        toast.success('Payment verified!');
        setTimeout(() => navigate('/dashboard'), 2000);
        return;
      }
      
      if (!pendingSubmission) {
        console.log('No pending submission found');
        toast('No pending payment found', { icon: 'ℹ️' });
        setTimeout(() => navigate('/dashboard'), 1500);
        return;
      }

      const pendingOrderId = pendingSubmission.payment_id || pendingSubmission.paymentId;
      console.log('Pending order ID:', pendingOrderId);
      
      // Start database polling immediately (webhook updates database)
      startDatabasePolling(pendingOrderId, 1);
      
    } catch (error: any) {
      console.error('Error in verifyPayment:', error);
      
      // On error, retry a few times
      if (attempt < 3) {
        console.log('Retrying verification...');
        setTimeout(() => verifyPayment(attempt + 1), 2000);
      } else {
        setStatus('failed');
        setErrorMessage('Unable to verify payment. Please check your dashboard.');
        toast.error('Verification error');
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    }
  };

  const startDatabasePolling = async (orderId: string, attempt: number) => {
    if (attempt > 30) {
      // After 30 polls (60 seconds), give up
      console.log('⏱️ Polling timeout reached');
      toast('Payment is being processed. Check your dashboard in a few minutes.', {
        icon: '⏳',
        duration: 5000
      });
      setTimeout(() => navigate('/dashboard'), 3000);
      return;
    }

    try {
      setVerificationMessage(`Confirming payment (${attempt}/30)...`);
      console.log(`=== POLLING ATTEMPT ${attempt}/30 ===`);
      console.log('Looking for order:', orderId);
      
      // Check database for updated status (webhook updates this)
      const userResponse = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allSubmissions = userResponse.data.submissions || [];
      console.log('Total submissions:', allSubmissions.length);
      console.log('All submissions:', JSON.stringify(allSubmissions, null, 2));
      
      // Strategy 1: Find by exact payment_id match
      let submission = allSubmissions.find((s: any) => 
        (s.payment_id === orderId || s.paymentId === orderId)
      );
      
      if (submission) {
        console.log('✓ Found submission by payment_id:', submission.id);
      } else {
        console.log('✗ No submission found by payment_id');
        
        // Strategy 2: Find any pending submission (likely ours)
        submission = allSubmissions.find((s: any) => 
          s.payment_status === 'pending' || s.paymentStatus === 'pending'
        );
        
        if (submission) {
          console.log('✓ Found pending submission (fallback):', submission.id);
        }
      }
      
      // Strategy 3: After 5 attempts, check if ANY submission became paid
      // (This handles webhook updating without exact payment_id match)
      if (attempt >= 5) {
        const paidSubmission = allSubmissions.find((s: any) => 
          s.payment_status === 'paid' || s.paymentStatus === 'paid'
        );
        
        if (paidSubmission) {
          console.log('✅ Found PAID submission - assuming payment successful!');
          console.log('Paid submission:', paidSubmission);
          setStatus('success');
          await refreshUser();
          toast.success('Payment verified! Your idea is registered.');
          setTimeout(() => navigate('/dashboard'), 2000);
          return;
        }
      }
      
      // Check current submission status
      if (submission) {
        const paymentStatus = submission.payment_status || submission.paymentStatus;
        console.log('Current payment status:', paymentStatus);
        
        if (paymentStatus === 'paid') {
          console.log('✅ Payment verified as PAID!');
          setStatus('success');
          await refreshUser();
          toast.success('Payment verified! Your idea is registered.');
          setTimeout(() => navigate('/dashboard'), 2000);
          return;
        } else if (paymentStatus === 'failed') {
          console.log('❌ Payment marked as FAILED');
          setStatus('failed');
          setErrorMessage('Payment was not successful.');
          toast.error('Payment failed');
          setTimeout(() => navigate('/dashboard'), 3000);
          return;
        } else {
          console.log('⏳ Payment still pending...');
        }
      } else {
        console.log('⚠️ No submission found at all');
      }
      
      // Still pending, poll again every 2 seconds
      console.log('Polling again in 2s...');
      setTimeout(() => {
        startDatabasePolling(orderId, attempt + 1);
      }, 2000);
      
    } catch (error) {
      console.error('❌ Database polling error:', error);
      // Retry polling on error
      setTimeout(() => {
        startDatabasePolling(orderId, attempt + 1);
      }, 2000);
    }
  };

  useEffect(() => {
    // Wait 2 seconds before starting verification
    // This gives Cashfree webhook time to hit our server
    const timer = setTimeout(() => {
      verifyPayment(1);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="pt-32 pb-20 px-4 max-w-md mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-12 space-y-6"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto" />
            <h2 className="text-2xl font-bold text-white">Verifying Payment</h2>
            <p className="text-gray-400 text-sm">{verificationMessage}</p>
            <p className="text-gray-600 text-xs mt-2">This may take a few moments...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-white">Payment Successful!</h2>
            <p className="text-gray-400">Your startup idea has been successfully registered.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl glow flex items-center justify-center space-x-2 transition-all"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-gray-600">Redirecting automatically...</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold text-white">Payment Not Confirmed</h2>
            <p className="text-gray-400">
              {errorMessage || 'We couldn\'t confirm your payment. If you completed the payment, please wait a few minutes and check your dashboard.'}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center space-x-2 transition-all"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-gray-600">Redirecting automatically...</p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentStatus;
