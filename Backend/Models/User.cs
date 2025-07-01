#pragma warning disable SKEXP0110

using Microsoft.AspNetCore.Identity;

namespace Backend.Models;

public class User : IdentityUser
{
    public string? DisplayName { get; set; }
    public int Elo { get; set; } = 1200; // Starting Elo rating
    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ICollection<RaceSession> RaceSessions { get; set; } = new List<RaceSession>();
    public ICollection<AnswerEvent> AnswerEvents { get; set; } = new List<AnswerEvent>();
} 