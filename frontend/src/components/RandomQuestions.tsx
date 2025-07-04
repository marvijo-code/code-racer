import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import type { Question } from '../lib/api';

export const RandomQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [fadingQuestions, setFadingQuestions] = useState<Set<number>>(new Set());
  const [timers, setTimers] = useState<{ [key: number]: number }>({});
  const [newQuestions, setNewQuestions] = useState<Set<number>>(new Set());
  const [hasMore, setHasMore] = useState(true);
  const [loadedQuestionIds, setLoadedQuestionIds] = useState<Set<number>>(new Set());
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);

  const fetchInitialQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch 3 initial questions with different topics (let backend choose difficulty)
      const questionPromises = [
        apiClient.getRandomQuestion('JavaScript'),
        apiClient.getRandomQuestion('C#'),
        apiClient.getRandomQuestion('SOLID'),
        apiClient.getRandomQuestion('Algorithms'),
        apiClient.getRandomQuestion(), // Random topic and difficulty
      ];

      const fetchedQuestions = await Promise.allSettled(questionPromises);
      
      const successfulQuestions = fetchedQuestions
        .filter((result): result is PromiseFulfilledResult<Question> => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(q => !loadedQuestionIds.has(q.questionId))
        .slice(0, 3); // Take first 3 unique questions

      if (successfulQuestions.length > 0) {
        setQuestions(successfulQuestions);
        setLoadedQuestionIds(new Set(successfulQuestions.map(q => q.questionId)));
        
        // Mark initial questions as "new" for slide-in animation
        const newQuestionIds = new Set(successfulQuestions.map(q => q.questionId));
        setNewQuestions(newQuestionIds);
        
        // Initialize timers for questions
        const newTimers: { [key: number]: number } = {};
        successfulQuestions.forEach(q => {
          newTimers[q.questionId] = 15; // 15 seconds per question
        });
        setTimers(newTimers);
        
        // After slide-in animation starts, remove "new" state and set active question
        setTimeout(() => {
          setNewQuestions(new Set());
          // Set first question as active if no active question exists
          if (successfulQuestions.length > 0) {
            setActiveQuestionId(successfulQuestions[0].questionId);
          }
        }, 100);
      }
    } catch (err) {
      console.error('Failed to fetch initial questions:', err);
      setError('Failed to load preview questions');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreQuestions = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      
      // Fetch more questions with varied topics (let backend choose best difficulty)
      const questionPromises = [
        apiClient.getRandomQuestion('JavaScript'),
        apiClient.getRandomQuestion('C#'),
        apiClient.getRandomQuestion('SOLID'),
        apiClient.getRandomQuestion('Algorithms'),
        apiClient.getRandomQuestion(), // Random topic and difficulty
        apiClient.getRandomQuestion(), // Random topic and difficulty
      ];

      const fetchedQuestions = await Promise.allSettled(questionPromises);
      
      const successfulQuestions = fetchedQuestions
        .filter((result): result is PromiseFulfilledResult<Question> => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(q => !loadedQuestionIds.has(q.questionId))
        .slice(0, 4); // Take up to 4 new unique questions

      if (successfulQuestions.length > 0) {
        // Double-check for duplicates before adding
        setQuestions(prev => {
          const existingIds = new Set(prev.map(q => q.questionId));
          const uniqueNewQuestions = successfulQuestions.filter(q => !existingIds.has(q.questionId));
          return [...prev, ...uniqueNewQuestions];
        });
        
        setLoadedQuestionIds(prev => new Set([...prev, ...successfulQuestions.map(q => q.questionId)]));
        
        // Mark new questions as "new" for slide-in animation
        const newQuestionIds = new Set(successfulQuestions.map(q => q.questionId));
        setNewQuestions(newQuestionIds);
        
        // Initialize timers for new questions
        setTimers(prev => {
          const newTimers = { ...prev };
          successfulQuestions.forEach(q => {
            newTimers[q.questionId] = 15;
          });
          return newTimers;
        });
        
        // After slide-in animation starts, remove "new" state and set active question if needed
        setTimeout(() => {
          setNewQuestions(new Set());
          // Set active question if none exists
          if (!activeQuestionId) {
            const firstUnansweredQuestion = questions.find(q => !answeredQuestions.has(q.questionId));
            if (firstUnansweredQuestion) {
              setActiveQuestionId(firstUnansweredQuestion.questionId);
            }
          }
        }, 100);
      } else {
        // No more unique questions available
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more questions:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchInitialQuestions();
  }, []);

  // Scroll event handler for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore) return;
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Load more when user scrolls to within 300px of bottom OR when we have fewer than 3 questions
      if (scrollTop + windowHeight >= documentHeight - 300 || questions.length < 3) {
        loadMoreQuestions();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, questions.length]);

  // Auto-load more questions when we have fewer than 2 questions remaining
  useEffect(() => {
    if (!loadingMore && hasMore && questions.length < 2) {
      loadMoreQuestions();
    }
  }, [questions.length, loadingMore, hasMore]);

  const handleTimeOut = (questionId: number) => {
    if (answeredQuestions.has(questionId) || fadingQuestions.has(questionId)) return;
    
    // Auto-submit with no answer (empty string)
    const newAnsweredQuestions = new Set(answeredQuestions).add(questionId);
    setAnsweredQuestions(newAnsweredQuestions);
    
    // Update active question to next unanswered question
    updateActiveQuestion(questionId);

    // After 2 seconds, start fading the question
    setTimeout(() => {
      setFadingQuestions(prev => new Set(prev).add(questionId));
      
      // After fade animation completes (0.5s), remove question from list
      setTimeout(() => {
        setQuestions(prev => prev.filter(q => q.questionId !== questionId));
        setFadingQuestions(prev => {
          const updated = new Set(prev);
          updated.delete(questionId);
          return updated;
        });
        setAnsweredQuestions(prev => {
          const updated = new Set(prev);
          updated.delete(questionId);
          return updated;
        });
        setSelectedAnswers(prev => {
          const updated = { ...prev };
          delete updated[questionId];
          return updated;
        });
        setTimers(prev => {
          const updated = { ...prev };
          delete updated[questionId];
          return updated;
        });
        setLoadedQuestionIds(prev => {
          const updated = new Set(prev);
          updated.delete(questionId);
          return updated;
        });
      }, 500);
    }, 2000);
  };

  // Timer countdown effect - only for active question
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeQuestionId) {
        setTimers(prev => {
          const updated = { ...prev };
          
          // Only countdown for the active question
          if (!answeredQuestions.has(activeQuestionId) && !fadingQuestions.has(activeQuestionId) && !newQuestions.has(activeQuestionId)) {
            if (updated[activeQuestionId] > 0) {
              updated[activeQuestionId] -= 1;
              
              // Auto-submit when timer reaches 0
              if (updated[activeQuestionId] === 0) {
                setTimeout(() => {
                  handleTimeOut(activeQuestionId);
                }, 100);
              }
              
              return updated;
            }
          }
          
          return prev;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [answeredQuestions, fadingQuestions, newQuestions, activeQuestionId]);

  const handleAnswerSelect = (questionId: number, answer: string) => {
    if (answeredQuestions.has(questionId) || fadingQuestions.has(questionId) || activeQuestionId !== questionId) return;
    
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Auto-submit immediately after selection
    handleAnswerSubmit(questionId, answer);
  };

  const handleSkip = (questionId: number) => {
    if (answeredQuestions.has(questionId) || fadingQuestions.has(questionId)) return;
    
    // Mark as answered (skipped)
    const newAnsweredQuestions = new Set(answeredQuestions).add(questionId);
    setAnsweredQuestions(newAnsweredQuestions);
    
    // Update active question to next unanswered question
    updateActiveQuestion(questionId);

    // After 2 seconds, start fading the question
    setTimeout(() => {
      setFadingQuestions(prev => new Set(prev).add(questionId));
      
      // After fade animation completes (0.5s), remove question from list
      setTimeout(() => {
        setQuestions(prev => prev.filter(q => q.questionId !== questionId));
        setFadingQuestions(prev => {
          const updated = new Set(prev);
          updated.delete(questionId);
          return updated;
        });
        setAnsweredQuestions(prev => {
          const updated = new Set(prev);
          updated.delete(questionId);
          return updated;
        });
        setSelectedAnswers(prev => {
          const updated = { ...prev };
          delete updated[questionId];
          return updated;
        });
        setTimers(prev => {
          const updated = { ...prev };
          delete updated[questionId];
          return updated;
        });
        setLoadedQuestionIds(prev => {
          const updated = new Set(prev);
          updated.delete(questionId);
          return updated;
        });
      }, 500);
    }, 2000);
  };

  const updateActiveQuestion = (completedQuestionId: number) => {
    // Find the next unanswered question
    const nextActiveQuestion = questions.find(q => 
      q.questionId !== completedQuestionId && 
      !answeredQuestions.has(q.questionId) && 
      !fadingQuestions.has(q.questionId)
    );
    
    if (nextActiveQuestion) {
      setActiveQuestionId(nextActiveQuestion.questionId);
    } else {
      setActiveQuestionId(null);
    }
  };

  const handleAnswerSubmit = async (questionId: number, answer?: string) => {
    const selectedAnswer = answer || selectedAnswers[questionId];
    if (!selectedAnswer) return;

    // Mark question as answered
    const newAnsweredQuestions = new Set(answeredQuestions).add(questionId);
    setAnsweredQuestions(newAnsweredQuestions);
    
    // Update active question to next unanswered question
    updateActiveQuestion(questionId);

    // After 2 seconds, start fading the question
    setTimeout(() => {
      setFadingQuestions(prev => new Set(prev).add(questionId));
      
      // After fade animation completes (0.5s), remove question from list
      setTimeout(() => {
        setQuestions(prev => prev.filter(q => q.questionId !== questionId));
        setFadingQuestions(prev => {
          const updated = new Set(prev);
          updated.delete(questionId);
          return updated;
        });
        setAnsweredQuestions(prev => {
          const updated = new Set(prev);
          updated.delete(questionId);
          return updated;
        });
        setSelectedAnswers(prev => {
          const updated = { ...prev };
          delete updated[questionId];
          return updated;
        });
        setTimers(prev => {
          const updated = { ...prev };
          delete updated[questionId];
          return updated;
        });
        setLoadedQuestionIds(prev => {
          const updated = new Set(prev);
          updated.delete(questionId);
          return updated;
        });
      }, 500);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="random-questions-container">
        <h3>🧠 Question Preview</h3>
        <p>Loading questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="random-questions-container">
        <h3>🧠 Question Preview</h3>
        <p className="error-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="random-questions-container">
      <h3>🧠 Question Preview</h3>
      <p className="preview-description">
        Practice with real questions from our database! Click on options to answer and test your knowledge before racing.
      </p>
      
      <div className="questions-grid">
        {questions
          .filter((question, index, arr) => 
            // Remove duplicates - keep only first occurrence of each questionId
            arr.findIndex(q => q.questionId === question.questionId) === index
          )
          .map((question, index) => {
          const isAnswered = answeredQuestions.has(question.questionId);
          const selectedAnswer = selectedAnswers[question.questionId];
          const isCorrect = selectedAnswer === question.correctOption;
          const isFading = fadingQuestions.has(question.questionId);
          const isNew = newQuestions.has(question.questionId);
          const isActive = activeQuestionId === question.questionId;
          
          return (
            <div key={question.questionId} className={`question-preview ${isAnswered ? 'answered' : ''} ${isFading ? 'fading' : ''} ${isNew ? 'new-question' : ''} ${isActive ? 'active' : ''}`}>
              <div className="question-header">
                <div className="question-meta">
                  <span className="question-topic">{question.topic}</span>
                  <span className="question-difficulty">
                    {'★'.repeat(question.difficulty)}
                  </span>
                </div>
                {!isAnswered && !isFading && activeQuestionId === question.questionId && (
                  <div className="timer-controls">
                    <button 
                      className="skip-button"
                      onClick={() => handleSkip(question.questionId)}
                      title="Skip this question"
                    >
                      ⏭️
                    </button>
                    <div className={`timer ${timers[question.questionId] <= 5 && !isNew ? 'timer-warning' : ''}`}>
                      ⏱️ {timers[question.questionId] || 15}s
                    </div>
                  </div>
                )}
              </div>
              
              <div className="question-body">
                <h4>{question.bodyMarkup}</h4>
              </div>
              
              <div className="question-options">
                {['A', 'B', 'C'].map(optionLetter => {
                  const optionText = question[`option${optionLetter}` as keyof Question] as string;
                  const isSelected = selectedAnswer === optionLetter;
                  const isCorrectOption = question.correctOption === optionLetter;
                  
                  return (
                    <div 
                      key={optionLetter}
                      className={`option ${isSelected ? 'selected' : ''} ${isAnswered ? (isCorrectOption ? 'correct' : isSelected ? 'incorrect' : '') : ''} ${!isActive && !isAnswered ? 'inactive' : ''}`}
                      onClick={() => !isAnswered && isActive && handleAnswerSelect(question.questionId, optionLetter)}
                    >
                      <span className="option-letter">{optionLetter}</span>
                      <span className="option-text">{optionText}</span>
                      {isAnswered && isCorrectOption && <span className="correct-indicator">✅</span>}
                      {isAnswered && isSelected && !isCorrectOption && <span className="incorrect-indicator">❌</span>}
                    </div>
                  );
                })}
              </div>
              

              
              {isAnswered && (
                <div className={`answer-result ${isCorrect ? 'correct' : selectedAnswer ? 'incorrect' : 'timeout'}`}>
                  {!selectedAnswer ? (
                    <span>⏰ Time's up! The correct answer was {question.correctOption}</span>
                  ) : isCorrect ? (
                    <span>🎉 Correct! Well done!</span>
                  ) : (
                    <span>❌ Incorrect. The correct answer was {question.correctOption}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {loadingMore && (
        <div className="loading-more">
          <p>Loading more questions...</p>
        </div>
      )}
      
      {!hasMore && questions.length > 0 && (
        <div className="no-more-questions">
          <p>🎉 You've explored all available questions! Great job!</p>
          <p>New questions are added regularly, so check back later!</p>
        </div>
      )}
      
      <div className="preview-footer">
        <p>💡 <strong>Pro Tip:</strong> You have 15 seconds per question here, but only {questions[0]?.timeLimit || 10} seconds while racing!</p>
        <p>🎯 Click any option to instantly submit your answer! Answered questions will fade away and new ones will load automatically!</p>
      </div>
    </div>
  );
}; 