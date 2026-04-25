import React, { useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const getLevelDetails = (correctCount) => {
  if (correctCount >= 8) return { label: 'Advanced', color: 'text-correct border-correct bg-correct/10', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.5)]', percent: 100 };
  if (correctCount >= 4) return { label: 'Intermediate', color: 'text-hint border-hint bg-hint/10', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.5)]', percent: 50 + ((correctCount - 4) / 4) * 50 };
  return { label: 'Beginner', color: 'text-secondary border-secondary bg-secondary/10', glow: 'shadow-[0_0_10px_rgba(99,102,241,0.5)]', percent: (correctCount / 4) * 50 };
};

export default function Progress({ scoreData, setScoreData }) {
  const sessionId = localStorage.getItem('session_id') || 'guest_user';

  useEffect(() => {
    let mounted = true;
    const fetchProgress = async () => {
      try {
        const res = await axios.get('/api/progress', { params: { session_id: sessionId } });
        if (mounted && res.data) {
          setScoreData(prev => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        console.error('Failed to fetch progress', err);
      }
    };
    
    fetchProgress();
    const interval = setInterval(fetchProgress, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [setScoreData, sessionId]);

  const levelDetails = getLevelDetails(scoreData.score || 0);

  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full bg-[#09090b]/80 backdrop-blur-md border-b border-white/5 px-6 py-4"
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-3">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className={`px-4 py-1.5 rounded-full border text-sm font-bold tracking-wide ${levelDetails.color} ${levelDetails.glow}`}
            >
              🎯 {levelDetails.label}
            </motion.div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Score:</span>
              <motion.span 
                key={scoreData.score}
                initial={{ scale: 1.5, color: '#10b981' }}
                animate={{ scale: 1, color: '#ffffff' }}
                className="text-xl font-bold font-mono"
              >
                {scoreData.score}
              </motion.span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Streak:</span>
              <motion.span 
                key={scoreData.streak}
                initial={{ scale: 1.5, color: '#10b981' }}
                animate={{ scale: 1, color: '#f59e0b' }}
                className="text-xl font-bold text-hint font-mono flex items-center gap-1"
              >
                🔥 {scoreData.streak}
              </motion.span>
            </div>
          </div>
        </div>

        <div className="w-full h-2 bg-[#18181b] rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(levelDetails.percent, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full bg-gradient-to-r from-secondary via-hint to-correct`}
          />
        </div>
      </div>
    </motion.div>
  );
}
