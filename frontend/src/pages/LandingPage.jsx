import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Rocket, Shield, Zap, Target, Code2, Sparkles, ChevronRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon: Icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -8 }}
    className="glass-panel p-8 group cursor-default"
  >
    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
      <Icon className="w-7 h-7 text-primary" />
    </div>
    <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
  </motion.div>
);

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-mesh overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/40 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter text-white uppercase">DSA Tutor</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="px-6 py-2 text-sm font-bold text-slate-300 hover:text-white transition-colors">Sign In</button>
            <button onClick={() => navigate('/signup')} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm glow-primary hover:scale-105 transition-all">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-8"
          >
            <Sparkles className="w-3 h-3" />
            AI-Powered Personal Mentor
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9]"
          >
            Master DSA with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-pulse-glow">Adaptive AI.</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            The world's first adaptive tutor that analyzes your logic in real-time, 
            identifies weaknesses, and creates a custom roadmap to FAANG.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto px-10 py-5 bg-primary text-primary-foreground rounded-2xl font-black text-lg uppercase tracking-widest glow-primary hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Start Your Journey
              <Rocket className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-10 py-5 glass text-white rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"
            >
              Watch Demo
              <Play className="w-5 h-5 text-primary" />
            </button>
          </motion.div>

          {/* Floating UI Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-24 relative"
          >
            <div className="glass-strong rounded-[2.5rem] p-4 max-w-5xl mx-auto border-white/5 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-[2.6rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <img 
                src="https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=2070&auto=format&fit=crop" 
                alt="Dashboard Mockup" 
                className="rounded-[2rem] w-full shadow-2xl relative z-10"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 border-t border-white/5 relative bg-white/[0.01]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div>
            <div className="text-5xl font-black text-white mb-2 tracking-tighter">10,000+</div>
            <div className="text-slate-500 uppercase tracking-widest text-xs font-bold">Problems Solved</div>
          </div>
          <div>
            <div className="text-5xl font-black text-primary mb-2 tracking-tighter">98%</div>
            <div className="text-slate-500 uppercase tracking-widest text-xs font-bold">FAANG Success Rate</div>
          </div>
          <div>
            <div className="text-5xl font-black text-white mb-2 tracking-tighter">24/7</div>
            <div className="text-slate-500 uppercase tracking-widest text-xs font-bold">AI Support</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">Built for Performance.</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">Every feature is designed to accelerate your understanding of complex algorithms.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Zap}
              title="Real-time Analysis"
              desc="Our AI reviews your code logic as you type, providing instant feedback without execution."
              delay={0.1}
            />
            <FeatureCard 
              icon={Target}
              title="Adaptive Roadmap"
              desc="Identifies your weak spots and automatically adjusts problem difficulty to push you further."
              delay={0.2}
            />
            <FeatureCard 
              icon={Code2}
              title="Interactive Visualizer"
              desc="Watch step-by-step animations of how optimal algorithms solve the exact problem you're stuck on."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <p className="text-slate-500 text-sm">© 2026 DSATutor AI. All rights reserved. Built for the Hackathon.</p>
      </footer>
    </div>
  );
}
