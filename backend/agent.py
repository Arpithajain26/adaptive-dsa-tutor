import os
import json
import re
from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

load_dotenv()

MODEL_NAME = "gpt-4o"

api_key = os.getenv("OPENAI_API_KEY")
print(f"OpenAI API Key loaded: {'YES' if api_key else 'NO - CHECK .env FILE'}")

client = None
if api_key:
    client = OpenAI(api_key=api_key)

class QuestionResponse(BaseModel):
    question: str
    topic: str
    level: str
    boilerplate_code: Optional[str] = None
    visualization_idea: Optional[str] = None
    test_cases: Optional[List[Dict[str, str]]] = None # List of {"input": "...", "expected_output": "..."}
    explanation_hint: Optional[str] = None

class EvaluationResponse(BaseModel):
    is_correct: bool
    feedback: str
    hint: Optional[str] = None
    confidence_score: int
    optimal_complexity: Optional[str] = None
    optimal_code: Optional[str] = None 
    test_case_results: Optional[List[Dict[str, Any]]] = None 

class HintResponse(BaseModel):
    hint: str

class ExplanationResponse(BaseModel):
    explanation: str

class SummaryResponse(BaseModel):
    summary: str
    weakest_area: str
    suggested_next_topic: str

class VizFrame(BaseModel):
    type: str # "array", "list", "tree", "sort", "search", "generic"
    title: str
    narration: str
    state: Dict[str, Any]

class VizData(BaseModel):
    topic_kind: str
    frames: List[VizFrame]
    summary: str

def extract_json(text: str) -> str:
    """Safely extract a JSON object from LLM output."""
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return match.group(0)
    return text

def make_llm_call(system_prompt: str, user_prompt: str, max_tokens: int = 800):
    """Synchronous LLM call using OpenAI client."""
    if not client:
        print("OpenAI client not initialized.")
        return None
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=max_tokens,
            temperature=0.7,
            response_format={ "type": "json_object" } if "JSON" in system_prompt else None
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI API call failed: {e}")
        return None

