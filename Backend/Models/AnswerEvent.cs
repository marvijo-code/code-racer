#pragma warning disable SKEXP0110

using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class AnswerEvent
{
    public int EventId { get; set; }
    
    [Required]
    public int SessionId { get; set; }
    
    [Required]
    public int QuestionId { get; set; }
    
    public bool IsCorrect { get; set; }
    
    public int ResponseMs { get; set; } // Time taken to answer in milliseconds
    
    public string? UserAnswer { get; set; }
    
    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public RaceSession RaceSession { get; set; } = null!;
    public Question Question { get; set; } = null!;
    public User? User { get; set; }
    
    public string? UserId { get; set; }
} 