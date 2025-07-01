# 🏁 Code Racer

A Vite + React 2D racing game that teaches Software Engineering skills through semantic question diversity and real-time competition.

**🚀 Live Repository**: [https://github.com/marvijo-code/code-racer](https://github.com/marvijo-code/code-racer)

## 🎮 Game Overview

Code Racer combines the excitement of racing with educational software engineering challenges. Players control a car through a race track, and must answer programming questions at checkpoints to continue. Wrong answers cost lives, and running out of lives puts you in spectator mode!

### ✅ Current Status

**Working Features:**
- ✅ Real-time 2D Racing with PixiJS graphics engine
- ✅ WASD/Arrow key car controls with physics
- ✅ AI Bot Racing with 4 skill levels (Beginner/Intermediate/Expert/Master)
- ✅ 14 difficulty-based checkpoints with speed boosts
- ✅ Continuous track guidance with 23 direction arrows
- ✅ Mobile-friendly full-screen design (no scrolling)
- ✅ Backend API with ASP.NET Core
- ✅ Database integration with Entity Framework
- ✅ Question system with 3-option multiple choice format
- ✅ Race session management
- ✅ Lives system (3 strikes = spectator mode)
- ✅ Timer and lap tracking
- ✅ Leaderboard system

**Recent Fixes (Latest Session):**
- ✅ **Player Starting Position** - Player now starts alongside AI bots at same location
- ✅ **Track Guidance** - Added 23 continuous direction arrows around track
- ✅ **More Questions** - Increased checkpoints from 5 to 14 with strategic placement  
- ✅ **Mobile Experience** - Fixed scrolling issues with full-screen no-scroll design
- ✅ **Game Title** - Updated from "Vite + React + TS" to "Code Racer"
- 🔧 Fixed PIXI.js initialization issues with proper async handling
- 🔧 Resolved canvas ref availability problems
- 🔧 Implemented proper keyboard input handling with refs
- 🔧 Fixed backend build issues by clearing locked cache files
- 🔧 Added comprehensive debugging and error handling
- 🔧 Successfully deployed to GitHub public repository

### Features

- **Real-time 2D Racing**: PixiJS-powered car physics with WASD/arrow key controls
- **AI Bot Competition**: 4 AI racers with different skill levels racing alongside you
- **Track Guidance**: 23 direction arrows continuously guide you around the track
- **Difficulty Checkpoints**: 14 strategic checkpoints with varying difficulties (1-10) and speed boosts
- **Mobile Optimized**: Full-screen experience on mobile devices with no scrolling
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
   git clone https://github.com/marvijo-code/code-racer.git
   cd code-racer
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

## 🐛 Known Issues & Troubleshooting

### Common Issues:
1. **"Canvas ref not available"** - Fixed in latest version with proper ref handling
2. **PIXI.js initialization stuck** - Fixed with async initialization and proper cleanup
3. **Backend build errors** - Clear `Backend/obj` and `Backend/bin` directories if needed
4. **Keyboard controls not working** - Fixed with ref-based input handling

### Debug Information:
- Check browser console for PIXI.js initialization logs
- Backend logs show Milvus initialization status
- Frontend shows canvas ready status in loading screen

## 🏗️ Architecture

### Frontend (React + TypeScript + Vite)
- **PixiJS**: 2D graphics rendering with proper async initialization
- **Zustand**: State management for game state
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
code-racer/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components (Game, RaceTrack, QuizOverlay)
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

### Port Configuration

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Frontend | 3113 | http://localhost:3113 | React development server |
| Backend HTTPS | 8443 | https://localhost:8443 | API and SignalR hub |
| Backend HTTP | 8080 | http://localhost:8080 | Alternative API access |
| PostgreSQL | 5432 | localhost:5432 | Primary database |
| Milvus | 19530 | localhost:19530 | Vector database |
| Attu UI | 3001 | http://localhost:3001 | Milvus admin interface |
| Redis | 6379 | localhost:6379 | Caching layer |

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
The frontend runs on port 3113 and connects to the backend API.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React, TypeScript, and PixiJS
- Backend powered by ASP.NET Core and Entity Framework
- Vector similarity powered by OpenAI embeddings
- Real-time communication via SignalR

---

**Ready to race? 🏎️ Clone the repo and start your engines!** 