import { useEffect, useState } from "react";
import { Loader2, Brain, Check, X } from "lucide-react";
import { tutorCall } from "@/lib/tutor-api";

type MCQ = {
  question: string;
  options: string[];
  correct_index: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  topic: string;
  explanation: string;
};

interface Props {
  onComplete: (level: "beginner" | "intermediate" | "advanced", stats: { correct: number; total: number }) => void;
  onSkip: () => void;
}

export default function PlacementQuiz({ onComplete, onSkip }: Props) {
  const [questions, setQuestions] = useState<MCQ[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<{ difficulty: string; correct: boolean }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await tutorCall<{ questions: MCQ[] }>("placement-quiz");
        if (!r.questions?.length) throw new Error("Quiz unavailable");
        setQuestions(r.questions);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="glass rounded-2xl p-8 max-w-md text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button onClick={onSkip} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold">
            Skip & Continue
          </button>
        </div>
      </main>
    );
  }

  if (!questions) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Crafting your placement quiz...</p>
        </div>
      </main>
    );
  }

  const q = questions[idx];
  const isLast = idx === questions.length - 1;

  const pick = (i: number) => {
    if (revealed) return;
    setPicked(i);
    setRevealed(true);
    setAnswers((prev) => [...prev, { difficulty: q.difficulty, correct: i === q.correct_index }]);
  };

  const next = async () => {
    if (!isLast) {
      setIdx(idx + 1);
      setPicked(null);
      setRevealed(false);
      return;
    }
    setSubmitting(true);
    try {
      const r = await tutorCall<{ level: "beginner" | "intermediate" | "advanced"; correct: number; total: number }>(
        "submit-placement",
        { answers }
      );
      onComplete(r.level, { correct: r.correct, total: r.total });
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  const pct = ((idx + (revealed ? 1 : 0)) / questions.length) * 100;

  return (
    <main className="min-h-screen w-full px-6 py-12 flex flex-col items-center bg-mesh">
      <header className="text-center max-w-2xl mb-8 animate-fade-in-up">
        <motion.div 
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary"
        >
          <Brain className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tighter uppercase">Assessment</h1>
        <p className="text-slate-400 font-medium">Let's calibrate your path to FAANG mastery.</p>
      </header>

      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
          <span>Module {idx + 1} / {questions.length}</span>
          <span className="text-primary">{q.difficulty}</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5 p-0.5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full shadow-[0_0_12px_rgba(14,165,233,0.4)]"
          />
        </div>
      </div>

      <section key={idx} className="glass-panel p-8 max-w-2xl w-full animate-fade-in-up">
        <h2 className="text-2xl font-bold text-white mb-8 leading-tight">{q.question}</h2>
        <div className="space-y-3">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correct_index;
            const isPicked = i === picked;
            let cls = "border-white/5 hover:border-primary/40 hover:bg-white/5 text-slate-300";
            if (revealed) {
              if (isCorrect) cls = "border-success/40 bg-success/10 text-success glow-success";
              else if (isPicked) cls = "border-destructive/40 bg-destructive/10 text-destructive";
              else cls = "border-white/5 opacity-30";
            }
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={revealed}
                className={`w-full text-left px-6 py-4 rounded-2xl border-2 transition-all flex items-center gap-4 font-medium ${cls}`}
              >
                <span className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-xs font-black flex-shrink-0 border border-white/10 group-hover:bg-primary transition-colors">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt}</span>
                {revealed && isCorrect && <Check className="w-5 h-5" />}
                {revealed && isPicked && !isCorrect && <X className="w-5 h-5" />}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {revealed && q.explanation && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-6 px-6 py-4 rounded-2xl bg-primary/5 border border-primary/20 text-sm text-slate-300"
            >
              <span className="font-black text-primary uppercase text-[10px] tracking-widest block mb-1">Deep Logic</span>
              {q.explanation}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={next}
          disabled={!revealed || submitting}
          className="mt-8 w-full py-5 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all glow-primary disabled:opacity-40 flex items-center justify-center gap-3"
        >
          {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Results...</>
            : isLast ? "Finish Assessment" : "Next Module"}
        </button>
      </section>

      <button onClick={onSkip} className="mt-8 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
        Skip & start at beginner
      </button>
    </main>
  );
}
