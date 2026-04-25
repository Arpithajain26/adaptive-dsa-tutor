import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, BrainCircuit, Rocket, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col pt-20 relative z-10">
      
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-violet-500/30 text-violet-300 text-sm font-semibold mb-8 animate-glow">
          <BrainCircuit className="w-4 h-4" />
          <span>Hackathon Build v2.0 - Adaptive Learning Engine</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter">
          Master DSA with <br/>
          <span className="text-gradient leading-tight">AI Precision</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mb-12 leading-relaxed">
          The ultimate intelligent tutor that adapts to your skill level. 
          Stop mindlessly grinding. Start deliberately practicing.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <button 
            onClick={() => navigate('/signup')}
            className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.05] shadow-[0_0_20px_rgba(139,92,246,0.4)] text-lg"
          >
            <UserPlus className="w-5 h-5" /> Get Started Free
          </button>
          
          <button 
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto bg-[#121221] hover:bg-[#1a1a2e] border border-slate-700 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all hover:border-violet-500/50 text-lg"
          >
            <LogIn className="w-5 h-5" /> Log In
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 py-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-panel p-6 glass-panel-hover">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4 border border-violet-500/30">
            <Rocket className="w-6 h-6 text-violet-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">Adaptive Difficulty</h3>
          <p className="text-slate-400">The AI constantly evaluates your code and calibrates the next problem to perfectly push your boundaries.</p>
        </div>
        <div className="glass-panel p-6 glass-panel-hover">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4 border border-cyan-500/30">
            <Code2 className="w-6 h-6 text-cyan-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">Real-time Code Review</h3>
          <p className="text-slate-400">Get instant feedback not just on correctness, but on time/space complexity and code elegance.</p>
        </div>
        <div className="glass-panel p-6 glass-panel-hover">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center mb-4 border border-rose-500/30">
            <BrainCircuit className="w-6 h-6 text-rose-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">Socratic Learning</h3>
          <p className="text-slate-400">Stuck? The tutor won't just give you the answer. It provides targeted hints to guide your thought process.</p>
        </div>
      </div>
    </div>
  );
}
