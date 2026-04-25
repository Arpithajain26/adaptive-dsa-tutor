import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  BrainCircuit, 
  Zap, 
  Trophy, 
  ChevronRight, 
  HelpCircle, 
  Lightbulb, 
  RotateCcw,
  BarChart3,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Challenge from './Challenge';
import Auth from './Auth';

const API_BASE = "";
const TOPICS = [
  { id: 'arrays', name: 'Arrays', icon: <BookOpen className="w-6 h-6" />, desc: 'Master memory layout, traversal, and manipulation.' },
  { id: 'linked_lists', name: 'Linked Lists', icon: <BrainCircuit className="w-6 h-6" />, desc: 'Dynamic data structures and pointer logic.' },
  { id: 'stacks_queues', name: 'Stacks & Queues', icon: <Zap className="w-6 h-6" />, desc: 'LIFO and FIFO operations and applications.' },
  { id: 'trees', name: 'Trees', icon: <Trophy className="w-6 h-6" />, desc: 'Binary trees, traversal, and recursive patterns.' },
  { id: 'graphs', name: 'Graphs', icon: <BrainCircuit className="w-6 h-6" />, desc: 'BFS, DFS, and pathfinding algorithms.' },
  { id: 'dynamic_programming', name: 'DP', icon: <Zap className="w-6 h-6" />, desc: 'Optimization and subproblem memoization.' }
];

