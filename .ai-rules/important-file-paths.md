# Important File Paths - Code Racer

This document tracks frequently accessed and important files in the Code Racer project.

**🚀 GitHub Repository**: [https://github.com/marvijo-code/code-racer](https://github.com/marvijo-code/code-racer)

## ✅ Project Status (Latest Session)

**Recent Fixes Completed:**
- 🔧 Fixed PIXI.js initialization issues with proper async handling
- 🔧 Resolved canvas ref availability problems  
- 🔧 Implemented proper keyboard input handling with refs
- 🔧 Fixed backend build issues by clearing locked cache files
- 🔧 Added comprehensive debugging and error handling
- 🔧 Successfully deployed to GitHub public repository

**Current Working Features:**
- ✅ Real-time 2D Racing with PixiJS graphics engine
- ✅ WASD/Arrow key car controls with physics
- ✅ Backend API with ASP.NET Core
- ✅ Database integration with Entity Framework
- ✅ Question system with 3-option multiple choice format
- ✅ Race session management
- ✅ Lives system (3 strikes = spectator mode)
- ✅ Timer and lap tracking
- ✅ Leaderboard system

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
- `README.md` - Updated project documentation and setup instructions

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

### Game Components (Recently Fixed)
- `frontend/src/components/Game.tsx` - Main game orchestrator
- `frontend/src/components/RaceTrack.tsx` - **FIXED**: PixiJS 2D racing engine with proper async initialization and keyboard input handling
- `frontend/src/components/QuizOverlay.tsx` - Question modal with 3-option format
- `frontend/src/components/Leaderboard.tsx` - Rankings display

### State Management
- `frontend/src/state/gameStore.ts` - Zustand global state management

### API Integration
- `frontend/src/lib/api.ts` - Backend API client with updated Question interface

### Styling
- `frontend/src/App.css` - Main application styles including loading track styles
- `frontend/src/index.css` - Global styles and CSS reset

## Documentation

### Project Documentation
- `docs/initial-implementation-plan.md` - Updated comprehensive implementation plan
- `README.md` - **UPDATED**: Setup instructions, current status, and GitHub repository link

### AI Assistant Rules
- `.ai-rules/important-file-paths.md` - This file (frequently accessed paths)

## Development Workflow Files

### Database Migrations
- `Backend/Migrations/` - Entity Framework migration files (auto-generated)

### Build Outputs (Recently Fixed)
- `Backend/bin/Debug/net9.0/` - Compiled backend application
- `frontend/dist/` - Built frontend assets (after npm run build)

**Note**: If build issues occur, clear `Backend/obj` and `Backend/bin` directories.

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

### Game Mechanics (Recently Fixed)
- **Real-time Racing**: **FIXED** PixiJS-powered 2D car physics with proper initialization
- **Keyboard Controls**: **FIXED** WASD/Arrow key input handling with refs
- **Lives System**: 3 strikes = spectator mode
- **Checkpoints**: Trigger quiz overlays with 10-second timer
- **Leaderboards**: Daily/weekly/monthly/all-time rankings

### Technical Architecture
- **Vector Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Similarity Threshold**: 0.85 cosine similarity
- **Real-time Communication**: SignalR for live updates
- **Database**: SQLite (dev) / PostgreSQL (prod) + Milvus (vectors)

## Troubleshooting Guide

### Common Issues (Recently Resolved):
1. **"Canvas ref not available"** - ✅ Fixed with proper ref handling
2. **PIXI.js initialization stuck** - ✅ Fixed with async initialization and proper cleanup
3. **Backend build errors** - ✅ Clear `Backend/obj` and `Backend/bin` directories
4. **Keyboard controls not working** - ✅ Fixed with ref-based input handling

### Debug Information:
- Check browser console for PIXI.js initialization logs
- Backend logs show Milvus initialization status
- Frontend shows canvas ready status in loading screen

## Next Development Session Priorities

**Potential Areas for Enhancement:**
1. **Improve Game Physics**: Fine-tune car movement and collision detection
2. **Quiz System**: Implement checkpoint collision detection for quiz triggers
3. **Real-time Features**: Add SignalR integration for multiplayer
4. **Performance**: Optimize PIXI.js rendering and game loop
5. **UI/UX**: Enhance visual feedback and animations
6. **Testing**: Add unit tests for critical components 