import React, { useState } from 'react';
import axios from 'axios';

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

  const handleStart = async (topicId) => {
    setLoading(topicId);
    setError('');
    
    try {
      await axios.post('/api/start', { topic: topicId });
      onStart(topicId);
    } catch (err) {
      console.error(err);
      setError('Server not connected. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in relative z-10 w-full min-h-screen">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]"></div>
      </div>

      <div className="text-center mb-12 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
          Choose Your DSA Topic
        </h1>
        <p className="text-lg md:text-xl text-white/60 font-light">
          The agent will adapt to your level automatically
        </p>
        
        {error && (
          <div className="mt-6 bg-wrong/20 border border-wrong/50 text-wrong px-4 py-3 rounded-xl inline-block shadow-[0_0_15px_rgba(255,68,68,0.2)]">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
        {TOPICS.map((topic) => (
          <div 
            key={topic.id}
            className="glass-card group hover:cyan-glow cursor-pointer flex flex-col transition-all duration-300 transform hover:-translate-y-1"
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
              className="mt-auto w-full py-3 px-4 rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-white transition-all duration-300 flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-dark"
              disabled={loading === topic.id}
            >
              {loading === topic.id ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Start Learning <span className="group-hover:translate-x-1 transition-transform">→</span></>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
