import os
import json
import re
from dotenv import load_dotenv
from anthropic import AsyncAnthropic
from pydantic import BaseModel
from typing import Optional, List

load_dotenv()

# Use the model specified by the user
MODEL_NAME = "claude-sonnet-4-20250514"

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
        self.client = AsyncAnthropic(api_key=api_key)

    async def generate_question(self, topic: str, level: str, asked_questions: List[str] = []) -> QuestionResponse:
        """Generates a DSA question for a specific topic and difficulty level."""
        system_prompt = "You are an expert Data Structures and Algorithms tutor. Always respond strictly in valid JSON format."
        prompt = f"""
        Generate a {level} level question about {topic}.
        Already asked questions (DO NOT repeat these topics/questions exactly): {asked_questions}
        
        Provide the response STRICTLY as a JSON object with the following keys:
        - "question": The text of the problem/question.
        - "topic": The topic of the question (should be {topic}).
        - "level": The difficulty level (should be {level}).
        
        Do not include any other text outside the JSON object.
        """
        
        response = await self.client.messages.create(
            model=MODEL_NAME,
            max_tokens=500,
            temperature=0.7,
            system=system_prompt,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        content = response.content[0].text
        try:
            clean_content = extract_json(content)
            data = json.loads(clean_content)
            return QuestionResponse(**data)
        except Exception as e:
            raise ValueError(f"Failed to parse Claude response: {content}") from e

    async def evaluate_answer(self, question: str, answer: str, topic: str, level: str) -> EvaluationResponse:
        """Evaluates the user's answer and provides feedback."""
        system_prompt = "You are an expert Data Structures and Algorithms tutor. Always respond strictly in valid JSON format."
        prompt = f"""
        Question: {question}
        Topic: {topic}
        Difficulty: {level}
        
        User's Answer: {answer}
        
        Evaluate if the user's answer is correct. 
        If it's wrong or partially wrong, provide constructive feedback and a helpful hint.
        If it's correct, provide encouraging feedback.
        Also provide a confidence_score from 0 to 100 on how close their answer is to the ideal answer (100 being perfect).
        
        Provide the response STRICTLY as a JSON object with the following keys:
        - "is_correct": boolean (true if correct, false otherwise)
        - "feedback": string (your explanation/feedback)
        - "hint": string or null (provide a hint only if the answer is wrong, otherwise null)
        - "confidence_score": integer (0-100)
        
        Do not include any other text outside the JSON object.
        """
        
        response = await self.client.messages.create(
            model=MODEL_NAME,
            max_tokens=800,
            temperature=0.2,
            system=system_prompt,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        content = response.content[0].text
        try:
            clean_content = extract_json(content)
            data = json.loads(clean_content)
            return EvaluationResponse(**data)
        except Exception as e:
            raise ValueError(f"Failed to parse Claude response: {content}") from e

    async def get_progressive_hint(self, question: str, topic: str, level: str, hint_level: int) -> HintResponse:
        system_prompt = "You are an expert Data Structures and Algorithms tutor. Always respond strictly in valid JSON format."
        
        hint_instruction = ""
        if hint_level == 1:
            hint_instruction = "Provide a very vague, high-level hint that just nudges the user in the right direction without giving much away."
        elif hint_level == 2:
            hint_instruction = "Provide a specific hint mentioning algorithms or data structures to use, but don't write code."
        else:
            hint_instruction = "Provide a very detailed hint that practically outlines the step-by-step logic to solve the problem."

        prompt = f"""
        Question: {question}
        Topic: {topic}
        Difficulty: {level}
        
        {hint_instruction}
        
        Provide the response STRICTLY as a JSON object with the following key:
        - "hint": string
        """
        response = await self.client.messages.create(
            model=MODEL_NAME,
            max_tokens=400,
            temperature=0.7,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}]
        )
        content = response.content[0].text
        try:
            clean_content = extract_json(content)
            data = json.loads(clean_content)
            return HintResponse(**data)
        except Exception as e:
            raise ValueError(f"Failed to parse Claude response: {content}") from e

    async def get_explanation(self, question: str, user_answer: Optional[str] = None) -> ExplanationResponse:
        system_prompt = "You are an expert Data Structures and Algorithms tutor. Always respond strictly in valid JSON format."
        
        user_answer_context = f"User's Attempt: {user_answer}" if user_answer else ""
        
        prompt = f"""
        Question: {question}
        {user_answer_context}
        
        Provide a structured, step-by-step breakdown of how to solve this question. Explain the optimal approach, time/space complexity, and why this approach works. If the user provided an attempt, briefly note why it might be incorrect before providing the correct solution.
        
        Provide the response STRICTLY as a JSON object with the following key:
        - "explanation": string (markdown formatting allowed inside the string)
        """
        response = await self.client.messages.create(
            model=MODEL_NAME,
            max_tokens=1000,
            temperature=0.4,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}]
        )
        content = response.content[0].text
        try:
            clean_content = extract_json(content)
            data = json.loads(clean_content)
            return ExplanationResponse(**data)
        except Exception as e:
            raise ValueError(f"Failed to parse Claude response: {content}") from e

    async def get_session_summary(self, topic_accuracy: dict) -> SummaryResponse:
        system_prompt = "You are an expert Data Structures and Algorithms tutor. Always respond strictly in valid JSON format."
        
        prompt = f"""
        Here is the user's performance accuracy percentage by topic:
        {json.dumps(topic_accuracy)}
        
        Analyze their performance.
        Provide a brief encouraging wrap-up summary of their session, identify their weakest area, and suggest what topic they should study next (must be a specific DSA topic). If there is no data yet, provide a generic encouraging message to start practicing.
        
        Provide the response STRICTLY as a JSON object with the following keys:
        - "summary": string (encouraging wrap-up text)
        - "weakest_area": string (or "None" if no data)
        - "suggested_next_topic": string (the exact name of the topic)
        """
        response = await self.client.messages.create(
            model=MODEL_NAME,
            max_tokens=500,
            temperature=0.5,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}]
        )
        content = response.content[0].text
        try:
            clean_content = extract_json(content)
            data = json.loads(clean_content)
            return SummaryResponse(**data)
        except Exception as e:
            raise ValueError(f"Failed to parse Claude response: {content}") from e

tutor_agent = TutorAgent()
