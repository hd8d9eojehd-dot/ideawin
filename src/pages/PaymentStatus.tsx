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
      console.log('Verifying payment, attempt:', attempt);
      setVerificationMessage(`Checking payment status (${attempt}/10)...`);
      
      // Get user's pending submission
      const userResponse = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const pendingSubmission = userResponse.data.submissions?.find((s: any) => 
        s.payment_status === 'pending' || s.paymentStatus === 'pending'
      );
      
      if (!pendingSubmission) {
        console.log('No pending submission found - checking if already paid');
        
        // Check if user has a paid submission
        const paidSubmission = userResponse.data.submissions?.find((s: any) => 
          s.payment_status === 'paid' || s.paymentStatus === 'paid'
        );
        
        if (paidSubmission) {
          setStatus('success');
          await refreshUser();
          toast.success('Payment verified!');
          setTimeout(() => navigate('/dashboard'), 2000);
        } else {
          toast('No pending payment found', { icon: 'ℹ️' });
          setTimeout(() => navigate('/dashboard'), 1500);
        }
        return;
      }

      const pendingOrderId = pendingSubmission.payment_id || pendingSubmission.paymentId;
      console.log('Verifying payment for order:', pendingOrderId);
      
      // Try Cashfree API verification first
      const response = await api.post('/payments/auto-complete', 
        { orderId: pendingOrderId },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );
      
      console.log('Payment verification response:', response.data);
      
      if (response.data.success && response.data.verified) {
        // Payment confirmed by Cashfree API
        setStatus('success');
        await refreshUser();
        toast.success('Payment verified! Your idea is registered.');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
        
      } else if (response.data.status === 'pending' && attempt < 10) {
        // Payment still processing - retry with increasing delay
        const delay = Math.min(2000 + (attempt * 500), 5000); // 2s to 5s
        console.log(`Payment pending, retrying in ${delay}ms...`);
        setVerificationMessage('Payment is being processed, please wait...');
        
        setTimeout(() => {
          verifyPayment(attempt + 1);
        }, delay);
        
      } else if (response.data.status === 'pending' && attempt >= 10) {
        // Max retries reached - start polling database (webhook will update)
        console.log('Switching to database polling...');
        setVerificationMessage('Finalizing payment verification...');
        startDatabasePolling(pendingOrderId, 1);
        
      } else if (response.data.status === 'failed') {
        // Payment failed
        setStatus('failed');
        setErrorMessage('Payment was not successful. Please try again.');
        toast.error('Payment failed');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
        
      } else {
        // Unknown status - poll database
        console.log('Unknown status, polling database...');
        startDatabasePolling(pendingOrderId, 1);
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      
      // On error, retry if attempts remaining
      if (attempt < 10) {
        const delay = Math.min(2000 + (attempt * 500), 5000);
        console.log('Error occurred, retrying...');
        setTimeout(() => {
          verifyPayment(attempt + 1);
        }, delay);
      } else {
        // After 10 attempts, poll database
        console.log('Max API retries reached, polling database...');
        const pendingSubmission = (await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })).data.submissions?.find((s: any) => 
          s.payment_status === 'pending' || s.paymentStatus === 'pending'
        );
        
        if (pendingSubmission) {
          const orderId = pendingSubmission.payment_id || pendingSubmission.paymentId;
          startDatabasePolling(orderId, 1);
        } else {
          setStatus('failed');
          setErrorMessage('Unable to verify payment. Please check your dashboard.');
          toast.error('Verification timeout');
          setTimeout(() => navigate('/dashboard'), 3000);
        }
      }
    }
  };

  const startDatabasePolling = async (orderId: string, attempt: number) => {
    if (attempt > 15) {
      // After 15 polls (30 seconds), give up
      toast('Payment is being processed. Check your dashboard in a few minutes.', {
        icon: '⏳',
        duration: 5000
      });
      setTimeout(() => navigate('/dashboard'), 3000);
      return;
    }

    try {
      setVerificationMessage(`Waiting for payment confirmation (${attempt}/15)...`);
      
      // Check database for updated status
      const userResponse = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const submission = userResponse.data.submissions?.find((s: any) => 
        (s.payment_id === orderId || s.paymentId === orderId)
      );
      
      if (submission && (submission.payment_status === 'paid' || submission.paymentStatus === 'paid')) {
        // Webhook updated the status!
        setStatus('success');
        await refreshUser();
        toast.success('Payment verified! Your idea is registered.');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else if (submission && (submission.payment_status === 'failed' || submission.paymentStatus === 'failed')) {
        // Payment failed
        setStatus('failed');
        setErrorMessage('Payment was not successful.');
        toast.error('Payment failed');
        setTimeout(() => navigate('/dashboard'), 3000);
      } else {
        // Still pending, poll again
        setTimeout(() => {
          startDatabasePolling(orderId, attempt + 1);
        }, 2000);
      }
    } catch (error) {
      console.error('Database polling error:', error);
      // Retry polling
      setTimeout(() => {
        startDatabasePolling(orderId, attempt + 1);
      }, 2000);
    }
  };

  useEffect(() => {
    // Wait 5 seconds before first verification attempt
    // This gives Cashfree time to process the payment
    const timer = setTimeout(() => {
      verifyPayment(1);
    }, 5000);
    
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
