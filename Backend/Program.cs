#pragma warning disable SKEXP0110

using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Backend.Data;
using Backend.Models;
using Backend.Hubs;
using Backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<GameDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<User, IdentityRole>(options =>
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequiredLength = 6;
    
    // User settings
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<GameDbContext>()
.AddDefaultTokenProviders();

builder.Services.AddControllers();
builder.Services.AddSignalR();

// Register MilvusService
builder.Services.AddSingleton<MilvusService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // Updated frontend port
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<RaceHub>("/raceHub");

// Initialize services
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<GameDbContext>();
    var milvusService = scope.ServiceProvider.GetRequiredService<MilvusService>();
    
    // Seed the database
    await SeedData.Initialize(context);
    
    // Initialize Milvus collection
    try
    {
        await milvusService.InitializeCollectionAsync();
        
        // Generate embeddings for existing questions if they don't have them
        var questionsWithoutEmbeddings = await context.Questions
            .Where(q => q.EmbeddingVector == null || q.EmbeddingVector.Length == 0)
            .ToListAsync();
            
        foreach (var question in questionsWithoutEmbeddings)
        {
            try
            {
                question.EmbeddingVector = await milvusService.GenerateEmbeddingAsync(question);
                await milvusService.StoreQuestionEmbeddingAsync(question);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to generate embedding for question {question.QuestionId}: {ex.Message}");
            }
        }
        
        if (questionsWithoutEmbeddings.Any())
        {
            await context.SaveChangesAsync();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Failed to initialize Milvus: {ex.Message}");
        Console.WriteLine("Application will continue without semantic filtering.");
    }
}

app.Run();
