import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, List, GitBranch, ArrowDownAZ, Search, Play } from 'lucide-react';

const topics = [
  { id: 'arrays', name: 'Arrays', icon: Layers, description: 'Master contiguous memory allocation' },
  { id: 'linked_lists', name: 'Linked Lists', icon: List, description: 'Learn node-based data structures' },
  { id: 'trees', name: 'Trees', icon: GitBranch, description: 'Explore hierarchical data representation' },
  { id: 'sorting', name: 'Sorting', icon: ArrowDownAZ, description: 'Understand algorithmic ordering' },
  { id: 'searching', name: 'Searching', icon: Search, description: 'Efficiently find data in collections' },
];

export default function TopicSelector() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  const handleSelectTopic = async (topicId) => {
    setLoading(topicId);
    try {
      const response = await fetch('http://localhost:8000/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: topicId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Pass the first question data to the chat route
        navigate('/chat', { state: { initialQuestion: data, topic: topicId } });
      } else {
        console.error('Failed to start topic');
        // Still navigate for demo purposes if backend is down? 
        // We'll assume backend will be up for the hackathon.
        navigate('/chat', { state: { topic: topicId } });
      }
    } catch (error) {
      console.error('Error starting topic:', error);
      // Fallback navigation if backend is not running yet during development
      navigate('/chat', { state: { topic: topicId } });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-4 tracking-tight">
          Adaptive DSA Tutor
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Select a topic to start your personalized learning journey. The AI will adapt to your skill level.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic) => {
          const Icon = topic.icon;
          const isLoading = loading === topic.id;
          
          return (
            <button
              key={topic.id}
              onClick={() => handleSelectTopic(topic.id)}
              disabled={loading !== null}
              className={`group relative flex flex-col items-center p-6 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border ${
                isLoading ? 'border-blue-500' : 'border-slate-700/50'
              } hover:border-blue-500/50 transition-all duration-300 text-left w-full shadow-lg hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
            >
              <div className="absolute top-4 right-4 text-slate-500 group-hover:text-blue-400 transition-colors">
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Play className="w-5 h-5 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
                )}
              </div>
              
              <div className="w-16 h-16 rounded-xl bg-slate-900 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 group-hover:text-blue-300 transition-all shadow-inner">
                <Icon className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-100 mb-2 w-full text-center">{topic.name}</h3>
              <p className="text-sm text-slate-400 text-center">{topic.description}</p>
              
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
