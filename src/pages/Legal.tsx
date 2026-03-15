import React from 'react';

const LegalPage = ({ title, content }: { title: string; content: React.ReactNode }) => (
  <div className="pt-24 pb-20 px-4 max-w-4xl mx-auto">
    <h1 className="text-4xl font-bold text-white mb-12">{title}</h1>
    <div className="glass p-8 prose prose-invert max-w-none text-gray-400 leading-relaxed">
      {content}
    </div>
  </div>
);

export const Terms = () => (
  <LegalPage
    title="Terms & Conditions"
    content={
      <div className="space-y-8 text-sm">
        <p className="text-xs text-gray-500 italic">Last Updated: March 8, 2026</p>
        <section>
          <h2 className="text-white text-lg font-bold mb-3">1. Acceptance of Terms</h2>
          <p>By accessing and using IdeaWin by CAFYO (the "Platform"), you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Platform.</p>
        </section>
        <section className="bg-indigo-600/10 p-4 rounded-lg border border-indigo-600/20">
          <h2 className="text-indigo-400 text-lg font-bold mb-2 uppercase tracking-wider">Skill-Based Competition</h2>
          <p className="text-white font-medium">This is a skill-based competition platform where winners are determined solely by merit-based scoring. Winners are selected based on:</p>
          <ul className="mt-2 space-y-1 text-indigo-300">
            <li>• AI Evaluation (40% weight)</li>
            <li>• Expert Judge Review (60% weight)</li>
          </ul>
        </section>
        <section>
          <h2 className="text-white text-lg font-bold mb-3">3. Eligibility</h2>
          <ul className="space-y-2">
            <li>• Be at least 18 years of age</li>
            <li>• Have the legal capacity to enter into binding contracts</li>
            <li>• Provide accurate and complete registration information</li>
            <li>• Pay the entry fee of ₹1 per submission</li>
          </ul>
        </section>
        <section>
          <h2 className="text-white text-lg font-bold mb-3">4. Entry Fee & Payment</h2>
          <p>The entry fee for each submission is ₹1 (Indian Rupee One only). By submitting your entry:</p>
          <ul className="mt-2 space-y-2">
            <li>• Payment must be completed before submission is accepted</li>
            <li>• Entry fees are non-refundable (see Refund Policy)</li>
            <li>• You may submit multiple entries by paying for each submission</li>
            <li>• Payment constitutes acceptance of all terms</li>
          </ul>
        </section>
        <section>
          <h2 className="text-white text-lg font-bold mb-3">6. Judging Process</h2>
          <p>All submissions undergo a two-stage evaluation:</p>
          <div className="mt-4 space-y-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <h4 className="text-white font-bold mb-1">Stage 1: AI Evaluation (40%)</h4>
              <p className="text-xs">Automated analysis of innovation, feasibility, market potential, social impact, and clarity.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg">
              <h4 className="text-white font-bold mb-1">Stage 2: Expert Review (60%)</h4>
              <p className="text-xs">Human judges evaluate originality, problem-solving, market demand, and implementation feasibility.</p>
            </div>
          </div>
        </section>
      </div>
    }
  />
);

export const Privacy = () => (
  <LegalPage
    title="Privacy Policy"
    content={
      <div className="space-y-8 text-sm">
        <p className="text-xs text-gray-500 italic">Last Updated: March 8, 2026</p>
        <section>
          <h2 className="text-white text-lg font-bold mb-3">1. Introduction</h2>
          <p>IdeaWin by CAFYO ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform.</p>
        </section>
        <section>
          <h2 className="text-white text-lg font-bold mb-3">2. Information We Collect</h2>
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-bold mb-1">Personal Information</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Name and email address</li>
                <li>Payment information (processed securely by third-party providers)</li>
                <li>Account credentials</li>
                <li>Contact information</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-1">Submission Information</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Startup idea details (problem, solution, market analysis)</li>
                <li>Supporting documents and materials</li>
                <li>Video pitch URLs (if provided)</li>
              </ul>
            </div>
          </div>
        </section>
        <section>
          <h2 className="text-white text-lg font-bold mb-3">4. Information Sharing</h2>
          <p>We may share your information with:</p>
          <ul className="mt-2 space-y-2">
            <li><strong>Judges & Evaluators:</strong> Your submission details are shared with AI systems and human judges for evaluation purposes only.</li>
            <li><strong>Service Providers:</strong> Payment processors, hosting providers, and analytics services that help us operate the Platform.</li>
            <li><strong>Public Display:</strong> Submission titles and scores are displayed publicly on leaderboards after completion.</li>
          </ul>
        </section>
      </div>
    }
  />
);

export const Refund = () => (
  <LegalPage
    title="Refund Policy"
    content={
      <div className="space-y-8 text-sm">
        <p className="text-xs text-gray-500 italic">Last Updated: March 8, 2026</p>
        <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/20 text-center">
          <h2 className="text-red-400 text-2xl font-black mb-2 uppercase">No Refund Policy</h2>
          <p className="text-white font-medium">All entry fees paid to IdeaWin by CAFYO are non-refundable under any circumstances.</p>
        </div>
        <section>
          <h2 className="text-white text-lg font-bold mb-3">1. Policy Overview</h2>
          <p>By submitting an entry and paying the entry fee of ₹1, you acknowledge and agree that:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>All payments are final and non-refundable</li>
            <li>No refunds will be issued for any reason</li>
            <li>This policy applies to all submissions without exception</li>
          </ul>
        </section>
        <section>
          <h2 className="text-white text-lg font-bold mb-3">2. Why No Refunds?</h2>
          <p>IdeaWin by CAFYO is a skill-based competition where entry fees contribute to:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong>Prize Pool:</strong> Entry fees directly contribute to the prize pool for winners. Once paid, these funds are allocated and cannot be withdrawn.</li>
          </ul>
        </section>
      </div>
    }
  />
);

export const IPPolicy = () => (
  <LegalPage
    title="Intellectual Property Policy"
    content={
      <div className="space-y-8 text-sm">
        <p className="text-xs text-gray-500 italic">Last Updated: March 8, 2026</p>
        <div className="bg-indigo-600/10 p-6 rounded-xl border border-indigo-600/20 text-center">
          <h2 className="text-indigo-400 text-2xl font-black mb-2 uppercase">Your IP Rights Are Protected</h2>
          <p className="text-white font-medium">You retain full ownership of all intellectual property rights in your submission. IdeaWin by CAFYO does not claim ownership of your ideas.</p>
        </div>
        <section>
          <h2 className="text-white text-lg font-bold mb-3">1. Ownership of Submissions</h2>
          <p>When you submit your startup idea to IdeaWin by CAFYO:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong>You retain all rights:</strong> You remain the sole owner of your intellectual property.</li>
            <li><strong>No transfer of ownership:</strong> Submission does not transfer any IP rights to us.</li>
            <li><strong>Your idea, your property:</strong> We do not acquire any ownership interest in your vision.</li>
            <li><strong>Freedom to use:</strong> You can develop, patent, or commercialize your idea independently.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-white text-lg font-bold mb-3">2. License Grant to IdeaWin by CAFYO</h2>
          <p>By submitting, you grant IdeaWin by CAFYO a limited, non-exclusive license to:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong>Evaluation Purposes:</strong> Use your submission to evaluate, score, and rank it.</li>
            <li><strong>Display:</strong> Display the title and public summary on leaderboards.</li>
          </ul>
        </section>
      </div>
    }
  />
);
