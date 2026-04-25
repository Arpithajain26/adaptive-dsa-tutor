import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Send, RotateCcw, Lightbulb, BookOpen, CheckCircle2, XCircle,
  ArrowRight, Terminal, Code2, Clock, Cpu, ChevronDown, Zap, Info, Layout
} from 'lucide-react';

const TEMPLATES = {
  python: `def solution(nums):
    # Write your code here
    pass`,
  java: `class Solution {
    public int solution(int[] nums) {
        // Write your code here
        return 0;
    }
}`,
  cpp: `class Solution {
public:
    int solution(vector<int>& nums) {
        // Write your code here
        return 0;
    }
};`
};

const LANG_LABELS = { python: 'Python', java: 'Java', cpp: 'C++' };
const MONACO_LANGS = { python: 'python', java: 'java', cpp: 'cpp' };

export default function CodeEditor({
  question, topic, level, testCases = [], visualization,
  boilerplate, onNextQuestion, scoreData, setScoreData, questionNum
}) {
  const [code, setCode] = useState(boilerplate || TEMPLATES.python);
  const [language, setLanguage] = useState('python');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [hint, setHint] = useState('');
  const [hintLoading, setHintLoading] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [explainLoading, setExplainLoading] = useState(false);
  const [analysisTime, setAnalysisTime] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const dropdownRef = useRef(null);

  const sessionId = localStorage.getItem('session_id') || 'guest_user';

  useEffect(() => {
    if (boilerplate) {
      setCode(boilerplate);
    } else {
      setCode(TEMPLATES[language]);
    }
  }, [boilerplate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (!boilerplate || code === TEMPLATES[language]) {
      setCode(TEMPLATES[lang]);
    }
    setShowLangDropdown(false);
  };

  const handleRunCode = async () => {
    setRunning(true);
    setResults(null);
    setAnalysisTime('');
    try {
      const res = await axios.post('/api/run-code', {
        session_id: sessionId,
        code,
        language,
        question
      });
      setResults(res.data);
      setAnalysisTime(res.data.analysis_time || '');
    } catch (err) {
      console.error(err);
      setResults({
        test_results: [],
        overall_correct: false,
        feedback: 'Failed to analyze code. Check backend connection.',
        suggestion: ''
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post('/api/answer', {
        session_id: sessionId,
        answer: code
      });
      setSubmitted(true);
      setResults(prev => ({
        ...prev,
        submit_feedback: res.data.feedback,
        is_correct: res.data.is_correct,
        next_question: res.data.next_question,
        next_boilerplate: res.data.next_boilerplate,
        next_visualization: res.data.next_visualization,
        next_test_cases: res.data.next_test_cases,
        next_topic: res.data.next_topic,
        next_level: res.data.next_level
      }));
      if (res.data.is_correct) {
        setScoreData(prev => ({ ...prev, score: prev.score + 1, streak: prev.streak + 1 }));
      } else {
        setScoreData(prev => ({ ...prev, streak: 0 }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setCode(boilerplate || TEMPLATES[language]);
    setResults(null);
    setHint('');
    setExplanation('');
    setShowExplanation(false);
    setSubmitted(false);
  };

  const handleGetHint = async () => {
    setHintLoading(true);
    try {
      const res = await axios.post('/api/hint', { session_id: sessionId, hint_level: 1 });
      setHint(res.data.hint);
    } catch (err) { console.error(err); }
    finally { setHintLoading(false); }
  };

  const handleExplain = async () => {
    setExplainLoading(true);
    try {
      const res = await axios.post('/api/explain', { session_id: sessionId, user_answer: code });
      setExplanation(res.data.explanation);
      setShowExplanation(true);
    } catch (err) { console.error(err); }
    finally { setExplainLoading(false); }
  };

  const handleNext = () => {
    if (results?.next_question && onNextQuestion) {
      onNextQuestion({
        question: results.next_question,
        boilerplate: results.next_boilerplate,
        visualization: results.next_visualization,
        testCases: results.next_test_cases,
        topic: results.next_topic,
        level: results.next_level
      });
    }
    setResults(null);
    setHint('');
    setExplanation('');
    setShowExplanation(false);
    setSubmitted(false);
    setCode(results?.next_boilerplate || TEMPLATES[language]);
  };

  const passedCount = results?.test_results?.filter(t => t.passed).length || 0;
  const totalTests = results?.test_results?.length || 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex w-full h-[calc(100vh-80px)] overflow-hidden bg-[#0a0a0a]">

      {/* ── LEFT PANEL ── */}
      <div className="w-[40%] flex flex-col border-r border-white/5 bg-[#0d0d14]">
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-3 bg-[#111118] border-b border-white/5">
          <Info size={14} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Problem</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
          {/* Title + Badges */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white leading-tight">{topic}</h2>
              <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">Q#{questionNum}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-secondary/15 text-secondary border border-secondary/20">{topic}</span>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                level === 'beginner' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
                level === 'intermediate' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                'bg-red-500/15 text-red-400 border-red-500/20'
              }`}>{level?.charAt(0).toUpperCase() + level?.slice(1)}</span>
            </div>
          </div>

          {/* Question */}
          <div className="text-[14px] text-slate-300 leading-relaxed whitespace-pre-wrap">{question}</div>

          {/* Test Cases */}
          {testCases && testCases.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2">
                <Terminal size={12} /> Examples
              </h3>
              {testCases.map((tc, i) => (
                <div key={i} className="bg-white/[0.03] rounded-lg p-3 border border-white/5 space-y-2 font-mono text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-600 uppercase">Input</span>
                    <div className="text-primary mt-0.5">{tc.input}</div>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-600 uppercase">Output</span>
                    <div className="text-secondary mt-0.5">{tc.output}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hint */}
          <AnimatePresence>
            {hint && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-hint/5 border border-hint/20 rounded-lg p-3 text-hint text-xs leading-relaxed">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Lightbulb size={12} />
                  <span className="font-black text-[10px] uppercase tracking-wider">Hint</span>
                </div>
                {hint}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Explanation */}
          <AnimatePresence>
            {showExplanation && explanation && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-secondary/5 border border-secondary/20 rounded-lg p-3 text-secondary text-xs leading-relaxed whitespace-pre-wrap">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <BookOpen size={12} />
                  <span className="font-black text-[10px] uppercase tracking-wider">Explanation</span>
                </div>
                {explanation}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button onClick={handleGetHint} disabled={hintLoading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold bg-hint/10 text-hint border border-hint/20 hover:bg-hint/20 transition-all">
              <Lightbulb size={13} /> {hintLoading ? 'Loading...' : '💡 Hint'}
            </button>
            <button onClick={handleExplain} disabled={explainLoading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-all">
              <BookOpen size={13} /> {explainLoading ? 'Loading...' : '📚 Explain'}
            </button>
          </div>

          {/* Visualization */}
          {visualization && (
            <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-lg p-3 text-xs text-indigo-300 leading-relaxed italic">
              <Layout size={12} className="inline mr-1.5" />
              {visualization}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-[60%] flex flex-col bg-[#0D0221]">

        {/* Editor Header */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#111118] border-b border-white/5">
          <div className="flex items-center gap-3">
            <Code2 size={14} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Code</span>

            {/* Language Selector */}
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-all">
                {LANG_LABELS[language]} <ChevronDown size={11} />
              </button>
              <AnimatePresence>
                {showLangDropdown && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="absolute top-full left-0 mt-1 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden min-w-[120px]">
                    {Object.keys(LANG_LABELS).map(lang => (
                      <button key={lang} onClick={() => handleLanguageChange(lang)}
                        className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-white/10 transition-all ${language === lang ? 'text-primary bg-primary/10' : 'text-slate-300'}`}>
                        {LANG_LABELS[lang]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1">
              <RotateCcw size={11} /> Reset
            </button>
            <button onClick={handleRunCode} disabled={running || !code.trim()}
              className="px-4 py-1.5 rounded-lg text-[10px] font-black bg-emerald-600 text-white hover:bg-emerald-500 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-40">
              {running ? (
                <><span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
              ) : (
                <><Play size={11} /> Run Code</>
              )}
            </button>
            <button onClick={handleSubmit} disabled={submitting || submitted || !code.trim()}
              className="px-4 py-1.5 rounded-lg text-[10px] font-black bg-cyan-600 text-white hover:bg-cyan-500 transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 disabled:opacity-40">
              {submitting ? (
                <><span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
              ) : (
                <><Send size={11} /> Submit</>
              )}
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language={MONACO_LANGS[language]}
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v || '')}
            options={{
              fontSize: 15,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              readOnly: running || submitting,
              padding: { top: 16, bottom: 16 },
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              cursorBlinking: 'smooth',
              smoothScrolling: true,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontLigatures: true
            }}
          />
        </div>

        {/* Test Results Panel */}
        <div className="h-[35%] min-h-[200px] bg-[#0a0a12] border-t border-white/5 flex flex-col">
          <div className="flex items-center justify-between px-5 py-2.5 bg-[#111118] border-b border-white/5">
            <div className="flex items-center gap-2">
              <Terminal size={13} className="text-slate-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Test Results</span>
            </div>
            {analysisTime && (
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Clock size={10} /> Analyzed in {analysisTime}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {/* Empty State */}
            {!results && !running && (
              <div className="flex items-center justify-center h-full text-slate-600 text-xs italic">
                Click "Run Code" to analyze your solution against test cases
              </div>
            )}

            {/* Loading State */}
            {running && (
              <div className="flex items-center justify-center h-full gap-2">
                <span className="inline-block w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-primary text-xs animate-pulse">Analyzing logic with AI...</span>
              </div>
            )}

            {/* Results */}
            {results && !running && (
              <div className="space-y-3">
                {/* Summary Bar */}
                {totalTests > 0 && (
                  <div className={`flex items-center justify-between p-3 rounded-lg border ${
                    results.overall_correct
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}>
                    <div className="flex items-center gap-2">
                      {results.overall_correct
                        ? <CheckCircle2 size={16} className="text-emerald-400" />
                        : <XCircle size={16} className="text-red-400" />
                      }
                      <span className={`text-xs font-bold ${results.overall_correct ? 'text-emerald-400' : 'text-red-400'}`}>
                        {results.overall_correct ? 'All Tests Passed!' : `${passedCount}/${totalTests} Tests Passed`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      {results.time_complexity && (
                        <span className="flex items-center gap-1"><Clock size={10} /> {results.time_complexity}</span>
                      )}
                      {results.space_complexity && (
                        <span className="flex items-center gap-1"><Cpu size={10} /> {results.space_complexity}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Individual Test Cases */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {results.test_results?.map((tr, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-3 rounded-lg border space-y-2 ${
                        tr.passed
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-red-500/5 border-red-500/20'
                      }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-500 uppercase">Test {i + 1}</span>
                        {tr.passed
                          ? <span className="text-[9px] font-black text-emerald-400 flex items-center gap-1"><CheckCircle2 size={10} /> PASSED</span>
                          : <span className="text-[9px] font-black text-red-400 flex items-center gap-1"><XCircle size={10} /> FAILED</span>
                        }
                      </div>
                      {!tr.passed && (
                        <div className="space-y-1 text-[10px] font-mono">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Expected:</span>
                            <span className="text-slate-300">{tr.expected}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Got:</span>
                            <span className="text-red-400">{tr.got}</span>
                          </div>
                        </div>
                      )}
                      {tr.feedback && (
                        <div className="text-[10px] text-slate-400 italic">{tr.feedback}</div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* AI Feedback */}
                {(results.feedback || results.submit_feedback) && (
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Zap size={12} className="text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary">AI Feedback</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{results.submit_feedback || results.feedback}</p>
                    {results.suggestion && (
                      <p className="text-[11px] text-slate-500 italic">💡 {results.suggestion}</p>
                    )}
                  </div>
                )}

                {/* Next Question Button */}
                {submitted && results?.is_correct && (
                  <motion.button initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    onClick={handleNext}
                    className="w-full py-3 rounded-lg font-black text-xs bg-primary text-dark hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                    NEXT CHALLENGE <ArrowRight size={14} />
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
