import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, BrainCircuit, Rocket, UserPlus, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0 }}
      variants={containerVariants}
      className="min-h-screen flex flex-col pt-20 relative z-10"
    >
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto">
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-primary/30 text-emerald-300 text-sm font-semibold mb-8 animate-glow">
          <BrainCircuit className="w-4 h-4" />
          <span>Hackathon Build v2.0 - Adaptive Learning Engine</span>
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-black mb-6 tracking-tighter">
          Master DSA with <br/>
          <span className="text-gradient leading-tight">AI Precision</span>
        </motion.h1>
        
        <motion.p variants={itemVariants} className="text-xl md:text-2xl text-slate-400 max-w-3xl mb-12 leading-relaxed">
          The ultimate intelligent tutor that adapts to your skill level. 
          Stop mindlessly grinding. Start deliberately practicing.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/signup')}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:from-primary hover:to-secondary text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] text-lg"
          >
            <UserPlus className="w-5 h-5" /> Get Started Free
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto bg-[#18181b] hover:bg-[#27272a] border border-slate-800 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 hover:border-primary/50 text-lg transition-colors"
          >
            <LogIn className="w-5 h-5" /> Log In
          </motion.button>
        </motion.div>
      </div>

      {/* Features Grid */}
      <motion.div variants={containerVariants} className="max-w-6xl mx-auto px-4 py-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="glass-panel p-6 glass-panel-hover">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 border border-primary/30">
            <Rocket className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">Adaptive Difficulty</h3>
          <p className="text-slate-400">The AI constantly evaluates your code and calibrates the next problem to perfectly push your boundaries.</p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="glass-panel p-6 glass-panel-hover">
          <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-4 border border-secondary/30">
            <Code2 className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">Real-time Code Review</h3>
          <p className="text-slate-400">Get instant feedback not just on correctness, but on time/space complexity and code elegance.</p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="glass-panel p-6 glass-panel-hover">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4 border border-amber-500/30">
            <BrainCircuit className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">Socratic Learning</h3>
          <p className="text-slate-400">Stuck? The tutor won't just give you the answer. It provides targeted hints to guide your thought process.</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
