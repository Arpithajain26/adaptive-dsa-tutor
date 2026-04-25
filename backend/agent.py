import os
import json
import re
from dotenv import load_dotenv
import google.generativeai as genai
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

load_dotenv()

MODEL_NAME = "gemini-1.5-flash"

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key loaded: {'YES' if api_key else 'NO - CHECK .env FILE'}")

if api_key:
    genai.configure(api_key=api_key)

class QuestionResponse(BaseModel):
    question: str
    topic: str
    level: str
    boilerplate_code: Optional[str] = None
    visualization_idea: Optional[str] = None
    test_cases: Optional[List[Dict[str, str]]] = None # List of {"input": "...", "output": "..."}
    explanation_hint: Optional[str] = None

class EvaluationResponse(BaseModel):
    is_correct: bool
    feedback: str
    hint: Optional[str] = None
    confidence_score: int
    optimal_complexity: Optional[str] = None
    optimal_code: Optional[str] = None # New field to show the answer if user is stuck
    test_case_results: Optional[List[Dict[str, Any]]] = None # List of {"input": "...", "expected": "...", "actual": "...", "passed": true}

class HintResponse(BaseModel):
    hint: str

class ExplanationResponse(BaseModel):
    explanation: str

class SummaryResponse(BaseModel):
    summary: str
    weakest_area: str
    suggested_next_topic: str

def extract_json(text: str) -> str:
    """Safely extract a JSON object from LLM output."""
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return match.group(0)
    return text

def make_llm_call(system_prompt: str, user_prompt: str, max_tokens: int = 800):
    """Synchronous LLM call using Gemini client."""
    try:
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=system_prompt
        )
        response = model.generate_content(
            user_prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
            )
        )
        return response.text
    except Exception as e:
        print(f"LLM API call failed: {e}")
        return None

