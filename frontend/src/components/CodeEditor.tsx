import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { Brain, Lightbulb, BookOpen, Play, Check, RotateCcw, AlertTriangle, Loader2, Film } from "lucide-react";
import { tutorCall, type Problem, type AnswerResponse, type RunCodeResponse } from "@/lib/tutor-api";
import ProgressBar from "./ProgressBar";
import FeedbackCard from "./FeedbackCard";
import HintBox from "./HintBox";
import ExplanationBox from "./ExplanationBox";
import Visualizer, { type VizData } from "./Visualizer";
import { toast } from "sonner";

type Lang = "python" | "java" | "cpp";
const LANGS: Lang[] = ["python", "java", "cpp"];
const LANG_LABEL: Record<Lang, string> = { python: "Python", java: "Java", cpp: "C++" };

interface Props {
  initialProblem: Problem;
  topic: string;
  initialScore: number;
  initialStreak: number;
  initialQuestionCount: number;
  totalQuestions: number;
  onSessionComplete: (final: { score: number; bestStreak: number; questions: number }) => void;
  onChangeTopic: () => void;
}

export default function CodeEditor({
  initialProblem,
  topic,
  initialScore,
  initialStreak,
  initialQuestionCount,
  totalQuestions,
  onSessionComplete,
  onChangeTopic,
}: Props) {
  const [problem, setProblem] = useState<Problem>(initialProblem);
  const [currentTopic, setCurrentTopic] = useState(topic);
  const [language, setLanguage] = useState<Lang>("python");
  const [code, setCode] = useState(initialProblem.function_signature.python);
  const [score, setScore] = useState(initialScore);
  const [streak, setStreak] = useState(initialStreak);
  const [bestStreak, setBestStreak] = useState(initialStreak);
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [questionCount, setQuestionCount] = useState(initialQuestionCount);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerResponse | null>(null);
  const [runResults, setRunResults] = useState<RunCodeResponse | null>(null);
  const [busy, setBusy] = useState<"submit" | "run" | "hint" | "explain" | "next" | "viz" | null>(null);
  const [weakBanner, setWeakBanner] = useState(false);
  const [vizOpen, setVizOpen] = useState(false);
  const [vizData, setVizData] = useState<VizData | null>(null);

  // When language changes, swap template (only if user hasn't customized)
  useEffect(() => {
    setCode(problem.function_signature[language] ?? "");
  }, [language, problem]);

  const switchLang = (l: Lang) => {
    if (
      code.trim() !== (problem.function_signature[language] ?? "").trim() &&
      !confirm("Switch language? Your code will be reset to the template.")
    ) return;
    setLanguage(l);
  };

  const reset = () => setCode(problem.function_signature[language] ?? "");

  const requestHint = async () => {
    const next = Math.min(hintLevel + 1, 3);
    setBusy("hint");
    try {
      const r = await tutorCall<{ hint: string }>("hint", { hint_level: next });
      setHintLevel(next);
      setHintText(r.hint);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const requestExplanation = async () => {
    setBusy("explain");
    try {
      const r = await tutorCall<{ explanation: string }>("explain", { user_answer: code });
      setExplanation(r.explanation);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const requestVisualization = async () => {
    setVizOpen(true);
    if (vizData) return;
    setBusy("viz");
    try {
      const r = await tutorCall<VizData>("visualize");
      setVizData(r);
    } catch (e: any) {
      toast.error(e.message);
      setVizOpen(false);
    } finally {
      setBusy(null);
    }
  };

  const runCode = async () => {
    setBusy("run");
    setRunResults(null);
    try {
      const r = await tutorCall<RunCodeResponse>("run-code", {
        code,
        language,
        question: problem.description,
        test_cases: problem.test_cases,
      });
      setRunResults(r);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const submit = async () => {
    setBusy("submit");
    setFeedback(null);
    try {
      const r = await tutorCall<AnswerResponse>("answer", { answer: code });
      setFeedback(r);
      setScore(r.score);
      setStreak(r.streak);
      setBestStreak(r.best_streak);
      setLevel(r.current_level);
      setWeakBanner(r.weak_topic_flag);
      if (r.auto_hint) {
        setHintText(r.auto_hint);
        setHintLevel(Math.max(hintLevel, 2));
      }
      if (r.auto_explanation) {
        setExplanation(r.auto_explanation);
        toast.info("Adapting difficulty for you — next one will be easier.", { duration: 3500 });
      }
      // Toast streak / level events
      if (r.is_correct && r.streak >= 3) toast.success(`🔥 ${r.streak} in a row!`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const nextProblem = async () => {
    if (questionCount >= totalQuestions) {
      onSessionComplete({ score, bestStreak, questions: questionCount });
      return;
    }
    setBusy("next");
    try {
      const p = await tutorCall<Problem>("generate-problem", { topic: currentTopic });
      setProblem(p);
      setCurrentTopic(p.topic);
      setCode(p.function_signature[language] ?? "");
      setHintLevel(0);
      setHintText(null);
      setExplanation(null);
      setFeedback(null);
      setRunResults(null);
      setVizData(null);
      setVizOpen(false);
      setQuestionCount((q) => q + 1);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const difficultyBadge = useMemo(() => {
    const lvl = (problem.level ?? "beginner").toLowerCase();
    const cls =
      lvl === "advanced"
        ? "bg-success/20 text-success border-success/40"
        : lvl === "intermediate"
        ? "bg-hint/20 text-hint border-hint/40"
        : "bg-primary/20 text-primary border-primary/40";
    return <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${cls}`}>{lvl}</span>;
  }, [problem.level]);

  return (
    <div className="min-h-screen flex flex-col bg-mesh">
      {/* Top navbar */}
      <nav className="sticky top-0 z-30 glass-strong border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onChangeTopic} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-primary/20">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="hidden sm:inline font-black text-xl tracking-tight text-white uppercase">DSA Tutor</span>
          </button>
          <div className="h-6 w-px bg-white/10" />
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-primary-foreground/80 tracking-widest uppercase">{currentTopic}</span>
        </div>

        <div className="flex-1 max-w-xl px-8">
          <ProgressBar
            score={score}
            streak={streak}
            level={level}
            questionCount={questionCount}
            totalQuestions={totalQuestions}
          />
        </div>

        <div className="flex items-center gap-6 text-sm font-bold">
          <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
            <span className="text-xl">🔥</span>
            <span className="text-white">{streak}</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
            <span className="text-xl">⭐</span>
            <span className="text-white">{score}</span>
          </motion.div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden p-6 gap-6 max-w-[1800px] w-full mx-auto">
        {/* LEFT — problem panel */}
        <section className="flex-1 glass-panel p-8 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-black text-white">{problem.title}</h2>
              {difficultyBadge}
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {["FAANG", "Popular", "Mock Interview"].map((c) => (
                <span key={c} className="text-[10px] font-bold px-3 py-1 rounded-full bg-white/5 text-slate-400 border border-white/5 uppercase tracking-tighter">{c}</span>
              ))}
            </div>
          </div>

          {weakBanner && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 px-6 py-4 rounded-2xl border border-hint/30 bg-hint/5 text-sm flex items-start gap-4"
            >
              <AlertTriangle className="w-5 h-5 text-hint flex-shrink-0" />
              <p className="text-slate-300">Agent detected weakness here. Adapting difficulty for you...</p>
            </motion.div>
          )}

          <div className="prose prose-invert max-w-none mb-8">
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-lg">{problem.description}</p>
          </div>

          <div className="mt-auto space-y-4">
            {hintText && <HintBox hint={hintText} level={hintLevel} />}
            {explanation && <ExplanationBox explanation={explanation} />}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={requestHint}
                disabled={!!busy || hintLevel >= 3}
                className="px-6 py-3.5 rounded-2xl border border-hint/30 text-hint hover:bg-hint/10 transition-all flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-xs disabled:opacity-40"
              >
                {busy === "hint" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                {hintLevel >= 3 ? "Limit Reached" : `Hint ${hintLevel ? `(${hintLevel + 1}/3)` : ""}`}
              </button>
              <button
                onClick={requestExplanation}
                disabled={!!busy}
                className="px-6 py-3.5 rounded-2xl border border-accent/30 text-accent hover:bg-accent/10 transition-all flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-xs disabled:opacity-40"
              >
                {busy === "explain" ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                Full Logic
              </button>
            </div>

            <button
              onClick={requestVisualization}
              disabled={!!busy}
              className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-accent to-primary text-primary-foreground font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-accent/20"
            >
              {busy === "viz" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
              Visualize Solution
            </button>
          </div>
        </section>

        {/* RIGHT — editor + tests */}
        <section className="flex-[1.2] flex flex-col gap-6 overflow-hidden">
          {/* Editor Header */}
          <div className="glass-panel p-2 flex items-center justify-between">
            <div className="flex gap-1 p-1">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => switchLang(l)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    language === l
                      ? "bg-primary text-primary-foreground glow-primary"
                      : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  {LANG_LABEL[l]}
                </button>
              ))}
            </div>
            <button
              onClick={reset}
              className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Monaco Container */}
          <div className="flex-1 glass-panel overflow-hidden border border-white/5 relative group">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            <Editor
              height="100%"
              language={language === "cpp" ? "cpp" : language}
              value={code}
              onChange={(v) => setCode(v ?? "")}
              theme="vs-dark"
              options={{
                fontSize: 16,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 20 },
                fontFamily: "'JetBrains Mono', monospace",
                backgroundColor: "transparent",
              }}
            />
          </div>

          {/* Test Results */}
          <div className="glass-panel p-6 max-h-[300px] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Execution Results</h3>
              {runResults && (
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${runResults.overall_correct ? 'bg-success/10 border-success/30 text-success' : 'bg-destructive/10 border-destructive/30 text-destructive'}`}>
                  {runResults.overall_correct ? 'PASSED' : 'FAILED'}
                </span>
              )}
            </div>

            {!runResults ? (
              <div className="flex flex-col gap-3">
                {problem.test_cases.slice(0, 2).map((t, i) => (
                  <div key={i} className="rounded-xl bg-white/5 border border-white/5 p-4 font-mono text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div><span className="text-slate-500 block text-[10px] mb-1">INPUT</span> <span className="text-slate-200">{t.input}</span></div>
                      <div><span className="text-slate-500 block text-[10px] mb-1">EXPECTED</span> <span className="text-primary">{t.expected_output}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {runResults.test_results.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`rounded-xl p-4 border ${
                      r.passed ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold ${r.passed ? 'text-success' : 'text-destructive'}`}>
                        {r.passed ? "✓ Test Case Passed" : "✗ Test Case Failed"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                      <div><span className="text-slate-500 block mb-1 uppercase">Input</span> <span className="truncate block">{r.input}</span></div>
                      <div><span className="text-slate-500 block mb-1 uppercase">Expected</span> <span className="truncate block">{r.expected}</span></div>
                      <div><span className="text-slate-500 block mb-1 uppercase">Got</span> <span className={`${r.passed ? 'text-success' : 'text-destructive'} truncate block`}>{r.got}</span></div>
                    </div>
                  </motion.div>
                ))}
                <div className="pt-2 border-t border-white/5 mt-4">
                   <p className="text-xs text-slate-400 leading-relaxed font-medium">
                     <span className="text-primary font-bold">Feedback:</span> {runResults.feedback}
                   </p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              onClick={runCode}
              disabled={!!busy}
              className="flex-1 px-8 py-5 rounded-3xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-sm hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3 disabled:opacity-40"
            >
              {busy === "run" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 text-success" />}
              Run Code
            </button>
            <button
              onClick={submit}
              disabled={!!busy}
              className="flex-[1.5] px-8 py-5 rounded-3xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 glow-primary disabled:opacity-50"
            >
              {busy === "submit" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Submit Solution
            </button>
          </div>

          <AnimatePresence>
            {feedback && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <FeedbackCard
                  isCorrect={feedback.is_correct}
                  feedback={feedback.feedback}
                  optimalComplexity={feedback.optimal_complexity}
                  onNext={nextProblem}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {vizOpen && (
        <Visualizer
          loading={busy === "viz"}
          data={vizData}
          onClose={() => setVizOpen(false)}
        />
      )}
    </div>
  );
}
