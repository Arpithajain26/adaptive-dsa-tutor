import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowRight, BrainCircuit, Eye, EyeOff, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (!name.trim()) { setError('Please enter your name.'); return; }
    localStorage.setItem('session_id', email.trim());
    localStorage.setItem('user_name', name.trim());
    navigate('/learn');
  };

  const perks = [
    'Adaptive difficulty that grows with you',
    'Real-time AI code review & feedback',
    'Personalised study topic suggestions',
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-10">
      {/* Background orbs */}
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/8 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-cyan-500/8 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">
          {/* Logo + heading */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-violet-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-violet-500/30"
            >
              <BrainCircuit className="w-7 h-7 text-white" />
            </motion.div>
            <div className="text-center">
              <p className="text-xs font-semibold text-cyan-400 tracking-widest uppercase mb-1">DSA Tutor</p>
              <h2 className="text-3xl font-black text-white mb-1.5">Create Account</h2>
              <p className="text-slate-400 text-sm">Start your journey to DSA mastery.</p>
            </div>
          </div>

          {/* Perks */}
          <div className="mb-6 space-y-2">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-2.5 text-sm text-slate-400">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-cyan-400" />
                </span>
                {perk}
              </div>
            ))}
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="John Doe"
                className="w-full bg-[#0f0a1e] border border-white/10 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none transition-all placeholder:text-slate-600"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com"
                className="w-full bg-[#0f0a1e] border border-white/10 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none transition-all placeholder:text-slate-600"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full bg-[#0f0a1e] border border-white/10 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl px-4 py-3 pr-11 text-slate-200 text-sm outline-none transition-all placeholder:text-slate-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/45 transition-shadow mt-2 text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Create Account & Start Learning
            </motion.button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/8 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors inline-flex items-center gap-1"
              >
                Log in here <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
