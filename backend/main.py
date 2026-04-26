from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from typing import List, Optional, Dict, Any

from memory import memory_manager
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

# --- Schemas ---

class StartRequest(BaseModel):
    session_id: str
    topic: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None

class StartResponse(BaseModel):
    question: str
    topic: str
    level: str
    boilerplate_code: Optional[str] = None
    visualization_idea: Optional[str] = None
    test_cases: Optional[List[Dict[str, str]]] = None

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
    next_boilerplate: Optional[str] = None
    next_visualization: Optional[str] = None
    next_test_cases: Optional[List[Dict[str, str]]] = None
    test_case_results: Optional[List[Dict[str, Any]]] = None
    confidence_score: int
    weak_topic_flag: bool
    streak: int
    auto_hint: Optional[str] = None
    auto_explanation: Optional[str] = None
    suggested_next_topic: Optional[str] = None
    topic_level: str

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

class SuggestTopicRequest(BaseModel):
    session_id: str

class GenerateProblemRequest(BaseModel):
    session_id: str
    topic: str

class RunCodeRequest(BaseModel):
    session_id: str
    code: str
    language: str = "python"
    question: Optional[str] = None

class PlacementAnswer(BaseModel):
    difficulty: str
    correct: bool

class SubmitPlacementRequest(BaseModel):
    session_id: str
    answers: List[PlacementAnswer]

# --- Endpoints ---

@app.get("/")
def root():
    return {
        "message": "Adaptive DSA Tutor API is running!",
        "docs": "Visit /docs to test all endpoints",
        "endpoints": ["/start", "/answer", "/progress", "/hint", "/explain", "/summary", "/reset", "/suggest-topic", "/generate-problem", "/run-code"]
    }

@app.post("/start", response_model=StartResponse)
def start_session(req: StartRequest):
    """Initializes a session and returns the first question."""
    try:
        # Get or create session
        state = memory_manager.get_session(req.session_id)
        state.current_topic = req.topic
        
        # Update user details if provided
        if req.user_name: state.user_name = req.user_name
        if req.user_email: state.user_email = req.user_email
        
        # Get topic specific level
        topic_level = state.topic_levels.get(req.topic, state.current_level)
        
        # Generate question based on current topic and level
        question_resp = tutor_agent.generate_question(req.topic, topic_level, state.asked_questions)
        
        state.last_question = question_resp.question
        state.last_boilerplate = question_resp.boilerplate_code
        state.last_visualization = question_resp.visualization_idea
        state.last_test_cases = question_resp.test_cases
        state.asked_questions.append(question_resp.question)
        memory_manager.update_session(req.session_id, state)
        
        return StartResponse(
            question=question_resp.question,
            topic=question_resp.topic,
            level=question_resp.level,
            boilerplate_code=question_resp.boilerplate_code,
            visualization_idea=question_resp.visualization_idea,
            test_cases=question_resp.test_cases
        )
    except Exception as e:
        print(f"ERROR in start_session: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/answer", response_model=AnswerResponse)
