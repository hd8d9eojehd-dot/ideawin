import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free'; // Free model by default

export interface AIEvaluationResult {
  score: number;
  feedback: string;
  breakdown: {
    innovation: number;
    marketPotential: number;
    feasibility: number;
    impact: number;
    presentation: number;
  };
}

export const evaluateStartupIdea = async (submission: any): Promise<AIEvaluationResult> => {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is not configured.");
  }

  const prompt = `You are an expert startup judge and venture capitalist. 
Evaluate the following startup idea submission for a competition.

Startup Title: ${submission.title}
Problem Statement: ${submission.problem}
Proposed Solution: ${submission.solution}
Target Market: ${submission.market}
Potential Impact: ${submission.impact}

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

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.APP_URL || 'https://ideawin-platform.vercel.app',
          'X-Title': 'IdeaWin by CAFYO Competition Platform',
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    const result = JSON.parse(content);
    
    // Validate the response structure
    if (!result.score || !result.feedback || !result.breakdown) {
      throw new Error('Invalid AI response format');
    }

    return result;
  } catch (error: any) {
    console.error('OpenRouter API Error:', error.response?.data || error.message);
    throw new Error('Failed to evaluate idea with AI: ' + (error.response?.data?.error?.message || error.message));
  }
};
