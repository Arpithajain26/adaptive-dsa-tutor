import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Lightbulb, CheckCircle2, XCircle, ArrowRight, Info, Layout, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from "@monaco-editor/react";

export default function Chat({ topic, initialQuestion, initialBoilerplate, initialVisualization, initialTestCases, scoreData, setScoreData }) {
  const [question, setQuestion] = useState(initialQuestion || 'Loading your first question...');
  const [questionNum, setQuestionNum] = useState(1);
  const [answerInput, setAnswerInput] = useState(initialBoilerplate || '');
  const [visualization, setVisualization] = useState(initialVisualization || '');
  const [testCases, setTestCases] = useState(initialTestCases || []);
  const [testCaseResults, setTestCaseResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null); 
  const [hint, setHint] = useState('');
  const [showHintLoading, setShowHintLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showVisualization, setShowVisualization] = useState(false);

  const sessionId = localStorage.getItem('session_id') || 'guest_user';

  useEffect(() => {
    if (initialBoilerplate) setAnswerInput(initialBoilerplate);
    if (initialVisualization) setVisualization(initialVisualization);
    if (initialTestCases) setTestCases(initialTestCases);
  }, [initialBoilerplate, initialVisualization, initialTestCases]);

  const handleSubmit = async () => {
    if (!answerInput.trim()) return;
    setLoading(true);
    setError('');
    setTestCaseResults(null);
    
    try {
      const res = await axios.post('/api/answer', { session_id: sessionId, answer: answerInput });
      
      setFeedback({
        correct: res.data.is_correct,
        text: res.data.feedback,
        next_question: res.data.next_question,
        next_boilerplate: res.data.next_boilerplate,
        next_visualization: res.data.next_visualization,
        next_test_cases: res.data.next_test_cases
      });

      if (res.data.test_case_results) {
        setTestCaseResults(res.data.test_case_results);
      }
      
      if (res.data.is_correct) {
         setScoreData(prev => ({ ...prev, score: prev.score + 1, streak: prev.streak + 1 }));
         setFailedAttempts(0);
      } else {
         setScoreData(prev => ({ ...prev, streak: 0 }));
         setFailedAttempts(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetHint = async () => {
    setShowHintLoading(true);
    try {
      const res = await axios.post('/api/hint', { session_id: sessionId, hint_level: failedAttempts >= 2 ? 2 : 1 });
      if (res.data.hint) setHint(res.data.hint);
    } catch (err) {
      setError('Failed to get hint.');
    } finally {
      setShowHintLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (feedback?.next_question) {
      setQuestion(feedback.next_question);
      setAnswerInput(feedback.next_boilerplate || '');
      setVisualization(feedback.next_visualization || '');
      setTestCases(feedback.next_test_cases || []);
      setQuestionNum(q => q + 1);
    }
    setFeedback(null);
    setTestCaseResults(null);
    setHint('');
    setShowVisualization(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col w-full h-[calc(100vh-80px)] overflow-hidden bg-[#0a0a0a]">
      <div className="flex h-full w-full">
        
        {/* Left: Description Pane (1/3) */}
        <div className="w-full lg:w-1/3 flex flex-col border-r border-white/5 bg-[#0f0f0f] overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 px-6 py-4 bg-[#141414] border-b border-white/5 sticky top-0 z-20">
            <Info size={16} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</span>
          </div>
          
          <div className="p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">{topic}</h2>
              <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded border border-primary/20">Q#{questionNum}</span>
            </div>

            <div className="prose prose-invert prose-sm max-w-none">
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap font-medium text-[15px]">
                {question}
              </div>
              {!testCases || testCases.length === 0 && (
                <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-primary/80 italic">
                  Tip: Start a new topic to see detailed example inputs and outputs!
                </div>
              )}
            </div>

            {testCases && testCases.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Terminal size={14} /> Example Test Cases
                </h3>
                {testCases.map((tc, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/5 space-y-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Input</span>
                      <code className="text-primary text-xs">{tc.input}</code>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Expected Output</span>
                      <code className="text-secondary text-xs">{tc.output}</code>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {visualization && (
              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowVisualization(!showVisualization)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-secondary/20 border border-secondary/30 text-secondary font-bold text-sm hover:bg-secondary/30 transition-all mt-4"
              >
                <Layout size={16} /> {showVisualization ? 'Hide Visualization' : 'Show Visualization Idea'}
              </motion.button>
            )}

            <AnimatePresence>
              {showVisualization && visualization && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-secondary/5 border border-secondary/20 p-4 rounded-xl text-sm text-secondary leading-relaxed italic shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                   {visualization}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Split Pane (Editor + Console) */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Top-Right: Editor (2/3) */}
          <div className="flex-1 flex flex-col bg-[#1e1e1e] border-b border-white/5">
            <div className="flex items-center justify-between px-6 py-3 bg-[#141414] border-b border-white/5">
              <div className="flex items-center gap-3">
                 <Layout size={14} className="text-slate-500" />
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Code Editor</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleGetHint} disabled={loading || showHintLoading} className="px-4 py-1.5 rounded-lg text-xs font-bold text-hint hover:bg-hint/10 transition-all">
                  {showHintLoading ? '...' : 'Get Hint'}
                </button>
                <button onClick={handleSubmit} disabled={loading || !answerInput.trim()} className="px-6 py-1.5 rounded-lg text-xs font-black bg-primary text-dark hover:bg-emerald-400 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                  {loading ? 'RUNNING...' : <><Send size={12}/> RUN CODE</>}
                </button>
              </div>
            </div>
            <div className="flex-1">
              <Editor height="100%" defaultLanguage="python" theme="vs-dark" value={answerInput} onChange={(v) => setAnswerInput(v)}
                options={{ fontSize: 16, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true, readOnly: loading || !!feedback, padding: { top: 20 } }}
              />
            </div>
          </div>

          {/* Bottom-Right: Console/Result (1/3) */}
          <div className="h-1/3 bg-[#0f0f0f] flex flex-col">
            <div className="flex items-center gap-2 px-6 py-3 bg-[#141414] border-b border-white/5">
               <Terminal size={14} className="text-slate-500" />
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Console & Results</span>
            </div>
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar font-mono">
              {!feedback && !loading && !error && (
                <div className="text-slate-600 italic text-sm">Waiting for execution... Click "Run Code" to evaluate your logic.</div>
              )}
              {loading && <div className="text-primary animate-pulse text-sm">Executing logic on AI servers... testing 3 test cases...</div>}
              {error && <div className="text-wrong text-sm">{error}</div>}
              
              {testCaseResults && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {testCaseResults.map((tr, i) => (
                    <div key={i} className={`p-3 rounded-lg border flex flex-col gap-2 ${tr.passed ? 'border-correct/30 bg-correct/5' : 'border-wrong/30 bg-wrong/5'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400">CASE #{i+1}</span>
                        {tr.passed ? <CheckCircle2 size={12} className="text-correct" /> : <XCircle size={12} className="text-wrong" />}
                      </div>
                      <div className="text-[10px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Result:</span>
                          <span className={tr.passed ? 'text-correct' : 'text-wrong'}>{tr.passed ? 'PASSED' : 'FAILED'}</span>
                        </div>
                        {!tr.passed && (
                           <>
                             <div className="flex justify-between">
                               <span className="text-slate-500">Expected:</span>
                               <span className="text-slate-300">{tr.expected}</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-slate-500">Actual:</span>
                               <span className="text-wrong">{tr.actual}</span>
                             </div>
                           </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {feedback && (
                <div className="flex flex-col gap-4">
                  <div className="text-slate-300 text-[13px] leading-relaxed whitespace-pre-wrap bg-white/5 p-4 rounded-lg border border-white/5">
                    {feedback.text}
                  </div>
                  {feedback.correct && (
                    <button onClick={handleNextQuestion} className="self-end flex items-center gap-2 px-6 py-2 rounded-lg font-bold bg-correct text-dark text-xs hover:bg-emerald-400 transition-all">
                      NEXT CHALLENGE <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
