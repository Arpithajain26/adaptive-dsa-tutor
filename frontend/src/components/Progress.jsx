import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Target } from 'lucide-react';

export default function Progress() {
  const [stats, setStats] = useState({
    level: 'Beginner',
    score: 0,
    streak: 0,
    progress: 0,
  });

  const fetchProgress = async () => {
    try {
      const response = await fetch('http://localhost:8000/progress');
      if (response.ok) {
        const data = await response.json();
        // Assuming backend returns { level, score, streak, progress }
        setStats(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  useEffect(() => {
    fetchProgress();
    // Poll progress every few seconds to keep it updated
    const interval = setInterval(fetchProgress, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700/50 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          {stats.level} Level
        </h2>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-700/50 flex-1">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <div>
            <div className="text-xs text-slate-400">Score</div>
            <div className="font-bold text-slate-100">{stats.score}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-700/50 flex-1">
          <Flame className="w-5 h-5 text-orange-500" />
          <div>
            <div className="text-xs text-slate-400">Streak</div>
            <div className="font-bold text-slate-100">{stats.streak}</div>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Level Progress</span>
          <span>{stats.progress}%</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2.5 border border-slate-700/50 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${stats.progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
