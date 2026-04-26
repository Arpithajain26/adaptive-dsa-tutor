import json
import os
import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

SESSION_FILE = "session_data.json"

class SessionState(BaseModel):
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    current_level: str = "beginner"
    score: int = 0
    streak: int = 0
    weak_topics: List[str] = Field(default_factory=list)
    current_topic: Optional[str] = None
    last_question: Optional[str] = None
    last_boilerplate: Optional[str] = None
    last_visualization: Optional[str] = None
    last_test_cases: Optional[List[Dict[str, str]]] = None
    is_assessed: bool = False
    topic_attempts: Dict[str, int] = Field(default_factory=dict)
    topic_correct: Dict[str, int] = Field(default_factory=dict)
    asked_questions: List[str] = Field(default_factory=list)
    total_questions: int = 0
    correct_answers: int = 0
    created_at: str = Field(default_factory=lambda: datetime.datetime.now().isoformat())
    last_updated: str = Field(default_factory=lambda: datetime.datetime.now().isoformat())
    
    # Core Feature 1: Consecutive wrong tracking and per topic levels
    consecutive_wrong: int = 0
    topic_levels: Dict[str, str] = Field(default_factory=dict)
    mistake_patterns: List[str] = Field(default_factory=list)

class MemoryManager:
    def __init__(self):
        # In-memory dictionary mapping session_id -> SessionState
        self.sessions: Dict[str, SessionState] = {}
        self._load_all()

    def _load_all(self):
        if os.path.exists(SESSION_FILE):
            with open(SESSION_FILE, "r") as f:
                try:
                    data = json.load(f)
                    for sid, sdata in data.items():
                        self.sessions[sid] = SessionState(**sdata)
                except Exception as e:
                    print(f"Error loading session data: {e}")

    def _save_all(self):
        with open(SESSION_FILE, "w") as f:
            data = {sid: state.model_dump() for sid, state in self.sessions.items()}
            json.dump(data, f, indent=2)

    def get_session(self, session_id: str) -> SessionState:
        """Retrieve a session, creating it if it doesn't exist."""
        if session_id not in self.sessions:
            self.sessions[session_id] = SessionState()
            self._save_all()
        return self.sessions[session_id]

    def update_session(self, session_id: str, state: SessionState):
        """Update an existing session state."""
        state.last_updated = datetime.datetime.now().isoformat()
        self.sessions[session_id] = state
        self._save_all()
        
    def reset_session(self, session_id: str):
        """Reset the session state to start fresh."""
        self.sessions[session_id] = SessionState()
        self._save_all()

    def get_topic_accuracy(self, session_id: str) -> Dict[str, int]:
        """Calculates accuracy percentage per topic."""
        state = self.get_session(session_id)
        accuracy = {}
        for topic, attempts in state.topic_attempts.items():
            if attempts > 0:
                correct = state.topic_correct.get(topic, 0)
                accuracy[topic] = int((correct / attempts) * 100)
        return accuracy

    def get_session_analytics(self, session_id: str) -> dict:
        """Returns structured analytics for the session."""
        state = self.get_session(session_id)
        topic_stats = self.get_topic_accuracy(session_id)
        
        weakest = min(topic_stats, key=topic_stats.get) if topic_stats else None
        strongest = max(topic_stats, key=topic_stats.get) if topic_stats else None
        
        return {
            "total_questions": state.total_questions,
            "correct_answers": state.correct_answers,
            "accuracy": round((state.correct_answers / max(state.total_questions, 1)) * 100, 1),
            "weakest_topic": weakest,
            "strongest_topic": strongest,
            "current_streak": state.streak,
            "level": state.current_level
        }

    def record_answer(self, session_id: str, topic: str, is_correct: bool):
        """Update score, streak, level, and accuracy based on answer correctness."""
        state = self.get_session(session_id)
        
        state.total_questions += 1
        
        # Track attempts and correct answers per topic
        state.topic_attempts[topic] = state.topic_attempts.get(topic, 0) + 1
        
        if is_correct:
            state.correct_answers += 1
            state.topic_correct[topic] = state.topic_correct.get(topic, 0) + 1
            state.score += 10
            state.streak = max(1, state.streak + 1)
            
            # Reset consecutive wrong
            state.consecutive_wrong = 0
            
            # Remove from weak topics if they get it right
            if topic in state.weak_topics:
                state.weak_topics.remove(topic)
        else:
            state.streak = min(-1, state.streak - 1)
            
            # Increment consecutive wrong
            state.consecutive_wrong += 1
            
            # If consecutive wrong >= 2, add to weak topics
            if state.consecutive_wrong >= 2:
                if topic not in state.weak_topics:
                    state.weak_topics.append(topic)
        
        # Adaptive difficulty logic per topic
        if state.streak >= 3:
            self._upgrade_level(state, topic)
            state.streak = 0 # reset streak after level change
        elif state.streak <= -3:
            self._downgrade_level(state, topic)
            state.streak = 0 # reset streak after level change
            
        self.update_session(session_id, state)
        
    def _upgrade_level(self, state: SessionState, topic: str):
        current = state.topic_levels.get(topic, state.current_level)
        if current == "beginner":
            state.topic_levels[topic] = "intermediate"
        elif current == "intermediate":
            state.topic_levels[topic] = "advanced"

    def _downgrade_level(self, state: SessionState, topic: str):
        current = state.topic_levels.get(topic, state.current_level)
        if current == "advanced":
            state.topic_levels[topic] = "intermediate"
        elif current == "intermediate":
            state.topic_levels[topic] = "beginner"

# Global memory manager instance for the app
memory_manager = MemoryManager()
