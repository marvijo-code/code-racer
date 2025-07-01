# Important File Paths - Code Racer

This document tracks frequently accessed and important files in the Code Racer project.

## Configuration Files

### Backend Configuration
- `Backend/Properties/launchSettings.json` - Port configuration (8080 HTTP, 8443 HTTPS)
- `Backend/appsettings.json` - Application settings
- `Backend/appsettings.Development.json` - Development environment settings
- `Backend/Backend.csproj` - NuGet packages and project configuration

### Frontend Configuration  
- `frontend/package.json` - NPM dependencies and scripts
- `frontend/vite.config.ts` - Vite dev server configuration (port 3113)
- `frontend/tsconfig.json` - TypeScript configuration

### Infrastructure
- `docker-compose.yml` - Milvus, PostgreSQL, Redis services
- `README.md` - Project documentation and setup instructions

## Backend Core Files

### Models
- `Backend/Models/Question.cs` - Question entity with 3-option format and embeddings
- `Backend/Models/RaceSession.cs` - Race session tracking
- `Backend/Models/SessionQuestion.cs` - Question history for semantic filtering
- `Backend/Models/User.cs` - User profile and authentication
- `Backend/Models/AnswerEvent.cs` - Answer tracking and analytics
- `Backend/Models/LeaderboardSnapshot.cs` - Cached leaderboard data

### Data Layer
- `Backend/Data/GameDbContext.cs` - Entity Framework context with all configurations
- `Backend/Data/SeedData.cs` - Sample questions with 3-option format

### Controllers
- `Backend/Controllers/QuestionsController.cs` - Question API with semantic filtering
- `Backend/Controllers/SessionsController.cs` - Race session management
- `Backend/Controllers/LeaderboardController.cs` - Rankings and statistics

### Real-time Communication
- `Backend/Hubs/RaceHub.cs` - SignalR hub for live race updates

### Entry Point
- `Backend/Program.cs` - Application startup and service configuration

## Frontend Core Files

### Main Application
- `frontend/src/main.tsx` - React application entry point
- `frontend/src/App.tsx` - Main application component

### Game Components
- `frontend/src/components/Game.tsx` - Main game orchestrator
- `frontend/src/components/RaceTrack.tsx` - PixiJS 2D racing engine
- `frontend/src/components/QuizOverlay.tsx` - Question modal with 3-option format
- `frontend/src/components/Leaderboard.tsx` - Rankings display

### State Management
- `frontend/src/state/gameStore.ts` - Zustand global state management

### API Integration
- `frontend/src/lib/api.ts` - Backend API client with updated Question interface

### Styling
- `frontend/src/App.css` - Main application styles
- `frontend/src/index.css` - Global styles and CSS reset

## Documentation

### Project Documentation
- `docs/initial-implementation-plan.md` - Updated comprehensive implementation plan
- `README.md` - Setup instructions and project overview

### AI Assistant Rules
- `.ai-rules/important-file-paths.md` - This file (frequently accessed paths)

## Development Workflow Files

### Database Migrations
- `Backend/Migrations/` - Entity Framework migration files (auto-generated)

### Build Outputs
- `Backend/bin/Debug/net9.0/` - Compiled backend application
- `frontend/dist/` - Built frontend assets (after npm run build)

## Port Configuration Summary

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Frontend | 3113 | http://localhost:3113 | React development server |
| Backend HTTPS | 8443 | https://localhost:8443 | API and SignalR hub |
| Backend HTTP | 8080 | http://localhost:8080 | Alternative API access |
| PostgreSQL | 5432 | localhost:5432 | Primary database |
| Milvus | 19530 | localhost:19530 | Vector database |
| Attu UI | 3001 | http://localhost:3001 | Milvus admin interface |
| Redis | 6379 | localhost:6379 | Caching layer |

## Key Features Implemented

### Question System
- **3-Option Format**: All questions have exactly options A, B, C
- **Semantic Filtering**: Milvus vector DB prevents similar questions
- **Character Limits**: Question (200 chars), Options (80 chars each)
- **Topics**: JavaScript, C#, SOLID, Algorithms

### Game Mechanics
- **Real-time Racing**: PixiJS-powered 2D car physics
- **Lives System**: 3 strikes = spectator mode
- **Checkpoints**: Trigger quiz overlays with 10-second timer
- **Leaderboards**: Daily/weekly/monthly/all-time rankings

### Technical Architecture
- **Vector Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Similarity Threshold**: 0.85 cosine similarity
- **Real-time Communication**: SignalR for live updates
- **Database**: SQLite (dev) / PostgreSQL (prod) + Milvus (vectors) 