function App() {
  const [sessionId, setSessionId] = useState('');
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); // home, quiz, summary, challenge
  const [currentTopic, setCurrentTopic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [hint, setHint] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [stats, setStats] = useState({ level: 'Beginner', score: 0, streak: 0 });

  // Initialize session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('dsa_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setSessionId(userData.session_id);
      fetchProgress(userData.session_id);
    }
  }, []);

  const handleAuthSuccess = (data) => {
    setUser(data);
    setSessionId(data.session_id);
    localStorage.setItem('dsa_user', JSON.stringify(data));
    fetchProgress(data.session_id);
  };

  const handleLogout = () => {
    localStorage.removeItem('dsa_user');
    setUser(null);
    setSessionId('');
    setView('home');
  };

  const fetchProgress = async (sid) => {
    try {
      const res = await fetch(`${API_BASE}/progress?session_id=${encodeURIComponent(sid)}`);
      const data = await res.json();
      setStats({
        level: data.current_level,
        score: data.score,
        streak: data.streak
      });
    } catch (err) {
      console.error("Failed to fetch progress", err);
    }
  };

  const startTopic = async (topicId) => {
    setLoading(true);
    setCurrentTopic(topicId);
    try {
      const res = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, topic: topicId })
      });
      const data = await res.json();
      setQuestion(data);
      setView('quiz');
      setAnswer('');
      setFeedback(null);
      setHint(null);
      setExplanation(null);
    } catch (err) {
      alert("Error starting topic. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, answer })
      });
      const data = await res.json();
      setFeedback(data);
      setStats({
        level: data.next_level,
        score: stats.score + (data.is_correct ? 10 : 0),
        streak: data.streak
      });
    } catch (err) {
      alert("Error submitting answer.");
    } finally {
      setLoading(false);
    }
  };

  const getNextQuestion = () => {
    if (!feedback) return;
    setQuestion({
      question: feedback.next_question,
      topic: feedback.next_topic,
      level: feedback.next_level
    });
    setAnswer('');
    setFeedback(null);
    setHint(null);
    setExplanation(null);
  };

  const getHint = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, hint_level: hint ? 2 : 1 })
      });
      const data = await res.json();
      setHint(data.hint);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getExplanation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, user_answer: answer })
      });
      const data = await res.json();
      setExplanation(data.explanation);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetSession = async () => {
    if (!window.confirm("Are you sure? This will wipe all progress.")) return;
    try {
      await fetch(`${API_BASE}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      localStorage.removeItem('dsa_user');
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Stats HUD */}
      {user && (
        <div className="stats-hud glass">
          <div className="stat-item border-r border-white/10 pr-4">
            <span className="stat-label">User</span>
            <span className="stat-value text-indigo-300">@{user.username}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Level</span>
            <span className="stat-value text-indigo-400">{stats.level}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Score</span>
            <span className="stat-value text-amber-400">{stats.score}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Streak</span>
            <span className="stat-value text-rose-400">🔥 {stats.streak}</span>
          </div>
          <button onClick={handleLogout} className="ml-4 p-2 bg-transparent text-slate-500 hover:text-rose-400 transition-colors">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      )}

      <main className={user ? "pt-8" : "pt-0"}>
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Auth onAuthSuccess={handleAuthSuccess} />
            </motion.div>
          ) : (
            <>
              {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h1>Adaptive DSA Tutor</h1>
              <p className="text-dim mb-8">AI-powered personalized learning path for competitive programming.</p>
              
              <div className="card-grid">
                {TOPICS.map((topic) => (
                  <div 
                    key={topic.id} 
                    className="topic-card glass"
                    onClick={() => startTopic(topic.id)}
                  >
                    <div className="text-indigo-400 mb-4">{topic.icon}</div>
                    <h3 className="text-xl font-bold mb-2">{topic.name}</h3>
                    <p className="text-sm text-dim">{topic.desc}</p>
                    <div className="mt-4 flex items-center text-indigo-400 text-sm font-semibold">
                      Start Learning <ChevronRight className="ml-1 w-4 h-4" />
                    </div>
                  </div>
                ))}

                {/* LeetCode Style Challenge Card */}
                <div 
                  className="topic-card glass border-indigo-500/30 bg-indigo-500/5"
                  onClick={() => setView('challenge')}
                >
                  <div className="text-amber-400 mb-4"><Zap className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold mb-2">LeetCode Challenge</h3>
                  <p className="text-sm text-dim">Solve coding problems with a real-time judge and test cases.</p>
                  <div className="mt-4 flex items-center text-amber-400 text-sm font-semibold">
                    Try Now <ChevronRight className="ml-1 w-4 h-4" />
                  </div>
                </div>
              </div>

              <button 
                onClick={resetSession}
                className="mt-12 bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10"
                style={{ background: 'transparent', border: '1px solid rgba(244, 63, 94, 0.3)' }}
              >
                <RotateCcw className="inline-block mr-2 w-4 h-4" /> Reset Progress
              </button>
            </motion.div>
          )}

          {view === 'quiz' && question && (
            <motion.div 
              key="quiz"
              className="quiz-container glass"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
            >
              <div className="flex justify-between items-center mb-6">
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider">
                  {question.topic} • {question.level}
                </span>
                <button onClick={() => setView('home')} className="bg-transparent text-dim hover:text-white p-1">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="question-text">
                {question.question}
              </div>

              {!feedback ? (
                <>
                  <textarea 
                    placeholder="Type your answer or code explanation here..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={loading}
                  />
                  <div className="actions">
                    <button onClick={submitAnswer} disabled={loading || !answer.trim()}>
                      {loading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />} Submit Answer
                    </button>
                    <button onClick={getHint} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
                      <Lightbulb className="mr-2" /> {hint ? 'Better Hint' : 'Get Hint'}
                    </button>
                    <button onClick={getExplanation} disabled={loading} className="bg-slate-700 hover:bg-slate-600">
                      <HelpCircle className="mr-2" /> Explain
                    </button>
                  </div>
                </>
              ) : (
                <div className="feedback-area">
                  <div className={`feedback-box ${feedback.is_correct ? 'feedback-success' : 'feedback-error'}`}>
                    <h4 className="font-bold flex items-center mb-2">
                      {feedback.is_correct ? <CheckCircle2 className="mr-2 text-emerald-400" /> : <XCircle className="mr-2 text-rose-400" />}
                      {feedback.is_correct ? 'Excellent!' : 'Not quite right'}
                    </h4>
                    <p className="text-sm opacity-90">{feedback.feedback}</p>
                  </div>
                  
                  <div className="mt-8 flex gap-4">
                    <button onClick={getNextQuestion}>
                      Next Question <ChevronRight className="ml-2" />
                    </button>
                    <button onClick={getExplanation} className="bg-slate-700 hover:bg-slate-600">
                      View Full Explanation
                    </button>
                  </div>
                </div>
              )}

              {hint && !feedback && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="hint-box"
                >
                  <div className="text-amber-400 font-bold text-sm mb-1 uppercase">Hint:</div>
                  <p className="text-sm">{hint}</p>
                </motion.div>
              )}

              {explanation && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
                >
                  <div className="text-indigo-400 font-bold text-sm mb-2 uppercase">Step-by-step Explanation:</div>
                  <p className="text-sm whitespace-pre-wrap">{explanation}</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {view === 'challenge' && (
            <Challenge onBack={() => setView('home')} />
          )}
        </>
      )}
        </AnimatePresence>
      </main>
      
      {loading && !question && user && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        </div>
      )}
    </div>
  );
}

export default App;