class TutorAgent:
    def __init__(self):
        print("TutorAgent initialized with real Claude API")

    def generate_question(self, topic: str, level: str, asked_questions: List[str]) -> QuestionResponse:
        """Generates a DSA question for a specific topic and difficulty level."""

        system_prompt = """You are an expert DSA tutor.
        Generate high quality DSA questions like LeetCode.
        Always respond in valid JSON format only.
        No extra text outside JSON."""

        prompt = f"""
        Generate a {level} level DSA question about {topic}.
        
        Already asked (do not repeat): {asked_questions}
        
        Respond ONLY with this JSON:
        {{
            "question": "Full question text. Include 3 examples in the description like LeetCode. Example 1: Input: nums = [1,2,3], Output: 3. Include constraints.",
            "topic": "{topic}",
            "level": "{level}",
            "boilerplate_code": "Generate a LeetCode-style Python class boilerplate. Example: 'class Solution:\n    def solve(self, nums: List[int]) -> int:\n        # Write your logic here\n        pass'",
            "visualization_idea": "A short description of how to visualize this problem (e.g., 'Visualize it as a sliding window moving over the array').",
            "test_cases": [
                {{"input": "example input 1", "output": "expected output 1"}},
                {{"input": "example input 2", "output": "expected output 2"}},
                {{"input": "example input 3", "output": "expected output 3"}}
            ],
            "explanation_hint": "small hint about concept tested"
        }}
        """

        content = make_llm_call(system_prompt, prompt, max_tokens=800)

        if not content:
            return QuestionResponse(
                question=f"Find the maximum element in a {topic}.",
                topic=topic,
                level=level,
                explanation_hint="Think about iterating once."
            )

        try:
            clean = extract_json(content)
            data = json.loads(clean)
            return QuestionResponse(**data)
        except Exception as e:
            print(f"Parse error: {e}")
            return QuestionResponse(
                question=f"Explain the time complexity of searching in {topic}.",
                topic=topic,
                level=level
            )

    def evaluate_answer(self, question: str, answer: str, topic: str, level: str) -> EvaluationResponse:
        """Evaluates user answer and provides feedback."""

        system_prompt = """You are an expert DSA tutor.
        Evaluate answers for correctness and efficiency.
        Always respond in valid JSON format only.
        No extra text outside JSON."""

        prompt = f"""
        Question: {question}
        Topic: {topic}
        Difficulty: {level}
        Student Answer (Code): {answer}
        
        Evaluation Guidelines:
        1. If the code is correct but uses a brute-force approach (e.g., O(n^2) when O(n) is possible), mark 'is_correct' as true but provide feedback that encourages optimization. 
        2. If the user is struggling (indicated by multiple failed attempts or very short code), provide a 'hint' that focuses on a 'Visualization' or a structural change.
        3. Analyze Time and Space Complexity.
        
        Respond ONLY with this JSON:
        {{
            "is_correct": true or false,
            "feedback": "detailed technical feedback. If brute-force, explain why it works but how it can be optimized.",
            "hint": "progressive hint. If stuck, provide a visualization-based hint.",
            "confidence_score": 0 to 100,
            "optimal_complexity": "e.g., O(n) time, O(1) space",
            "test_case_results": [
                {{"input": "...", "expected": "...", "actual": "...", "passed": true/false}},
                {{"input": "...", "expected": "...", "actual": "...", "passed": true/false}},
                {{"input": "...", "expected": "...", "actual": "...", "passed": true/false}}
            ]
        }}
        """

        content = make_llm_call(system_prompt, prompt, max_tokens=800)

        if not content:
            return EvaluationResponse(
                is_correct=False,
                feedback="Could not evaluate. Please try again.",
                hint="Check your logic and try again.",
                confidence_score=0,
                optimal_complexity="Unknown"
            )

        try:
            clean = extract_json(content)
            data = json.loads(clean)
            return EvaluationResponse(**data)
        except Exception as e:
            print(f"Parse error: {e}")
            return EvaluationResponse(
                is_correct=True,
                feedback="Answer recorded. Moving to next question!",
                confidence_score=100
            )

    def assess_initial_level(self, user_background: str) -> str:
        """Determines user level from background."""

        system_prompt = "You are a DSA tutor. Reply with only one word: beginner, intermediate, or advanced."
        prompt = f"Background: {user_background}. What is this student's DSA level?"

        content = make_llm_call(system_prompt, prompt, max_tokens=10)

        if content:
            level = content.strip().lower()
            if level in ["beginner", "intermediate", "advanced"]:
                return level
        return "beginner"

    def get_progressive_hint(self, question: str, topic: str, level: str, hint_level: int) -> HintResponse:
        """Gets a progressive hint based on hint level."""

        if hint_level == 1:
            instruction = "Give a high level concept nudge only."
        elif hint_level == 2:
            instruction = "Suggest a specific data structure or algorithm."
        else:
            instruction = "Give detailed logic breakdown but no code."

        system_prompt = "You are a DSA tutor. Respond in valid JSON only."
        prompt = f"""
        Question: {question}
        Topic: {topic}
        Level: {level}
        
        {instruction}
        
        Respond ONLY with: {{"hint": "your hint here"}}
        """

        content = make_llm_call(system_prompt, prompt, max_tokens=400)

        if not content:
            return HintResponse(hint=f"Think about the properties of {topic}.")

        try:
            clean = extract_json(content)
            data = json.loads(clean)
            return HintResponse(**data)
        except Exception as e:
            print(f"Parse error: {e}")
            return HintResponse(hint="Break the problem into smaller parts.")

    def get_explanation(self, question: str, user_answer: Optional[str] = None) -> ExplanationResponse:
        """Gets full explanation for a question."""

        system_prompt = "You are a DSA tutor. Respond in valid JSON only."
        prompt = f"""
        Question: {question}
        Student attempt: {user_answer}
        
        Explain:
        1. Optimal approach
        2. Step by step logic
        3. Time and space complexity
        4. Python code snippet
        
        Respond ONLY with: {{"explanation": "markdown formatted explanation"}}
        """

        content = make_llm_call(system_prompt, prompt, max_tokens=1200)

        if not content:
            return ExplanationResponse(explanation="Think about the optimal approach for this problem type.")

        try:
            clean = extract_json(content)
            data = json.loads(clean)
            return ExplanationResponse(**data)
        except Exception as e:
            print(f"Parse error: {e}")
            return ExplanationResponse(explanation="Review the problem constraints and think about time complexity.")

    def get_session_summary(self, topic_accuracy: dict) -> SummaryResponse:
        """Gets session summary and recommendations."""

        system_prompt = "You are a DSA tutor. Respond in valid JSON only."
        prompt = f"""
        Student performance: {json.dumps(topic_accuracy)}
        
        Give encouraging summary, identify weakest area, suggest next topic.
        
        Respond ONLY with:
        {{
            "summary": "encouraging summary",
            "weakest_area": "topic name",
            "suggested_next_topic": "topic name"
        }}
        """

        content = make_llm_call(system_prompt, prompt, max_tokens=500)

        if not content:
            return SummaryResponse(
                summary="Great session! Keep practicing daily.",
                weakest_area="Arrays",
                suggested_next_topic="Linked Lists"
            )

        try:
            clean = extract_json(content)
            data = json.loads(clean)
            return SummaryResponse(**data)
        except Exception as e:
            print(f"Parse error: {e}")
            return SummaryResponse(
                summary="Well done today!",
                weakest_area="Complexity analysis",
                suggested_next_topic="Trees"
            )

    def analyze_code(self, code: str, language: str, question: str, test_cases: List[Dict[str, str]]) -> dict:
        """Analyzes student code logic using AI without executing it."""

        system_prompt = """You are an expert code reviewer and DSA tutor.
        Analyze code logic WITHOUT executing it.
        Always respond in valid JSON format only.
        No extra text outside JSON."""

        test_cases_str = json.dumps(test_cases) if test_cases else "[]"

        prompt = f"""
        Student's code ({language}):
        ```
        {code}
        ```

        Question: {question}

        Test cases: {test_cases_str}

        WITHOUT executing the code, analyze if the logic is correct.
        For each test case, determine what the code would return.

        Respond ONLY with this JSON:
        {{
            "test_results": [
                {{
                    "test_case": "the input",
                    "expected": "expected output",
                    "got": "what student code would return",
                    "passed": true or false,
                    "feedback": "one line explanation"
                }}
            ],
            "overall_correct": true or false,
            "time_complexity": "e.g. O(n)",
            "space_complexity": "e.g. O(1)",
            "feedback": "Overall feedback on the solution",
            "suggestion": "One improvement suggestion"
        }}
        """

        content = make_llm_call(system_prompt, prompt, max_tokens=1000)

        if not content:
            return {
                "test_results": [],
                "overall_correct": False,
                "time_complexity": "Unknown",
                "space_complexity": "Unknown",
                "feedback": "Could not analyze code. Please try again.",
                "suggestion": "Ensure your code is syntactically correct."
            }

        try:
            clean = extract_json(content)
            return json.loads(clean)
        except Exception as e:
            print(f"Parse error in analyze_code: {e}")
            return {
                "test_results": [],
                "overall_correct": False,
                "time_complexity": "Unknown",
                "space_complexity": "Unknown",
                "feedback": "Analysis failed. Please try again.",
                "suggestion": "Check your code syntax."
            }

tutor_agent = TutorAgent()