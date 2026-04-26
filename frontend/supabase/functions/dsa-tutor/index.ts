// Adaptive DSA Tutor — single edge function routing by `action`.
// Uses Lovable AI Gateway (Gemini) instead of Anthropic; same prompts, same shape.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

// ---------- Session State ----------
type State = {
  current_level: "beginner" | "intermediate" | "advanced";
  current_topic: string;
  score: number;
  streak: number;
  best_streak: number;
  consecutive_wrong: number;
  weak_topics: string[];
  asked_questions: string[];
  last_question: string;
  topic_levels: Record<string, "beginner" | "intermediate" | "advanced">;
  topic_correct: Record<string, number>;
  topic_wrong: Record<string, number>;
  topic_attempts: Record<string, number>;
  question_count: number;
};

const defaultState = (): State => ({
  current_level: "beginner",
  current_topic: "",
  score: 0,
  streak: 0,
  best_streak: 0,
  consecutive_wrong: 0,
  weak_topics: [],
  asked_questions: [],
  last_question: "",
  topic_levels: {},
  topic_correct: {},
  topic_wrong: {},
  topic_attempts: {},
  question_count: 0,
});

async function getSession(session_id: string): Promise<{ state: State; current_problem: any }> {
  const { data } = await admin
    .from("dsa_sessions")
    .select("state, current_problem")
    .eq("session_id", session_id)
    .maybeSingle();
  if (!data) {
    const fresh = defaultState();
    await admin.from("dsa_sessions").insert({ session_id, state: fresh, current_problem: null });
    return { state: fresh, current_problem: null };
  }
  return { state: { ...defaultState(), ...(data.state as State) }, current_problem: data.current_problem };
}

async function saveSession(session_id: string, state: State, current_problem?: any) {
  const update: any = { state, updated_at: new Date().toISOString() };
  if (current_problem !== undefined) update.current_problem = current_problem;
  await admin.from("dsa_sessions").update(update).eq("session_id", session_id);
}

function recordAnswer(state: State, topic: string, isCorrect: boolean): State {
  state.topic_attempts[topic] = (state.topic_attempts[topic] ?? 0) + 1;
  if (isCorrect) {
    state.score += 1;
    state.streak += 1;
    state.best_streak = Math.max(state.best_streak, state.streak);
    state.consecutive_wrong = 0;
    state.topic_correct[topic] = (state.topic_correct[topic] ?? 0) + 1;
    // Level up topic after 3 correct in a row at current level
    if (state.topic_correct[topic] >= 3) {
      const cur = state.topic_levels[topic] ?? "beginner";
      if (cur === "beginner") state.topic_levels[topic] = "intermediate";
      else if (cur === "intermediate") state.topic_levels[topic] = "advanced";
      state.topic_correct[topic] = 0;
    }
    if (state.score >= 8) state.current_level = "advanced";
    else if (state.score >= 4) state.current_level = "intermediate";
  } else {
    state.streak = 0;
    state.consecutive_wrong += 1;
    state.topic_wrong[topic] = (state.topic_wrong[topic] ?? 0) + 1;
    if (state.consecutive_wrong >= 2 && !state.weak_topics.includes(topic)) {
      state.weak_topics.push(topic);
    }
    if (state.topic_wrong[topic] >= 3) {
      const cur = state.topic_levels[topic] ?? "beginner";
      if (cur === "advanced") state.topic_levels[topic] = "intermediate";
      else if (cur === "intermediate") state.topic_levels[topic] = "beginner";
      state.topic_wrong[topic] = 0;
    }
  }
  return state;
}

function topicAccuracy(state: State): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of Object.keys(state.topic_attempts)) {
    const att = state.topic_attempts[t] || 0;
    const cor = state.topic_correct[t] || 0;
    // topic_correct gets reset on level up, so estimate from attempts/wrong
    const wrong = state.topic_wrong[t] || 0;
    const correct = Math.max(0, att - wrong);
    out[t] = att ? Math.round((correct / att) * 100) : 0;
  }
  return out;
}

// ---------- AI Helpers ----------
function extractJson(text: string): any {
  // Strip code fences
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        /* fall through */
      }
    }
    throw new Error("Failed to parse AI JSON output");
  }
}

async function aiCall(system: string, user: string, max_tokens = 2000): Promise<string> {
  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens,
    }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    if (resp.status === 429) throw new Error("AI rate limit reached. Please wait a moment and try again.");
    if (resp.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
    throw new Error(`AI gateway error ${resp.status}: ${body}`);
  }
  const j = await resp.json();
  return j.choices?.[0]?.message?.content ?? "";
}

