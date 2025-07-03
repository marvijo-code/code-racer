#pragma warning disable SKEXP0110

using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class LeaderboardSnapshot
{
    public int Id { get; set; }
    
    [Required]
    public DateTime SnapshotDate { get; set; }
    
    [Required]
    public string RankJSON { get; set; } = string.Empty; // JSON array of leaderboard entries
    
    public string Period { get; set; } = "daily"; // daily, weekly, monthly, all-time
} 