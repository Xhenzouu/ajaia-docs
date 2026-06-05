# Collaborative Document Editor

A lightweight Google Docs-inspired editor with rich text formatting, file upload, and document sharing.

## Live Demo
[https://ajaia-docs-frontend.onrender.com](https://ajaia-docs-frontend.onrender.com)

## Test Accounts
| User | User ID |
|------|---------|
| Alice | user1 |
| Bob | user2 |

## Local Setup

### Prerequisites
- Node.js (v18 or higher)
- npm

### Backend Setup
```bash
cd backend
npm install
npm run dev
Backend runs on http://localhost:3001

Frontend Setup
bash
cd frontend
npm install
npm run dev
Frontend runs on http://localhost:5173

Features
Create, rename, edit documents

Bold, italic, underline

Bullet lists, numbered lists

Headings (H2)

Upload .txt files → new documents

Share documents between users

Auto-save every 30 seconds

Persistent SQLite storage

Tech Stack
Frontend: React, TypeScript, TipTap, Vite

Backend: Node.js, Express, SQLite

Deployment: Render