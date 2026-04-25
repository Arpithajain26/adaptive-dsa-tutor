import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, BrainCircuit, Loader2, Target, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const assessmentQuestions = [
  {
    question: "Let's start with the basics to understand your current level.\n\nWhat is the time complexity of accessing an element in an Array by its index?",
    options: [
      { text: "O(1)", isCorrect: true },
      { text: "O(n)", isCorrect: false },
      { text: "O(log n)", isCorrect: false },
      { text: "O(n²)", isCorrect: false },
    ]
  },
  {
    question: "Great. Which data structure uses the LIFO (Last In, First Out) principle?",
    options: [
      { text: "Queue", isCorrect: false },
      { text: "Stack", isCorrect: true },
      { text: "Linked List", isCorrect: false },
      { text: "Binary Tree", isCorrect: false },
    ]
  },
  {
    question: "One more to finalize. What is the worst-case time complexity of the QuickSort algorithm?",
    options: [
      { text: "O(n log n)", isCorrect: false },
      { text: "O(n)", isCorrect: false },
      { text: "O(n²)", isCorrect: true },
      { text: "O(1)", isCorrect: false },
    ]
  }
];

export default function Assessment() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Check session
    if (!localStorage.getItem('session_id')) {
      navigate('/login');
    }

    setMessages([
      { 
        role: 'bot', 
        content: assessmentQuestions[0].question,
        options: assessmentQuestions[0].options
      }
    ]);
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOptionClick = async (option) => {
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        newMessages[newMessages.length - 1].options = null; 
      }
      return newMessages;
    });

    setMessages(prev => [...prev, { role: 'user', content: option.text }]);
    
    if (option.isCorrect) setScore(s => s + 1);
    
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: option.isCorrect 
          ? "Correct! Well done." 
          : `Actually, the correct answer was ${assessmentQuestions[currentQIndex].options.find(o => o.isCorrect).text}.`
      }]);

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (currentQIndex + 1 < assessmentQuestions.length) {
        const nextQ = currentQIndex + 1;
        setCurrentQIndex(nextQ);
        setMessages(prev => [...prev, { 
          role: 'bot', 
          content: assessmentQuestions[nextQ].question,
          options: assessmentQuestions[nextQ].options
        }]);
      } else {
        const finalScore = score + (option.isCorrect ? 1 : 0);
        let level = 'Beginner';
        if (finalScore === 2) level = 'Intermediate';
        if (finalScore === 3) level = 'Advanced';

        // Mark as complete in backend
        const sessionId = localStorage.getItem('session_id');
        if (sessionId) {
          try {
            await axios.post('/api/complete_assessment', { session_id: sessionId });
          } catch(e) {
            console.error("Failed to mark assessment complete", e);
          }
        }

        setMessages(prev => [...prev, { 
          role: 'bot', 
          content: `Assessment Complete! \n\nYou scored ${finalScore}/3. Based on your performance, I have set your starting level to **${level}**.\n\nYour customized curriculum is ready. Let's head to your dashboard.` 
        }]);
        setAssessmentComplete(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-4 relative z-10"
    >
      <div className="w-full max-w-3xl glass-panel h-[700px] flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-primary/20 blur-2xl rounded-full pointer-events-none"></div>

        <div className="p-4 border-b border-white/5 bg-[#09090b]/80 flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">AI Skill Assessment</h2>
            <p className="text-xs text-slate-400">Determining your personalized learning path...</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar z-10 relative">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} mb-6 group`}
              >
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                  {msg.role === 'bot' && (
                    <div className="w-8 h-8 mr-3 rounded-full flex items-center justify-center shrink-0 border bg-[#09090b] border-primary/30 shadow-inner">
                      <BrainCircuit className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] rounded-2xl px-6 py-4 border ${
                    msg.role === 'user' 
                      ? 'bg-secondary text-white rounded-tr-sm shadow-[0_0_15px_rgba(99,102,241,0.3)] border-transparent' 
                      : 'glass-panel rounded-tl-sm border-white/5 bg-[#18181b]/50'
                  }`}>
                    <div className="whitespace-pre-wrap leading-relaxed font-medium">
                      {msg.content}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 ml-3 rounded-full bg-[#18181b] border border-secondary/30 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-indigo-300" />
                    </div>
                  )}
                </div>

                {msg.options && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, marginTop: 0 }}
                    animate={{ opacity: 1, marginTop: 16 }}
                    className="ml-11 grid grid-cols-1 sm:grid-cols-2 gap-3 w-[85%]"
                  >
                    {msg.options.map((option, optIdx) => (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={optIdx}
                        onClick={() => handleOptionClick(option)}
                        className="bg-[#18181b] hover:bg-primary/20 border border-slate-800 hover:border-primary/50 text-slate-200 font-medium py-3 px-4 rounded-xl text-left transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      >
                        {option.text}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start mb-6">
              <div className="w-8 h-8 mr-3 rounded-full bg-[#09090b] border border-primary/30 flex items-center justify-center shrink-0">
                <BrainCircuit className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>
              <div className="glass-panel rounded-tl-sm px-5 py-3 flex items-center gap-3 text-slate-300">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> Analyzing...
              </div>
            </motion.div>
          )}

          {assessmentComplete && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center mt-8 mb-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary hover:to-secondary text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-bounce"
              >
                Continue to Dashboard <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-[#09090b]/80 backdrop-blur-xl border-t border-white/5 z-10 flex items-center justify-center text-sm text-slate-500 font-medium h-[72px]">
          {assessmentComplete ? "Assessment complete." : "Please select an option above."}
        </div>
      </div>
    </motion.div>
  );
}
