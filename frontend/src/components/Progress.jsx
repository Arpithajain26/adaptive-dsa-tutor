import React, { useEffect } from 'react';
import axios from 'axios';

const getLevelDetails = (correctCount) => {
  if (correctCount >= 8) return { label: 'Advanced', color: 'text-correct border-correct bg-correct/10', glow: 'shadow-[0_0_10px_rgba(0,255,136,0.5)]', percent: 100 };
  if (correctCount >= 4) return { label: 'Intermediate', color: 'text-hint border-hint bg-hint/10', glow: 'shadow-[0_0_10px_rgba(255,215,0,0.5)]', percent: 50 + ((correctCount - 4) / 4) * 50 };
  return { label: 'Beginner', color: 'text-primary border-primary bg-primary/10', glow: 'shadow-[0_0_10px_rgba(0,212,255,0.5)]', percent: (correctCount / 4) * 50 };
};

export default function Progress({ scoreData, setScoreData }) {
  
  useEffect(() => {
    let mounted = true;
    const fetchProgress = async () => {
      try {
        const res = await axios.get('/api/progress');
        if (mounted && res.data) {
          setScoreData(prev => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        console.error('Failed to fetch progress', err);
      }
    };
    
    // Poll progress less frequently, as it's mainly updated locally after answer
    fetchProgress();
    const interval = setInterval(fetchProgress, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [setScoreData]);

  // Using score to determine level visually. Assuming score = total correct answers for now.
  const levelDetails = getLevelDetails(scoreData.score || 0);

  return (
    <div className="sticky top-0 z-50 w-full bg-[#1a1a2e]/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-3">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`px-4 py-1.5 rounded-full border text-sm font-bold tracking-wide ${levelDetails.color} ${levelDetails.glow}`}>
              🎯 {levelDetails.label}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">Score:</span>
              <span className="text-xl font-bold font-mono">{scoreData.score}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">Streak:</span>
              <span className="text-xl font-bold text-hint font-mono flex items-center gap-1">
                🔥 {scoreData.streak}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full h-2 bg-dark rounded-full overflow-hidden border border-white/10">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-primary via-hint to-correct`}
            style={{ width: `${Math.min(levelDetails.percent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
