#pragma warning disable SKEXP0110

using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class SessionQuestion
{
    public int Id { get; set; }
    
    [Required]
    public int SessionId { get; set; }
    
    [Required]
    public int QuestionId { get; set; }
    
    [Required]
    public int OrderIndex { get; set; }
    
    public DateTime AskedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public RaceSession Session { get; set; } = null!;
    public Question Question { get; set; } = null!;
} 