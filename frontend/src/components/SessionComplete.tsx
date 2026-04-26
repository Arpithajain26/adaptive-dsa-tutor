import { Trophy } from "lucide-react";

interface Props {
  score: number;
  bestStreak: number;
  questionsAnswered: number;
  topicsDone: number;
  weakestTopic?: string;
  recommendation?: { suggested_topic: string; reason: string };
  onPracticeAgain: () => void;
  onChangeTopic: () => void;
}

export default function SessionComplete({
  score,
  bestStreak,
  questionsAnswered,
  topicsDone,
  weakestTopic,
  recommendation,
  onPracticeAgain,
  onChangeTopic,
}: Props) {
  return (
    <main className="min-h-screen w-full px-6 py-16 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full text-center animate-fade-in-up">
        <div className="text-8xl mb-4 animate-float">🏆</div>
        <h1 className="text-5xl font-bold text-gradient mb-3">Session Complete!</h1>
        <p className="text-muted-foreground mb-10">You powered through {questionsAnswered} problems. Let's see how you did.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Total Score" value={score} icon="⭐" />
          <Stat label="Best Streak" value={bestStreak} icon="🔥" />
          <Stat label="Topics Done" value={topicsDone} icon="📚" />
          <Stat label="Questions" value={questionsAnswered} icon="✅" />
        </div>

        {weakestTopic && (
          <div className="glass rounded-2xl p-5 mb-4 border border-hint/30 text-left">
            <div className="text-xs font-bold uppercase tracking-wide text-hint mb-1">Weakest Topic</div>
            <div className="text-xl font-semibold">{weakestTopic}</div>
          </div>
        )}

        {recommendation && (
          <div className="glass rounded-2xl p-5 mb-8 border border-primary/40 text-left">
            <div className="text-xs font-bold uppercase tracking-wide text-primary mb-1">Agent Recommends</div>
            <div className="text-xl font-semibold mb-1">Focus on {recommendation.suggested_topic} next →</div>
            <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onPracticeAgain}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 active:scale-[0.98] transition-all glow-primary"
          >
            Practice Again
          </button>
          <button
            onClick={onChangeTopic}
            className="px-6 py-3 rounded-xl glass font-semibold hover:border-primary/60 transition-all"
          >
            Change Topic
          </button>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-3xl mb-1">{icon}</div>
      <div className="text-3xl font-bold text-gradient">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}
