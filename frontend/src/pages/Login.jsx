import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, ArrowRight, BrainCircuit, Eye, EyeOff, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  x: (i * 7 + 3) % 95,
  y: (i * 9 + 5) % 90,
  delay: i * 0.4,
}));

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setSubmitting(true);
    // Simulate brief loading for UX
    await new Promise(r => setTimeout(r, 600));
    localStorage.setItem('session_id', email.trim());
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/6 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/8 blur-[100px] pointer-events-none" />

      {/* Floating tokens */}
      {PARTICLES.map((p, i) => (
        <motion.span key={i}
          className="absolute font-mono text-[10px] text-cyan-500/15 select-none pointer-events-none"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          animate={{ y: [-8, 8, -8], opacity: [0.08, 0.2, 0.08] }}
          transition={{ duration: 6 + p.delay, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
        >
          {['O(log n)', 'BFS', 'dp[]', 'hash', 'trie', 'stack', 'O(1)', 'sort'][i % 8]}
        </motion.span>
      ))}

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.012] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/50">

          {/* Top accent bar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              whileHover={{ scale: 1.12, rotate: 8 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-violet-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-cyan-500/30 relative"
            >
              <BrainCircuit className="w-8 h-8 text-white" />
              <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
            </motion.div>
            <p className="text-[10px] font-bold text-cyan-400 tracking-[0.2em] uppercase mb-1">DSA Tutor</p>
            <h2 className="text-3xl font-black text-white mb-1">Welcome Back</h2>
            <p className="text-slate-500 text-sm">Continue your learning journey.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="group">
              <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest group-focus-within:text-cyan-400 transition-colors">
                Email Address
              </label>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com"
                className="w-full bg-[#0b0720] border border-white/10 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/15 rounded-xl px-4 py-3.5 text-slate-200 text-sm outline-none transition-all placeholder:text-slate-700"
                required
              />
            </div>

            {/* Password */}
            <div className="group">
              <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest group-focus-within:text-cyan-400 transition-colors">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full bg-[#0b0720] border border-white/10 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/15 rounded-xl px-4 py-3.5 pr-12 text-slate-200 text-sm outline-none transition-all placeholder:text-slate-700"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-cyan-400 transition-colors p-1"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={submitting}
              className="relative w-full overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all text-sm mt-2 disabled:opacity-70 group"
            >
              {/* Shine sweep on hover */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              {submitting ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Zap className="w-4 h-4" />
                  </motion.div>
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Access Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="mt-7 pt-6 border-t border-white/6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors inline-flex items-center gap-1 ml-0.5">
                Sign up free <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom glow line */}
        <div className="mt-4 mx-auto w-24 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      </motion.div>
    </div>
  );
}
