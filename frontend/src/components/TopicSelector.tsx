import { useState } from "react";
import { tutorCall, type Problem } from "@/lib/tutor-api";
import { Loader2 } from "lucide-react";

const TOPICS = [
  { key: "Arrays", emoji: "🔢", desc: "Master array manipulation", difficulty: "Beginner Friendly" },
  { key: "Linked Lists", emoji: "🔗", desc: "Traverse and connect nodes", difficulty: "Intermediate" },
  { key: "Trees", emoji: "🌳", desc: "Conquer hierarchical structures", difficulty: "Intermediate" },
  { key: "Sorting", emoji: "📊", desc: "Order from chaos", difficulty: "Beginner Friendly" },
  { key: "Searching", emoji: "🔍", desc: "Find the needle in haystack", difficulty: "Beginner Friendly" },
];

interface Props {
  onProblemReady: (topic: string, problem: Problem) => void;
}

export default function TopicSelector({ onProblemReady }: Props) {
  const [loadingTopic, setLoadingTopic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async (topic: string) => {
    setError(null);
    setLoadingTopic(topic);
    try {
      const problem = await tutorCall<Problem>("generate-problem", { topic });
      onProblemReady(topic, problem);
    } catch (e: any) {
      setError(e.message || "Failed to generate problem");
      setLoadingTopic(null);
    }
  };

  return (
    <main className="min-h-screen w-full px-6 py-16 flex flex-col items-center">
      <header className="text-center max-w-3xl mb-14 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-6 text-sm text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          AI-powered adaptive learning
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gradient mb-4">
          Choose Your Battle
        </h1>
        <p className="text-lg text-muted-foreground">
          Not a chatbot. Your personal DSA coach that learns how <span className="text-primary font-semibold">YOU</span> think.
          Start anywhere — the agent adapts.
        </p>
      </header>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg glass border border-destructive/40 text-destructive animate-slide-down max-w-xl">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
        {TOPICS.map((t, i) => {
          const isLoading = loadingTopic === t.key;
          const disabled = !!loadingTopic;
          return (
            <button
              key={t.key}
              onClick={() => start(t.key)}
              disabled={disabled}
              className={`group glass rounded-2xl p-7 text-left transition-all duration-300
                hover:scale-[1.04] hover:border-primary/60 hover:shadow-[0_0_32px_hsl(189_100%_50%/0.35)]
                disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed
                animate-fade-in-up`}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1">
                {t.emoji}
              </div>
              <h3 className="text-2xl font-bold mb-1.5">{t.key}</h3>
              <p className="text-muted-foreground mb-4">{t.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs px-2.5 py-1 rounded-full bg-secondary/60 text-foreground/80 border border-border">
                  {t.difficulty}
                </span>
                <span className="text-primary text-sm font-semibold inline-flex items-center gap-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>Start Challenge →</>
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </section>

      <footer className="mt-16 text-xs text-muted-foreground/70">
        🧠 Built for hackathon — adaptive difficulty · per-topic level tracking · auto hints & explanations
      </footer>
    </main>
  );
}
