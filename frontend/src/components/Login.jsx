import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, ArrowRight, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (email.trim()) {
      localStorage.setItem('session_id', email.trim());
      // On login, we assume they might have already done the assessment
      navigate('/dashboard');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen flex items-center justify-center relative z-10 px-4"
    >
      <div className="w-full max-w-md glass-panel p-8 relative overflow-hidden transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 pointer-events-none"></div>
        
        <div className="flex flex-col items-center mb-8 relative z-10">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
          >
            <BrainCircuit className="w-6 h-6 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-slate-400 text-sm">Log in to continue your training.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hacker@example.com" 
              className="w-full bg-[#09090b] border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
            <input 
              type="password" 
              autoComplete="current-password"
              placeholder="••••••••" 
              className="w-full bg-[#09090b] border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-600"
              required
            />
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary hover:to-secondary text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 mt-6"
          >
            <LogIn className="w-5 h-5" /> Access Dashboard
          </motion.button>
          
          <div className="pt-6 text-center border-t border-slate-800 mt-6">
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:text-emerald-400 font-semibold transition-colors inline-flex items-center gap-1">
                Sign up here <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
