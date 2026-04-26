import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2, BrainCircuit, Rocket, UserPlus, LogIn, Trophy,
  Zap, Target, ChevronRight, ArrowRight, Sparkles,
} from 'lucide-react';
import { motion, useInView, useAnimation } from 'framer-motion';

/* ─── Floating background particles ─── */
const DSA_TOKENS = [
  'O(log n)', 'BFS', 'DFS', 'dp[i][j]', 'O(n²)', 'heap', 'trie',
  'graph', 'stack', 'queue', 'hashmap', 'sort()', 'O(1)', 'BST',
  'merge', 'pivot', 'memoize', 'recurse', 'greedy', 'two-pointer',
  'sliding window', 'backtrack', 'topological', 'Dijkstra',
];

function Particle({ token, x, y, delay }) {
  return (
    <motion.span
      className="absolute font-mono text-[11px] select-none pointer-events-none text-cyan-500/20"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{ y: [-10, 10, -10], opacity: [0.1, 0.25, 0.1] }}
      transition={{ duration: 7 + delay * 1.3, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {token}
    </motion.span>
  );
}

/* ─── Animated counter ─── */
function Counter({ target, suffix = '', duration = 1.5 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - start) / (duration * 1000);
      const eased = Math.min(1, elapsed * elapsed * (3 - 2 * elapsed));
      setVal(Math.round(eased * target));
      if (elapsed < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── Typing headline ─── */
const WORDS = ['Arrays', 'Graphs', 'Dynamic\u00a0Programming', 'Trees', 'Sorting', 'Backtracking'];
function TypingWord() {
  const [wIdx, setWIdx] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = WORDS[wIdx];
    let timeout;
    if (!deleting && text === word) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && text === '') {
      setDeleting(false);
      setWIdx((w) => (w + 1) % WORDS.length);
    } else {
      timeout = setTimeout(() => {
        setText(deleting ? text.slice(0, -1) : word.slice(0, text.length + 1));
      }, deleting ? 45 : 80);
    }
    return () => clearTimeout(timeout);
  }, [text, deleting, wIdx]);

  return (
    <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-500 bg-clip-text text-transparent">
      {text}
      <span className="animate-pulse text-cyan-400">|</span>
    </span>
  );
}

