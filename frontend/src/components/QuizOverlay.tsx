import React, { useEffect, useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { apiClient } from '../lib/api';


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
    setGameMode,
    addToast
  } = useGameStore();

  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showQuestionOnly, setShowQuestionOnly] = useState(false);

  // Load question when quiz becomes active
  useEffect(() => {
    if (isQuizActive && !currentQuestion) {
      loadRandomQuestion();
    }
  }, [isQuizActive, currentQuestion]);

  // Timer countdown
  useEffect(() => {
    if (!isQuizActive || showQuestionOnly) return;

    const timer = setInterval(() => {
      const elapsed = (Date.now() - questionStartTime) / 1000;
      const remaining = Math.max(0, 10 - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        handleTimeout();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [isQuizActive, questionStartTime, showQuestionOnly]);

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

      const correctAnswerText = currentQuestion.correctOption === 'A' ? currentQuestion.optionA :
                               currentQuestion.correctOption === 'B' ? currentQuestion.optionB : 
                               currentQuestion.optionC;

      // Show toast notification
      const toastMessage = result.isCorrect 
        ? 'Correct! Great job!' 
        : `Wrong! The correct answer was: ${currentQuestion.correctOption}. ${correctAnswerText}`;
      
      addToast({
        message: toastMessage,
        type: result.isCorrect ? 'success' : 'error',
        duration: 3000
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

      // Close quiz immediately
      closeQuiz();

    } catch (error) {
      console.error('Failed to submit answer:', error);
      addToast({
        message: 'Error submitting answer. Please try again.',
        type: 'error',
        duration: 3000
      });
      
      closeQuiz();
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeQuiz = () => {
    setQuizActive(false);
    setCurrentQuestion(null);
    setSelectedAnswer('');
    setTimeLeft(10);
    setShowQuestionOnly(false);
  };

  if (!isQuizActive || !currentQuestion) {
    return null;
  }

  const choices = [
    { key: 'A', text: currentQuestion.optionA },
    { key: 'B', text: currentQuestion.optionB },
    { key: 'C', text: currentQuestion.optionC }
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
              onClick={() => {
                setSelectedAnswer(choice.key);
                handleAnswerSubmit(choice.key);
              }}
              disabled={isSubmitting}
            >
              {choice.key}. {choice.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 