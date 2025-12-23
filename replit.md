# Ascendia - Malaysian Scholarship Discovery Platform

## Overview
Ascendia is a scholarship discovery platform designed for Malaysian students. The application displays educational opportunities from various providers with a beautiful, responsive UI.

## Architecture

This is a **Polyglot Monorepo** with:
- **Backend**: FastAPI (Python) - Running on port 8000
- **Frontend**: React/Vite (running on port 5000)
- **Database**: Supabase (PostgreSQL with vector search capabilities for AI matching)
- **Alternative Frontend**: Next.js version available in `/frontend` directory

## Project Structure

```
/
├── backend/                 # FastAPI Python backend
│   ├── main.py              # FastAPI app with CORS, auto-seeds on startup
│   ├── supabase_client.py   # Supabase REST API client
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── database.py          # (Legacy) SQLAlchemy setup - not used
│   ├── models.py            # (Legacy) SQLAlchemy model - not used
│   └── seed.py              # (Legacy) Database seeding - not used
├── client/                  # React/Vite frontend (currently active)
│   ├── src/
│   │   ├── components/      # UI components
│   │   │   ├── Header.tsx           # Ascendia branded header
│   │   │   ├── ScholarshipCard.tsx  # Scholarship display card
│   │   │   ├── LoadingState.tsx     # Loading spinner
│   │   │   ├── ErrorState.tsx       # Error display
│   │   │   └── ui/                  # Shadcn UI components
│   │   ├── lib/
│   │   │   ├── api.ts               # FastAPI client
│   │   │   └── queryClient.ts       # React Query config
│   │   ├── pages/
│   │   │   └── Home.tsx             # Main scholarship listing
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

## Data Model

### Scholarship Table (Supabase)
```sql
CREATE TABLE scholarships (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  amount TEXT NOT NULL,
  deadline TEXT NOT NULL,
  education_level TEXT NOT NULL,
  url TEXT,
  tags TEXT[]
);
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

## Seed Data

The database is automatically seeded with 5 Malaysian scholarships on server startup (if empty):

1. **Yayasan Khazanah Global Scholarship** - Full Ride + Allowance (Undergraduate)
2. **Maybank Group Scholarship Programme** - RM 40,000/year (Undergraduate)  
3. **JPA PIDN Scholarship** - Full Coverage (Degree)
4. **Shell Malaysia Scholarship** - RM 12,000 + Internship (Undergraduate)
5. **The Star Education Fund** - Tuition Fee Waiver (Diploma/Degree)

## API Endpoints

The FastAPI backend provides:
- `GET /scholarships/?query={search}&level={level}` - List scholarships with optional filtering
  - `query`: Search in title (case-insensitive)
  - `level`: Filter by education level (case-insensitive)
  - Results ordered by deadline (ascending)
- `GET /scholarships/{id}` - Get single scholarship
- `POST /scholarships/` - Create new scholarship
- `PUT /scholarships/{id}` - Update existing scholarship
- `DELETE /scholarships/{id}` - Delete scholarship

## Running the Application

The workflow `Start application` runs `npm run dev` which starts:
1. Express server on port 5000 (serves Vite frontend)
2. FastAPI backend on port 8000 (Supabase-powered API)

## Design System

- **Brand Color**: Indigo-600 (#4f46e5)
- **Amount Text**: Green (#16a34a)
- **Urgent Deadlines**: Red
- **Grid Layout**: 3 columns (desktop), 2 columns (tablet), 1 column (mobile)

## Malaysian Localization

- Loading text: "Sedang memuatkan..." (Loading...)
- Error text: "Ralat berlaku" (Error occurred)
- Retry button: "Cuba Lagi" (Try Again)

## Admin Dashboard

Access the admin page at `/admin` (hidden from main navigation).

**Authentication:** Enter admin key `Ascendia2024` to access the dashboard.

**Features:**
- Create new scholarship opportunities
- Edit existing scholarships
- Delete scholarships
- Form fields: Title, Provider, Amount, Deadline, Education Level, URL, Tags
- Success/error feedback after submission

## Current Features

- **Search & Filter**: Search scholarships by title with 500ms debounce, filter by education level
- **Deadline Highlighting**: Cards show urgent (red border, <30 days) and expired (dimmed, disabled) states
- **Tag Pills**: Visual tags displayed on scholarship cards
- **Responsive Grid**: 3 columns desktop, 2 tablet, 1 mobile
- **Full CRUD**: Create, Read, Update, Delete scholarships via Admin dashboard

## Future Features (Planned)

- AI-powered scholarship matching using Supabase vector search
- Filtering by provider, amount range
- Sorting by deadline, amount, alphabetical order
- Detailed scholarship view page
- Deadline notifications and countdown timers
