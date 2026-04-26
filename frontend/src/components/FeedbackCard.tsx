import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  isCorrect: boolean;
  feedback: string;
  optimalComplexity?: string;
  onNext: () => void;
}

export default function FeedbackCard({ isCorrect, feedback, optimalComplexity, onNext }: Props) {
  if (isCorrect) {
    return (
      <div
        className="rounded-2xl p-6 border border-success/40 animate-slide-down"
        style={{ background: "var(--gradient-correct)", boxShadow: "var(--glow-success)" }}
      >
        <div className="flex items-start gap-4">
          <CheckCircle2 className="w-10 h-10 text-success flex-shrink-0 animate-check-pop" />
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-success mb-1">Correct! 🎉</h3>
            <p className="text-foreground/90 mb-3">{feedback}</p>
            {optimalComplexity && (
              <div className="text-xs text-muted-foreground font-mono px-3 py-1.5 inline-block rounded-md bg-background/40 border border-border">
                Complexity: {optimalComplexity}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onNext}
          className="mt-5 w-full py-3 rounded-xl bg-success text-success-foreground font-semibold hover:brightness-110 active:scale-[0.98] transition-all"
        >
          Next Question →
        </button>
      </div>
    );
  }
  return (
    <div
      className="rounded-2xl p-6 border border-destructive/40 animate-shake"
      style={{ background: "var(--gradient-wrong)", boxShadow: "var(--glow-wrong)" }}
    >
      <div className="flex items-start gap-4">
        <XCircle className="w-10 h-10 text-destructive flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-destructive mb-1">Not quite!</h3>
          <p className="text-foreground/90">{feedback}</p>
        </div>
      </div>
    </div>
  );
}
