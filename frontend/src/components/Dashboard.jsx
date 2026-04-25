import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Flame, Medal, ChevronRight, Activity, Target, Zap, Award, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState({
    score: 0,
    streak: 0,
    current_level: 'Beginner',
    badges: [],
    recentActivity: [],
    stats: {
      easy: { solved: 0, total: 100, stroke: 'stroke-teal-400' },
      medium: { solved: 0, total: 100, stroke: 'stroke-primary' },
      hard: { solved: 0, total: 50, stroke: 'stroke-secondary' }
    }
  });

  useEffect(() => {
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/progress', {
          params: { session_id: sessionId }
        });
        
        // Merge actual backend progress data
        setData(prev => ({ 
          ...prev, 
          score: response.data.score,
          streak: response.data.streak,
          current_level: response.data.current_level,
          // We can map the real stats to easy/medium/hard if the backend provided it,
          // for now we'll just update the top level stats.
        }));
      } catch (error) {
        console.error('Failed to fetch real progress, showing mock data.', error);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const ProgressRing = ({ solved, total, strokeColor, label }) => {
    const percentage = total > 0 ? (solved / total) * 100 : 0;
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center">
        <div className="relative w-24 h-24 flex items-center justify-center mb-2">
          <svg className="w-full h-full transform -rotate-90 absolute">
            <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-800" />
            <circle 
              cx="48" cy="48" r={radius} 
              stroke="currentColor" 
              strokeWidth="6" 
              fill="transparent" 
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`${strokeColor} transition-all duration-1000 ease-out drop-shadow-[0_0_8px_currentColor]`} 
            />
          </svg>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-100">{solved}</div>
            <div className="text-[10px] text-slate-500">/{total}</div>
          </div>
        </div>
        <span className={`text-sm font-semibold ${strokeColor.replace('stroke-', 'text-')}`}>{label}</span>
      </motion.div>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
      className="max-w-6xl mx-auto space-y-6 pt-10 px-4"
    >
      {/* Header Row */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Welcome back, Hacker</h1>
          <p className="text-slate-400">Level: <span className="text-emerald-400 font-semibold">{data.current_level}</span> • Total Score: {data.score}</p>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/learn')}
          className="bg-gradient-to-r from-primary to-secondary hover:from-primary hover:to-secondary text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
        >
          <BrainCircuit className="w-5 h-5" />
          Continue Learning
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants} className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" /> Session Progress
              </h2>
            </div>
            
            <div className="flex justify-around items-end py-4">
              <ProgressRing solved={data.score} total={data.stats.easy.total} strokeColor={data.stats.easy.stroke} label="Easy" />
              <ProgressRing solved={data.stats.medium.solved} total={data.stats.medium.total} strokeColor={data.stats.medium.stroke} label="Medium" />
              <ProgressRing solved={data.stats.hard.solved} total={data.stats.hard.total} strokeColor={data.stats.hard.stroke} label="Hard" />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-panel p-6">
            <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
            
            {data.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No activity yet. Start your first session!</p>
              </div>
            ) : null}
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <motion.div variants={itemVariants} className="glass-panel p-6 relative overflow-hidden group cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Flame className={`w-32 h-32 ${data.streak > 0 ? 'text-amber-500' : 'text-slate-600'}`} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 relative z-10">Current Streak</h2>
            <div className="flex items-end gap-2 relative z-10">
              <span className={`text-6xl font-black ${data.streak > 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500' : 'text-slate-500'}`}>
                {data.streak}
              </span>
              <span className="text-lg text-slate-400 font-medium mb-1">Days</span>
            </div>
            <p className="text-sm text-slate-500 mt-2 relative z-10">
              {data.streak === 0 ? "Solve a problem today to start your streak!" : "Solve 1 more problem to keep it alive!"}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" /> Badges
              </h2>
            </div>
            
            {data.badges.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <Medal className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Complete challenges to earn badges.</p>
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
