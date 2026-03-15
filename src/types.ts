export interface User {
  id?: number;
  _id?: string;
  email: string;
  fullName?: string;
  full_name?: string;
  picture: string;
  phone?: string;
  city?: string;
  verified?: boolean;
  isJudge?: boolean;
  is_judge?: boolean;
  isAdmin?: boolean;
  is_admin?: boolean;
  submissions?: Submission[];
}

export interface Competition {
  id?: number;
  _id?: string;
  title: string;
  description: string;
  status: 'upcoming' | 'active' | 'judging' | 'completed';
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  entryFee?: number;
  entry_fee?: number;
  prizePool?: number;
  prize_pool?: number;
  prizesJson?: string;
  prizes_json?: string;
  judgingCriteriaJson?: string;
  judging_criteria_json?: string;
  resultsPublished?: boolean;
  results_published?: boolean;
  createdAt?: string;
  created_at?: string;
}

export interface Submission {
  id?: number;
  _id?: string;
  userId?: string | User;
  user_id?: number;
  competitionId?: string;
  competition_id?: number;
  title: string;
  problem: string;
  solution: string;
  market: string;
  impact: string;
  status: string;
  finalScore?: number;
  final_score?: number;
  rank?: number;
  aiScore?: number;
  ai_score?: number;
  aiFeedback?: string;
  ai_feedback?: string;
  judgeScore?: number;
  judge_score?: number;
  judgeFeedback?: string;
  judge_feedback?: string;
  fullName?: string;
  full_name?: string;
  picture?: string;
  email?: string;
  createdAt?: string;
  created_at?: string;
  processedByAI?: boolean;
  processed_by_ai?: boolean;
  paymentStatus?: string;
  payment_status?: string;
  paymentId?: string;
  payment_id?: string;
}
