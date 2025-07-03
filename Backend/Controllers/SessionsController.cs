#pragma warning disable SKEXP0110

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class SessionsController : ControllerBase
{
    private readonly GameDbContext _context;

    public SessionsController(GameDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<RaceSession>> StartSession()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        var session = new RaceSession
        {
            UserId = userId,
            StartUtc = DateTime.UtcNow
        };

        _context.RaceSessions.Add(session);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSession), new { id = session.SessionId }, session);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RaceSession>> GetSession(int id)
    {
        var session = await _context.RaceSessions
            .Include(s => s.AnswerEvents)
            .FirstOrDefaultAsync(s => s.SessionId == id);

        if (session == null)
        {
            return NotFound();
        }

        return session;
    }

    [HttpPatch("{id}/answer")]
    public async Task<ActionResult> SubmitAnswer(int id, [FromBody] SubmitAnswerRequest request)
    {
        var session = await _context.RaceSessions.FindAsync(id);
        if (session == null)
        {
            return NotFound();
        }

        var question = await _context.Questions.FindAsync(request.QuestionId);
        if (question == null)
        {
            return BadRequest("Invalid question ID");
        }

        var isCorrect = question.CorrectOption.ToString().Equals(request.UserAnswer, StringComparison.OrdinalIgnoreCase);
        
        if (!isCorrect)
        {
            session.LivesUsed++;
        }

        var answerEvent = new AnswerEvent
        {
            SessionId = id,
            QuestionId = request.QuestionId,
            IsCorrect = isCorrect,
            ResponseMs = request.ResponseMs,
            UserAnswer = request.UserAnswer,
            UserId = session.UserId
        };

        _context.AnswerEvents.Add(answerEvent);
        await _context.SaveChangesAsync();

        return Ok(new { IsCorrect = isCorrect, LivesUsed = session.LivesUsed });
    }

    [HttpPatch("{id}/complete")]
    public async Task<ActionResult> CompleteSession(int id, [FromBody] CompleteSessionRequest request)
    {
        var session = await _context.RaceSessions.FindAsync(id);
        if (session == null)
        {
            return NotFound();
        }

        session.EndUtc = DateTime.UtcNow;
        session.FinalTimeMs = request.FinalTimeMs;
        session.IsCompleted = true;

        await _context.SaveChangesAsync();

        return Ok();
    }
}

public class SubmitAnswerRequest
{
    public int QuestionId { get; set; }
    public string UserAnswer { get; set; } = string.Empty;
    public int ResponseMs { get; set; }
}

public class CompleteSessionRequest
{
    public int FinalTimeMs { get; set; }
} 