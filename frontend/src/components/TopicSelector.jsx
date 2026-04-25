import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';

const TOPICS = [
  { id: 'Arrays', name: 'Arrays', icon: '🔢', difficulty: 'Easy' },
  { id: 'Linked Lists', name: 'Linked Lists', icon: '🔗', difficulty: 'Medium' },
  { id: 'Trees', name: 'Trees', icon: '🌳', difficulty: 'Medium' },
  { id: 'Sorting', name: 'Sorting', icon: '📊', difficulty: 'Easy' },
  { id: 'Searching', name: 'Searching', icon: '🔍', difficulty: 'Easy' }
];

const getDifficultyColor = (diff) => {
  switch(diff) {
    case 'Easy': return 'text-primary border-primary bg-primary/10';
    case 'Medium': return 'text-hint border-hint bg-hint/10';
    case 'Hard': return 'text-wrong border-wrong bg-wrong/10';
    default: return 'text-primary border-primary bg-primary/10';
  }
};

export default function TopicSelector({ onStart }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const [resumeData, setResumeData] = useState(null);

  const sessionId = localStorage.getItem('session_id') || 'guest_user';
  const userName = localStorage.getItem('user_name') || '';

  useEffect(() => {
    const checkResume = async () => {
      try {
        const res = await axios.get(`/api/resume?session_id=${sessionId}`);
        if (res.data.can_resume) {
          setResumeData(res.data);
        }
      } catch (e) {}
    };
    checkResume();
  }, [sessionId]);

  const handleStart = async (topicId) => {
    setLoading(topicId);
    setError('');
    
    try {
      const res = await axios.post('/api/start', { 
        session_id: sessionId, 
        topic: topicId,
        user_name: userName,
        user_email: sessionId // email is used as session_id
      });
      onStart(topicId, res.data.question, res.data.boilerplate_code, res.data.visualization_idea, res.data.test_cases);
    } catch (err) {
      console.error(err);
      setError('Server not connected. Please try again.');
      setLoading(null);
    }
  };

  const handleResume = () => {
    if (resumeData) {
      onStart(resumeData.topic, resumeData.question, resumeData.boilerplate, resumeData.visualization, resumeData.test_cases);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={containerVariants}
      className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full min-h-screen"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px]"></div>
      </div>

      <motion.div variants={itemVariants} className="text-center mb-12 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
          Choose Your DSA Topic
        </h1>
        <p className="text-lg md:text-xl text-slate-400 font-light mb-8">
          The agent will adapt to your level automatically
        </p>

        {resumeData && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleResume}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-dark font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] mx-auto mb-10 group"
          >
            <RotateCcw className="w-6 h-6 group-hover:rotate-[-45deg] transition-transform" />
            Resume Last Session: {resumeData.topic}
          </motion.button>
        )}
        
        {error && (
          <div className="mt-6 bg-wrong/20 border border-wrong/50 text-wrong px-4 py-3 rounded-xl inline-block shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            {error}
          </div>
        )}
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
        {TOPICS.map((topic) => (
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -5 }}
            key={topic.id}
            className="glass-panel group hover:border-primary/50 cursor-pointer flex flex-col transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] p-6"
            onClick={() => !loading && handleStart(topic.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-5xl group-hover:scale-110 transition-transform duration-300 block">{topic.icon}</span>
              <span className={`text-xs px-3 py-1 rounded-full border ${getDifficultyColor(topic.difficulty)}`}>
                {topic.difficulty}
              </span>
            </div>
            
            <h3 className="text-2xl font-bold mb-6 mt-2">{topic.name}</h3>
            
            <button 
              className="mt-auto w-full py-3 px-4 rounded-xl font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all duration-300 flex items-center justify-center gap-2 group-hover:bg-primary group-hover:border-primary group-hover:text-dark"
              disabled={loading === topic.id}
            >
              {loading === topic.id ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Start Learning <span className="group-hover:translate-x-1 transition-transform">→</span></>
              )}
            </button>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
