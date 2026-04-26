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
    <main className="min-h-screen w-full px-6 py-12 flex flex-col items-center">
      <header className="text-center max-w-2xl mb-8 animate-fade-in-up">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-explain flex items-center justify-center glow-primary">
          <Brain className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-2">Placement Round</h1>
        <p className="text-muted-foreground">5 quick questions so the agent knows where to start you.</p>
      </header>

      <div className="w-full max-w-2xl mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Question {idx + 1} of {questions.length}</span>
          <span className="capitalize">{q.difficulty} · {q.topic}</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-explain transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <section key={idx} className="glass rounded-2xl p-7 max-w-2xl w-full animate-fade-in-up">
        <h2 className="text-xl font-semibold mb-5 leading-relaxed">{q.question}</h2>
        <div className="space-y-2.5">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correct_index;
            const isPicked = i === picked;
            let cls = "border-border hover:border-primary/60 hover:bg-primary/5";
            if (revealed) {
              if (isCorrect) cls = "border-success/60 bg-success/10 text-success";
              else if (isPicked) cls = "border-destructive/60 bg-destructive/10 text-destructive";
              else cls = "border-border opacity-50";
            }
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={revealed}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${cls}`}
              >
                <span className="w-7 h-7 rounded-lg bg-secondary/60 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt}</span>
                {revealed && isCorrect && <Check className="w-5 h-5 text-success" />}
                {revealed && isPicked && !isCorrect && <X className="w-5 h-5 text-destructive" />}
              </button>
            );
          })}
        </div>

        {revealed && q.explanation && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-explain/10 border border-explain/30 text-sm text-foreground/90 animate-slide-down">
            <span className="font-bold text-explain">Why: </span>{q.explanation}
          </div>
        )}

        <button
          onClick={next}
          disabled={!revealed || submitting}
          className="mt-5 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 active:scale-[0.98] transition-all glow-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Calibrating your level...</>
            : isLast ? "See My Level →" : "Next Question →"}
        </button>
      </section>

      <button onClick={onSkip} className="mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors">
        Skip placement
      </button>
    </main>
  );
}
