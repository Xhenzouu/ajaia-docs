# Architecture Note

## Overview
Full-stack document editor with React frontend, Express backend, SQLite database.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Mock auth (user1/user2) | Saved 2+ hours, demonstrates sharing |
| SQLite over PostgreSQL | Zero config, no external service |
| TipTap editor | Best React integration for rich text |
| .txt only over .docx | Simpler, meets file upload requirement |

## Architecture Diagram
Browser (React) ←→ Express Backend ←→ SQLite Database
Port 5173 Port 3001

text

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/documents | Get user's documents |
| POST | /api/documents | Create document |
| PUT | /api/documents/:id | Update document |
| DELETE | /api/documents/:id | Delete document |
| POST | /api/documents/:id/share | Share document |
| POST | /api/upload | Upload .txt file |

## Tradeoffs
- No real-time collaboration (4+ hours saved)
- No .docx support (txt sufficient)
- Mock users instead of real auth