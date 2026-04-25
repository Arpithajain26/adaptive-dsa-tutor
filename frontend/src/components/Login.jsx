import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, ArrowRight, BrainCircuit } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // After login, route to the Assessment flow
    navigate('/assessment');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative z-10 px-4">
      <div className="w-full max-w-md glass-panel p-8 relative overflow-hidden transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 pointer-events-none"></div>
        
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-slate-400 text-sm">Log in to continue your training.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Email Address</label>
            <input 
              type="email" 
              placeholder="hacker@example.com" 
              className="w-full bg-[#0a0a14] border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-slate-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full bg-[#0a0a14] border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-slate-600"
              required
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg shadow-violet-500/25 mt-6"
          >
            <LogIn className="w-5 h-5" /> Access Dashboard
          </button>
          
          <div className="pt-6 text-center border-t border-slate-700/50 mt-6">
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors flex items-center justify-center inline-flex gap-1">
                Sign up here <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
