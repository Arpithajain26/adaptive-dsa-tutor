import React, { useState, useEffect, useRef } from 'react';
import { Send, Lightbulb, User, BrainCircuit, CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // We introduce a state machine for the flow: 
  // 'assessment' -> 'suggesting' -> 'solving' -> 'encouragement'
  const [flowState, setFlowState] = useState('assessment');

  useEffect(() => {
    // Initial Greeting and Assessment
    setMessages([
      { 
        role: 'bot', 
        type: 'agent', 
        content: "Welcome to your training session. Before we begin, how comfortable are you with Two Pointers and Sliding Window techniques? (e.g., 'Beginner', 'I know the basics', 'Advanced')" 
      }
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e, isHint = false) => {
    if (e) e.preventDefault();
    if (!input.trim() && !isHint) return;

    if (!isHint) {
      setMessages((prev) => [...prev, { role: 'user', content: input }]);
    }
    
    const currentInput = input;
    if (!isHint) setInput('');
    
    if (isHint) setHintLoading(true);
    else setLoading(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (isHint) {
        setMessages(prev => [...prev, { role: 'bot', type: 'hint', content: "Hint: Try using two pointers, one starting from the beginning and one from the end." }]);
      } else {
        // State Machine Logic (Mocked Backend Behavior)
        if (flowState === 'assessment') {
          setMessages(prev => [...prev, { 
            role: 'bot', 
            type: 'agent', 
            content: `Got it. Based on your level, let's start with something fundamental.` 
          }]);
          
          setTimeout(() => {
            setMessages(prev => [...prev, { 
              role: 'bot', 
              type: 'question', 
              content: "Problem: Given an array of integers, move all zeros to the end of it while maintaining the relative order of the non-zero elements.\n\nNote that you must do this in-place without making a copy of the array." 
            }]);
            setFlowState('solving');
          }, 1000);
          
        } else if (flowState === 'solving') {
          const isCorrect = currentInput.toLowerCase().includes('while') || currentInput.toLowerCase().includes('for') || currentInput.length > 20;
          
          if (isCorrect) {
            setMessages(prev => [...prev, { 
              role: 'bot', 
              type: 'feedback', 
              content: "Excellent work! Your approach uses O(n) time complexity and O(1) space complexity. That is exactly what we are looking for.",
              isCorrect: true 
            }]);
            
            setTimeout(() => {
              setMessages(prev => [...prev, { 
                role: 'bot', 
                type: 'encouragement', 
                content: "You're doing great! You've earned the 'Pointer Novice' badge. Let's step it up a notch. Ready for the next one?" 
              }]);
              setFlowState('assessment'); // Loop back or go to next problem
            }, 1000);
          } else {
            setMessages(prev => [...prev, { 
              role: 'bot', 
              type: 'feedback', 
              content: "Not quite. Think about how you can keep track of the position of the last non-zero element found so far.",
              isCorrect: false 
            }]);
          }
        }
      }
    } finally {
      setLoading(false);
      setHintLoading(false);
    }
  };

  const MessageBubble = ({ msg }) => {
    if (msg.role === 'user') {
      return (
        <div className="flex justify-end mb-6">
          <div className="max-w-[80%] bg-violet-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
          <div className="w-8 h-8 ml-3 rounded-full bg-[#121221] border border-violet-500/30 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-violet-300" />
          </div>
        </div>
      );
    }

    // Bot Messages configurations
    let bgColor = 'glass-panel';
    let iconColor = 'text-cyan-400';
    let iconBg = 'bg-[#0a0a14] border-cyan-500/30';
    let Icon = BrainCircuit;
    let title = '';
    let titleColor = '';
    
    if (msg.type === 'feedback') {
      if (msg.isCorrect) {
        bgColor = 'bg-green-900/10 border-green-500/30 backdrop-blur-md shadow-lg';
        iconColor = 'text-green-400';
        iconBg = 'bg-[#0a0a14] border-green-500/30';
        Icon = CheckCircle2;
      } else {
        bgColor = 'bg-rose-900/10 border-rose-500/30 backdrop-blur-md shadow-lg';
        iconColor = 'text-rose-400';
        iconBg = 'bg-[#0a0a14] border-rose-500/30';
        Icon = XCircle;
      }
    } else if (msg.type === 'hint') {
      bgColor = 'bg-yellow-900/10 border-yellow-500/30 backdrop-blur-md shadow-lg';
      iconColor = 'text-yellow-400';
      iconBg = 'bg-[#0a0a14] border-yellow-500/30';
      Icon = Lightbulb;
      title = 'Hint';
      titleColor = 'text-yellow-400';
    } else if (msg.type === 'question') {
      title = 'Problem to Solve';
      titleColor = 'text-cyan-400';
      bgColor = 'bg-cyan-900/10 border-cyan-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)]';
    } else if (msg.type === 'encouragement') {
      Icon = Sparkles;
      iconColor = 'text-yellow-300';
      title = 'Achievement Unlocked';
      titleColor = 'text-yellow-300';
      bgColor = 'bg-gradient-to-r from-violet-900/20 to-rose-900/20 border-violet-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(139,92,246,0.2)]';
    }

    return (
      <div className="flex justify-start mb-6 group">
        <div className={`w-8 h-8 mr-3 rounded-full flex items-center justify-center shrink-0 border ${iconBg} shadow-inner`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className={`max-w-[85%] rounded-2xl rounded-tl-sm px-6 py-4 border ${bgColor}`}>
          {title && (
            <div className={`text-xs font-bold ${titleColor} mb-2 uppercase tracking-wider flex items-center gap-1`}>
              {msg.type === 'encouragement' && <Sparkles className="w-3 h-3" />}
              {title}
            </div>
          )}
          <div className="whitespace-pre-wrap text-slate-200 leading-relaxed font-medium">
            {msg.content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden glass-panel relative">
      {/* Top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-cyan-500/20 blur-2xl rounded-full pointer-events-none"></div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar z-10 relative">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} msg={msg} />
        ))}
        {loading && (
          <div className="flex justify-start mb-6">
            <div className="w-8 h-8 mr-3 rounded-full bg-[#0a0a14] border border-cyan-500/30 flex items-center justify-center shrink-0">
              <BrainCircuit className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div className="glass-panel rounded-tl-sm px-5 py-3 flex items-center gap-3 text-slate-300">
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" /> Analyzing Code...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#05050a]/80 backdrop-blur-xl border-t border-slate-800 z-10">
        <form onSubmit={(e) => handleSubmit(e, false)} className="relative flex items-end gap-3 max-w-4xl mx-auto">
          <div className="relative flex-1 bg-[#0a0a14] rounded-xl border border-slate-700/50 focus-within:border-violet-500/50 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.2)] transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Write your code or reasoning here..."
              className="w-full bg-transparent text-slate-100 placeholder-slate-600 px-4 py-4 outline-none resize-none min-h-[60px] max-h-40 custom-scrollbar font-mono text-sm"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
          
          <button
            type="button"
            onClick={() => handleSubmit(null, true)}
            disabled={loading || hintLoading}
            className="p-4 rounded-xl bg-[#121221] border border-yellow-500/20 hover:bg-yellow-500/10 hover:border-yellow-500/40 text-yellow-400 transition-all disabled:opacity-50 group"
            title="Request Hint"
          >
            {hintLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lightbulb className="w-5 h-5 group-hover:scale-110 transition-transform" />}
          </button>
          
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white transition-all disabled:opacity-50 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 group"
            title="Submit Response"
          >
            {loading && !hintLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
          </button>
        </form>
      </div>
    </div>
  );
}
