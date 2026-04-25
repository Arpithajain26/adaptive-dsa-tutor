from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from pydantic import BaseModel
import uvicorn
from typing import List, Optional, Dict

from memory import memory_manager, user_manager
from agent import tutor_agent

app = FastAPI(title="Adaptive DSA Tutor API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend", "dist")

# --- Schemas ---

class StartRequest(BaseModel):
    session_id: str
    topic: str

class StartResponse(BaseModel):
    question: str
    topic: str
    level: str

class AnswerRequest(BaseModel):
    session_id: str
    answer: str

class AnswerResponse(BaseModel):
    is_correct: bool
    feedback: str
    hint: Optional[str] = None
    next_question: str
    next_topic: str
    next_level: str
    confidence_score: int
    weak_topic_flag: bool
    streak: int

class HintRequest(BaseModel):
    session_id: str
    hint_level: int

class HintResponse(BaseModel):
    hint: str

class ExplainRequest(BaseModel):
    session_id: str
    user_answer: Optional[str] = None

class ExplainResponse(BaseModel):
    explanation: str

class SummaryResponse(BaseModel):
    summary: str
    weakest_area: str
    suggested_next_topic: str

class ResetRequest(BaseModel):
    session_id: str

class ProgressResponse(BaseModel):
    current_level: str
    score: int
    streak: int
    weak_topics: List[str]
    topic_accuracy: Dict[str, int]
    suggested_next_topic: Optional[str] = None

class AuthRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class AuthResponse(BaseModel):
    success: bool
    message: str
    session_id: Optional[str] = None
    username: Optional[str] = None

# --- Endpoints ---

    }

# --- Serve Frontend ---

# Mount static files (JS, CSS, etc.)
if os.path.exists(FRONTEND_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # API routes should be handled by their respective decorators
        if full_path.startswith("api/") or full_path in ["start", "answer", "progress", "hint", "explain", "summary", "reset", "signup", "signin"]:
            raise HTTPException(status_code=404)
        
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
else:
    print(f"WARNING: Frontend directory not found at {FRONTEND_DIR}. Only API will be available.")

@app.post("/start", response_model=StartResponse)
async def start_session(req: StartRequest):
    """Initializes a session and returns the first question."""
    try:
        # Get or create session
        state = memory_manager.get_session(req.session_id)
        state.current_topic = req.topic
        
        # Generate question based on current topic and level
        question_resp = await tutor_agent.generate_question(req.topic, state.current_level, state.asked_questions)
        
        # Store last question to evaluate future answer
        state.last_question = question_resp.question
        state.asked_questions.append(question_resp.question)
        memory_manager.update_session(req.session_id, state)
        
        return StartResponse(
            question=question_resp.question,
            topic=question_resp.topic,
            level=question_resp.level
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/answer", response_model=AnswerResponse)
async def submit_answer(req: AnswerRequest):
    """Evaluates the given answer and returns feedback + next question."""
    try:
        state = memory_manager.get_session(req.session_id)
        
        if not state.last_question or not state.current_topic:
            raise HTTPException(status_code=400, detail="No active question found. Please call /start first.")
            
        # 1. Evaluate the answer
        eval_resp = await tutor_agent.evaluate_answer(
            question=state.last_question,
            answer=req.answer,
            topic=state.current_topic,
            level=state.current_level
        )
        
        # 2. Update memory (score, streak, weak_topics, adaptive level)
        memory_manager.record_answer(req.session_id, state.current_topic, eval_resp.is_correct)
        
        # Reload state after update
        state = memory_manager.get_session(req.session_id)
        
        # Check if they are weak in this topic based on accuracy
        accuracy_dict = memory_manager.get_topic_accuracy(req.session_id)
        current_topic_acc = accuracy_dict.get(state.current_topic, 100)
        weak_topic_flag = current_topic_acc < 50
        
        # 3. Generate the next question
        next_question_resp = await tutor_agent.generate_question(state.current_topic, state.current_level, state.asked_questions)
        
        # Store new question
        state.last_question = next_question_resp.question
        state.asked_questions.append(next_question_resp.question)
        memory_manager.update_session(req.session_id, state)
        
        return AnswerResponse(
            is_correct=eval_resp.is_correct,
            feedback=eval_resp.feedback,
            hint=eval_resp.hint,
            next_question=next_question_resp.question,
            next_topic=next_question_resp.topic,
            next_level=next_question_resp.level,
            confidence_score=eval_resp.confidence_score,
            weak_topic_flag=weak_topic_flag,
            streak=state.streak
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/progress", response_model=ProgressResponse)
async def get_progress(session_id: str):
    """Returns the user's progress and current level."""
    try:
        state = memory_manager.get_session(session_id)
        accuracy = memory_manager.get_topic_accuracy(session_id)
        
        # Call agent to get suggested next topic based on accuracy
        # (This is lightweight since it doesn't wait for user input)
        # We can just fetch it from the get_session_summary endpoint logic or do it directly.
        # But to be fast, if they have no attempts, we suggest arrays.
        suggested_topic = "Arrays" 
        if accuracy:
            summary_resp = await tutor_agent.get_session_summary(accuracy)
            suggested_topic = summary_resp.suggested_next_topic

        return ProgressResponse(
            current_level=state.current_level,
            score=state.score,
            streak=state.streak,
            weak_topics=state.weak_topics,
            topic_accuracy=accuracy,
            suggested_next_topic=suggested_topic
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/hint", response_model=HintResponse)
async def get_hint(req: HintRequest):
    """Provides a progressive hint for the current question."""
    try:
        state = memory_manager.get_session(req.session_id)
        if not state.last_question or not state.current_topic:
            raise HTTPException(status_code=400, detail="No active question found.")
            
        hint_resp = await tutor_agent.get_progressive_hint(
            question=state.last_question,
            topic=state.current_topic,
            level=state.current_level,
            hint_level=req.hint_level
        )
        return hint_resp
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain", response_model=ExplainResponse)
async def get_explanation(req: ExplainRequest):
    """Provides a step-by-step explanation for the current question."""
    try:
        state = memory_manager.get_session(req.session_id)
        if not state.last_question:
            raise HTTPException(status_code=400, detail="No active question found.")
            
        explain_resp = await tutor_agent.get_explanation(
            question=state.last_question,
            user_answer=req.user_answer
        )
        return explain_resp
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/summary", response_model=SummaryResponse)
async def get_summary(session_id: str):
    """Returns a wrap-up summary of the session."""
    try:
        accuracy = memory_manager.get_topic_accuracy(session_id)
        summary_resp = await tutor_agent.get_session_summary(accuracy)
        return summary_resp
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reset")
def reset_session(req: ResetRequest):
    """Resets the user's session entirely."""
    memory_manager.reset_session(req.session_id)
    return {"message": "Session reset successfully"}

@app.post("/signup", response_model=AuthResponse)
async def signup(req: AuthRequest):
    success = user_manager.signup(req.username, req.password, req.email)
    if success:
        return AuthResponse(success=True, message="Signup successful", session_id=req.username, username=req.username)
    else:
        return AuthResponse(success=False, message="Username already exists")

@app.post("/signin", response_model=AuthResponse)
async def signin(req: AuthRequest):
    result = user_manager.signin(req.username, req.password)
    if result == 'ok':
        return AuthResponse(success=True, message="Signin successful", session_id=req.username, username=req.username)
    elif result == 'user_not_found':
        return AuthResponse(success=False, message="User not found")
    else:
        return AuthResponse(success=False, message="Incorrect password")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
