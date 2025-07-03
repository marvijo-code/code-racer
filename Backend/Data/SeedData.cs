#pragma warning disable SKEXP0110

using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public static class SeedData
{
    public static async Task Initialize(GameDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        // Check if we already have questions
        if (await context.Questions.AnyAsync())
        {
            return; // Database has been seeded
        }

        var questions = new[]
        {
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 1,
                BodyMarkup = "What is the correct way to declare a variable in JavaScript?",
                OptionA = "var x = 5;",
                OptionB = "variable x = 5;",
                OptionC = "x := 5;",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 1,
                BodyMarkup = "How do you write 'Hello World' in an alert box?",
                OptionA = "alert('Hello World');",
                OptionB = "msg('Hello World');",
                OptionC = "alertBox('Hello World');",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 2,
                BodyMarkup = "Which operator is used to compare both value and type?",
                OptionA = "===",
                OptionB = "==",
                OptionC = "=",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 2,
                BodyMarkup = "What will 'typeof null' return in JavaScript?",
                OptionA = "object",
                OptionB = "null",
                OptionC = "undefined",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "C#",
                Difficulty = 1,
                BodyMarkup = "What is the correct way to declare a string variable in C#?",
                OptionA = "string name = \"John\";",
                OptionB = "String name = \"John\";",
                OptionC = "str name = \"John\";",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "C#",
                Difficulty = 2,
                BodyMarkup = "Which access modifier makes a member accessible only within the same class?",
                OptionA = "private",
                OptionB = "public",
                OptionC = "protected",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "SOLID",
                Difficulty = 3,
                BodyMarkup = "What does the 'S' in SOLID principles stand for?",
                OptionA = "Single Responsibility Principle",
                OptionB = "Separation of Concerns",
                OptionC = "Simple Design",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "SOLID",
                Difficulty = 4,
                BodyMarkup = "The Open/Closed Principle states that classes should be:",
                OptionA = "Open for extension, closed for modification",
                OptionB = "Open for modification, closed for extension",
                OptionC = "Always open",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "Algorithms",
                Difficulty = 3,
                BodyMarkup = "What is the time complexity of binary search?",
                OptionA = "O(log n)",
                OptionB = "O(n)",
                OptionC = "O(n²)",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "Algorithms",
                Difficulty = 4,
                BodyMarkup = "Which sorting algorithm has the best average-case time complexity?",
                OptionA = "Quick Sort",
                OptionB = "Bubble Sort",
                OptionC = "Insertion Sort",
                CorrectOption = 'A'
            }
        };

        context.Questions.AddRange(questions);
        await context.SaveChangesAsync();
    }
} 