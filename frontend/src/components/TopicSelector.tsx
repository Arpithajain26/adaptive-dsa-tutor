import { useState } from "react";
import { tutorCall, type Problem } from "@/lib/tutor-api";
import { Loader2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

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
  const userLevel = localStorage.getItem("dsa_tutor_placed") || "beginner";

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
    <main className="min-h-screen w-full px-6 py-16 flex flex-col items-center bg-mesh">
      <header className="text-center max-w-3xl mb-16 animate-fade-in-up">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            Neural Engine Active
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
            Current Rank: {userLevel}
          </div>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter uppercase leading-none">
          Select <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Objective</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
          The agent has mapped these domains to your current profile. Select a node to begin neural training.
        </p>
      </header>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 px-6 py-4 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive font-bold text-sm max-w-xl text-center"
        >
          {error}
        </motion.div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
        {TOPICS.map((t, i) => {
          const isLoading = loadingTopic === t.key;
          const disabled = !!loadingTopic;
          return (
            <motion.button
              key={t.key}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => start(t.key)}
              disabled={disabled}
              className={`group glass-panel p-8 text-left transition-all duration-500
                hover:border-primary/40 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]
                disabled:opacity-50 disabled:cursor-not-allowed
                animate-fade-in-up flex flex-col h-full`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="text-5xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                {t.emoji}
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">{t.key}</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed flex-1">{t.desc}</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 border border-white/5">
                  {t.difficulty}
                </span>
                <span className="text-primary text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Link Active
                    </>
                  ) : (
                    <>Initialize <ChevronRight className="w-4 h-4" /></>
                  )}
                </span>
              </div>
            </motion.button>
          );
        })}
      </section>

      <footer className="mt-24 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
        Adaptive Learning Protocol v4.0.2
      </footer>
    </main>
  );
}
