# Ascendia - Malaysian Scholarship Discovery Platform

## Overview
Ascendia is a scholarship discovery platform designed for Malaysian students. The application displays educational opportunities from various providers with a beautiful, responsive UI and AI-powered matching.

## Architecture

This is a **Polyglot Monorepo** with:
- **Backend**: FastAPI (Python) - Running on port 8000
- **Frontend**: React/Vite (running on port 5000)
- **Database**: Supabase (PostgreSQL with vector search capabilities for AI matching)
- **AI**: OpenAI text-embedding-3-small for embeddings, GPT-4o for chat
- **Alternative Frontend**: Next.js version available in `/frontend` directory

## Project Structure

```
/
├── backend/                 # FastAPI Python backend
│   ├── main.py              # FastAPI app with CORS, AI endpoints, auto-seeds on startup
│   ├── supabase_client.py   # Supabase REST API client
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── database.py          # (Legacy) SQLAlchemy setup - not used
│   ├── models.py            # (Legacy) SQLAlchemy model - not used
│   └── seed.py              # (Legacy) Database seeding - not used
├── client/                  # React/Vite frontend (currently active)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx           # Ascendia branded header
│   │   │   ├── ScholarshipCard.tsx  # Scholarship display card
│   │   │   ├── ChatComponent.tsx    # Socratic Mentor chat interface
│   │   │   ├── LoadingState.tsx     # Loading spinner
│   │   │   ├── ErrorState.tsx       # Error display
│   │   │   └── ui/                  # Shadcn UI components
│   │   ├── lib/
│   │   │   ├── api.ts               # FastAPI client (CRUD + AI endpoints)
│   │   │   └── queryClient.ts       # React Query config
│   │   ├── pages/
│   │   │   ├── Home.tsx             # Main scholarship listing with Magic Match
│   │   │   ├── Admin.tsx            # Admin dashboard
│   │   │   └── Onboarding.tsx       # AI profile creation wizard
│   │   └── App.tsx
│   └── index.html
├── frontend/                # Next.js alternative (for future use)
├── server/                  # Express server (Vite dev server, proxies to FastAPI)
├── shared/
│   └── schema.ts            # Shared TypeScript types (Scholarship interface)
└── design_guidelines.md     # UI/UX design specifications
```

## Environment Variables (Secrets)

Required secrets in Replit:
- `SUPABASE_URL` - Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `SUPABASE_SERVICE_KEY` - Your Supabase service_role key (for backend use)
- `OPENAI_API_KEY` - OpenAI API key for embeddings and chat

## Data Model

### Scholarship Table (Supabase)
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE scholarships (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  amount TEXT NOT NULL,
  deadline TEXT NOT NULL,
  education_level TEXT NOT NULL,
  url TEXT,
  tags TEXT[],
  embedding vector(1536)  -- For AI matching
);
```

### Required Supabase RPC Function
Run this in Supabase SQL Editor to enable AI matching:
```sql
CREATE OR REPLACE FUNCTION match_scholarships(
  query_embedding vector(1536),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id int,
  title text,
  provider text,
  amount text,
  deadline text,
  education_level text,
  url text,
  tags text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.provider,
    s.amount,
    s.deadline,
    s.education_level,
    s.url,
    s.tags,
    1 - (s.embedding <=> query_embedding) AS similarity
  FROM scholarships s
  WHERE s.embedding IS NOT NULL
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Scholarship Interface (TypeScript)
```typescript
interface Scholarship {
  id: number;
  title: string;
  provider: string;
  amount: string;
  deadline: string;
  education_level: string;
  url?: string;
  tags?: string[];
}
```

## API Endpoints

### Scholarship CRUD
- `GET /scholarships/?query={search}&level={level}` - List scholarships with optional filtering
- `GET /scholarships/{id}` - Get single scholarship
- `POST /scholarships/` - Create new scholarship
- `PUT /scholarships/{id}` - Update existing scholarship
- `DELETE /scholarships/{id}` - Delete scholarship

### AI Endpoints
- `POST /profile/sync` - Generate embedding from student bio/profile
- `POST /scholarships/match` - Find top matching scholarships using cosine similarity
- `POST /scholarships/vectorize` - Batch vectorize all scholarships without embeddings
- `POST /chat/coach` - Socratic Mentor chat (GPT-4o with STAR method guidance)

## Running the Application

The workflow `Start application` runs `npm run dev` which starts:
1. Express server on port 5000 (serves Vite frontend)
2. FastAPI backend on port 8000 (Supabase-powered API)

## Design System

- **Brand Color**: Indigo-600 (#4f46e5)
- **Amount Text**: Green (#16a34a)
- **Urgent Deadlines**: Red
- **Grid Layout**: 3 columns (desktop), 2 columns (tablet), 1 column (mobile)

## Admin Dashboard

Access the admin page at `/admin` (hidden from main navigation).

**Authentication:** Enter admin key `Ascendia2024` to access the dashboard.

**Features:**
- Dashboard stats: Total, Active, Expiring Soon, Expired scholarships
- Create new scholarship opportunities
- Edit existing scholarships
- Delete scholarships with confirmation
- Search/filter within admin panel
- Form fields: Title, Provider, Amount, Deadline, Education Level, URL, Tags

## AI Features (Phase 2)

### Student Onboarding (`/onboarding`)
Multi-step form to create an AI profile:
1. Step 1: Background - Student shares their story, experiences, achievements
2. Step 2: Goals - Education level and field of study selection
3. Profile embedding is generated and stored in localStorage

### Magic Match
Toggle on Home page that switches from keyword search to AI-powered similarity ranking:
- Uses student's profile embedding to find best-matching scholarships
- Displays match percentage on each scholarship card
- Requires profile creation first

### Socratic Mentor Chat
Floating chat button on Home page:
- AI mentor that helps students craft scholarship applications
- Uses STAR method (Situation, Task, Action, Result)
- Never writes for students - asks guiding questions instead
- Powered by GPT-4o

## Current Features

- **Search & Filter**: Search scholarships by title with 500ms debounce, filter by education level
- **Deadline Highlighting**: Cards show urgent (red border, <30 days) and expired (dimmed, disabled) states
- **Tag Pills**: Visual tags displayed on scholarship cards
- **Responsive Grid**: 3 columns desktop, 2 tablet, 1 mobile
- **Full CRUD**: Create, Read, Update, Delete scholarships via Admin dashboard
- **AI Matching**: Profile-based scholarship recommendations using vector similarity
- **Socratic Coach**: AI-guided application writing assistance

## Setup Instructions

1. Run the vector extension SQL in Supabase (already done if following prerequisites)
2. Run the `match_scholarships` RPC function SQL in Supabase SQL Editor
3. Call `POST /api/scholarships/vectorize` to generate embeddings for existing scholarships
4. Create a student profile at `/onboarding`
5. Enable "Magic Match" toggle on Home page to see AI-ranked results
