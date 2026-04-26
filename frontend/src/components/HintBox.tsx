import { Lightbulb } from "lucide-react";

export default function HintBox({ hint, level }: { hint: string; level?: number }) {
  return (
    <div
      className="rounded-2xl p-5 border border-hint/40 animate-slide-down"
      style={{ background: "var(--gradient-hint)", boxShadow: "var(--glow-hint)" }}
    >
      <div className="flex items-start gap-3">
        <Lightbulb className="w-6 h-6 text-hint flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-hint mb-1">
            Hint {level ? `${level} of 3` : ""}
          </div>
          <p className="text-foreground/95">{hint}</p>
        </div>
      </div>
    </div>
  );
}
