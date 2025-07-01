#pragma warning disable SKEXP0110

using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class RaceSession
{
    public int SessionId { get; set; }
    
    public string? UserId { get; set; } // Nullable for guest users
    
    public DateTime StartUtc { get; set; } = DateTime.UtcNow;
    
    public DateTime? EndUtc { get; set; }
    
    public int? FinalTimeMs { get; set; }
    
    public int LivesUsed { get; set; } = 0;
    
    public bool IsCompleted { get; set; } = false;
    
    // Navigation properties
    public User? User { get; set; }
    public ICollection<AnswerEvent> AnswerEvents { get; set; } = new List<AnswerEvent>();
    public ICollection<SessionQuestion> SessionQuestions { get; set; } = new List<SessionQuestion>();
} 