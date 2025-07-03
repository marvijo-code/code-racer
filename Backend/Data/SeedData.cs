#pragma warning disable SKEXP0110

using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public static class SeedData
{
    public static async Task Initialize(GameDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        // Clear existing questions and reseed with new ones
        await ClearAndReseedQuestions(context);
    }

    public static async Task ClearAndReseedQuestions(GameDbContext context)
    {
        // Remove all existing questions
        var existingQuestions = await context.Questions.ToListAsync();
        if (existingQuestions.Any())
        {
            context.Questions.RemoveRange(existingQuestions);
            await context.SaveChangesAsync();
        }

        var questions = new[]
        {
            // ===== DIFFICULTY 1: BEGINNER LEVEL =====
            
            // JavaScript Fundamentals
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 1,
                BodyMarkup = "What is the correct way to declare a variable in ES6+?",
                OptionA = "let x = 5;",
                OptionB = "variable x = 5;",
                OptionC = "x := 5;",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 1,
                BodyMarkup = "Which method adds an element to the end of an array?",
                OptionA = "push()",
                OptionB = "append()",
                OptionC = "add()",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 1,
                BodyMarkup = "How do you write a single-line comment in JavaScript?",
                OptionA = "// This is a comment",
                OptionB = "<!-- This is a comment -->",
                OptionC = "# This is a comment",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 1,
                BodyMarkup = "What does 'typeof' operator return for an array?",
                OptionA = "object",
                OptionB = "array",
                OptionC = "list",
                CorrectOption = 'A'
            },

            // React Basics
            new Question
            {
                Topic = "React",
                Difficulty = 1,
                BodyMarkup = "What is the correct way to create a React component?",
                OptionA = "function MyComponent() { return <div>Hello</div>; }",
                OptionB = "const MyComponent = <div>Hello</div>;",
                OptionC = "React.component MyComponent() { return <div>Hello</div>; }",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "React",
                Difficulty = 1,
                BodyMarkup = "Which hook is used to manage state in functional components?",
                OptionA = "useState",
                OptionB = "useEffect",
                OptionC = "useContext",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "React",
                Difficulty = 1,
                BodyMarkup = "What is JSX?",
                OptionA = "A syntax extension for JavaScript",
                OptionB = "A new programming language",
                OptionC = "A CSS framework",
                CorrectOption = 'A'
            },

            // TypeScript Basics
            new Question
            {
                Topic = "TypeScript",
                Difficulty = 1,
                BodyMarkup = "How do you specify a variable type in TypeScript?",
                OptionA = "let name: string = 'John';",
                OptionB = "let name as string = 'John';",
                OptionC = "let name string = 'John';",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "TypeScript",
                Difficulty = 1,
                BodyMarkup = "What is the TypeScript file extension?",
                OptionA = ".ts",
                OptionB = ".tsx",
                OptionC = ".js",
                CorrectOption = 'A'
            },

            // C# Basics
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
                Difficulty = 1,
                BodyMarkup = "Which keyword is used to create a class in C#?",
                OptionA = "class",
                OptionB = "Class",
                OptionC = "new",
                CorrectOption = 'A'
            },

            // ===== DIFFICULTY 2: BEGINNER-INTERMEDIATE =====

            // JavaScript Intermediate
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 2,
                BodyMarkup = "What will 'console.log(typeof NaN)' output?",
                OptionA = "number",
                OptionB = "NaN",
                OptionC = "undefined",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 2,
                BodyMarkup = "Which operator checks both value and type equality?",
                OptionA = "===",
                OptionB = "==",
                OptionC = "=",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 2,
                BodyMarkup = "What is the result of: [1, 2, 3].map(x => x * 2)?",
                OptionA = "[2, 4, 6]",
                OptionB = "[1, 2, 3, 2, 4, 6]",
                OptionC = "6",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 2,
                BodyMarkup = "What does the spread operator (...) do?",
                OptionA = "Expands elements of an iterable",
                OptionB = "Creates a new array",
                OptionC = "Removes duplicates",
                CorrectOption = 'A'
            },

            // React Intermediate
            new Question
            {
                Topic = "React",
                Difficulty = 2,
                BodyMarkup = "What hook would you use for side effects in React?",
                OptionA = "useEffect",
                OptionB = "useState",
                OptionC = "useCallback",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "React",
                Difficulty = 2,
                BodyMarkup = "How do you pass data from parent to child component?",
                OptionA = "Through props",
                OptionB = "Through state",
                OptionC = "Through context",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "React",
                Difficulty = 2,
                BodyMarkup = "What is the virtual DOM?",
                OptionA = "A JavaScript representation of the real DOM",
                OptionB = "A new HTML standard",
                OptionC = "A CSS framework",
                CorrectOption = 'A'
            },

            // TypeScript Intermediate
            new Question
            {
                Topic = "TypeScript",
                Difficulty = 2,
                BodyMarkup = "What is an interface in TypeScript?",
                OptionA = "A contract that defines object structure",
                OptionB = "A type of class",
                OptionC = "A function declaration",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "TypeScript",
                Difficulty = 2,
                BodyMarkup = "How do you make a property optional in TypeScript?",
                OptionA = "property?: type",
                OptionB = "property: type?",
                OptionC = "optional property: type",
                CorrectOption = 'A'
            },

            // C# Intermediate
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
                Topic = "C#",
                Difficulty = 2,
                BodyMarkup = "What is LINQ in C#?",
                OptionA = "Language Integrated Query",
                OptionB = "Linear Query",
                OptionC = "Linked Query",
                CorrectOption = 'A'
            },

            // ===== DIFFICULTY 3: INTERMEDIATE =====

            // JavaScript Advanced Concepts
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 3,
                BodyMarkup = "What is a closure in JavaScript?",
                OptionA = "A function that has access to outer scope variables",
                OptionB = "A way to close browser windows",
                OptionC = "A method to end loops",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 3,
                BodyMarkup = "What will 'console.log(0.1 + 0.2 === 0.3)' output?",
                OptionA = "false",
                OptionB = "true",
                OptionC = "undefined",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 3,
                BodyMarkup = "What is event delegation in JavaScript?",
                OptionA = "Handling events on parent elements for child elements",
                OptionB = "Creating custom events",
                OptionC = "Preventing event bubbling",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 3,
                BodyMarkup = "What is the difference between 'call' and 'apply' methods?",
                OptionA = "call takes individual arguments, apply takes an array",
                OptionB = "No difference",
                OptionC = "apply is faster than call",
                CorrectOption = 'A'
            },

            // React Advanced
            new Question
            {
                Topic = "React",
                Difficulty = 3,
                BodyMarkup = "What is React.memo used for?",
                OptionA = "Memoizing component renders to prevent unnecessary re-renders",
                OptionB = "Storing data in memory",
                OptionC = "Creating class components",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "React",
                Difficulty = 3,
                BodyMarkup = "When should you use useCallback hook?",
                OptionA = "To memoize functions and prevent child re-renders",
                OptionB = "To handle API calls",
                OptionC = "To manage component state",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "React",
                Difficulty = 3,
                BodyMarkup = "What is the purpose of React Context?",
                OptionA = "To share data across components without prop drilling",
                OptionB = "To create new components",
                OptionC = "To handle routing",
                CorrectOption = 'A'
            },

            // Algorithms & Data Structures
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
                Difficulty = 3,
                BodyMarkup = "Which data structure uses LIFO (Last In, First Out)?",
                OptionA = "Stack",
                OptionB = "Queue",
                OptionC = "Array",
                CorrectOption = 'A'
            },

            // SOLID Principles
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

            // ===== DIFFICULTY 4: INTERMEDIATE-ADVANCED =====

            // JavaScript Expert Level
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 4,
                BodyMarkup = "What is the difference between microtasks and macrotasks?",
                OptionA = "Microtasks have higher priority in the event loop",
                OptionB = "Macrotasks execute first",
                OptionC = "No difference",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 4,
                BodyMarkup = "What will happen: const obj = {}; obj[{}] = 'value'; console.log(obj);",
                OptionA = "{ '[object Object]': 'value' }",
                OptionB = "{ {}: 'value' }",
                OptionC = "Error",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 4,
                BodyMarkup = "What is the Temporal Dead Zone in JavaScript?",
                OptionA = "Period when let/const variables are hoisted but not accessible",
                OptionB = "Time when functions are not callable",
                OptionC = "Zone where variables are automatically deleted",
                CorrectOption = 'A'
            },

            // React Expert
            new Question
            {
                Topic = "React",
                Difficulty = 4,
                BodyMarkup = "What is the difference between useLayoutEffect and useEffect?",
                OptionA = "useLayoutEffect runs synchronously after DOM mutations",
                OptionB = "No difference",
                OptionC = "useLayoutEffect is deprecated",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "React",
                Difficulty = 4,
                BodyMarkup = "What are React Error Boundaries?",
                OptionA = "Components that catch JavaScript errors in child components",
                OptionB = "CSS boundaries for components",
                OptionC = "Performance monitoring tools",
                CorrectOption = 'A'
            },

            // TypeScript Advanced
            new Question
            {
                Topic = "TypeScript",
                Difficulty = 4,
                BodyMarkup = "What are conditional types in TypeScript?",
                OptionA = "Types that depend on a condition to determine the final type",
                OptionB = "Types used in if statements",
                OptionC = "Optional types",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "TypeScript",
                Difficulty = 4,
                BodyMarkup = "What is the 'keyof' operator used for?",
                OptionA = "To get union type of all property names of a type",
                OptionB = "To create new objects",
                OptionC = "To delete object properties",
                CorrectOption = 'A'
            },

            // Advanced Algorithms
            new Question
            {
                Topic = "Algorithms",
                Difficulty = 4,
                BodyMarkup = "Which sorting algorithm has the best average-case time complexity?",
                OptionA = "Quick Sort O(n log n)",
                OptionB = "Bubble Sort O(n²)",
                OptionC = "Selection Sort O(n²)",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "Algorithms",
                Difficulty = 4,
                BodyMarkup = "What is dynamic programming?",
                OptionA = "Solving problems by breaking them into overlapping subproblems",
                OptionB = "Programming that changes at runtime",
                OptionC = "Object-oriented programming",
                CorrectOption = 'A'
            },

            // SOLID Advanced
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
                Topic = "SOLID",
                Difficulty = 4,
                BodyMarkup = "What does the Dependency Inversion Principle promote?",
                OptionA = "Depend on abstractions, not concretions",
                OptionB = "Invert all dependencies",
                OptionC = "Remove all dependencies",
                CorrectOption = 'A'
            },

            // ===== DIFFICULTY 5: ADVANCED =====

            // JavaScript Expert/Tricky
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 5,
                BodyMarkup = "What will: (function(){ return typeof arguments; })() output?",
                OptionA = "object",
                OptionB = "array",
                OptionC = "function",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 5,
                BodyMarkup = "What is the result of: +!![]+!![]+!![]+!![]",
                OptionA = "4",
                OptionB = "0",
                OptionC = "NaN",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 5,
                BodyMarkup = "What does WeakMap provide that Map doesn't?",
                OptionA = "Garbage collection of keys when no other references exist",
                OptionB = "Better performance",
                OptionC = "More methods",
                CorrectOption = 'A'
            },

            // React Fiber & Advanced
            new Question
            {
                Topic = "React",
                Difficulty = 5,
                BodyMarkup = "What is React Fiber?",
                OptionA = "React's reconciliation algorithm for prioritizing updates",
                OptionB = "A new component type",
                OptionC = "A performance monitoring tool",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "React",
                Difficulty = 5,
                BodyMarkup = "What are React Portals used for?",
                OptionA = "Rendering components outside the parent DOM hierarchy",
                OptionB = "Creating new React apps",
                OptionC = "Managing component state",
                CorrectOption = 'A'
            },

            // TypeScript Expert
            new Question
            {
                Topic = "TypeScript",
                Difficulty = 5,
                BodyMarkup = "What are mapped types in TypeScript?",
                OptionA = "Types that transform properties of existing types",
                OptionB = "Types for Map objects",
                OptionC = "Types for geographical mapping",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "TypeScript",
                Difficulty = 5,
                BodyMarkup = "What is the 'infer' keyword used for in TypeScript?",
                OptionA = "To infer types within conditional types",
                OptionB = "To create interfaces",
                OptionC = "To import types",
                CorrectOption = 'A'
            },

            // Advanced System Design
            new Question
            {
                Topic = "System Design",
                Difficulty = 5,
                BodyMarkup = "What is the CAP theorem?",
                OptionA = "Consistency, Availability, Partition tolerance - pick 2",
                OptionB = "Create, Access, Process theorem",
                OptionC = "Cache, API, Performance theorem",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "System Design",
                Difficulty = 5,
                BodyMarkup = "What is eventual consistency in distributed systems?",
                OptionA = "System will become consistent over time without input",
                OptionB = "System is always consistent",
                OptionC = "System never achieves consistency",
                CorrectOption = 'A'
            },

            // Advanced Patterns
            new Question
            {
                Topic = "Design Patterns",
                Difficulty = 5,
                BodyMarkup = "What is the Observer pattern used for?",
                OptionA = "Notifying multiple objects about state changes",
                OptionB = "Creating single instances",
                OptionC = "Wrapping legacy code",
                CorrectOption = 'A'
            },

            // ===== DIFFICULTY 6-7: EXPERT LEVEL =====

            // Web Performance
            new Question
            {
                Topic = "Performance",
                Difficulty = 6,
                BodyMarkup = "What is Critical Rendering Path optimization?",
                OptionA = "Optimizing resources needed for initial page render",
                OptionB = "Making code run faster",
                OptionC = "Optimizing database queries",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "Performance",
                Difficulty = 6,
                BodyMarkup = "What is tree shaking in JavaScript bundlers?",
                OptionA = "Removing unused code from bundles",
                OptionB = "Organizing code in tree structure",
                OptionC = "Minifying JavaScript",
                CorrectOption = 'A'
            },

            // Advanced React Patterns
            new Question
            {
                Topic = "React",
                Difficulty = 6,
                BodyMarkup = "What is the Render Props pattern?",
                OptionA = "Sharing code between components using a prop whose value is a function",
                OptionB = "Rendering components as properties",
                OptionC = "A new React API",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "React",
                Difficulty = 6,
                BodyMarkup = "What is Concurrent Rendering in React 18?",
                OptionA = "Ability to interrupt rendering to handle high-priority updates",
                OptionB = "Running multiple React apps simultaneously",
                OptionC = "Server-side rendering",
                CorrectOption = 'A'
            },

            // Expert JavaScript
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 7,
                BodyMarkup = "What is the difference between Iterator and Iterable protocols?",
                OptionA = "Iterator has next() method, Iterable has Symbol.iterator",
                OptionB = "No difference",
                OptionC = "Iterator is newer than Iterable",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 7,
                BodyMarkup = "What are Proxy and Reflect in JavaScript used for?",
                OptionA = "Intercepting and customizing object operations",
                OptionB = "Creating mirror objects",
                OptionC = "Network proxies",
                CorrectOption = 'A'
            },

            // Expert System Design
            new Question
            {
                Topic = "System Design",
                Difficulty = 7,
                BodyMarkup = "What is the Saga pattern in microservices?",
                OptionA = "Managing distributed transactions across services",
                OptionB = "A story-telling pattern",
                OptionC = "A database design pattern",
                CorrectOption = 'A'
            },

            // ===== DIFFICULTY 8-10: MASTER LEVEL =====

            // Master Level Algorithms
            new Question
            {
                Topic = "Algorithms",
                Difficulty = 8,
                BodyMarkup = "What is the time complexity of the Ackermann function?",
                OptionA = "Non-primitive recursive (grows faster than exponential)",
                OptionB = "O(n log n)",
                OptionC = "O(2^n)",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "Algorithms",
                Difficulty = 8,
                BodyMarkup = "What is the difference between P and NP complexity classes?",
                OptionA = "P: polynomial time solvable, NP: polynomial time verifiable",
                OptionB = "P is faster than NP",
                OptionC = "No difference",
                CorrectOption = 'A'
            },

            // Master JavaScript Internals
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 9,
                BodyMarkup = "How does V8's hidden classes optimization work?",
                OptionA = "Creates internal structures for objects with same property layout",
                OptionB = "Hides classes from debugger",
                OptionC = "Encrypts class definitions",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "JavaScript",
                Difficulty = 9,
                BodyMarkup = "What is the difference between Turbofan and Ignition in V8?",
                OptionA = "Ignition is interpreter, Turbofan is optimizing compiler",
                OptionB = "Both are interpreters",
                OptionC = "Both are compilers",
                CorrectOption = 'A'
            },

            // Ultimate Master Level
            new Question
            {
                Topic = "Computer Science",
                Difficulty = 10,
                BodyMarkup = "What is the halting problem and why is it undecidable?",
                OptionA = "Cannot determine if arbitrary program will halt; proven by contradiction",
                OptionB = "Problem with stopping computers",
                OptionC = "A solvable algorithm problem",
                CorrectOption = 'A'
            },
            new Question
            {
                Topic = "System Design",
                Difficulty = 10,
                BodyMarkup = "How does Google's MapReduce paradigm handle fault tolerance?",
                OptionA = "Re-execution of failed tasks and data replication",
                OptionB = "Ignoring failed tasks",
                OptionC = "Manual intervention",
                CorrectOption = 'A'
            }
        };

        context.Questions.AddRange(questions);
        await context.SaveChangesAsync();
    }
} 