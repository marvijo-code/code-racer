# 🏁 Code Racer

A Vite + React 2D racing game that teaches Software Engineering skills through semantic question diversity and real-time competition.

## 🎮 Game Overview

Code Racer combines the excitement of racing with educational software engineering challenges. Players control a car through a race track, and must answer programming questions at checkpoints to continue. Wrong answers cost lives, and running out of lives puts you in spectator mode!

### Features

- **Real-time 2D Racing**: PixiJS-powered car physics with WASD/arrow key controls
- **Semantic Question Filtering**: OpenAI embeddings + cosine similarity prevent repetitive questions
- **Standardized Format**: All questions are multiple choice with exactly 3 options (A, B, C)
- **Smart Difficulty**: Dynamic question selection based on player progress
- **Spectator Mode**: Watch AI complete the race after 3 failed questions
- **Live Leaderboards**: Daily, weekly, monthly, and all-time rankings
- **Real-time Communication**: SignalR for live race updates

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Docker](https://www.docker.com/) (for Milvus and PostgreSQL)
- OpenAI API key (for question embeddings)

### Running the Application

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd devupper-cursor
   ```

2. **Start the infrastructure services**
   ```bash
   docker-compose up -d milvus postgres attu
   docker ps
   ```

3. **Configure the environment**
   Create `Backend/appsettings.Development.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Data Source=gamedb.sqlite",
       "Milvus": "localhost:19530"
     },
     "OpenAI": {
       "ApiKey": "your-openai-api-key-here"
     },
     "Urls": "https://localhost:8443;http://localhost:8080"
   }
   ```

4. **Run the backend**
   ```bash
   cd Backend
   dotnet restore
   dotnet ef database update
   dotnet run
   ```
   Backend will be available at:
   - HTTPS: `https://localhost:8443`
   - HTTP: `http://localhost:8080`
   - SignalR Hub: `https://localhost:8443/raceHub`

5. **Run the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend will be available at `http://localhost:3113`

6. **Access admin tools**
   - **Milvus Admin (Attu)**: `http://localhost:9001`
   - **API Documentation**: `https://localhost:8443/swagger`

## 🎯 How to Play

1. **Start a Race**: Navigate to `http://localhost:3113` and click "Start Race"
2. **Control Your Car**: Use WASD or Arrow Keys to steer
   - **W/↑**: Accelerate
   - **S/↓**: Brake/Reverse
   - **A/←**: Turn left
   - **D/→**: Turn right
3. **Hit Checkpoints**: Drive through the red checkpoint zones
4. **Answer Questions**: You have 10 seconds to answer each question
5. **Manage Lives**: You have 3 lives - wrong answers cost a life
6. **Spectate**: After 3 wrong answers, watch AI complete the race
7. **Check Leaderboards**: See how you rank against other players

## 🏗️ Architecture

### Frontend (React + TypeScript + Vite)
- **PixiJS**: 2D graphics rendering
- **Zustand**: State management
- **React Query**: Server state management
- **SignalR Client**: Real-time communication

### Backend (.NET 9)
- **ASP.NET Core**: Web API framework
- **Entity Framework Core**: ORM with SQLite (dev) or PostgreSQL (prod)
- **SignalR**: Real-time WebSocket communication
- **ASP.NET Core Identity**: User authentication

### Databases & AI
- **Primary**: SQLite (development) or PostgreSQL (production)
- **Vector Storage**: In-memory (development) with Milvus 2.4 planned for production
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Semantic Filtering**: Cosine similarity with 0.85 threshold prevents repetitive questions

## 🛠️ Development

### Project Structure

```
devupper-cursor/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── features/        # Feature-specific code
│   │   ├── lib/            # API client and utilities
│   │   ├── state/          # Zustand stores
│   │   └── pages/          # Route components
│   └── package.json
├── Backend/                 # .NET backend
│   ├── Controllers/        # API controllers
│   ├── Data/              # Entity Framework context
│   ├── Models/            # Data models
│   ├── Hubs/              # SignalR hubs
│   └── Backend.csproj
├── docs/                   # Documentation
└── docker-compose.yml     # Local development setup
```

### API Endpoints

#### Sessions
- `POST /api/v1/sessions` - Start a new race session
- `GET /api/v1/sessions/{id}` - Get session details
- `PATCH /api/v1/sessions/{id}/answer` - Submit an answer
- `PATCH /api/v1/sessions/{id}/complete` - Complete a session

#### Questions
- `GET /api/v1/questions/random` - Get a random question
- `GET /api/v1/questions/topics` - Get available topics

#### Leaderboard
- `GET /api/v1/leaderboard?period={daily|weekly|monthly|all-time}` - Get leaderboard

#### SignalR Hubs
- `/raceHub` - Real-time race communication

### Database Schema

The game uses the following main entities:

- **User**: Extends ASP.NET Core Identity with Elo rating
- **Question**: Quiz questions with topic, difficulty, and choices
- **RaceSession**: Individual race instances with timing
- **AnswerEvent**: Player responses to questions
- **LeaderboardSnapshot**: Cached leaderboard data

## 🎨 Game Design

### Difficulty Scaling
Questions are rated 1-10 difficulty:
- **1-3**: Beginner (syntax, basic concepts)
- **4-6**: Intermediate (design patterns, algorithms)
- **7-10**: Advanced (architecture, optimization)

### Topics Covered
- **JavaScript**: Syntax, operators, functions
- **C#**: Language features, OOP concepts
- **SOLID Principles**: Clean code practices
- **Algorithms**: Time complexity, sorting, searching
- **More topics coming soon!**

## 🔧 Configuration

### Backend Configuration (appsettings.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=gamedb.sqlite",
    "Milvus": "localhost:19530"
  },
  "OpenAI": {
    "ApiKey": "your-openai-api-key-here"
  }
}
```

### Frontend Configuration
The frontend runs on port 3113 and connects to the backend API:
```typescript
// frontend/src/lib/api.ts
const API_BASE_URL = 'https://localhost:8443/api/v1';
const SIGNALR_URL = 'https://localhost:8443/raceHub';
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run everything
docker-compose up --build

# Run in background
docker-compose up -d
```

### Production Considerations
- Use environment variables for sensitive configuration
- Enable HTTPS in production
- Configure CORS for your domain
- Set up proper logging and monitoring
- Use a managed PostgreSQL service

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm run test
```

### Backend Tests
```bash
cd Backend
dotnet test
```

## 📈 Future Enhancements

- **Multiplayer Racing**: Real-time races with multiple players
- **Tournament Mode**: Bracket-style competitions
- **Custom Question Packs**: User-generated content
- **Mobile Support**: React Native version
- **AI Opponents**: Computer-controlled racers
- **Power-ups**: Boost items for correct answer streaks
- **Track Editor**: User-created race tracks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/semantic-questions`)
3. Commit your changes (`git commit -m 'Add semantic questions'`)
4. Push to the branch (`git push origin feature/semantic-questions`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Learning Objectives

Code Racer is designed to help developers:
- **Reinforce fundamentals** through timed challenges
- **Learn new concepts** in an engaging format
- **Practice under pressure** with time constraints
- **Track progress** through difficulty scaling
- **Compete with peers** via leaderboards

---

**Ready to race and learn? Start your engines! 🏁** 