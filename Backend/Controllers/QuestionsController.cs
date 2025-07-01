#pragma warning disable SKEXP0110

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.Services;

namespace Backend.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class QuestionsController : ControllerBase
{
    private readonly GameDbContext _context;
    private readonly MilvusService _milvusService;
    private readonly ILogger<QuestionsController> _logger;

    public QuestionsController(GameDbContext context, MilvusService milvusService, ILogger<QuestionsController> logger)
    {
        _context = context;
        _milvusService = milvusService;
        _logger = logger;
    }

    [HttpGet("random")]
    public async Task<ActionResult<object>> GetRandomQuestion(
        [FromQuery] string? topic = null, 
        [FromQuery] int? difficulty = null,
        [FromQuery] int? sessionId = null)
    {
        try
        {
            var query = _context.Questions.AsQueryable();

            if (!string.IsNullOrEmpty(topic))
            {
                query = query.Where(q => q.Topic == topic);
            }

            if (difficulty.HasValue)
            {
                query = query.Where(q => q.Difficulty == difficulty.Value);
            }

            // Get session question history for semantic filtering
            List<int> excludeQuestionIds = new();
            if (sessionId.HasValue)
            {
                try
                {
                    // Get recent questions from this session
                    var sessionQuestions = await _context.SessionQuestions
                        .Where(sq => sq.SessionId == sessionId.Value)
                        .OrderByDescending(sq => sq.AskedAt)
                        .Take(10) // Last 10 questions
                        .Include(sq => sq.Question)
                        .ToListAsync();

                    if (sessionQuestions.Any())
                    {
                        // Get embeddings for session questions
                        var sessionEmbeddings = sessionQuestions
                            .Where(sq => sq.Question.EmbeddingVector != null && sq.Question.EmbeddingVector.Length > 0)
                            .Select(sq => sq.Question.EmbeddingVector)
                            .ToList();

                        if (sessionEmbeddings.Any())
                        {
                            // Find semantically similar questions to exclude
                            var similarQuestionIds = await _milvusService.GetSimilarQuestionIdsAsync(
                                sessionEmbeddings, topic, difficulty);
                            excludeQuestionIds.AddRange(similarQuestionIds);
                        }

                        // Also exclude questions already asked in this session
                        excludeQuestionIds.AddRange(sessionQuestions.Select(sq => sq.QuestionId));
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to apply semantic filtering for session {SessionId}", sessionId);
                    // Continue without semantic filtering
                }
            }

            // Apply exclusions
            if (excludeQuestionIds.Any())
            {
                query = query.Where(q => !excludeQuestionIds.Contains(q.QuestionId));
            }

            var availableQuestions = await query.ToListAsync();
            if (!availableQuestions.Any())
            {
                // Fallback: if no questions available after filtering, get any question
                _logger.LogInformation("No questions available after semantic filtering, falling back to any question");
                query = _context.Questions.AsQueryable();
                
                if (!string.IsNullOrEmpty(topic))
                {
                    query = query.Where(q => q.Topic == topic);
                }
                if (difficulty.HasValue)
                {
                    query = query.Where(q => q.Difficulty == difficulty.Value);
                }
                
                availableQuestions = await query.ToListAsync();
                if (!availableQuestions.Any())
                {
                    return NotFound("No questions found matching the criteria");
                }
            }

            // Select random question from available ones
            var random = new Random();
            var question = availableQuestions[random.Next(availableQuestions.Count)];

            // Record this question in the session if sessionId provided
            if (sessionId.HasValue)
            {
                try
                {
                    var sessionQuestion = new SessionQuestion
                    {
                        SessionId = sessionId.Value,
                        QuestionId = question.QuestionId,
                        OrderIndex = await _context.SessionQuestions
                            .Where(sq => sq.SessionId == sessionId.Value)
                            .CountAsync() + 1
                    };
                    
                    _context.SessionQuestions.Add(sessionQuestion);
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to record session question for session {SessionId}", sessionId);
                    // Continue - this is not critical
                }
            }

            // Return question in the expected frontend format
            return new
            {
                questionId = question.QuestionId,
                topic = question.Topic,
                difficulty = question.Difficulty,
                bodyMarkup = question.BodyMarkup,
                options = new
                {
                    A = question.OptionA,
                    B = question.OptionB,
                    C = question.OptionC
                },
                correctOption = question.CorrectOption.ToString(),
                timeLimit = 10 // 10 seconds for all questions
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting random question");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("topics")]
    public async Task<ActionResult<IEnumerable<string>>> GetTopics()
    {
        var topics = await _context.Questions
            .Select(q => q.Topic)
            .Distinct()
            .OrderBy(t => t)
            .ToListAsync();

        return topics;
    }
} 