async function aiJson(system: string, user: string, max_tokens = 2000): Promise<any> {
  const text = await aiCall(
    system + "\n\nReply with ONLY valid JSON. No prose, no markdown fences.",
    user,
    max_tokens
  );
  return extractJson(text);
}

// ---------- Agent Methods ----------
async function generateProblem(topic: string, level: string, asked: string[]) {
  const system = `You are an expert DSA tutor that creates LeetCode-style problems.
Generate a ${level} level problem on the topic: ${topic}.
Avoid these previously-asked titles: ${asked.slice(-15).join(", ") || "none"}.
Return EXACTLY this JSON shape:
{
  "title": "string",
  "description": "clear problem statement (2-4 paragraphs)",
  "examples": [{"input": "string", "output": "string", "explanation": "string"}],
  "constraints": ["string", ...],
  "function_signature": {
    "python": "def solution(...):\\n    # Write your code here\\n    pass",
    "java": "class Solution {\\n    public ... solution(...) {\\n        // Write your code here\\n        return ...;\\n    }\\n}",
    "cpp": "class Solution {\\npublic:\\n    ... solution(...) {\\n        // Write your code here\\n        return ...;\\n    }\\n};"
  },
  "test_cases": [
    {"input": "string", "expected_output": "string", "explanation": "string"}
  ],
  "hints": ["vague concept hint", "data structure hint", "detailed logic hint"],
  "optimal_solution": {
    "approach": "string",
    "time_complexity": "O(...)",
    "space_complexity": "O(...)",
    "explanation": "string"
  },
  "topic": "${topic}",
  "level": "${level}"
}
Provide 2-3 examples and 3 test cases. Make the problem genuinely solvable and well-specified.`;
  const data = await aiJson(system, `Generate a fresh problem.`, 2500);
  // Defensive defaults
  data.examples = data.examples ?? [];
  data.constraints = data.constraints ?? [];
  data.test_cases = data.test_cases ?? [];
  data.hints = data.hints ?? [];
  data.function_signature = data.function_signature ?? {
    python: "def solution():\n    pass",
    java: "class Solution {}",
    cpp: "class Solution {};",
  };
  data.topic = topic;
  data.level = level;
  return data;
}

async function evaluateAnswer(question: string, answer: string, topic: string, level: string) {
  const system = `You are an expert DSA code reviewer. Evaluate the student's submitted code for the problem.
Judge whether the LOGIC is correct (you don't execute it). Be encouraging but accurate.
Return JSON:
{
  "is_correct": true/false,
  "feedback": "1-3 sentence explanation",
  "hint": "next-step hint or null if correct",
  "confidence_score": 0-100,
  "optimal_complexity": "O(...) time · O(...) space"
}`;
  const user = `PROBLEM:\n${question}\n\nTOPIC: ${topic}\nLEVEL: ${level}\n\nSTUDENT CODE:\n${answer}`;
  const data = await aiJson(system, user, 600);
  return {
    is_correct: !!data.is_correct,
    feedback: String(data.feedback ?? ""),
    hint: data.hint ?? null,
    confidence_score: Number(data.confidence_score ?? 0),
    optimal_complexity: String(data.optimal_complexity ?? ""),
  };
}

async function progressiveHint(question: string, topic: string, level: string, hint_level: number) {
  const tier =
    hint_level <= 1
      ? "vague conceptual nudge — point at the category of approach without naming the algorithm"
      : hint_level === 2
      ? "specific data structure hint — name the data structure or pattern to use"
      : "detailed logic hint — outline the step-by-step algorithm without writing code";
  const system = `You are a DSA tutor giving progressive hints. Give a ${tier} for the problem.
Return JSON: {"hint": "string"}`;
  const user = `PROBLEM:\n${question}\n\nTOPIC: ${topic}\nLEVEL: ${level}`;
  const data = await aiJson(system, user, 300);
  return { hint: String(data.hint ?? "") };
}

async function getExplanation(question: string, user_answer: string) {
  const system = `You are a DSA tutor. Explain the optimal solution to the problem in clear markdown.
Include: ## Approach, ## Step-by-step, ## Complexity, and a fenced code block with a Python implementation.
Return JSON: {"explanation": "<markdown string>"}`;
  const user = `PROBLEM:\n${question}\n\nWHAT THE STUDENT TRIED:\n${user_answer || "(no submission)"}`;
  const data = await aiJson(system, user, 1500);
  return { explanation: String(data.explanation ?? "") };
}

