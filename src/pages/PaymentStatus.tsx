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
      console.log('=== DIRECT CASHFREE VERIFICATION ===');
      console.log('Attempt:', attempt);
      
      // Get order ID from URL params
      const urlParams = new URLSearchParams(window.location.search);
      let orderId = urlParams.get('order_id');
      
      console.log('Order ID from URL:', orderId);
      
      // If no order_id in URL, try to get it from user's pending payment
      if (!orderId) {
        console.log('No order_id in URL, fetching from user data...');
        try {
          const userResponse = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Find the most recent payment record
          const paymentsResponse = await api.get('/payments/my-payments', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const pendingPayment = paymentsResponse.data.find((p: any) => p.status === 'pending');
          
          if (pendingPayment) {
            orderId = pendingPayment.order_id;
            console.log('Found pending payment order_id:', orderId);
          } else {
            console.error('No pending payment found');
            toast.error('No pending payment found');
            setTimeout(() => navigate('/dashboard'), 2000);
            return;
          }
        } catch (fetchError) {
          console.error('Failed to fetch user payment data:', fetchError);
          toast.error('Unable to verify payment');
          setTimeout(() => navigate('/dashboard'), 2000);
          return;
        }
      }
      
      // Call backend to verify with Cashfree directly
      setVerificationMessage('Verifying payment with Cashfree...');
      
      const response = await api.post('/payments/verify-direct', 
        { orderId },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000
        }
      );
      
      console.log('Verification response:', response.data);
      
      if (response.data.success && response.data.status === 'paid') {
        // Payment verified and updated
        console.log('✅ Payment verified successfully!');
        setStatus('success');
        await refreshUser();
        toast.success('Payment verified! Your idea is registered.');
        setTimeout(() => navigate('/dashboard'), 2000);
        return;
      } else if (response.data.status === 'pending' && attempt < 15) {
        // Still processing, retry
        console.log('Payment still processing, retrying...');
        setVerificationMessage(`Payment processing (${attempt}/15)...`);
        setTimeout(() => verifyPayment(attempt + 1), 3000);
        return;
      } else if (response.data.status === 'failed') {
        // Payment failed
        console.log('❌ Payment failed');
        setStatus('failed');
        setErrorMessage('Payment was not successful.');
        toast.error('Payment failed');
        setTimeout(() => navigate('/dashboard'), 3000);
        return;
      } else {
        // Timeout or unknown status
        console.log('⏱️ Verification timeout');
        toast('Payment is being processed. Check your dashboard in a few minutes.', {
          icon: '⏳',
          duration: 5000
        });
        setTimeout(() => navigate('/dashboard'), 3000);
        return;
      }
      
    } catch (error: any) {
      console.error('❌ Verification error:', error);
      
      if (attempt < 5) {
        console.log('Retrying verification...');
        setTimeout(() => verifyPayment(attempt + 1), 3000);
      } else {
        setStatus('failed');
        setErrorMessage('Unable to verify payment. Please check your dashboard.');
        toast.error('Verification error');
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    }
  };

  const startDatabasePolling = async (orderId: string, attempt: number) => {
    // This function is no longer used with direct verification
    // Kept for backwards compatibility
    console.log('Database polling called but not used with direct verification');
  };

  useEffect(() => {
    // Start verification immediately
    verifyPayment(1);
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
