#pragma warning disable SKEXP0110

using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class Question
{
    public int QuestionId { get; set; }
    
    [Required]
    public string Topic { get; set; } = string.Empty;
    
    [Required]
    [Range(1, 10)]
    public int Difficulty { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string BodyMarkup { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(80)]
    public string OptionA { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(80)]
    public string OptionB { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(80)]
    public string OptionC { get; set; } = string.Empty;
    
    [Required]
    public char CorrectOption { get; set; } // 'A', 'B', or 'C'
    
    public float[] EmbeddingVector { get; set; } = Array.Empty<float>();
    
    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ICollection<AnswerEvent> AnswerEvents { get; set; } = new List<AnswerEvent>();
    public ICollection<SessionQuestion> SessionQuestions { get; set; } = new List<SessionQuestion>();
} 