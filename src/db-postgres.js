const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables');
}

const sql = neon(DATABASE_URL);

// Initialize database tables
async function initDB() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        picture TEXT,
        phone VARCHAR(50),
        city VARCHAR(100),
        verified BOOLEAN DEFAULT true,
        is_judge BOOLEAN DEFAULT false,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create competitions table
    await sql`
      CREATE TABLE IF NOT EXISTS competitions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        entry_fee INTEGER DEFAULT 1,
        prize_pool INTEGER,
        prizes_json TEXT,
        judging_criteria_json TEXT,
        results_published BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create submissions table
    await sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        competition_id INTEGER REFERENCES competitions(id),
        title VARCHAR(255) NOT NULL,
        problem TEXT,
        solution TEXT,
        market TEXT,
        impact TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_id VARCHAR(255),
        final_score DECIMAL(5,2) DEFAULT 0,
        rank INTEGER,
        ai_score DECIMAL(5,2) DEFAULT 0,
        ai_feedback TEXT,
        processed_by_ai BOOLEAN DEFAULT false,
        judge_score DECIMAL(5,2) DEFAULT 0,
        judge_feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create payments table
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        competition_id INTEGER REFERENCES competitions(id),
        order_id VARCHAR(255) UNIQUE NOT NULL,
        amount DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pending',
        payment_session_id VARCHAR(255),
        cf_order_id VARCHAR(255),
        cf_payment_id VARCHAR(255),
        payment_method VARCHAR(100),
        transaction_id VARCHAR(255),
        webhook_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Database tables initialized successfully');

    // Seed initial competition if none exists
    const competitions = await sql`SELECT COUNT(*) as count FROM competitions`;
    if (competitions[0].count === '0') {
      await sql`
        INSERT INTO competitions (
          title, description, status, start_date, end_date, 
          prize_pool, prizes_json, judging_criteria_json
        ) VALUES (
          'Startup Idea Competition #1',
          'The ultimate challenge for early-stage innovators.',
          'active',
          '2026-03-01',
          '2026-03-31',
          100000,
          '{"first": 50000, "second": 30000, "third": 20000}',
          '{"innovation": 25, "marketPotential": 25, "feasibility": 20, "impact": 20, "presentation": 10}'
        )
      `;
      console.log('Seeded initial competition');
    }

    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// User operations
const User = {
  async findByGoogleId(googleId) {
    const result = await sql`SELECT * FROM users WHERE google_id = ${googleId}`;
    return result[0] || null;
  },

  async findById(id) {
    const result = await sql`SELECT * FROM users WHERE id = ${id}`;
    return result[0] || null;
  },

  async create(data) {
    const result = await sql`
      INSERT INTO users (email, google_id, full_name, picture, is_admin)
      VALUES (${data.email}, ${data.googleId}, ${data.fullName}, ${data.picture}, ${data.isAdmin || false})
      RETURNING *
    `;
    return result[0];
  },

  async update(id, data) {
    const result = await sql`
      UPDATE users 
      SET phone = ${data.phone || null}, 
          city = ${data.city || null},
          is_admin = ${data.isAdmin !== undefined ? data.isAdmin : false}
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0];
  }
};

// Competition operations
const Competition = {
  async findAll() {
    return await sql`SELECT * FROM competitions ORDER BY created_at DESC`;
  },

  async findActive() {
    const result = await sql`SELECT * FROM competitions WHERE status = 'active' LIMIT 1`;
    return result[0] || null;
  },

  async findById(id) {
    const result = await sql`SELECT * FROM competitions WHERE id = ${id}`;
    return result[0] || null;
  },

  async updateResultsPublished(id, published) {
    const result = await sql`
      UPDATE competitions 
      SET results_published = ${published}
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0];
  },

  async updatePrizes(id, prizes) {
    const prizesJson = JSON.stringify(prizes);
    const result = await sql`
      UPDATE competitions 
      SET prizes_json = ${prizesJson}
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0];
  }
};

