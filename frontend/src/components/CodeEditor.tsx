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
    <div className="min-h-screen flex flex-col">
      {/* Top navbar */}
      <nav className="sticky top-0 z-30 glass-strong border-b border-border px-5 py-3 flex items-center gap-5">
        <button onClick={onChangeTopic} className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-explain flex items-center justify-center group-hover:scale-110 transition-transform">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline font-bold tracking-tight">DSA Tutor</span>
        </button>
        <span className="text-xs px-2.5 py-1 rounded-full bg-secondary/60 border border-border">{currentTopic}</span>
        <ProgressBar
          score={score}
          streak={streak}
          level={level}
          questionCount={questionCount}
          totalQuestions={totalQuestions}
        />
        <div className="hidden md:flex items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1">🔥 <span className="font-bold">{streak}</span></span>
          <span className="inline-flex items-center gap-1">⭐ <span className="font-bold">{score}</span></span>
        </div>
      </nav>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 p-4 max-w-[1600px] w-full mx-auto">
        {/* LEFT — problem panel */}
        <section className="lg:col-span-2 glass rounded-2xl p-6 overflow-y-auto max-h-[calc(100vh-100px)] animate-fade-in">
          <h2 className="text-2xl font-bold mb-2">{problem.title}</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/40">{currentTopic}</span>
            {difficultyBadge}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {["Google", "Amazon", "Microsoft"].map((c) => (
              <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">{c}</span>
            ))}
          </div>

          {weakBanner && (
            <div className="mb-4 px-4 py-2.5 rounded-xl border border-hint/40 bg-hint/10 text-sm flex items-start gap-2 animate-slide-down">
              <AlertTriangle className="w-4 h-4 text-hint flex-shrink-0 mt-0.5" />
              <span>Agent detected weakness here. Adapting difficulty for you...</span>
            </div>
          )}

          <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed mb-6">{problem.description}</p>

          {problem.examples.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-2">Examples</h3>
              <div className="space-y-3">
                {problem.examples.map((ex, i) => (
                  <div key={i} className="rounded-xl bg-background/50 border border-border p-3 font-mono text-sm">
                    <div><span className="text-muted-foreground">Input:</span> {ex.input}</div>
                    <div><span className="text-muted-foreground">Output:</span> {ex.output}</div>
                    {ex.explanation && (
                      <div className="text-muted-foreground text-xs mt-1.5 not-italic">→ {ex.explanation}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {problem.constraints.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-2">Constraints</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-foreground/80 font-mono">
                {problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          {hintText && (
            <div className="mb-4">
              <HintBox hint={hintText} level={hintLevel} />
            </div>
          )}
          {explanation && (
            <div className="mb-4">
              <ExplanationBox explanation={explanation} />
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button
              onClick={requestHint}
              disabled={!!busy || hintLevel >= 3}
              className="flex-1 px-4 py-2.5 rounded-xl border border-hint/50 text-hint hover:bg-hint/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy === "hint" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
              {hintLevel >= 3 ? "Max hints used" : `Get Hint ${hintLevel ? `(${hintLevel + 1}/3)` : ""}`}
            </button>
            <button
              onClick={requestExplanation}
              disabled={!!busy}
              className="flex-1 px-4 py-2.5 rounded-xl border border-explain/50 text-explain hover:bg-explain/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy === "explain" ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              Explain
            </button>
          </div>

          {/* Visualizer — always visible */}
          <button
            onClick={requestVisualization}
            disabled={!!busy}
            className="mt-3 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-explain to-primary text-primary-foreground font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:brightness-110 active:scale-[0.98] shadow-[0_0_24px_hsl(var(--explain)/0.4)] hover:shadow-[0_0_32px_hsl(var(--explain)/0.6)]"
          >
            {busy === "viz" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
            🎬 Visualize Algorithm
          </button>
        </section>

        {/* RIGHT — editor + tests */}
        <section className="lg:col-span-3 flex flex-col gap-4 max-h-[calc(100vh-100px)] overflow-y-auto">
          {/* Language pills */}
          <div className="glass rounded-2xl p-2 flex gap-1">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => switchLang(l)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                  language === l
                    ? "bg-primary text-primary-foreground glow-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {LANG_LABEL[l]}
              </button>
            ))}
          </div>

          {/* Monaco */}
          <div className="glass rounded-2xl overflow-hidden border border-border">
            <Editor
              height="350px"
              language={language === "cpp" ? "cpp" : language}
              value={code}
              onChange={(v) => setCode(v ?? "")}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              }}
            />
          </div>

          {/* Test cases */}
          <div className="glass rounded-2xl p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Test Cases</div>
            {!runResults ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-mono">
                  <thead className="text-muted-foreground text-xs">
                    <tr><th className="text-left px-2 py-1">#</th><th className="text-left px-2 py-1">Input</th><th className="text-left px-2 py-1">Expected</th></tr>
                  </thead>
                  <tbody>
                    {problem.test_cases.map((t, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-2 py-2 text-muted-foreground">{i + 1}</td>
                        <td className="px-2 py-2 text-foreground/90">{t.input}</td>
                        <td className="px-2 py-2 text-foreground/90">{t.expected_output}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-2">
                {runResults.test_results.map((r, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-3 text-sm border ${
                      r.passed
                        ? "bg-success/10 border-success/40 text-success"
                        : "bg-destructive/10 border-destructive/40 text-destructive"
                    }`}
                  >
                    <div className="font-semibold">
                      {r.passed ? "✅" : "❌"} Test {i + 1} {r.passed ? "Passed" : "Failed"} → Got: <span className="font-mono">{r.got}</span>
                      {!r.passed && <> · Expected: <span className="font-mono">{r.expected}</span></>}
                    </div>
                    {r.explanation && <div className="text-foreground/70 text-xs mt-1">{r.explanation}</div>}
                  </div>
                ))}
                <div className="text-xs text-muted-foreground pt-1 font-mono">
                  {runResults.time_complexity} · {runResults.space_complexity} — {runResults.feedback}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={runCode}
              disabled={!!busy}
              className="flex-1 px-5 py-3 rounded-xl bg-success text-success-foreground font-semibold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy === "run" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {busy === "run" ? "Analyzing..." : "Run Code"}
            </button>
            <button
              onClick={submit}
              disabled={!!busy}
              className="flex-1 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 glow-primary disabled:opacity-50"
            >
              {busy === "submit" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Submit Solution
            </button>
            <button
              onClick={reset}
              disabled={!!busy}
              className="px-5 py-3 rounded-xl glass hover:border-foreground/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>

          {feedback && (
            <FeedbackCard
              isCorrect={feedback.is_correct}
              feedback={feedback.feedback}
              optimalComplexity={feedback.optimal_complexity}
              onNext={nextProblem}
            />
          )}
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
