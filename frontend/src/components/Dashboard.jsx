import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Medal, ChevronRight, Activity, Target, Zap, Award, BrainCircuit } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  // Initialize with empty/zero data since backend is not connected yet
  const [data, setData] = useState({
    stats: {
      easy: { solved: 0, total: 100, stroke: 'stroke-cyan-400' },
      medium: { solved: 0, total: 100, stroke: 'stroke-violet-400' },
      hard: { solved: 0, total: 50, stroke: 'stroke-rose-400' }
    },
    streak: 0,
    badges: [],
    recentActivity: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Attempt to fetch from the backend you specified
        const response = await fetch('http://localhost:8000/progress');
        if (response.ok) {
          const backendData = await response.json();
          // Update state with actual backend data if it exists
          setData(prev => ({ ...prev, ...backendData }));
        }
      } catch (error) {
        console.log('Backend on localhost:8000 is not reachable yet. Showing empty stats.');
      }
    };

    fetchDashboardData();
  }, []);

  const ProgressRing = ({ solved, total, strokeColor, label }) => {
    const percentage = total > 0 ? (solved / total) * 100 : 0;
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24 flex items-center justify-center mb-2">
          {/* Background Ring */}
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
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Welcome back, Hacker</h1>
          <p className="text-slate-400">Your AI Tutor is ready for your next session.</p>
        </div>
        
        <button 
          onClick={() => navigate('/learn')}
          className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transform hover:-translate-y-0.5"
        >
          <BrainCircuit className="w-5 h-5" />
          Continue Learning
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Stats & Streaks) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Problem Solving Stats */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-400" /> Session Progress
              </h2>
              {data.stats.easy.solved > 0 && (
                <div className="text-sm font-medium bg-violet-500/20 text-violet-300 px-3 py-1 rounded-full border border-violet-500/30">
                  Top 5%
                </div>
              )}
            </div>
            
            <div className="flex justify-around items-end py-4">
              <ProgressRing solved={data.stats.easy.solved} total={data.stats.easy.total} strokeColor={data.stats.easy.stroke} label="Easy" />
              <ProgressRing solved={data.stats.medium.solved} total={data.stats.medium.total} strokeColor={data.stats.medium.stroke} label="Medium" />
              <ProgressRing solved={data.stats.hard.solved} total={data.stats.hard.total} strokeColor={data.stats.hard.stroke} label="Hard" />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
            
            {data.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No activity yet. Start your first session!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-[#0a0a14] border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200 group-hover:text-violet-400 transition-colors">{activity.title}</span>
                      <span className="text-xs text-slate-500">{activity.time}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        activity.difficulty === 'Easy' ? 'bg-cyan-500/10 text-cyan-400' :
                        activity.difficulty === 'Medium' ? 'bg-violet-500/10 text-violet-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {activity.difficulty}
                      </span>
                      <span className={`text-xs font-bold ${activity.status === 'Accepted' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Streaks & Badges) */}
        <div className="space-y-6">
          {/* Streak Card */}
          <div className="glass-panel p-6 relative overflow-hidden group cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Flame className={`w-32 h-32 ${data.streak > 0 ? 'text-orange-500' : 'text-slate-600'}`} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 relative z-10">Current Streak</h2>
            <div className="flex items-end gap-2 relative z-10">
              <span className={`text-6xl font-black ${data.streak > 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400' : 'text-slate-500'}`}>
                {data.streak}
              </span>
              <span className="text-lg text-slate-400 font-medium mb-1">Days</span>
            </div>
            <p className="text-sm text-slate-500 mt-2 relative z-10">
              {data.streak === 0 ? "Solve a problem today to start your streak!" : "Solve 1 more problem to keep it alive!"}
            </p>
          </div>

          {/* Badges Card */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" /> Badges
              </h2>
              {data.badges.length > 0 && (
                <span className="text-xs text-slate-400 font-medium cursor-pointer hover:text-white transition-colors flex items-center">
                  View All <ChevronRight className="w-3 h-3 ml-1" />
                </span>
              )}
            </div>
            
            {data.badges.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <Medal className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Complete challenges to earn badges.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {data.badges.map((badge, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-center p-4 rounded-xl border bg-slate-800/20 border-slate-700 hover:scale-105 transition-transform cursor-pointer">
                    <Award className="w-8 h-8 text-yellow-400 mb-2 drop-shadow-[0_0_5px_currentColor]" />
                    <span className="text-xs font-bold text-slate-200 text-center">{badge.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
