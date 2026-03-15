import React from 'react';
import { motion } from 'motion/react';
import { Brain, Users, Scale } from 'lucide-react';

const JudgingCriteria = () => {
  return (
    <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
      <header className="text-center mb-16">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block p-3 bg-indigo-600/20 rounded-2xl mb-6"
        >
          <Scale className="w-12 h-12 text-indigo-400" />
        </motion.div>
        <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4">Judging Criteria</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Our evaluation process combines AI-powered analysis with expert human judgment to ensure fair and comprehensive assessment.
        </p>
      </header>

      {/* Scoring Formula */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 mb-12 max-w-3xl mx-auto text-center"
      >
        <h2 className="text-2xl font-bold text-white mb-4">Final Score Calculation</h2>
        <div className="text-4xl font-black text-indigo-400 mb-4">
          Final Score = (AI × 40%) + (Judge × 60%)
        </div>
        <p className="text-gray-400">
          We believe in combining the objectivity of AI with the nuanced understanding of human experts.
        </p>
      </motion.div>

      {/* Criteria Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* AI Evaluation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-600/20 rounded-xl">
              <Brain className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">AI Evaluation</h3>
              <p className="text-sm text-indigo-400 font-bold">40% Weight • 100 Marks</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white">Innovation & Uniqueness</h4>
                <span className="text-indigo-400 font-bold">25 marks</span>
              </div>
              <p className="text-sm text-gray-400">
                How novel is the idea? Does it solve a problem in a new way?
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white">Market Potential</h4>
                <span className="text-indigo-400 font-bold">25 marks</span>
              </div>
              <p className="text-sm text-gray-400">
                How large is the target market? Is there a clear path to monetization?
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white">Feasibility & Practicality</h4>
                <span className="text-indigo-400 font-bold">20 marks</span>
              </div>
              <p className="text-sm text-gray-400">
                Can this be built? Is the solution realistic and achievable?
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white">Social/Economic Impact</h4>
                <span className="text-indigo-400 font-bold">20 marks</span>
              </div>
              <p className="text-sm text-gray-400">
                Does it create positive change or significant value for society?
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white">Clarity of Presentation</h4>
                <span className="text-indigo-400 font-bold">10 marks</span>
              </div>
              <p className="text-sm text-gray-400">
                How well is the idea articulated and communicated?
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-indigo-600/10 rounded-xl border border-indigo-600/20">
            <p className="text-xs text-gray-400">
              <span className="font-bold text-indigo-400">Powered by Groq AI</span> - Our AI uses advanced language models to provide objective, consistent evaluation across all submissions.
            </p>
          </div>
        </motion.div>

        {/* Expert Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-600/20 rounded-xl">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Expert Panel</h3>
              <p className="text-sm text-purple-400 font-bold">60% Weight • 100 Marks</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white">Originality of Concept</h4>
                <span className="text-purple-400 font-bold">20 marks</span>
              </div>
              <p className="text-sm text-gray-400">
                Is the core concept truly original and differentiated from existing solutions?
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white">Problem-Solving Approach</h4>
                <span className="text-purple-400 font-bold">20 marks</span>
              </div>
              <p className="text-sm text-gray-400">
                How effectively does the solution address the identified problem?
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white">Market Demand Analysis</h4>
                <span className="text-purple-400 font-bold">20 marks</span>
              </div>
              <p className="text-sm text-gray-400">
                Is there clear evidence of market need and customer demand?
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white">Practical Implementation</h4>
                <span className="text-purple-400 font-bold">20 marks</span>
              </div>
              <p className="text-sm text-gray-400">
                Can this be realistically implemented with available resources?
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white">Overall Viability</h4>
                <span className="text-purple-400 font-bold">20 marks</span>
              </div>
              <p className="text-sm text-gray-400">
                Overall assessment of the idea's potential for success and sustainability.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-purple-600/10 rounded-xl border border-purple-600/20">
            <p className="text-xs text-gray-400">
              <span className="font-bold text-purple-400">Human Expertise</span> - Our expert judges bring years of industry experience and nuanced understanding to the evaluation process.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Why This Approach */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass p-8 max-w-4xl mx-auto"
      >
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Why This Hybrid Approach?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="font-bold text-indigo-400 mb-3">AI Advantages (40%)</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Objective and consistent evaluation</li>
              <li>• No unconscious bias</li>
              <li>• Fast processing of submissions</li>
              <li>• Data-driven insights</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="font-bold text-purple-400 mb-3">Human Expertise (60%)</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Nuanced understanding of context</li>
              <li>• Industry experience and insights</li>
              <li>• Ability to assess intangibles</li>
              <li>• Strategic vision evaluation</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 rounded-xl border border-white/10">
          <p className="text-sm text-gray-300 text-center">
            By combining AI objectivity with human expertise, we ensure a fair, comprehensive, and balanced evaluation that captures both quantitative metrics and qualitative insights.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default JudgingCriteria;
