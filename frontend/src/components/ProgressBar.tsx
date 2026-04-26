import { useEffect, useState } from "react";

interface Props {
  score: number;
  streak: number;
  level: "beginner" | "intermediate" | "advanced";
  questionCount: number;
  totalQuestions: number;
}

const LEVEL_META = {
  beginner: { label: "Beginner", color: "from-sky-400 to-blue-500" },
  intermediate: { label: "Intermediate", color: "from-amber-400 to-yellow-500" },
  advanced: { label: "Advanced", color: "from-emerald-400 to-green-500" },
};

export default function ProgressBar({ score, streak, level, questionCount, totalQuestions }: Props) {
  const meta = LEVEL_META[level];
  const pct = Math.min(100, (questionCount / totalQuestions) * 100);
  const [pulseStreak, setPulseStreak] = useState(false);
  const [pulseScore, setPulseScore] = useState(false);

  useEffect(() => {
    if (streak === 0) return;
    setPulseStreak(true);
    const t = setTimeout(() => setPulseStreak(false), 700);
    return () => clearTimeout(t);
  }, [streak]);

  useEffect(() => {
    if (score === 0) return;
    setPulseScore(true);
    const t = setTimeout(() => setPulseScore(false), 700);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div className="flex-1 max-w-xl flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">{meta.label}</span>
        <span>{questionCount} / {totalQuestions}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary/60 overflow-hidden border border-border">
        <div
          className={`h-full bg-gradient-to-r ${meta.color} transition-all duration-700 ease-out shadow-[0_0_12px_hsl(var(--primary)/0.5)]`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="hidden md:flex items-center gap-3 text-xs">
        <span className={`inline-flex items-center gap-1 transition-transform ${pulseStreak ? "scale-125" : ""}`}>
          🔥 <span className="font-bold">{streak}</span>
        </span>
        <span className={`inline-flex items-center gap-1 transition-transform ${pulseScore ? "scale-125" : ""}`}>
          ⭐ <span className="font-bold">{score}</span>
        </span>
      </div>
    </div>
  );
}