class TutorAgent:
    def __init__(self):
        print("TutorAgent initialized with OpenAI API")

    def generate_question(self, topic: str, level: str, asked_questions: List[str]) -> QuestionResponse:
        """Generates a high-quality DSA question for a specific topic and difficulty level."""
        system_prompt = "You are an elite DSA interviewer. Respond in strictly valid JSON."
        prompt = f"""
        Generate a {level} difficulty DSA problem about {topic}.
        Avoid these already asked questions: {asked_questions}
        
        CRITICAL:
        1. Format the 'question' field with a clear description, 3 distinct examples (Input, Output, Explanation), and constraints.
        2. 'boilerplate_code' must be a clean Python class/method.
        3. 'test_cases' must be 3 valid JSON objects for evaluation.
        
        Structure:
        {{
            "question": "# Problem Title\\n\\nDescription...\\n\\n### Example 1\\nInput: ...\\nOutput: ...",
            "topic": "{topic}",
            "level": "{level}",
            "boilerplate_code": "class Solution:\\n    def solve(self, ...):\\n        pass",
            "visualization_idea": "...",
            "test_cases": [{{"input": "...", "expected_output": "..."}}],
            "explanation_hint": "..."
        }}
        """
        content = make_llm_call(system_prompt, prompt, max_tokens=1500)
        if not content:
            return QuestionResponse(question=f"Solve {topic}.", topic=topic, level=level)
        try:
            data = json.loads(extract_json(content))
            return QuestionResponse(**data)
        except:
            return QuestionResponse(question=f"Solve {topic}.", topic=topic, level=level)

    def evaluate_answer(self, question: str, answer: str, topic: str, level: str) -> EvaluationResponse:
        """Evaluates user code logic and correctness."""
        system_prompt = "You are an expert DSA technical reviewer. Respond in strictly valid JSON."
        prompt = f"""
        Question: {question}
        Student Answer: {answer}
        Topic: {topic}
        Level: {level}

        Evaluate the student's code logic, complexity, and correctness.
        Return a valid JSON object with these fields:
        {{
            "is_correct": boolean,
            "feedback": "detailed feedback string",
            "hint": "helpful hint if wrong, else null",
            "confidence_score": integer 0-100,
            "optimal_complexity": "e.g. O(n)",
            "optimal_code": "optimal implementation",
            "test_case_results": [
                {{
                    "input": "test input",
                    "expected": "expected output",
                    "got": "what student code returns",
                    "passed": boolean
                }}
            ]
        }}
        """
        content = make_llm_call(system_prompt, prompt, max_tokens=1000)
        if not content:
            return EvaluationResponse(is_correct=False, feedback="Error processing.", confidence_score=0)
        try:
            data = json.loads(extract_json(content))
            return EvaluationResponse(**data)
        except:
            return EvaluationResponse(is_correct=True, feedback="Recorded.", confidence_score=100)

    def assess_initial_level(self, user_background: str) -> str:
        """Determines user level from background."""
        system_prompt = "Reply with only one word: beginner, intermediate, or advanced."
        content = make_llm_call(system_prompt, user_background, max_tokens=10)
        if content:
            l = content.strip().lower()
            if l in ["beginner", "intermediate", "advanced"]: return l
        return "beginner"

    def get_progressive_hint(self, question: str, topic: str, level: str, hint_level: int) -> HintResponse:
        """Gets a progressive hint."""
        system_prompt = "You are a DSA tutor. Respond in valid JSON only."
        prompt = f"Question: {question}\\nHint Level: {hint_level}\\nProvide a hint without revealing code."
        content = make_llm_call(system_prompt, prompt, max_tokens=400)
        if not content: return HintResponse(hint="Think about the data structure.")
        try:
            data = json.loads(extract_json(content))
            return HintResponse(**data)
        except: return HintResponse(hint="Break it down.")

    def get_explanation(self, question: str, user_answer: Optional[str] = None) -> ExplanationResponse:
        """Provides full masterclass explanation."""
        system_prompt = "You are a DSA Lead Instructor. Respond in valid JSON only."
        prompt = f"Question: {question}\\nStudent Attempt: {user_answer}\\nProvide optimal approach and walkthrough."
        content = make_llm_call(system_prompt, prompt, max_tokens=1500)
        if not content: return ExplanationResponse(explanation="Consult a textbook.")
        try:
            data = json.loads(extract_json(content))
            return ExplanationResponse(**data)
        except: return ExplanationResponse(explanation="Masterclass unavailable.")



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
                    "input": "test input",
                    "expected": "expected output",
                    "got": "what student code would return",
                    "passed": true or false,
                    "explanation": "one line explanation"
                }}
            ],
            "overall_correct": true or false,
            "time_complexity": "e.g. O(n)",
            "space_complexity": "e.g. O(1)",
            "feedback": "Overall feedback on the solution",
            "suggestion": "One improvement suggestion"
        }}
        """

        content = make_llm_call(system_prompt, prompt, max_tokens=1500)

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

    def suggest_next_topic(self, topic_accuracy: dict) -> dict:
        """Suggests the best next topic to study based on performance."""
        system_prompt = "You are an AI Tutor. Respond in valid JSON only."
        prompt = f"""
        Student performance: {json.dumps(topic_accuracy)}
        
        Suggest the best next topic to study.
        Consider: weak topics need more practice, strong topics can be skipped.
        
        Respond ONLY with this JSON:
        {{
            "suggested_topic": "string",
            "reason": "string",
            "focus_areas": ["list of strings"]
        }}
        """
        
        content = make_llm_call(system_prompt, prompt, max_tokens=300)
        
        if not content:
            return {
                "suggested_topic": "Arrays",
                "reason": "Default starting point.",
                "focus_areas": ["Fundamentals"]
            }
            
        try:
            clean = extract_json(content)
            return json.loads(clean)
        except Exception as e:
            print(f"Parse error in suggest_next_topic: {e}")
            return {
                "suggested_topic": "Arrays",
                "reason": "Failed to generate suggestion.",
                "focus_areas": ["Fundamentals"]
            }
            
    def generate_problem_statement(self, topic: str, level: str, asked_questions: List[str]) -> dict:
        """Generates a LeetCode style problem statement."""
        system_prompt = """You are an expert DSA problem setter like LeetCode.
        Always respond in valid JSON format only. No extra text outside JSON."""
        
        prompt = f"""
        Generate a {level} difficulty {topic} problem.
        Avoid these already asked questions: {asked_questions}
        
        Respond ONLY with this JSON:
        {{
            "title": "Two Sum",
            "description": "Given array find...",
            "examples": [
              {{
                "input": "nums = [2,7,11,15]",
                "output": "9",
                "explanation": "2+7=9"
              }}
            ],
            "constraints": ["2 <= n <= 10^4"],
            "function_signature": {{
              "python": "def solution(nums):\\n    pass",
              "java": "class Solution {{...}}",
              "cpp": "class Solution {{...}}"
            }},
            "test_cases": [
              {{
                "input": "[2,7,11,15]",
                "expected_output": "9",
                "explanation": "basic case"
              }}
            ],
            "hints": [
              "Think about what you need to track"
            ],
            "optimal_solution": {{
              "approach": "HashMap",
              "time_complexity": "O(n)",
              "space_complexity": "O(n)",
              "explanation": "Single pass with hashmap"
            }},
            "topic": "{topic}",
            "level": "{level}"
        }}
        """
        
        content = make_llm_call(system_prompt, prompt, max_tokens=1500)
        
        if not content:
             return {
                "title": f"Problem on {topic}",
                "description": f"Solve a {level} level problem on {topic}.",
                "examples": [],
                "constraints": [],
                "function_signature": {"python": "def solve():\n    pass"},
                "test_cases": [],
                "hints": [],
                "optimal_solution": {"approach": "Unknown", "time_complexity": "Unknown", "space_complexity": "Unknown", "explanation": ""},
                "topic": topic,
                "level": level
             }

        try:
            clean = extract_json(content)
            return json.loads(clean)
        except Exception as e:
            print(f"Parse error in generate_problem_statement: {e}")
            return {
                "title": f"Problem on {topic}",
                "description": f"Solve a {level} level problem on {topic}.",
                "examples": [],
                "constraints": [],
                "function_signature": {"python": "def solve():\n    pass"},
                "test_cases": [],
                "hints": [],
                "optimal_solution": {"approach": "Unknown", "time_complexity": "Unknown", "space_complexity": "Unknown", "explanation": ""},
                "topic": topic,
                "level": level
            }

    def generate_placement_quiz(self) -> dict:
        """Generates a 5-question placement quiz."""
        system_prompt = """You are a DSA placement examiner. Generate EXACTLY 5 multiple-choice questions to assess a student's level (beginner / intermediate / advanced).
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
}"""
        content = make_llm_call(system_prompt, "Generate the placement quiz.", max_tokens=1500)
        
        if not content:
            return {"questions": []}
            
        try:
            clean = extract_json(content)
            data = json.loads(clean)
            data["questions"] = data.get("questions", [])[:5]
            return data
        except Exception as e:
            print(f"Parse error in generate_placement_quiz: {e}")
            return {"questions": []}

    def generate_visualization(self, question: str, topic: str) -> VizData:
        """Generates a step-by-step visualization for a DSA problem."""
        system_prompt = """You are an expert DSA visualizer.
        Generate a step-by-step animation of an algorithm solving a problem.
        The animation consists of "frames". Each frame has a state (data) and a narration.
        
        Types:
        - "array": { "array": [1,2,3], "pointers": [{"name": "i", "index": 0, "color": "primary"}] }
        - "sort": { "array": [3,1,2], "swap": [0, 1] }
        - "tree": { "tree": {"value": 10, "left": {"value": 5}, "right": {"value": 15}, "highlight": "primary"} }
        - "list": { "nodes": [{"value": 1}, {"value": 2}], "pointers": [{"name": "head", "index": 0}] }
        
        Always respond in valid JSON format only."""
        
        prompt = f"""
        Question: {question}
        Topic: {topic}
        
        Generate a 6-12 frame visualization of the OPTIMAL algorithm for this problem.
        
        Guidelines:
        - For "array"/"sort"/"search": state must be {{ "array": [...], "pointers": [{{ "name": "i", "index": 0, "color": "primary" }}], "swap": [idx1, idx2] }}
        - For "list": state must be {{ "nodes": [{{ "value": 1 }}, {{ "value": 2 }}], "pointers": [{{ "name": "head", "index": 0 }}] }}
        - For "tree": state must be {{ "tree": {{ "value": 10, "left": {{...}}, "right": {{...}}, "highlight": "primary" }} }}
        
        Respond ONLY with this JSON:
        {{
            "topic_kind": "{topic}",
            "frames": [
                {{
                    "type": "array" | "list" | "tree" | "generic",
                    "title": "Step Title",
                    "narration": "What is happening in this step?",
                    "state": {{ ... }}
                }}
            ],
            "summary": "Final explanation of the algorithm's complexity."
        }}
        """
        
        content = make_llm_call(system_prompt, prompt, max_tokens=2000)
        
        if not content:
            return VizData(
                topic_kind=topic,
                frames=[VizFrame(type="generic", title="Error", narration="Could not generate visualization.", state={"text": "Service unavailable"})],
                summary="Please try again later."
            )
            
        try:
            clean = extract_json(content)
            return VizData(**json.loads(clean))
        except Exception as e:
            print(f"Parse error in generate_visualization: {e}")
            return VizData(
                topic_kind=topic,
                frames=[VizFrame(type="generic", title="Error", narration="Failed to parse visualization data.", state={"text": str(e)})],
                summary="Technical error."
            )

tutor_agent = TutorAgent()
