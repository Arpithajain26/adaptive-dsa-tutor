import { BookOpen } from "lucide-react";

export default function ExplanationBox({ explanation }: { explanation: string }) {
  return (
    <div
      className="rounded-2xl p-5 border border-explain/40 animate-slide-down"
      style={{ background: "var(--gradient-explain)", boxShadow: "var(--glow-explain)" }}
    >
      <div className="flex items-start gap-3 mb-3">
        <BookOpen className="w-6 h-6 text-explain flex-shrink-0 mt-0.5" />
        <div className="text-xs font-bold uppercase tracking-wide text-explain">Full Explanation</div>
      </div>
      <div className="prose prose-invert prose-sm max-w-none text-foreground/95 whitespace-pre-wrap font-mono text-sm leading-relaxed">
        {explanation}
      </div>
    </div>
  );
}