async function analyzeCode(code: string, language: string, test_cases: any[], question: string) {
  const system = `You are a code execution simulator. Trace the student's ${language} code mentally on each test case and predict output. Don't actually run anything.
Return JSON:
{
  "test_results": [
    {"input": "string", "expected": "string", "got": "string", "passed": true/false, "explanation": "1 sentence"}
  ],
  "overall_correct": true/false,
  "time_complexity": "O(...)",
  "space_complexity": "O(...)",
  "feedback": "1-2 sentence overall feedback",
  "suggestion": "1 sentence improvement suggestion"
}`;
  const user = `PROBLEM:\n${question}\n\nLANGUAGE: ${language}\n\nCODE:\n${code}\n\nTEST CASES:\n${JSON.stringify(test_cases, null, 2)}`;
  const data = await aiJson(system, user, 1500);
  data.test_results = data.test_results ?? [];
  return data;
}

async function suggestNextTopic(topic_accuracy: Record<string, number>) {
  const system = `You are a learning coach. Given topic accuracy %, suggest the next topic the student should focus on (the weakest one with attempts, OR the next logical topic if all strong).
Topics available: Arrays, Linked Lists, Trees, Sorting, Searching.
Return JSON: {"suggested_topic": "string", "reason": "string", "focus_areas": ["string", ...]}`;
  const data = await aiJson(system, `Topic accuracy:\n${JSON.stringify(topic_accuracy, null, 2)}`, 400);
  return data;
}

// 5-question MCQ placement quiz spanning core DSA concepts.
async function generatePlacementQuiz() {
  const system = `You are a DSA placement examiner. Generate EXACTLY 5 multiple-choice questions to assess a student's level (beginner / intermediate / advanced).
Mix difficulties: 2 beginner (basic data structures, Big-O basics), 2 intermediate (sorting, recursion, BFS/DFS, hash maps), 1 advanced (DP, graph algorithms, complex tree ops).
Each question has 4 options, exactly one correct.
Return JSON:
{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "difficulty": "beginner" | "intermediate" | "advanced",
      "topic": "string",
      "explanation": "1-sentence why"
    }
  ]
}`;
  const data = await aiJson(system, "Generate the placement quiz.", 2000);
  data.questions = (data.questions ?? []).slice(0, 5);
  return data;
}

function classifyLevel(answers: { difficulty: string; correct: boolean }[]): "beginner" | "intermediate" | "advanced" {
  // Weighted score: beginner=1, intermediate=2, advanced=3
  let pts = 0;
  let max = 0;
  for (const a of answers) {
    const w = a.difficulty === "advanced" ? 3 : a.difficulty === "intermediate" ? 2 : 1;
    max += w;
    if (a.correct) pts += w;
  }
  const ratio = max ? pts / max : 0;
  if (ratio >= 0.7) return "advanced";
  if (ratio >= 0.4) return "intermediate";
  return "beginner";
}

// Animated visualization frames for the optimal solution.
async function generateVisualization(problem: any) {
  const system = `You are an algorithm visualization designer. Produce 6-10 animation frames that walk a student through the OPTIMAL solution to the problem on the first example input.
Each frame represents one step. Use one of these frame "type"s based on the topic:
- "array"  → state.array: number[], state.pointers: {name: string, index: number, color: "primary"|"success"|"hint"|"explain"}[]
- "list"   → state.nodes: {value: any}[], state.pointers: {name, index, color}[]
- "tree"   → state.tree: nested {value, left?, right?, highlight?: "primary"|"success"|"hint"|"explain"}
- "sort"   → state.array, state.pointers, state.swap?: [i, j]
- "search" → state.array, state.pointers (low/mid/high)
- "generic"→ state.text: string (fallback)
Return JSON:
{
  "topic_kind": "array" | "list" | "tree" | "sort" | "search" | "generic",
  "frames": [
    {
      "type": "array" | "list" | "tree" | "sort" | "search" | "generic",
      "title": "short step title",
      "narration": "1-sentence what is happening",
      "state": { ... matching the type ... }
    }
  ],
  "summary": "1-2 sentence final summary"
}
Make sure every frame's "state" matches its "type" exactly. Numbers only inside arrays.`;
  const user = `PROBLEM:\n${problem.title}\n${problem.description}\n\nFIRST EXAMPLE:\n${JSON.stringify(problem.examples?.[0] ?? {}, null, 2)}\n\nOPTIMAL APPROACH:\n${JSON.stringify(problem.optimal_solution ?? {}, null, 2)}`;
  const data = await aiJson(system, user, 2500);
  data.frames = (data.frames ?? []).slice(0, 12);
  return data;
}

