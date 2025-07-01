#pragma warning disable SKEXP0110

using OpenAI.Embeddings;
using Backend.Models;

namespace Backend.Services;

public class MilvusService
{
    private readonly EmbeddingClient _embeddingClient;
    private readonly ILogger<MilvusService> _logger;
    private const int EmbeddingDimension = 1536; // OpenAI text-embedding-3-small
    private const float SimilarityThreshold = 0.85f;

    // In-memory storage for development (replace with actual Milvus later)
    private readonly Dictionary<int, float[]> _questionEmbeddings = new();

    public MilvusService(IConfiguration configuration, ILogger<MilvusService> logger)
    {
        _logger = logger;
        
        // Initialize OpenAI Embedding client
        var openAIKey = configuration["OpenAI:ApiKey"];
        if (string.IsNullOrEmpty(openAIKey))
        {
            throw new InvalidOperationException("OpenAI API key not configured");
        }
        _embeddingClient = new EmbeddingClient("text-embedding-3-small", openAIKey);
    }

    public async Task InitializeCollectionAsync()
    {
        try
        {
            // For now, just log that we're initializing
            // TODO: Implement actual Milvus collection creation once API is verified
            _logger.LogInformation("Milvus service initialized (using in-memory storage for development)");
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize Milvus service");
            throw;
        }
    }

    public async Task<float[]> GenerateEmbeddingAsync(string text)
    {
        try
        {
            var response = await _embeddingClient.GenerateEmbeddingAsync(text);
            var embedding = response.Value;
            
            return embedding.ToFloats().ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate embedding for text: {Text}", text);
            throw;
        }
    }

    public async Task<bool> IsQuestionSimilarAsync(Question question, List<int> recentQuestionIds)
    {
        try
        {
            // Generate embedding for the new question
            var questionText = $"{question.BodyMarkup} {question.OptionA} {question.OptionB} {question.OptionC}";
            var embedding = await GenerateEmbeddingAsync(questionText);

            // Check similarity against stored embeddings (in-memory for now)
            foreach (var (storedQuestionId, storedEmbedding) in _questionEmbeddings)
            {
                var similarity = CalculateCosineSimilarity(embedding, storedEmbedding);
                
                if (similarity >= SimilarityThreshold)
                {
                    _logger.LogInformation(
                        "Found similar question (similarity: {Similarity:F3}) for question: {QuestionId}",
                        similarity, question.QuestionId);
                    return true;
                }
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check question similarity for question: {QuestionId}", question.QuestionId);
            // Return false to allow question if similarity check fails
            return false;
        }
    }

    public async Task<List<int>> GetSimilarQuestionIdsAsync(List<float[]> sessionEmbeddings, string? topic = null, int? difficulty = null)
    {
        try
        {
            var similarQuestionIds = new List<int>();

            foreach (var sessionEmbedding in sessionEmbeddings)
            {
                foreach (var (questionId, storedEmbedding) in _questionEmbeddings)
                {
                    var similarity = CalculateCosineSimilarity(sessionEmbedding, storedEmbedding);
                    
                    if (similarity >= SimilarityThreshold && !similarQuestionIds.Contains(questionId))
                    {
                        similarQuestionIds.Add(questionId);
                        _logger.LogDebug(
                            "Found similar question {QuestionId} with similarity: {Similarity:F3}",
                            questionId, similarity);
                    }
                }
            }

            _logger.LogInformation(
                "Found {Count} similar questions to exclude from session",
                similarQuestionIds.Count);

            return similarQuestionIds;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get similar question IDs");
            return new List<int>();
        }
    }

    public async Task StoreQuestionEmbeddingAsync(Question question)
    {
        try
        {
            // Generate embedding if not already present
            if (question.EmbeddingVector == null || question.EmbeddingVector.Length == 0)
            {
                var questionText = $"{question.BodyMarkup} {question.OptionA} {question.OptionB} {question.OptionC}";
                question.EmbeddingVector = await GenerateEmbeddingAsync(questionText);
            }

            // Store in memory for now (replace with actual Milvus storage later)
            _questionEmbeddings[question.QuestionId] = question.EmbeddingVector;

            _logger.LogInformation("Stored embedding for question: {QuestionId}", question.QuestionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to store embedding for question: {QuestionId}", question.QuestionId);
            throw;
        }
    }

    public async Task DeleteQuestionEmbeddingAsync(int questionId)
    {
        try
        {
            // Remove from memory storage
            _questionEmbeddings.Remove(questionId);

            _logger.LogInformation("Deleted embedding for question: {QuestionId}", questionId);
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete embedding for question: {QuestionId}", questionId);
            throw;
        }
    }

    private static float CalculateCosineSimilarity(float[] vector1, float[] vector2)
    {
        if (vector1.Length != vector2.Length)
            throw new ArgumentException("Vectors must have the same length");

        float dotProduct = 0;
        float magnitude1 = 0;
        float magnitude2 = 0;

        for (int i = 0; i < vector1.Length; i++)
        {
            dotProduct += vector1[i] * vector2[i];
            magnitude1 += vector1[i] * vector1[i];
            magnitude2 += vector2[i] * vector2[i];
        }

        magnitude1 = (float)Math.Sqrt(magnitude1);
        magnitude2 = (float)Math.Sqrt(magnitude2);

        if (magnitude1 == 0 || magnitude2 == 0)
            return 0;

        return dotProduct / (magnitude1 * magnitude2);
    }

    public void Dispose()
    {
        // Nothing to dispose in the simplified version
    }
} 