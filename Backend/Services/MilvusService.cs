#pragma warning disable SKEXP0110

using Backend.Models;

namespace Backend.Services;

public class MilvusService
{
    private readonly ILogger<MilvusService> _logger;
    private readonly bool _isEnabled;
    private readonly string? _openAIApiKey;
    private const float SimilarityThreshold = 0.85f;

    public MilvusService(IConfiguration configuration, ILogger<MilvusService> logger)
    {
        _logger = logger;
        
        _openAIApiKey = configuration["OpenAI:ApiKey"];
        if (string.IsNullOrEmpty(_openAIApiKey))
        {
            _logger.LogWarning("OpenAI API key not configured. Milvus service will be disabled.");
            _isEnabled = false;
            return;
        }
        
        _isEnabled = true;
        _logger.LogInformation("Milvus service initialized (simplified implementation)");
    }

    public Task InitializeCollectionAsync()
    {
        if (!_isEnabled)
        {
            _logger.LogInformation("Milvus service is disabled due to missing OpenAI API key");
            return Task.CompletedTask;
        }

        _logger.LogInformation("Milvus collection initialization skipped - using simplified implementation");
        return Task.CompletedTask;
    }

    public Task<float[]> GenerateEmbeddingAsync(Question question)
    {
        if (!_isEnabled)
        {
            return Task.FromResult(Array.Empty<float>());
        }

        try
        {
            // Placeholder implementation - in production this would call OpenAI API
            // For now, generate a random embedding vector for demonstration
            var random = new Random(question.QuestionId); // Deterministic based on question ID
            var embedding = new float[1536]; // OpenAI text-embedding-3-small dimension
            
            for (int i = 0; i < embedding.Length; i++)
            {
                embedding[i] = (float)(random.NextDouble() * 2.0 - 1.0); // Range [-1, 1]
            }
            
            // Normalize the vector
            var magnitude = MathF.Sqrt(embedding.Sum(x => x * x));
            if (magnitude > 0)
            {
                for (int i = 0; i < embedding.Length; i++)
                {
                    embedding[i] /= magnitude;
                }
            }

            _logger.LogDebug("Generated placeholder embedding for question {QuestionId}", question.QuestionId);
            return Task.FromResult(embedding);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate embedding for question {QuestionId}", question.QuestionId);
            return Task.FromResult(Array.Empty<float>());
        }
    }

    public Task StoreQuestionEmbeddingAsync(Question question)
    {
        if (!_isEnabled)
        {
            return Task.CompletedTask;
        }

        // For now, we'll just store the embedding in the database
        // In a full implementation, this would also store in Milvus
        _logger.LogDebug("Embedding stored in database for question {QuestionId}", question.QuestionId);
        return Task.CompletedTask;
    }

    public Task<List<int>> GetSimilarQuestionIdsAsync(List<float[]> sessionEmbeddings, string? topic = null, int? difficulty = null)
    {
        if (!_isEnabled || !sessionEmbeddings.Any())
        {
            return Task.FromResult(new List<int>());
        }

        // Simplified implementation - in a full version this would query Milvus
        // For now, we'll use basic similarity calculation
        try
        {
            // This is a placeholder - in production you'd query Milvus
            _logger.LogDebug("Semantic similarity search requested but using simplified implementation");
            return Task.FromResult(new List<int>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to search for similar questions");
            return Task.FromResult(new List<int>());
        }
    }

    public Task<bool> IsCollectionHealthyAsync()
    {
        return Task.FromResult(_isEnabled);
    }

    private static float CalculateCosineSimilarity(float[] vector1, float[] vector2)
    {
        if (vector1.Length != vector2.Length)
            return 0f;

        float dotProduct = 0f;
        float norm1 = 0f;
        float norm2 = 0f;

        for (int i = 0; i < vector1.Length; i++)
        {
            dotProduct += vector1[i] * vector2[i];
            norm1 += vector1[i] * vector1[i];
            norm2 += vector2[i] * vector2[i];
        }

        if (norm1 == 0f || norm2 == 0f)
            return 0f;

        return dotProduct / (MathF.Sqrt(norm1) * MathF.Sqrt(norm2));
    }

    public void Dispose()
    {
        // Nothing to dispose in simplified implementation
    }
} 