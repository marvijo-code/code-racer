import React, { useEffect, useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { apiClient } from '../lib/api';
import type { Question } from '../lib/api';

export const QuizOverlay: React.FC = () => {
  const {
    isQuizActive,
    currentQuestion,
    setCurrentQuestion,
    setQuizActive,
    questionStartTime,
    currentSession,
    lives,
    setLives,
    incrementStreak,
    resetStreak,
    setGameMode
  } = useGameStore();

  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ show: boolean; correct: boolean; message: string }>({
    show: false,
    correct: false,
    message: ''
  });

  // Load question when quiz becomes active
  useEffect(() => {
    if (isQuizActive && !currentQuestion) {
      loadRandomQuestion();
    }
  }, [isQuizActive, currentQuestion]);

  // Timer countdown
  useEffect(() => {
    if (!isQuizActive || feedback.show) return;

    const timer = setInterval(() => {
      const elapsed = (Date.now() - questionStartTime) / 1000;
      const remaining = Math.max(0, 10 - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        handleTimeout();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [isQuizActive, questionStartTime, feedback.show]);

  const loadRandomQuestion = async () => {
    try {
      const question = await apiClient.getRandomQuestion();
      setCurrentQuestion(question);
    } catch (error) {
      console.error('Failed to load question:', error);
      setQuizActive(false);
    }
  };

  const handleTimeout = () => {
    handleAnswerSubmit(''); // Submit empty answer on timeout
  };

  const handleAnswerSubmit = async (answer: string) => {
    if (isSubmitting || !currentQuestion || !currentSession) return;

    setIsSubmitting(true);
    const responseTime = Date.now() - questionStartTime;

    try {
      const result = await apiClient.submitAnswer(currentSession.sessionId, {
        questionId: currentQuestion.questionId,
        userAnswer: answer,
        responseMs: responseTime
      });

      const correctAnswerText = currentQuestion.options[currentQuestion.correctOption];
      setFeedback({
        show: true,
        correct: result.isCorrect,
        message: result.isCorrect 
          ? '🎉 Correct! Great job!' 
          : `❌ Wrong! The correct answer was: ${currentQuestion.correctOption}. ${correctAnswerText}`
      });

      if (result.isCorrect) {
        incrementStreak();
      } else {
        resetStreak();
        setLives(result.livesUsed);
        
        // Check if game over
        if (result.livesUsed >= 3) {
          setGameMode('spectating');
        }
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        closeQuiz();
      }, 2000);

    } catch (error) {
      console.error('Failed to submit answer:', error);
      setFeedback({
        show: true,
        correct: false,
        message: 'Error submitting answer. Please try again.'
      });
      
      setTimeout(() => {
        closeQuiz();
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeQuiz = () => {
    setQuizActive(false);
    setCurrentQuestion(null);
    setSelectedAnswer('');
    setTimeLeft(10);
    setFeedback({ show: false, correct: false, message: '' });
  };

  if (!isQuizActive || !currentQuestion) {
    return null;
  }

  const choices = [
    { key: 'A', text: currentQuestion.options.A },
    { key: 'B', text: currentQuestion.options.B },
    { key: 'C', text: currentQuestion.options.C }
  ];

  return (
    <div className="quiz-overlay">
      <div className="quiz-modal">
        <div className="quiz-header">
          <h2>Checkpoint Challenge!</h2>
          <div className="timer">
            ⏱️ {timeLeft.toFixed(1)}s
          </div>
          <div className="lives">
            ❤️ Lives: {3 - lives}/3
          </div>
        </div>

        {feedback.show ? (
          <div className={`feedback ${feedback.correct ? 'correct' : 'incorrect'}`}>
            <h3>{feedback.message}</h3>
          </div>
        ) : (
          <>
            <div className="question">
              <h3>{currentQuestion.bodyMarkup}</h3>
              <div className="topic-difficulty">
                <span className="topic">{currentQuestion.topic}</span>
                <span className="difficulty">Difficulty: {currentQuestion.difficulty}/10</span>
              </div>
            </div>

            <div className="choices">
              {choices.map((choice) => (
                <button
                  key={choice.key}
                  className={`choice-button ${selectedAnswer === choice.key ? 'selected' : ''}`}
                  onClick={() => setSelectedAnswer(choice.key)}
                  disabled={isSubmitting}
                >
                  {choice.key}. {choice.text}
                </button>
              ))}
            </div>

            <div className="quiz-actions">
              <button
                className="submit-button"
                onClick={() => handleAnswerSubmit(selectedAnswer)}
                disabled={!selectedAnswer || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 