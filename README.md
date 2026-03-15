# IdeaWin - Startup Idea Competition Platform

A comprehensive platform for hosting startup idea competitions with AI-powered evaluation, payment integration, and real-time leaderboards.

## Features

- **Google OAuth Authentication** - Secure login with Google accounts
- **Idea Submission** - Multi-step form for submitting startup ideas
- **AI Evaluation** - Automated scoring using OpenRouter API (FREE models available)
- **Judge Panel** - Admin portal for manual evaluation and scoring
- **Payment Integration** - Cashfree payment gateway for entry fees
- **Live Leaderboard** - Real-time rankings with publish/unpublish control
- **Winners Podium** - Beautiful display of top 3 winners
- **PostgreSQL Database** - Serverless Neon database for data storage

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js (Serverless Functions)
- **Database**: Neon PostgreSQL (Serverless)
- **Authentication**: Google OAuth 2.0
- **AI**: OpenRouter API (Free LLaMA models)
- **Payments**: Cashfree Payment Gateway
- **Deployment**: Vercel

## Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   
   The `.env` file is already configured with:
   - Google OAuth credentials
   - Neon PostgreSQL connection
   - OpenRouter API key (FREE model)
   - Cashfree payment credentials (PRODUCTION)
   - JWT secret

3. **Run the application**:

   **Option 1: Run both servers together**
   ```bash
   npm start
   ```

   **Option 2: Run servers separately** (recommended for development)
   
   Terminal 1 - API Server:
   ```bash
   npm run api
   ```
   
   Terminal 2 - Frontend:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:3001
   - API Server: http://localhost:3002

## Project Structure

```
├── api/
│   └── index.js              # Serverless API handler
├── src/
│   ├── components/
│   │   └── Navbar.tsx        # Navigation component
│   ├── context/
│   │   └── AuthContext.tsx   # Authentication context
│   ├── pages/
│   │   ├── Home.tsx          # Landing page
│   │   ├── Competition.tsx   # Competition details
│   │   ├── RegisterIdea.tsx  # Idea submission form
│   │   ├── Dashboard.tsx     # User dashboard
│   │   ├── Leaderboard.tsx   # Live rankings
│   │   ├── Winners.tsx       # Winners podium
│   │   ├── JudgePanel.tsx    # Admin portal
│   │   └── PaymentStatus.tsx # Payment verification
│   ├── services/
│   │   ├── api.ts            # API client
│   │   └── aiJudgingService.ts # AI evaluation service
│   ├── db-postgres.js        # Database layer
│   ├── types.ts              # TypeScript types
│   ├── App.tsx               # Main app component
│   └── main.tsx              # Entry point
├── .env                      # Environment variables
├── vite.config.ts            # Vite configuration
├── vite-server.js            # Local API server
└── vercel.json               # Vercel deployment config
```

## Admin Access

Only the user with email `lokesh009.naik@gmail.com` has admin access to:
- View all submissions
- Run AI evaluation
- Edit AI scores and feedback
- Provide judge scores (0-100)
- Publish/unpublish results
- Set prize money
- Export data to CSV
- Undo evaluations

## Scoring System

- **AI Score**: 0-100 (40% weight)
- **Judge Score**: 0-100 (60% weight)
- **Final Score**: (AI × 0.4) + (Judge × 0.6)

## Payment Flow

1. User submits idea (Steps 1-3)
2. Payment step shows ₹9 entry fee
3. Cashfree checkout opens
4. User completes payment
5. Redirects to payment status page
6. Submission marked as 'paid'

## Database Schema

### Users
- id, email, google_id, full_name, picture, phone, city, is_admin

### Competitions
- id, title, description, status, start_date, end_date, prize_pool, prizes_json, entry_fee, results_published

### Submissions
- id, user_id, competition_id, title, problem, solution, market, impact
- ai_score, ai_feedback, judge_score, judge_feedback, final_score
- payment_status, payment_id, status, processed_by_ai

### Payments
- id, user_id, competition_id, order_id, amount, payment_session_id, cf_order_id, status

## Environment Variables

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
VITE_GOOGLE_CLIENT_ID=your_client_id

# Database
DATABASE_URL=postgresql://...
NEON_DATABASE_URL=postgresql://...

# OpenRouter AI
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free

# Cashfree Payments
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key

# App
APP_URL=http://localhost:3001
JWT_SECRET=your_jwt_secret
```

## Deployment

The app is configured for Vercel deployment:

```bash
vercel --prod
```

Make sure to set all environment variables in Vercel dashboard.

## API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/profile` - Update profile

### Competitions
- `GET /api/competitions` - List all competitions
- `GET /api/competitions/active` - Get active competition
- `GET /api/stats` - Get registration stats

### Submissions
- `POST /api/submissions` - Create submission
- `GET /api/submissions/my` - Get user's submissions
- `GET /api/leaderboard/:id` - Get leaderboard

### Admin (Auth Required)
- `GET /api/admin/submissions` - List all submissions
- `POST /api/judging/ai-evaluate` - Run AI evaluation
- `POST /api/judging/score` - Submit judge score
- `POST /api/judging/undo-evaluation` - Reset evaluation
- `POST /api/admin/publish-results` - Publish/unpublish results
- `POST /api/admin/update-prizes` - Update prize money
- `GET /api/admin/check-env` - Check environment config

### Payments
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment status

## License

Apache-2.0

## Support

For issues or questions, contact the admin at lokesh009.naik@gmail.com
