import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import type { Question } from '../lib/api';

export const RandomQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});

  const fetchRandomQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch 2 random questions with different topics/difficulties
      const questionPromises = [
        apiClient.getRandomQuestion('JavaScript', 1),
        apiClient.getRandomQuestion('C#', 2),
        apiClient.getRandomQuestion('SOLID', 3),
        apiClient.getRandomQuestion('Algorithms', 4),
        apiClient.getRandomQuestion(), // Random topic and difficulty
      ];

      const fetchedQuestions = await Promise.allSettled(questionPromises);
      
      const successfulQuestions = fetchedQuestions
        .filter((result): result is PromiseFulfilledResult<Question> => result.status === 'fulfilled')
        .map(result => result.value)
        .slice(0, 2); // Take only first 2 questions

      setQuestions(successfulQuestions);
      setAnsweredQuestions(new Set());
      setSelectedAnswers({});
    } catch (err) {
      console.error('Failed to fetch random questions:', err);
      setError('Failed to load preview questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomQuestions();
  }, []);

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleAnswerSubmit = async (questionId: number) => {
    const selectedAnswer = selectedAnswers[questionId];
    if (!selectedAnswer) return;

    // Mark question as answered
    setAnsweredQuestions(prev => new Set(prev).add(questionId));

    // After 2 seconds, fetch new questions if both are answered
    setTimeout(() => {
      if (answeredQuestions.size + 1 >= 2) {
        fetchRandomQuestions();
      }
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
        Here's a taste of what you'll face in the race! Test your knowledge while driving at high speed.
      </p>
      
      <div className="questions-grid">
        {questions.map((question, index) => {
          const isAnswered = answeredQuestions.has(question.questionId);
          const selectedAnswer = selectedAnswers[question.questionId];
          const isCorrect = selectedAnswer === question.correctOption;
          
          return (
            <div key={question.questionId} className={`question-preview ${isAnswered ? 'answered' : ''}`}>
              <div className="question-header">
                <span className="question-topic">{question.topic}</span>
                <span className="question-difficulty">
                  {'★'.repeat(question.difficulty)}
                </span>
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
                      className={`option ${isSelected ? 'selected' : ''} ${isAnswered ? (isCorrectOption ? 'correct' : isSelected ? 'incorrect' : '') : ''}`}
                      onClick={() => !isAnswered && handleAnswerSelect(question.questionId, optionLetter)}
                    >
                      <span className="option-letter">{optionLetter}</span>
                      <span className="option-text">{optionText}</span>
                      {isAnswered && isCorrectOption && <span className="correct-indicator">✅</span>}
                      {isAnswered && isSelected && !isCorrectOption && <span className="incorrect-indicator">❌</span>}
                    </div>
                  );
                })}
              </div>
              
              {!isAnswered && selectedAnswer && (
                <button 
                  className="submit-answer-btn"
                  onClick={() => handleAnswerSubmit(question.questionId)}
                >
                  Submit Answer
                </button>
              )}
              
              {isAnswered && (
                <div className={`answer-result ${isCorrect ? 'correct' : 'incorrect'}`}>
                  {isCorrect ? (
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
      
      <div className="preview-footer">
        <p>💡 <strong>Pro Tip:</strong> You'll have {questions[0]?.timeLimit || 10} seconds to answer each question while racing!</p>
      </div>
    </div>
  );
}; 