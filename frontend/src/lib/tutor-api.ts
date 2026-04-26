import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const SESSION_KEY = "dsa_tutor_session_id";

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function resetSessionId() {
  const id = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, id);
  return id;
}

export async function tutorCall<T = any>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const session_id = getSessionId();
  try {
    let response;
    // Map action to FastAPI endpoints
    if (action === "progress" || action === "resume" || action === "summary") {
      response = await axios.get(`${API_URL}/${action}`, { params: { session_id } });
    } else if (action === "placement-quiz") {
      response = await axios.get(`${API_URL}/placement-quiz`);
    } else {
      // POST requests
      response = await axios.post(`${API_URL}/${action}`, { session_id, ...payload });
    }
    return response.data as T;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error(error.message || "Network error");
  }
}

export type Problem = {
  title: string;
  description: string;
  examples: { input: string; output: string; explanation: string }[];
  constraints: string[];
  function_signature: { python: string; java: string; cpp: string };
  test_cases: { input: string; expected_output: string; explanation: string }[];
  hints: string[];
  optimal_solution: {
    approach: string;
    time_complexity: string;
    space_complexity: string;
    explanation: string;
  };
  topic: string;
  level: string;
};

export type AnswerResponse = {
  is_correct: boolean;
  feedback: string;
  hint: string | null;
  confidence_score: number;
  optimal_complexity: string;
  weak_topic_flag: boolean;
  streak: number;
  best_streak: number;
  score: number;
  current_level: "beginner" | "intermediate" | "advanced";
  consecutive_wrong: number;
  question_count: number;
  auto_hint: string | null;
  auto_explanation: string | null;
  topic_level: string;
};

export type RunCodeResponse = {
  test_results: { input: string; expected: string; got: string; passed: boolean; explanation: string }[];
  overall_correct: boolean;
  time_complexity: string;
  space_complexity: string;
  feedback: string;
  suggestion: string;
};
