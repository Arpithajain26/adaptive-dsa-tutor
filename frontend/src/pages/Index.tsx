import { useState } from "react";
import PlacementQuiz from "@/components/PlacementQuiz";
import TopicSelector from "@/components/TopicSelector";
import CodeEditor from "@/components/CodeEditor";
import SessionComplete from "@/components/SessionComplete";
import { resetSessionId, tutorCall, type Problem } from "@/lib/tutor-api";
import { toast } from "sonner";

type Screen =
  | { name: "placement" }
  | { name: "select" }
  | { name: "editor"; topic: string; problem: Problem }
  | { name: "done"; score: number; bestStreak: number; questions: number };

const TOTAL_QUESTIONS = 10;
const PLACEMENT_KEY = "dsa_tutor_placed";

const Index = () => {
  const [screen, setScreen] = useState<Screen>(() =>
    localStorage.getItem(PLACEMENT_KEY) ? { name: "select" } : { name: "placement" }
  );
  const [recommendation, setRecommendation] = useState<{ suggested_topic: string; reason: string } | undefined>();
  const [weakest, setWeakest] = useState<string | undefined>();

  const goSelect = () => setScreen({ name: "select" });

  const handlePlacementDone = (
    level: "beginner" | "intermediate" | "advanced",
    stats: { correct: number; total: number }
  ) => {
    localStorage.setItem(PLACEMENT_KEY, level);
    const emoji = level === "advanced" ? "🚀" : level === "intermediate" ? "⚡" : "🌱";
    toast.success(`${emoji} You're starting at ${level.toUpperCase()} (${stats.correct}/${stats.total} correct)`, {
      duration: 4000,
    });
    goSelect();
  };

  const handleProblemReady = (topic: string, problem: Problem) => {
    setScreen({ name: "editor", topic, problem });
  };

  const handleSessionComplete = async (final: { score: number; bestStreak: number; questions: number }) => {
    try {
      const [progress, suggestion] = await Promise.all([
        tutorCall<any>("progress"),
        tutorCall<{ suggested_topic: string; reason: string }>("suggest-topic"),
      ]);
      setWeakest(progress.weak_topics?.[0]);
      setRecommendation(suggestion);
    } catch {
      /* non-fatal */
    }
    setScreen({ name: "done", ...final });
  };

  const fullReset = async () => {
    resetSessionId();
    localStorage.removeItem(PLACEMENT_KEY);
    await tutorCall("reset");
    setScreen({ name: "placement" });
  };

  return (
    <div className="min-h-screen w-full">
      {screen.name === "placement" && (
        <PlacementQuiz onComplete={handlePlacementDone} onSkip={() => { localStorage.setItem(PLACEMENT_KEY, "beginner"); goSelect(); }} />
      )}
      {screen.name === "select" && <TopicSelector onProblemReady={handleProblemReady} />}
      {screen.name === "editor" && (
        <CodeEditor
          initialProblem={screen.problem}
          topic={screen.topic}
          initialScore={0}
          initialStreak={0}
          initialQuestionCount={1}
          totalQuestions={TOTAL_QUESTIONS}
          onSessionComplete={handleSessionComplete}
          onChangeTopic={goSelect}
        />
      )}
      {screen.name === "done" && (
        <SessionComplete
          score={screen.score}
          bestStreak={screen.bestStreak}
          questionsAnswered={screen.questions}
          topicsDone={1}
          weakestTopic={weakest}
          recommendation={recommendation}
          onPracticeAgain={fullReset}
          onChangeTopic={fullReset}
        />
      )}
    </div>
  );
};

export default Index;
