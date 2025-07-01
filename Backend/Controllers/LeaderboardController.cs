#pragma warning disable SKEXP0110

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System.Text.Json;

namespace Backend.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class LeaderboardController : ControllerBase
{
    private readonly GameDbContext _context;

    public LeaderboardController(GameDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LeaderboardEntry>>> GetLeaderboard([FromQuery] string period = "daily")
    {
        var validPeriods = new[] { "daily", "weekly", "monthly", "all-time" };
        if (!validPeriods.Contains(period))
        {
            return BadRequest("Invalid period. Valid values are: daily, weekly, monthly, all-time");
        }

        DateTime startDate = period switch
        {
            "daily" => DateTime.UtcNow.Date,
            "weekly" => DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek),
            "monthly" => new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1),
            "all-time" => DateTime.MinValue,
            _ => DateTime.UtcNow.Date
        };

        var leaderboardEntries = await _context.RaceSessions
            .Where(s => s.IsCompleted && s.FinalTimeMs.HasValue && s.EndUtc >= startDate)
            .Include(s => s.User)
            .GroupBy(s => s.UserId)
            .Select(g => new LeaderboardEntry
            {
                UserId = g.Key,
                DisplayName = g.First().User != null ? g.First().User.DisplayName ?? g.First().User.UserName : "Guest",
                BestTime = g.Min(s => s.FinalTimeMs!.Value),
                CompletedRaces = g.Count()
            })
            .OrderBy(e => e.BestTime)
            .Take(50)
            .ToListAsync();

        return leaderboardEntries;
    }

    [HttpPost("scores")]
    public async Task<ActionResult> SubmitScore([FromBody] SubmitScoreRequest request)
    {
        // This endpoint is for backward compatibility
        // Scores are now automatically recorded when sessions are completed
        return Ok(new { Message = "Score recorded successfully" });
    }
}

public class LeaderboardEntry
{
    public string? UserId { get; set; }
    public string? DisplayName { get; set; }
    public int BestTime { get; set; }
    public int CompletedRaces { get; set; }
}

public class SubmitScoreRequest
{
    public int TimeMs { get; set; }
    public string? PlayerName { get; set; }
} 