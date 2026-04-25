import os
import json
import re
from dotenv import load_dotenv
from anthropic import AsyncAnthropic
from pydantic import BaseModel
from typing import Optional, List

env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

# Fixed model name to a valid current generation Claude 3.5 model
MODEL_NAME = "claude-3-5-sonnet-20240620"

class QuestionResponse(BaseModel):
    question: str
    topic: str
    level: str

class EvaluationResponse(BaseModel):
    is_correct: bool
    feedback: str
    hint: Optional[str] = None
    confidence_score: int

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

class TutorAgent:
    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        self.demo_mode = False
        if not api_key or "your_anthropic_api_key" in api_key:
            print("WARNING: No valid ANTHROPIC_API_KEY found. Entering DEMO MODE.")
            self.demo_mode = True
            self.client = None
        else:
            print(f"SUCCESS: ANTHROPIC_API_KEY loaded (starts with {api_key[:7]}...)")
            self.client = AsyncAnthropic(api_key=api_key)

    async def generate_question(self, topic: str, level: str, asked_questions: List[str] = None) -> QuestionResponse:
        """Generates a DSA question for a specific topic and difficulty level."""
        if asked_questions is None:
            asked_questions = []
            
        if self.demo_mode:
            return QuestionResponse(
                question=f"Demo: How do you find the middle of a linked list in one pass? (Topic: {topic}, Level: {level})",
                topic=topic,
                level=level
            )

        system_prompt = "You are an expert Data Structures and Algorithms tutor. Always respond strictly in valid JSON format."
        level_instruction = "IMPORTANT: Include a basic coding problem." if level in ["intermediate", "advanced"] else "Conceptual question."

        prompt = f"""
        Generate a {level} level question about {topic}.
        Asked already: {asked_questions}
        {level_instruction}
        Return JSON: {{"question": "...", "topic": "{topic}", "level": "{level}"}}
        """
        
        try:
            response = await self.client.messages.create(
                model=MODEL_NAME,
                max_tokens=500,
                temperature=0.7,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.content[0].text
            clean_content = extract_json(content)
            data = json.loads(clean_content)
            return QuestionResponse(**data)
        except Exception as e:
            print(f"API Error: {e}")
            raise RuntimeError(f"Claude API failed: {str(e)}")

    async def evaluate_answer(self, question: str, answer: str, topic: str, level: str) -> EvaluationResponse:
        """Evaluates the user's answer and provides feedback."""
        if self.demo_mode:
            is_correct = len(answer) > 5
            return EvaluationResponse(
                is_correct=is_correct,
                feedback="[Demo Mode] Your answer looks reasonable!" if is_correct else "[Demo Mode] Try adding more detail.",
                hint="Think about two pointers." if not is_correct else None,
                confidence_score=85 if is_correct else 40
            )

        system_prompt = "You are an expert DSA tutor. Respond in JSON."
        prompt = f"Question: {question}\nAnswer: {answer}\nEvaluate and return JSON with keys: is_correct, feedback, hint, confidence_score."
        
        try:
            response = await self.client.messages.create(
                model=MODEL_NAME,
                max_tokens=800,
                temperature=0.2,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.content[0].text
            clean_content = extract_json(content)
            data = json.loads(clean_content)
            return EvaluationResponse(**data)
        except Exception as e:
            print(f"API Error: {e}")
            raise RuntimeError(f"Claude API failed: {str(e)}")

    async def get_progressive_hint(self, question: str, topic: str, level: str, hint_level: int) -> HintResponse:
        if self.demo_mode:
            return HintResponse(hint="[Demo Mode] Use a slow and fast pointer.")

        system_prompt = "You are an expert DSA tutor. Respond in JSON."
        prompt = f"Question: {question}\nProvide a level {hint_level} hint in JSON with key 'hint'."
        
        try:
            response = await self.client.messages.create(
                model=MODEL_NAME,
                max_tokens=400,
                temperature=0.7,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.content[0].text
            clean_content = extract_json(content)
            data = json.loads(clean_content)
            return HintResponse(**data)
        except Exception as e:
            raise RuntimeError(f"Claude API failed: {str(e)}")

    async def get_explanation(self, question: str, user_answer: Optional[str] = None) -> ExplanationResponse:
        if self.demo_mode:
            return ExplanationResponse(explanation="[Demo Mode] The optimal solution uses the tortoise and hare algorithm...")

        system_prompt = "You are an expert DSA tutor. Respond in JSON."
        prompt = f"Question: {question}\nExplain the solution in JSON with key 'explanation'."
        
        try:
            response = await self.client.messages.create(
                model=MODEL_NAME,
                max_tokens=1000,
                temperature=0.4,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.content[0].text
            clean_content = extract_json(content)
            data = json.loads(clean_content)
            return ExplanationResponse(**data)
        except Exception as e:
            raise RuntimeError(f"Claude API failed: {str(e)}")

    async def get_session_summary(self, topic_accuracy: dict) -> SummaryResponse:
        if self.demo_mode:
            return SummaryResponse(
                summary="[Demo Mode] Great session! You've mastered basic pointers.",
                weakest_area="Trees",
                suggested_next_topic="Binary Search Trees"
            )

        system_prompt = "You are an expert DSA tutor. Respond in JSON."
        prompt = f"Accuracy: {json.dumps(topic_accuracy)}\nSummary in JSON with keys: summary, weakest_area, suggested_next_topic."
        
        try:
            response = await self.client.messages.create(
                model=MODEL_NAME,
                max_tokens=500,
                temperature=0.5,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.content[0].text
            clean_content = extract_json(content)
            data = json.loads(clean_content)
            return SummaryResponse(**data)
        except Exception as e:
            raise RuntimeError(f"Claude API failed: {str(e)}")

tutor_agent = TutorAgent()
