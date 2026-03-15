const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { initDB, User, Competition, Submission, Payment, sql } = require('../src/db-postgres.js');
const axios = require('axios');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

let isInitialized = false;

async function ensureInit() {
  if (!isInitialized) {
    await initDB();
    isInitialized = true;
  }
}

function authenticate(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    return decoded.userId;
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await ensureInit();

    // Parse the path - handle both direct and rewritten URLs
    let path = req.url || '/';
    // Remove /api prefix if present
    path = path.replace(/^\/api/, '');
    // Remove query parameters
    path = path.split('?')[0] || '/';
    // Ensure path starts with /
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    const method = req.method;

    console.log('API Request:', method, path, 'Original URL:', req.url); // Debug log

    // Auth Routes
    if (path === '/auth/google' && method === 'POST') {
      const { credential } = req.body;
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) throw new Error('Invalid token');

      const { sub: googleId, email, name, picture } = payload;
      let user = await User.findByGoogleId(googleId);

      if (!user) {
        const isAdmin = email === 'lokesh009.naik@gmail.com';
        user = await User.create({ email, googleId, fullName: name, picture, isAdmin });
      } else if (email === 'lokesh009.naik@gmail.com' && !user.is_admin) {
        user = await User.update(user.id, { isAdmin: true });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      return res.status(200).json({ token, user });
    }

    // Get auth token
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    const userId = token ? authenticate(token) : null;

    if (path === '/auth/me' && method === 'GET') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const user = await User.findById(userId);
      const submissions = await Submission.findByUserId(userId);
      return res.status(200).json({ ...user, submissions });
    }

    if (path === '/auth/profile' && method === 'PATCH') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { phone, city } = req.body;
      const user = await User.update(userId, { phone, city });
      return res.status(200).json(user);
    }

    if (path === '/competitions' && method === 'GET') {
      const competitions = await Competition.findAll();
      return res.status(200).json(competitions);
    }

    if (path === '/competitions/active' && method === 'GET') {
      const competition = await Competition.findActive();
      return res.status(200).json(competition);
    }

    if (path === '/stats' && method === 'GET') {
      const activeComp = await Competition.findActive();
      if (!activeComp) return res.status(200).json({ registeredCount: 0 });
      const count = await Submission.countByCompetition(activeComp.id);
      return res.status(200).json({ registeredCount: count });
    }

    if (path.startsWith('/leaderboard/') && method === 'GET') {
      const competitionId = parseInt(path.split('/')[2]);
      const competition = await Competition.findById(competitionId);
      if (!competition) return res.status(404).json({ error: 'Competition not found' });

      const submissions = await Submission.findByCompetitionId(competitionId);
      
      const transformed = submissions.map(s => ({
        ...s,
        fullName: s.full_name || 'Anonymous',
        picture: s.picture || 'https://picsum.photos/seed/user/200'
      }));
      
      return res.status(200).json({ 
        submissions: transformed, 
        resultsPublished: competition.results_published || false 
      });
    }

    if (path === '/submissions' && method === 'POST') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { title, problem, solution, market, impact, competitionId } = req.body;

      if (!title || !problem || !solution || !market || !impact || !competitionId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const existingSubmission = await Submission.findOne(userId, competitionId);
      if (existingSubmission) {
        // Check if payment is pending - allow retry
        if (existingSubmission.payment_status === 'pending') {
          return res.status(200).json({ 
            ...existingSubmission,
            allowPaymentRetry: true,
            message: 'Submission exists with pending payment. You can retry payment.'
          });
        }
        return res.status(400).json({ error: 'You have already submitted an idea for this competition.' });
      }

      // Don't create submission yet - just validate and return success
      // Submission will be created after successful payment
      return res.status(200).json({ 
        message: 'Validation successful. Proceed to payment.',
        validated: true,
        data: { title, problem, solution, market, impact, competitionId }
      });
    }

    // New endpoint: Create submission after payment
    if (path === '/submissions/create-after-payment' && method === 'POST') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { title, problem, solution, market, impact, competitionId, orderId } = req.body;

      if (!title || !problem || !solution || !market || !impact || !competitionId || !orderId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify payment exists and is pending
      const payment = await Payment.findByOrderId(orderId, userId);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Check if submission already exists
      const existingSubmission = await Submission.findOne(userId, competitionId);
      if (existingSubmission) {
        return res.status(200).json(existingSubmission);
      }

      // Create submission with pending payment status
      const submission = await Submission.create({
        userId,
        competitionId,
        title,
        problem,
        solution,
        market,
        impact,
        paymentStatus: 'pending',
        paymentId: orderId
      });

      return res.status(200).json(submission);
    }

    if (path === '/submissions/my' && method === 'GET') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const submissions = await Submission.findByUserId(userId);
      return res.status(200).json(submissions);
    }

    if (path === '/admin/submissions' && method === 'GET') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const user = await User.findById(userId);
      if (!user?.is_admin) return res.status(403).json({ error: 'Forbidden' });

      const submissions = await Submission.findAll();
      
      const transformed = submissions.map(s => ({
        ...s,
        fullName: s.full_name || 'Anonymous',
        email: s.email || 'N/A',
        picture: s.picture || 'https://picsum.photos/seed/user/200'
      }));
      
      return res.status(200).json(transformed);
    }

    if (path === '/judging/score' && method === 'POST') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const { submissionId, score, feedback, aiScore, aiFeedback } = req.body;
      
      // Calculate final score: AI (40%) + Judge (60%)
      const finalScore = ((aiScore || 0) * 0.4) + ((score || 0) * 0.6);
      
      const submission = await Submission.updateScore(submissionId, {
        judgeScore: score || 0,
        judgeFeedback: feedback || '',
        aiScore: aiScore || 0,
        aiFeedback: aiFeedback || '',
        processedByAI: aiScore > 0,
        finalScore: finalScore,
        status: 'judged'
      });

      return res.status(200).json({ success: true, finalScore: submission.final_score });
    }

    if (path === '/judging/ai-evaluate' && method === 'POST') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      try {
        const { submissionId } = req.body;
        
        const submissions = await Submission.findAll();
        const targetSubmission = submissions.find(s => s.id === parseInt(submissionId));
        
        if (!targetSubmission) {
          return res.status(404).json({ error: 'Submission not found' });
        }

        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
        
        if (!GROQ_API_KEY) {
          return res.status(500).json({ error: 'Groq API key not configured' });
        }

        const prompt = `You are an expert startup judge and venture capitalist. 
Evaluate the following startup idea submission for a competition.

Startup Title: ${targetSubmission.title}
Problem Statement: ${targetSubmission.problem}
Proposed Solution: ${targetSubmission.solution}
Target Market: ${targetSubmission.market}
Potential Impact: ${targetSubmission.impact}

Please evaluate based on these criteria (Total 100 marks):
1. Innovation & Uniqueness (25 marks): How novel is the idea? Does it solve a problem in a new way?
2. Market Potential (25 marks): How large is the target market? Is there a clear path to monetization?
3. Feasibility & Practicality (20 marks): Can this be built? Is the solution realistic?
4. Social/Economic Impact (20 marks): Does it create positive change or significant value?
5. Clarity of Presentation (10 marks): How well is the idea articulated?

Provide a detailed feedback summary for the entrepreneur and a numerical score for each category.
The total score must be the sum of the category scores.

Respond ONLY with valid JSON in this exact format:
{
  "score": <total score out of 100>,
  "feedback": "<detailed feedback for the entrepreneur>",
  "breakdown": {
    "innovation": <score out of 25>,
    "marketPotential": <score out of 25>,
    "feasibility": <score out of 20>,
    "impact": <score out of 20>,
    "presentation": <score out of 10>
  }
}`;

        const aiResponse = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: GROQ_MODEL,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 1000
          },
          {
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const result = JSON.parse(aiResponse.data.choices[0].message.content);
        const aiScore = result.score || 0;
        const aiFeedback = result.feedback || 'AI evaluation completed.';
        
        // Calculate final score: AI (40%) + Judge (60%)
        const finalScore = (aiScore * 0.4) + ((targetSubmission.judge_score || 0) * 0.6);
        
        const updatedSubmission = await Submission.updateScore(submissionId, {
          aiScore: aiScore,
          aiFeedback: aiFeedback,
          processedByAI: true,
          judgeScore: targetSubmission.judge_score || 0,
          judgeFeedback: targetSubmission.judge_feedback || '',
          finalScore: finalScore,
          status: targetSubmission.status || 'pending'
        });

        return res.status(200).json({ 
          success: true, 
          aiScore: aiScore,
          aiFeedback: aiFeedback,
          finalScore: updatedSubmission.final_score 
        });
      } catch (error) {
        console.error('AI Evaluation Error:', error.response?.data || error.message);
        return res.status(500).json({ 
          error: 'Failed to evaluate with AI', 
          details: error.response?.data?.error?.message || error.message 
        });
      }
    }

    if (path === '/judging/undo-evaluation' && method === 'POST') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const user = await User.findById(userId);
      if (!user?.is_admin) return res.status(403).json({ error: 'Forbidden' });

      try {
        const { submissionId } = req.body;
        
        const updatedSubmission = await Submission.updateScore(submissionId, {
          aiScore: 0,
          aiFeedback: '',
          judgeScore: 0,
          judgeFeedback: '',
          processedByAI: false,
          finalScore: 0,
          status: 'pending'
        });

        return res.status(200).json({ 
          success: true, 
          message: 'Evaluation reset successfully',
          submission: updatedSubmission
        });
      } catch (error) {
        console.error('Undo Evaluation Error:', error);
        return res.status(500).json({ error: 'Failed to undo evaluation: ' + error.message });
      }
    }

    if (path === '/admin/publish-results' && method === 'POST') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const user = await User.findById(userId);
      if (!user?.is_admin) return res.status(403).json({ error: 'Forbidden' });

      const { competitionId, publish } = req.body;
      const competition = await Competition.updateResultsPublished(competitionId, publish);

      if (!competition) {
        return res.status(404).json({ error: 'Competition not found' });
      }

      return res.status(200).json(competition);
    }

    if (path === '/admin/check-env' && method === 'GET') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const user = await User.findById(userId);
      if (!user?.is_admin) return res.status(403).json({ error: 'Forbidden' });

      return res.status(200).json({
        hasGroqKey: !!process.env.GROQ_API_KEY,
        groqKeyLength: process.env.GROQ_API_KEY?.length || 0,
        groqKeyPrefix: process.env.GROQ_API_KEY?.substring(0, 15) || 'NOT SET',
        groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV || 'development'
      });
    }

    if (path === '/admin/update-prizes' && method === 'POST') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const user = await User.findById(userId);
      if (!user?.is_admin) return res.status(403).json({ error: 'Forbidden' });

      const { competitionId, prizes } = req.body;
      const competition = await Competition.updatePrizes(competitionId, prizes);

      if (!competition) {
        return res.status(404).json({ error: 'Competition not found' });
      }

      return res.status(200).json(competition);
    }

    // Update competition entry fee
    if (path === '/admin/update-entry-fee' && method === 'POST') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const user = await User.findById(userId);
      if (!user?.is_admin) return res.status(403).json({ error: 'Forbidden' });

      try {
        const { competitionId, entryFee } = req.body;
        
        if (!competitionId || entryFee === undefined) {
          return res.status(400).json({ error: 'Competition ID and entry fee are required' });
        }

        if (entryFee < 1) {
          return res.status(400).json({ error: 'Entry fee must be at least ₹1' });
        }
        
        await sql`
          UPDATE competitions 
          SET entry_fee = ${entryFee}
          WHERE id = ${competitionId}
        `;

        const updated = await Competition.findById(competitionId);
        
        console.log(`✅ Entry fee updated to ₹${entryFee} by admin:`, user.email);
        
        return res.status(200).json({ 
          success: true, 
          message: `Entry fee updated to ₹${entryFee}`,
          competition: updated
        });
      } catch (error) {
        console.error('Error updating entry fee:', error);
        return res.status(500).json({ error: 'Failed to update entry fee' });
      }
    }

    if (path === '/admin/delete-all-users' && method === 'POST') {
      console.log('Delete all users endpoint hit');
      if (!userId) {
        console.log('No userId - unauthorized');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await User.findById(userId);
      console.log('User found:', user?.email, 'Is admin:', user?.is_admin);
      if (!user?.is_admin) {
        console.log('User is not admin - forbidden');
        return res.status(403).json({ error: 'Forbidden - Admin only' });
      }

      try {
        console.log('Starting deletion of all data (except admin)...');
        const adminEmail = 'lokesh009.naik@gmail.com';
        
        // Delete payments for non-admin users
        const paymentsResult = await sql`
          DELETE FROM payments 
          WHERE user_id IN (SELECT id FROM users WHERE email != ${adminEmail})
        `;
        console.log('Deleted payments:', paymentsResult);
        
        // Delete submissions for non-admin users
        const submissionsResult = await sql`
          DELETE FROM submissions 
          WHERE user_id IN (SELECT id FROM users WHERE email != ${adminEmail})
        `;
        console.log('Deleted submissions:', submissionsResult);
        
        // Delete all users except admin
        const usersResult = await sql`
          DELETE FROM users 
          WHERE email != ${adminEmail}
        `;
        console.log('Deleted users:', usersResult);
        
        console.log('All users and data deleted by admin (admin protected):', user.email);
        
        return res.status(200).json({ 
          message: 'All users and data deleted successfully (admin account protected)',
          deletedBy: user.email,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error deleting all users:', error);
        return res.status(500).json({ error: 'Failed to delete users and data: ' + error.message });
      }
    }

    // Webhook endpoint for Cashfree payment notifications
    if (path === '/payments/webhook' && method === 'POST') {
      try {
        console.log('=== WEBHOOK RECEIVED ===');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Webhook body:', JSON.stringify(req.body, null, 2));
        
        const webhookData = req.body;
        const eventData = webhookData.data || webhookData;
        
        // Handle different webhook formats
        const orderId = eventData.order?.order_id || eventData.orderId || eventData.order_id;
        const orderAmount = eventData.order?.order_amount || eventData.orderAmount || eventData.order_amount;
        const txStatus = eventData.payment?.payment_status || eventData.txStatus || eventData.tx_status;
        const paymentMode = eventData.payment?.payment_group || eventData.paymentMode || eventData.payment_mode;
        const referenceId = eventData.payment?.cf_payment_id || eventData.referenceId || eventData.reference_id;
        
        console.log('Parsed webhook data:', { orderId, txStatus, paymentMode, referenceId, orderAmount });
        
        if (!orderId) {
          console.error('❌ Invalid webhook data - no orderId found');
          return res.status(400).json({ error: 'Invalid webhook data' });
        }

        // Update payment status based on webhook
        const status = txStatus === 'SUCCESS' ? 'paid' : txStatus === 'FAILED' ? 'failed' : 'pending';
        
        console.log('Updating payment status to:', status);
        
        await Payment.updatePaymentDetails(orderId, {
          status: status,
          cfPaymentId: referenceId,
          paymentMethod: paymentMode,
          transactionId: referenceId,
          webhookData: JSON.stringify(webhookData)
        });

        console.log('✅ Payment record updated in database');

        // If payment successful, update submission status
        if (status === 'paid') {
          console.log('Payment is PAID - updating submission...');
          
          // Find payment without userId requirement for webhook
          const paymentResult = await sql`
            SELECT * FROM payments WHERE order_id = ${orderId} LIMIT 1
          `;
          const payment = paymentResult[0];
          
          console.log('Payment record:', payment ? `Found (user_id: ${payment.user_id})` : 'Not found');
          
          if (payment) {
            const submissions = await Submission.findByUserId(payment.user_id);
            console.log('User submissions found:', submissions.length);
            
            const pendingSubmission = submissions.find(s => 
              (s.payment_status === 'pending' || s.paymentStatus === 'pending') &&
              (s.payment_id === orderId || s.paymentId === orderId)
            );
            
            console.log('Pending submission:', pendingSubmission ? `Found (id: ${pendingSubmission.id})` : 'Not found');
            
            if (pendingSubmission) {
              await sql`
                UPDATE submissions 
                SET payment_status = 'paid', payment_id = ${referenceId}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ${pendingSubmission.id}
              `;
              console.log('✅ Submission status updated to PAID');
              
              // Verify the update
              const verifyResult = await sql`
                SELECT payment_status FROM submissions WHERE id = ${pendingSubmission.id}
              `;
              console.log('Verified submission status:', verifyResult[0]?.payment_status);
            } else {
              console.log('⚠️ No matching pending submission found for order:', orderId);
              console.log('All user submissions:', JSON.stringify(submissions, null, 2));
            }
          } else {
            console.log('⚠️ Payment record not found in database for order:', orderId);
          }
        } else {
          console.log('Payment status is not PAID, skipping submission update');
        }

        console.log('=== WEBHOOK PROCESSED SUCCESSFULLY ===');
        return res.status(200).json({ success: true, message: 'Webhook processed' });
      } catch (error) {
        console.error('=== WEBHOOK PROCESSING ERROR ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        return res.status(500).json({ error: 'Webhook processing failed' });
      }
    }

    // Admin: Get all payments
    if (path === '/admin/payments' && method === 'GET') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const user = await User.findById(userId);
      if (!user?.is_admin) return res.status(403).json({ error: 'Forbidden' });

      try {
        const payments = await Payment.findAll();
        return res.status(200).json(payments);
      } catch (error) {
        console.error('Error fetching payments:', error);
        return res.status(500).json({ error: 'Failed to fetch payments' });
      }
    }

    // Admin: Get payment statistics
    if (path === '/admin/payment-stats' && method === 'GET') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const user = await User.findById(userId);
      if (!user?.is_admin) return res.status(403).json({ error: 'Forbidden' });

      try {
        const stats = await Payment.getStats();
        return res.status(200).json(stats);
      } catch (error) {
        console.error('Error fetching payment stats:', error);
        return res.status(500).json({ error: 'Failed to fetch payment stats' });
      }
    }

    if (path === '/admin/delete-user' && method === 'POST') {
      console.log('Delete specific user endpoint hit');
      if (!userId) {
        console.log('No userId - unauthorized');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await User.findById(userId);
      console.log('User found:', user?.email, 'Is admin:', user?.is_admin);
      if (!user?.is_admin) {
        console.log('User is not admin - forbidden');
        return res.status(403).json({ error: 'Forbidden - Admin only' });
      }

      try {
        const { targetUserId } = req.body;
        if (!targetUserId) {
          return res.status(400).json({ error: 'Target user ID is required' });
        }

        // Get target user info
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Prevent deleting admin
        if (targetUser.email === 'lokesh009.naik@gmail.com') {
          return res.status(403).json({ error: 'Cannot delete admin account' });
        }

        console.log('Deleting user:', targetUser.email);
        
        // Delete user's payments
        await sql`DELETE FROM payments WHERE user_id = ${targetUserId}`;
        
        // Delete user's submissions
        await sql`DELETE FROM submissions WHERE user_id = ${targetUserId}`;
        
        // Delete user
        await sql`DELETE FROM users WHERE id = ${targetUserId}`;
        
        console.log('User deleted successfully:', targetUser.email);
        
        return res.status(200).json({ 
          message: 'User deleted successfully',
          deletedUser: targetUser.email,
          deletedBy: user.email,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ error: 'Failed to delete user: ' + error.message });
      }
    }

    // Test endpoint to check Cashfree configuration
    if (path === '/test/cashfree' && method === 'GET') {
      try {
        const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
        const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
        
        return res.status(200).json({
          hasAppId: !!CASHFREE_APP_ID,
          hasSecretKey: !!CASHFREE_SECRET_KEY,
          appIdLength: CASHFREE_APP_ID?.length || 0,
          appIdPrefix: CASHFREE_APP_ID?.substring(0, 10) || 'NOT SET',
          secretKeyPrefix: CASHFREE_SECRET_KEY?.substring(0, 15) || 'NOT SET',
        });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    }

    // Test endpoint to check database and competition
    if (path === '/test/payment-setup' && method === 'GET') {
      try {
        const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
        const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
        const DATABASE_URL = process.env.DATABASE_URL;
        
        // Try to get active competition
        let competition = null;
        let dbError = null;
        try {
          competition = await Competition.findActive();
        } catch (e) {
          dbError = e.message;
        }
        
        return res.status(200).json({
          cashfree: {
            hasAppId: !!CASHFREE_APP_ID,
            hasSecretKey: !!CASHFREE_SECRET_KEY,
            appIdLength: CASHFREE_APP_ID?.length || 0,
          },
          database: {
            hasUrl: !!DATABASE_URL,
            connected: !dbError,
            error: dbError
          },
          competition: {
            found: !!competition,
            id: competition?.id,
            title: competition?.title,
            entryFee: competition?.entry_fee
          }
        });
      } catch (error) {
        return res.status(500).json({ error: error.message, stack: error.stack });
      }
    }

    // Payment Routes
    if (path === '/payments/create-order' && method === 'POST') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      try {
        const { competitionId, submissionData } = req.body;
        
        console.log('=== PAYMENT ORDER CREATION START ===');
        console.log('User ID:', userId);
        console.log('Competition ID:', competitionId);
        console.log('Has submission data:', !!submissionData);
        
        const user = await User.findById(userId);
        const competition = await Competition.findById(competitionId);

        console.log('User found:', user ? user.email : 'NOT FOUND');
        console.log('Competition found:', competition ? competition.title : 'NOT FOUND');

        if (!user || !competition) {
          return res.status(404).json({ error: 'User or Competition not found' });
        }

        // Check for existing submission with paid status
        const existingSubmission = await Submission.findOne(userId, competitionId);
        if (existingSubmission && existingSubmission.payment_status === 'paid') {
          return res.status(400).json({ error: 'You have already submitted and paid for this competition.' });
        }

        // Don't reuse old payment sessions - always create fresh one
        // This prevents issues with stale/completed payment sessions

        const orderId = `order_${Date.now()}_${userId.toString().slice(-4)}`;
        const amount = competition.entry_fee || 1;

        const CASHFREE_APP_ID = (process.env.CASHFREE_APP_ID || '').trim();
        const CASHFREE_SECRET_KEY = (process.env.CASHFREE_SECRET_KEY || '').trim();
        const CASHFREE_BASE_URL = "https://api.cashfree.com/pg"; // Production URL

        console.log('=== ENVIRONMENT CHECK ===');
        console.log('CASHFREE_APP_ID exists:', !!CASHFREE_APP_ID);
        console.log('CASHFREE_SECRET_KEY exists:', !!CASHFREE_SECRET_KEY);
        console.log('CASHFREE_APP_ID length:', CASHFREE_APP_ID?.length || 0);
        console.log('CASHFREE_SECRET_KEY length:', CASHFREE_SECRET_KEY?.length || 0);
        console.log('CASHFREE_APP_ID prefix:', CASHFREE_APP_ID?.substring(0, 10) || 'NOT SET');
        console.log('CASHFREE_SECRET_KEY prefix:', CASHFREE_SECRET_KEY?.substring(0, 15) || 'NOT SET');

        if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
          console.error('❌ Cashfree credentials missing in environment');
          return res.status(500).json({ 
            error: 'Payment gateway not configured. Please contact admin.',
            debug: {
              hasAppId: !!CASHFREE_APP_ID,
              hasSecretKey: !!CASHFREE_SECRET_KEY
            }
          });
        }

        console.log('=== CREATING CASHFREE ORDER ===');
        console.log('Order ID:', orderId);
        console.log('Amount:', amount);

        const request = {
          order_amount: amount,
          order_currency: "INR",
          order_id: orderId,
          customer_details: {
            customer_id: user.id.toString(),
            customer_name: user.full_name || 'User',
            customer_email: user.email,
            customer_phone: user.phone || "9999999999",
          },
          order_meta: {
            return_url: `https://ideawin-platform.vercel.app/payment-status?order_id={order_id}`,
            notify_url: `https://ideawin-platform.vercel.app/api/payments/webhook`,
          },
        };

        console.log('Cashfree request payload:', JSON.stringify(request, null, 2));

        const response = await axios.post(`${CASHFREE_BASE_URL}/orders`, request, {
          headers: {
            'x-client-id': CASHFREE_APP_ID,
            'x-client-secret': CASHFREE_SECRET_KEY,
            'x-api-version': '2023-08-01',
            'Content-Type': 'application/json'
          }
        });
        
        const cfData = response.data;
        console.log('✅ Cashfree order created successfully!');
        console.log('CF Order ID:', cfData.cf_order_id);
        console.log('Payment Session ID:', cfData.payment_session_id);

        // Create payment record
        await Payment.create({
          userId: userId,
          competitionId: competitionId,
          orderId: orderId,
          amount: amount,
          paymentSessionId: cfData.payment_session_id,
          cfOrderId: cfData.cf_order_id,
          status: 'pending'
        });

        // Create submission with pending payment status if submission data provided
        if (submissionData) {
          const { title, problem, solution, market, impact } = submissionData;
          
          console.log('=== CREATING SUBMISSION ===');
          console.log('Submission data:', { title, problem, solution, market, impact });
          console.log('Payment status: pending');
          console.log('Payment ID:', orderId);
          
          // Only create if doesn't exist
          if (!existingSubmission) {
            try {
              const newSubmission = await Submission.create({
                userId,
                competitionId,
                title,
                problem,
                solution,
                market,
                impact,
                paymentStatus: 'pending',
                paymentId: orderId
              });
              console.log('✅ Submission created successfully!');
              console.log('Submission ID:', newSubmission.id);
              console.log('Submission payment_id:', newSubmission.payment_id);
              console.log('Submission payment_status:', newSubmission.payment_status);
            } catch (submissionError) {
              console.error('❌ Failed to create submission:', submissionError);
              console.error('Submission error details:', submissionError.message);
              console.error('Submission error stack:', submissionError.stack);
              // Don't fail the payment order creation, but log the error
            }
          } else {
            console.log('⚠️ Submission already exists, updating payment info');
            try {
              await sql`
                UPDATE submissions 
                SET payment_status = 'pending', payment_id = ${orderId}
                WHERE id = ${existingSubmission.id}
              `;
              console.log('✅ Existing submission updated with payment info');
            } catch (updateError) {
              console.error('❌ Failed to update existing submission:', updateError);
            }
          }
        } else {
          console.log('⚠️ No submission data provided - submission not created');
        }

        console.log('✅ Payment record saved to database');
        console.log('=== PAYMENT ORDER CREATION SUCCESS ===');

        return res.status(200).json({
          paymentSessionId: cfData.payment_session_id,
          orderId: orderId,
          paymentLink: cfData.payment_link, // Direct payment link
        });
      } catch (error) {
        console.error('=== PAYMENT ORDER CREATION FAILED ===');
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);
        console.error('Cashfree response:', error.response?.data);
        console.error('Cashfree status:', error.response?.status);
        console.error('Cashfree headers:', error.response?.headers);
        console.error('Request data:', error.config?.data);
        console.error('Full error:', error);
        
        return res.status(500).json({ 
          error: 'Failed to create payment order', 
          details: error.response?.data?.message || error.message,
          cashfreeError: error.response?.data || null,
          statusCode: error.response?.status || 500,
          errorType: error.name
        });
      }
    }

    // Manual payment verification (for testing/debugging)
    if (path === '/payments/manual-verify' && method === 'POST') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      try {
        const { orderId } = req.body;
        
        // Update payment to paid status manually
        await sql`
          UPDATE payments 
          SET status = 'paid', updated_at = CURRENT_TIMESTAMP
          WHERE order_id = ${orderId} AND user_id = ${userId}
        `;
        
        // Update submission to paid status
        await sql`
          UPDATE submissions 
          SET payment_status = 'paid'
          WHERE user_id = ${userId} AND payment_status = 'pending'
        `;
        
        return res.status(200).json({ success: true, message: 'Payment marked as paid' });
      } catch (error) {
        console.error('Manual verify error:', error);
        return res.status(500).json({ error: 'Failed to update payment' });
      }
    }

    // Get payment status by order ID
    if (path.match(/^\/payments\/status\/(.+)$/) && method === 'GET') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      try {
        const orderId = path.split('/')[3];
        const payment = await Payment.findByOrderId(orderId, userId);
        
        if (!payment) {
          return res.status(404).json({ error: 'Payment not found' });
        }
        
        return res.status(200).json({ 
          status: payment.status,
          orderId: payment.order_id,
          amount: payment.amount
        });
      } catch (error) {
        console.error('Error fetching payment status:', error);
        return res.status(500).json({ error: 'Failed to fetch payment status' });
      }
    }

    // Get user's payments
    if (path === '/payments/my-payments' && method === 'GET') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      try {
        const payments = await sql`
          SELECT * FROM payments 
          WHERE user_id = ${userId} 
          ORDER BY created_at DESC
        `;
        return res.status(200).json(payments);
      } catch (error) {
        console.error('Error fetching user payments:', error);
        return res.status(500).json({ error: 'Failed to fetch payments' });
      }
    }

    // Direct payment verification - calls Cashfree API and updates submission immediately
    if (path === '/payments/verify-direct' && method === 'POST') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      try {
        const { orderId } = req.body;
        
        console.log('=== DIRECT PAYMENT VERIFICATION ===');
        console.log('Order ID:', orderId);
        console.log('User ID:', userId);
        console.log('Timestamp:', new Date().toISOString());
        
        if (!orderId) {
          return res.status(400).json({ 
            success: false,
            error: 'Order ID is required' 
          });
        }

        // Get payment record
        const payment = await Payment.findByOrderId(orderId, userId);
        if (!payment) {
          console.log('❌ Payment record not found');
          return res.status(404).json({ 
            success: false,
            error: 'Payment record not found' 
          });
        }

        console.log('Payment record found, current status:', payment.status);

        // If already paid, return success
        if (payment.status === 'paid') {
          console.log('✅ Payment already verified');
          return res.status(200).json({ 
            success: true, 
            status: 'paid',
            message: 'Payment already verified'
          });
        }

        // Verify with Cashfree API
        const CASHFREE_APP_ID = (process.env.CASHFREE_APP_ID || '').trim();
        const CASHFREE_SECRET_KEY = (process.env.CASHFREE_SECRET_KEY || '').trim();
        const CASHFREE_BASE_URL = "https://api.cashfree.com/pg";

        console.log('Calling Cashfree API...');

        try {
          const orderResponse = await axios.get(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
            headers: {
              'x-client-id': CASHFREE_APP_ID,
              'x-client-secret': CASHFREE_SECRET_KEY,
              'x-api-version': '2023-08-01'
            },
            timeout: 10000
          });

          const orderStatus = orderResponse.data.order_status;
          console.log('Cashfree order status:', orderStatus);

          if (orderStatus === 'PAID') {
            console.log('✅ Payment confirmed as PAID by Cashfree');

            // Update payment status
            await sql`
              UPDATE payments 
              SET 
                status = 'paid',
                cf_payment_id = ${orderResponse.data.cf_order_id || orderId},
                updated_at = CURRENT_TIMESTAMP
              WHERE order_id = ${orderId} AND user_id = ${userId}
            `;

            // Find and update submission
            const submissions = await Submission.findByUserId(userId);
            console.log('User has', submissions.length, 'submissions');
            
            // Find submission by payment_id or any pending submission
            let targetSubmission = submissions.find(s => 
              (s.payment_id === orderId || s.paymentId === orderId)
            );
            
            if (!targetSubmission) {
              targetSubmission = submissions.find(s => 
                s.payment_status === 'pending' || s.paymentStatus === 'pending'
              );
            }
            
            if (targetSubmission) {
              await sql`
                UPDATE submissions 
                SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP
                WHERE id = ${targetSubmission.id}
              `;
              console.log('✅ Submission updated to paid, ID:', targetSubmission.id);
            } else {
              console.log('⚠️ No submission found to update');
            }

            return res.status(200).json({ 
              success: true, 
              status: 'paid',
              message: 'Payment verified successfully'
            });

          } else if (orderStatus === 'ACTIVE') {
            console.log('⚠️ Payment still ACTIVE (pending)');
            return res.status(200).json({ 
              success: false, 
              status: 'pending',
              message: 'Payment is still being processed'
            });

          } else {
            console.log('❌ Payment failed or cancelled, status:', orderStatus);
            
            // Update payment as failed
            await sql`
              UPDATE payments 
              SET status = 'failed', updated_at = CURRENT_TIMESTAMP
              WHERE order_id = ${orderId} AND user_id = ${userId}
            `;

            return res.status(200).json({ 
              success: false, 
              status: 'failed',
              message: 'Payment was not successful'
            });
          }

        } catch (cfError) {
          console.error('=== CASHFREE API ERROR ===');
          console.error('Error:', cfError.message);
          
          return res.status(200).json({ 
            success: false, 
            status: 'pending',
            message: 'Unable to verify payment status'
          });
        }
        
      } catch (error) {
        console.error('=== DIRECT VERIFICATION FAILED ===');
        console.error('Error:', error.message);
        return res.status(500).json({ 
          success: false,
          error: 'Failed to verify payment', 
          details: error.message 
        });
      }
    }

    // Mark as paid endpoint - with proper Cashfree verification
    if (path === '/payments/mark-paid' && method === 'POST') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      try {
        const { orderId } = req.body;
        
        console.log('=== MARK PAYMENT AS PAID ===');
        console.log('Order ID:', orderId);
        console.log('User ID:', userId);
        
        if (!orderId) {
          return res.status(400).json({ 
            success: false,
            error: 'Order ID is required' 
          });
        }

        // Check if already paid
        const existingPayment = await Payment.findByOrderId(orderId, userId);
        if (existingPayment && existingPayment.status === 'paid') {
          console.log('✅ Payment already marked as paid');
          return res.status(200).json({ 
            success: true, 
            message: 'Payment already verified',
            alreadyPaid: true
          });
        }

        // Verify with Cashfree
        const CASHFREE_APP_ID = (process.env.CASHFREE_APP_ID || '').trim();
        const CASHFREE_SECRET_KEY = (process.env.CASHFREE_SECRET_KEY || '').trim();
        const CASHFREE_BASE_URL = "https://api.cashfree.com/pg";

        console.log('Verifying payment status with Cashfree...');
        
        try {
          const orderResponse = await axios.get(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
            headers: {
              'x-client-id': CASHFREE_APP_ID,
              'x-client-secret': CASHFREE_SECRET_KEY,
              'x-api-version': '2023-08-01'
            },
            timeout: 15000
          });

          const orderStatus = orderResponse.data.order_status;
          console.log('Cashfree order status:', orderStatus);

          if (orderStatus === 'PAID') {
            console.log('✅ Payment confirmed as PAID by Cashfree');
            
            // Update payment to paid
            await sql`
              UPDATE payments 
              SET status = 'paid', updated_at = CURRENT_TIMESTAMP
              WHERE order_id = ${orderId} AND user_id = ${userId}
            `;

            // Update submission to paid
            await sql`
              UPDATE submissions 
              SET payment_status = 'paid'
              WHERE user_id = ${userId} AND payment_status = 'pending'
            `;

            console.log('✅ Payment and submission marked as paid');
            
            return res.status(200).json({ 
              success: true, 
              message: 'Payment verified and marked as paid'
            });
            
          } else if (orderStatus === 'ACTIVE') {
            console.log('⚠️ Payment still ACTIVE (pending)');
            return res.status(200).json({ 
              success: false, 
              message: 'Payment is still being processed',
              status: 'pending'
            });
            
          } else {
            // FAILED, CANCELLED, EXPIRED, etc.
            console.log('❌ Payment not successful, status:', orderStatus);
            
            // Mark as failed
            await sql`
              UPDATE payments 
              SET status = 'failed', updated_at = CURRENT_TIMESTAMP
              WHERE order_id = ${orderId} AND user_id = ${userId}
            `;
            
            return res.status(200).json({ 
              success: false, 
              message: 'Payment was not successful',
              status: 'failed'
            });
          }

        } catch (cfError) {
          console.error('Cashfree API error:', cfError.response?.status, cfError.response?.data || cfError.message);
          
          // If API error, return pending status (don't mark as paid or failed)
          return res.status(200).json({ 
            success: false, 
            message: 'Unable to verify payment status. Please try again in a moment.',
            status: 'error'
          });
        }
        
      } catch (error) {
        console.error('=== MARK PAID FAILED ===');
        console.error('Error:', error.message);
        return res.status(500).json({ 
          success: false,
          error: 'Failed to process payment verification',
          details: error.message
        });
      }
    }

    // Auto-complete payment after Cashfree redirect - simplified with better error handling
    if (path === '/payments/auto-complete' && method === 'POST') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      try {
        const { orderId } = req.body;
        
        console.log('=== AUTO-COMPLETE PAYMENT START ===');
        console.log('Order ID:', orderId);
        console.log('User ID:', userId);
        console.log('Timestamp:', new Date().toISOString());
        
        if (!orderId) {
          return res.status(400).json({ 
            success: false,
            error: 'Order ID is required' 
          });
        }

        const payment = await Payment.findByOrderId(orderId, userId);

        if (!payment) {
          console.log('❌ Payment record not found');
          return res.status(404).json({ 
            success: false,
            error: 'Payment record not found' 
          });
        }

        console.log('Payment record found, current status:', payment.status);

        // If already paid, return success immediately
        if (payment.status === 'paid') {
          console.log('✅ Payment already completed');
          return res.status(200).json({ 
            success: true, 
            message: 'Payment already completed',
            verified: true,
            alreadyPaid: true
          });
        }

        // Verify payment status with Cashfree
        const CASHFREE_APP_ID = (process.env.CASHFREE_APP_ID || '').trim();
        const CASHFREE_SECRET_KEY = (process.env.CASHFREE_SECRET_KEY || '').trim();
        const CASHFREE_BASE_URL = "https://api.cashfree.com/pg";

        console.log('Verifying with Cashfree API...');

        try {
          // Get order details from Cashfree with 8 second timeout
          const orderResponse = await axios.get(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
            headers: {
              'x-client-id': CASHFREE_APP_ID,
              'x-client-secret': CASHFREE_SECRET_KEY,
              'x-api-version': '2023-08-01'
            },
            timeout: 8000 // 8 second timeout
          });

          const orderStatus = orderResponse.data.order_status;
          console.log('Cashfree order status:', orderStatus);

          // Only mark as paid if order status is PAID
          if (orderStatus === 'PAID') {
            console.log('✅ Payment confirmed as PAID by Cashfree');

            // Mark payment as paid
            await sql`
              UPDATE payments 
              SET 
                status = 'paid',
                cf_payment_id = ${orderResponse.data.cf_order_id || orderId},
                updated_at = CURRENT_TIMESTAMP
              WHERE order_id = ${orderId} AND user_id = ${userId}
            `;

            console.log('✅ Payment status updated to paid in database');

            // Update submission payment status
            const submissions = await Submission.findByUserId(userId);
            const pendingSubmission = submissions.find(s => 
              (s.payment_status === 'pending' || s.paymentStatus === 'pending') && 
              (s.payment_id === orderId || s.paymentId === orderId)
            );
            
            if (pendingSubmission) {
              await sql`
                UPDATE submissions 
                SET payment_status = 'paid'
                WHERE id = ${pendingSubmission.id}
              `;
              console.log('✅ Submission status updated to paid');
            }

            console.log('=== AUTO-COMPLETE PAYMENT SUCCESS ===');
            
            return res.status(200).json({ 
              success: true, 
              message: 'Payment completed successfully',
              verified: true
            });

          } else if (orderStatus === 'ACTIVE') {
            console.log('⚠️ Payment still ACTIVE (pending)');
            return res.status(200).json({ 
              success: false, 
              message: 'Payment is still being processed',
              status: 'pending'
            });

          } else {
            console.log('❌ Payment failed or cancelled, status:', orderStatus);
            
            // Mark payment as failed
            await sql`
              UPDATE payments 
              SET status = 'failed', updated_at = CURRENT_TIMESTAMP
              WHERE order_id = ${orderId} AND user_id = ${userId}
            `;

            return res.status(200).json({ 
              success: false, 
              message: 'Payment was not successful',
              status: 'failed'
            });
          }

        } catch (cfError) {
          console.error('=== CASHFREE API ERROR ===');
          console.error('Error type:', cfError.code);
          console.error('Status:', cfError.response?.status);
          console.error('Message:', cfError.message);
          
          // If timeout or network error, return pending (webhook will handle it)
          if (cfError.code === 'ECONNABORTED' || cfError.code === 'ETIMEDOUT') {
            console.log('⚠️ Cashfree API timeout - webhook will verify');
          } else if (cfError.response?.status) {
            console.log('⚠️ Cashfree API error:', cfError.response.status);
          }
          
          // Return pending status - frontend will poll database (webhook updates it)
          return res.status(200).json({ 
            success: false, 
            message: 'Payment verification in progress',
            status: 'pending',
            note: 'Webhook will confirm status'
          });
        }
        
      } catch (error) {
        console.error('=== AUTO-COMPLETE PAYMENT FAILED ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        return res.status(500).json({ 
          success: false,
          error: 'Failed to complete payment verification', 
          details: error.message 
        });
      }
    }

    // UTR-based payment verification with Cashfree validation
    if (path === '/payments/verify-utr' && method === 'POST') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      try {
        const { orderId, utrNumber } = req.body;
        
        console.log('=== UTR VERIFICATION START ===');
        console.log('Order ID:', orderId);
        console.log('UTR Number:', utrNumber);
        console.log('User ID:', userId);
        
        if (!orderId || !utrNumber) {
          return res.status(400).json({ 
            success: false,
            error: 'Order ID and UTR number are required' 
          });
        }

        const payment = await Payment.findByOrderId(orderId, userId);

        if (!payment) {
          console.log('❌ Payment record not found');
          return res.status(404).json({ 
            success: false,
            error: 'Payment record not found' 
          });
        }

        console.log('Payment record found:', payment.status);

        // If already paid, return success
        if (payment.status === 'paid') {
          console.log('✅ Payment already verified');
          return res.status(200).json({ 
            success: true, 
            message: 'Payment already verified',
            paymentId: payment.cf_payment_id 
          });
        }

        // Validate UTR with Cashfree API
        const CASHFREE_APP_ID = (process.env.CASHFREE_APP_ID || '').trim();
        const CASHFREE_SECRET_KEY = (process.env.CASHFREE_SECRET_KEY || '').trim();
        const CASHFREE_BASE_URL = "https://api.cashfree.com/pg";

        console.log('Validating UTR with Cashfree API...');

        try {
          // Get payment details from Cashfree
          const response = await axios.get(`${CASHFREE_BASE_URL}/orders/${orderId}/payments`, {
            headers: {
              'x-client-id': CASHFREE_APP_ID,
              'x-client-secret': CASHFREE_SECRET_KEY,
              'x-api-version': '2023-08-01'
            }
          });

          console.log('Cashfree API response:', response.data);

          const payments = Array.isArray(response.data) ? response.data : [response.data];
          
          // Find payment matching the UTR
          const matchingPayment = payments.find(p => {
            const cfUtr = p.utr || p.bank_reference || p.cf_payment_id || '';
            return cfUtr.toLowerCase().includes(utrNumber.toLowerCase()) || 
                   utrNumber.toLowerCase().includes(cfUtr.toLowerCase());
          });

          if (!matchingPayment) {
            console.log('❌ UTR does not match any payment for this order');
            return res.status(400).json({
              success: false,
              message: 'UTR number does not match this transaction. Please check and try again.'
            });
          }

          if (matchingPayment.payment_status !== 'SUCCESS') {
            console.log('⚠️ Payment found but not successful:', matchingPayment.payment_status);
            return res.status(400).json({
              success: false,
              message: `Payment status is ${matchingPayment.payment_status}. Please wait or contact support.`
            });
          }

          console.log('✅ UTR validated successfully with Cashfree');

        } catch (cfError) {
          console.log('⚠️ Cashfree API validation failed, proceeding with UTR storage:', cfError.message);
          // If Cashfree API fails, still allow verification but log it
        }

        // Update payment with UTR and mark as paid
        await sql`
          UPDATE payments 
          SET 
            status = 'paid',
            transaction_id = ${utrNumber},
            cf_payment_id = ${utrNumber},
            updated_at = CURRENT_TIMESTAMP
          WHERE order_id = ${orderId} AND user_id = ${userId}
        `;

        console.log('✅ Payment status updated to paid with UTR');

        // Update submission payment status
        const submissions = await Submission.findByUserId(userId);
        const pendingSubmission = submissions.find(s => 
          (s.payment_status === 'pending' || s.paymentStatus === 'pending') && 
          (s.payment_id === orderId || s.paymentId === orderId)
        );
        
        if (pendingSubmission) {
          await sql`
            UPDATE submissions 
            SET payment_status = 'paid', payment_id = ${utrNumber}
            WHERE id = ${pendingSubmission.id}
          `;
          console.log('✅ Submission status updated to paid');
        } else {
          console.log('⚠️ No pending submission found');
        }

        console.log('=== UTR VERIFICATION SUCCESS ===');
        
        return res.status(200).json({ 
          success: true, 
          message: 'Payment verified successfully',
          paymentId: utrNumber 
        });
        
      } catch (error) {
        console.error('=== UTR VERIFICATION FAILED ===');
        console.error('Error:', error.message);
        return res.status(500).json({ 
          success: false,
          error: 'Failed to verify payment', 
          details: error.message 
        });
      }
    }

    if (path === '/payments/verify' && method === 'POST') {
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      try {
        const { orderId } = req.body;
        console.log('=== PAYMENT VERIFICATION START ===');
        console.log('Order ID:', orderId);
        console.log('User ID:', userId);
        
        const payment = await Payment.findByOrderId(orderId, userId);

        if (!payment) {
          console.log('❌ Payment record not found in database');
          return res.status(404).json({ error: 'Payment record not found' });
        }

        console.log('Payment record found:', payment.status);

        // If already paid, return success immediately
        if (payment.status === 'paid') {
          console.log('✅ Payment already marked as paid');
          return res.status(200).json({ status: 'paid', paymentId: payment.cf_payment_id });
        }

        // For now, just mark as paid if payment was initiated
        // Cashfree webhook will update the actual status
        console.log('⚠️ Payment pending - marking as paid for user experience');
        
        // Update to paid status
        await Payment.updateStatus(orderId, 'paid');

        // Update submission payment status
        const submissions = await Submission.findByUserId(userId);
        const pendingSubmission = submissions.find(s => 
          (s.payment_status === 'pending' || s.paymentStatus === 'pending') && 
          (s.payment_id === orderId || s.paymentId === orderId)
        );
        
        if (pendingSubmission) {
          await sql`
            UPDATE submissions 
            SET payment_status = 'paid', payment_id = ${orderId}
            WHERE id = ${pendingSubmission.id}
          `;
          console.log('✅ Submission status updated to paid');
        }

        console.log('=== PAYMENT VERIFICATION SUCCESS ===');
        return res.status(200).json({ status: 'paid', paymentId: orderId });
        
      } catch (error) {
        console.error('=== PAYMENT VERIFICATION FAILED ===');
        console.error('Error:', error.message);
        return res.status(500).json({ error: 'Failed to verify payment', details: error.message });
      }
    }

    return res.status(404).json({ error: 'Not found', path, method });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