// ---------- Router ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const { action, session_id } = body;
    if (!action || !session_id) {
      return json({ error: "action and session_id required" }, 400);
    }

    const session = await getSession(session_id);

    switch (action) {
      case "generate-problem": {
        const topic: string = body.topic;
        const level = session.state.topic_levels[topic] ?? "beginner";
        const problem = await generateProblem(topic, level, session.state.asked_questions);
        session.state.current_topic = topic;
        session.state.last_question = problem.description;
        session.state.asked_questions.push(problem.title);
        session.state.question_count += 1;
        await saveSession(session_id, session.state, problem);
        return json(problem);
      }

      case "answer": {
        const answer: string = body.answer;
        const problem = session.current_problem;
        if (!problem) return json({ error: "No active problem" }, 400);
        const topic = session.state.current_topic;
        const level = session.state.topic_levels[topic] ?? "beginner";

        const evalResult = await evaluateAnswer(problem.description, answer, topic, level);
        const newState = recordAnswer(session.state, topic, evalResult.is_correct);

        let auto_hint: string | null = null;
        let auto_explanation: string | null = null;

        if (!evalResult.is_correct && newState.consecutive_wrong >= 2) {
          const h = await progressiveHint(problem.description, topic, level, Math.min(newState.consecutive_wrong, 3));
          auto_hint = h.hint;
        }
        if (!evalResult.is_correct && newState.consecutive_wrong >= 3) {
          const e = await getExplanation(problem.description, answer);
          auto_explanation = e.explanation;
          newState.consecutive_wrong = 0;
        }

        const weak_topic_flag = newState.weak_topics.includes(topic);
        await saveSession(session_id, newState, problem);

        return json({
          is_correct: evalResult.is_correct,
          feedback: evalResult.feedback,
          hint: evalResult.hint,
          confidence_score: evalResult.confidence_score,
          optimal_complexity: evalResult.optimal_complexity,
          weak_topic_flag,
          streak: newState.streak,
          best_streak: newState.best_streak,
          score: newState.score,
          current_level: newState.current_level,
          consecutive_wrong: newState.consecutive_wrong,
          question_count: newState.question_count,
          auto_hint,
          auto_explanation,
          topic_level: newState.topic_levels[topic] ?? "beginner",
        });
      }

      case "run-code": {
        const result = await analyzeCode(body.code, body.language, body.test_cases, body.question);
        return json(result);
      }

      case "hint": {
        const problem = session.current_problem;
        if (!problem) return json({ error: "No active problem" }, 400);
        const level = session.state.topic_levels[session.state.current_topic] ?? "beginner";
        const h = await progressiveHint(problem.description, session.state.current_topic, level, body.hint_level ?? 1);
        return json(h);
      }

      case "explain": {
        const problem = session.current_problem;
        if (!problem) return json({ error: "No active problem" }, 400);
        const e = await getExplanation(problem.description, body.user_answer ?? "");
        return json(e);
      }

      case "suggest-topic": {
        const acc = topicAccuracy(session.state);
        const s = await suggestNextTopic(acc);
        return json(s);
      }

      case "progress": {
        const acc = topicAccuracy(session.state);
        return json({
          current_level: session.state.current_level,
          score: session.state.score,
          streak: session.state.streak,
          best_streak: session.state.best_streak,
          weak_topics: session.state.weak_topics,
          topic_accuracy: acc,
          question_count: session.state.question_count,
          topic_levels: session.state.topic_levels,
        });
      }

      case "reset": {
        const fresh = defaultState();
        await saveSession(session_id, fresh, null);
        return json({ ok: true });
      }

      case "placement-quiz": {
        const quiz = await generatePlacementQuiz();
        return json(quiz);
      }

      case "submit-placement": {
        // body.answers: [{difficulty, correct}]
        const answers: { difficulty: string; correct: boolean }[] = body.answers ?? [];
        const level = classifyLevel(answers);
        // Seed session: set global level + per-topic baseline level so first problems match
        session.state.current_level = level;
        const TOPICS = ["Arrays", "Linked Lists", "Trees", "Sorting", "Searching"];
        for (const t of TOPICS) session.state.topic_levels[t] = level;
        await saveSession(session_id, session.state);
        const correctCount = answers.filter((a) => a.correct).length;
        return json({ level, correct: correctCount, total: answers.length });
      }

      case "visualize": {
        const problem = session.current_problem;
        if (!problem) return json({ error: "No active problem" }, 400);
        const viz = await generateVisualization(problem);
        return json(viz);
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("dsa-tutor error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return json({ error: msg }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