// Submission operations
const Submission = {
  async findByUserId(userId) {
    return await sql`SELECT * FROM submissions WHERE user_id = ${userId} ORDER BY created_at DESC`;
  },

  async findByCompetitionId(competitionId) {
    return await sql`
      SELECT s.*, u.full_name, u.picture, u.email
      FROM submissions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.competition_id = ${competitionId}
      ORDER BY s.final_score DESC, s.created_at DESC
    `;
  },

  async findAll() {
    return await sql`
      SELECT s.*, u.full_name, u.picture, u.email
      FROM submissions s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `;
  },

  async findOne(userId, competitionId) {
    const result = await sql`
      SELECT * FROM submissions 
      WHERE user_id = ${userId} AND competition_id = ${competitionId}
    `;
    return result[0] || null;
  },

  async create(data) {
    console.log('=== Submission.create called ===');
    console.log('Data:', JSON.stringify(data, null, 2));
    
    try {
      const result = await sql`
        INSERT INTO submissions (
          user_id, competition_id, title, problem, solution, market, impact, payment_status, payment_id
        ) VALUES (
          ${data.userId}, ${data.competitionId}, ${data.title}, 
          ${data.problem}, ${data.solution}, ${data.market}, ${data.impact},
          ${data.paymentStatus || 'pending'}, ${data.paymentId || null}
        )
        RETURNING *
      `;
      console.log('✅ Submission inserted successfully');
      console.log('Result:', JSON.stringify(result[0], null, 2));
      return result[0];
    } catch (error) {
      console.error('❌ Submission.create failed:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      throw error;
    }
  },

  async updateScore(id, data) {
    const result = await sql`
      UPDATE submissions 
      SET judge_score = ${data.judgeScore || 0},
          judge_feedback = ${data.judgeFeedback || null},
          ai_score = ${data.aiScore || 0},
          ai_feedback = ${data.aiFeedback || null},
          processed_by_ai = ${data.processedByAI || false},
          final_score = ${data.finalScore || 0},
          status = ${data.status || 'pending'}
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0];
  },

  async countByCompetition(competitionId) {
    const result = await sql`SELECT COUNT(*) as count FROM submissions WHERE competition_id = ${competitionId}`;
    return parseInt(result[0].count);
  }
};

// Payment operations
const Payment = {
  async create(data) {
    const result = await sql`
      INSERT INTO payments (
        user_id, competition_id, order_id, amount, 
        payment_session_id, cf_order_id, status
      ) VALUES (
        ${data.userId}, ${data.competitionId}, ${data.orderId}, 
        ${data.amount}, ${data.paymentSessionId}, ${data.cfOrderId}, 
        ${data.status || 'pending'}
      )
      RETURNING *
    `;
    return result[0];
  },

  async findByOrderId(orderId, userId) {
    const result = await sql`
      SELECT * FROM payments 
      WHERE order_id = ${orderId} AND user_id = ${userId}
    `;
    return result[0] || null;
  },

  async updateStatus(orderId, status) {
    const result = await sql`
      UPDATE payments 
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ${orderId}
      RETURNING *
    `;
    return result[0];
  },

  async updatePaymentDetails(orderId, details) {
    const result = await sql`
      UPDATE payments 
      SET 
        status = ${details.status || 'pending'},
        cf_payment_id = ${details.cfPaymentId || null},
        payment_method = ${details.paymentMethod || null},
        transaction_id = ${details.transactionId || null},
        webhook_data = ${details.webhookData || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ${orderId}
      RETURNING *
    `;
    return result[0];
  },

  async findAll() {
    return await sql`
      SELECT p.*, u.full_name, u.email, u.picture
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `;
  },

  async getStats() {
    const result = await sql`
      SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as successful_payments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_revenue
      FROM payments
    `;
    return result[0];
  }
};

module.exports = {
  sql,
  initDB,
  User,
  Competition,
  Submission,
  Payment
};
