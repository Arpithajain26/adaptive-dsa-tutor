import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Lightbulb, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function Chat({ topic, scoreData, setScoreData }) {
  const [question, setQuestion] = useState('Loading your first question...');
  const [questionNum, setQuestionNum] = useState(1);
  const [answerInput, setAnswerInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null); // { correct: boolean, text: string, next_question?: string }
  const [hint, setHint] = useState('');
  const [showHintLoading, setShowHintLoading] = useState(false);

  const textareaRef = useRef(null);

  // Focus textarea on load and after next question
  useEffect(() => {
    if (!loading && !feedback && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [loading, feedback]);

  const handleSubmit = async () => {
    if (!answerInput.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post('/api/answer', { answer: answerInput, hint: false });
      
      setFeedback({
        correct: res.data.correct,
        text: res.data.feedback,
        next_question: res.data.next_question
      });
      
      // Optioanlly update score immediately if successful
      if (res.data.correct) {
         setScoreData(prev => ({
             ...prev,
             score: prev.score + 1,
             streak: prev.streak + 1
         }));
      } else {
         setScoreData(prev => ({
             ...prev,
             streak: 0
         }));
      }

    } catch (err) {
      console.error(err);
      setError('Server not connected. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetHint = async () => {
    setShowHintLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/answer', { answer: '', hint: true });
      if (res.data.hint) {
        setHint(res.data.hint);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to get hint. Server not connected.');
    } finally {
      setShowHintLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (feedback?.next_question) {
      setQuestion(feedback.next_question);
      setQuestionNum(q => q + 1);
    }
    setFeedback(null);
    setAnswerInput('');
    setHint('');
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-6 gap-6 animate-fade-in pb-24">
      
      {/* Header Info */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-white/90">Topic: {topic}</h2>
      </div>

      {/* Question Card */}
      <div className="glass-card border-l-4 border-l-primary p-6 relative">
        <div className="text-primary text-sm font-bold mb-3 tracking-widest uppercase">
          Question #{questionNum}
        </div>
        <div className="text-xl md:text-2xl font-semibold leading-relaxed">
          {question}
        </div>
      </div>

      {/* Answer Input Area */}
      <div className="flex flex-col gap-4 relative">
        <textarea
          ref={textareaRef}
          value={answerInput}
          onChange={(e) => setAnswerInput(e.target.value)}
          placeholder="Type your answer here..."
          disabled={loading || !!feedback}
          className="w-full h-40 bg-[#0D0221]/50 border border-white/10 rounded-xl p-5 text-white placeholder-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none shadow-inner disabled:opacity-50"
        />
        <div className="absolute bottom-4 right-4 text-xs text-white/40 font-mono">
          {answerInput.length} chars
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-wrong/20 border border-wrong/50 text-wrong px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Controls */}
      {!feedback ? (
        <div className="flex justify-between items-center mt-2">
          <button
            onClick={handleGetHint}
            disabled={loading || showHintLoading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-hint bg-hint/10 border border-hint/20 hover:bg-hint/20 hover:border-hint/40 transition-all disabled:opacity-50"
          >
            {showHintLoading ? (
              <div className="w-5 h-5 border-2 border-hint border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Lightbulb size={20} />
            )}
            💡 Get Hint
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={loading || !answerInput.trim()}
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-dark bg-primary hover:bg-[#00b3d6] hover:shadow-[0_0_15px_rgba(0,212,255,0.5)] transition-all disabled:opacity-50 disabled:hover:shadow-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Submit Answer
                <Send size={18} className="ml-1" />
              </>
            )}
          </button>
        </div>
      ) : null}

      {/* Hint Display */}
      {hint && !feedback && (
        <div className="glass-card border border-hint/30 bg-hint/5 p-5 mt-4 relative overflow-hidden animate-fade-in shadow-[0_0_20px_rgba(255,215,0,0.1)]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-hint"></div>
          <div className="flex items-center gap-2 text-hint font-bold mb-2">
            <Lightbulb size={18} />
            💡 Hint:
          </div>
          <p className="text-white/90 leading-relaxed">{hint}</p>
        </div>
      )}

      {/* Feedback Card */}
      {feedback && (
        <div className={`glass-card p-6 border animate-fade-in transform transition-all shadow-lg ${
          feedback.correct 
            ? 'border-correct/50 bg-correct/5 green-glow' 
            : 'border-wrong/50 bg-wrong/5 shadow-[0_0_15px_rgba(255,68,68,0.2)]'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`mt-1 ${feedback.correct ? 'text-correct' : 'text-wrong'}`}>
              {feedback.correct ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
            </div>
            
            <div className="flex-1">
              <h3 className={`text-xl font-bold mb-3 ${feedback.correct ? 'text-correct' : 'text-wrong'}`}>
                {feedback.correct ? 'Correct! Well done 🎉' : 'Not quite! Try again'}
              </h3>
              
              <div className="text-white/90 leading-relaxed mb-6 whitespace-pre-wrap">
                {feedback.text}
              </div>

              <div className="flex justify-end mt-4">
                {feedback.correct ? (
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-correct/20 text-correct hover:bg-correct hover:text-dark transition-all"
                  >
                    Next Question <ArrowRight size={18} />
                  </button>
                ) : (
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setFeedback(null);
                        setAnswerInput('');
                      }}
                      className="px-6 py-2 rounded-xl font-semibold border border-white/20 hover:bg-white/10 transition-all"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => {
                        setFeedback(null);
                        handleGetHint();
                      }}
                      className="flex items-center gap-2 px-6 py-2 rounded-xl font-semibold bg-hint/20 text-hint hover:bg-hint hover:text-dark transition-all"
                    >
                      💡 Get Hint
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