/* ─── Feature card ─── */
function FeatureCard({ icon, color, title, desc, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const COLORS = {
    cyan:   { ring: 'ring-cyan-500/30',   bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   glow: 'shadow-cyan-500/20' },
    violet: { ring: 'ring-violet-500/30', bg: 'bg-violet-500/10', text: 'text-violet-400', glow: 'shadow-violet-500/20' },
    amber:  { ring: 'ring-amber-500/30',  bg: 'bg-amber-500/10',  text: 'text-amber-400',  glow: 'shadow-amber-500/20' },
    green:  { ring: 'ring-green-500/30',  bg: 'bg-green-500/10',  text: 'text-green-400',  glow: 'shadow-green-500/20' },
    pink:   { ring: 'ring-pink-500/30',   bg: 'bg-pink-500/10',   text: 'text-pink-400',   glow: 'shadow-pink-500/20' },
    teal:   { ring: 'ring-teal-500/30',   bg: 'bg-teal-500/10',   text: 'text-teal-400',   glow: 'shadow-teal-500/20' },
  };
  const c = COLORS[color];
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`bg-white/[0.03] backdrop-blur-sm border border-white/8 rounded-2xl p-6 cursor-default
        hover:border-white/15 hover:shadow-xl hover:${c.glow} transition-all duration-300 group`}
    >
      <div className={`w-12 h-12 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center mb-4 ${c.text}
        group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-100 mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

/* ─── Mini code snippet in hero ─── */
const CODE_LINES = [
  { text: 'def two_sum(nums, target):', color: 'text-cyan-400' },
  { text: '    seen = {}', color: 'text-slate-300' },
  { text: '    for i, n in enumerate(nums):', color: 'text-violet-400' },
  { text: '        comp = target - n', color: 'text-slate-300' },
  { text: '        if comp in seen:', color: 'text-green-400' },
  { text: '            return [seen[comp], i]', color: 'text-amber-400' },
  { text: '        seen[n] = i  # O(1) lookup', color: 'text-slate-500' },
];

function CodeSnippet() {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    // Reset lines each time the effect runs (handles React StrictMode double-invoke)
    setLines([]);
    let idx = 0;
    let cancelled = false;
    const t = setInterval(() => {
      if (cancelled) return;
      if (idx < CODE_LINES.length) {
        const entry = CODE_LINES[idx];
        if (entry) setLines((l) => [...l, entry]);
        idx++;
      } else {
        clearInterval(t);
      }
    }, 380);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="bg-[#0a0618] border border-white/10 rounded-2xl p-5 font-mono text-sm shadow-2xl shadow-black/50 min-h-[180px]">
      <div className="flex items-center gap-1.5 mb-4">
        <div className="w-3 h-3 rounded-full bg-red-500/70" />
        <div className="w-3 h-3 rounded-full bg-amber-500/70" />
        <div className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-2 text-slate-600 text-xs">solution.py</span>
      </div>
      {lines.filter(Boolean).map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className={`${line.color} leading-relaxed whitespace-pre`}
        >
          {line.text}
        </motion.div>
      ))}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.9, repeat: Infinity }}
        className="inline-block w-2 h-4 bg-cyan-400 mt-1"
      />
    </div>
  );
}


/* ─── Testimonial card ─── */
function TestimonialCard({ name, role, text, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5 }}
      className="bg-white/[0.02] border border-white/5 backdrop-blur-md p-6 rounded-2xl shadow-xl hover:border-cyan-500/30 transition-all group"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center font-bold text-cyan-400 group-hover:scale-110 transition-transform">
          {name[0]}
        </div>
        <div>
          <div className="text-sm font-bold text-slate-100">{name}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">{role}</div>
        </div>
      </div>
      <p className="text-slate-400 text-sm italic leading-relaxed">"{text}"</p>
    </motion.div>
  );
}

/* ══════════════════ MAIN COMPONENT ══════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();

  const particles = DSA_TOKENS.map((t, i) => ({
    token: t,
    x: (i * 4.1 + 3) % 95,
    y: (i * 6.7 + 8) % 88,
    delay: i * 0.28,
  }));

  const features = [
    { icon: <Rocket className="w-6 h-6" />, color: 'cyan',   title: 'Adaptive Difficulty',      desc: 'AI evaluates every submission and picks the next problem that pushes exactly your boundary.' },
    { icon: <Code2 className="w-6 h-6" />,  color: 'violet', title: 'Real-time Code Review',    desc: 'Get instant feedback on correctness, time/space complexity and code style elegance.' },
    { icon: <BrainCircuit className="w-6 h-6" />, color: 'amber', title: 'Socratic Hints',      desc: "Stuck? The AI won't just give you the answer — it guides your thought process step by step." },
    { icon: <Trophy className="w-6 h-6" />, color: 'green',  title: 'Progress Tracking',        desc: 'Visual dashboards track your growth across every DSA topic with streak and score analytics.' },
    { icon: <Zap className="w-6 h-6" />,    color: 'pink',   title: 'Auto-Triggered Hints',     desc: 'The tutor senses when you struggle and automatically delivers contextual guidance.' },
    { icon: <Target className="w-6 h-6" />, color: 'teal',   title: 'Algorithm Visualizer',     desc: 'Step-by-step animated visualizations for arrays, trees, graphs, sorting and more.' },
  ];

  const testimonials = [
    { name: "Alex Chen", role: "Software Engineer @ Google", text: "The adaptive level system is scary accurate. It found my weakness in Dynamic Programming within 3 problems." },
    { name: "Sarah J.", role: "CS Student @ Stanford", text: "Visualizing tree rotations in real-time helped me finally understand AVL trees after weeks of struggling." },
    { name: "Marcus Koh", role: "Frontend Dev", text: "Best technical interview prep tool I've used. The Socratic hints feel like having a senior engineer next to you." }
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#050214] selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* ── Animated background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {particles.map((p, i) => <Particle key={i} {...p} />)}
        
        {/* Animated Glow Orbs with Parallax-like movement */}
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-1/3 w-[800px] h-[800px] rounded-full bg-cyan-500/5 blur-[150px]" 
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, -60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 right-1/4 w-[700px] h-[700px] rounded-full bg-violet-600/8 blur-[130px]" 
        />
        
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* ── Navbar ── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-20 flex items-center justify-between px-8 py-6 border-b border-white/5 backdrop-blur-md sticky top-0"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.15 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)] relative group"
          >
            <BrainCircuit className="w-6 h-6 text-white" />
            <div className="absolute inset-0 rounded-xl bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
          <span className="text-xl font-black tracking-tight text-white uppercase italic">
            DSA <span className="text-cyan-400 not-italic lowercase">Tutor</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/login')} className="text-sm font-semibold text-slate-400 hover:text-white transition-all px-4 py-2">
            Login
          </button>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(34,211,238,0.4)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/signup')}
            className="text-sm font-bold bg-white text-[#050214] px-6 py-2.5 rounded-full transition-all flex items-center gap-2"
          >
            Start Learning <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="relative z-10 flex-1 flex items-center justify-center px-6 pt-24 pb-20">
        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          {/* Left copy */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
            }}
          >
            <motion.div
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Next-Gen Learning
            </motion.div>

            <motion.h1
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="text-6xl md:text-7xl font-black leading-[0.95] tracking-tighter mb-8 text-white"
            >
              Learn&nbsp;
              <TypingWord />
              <br />
              <span className="bg-gradient-to-r from-slate-200 to-slate-500 bg-clip-text text-transparent italic">Faster with AI</span>
            </motion.h1>

            <motion.p
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="text-slate-400 text-xl leading-relaxed mb-12 max-w-lg font-medium"
            >
              Stop wasting hours on problems too easy or too hard. Our AI adjusts difficulty after every line of code you write.
            </motion.p>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="flex flex-wrap gap-4 mb-16"
            >
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold py-5 px-10 rounded-2xl shadow-[0_10px_30px_rgba(34,211,238,0.3)] hover:shadow-[0_15px_40px_rgba(34,211,238,0.5)] transition-all text-lg flex items-center gap-3"
              >
                Join the Beta <ArrowRight className="w-5 h-5" />
              </motion.button>
              
              <button 
                onClick={() => navigate('/login')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-5 px-10 rounded-2xl text-lg backdrop-blur-md transition-all"
              >
                View Dashboard
              </button>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
              className="grid grid-cols-3 gap-10"
            >
              {[
                { val: 500, label: 'Problems' },
                { val: 12, label: 'Categories' },
                { val: 98, suffix: '%', label: 'Success Rate' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-black text-white leading-none mb-2">
                    <Counter target={s.val} suffix={s.suffix || '+'} />
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — animated code + floating cards */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:block relative"
          >
            {/* Main Code Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <CodeSnippet />
            </div>

            {/* Floating Badge: Progress */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-12 -left-12 bg-[#0a0618]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-20 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-xs font-black text-white uppercase tracking-tighter">Current Level</div>
                <div className="text-lg font-black text-cyan-400 leading-none">Intermediate</div>
              </div>
            </motion.div>

            {/* Floating Badge: Streak */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -bottom-10 -right-8 bg-[#0a0618]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-20 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-black text-white uppercase tracking-tighter">Hot Streak</div>
                <div className="text-lg font-black text-amber-400 leading-none">12 Problems</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Feature Highlights ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-6">
          <div className="max-w-2xl">
            <motion.p 
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em] mb-4"
            >
              The Platform
            </motion.p>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl font-black text-white leading-tight"
            >
              Designed for the <span className="italic text-slate-500 underline decoration-cyan-500/50 underline-offset-8">modern</span> developer.
            </motion.h2>
          </div>
          <motion.p 
             initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
             viewport={{ once: true }}
             className="text-slate-400 max-w-xs text-sm font-medium leading-relaxed"
          >
            We've distilled thousands of technical interview patterns into a single adaptive engine.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 0.1} />
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 bg-white/[0.01] rounded-[4rem] border border-white/5 mb-32">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-black text-white mb-2">Loved by engineers worldwide</h3>
          <p className="text-slate-500 font-medium italic">Join 50,000+ users cracking FAANG interviews</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} {...t} delay={i * 0.15} />
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-32">
        <div className="bg-gradient-to-br from-[#100b2e] to-[#050214] border border-white/10 rounded-[3rem] p-16 text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] -mr-40 -mt-40 group-hover:bg-cyan-500/20 transition-all duration-700" />
          
          <h2 className="text-5xl font-black text-white mb-6 relative z-10">Stop grinding. Start <span className="text-cyan-400">learning</span>.</h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto relative z-10">
            The best way to prepare for your next big role is just one click away. No credit card required.
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(34,211,238,0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/signup')}
            className="bg-white text-[#050214] font-black py-6 px-16 rounded-2xl text-xl transition-all relative z-10"
          >
            Get Early Access
          </motion.button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-8 flex flex-col md:flex-row items-center justify-between gap-8 text-slate-600 bg-[#050214]">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-5 h-5 text-cyan-400/50" />
          <span className="text-sm font-bold tracking-widest uppercase">DSA Tutor</span>
        </div>
        <div className="flex gap-10 text-xs font-bold uppercase tracking-widest">
          <a href="#" className="hover:text-cyan-400 transition-colors">Twitter</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">GitHub</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">Discord</a>
        </div>
        <div className="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em]">
          Built for FAANG Interviews © 2025
        </div>
      </footer>
    </div>
  );
}