def submit_answer(req: AnswerRequest):
    """Evaluates the given answer and returns feedback + next question."""
    try:
        state = memory_manager.get_session(req.session_id)
        
        if not state.last_question or not state.current_topic:
            raise HTTPException(status_code=400, detail="No active question found. Please call /start first.")
            
        topic_level = state.topic_levels.get(state.current_topic, state.current_level)

        # 1. Evaluate the answer
        eval_resp = tutor_agent.evaluate_answer(
            question=state.last_question,
            answer=req.answer,
            topic=state.current_topic,
            level=topic_level
        )
        
        # 2. Update memory (score, streak, weak_topics, adaptive level)
        memory_manager.record_answer(req.session_id, state.current_topic, eval_resp.is_correct)
        
        # Reload state after update
        state = memory_manager.get_session(req.session_id)
        
        auto_hint = None
        auto_explanation = None
        suggested_next_topic = None
        
        # Feature 2: Auto hint after 2 wrong
        if not eval_resp.is_correct and state.consecutive_wrong >= 2:
            hint_resp = tutor_agent.get_progressive_hint(
                state.last_question, state.current_topic, topic_level, 1
            )
            auto_hint = hint_resp.hint
            
        if not eval_resp.is_correct and state.consecutive_wrong >= 3:
            exp_resp = tutor_agent.get_explanation(
                state.last_question, req.answer
            )
            auto_explanation = exp_resp.explanation
            # Reset consecutive wrong
            state.consecutive_wrong = 0
            memory_manager.update_session(req.session_id, state)
            # Record answer already downgraded level for this topic if streak <= -3
            # So the next topic_level will naturally be easier
        
        # Refresh topic level in case it was updated by record_answer
        topic_level = state.topic_levels.get(state.current_topic, state.current_level)
        
        # Check if they are weak in this topic based on accuracy
        accuracy_dict = memory_manager.get_topic_accuracy(req.session_id)
        current_topic_acc = accuracy_dict.get(state.current_topic, 100)
        weak_topic_flag = current_topic_acc < 50
        
        # Agent suggests next topic for the response if needed, 
        # Though the prompt mentions POST /suggest-topic, adding it here too just in case.
        if accuracy_dict:
            suggested_next_topic = tutor_agent.suggest_next_topic(accuracy_dict).get("suggested_topic")
        
        # 3. Generate the next question
        next_question_resp = tutor_agent.generate_question(state.current_topic, topic_level, state.asked_questions)
        
        state.last_question = next_question_resp.question
        state.last_boilerplate = next_question_resp.boilerplate_code
        state.last_visualization = next_question_resp.visualization_idea
        state.last_test_cases = next_question_resp.test_cases
        state.asked_questions.append(next_question_resp.question)
        memory_manager.update_session(req.session_id, state)
        
        return AnswerResponse(
            is_correct=eval_resp.is_correct,
            feedback=eval_resp.feedback,
            hint=eval_resp.hint,
            next_question=next_question_resp.question,
            next_topic=next_question_resp.topic,
            next_level=next_question_resp.level,
            next_boilerplate=next_question_resp.boilerplate_code,
            next_visualization=next_question_resp.visualization_idea,
            next_test_cases=next_question_resp.test_cases,
            test_case_results=eval_resp.test_case_results,
            confidence_score=eval_resp.confidence_score,
            weak_topic_flag=weak_topic_flag,
            streak=state.streak,
            auto_hint=auto_hint,
            auto_explanation=auto_explanation,
            suggested_next_topic=suggested_next_topic,
            topic_level=topic_level
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/progress", response_model=ProgressResponse)
def get_progress(session_id: str):
    """Returns the user's progress and current level."""
    try:
        state = memory_manager.get_session(session_id)
        accuracy = memory_manager.get_topic_accuracy(session_id)
        
        suggested_topic = "Arrays" 
        if accuracy:
            summary_resp = tutor_agent.get_session_summary(accuracy)
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
def get_hint(req: HintRequest):
    """Provides a progressive hint for the current question."""
    try:
        state = memory_manager.get_session(req.session_id)
        if not state.last_question or not state.current_topic:
            raise HTTPException(status_code=400, detail="No active question found.")
            
        topic_level = state.topic_levels.get(state.current_topic, state.current_level)
            
        hint_resp = tutor_agent.get_progressive_hint(
            question=state.last_question,
            topic=state.current_topic,
            level=topic_level,
            hint_level=req.hint_level
        )
        return hint_resp
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain", response_model=ExplainResponse)
def get_explanation(req: ExplainRequest):
    """Provides a step-by-step explanation for the current question."""
    try:
        state = memory_manager.get_session(req.session_id)
        if not state.last_question:
            raise HTTPException(status_code=400, detail="No active question found.")
            
        explain_resp = tutor_agent.get_explanation(
            question=state.last_question,
            user_answer=req.user_answer
        )
        return explain_resp
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/summary", response_model=SummaryResponse)
def get_summary(session_id: str):
    """Returns a wrap-up summary of the session."""
    try:
        accuracy = memory_manager.get_topic_accuracy(session_id)
        summary_resp = tutor_agent.get_session_summary(accuracy)
        return summary_resp
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/complete_assessment")
def complete_assessment(req: ResetRequest):
    """Marks the assessment as complete for the session."""
    state = memory_manager.get_session(req.session_id)
    state.is_assessed = True
    memory_manager.update_session(req.session_id, state)
    return {"message": "Assessment marked as complete"}

@app.post("/reset")
def reset_session(req: ResetRequest):
    """Resets the user's session entirely."""
    memory_manager.reset_session(req.session_id)
    return {"message": "Session reset successfully"}

@app.get("/resume")
def resume_session(session_id: str):
    """Checks if a session exists and returns the current state for resuming."""
    try:
        state = memory_manager.get_session(session_id)
        if not state.last_question or not state.current_topic:
            return {"can_resume": False}
            
        topic_level = state.topic_levels.get(state.current_topic, state.current_level)
            
        return {
            "can_resume": True,
            "topic": state.current_topic,
            "question": state.last_question,
            "boilerplate": state.last_boilerplate,
            "visualization": state.last_visualization,
            "test_cases": state.last_test_cases,
            "level": topic_level,
            "user_name": state.user_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/suggest-topic")
def suggest_topic(req: SuggestTopicRequest):
    """Suggests the best next topic for the user."""
    try:
        accuracy = memory_manager.get_topic_accuracy(req.session_id)
        suggestion = tutor_agent.suggest_next_topic(accuracy)
        return suggestion
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-problem")
def generate_problem(req: GenerateProblemRequest):
    """Generates a LeetCode style problem."""
    try:
        state = memory_manager.get_session(req.session_id)
        topic_level = state.topic_levels.get(req.topic, state.current_level)
        problem = tutor_agent.generate_problem_statement(req.topic, topic_level, state.asked_questions)
        
        # Store in session memory
        state.current_topic = req.topic
        state.last_question = problem.get("description", "")
        state.last_test_cases = problem.get("test_cases", [])
        state.asked_questions.append(problem.get("title", ""))
        memory_manager.update_session(req.session_id, state)
        
        return problem
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/run-code")
def run_code(req: RunCodeRequest):
    """Analyzes student code using AI without executing it."""
    try:
        state = memory_manager.get_session(req.session_id)
        question = req.question or state.last_question or "Unknown question"
        test_cases = state.last_test_cases or []

        import time
        start_time = time.time()

        result = tutor_agent.analyze_code(
            code=req.code,
            language=req.language,
            question=question,
            test_cases=test_cases
        )

        elapsed = round(time.time() - start_time, 1)
        result["analysis_time"] = f"{elapsed}s"

        return result
    except Exception as e:
        print(f"ERROR in run_code: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/visualize")
def get_visualization(req: ResetRequest):
    """Generates a step-by-step visualization for the current question."""
    try:
        state = memory_manager.get_session(req.session_id)
        if not state.last_question or not state.current_topic:
            raise HTTPException(status_code=400, detail="No active question found to visualize.")
            
        viz_data = tutor_agent.generate_visualization(
            question=state.last_question,
            topic=state.current_topic
        )
        return viz_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in get_visualization: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/placement-quiz")
def get_placement_quiz():
    """Generates the 5-question placement quiz."""
    try:
        quiz = tutor_agent.generate_placement_quiz()
        return quiz
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/submit-placement")
def submit_placement(req: SubmitPlacementRequest):
    """Evaluates the placement quiz and sets the user's initial level."""
    try:
        pts = 0
        max_pts = 0
        for ans in req.answers:
            w = 3 if ans.difficulty == "advanced" else 2 if ans.difficulty == "intermediate" else 1
            max_pts += w
            if ans.correct:
                pts += w
        
        ratio = pts / max_pts if max_pts > 0 else 0
        if ratio >= 0.7:
            level = "advanced"
        elif ratio >= 0.4:
            level = "intermediate"
        else:
            level = "beginner"
            
        state = memory_manager.get_session(req.session_id)
        state.current_level = level
        for t in ["Arrays", "Linked Lists", "Trees", "Sorting", "Searching"]:
            state.topic_levels[t] = level
        memory_manager.update_session(req.session_id, state)
        
        correct_count = sum(1 for a in req.answers if a.correct)
        return {"level": level, "correct": correct_count, "total": len(req.answers)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
