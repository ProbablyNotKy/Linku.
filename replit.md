# Ascendia - Malaysian Scholarship Discovery Platform

## Overview
Ascendia is a scholarship discovery platform designed for Malaysian students. The application displays educational opportunities from various providers with a beautiful, responsive UI.

## Architecture

This is a **Polyglot Monorepo** with:
- **Backend**: FastAPI (Python) - Expected to run on port 8000
- **Frontend**: React/Vite (running on port 5000)
- **Alternative Frontend**: Next.js version available in `/frontend` directory

## Project Structure

```
/
├── backend/                 # FastAPI Python backend
│   ├── main.py              # FastAPI app with CORS, auto-seeds on startup
│   ├── database.py          # SQLAlchemy with Replit PostgreSQL
│   ├── models.py            # Scholarship SQLAlchemy model
│   ├── schemas.py           # Pydantic request/response schemas
│   └── seed.py              # Database seeding with 5 Malaysian scholarships
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

## Data Model

### Scholarship Interface
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

To manually run the seed script:
```bash
cd backend && python seed.py
```

## API Integration

The frontend fetches data from FastAPI backend at `http://127.0.0.1:8000`:
- `GET /scholarships/?query={search}&level={level}` - List scholarships with optional filtering
  - `query`: Search in title and tags (uses array_to_string for tag search)
  - `level`: Filter by education level (case-insensitive)
  - Results ordered by deadline (ascending)
- `GET /scholarships/{id}` - Get single scholarship
- `POST /scholarships/` - Create new scholarship (admin)

## Running the Application

1. **Start FastAPI Backend** (separate terminal):
   ```bash
   cd backend  # wherever your FastAPI code is
   uvicorn main:app --reload --port 8000
   ```

2. **Start Frontend** (this Replit runs automatically):
   The React/Vite frontend runs on port 5000

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
- Form fields: Title, Provider, Amount, Deadline, Education Level, URL, Tags
- Success/error feedback after submission

## Current Features

- **Search & Filter**: Search scholarships by title/tags with 500ms debounce, filter by education level
- **Deadline Highlighting**: Cards show urgent (red border, <30 days) and expired (dimmed, disabled) states
- **Tag Pills**: Visual tags displayed on scholarship cards
- **Responsive Grid**: 3 columns desktop, 2 tablet, 1 mobile

## Future Features (Planned)

- Filtering by provider, amount range
- Sorting by deadline, amount, alphabetical order
- Detailed scholarship view page
- Deadline notifications and countdown timers
