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
  provider TEXT,
  amount TEXT,
  deadline TEXT,
  education_level TEXT,
  url TEXT,
  tags TEXT[],
  embedding vector(1536),  -- For AI matching
  -- High-Precision Mode fields
  study_areas TEXT[],              -- e.g., ["STEM", "Business", "Law"]
  min_cgpa REAL,                   -- Minimum CGPA (0-4 scale)
  min_spm_as INTEGER,              -- Minimum SPM A's required
  household_income_max REAL,       -- Max household income in RM
  state_restriction TEXT,          -- Malaysian state restriction
  is_bumiputera_only BOOLEAN DEFAULT FALSE,
  ai_matching_context TEXT         -- Hidden context for AI matching
);

-- Scholarship Drafts for Discovery Agent
CREATE TABLE scholarship_drafts (
  id SERIAL PRIMARY KEY,
  title TEXT,
  provider TEXT,
  amount TEXT,
  deadline TEXT,
  education_level TEXT,
  url TEXT,
  description TEXT,
  source_quote TEXT,               -- For verification
  status TEXT DEFAULT 'pending',   -- pending, approved, rejected
  study_areas TEXT[],
  min_cgpa REAL,
  min_spm_as INTEGER,
  household_income_max REAL,
  state_restriction TEXT,
  is_bumiputera_only BOOLEAN DEFAULT FALSE,
  ai_matching_context TEXT
);

-- User Profiles for Scholarship Matching
CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  education_level TEXT,
  cgpa REAL,
  spm_as INTEGER,
  household_income TEXT,           -- B40, M40, T20
  state TEXT,
  is_bumiputera BOOLEAN DEFAULT FALSE,
  study_areas TEXT[],
  bio_achievements TEXT,
  embedding vector(1536),          -- AI-generated profile embedding
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Malaysian Constants
```typescript
// 16 Malaysian States
MALAYSIAN_STATES = ["Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", 
  "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", 
  "Selangor", "Terengganu", "Wilayah Persekutuan Kuala Lumpur", 
  "Wilayah Persekutuan Labuan", "Wilayah Persekutuan Putrajaya"]

// 16 Study Areas
STUDY_AREAS = ["STEM", "Engineering", "Medicine & Health Sciences", 
  "Business", "Accounting", "Law", "Arts & Humanities", "Social Sciences",
  "Education", "IT & Computer Science", "Architecture", "Agriculture",
  "Environmental Studies", "Islamic Studies", "Media & Communications", "General"]
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
  // High-Precision Mode fields
  study_areas?: string[];
  min_cgpa?: number | null;
  min_spm_as?: number | null;
  household_income_max?: number | null;
  state_restriction?: string | null;
  is_bumiputera_only?: boolean;
  ai_matching_context?: string | null;
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
- `POST /profile/sync` - Generate embedding from student bio/profile (legacy)
- `POST /scholarships/match` - Find top matching scholarships using cosine similarity (legacy)
- `POST /scholarships/vectorize` - Batch vectorize all scholarships without embeddings
- `POST /chat/coach` - Socratic Mentor chat (GPT-4o with STAR method guidance)

### User Profile Endpoints (Phase 2.5)
- `POST /profiles/` - Create user profile with all eligibility fields, auto-generates embedding
- `GET /profiles/{profile_id}` - Retrieve stored profile
- `POST /profiles/match` - Match scholarships using stored profile with hard-filtering

### Admin Discovery Agent Endpoints
- `POST /admin/scrape` - Multi-URL researcher: accepts array of URLs, extracts scholarship data with hallucination guards
- `GET /admin/drafts` - List pending drafts for review
- `PUT /admin/drafts/{id}` - Update draft before publishing
- `POST /admin/drafts/{id}/publish` - Approve and publish draft to scholarships
- `POST /admin/drafts/{id}/reject` - Reject draft

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
3-step "Scholarship Matcher" wizard that saves profiles to Supabase:
1. **Step 1: Academics** - Education level, CGPA (0-4 scale), SPM A's (0-12)
2. **Step 2: Eligibility** - Household income bracket (B40/M40/T20), Malaysian state, Bumiputera status
3. **Step 3: Interests** - Study areas multi-select (16 categories), bio/achievements text
4. Profile embedding is generated server-side and stored in Supabase `user_profiles` table
5. Profile ID is stored in localStorage for Magic Match
6. Auto-redirects to `/?magic=true` after completion

### Magic Match
Toggle on Home page that switches from keyword search to AI-powered matching:
- Uses stored profile from Supabase (requires profile_id in localStorage)
- **Two-phase matching**: Hard filters (eligibility) eliminate ineligible scholarships first, then semantic similarity ranks using ai_matching_context
- Displays match percentage on each scholarship card
- Shows ineligibility reasons for scholarships that don't match criteria
- Household income brackets converted to RM: B40 (≤RM 4,850), M40 (≤RM 10,959), T20 (no limit)

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

## High-Precision Mode (Phase 3)

### Discovery Agent
Multi-URL researcher in Admin dashboard:
1. Enter primary URL + additional pages (eligibility, FAQ, etc.)
2. AI extracts scholarship data with hallucination guards:
   - Returns null for missing data (never guesses)
   - Defaults to ["General"] for unspecified study areas
   - Includes source_quote for verification
3. Admin reviews/edits drafts before publishing
4. Full edit modal for all eligibility fields

### Malaysian Eligibility Filtering
Precision matching with hard filters:
- **CGPA**: Minimum cumulative grade point (0-4 scale)
- **SPM A's**: Minimum A's required in SPM exams (0-10)
- **Household Income**: Maximum monthly income in RM
- **State Restriction**: Limited to specific Malaysian states
- **Bumiputera Only**: Exclusive to Bumiputera students

### AI Matching Context
Hidden field for improved semantic matching:
- Describes ideal candidate profile
- Example: "Values leadership and community service in rural areas"
- Boosts match scores for compatible students

## Setup Instructions

1. Run the vector extension SQL in Supabase (already done if following prerequisites)
2. Run the `match_scholarships` RPC function SQL in Supabase SQL Editor
3. Call `POST /api/scholarships/vectorize` to generate embeddings for existing scholarships
4. Create a student profile at `/onboarding`
5. Enable "Magic Match" toggle on Home page to see AI-ranked results
