#pragma warning disable SKEXP0110

using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data;

public class GameDbContext : IdentityDbContext<User>
{
    public GameDbContext(DbContextOptions<GameDbContext> options) : base(options)
    {
    }

    public DbSet<Question> Questions { get; set; }
    public DbSet<RaceSession> RaceSessions { get; set; }
    public DbSet<AnswerEvent> AnswerEvents { get; set; }
    public DbSet<LeaderboardSnapshot> LeaderboardSnapshots { get; set; }
    public DbSet<SessionQuestion> SessionQuestions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Question
        modelBuilder.Entity<Question>(entity =>
        {
            entity.HasKey(e => e.QuestionId);
            entity.Property(e => e.Topic).IsRequired().HasMaxLength(100);
            entity.Property(e => e.BodyMarkup).IsRequired().HasMaxLength(200);
            entity.Property(e => e.OptionA).IsRequired().HasMaxLength(80);
            entity.Property(e => e.OptionB).IsRequired().HasMaxLength(80);
            entity.Property(e => e.OptionC).IsRequired().HasMaxLength(80);
            entity.Property(e => e.CorrectOption).IsRequired();
            entity.Property(e => e.EmbeddingVector)
                  .HasConversion(
                      v => v == null ? null : System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                      v => v == null ? Array.Empty<float>() : System.Text.Json.JsonSerializer.Deserialize<float[]>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? Array.Empty<float>())
                  .HasColumnType("TEXT");
            entity.HasIndex(e => new { e.Topic, e.Difficulty });
        });

        // Configure RaceSession
        modelBuilder.Entity<RaceSession>(entity =>
        {
            entity.HasKey(e => e.SessionId);
            entity.HasOne(e => e.User)
                  .WithMany(u => u.RaceSessions)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Configure AnswerEvent
        modelBuilder.Entity<AnswerEvent>(entity =>
        {
            entity.HasKey(e => e.EventId);
            entity.HasOne(e => e.RaceSession)
                  .WithMany(rs => rs.AnswerEvents)
                  .HasForeignKey(e => e.SessionId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Question)
                  .WithMany(q => q.AnswerEvents)
                  .HasForeignKey(e => e.QuestionId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                  .WithMany(u => u.AnswerEvents)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Configure SessionQuestion
        modelBuilder.Entity<SessionQuestion>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Session)
                  .WithMany(s => s.SessionQuestions)
                  .HasForeignKey(e => e.SessionId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Question)
                  .WithMany(q => q.SessionQuestions)
                  .HasForeignKey(e => e.QuestionId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.SessionId, e.OrderIndex });
        });

        // Configure LeaderboardSnapshot
        modelBuilder.Entity<LeaderboardSnapshot>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RankJSON).IsRequired();
            entity.HasIndex(e => new { e.SnapshotDate, e.Period });
        });
    }
} 