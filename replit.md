# Ascendia - Malaysian Scholarship Discovery Platform

## Overview
Ascendia is a scholarship discovery platform for Malaysian students, providing a responsive UI, AI-powered matching, and a Socratic AI mentor for application guidance. It aims to connect students with educational opportunities efficiently and effectively.

## User Preferences
- **Communication Style**: I prefer simple language and direct answers.
- **Coding Style**: I appreciate clean, maintainable code, preferably following established best practices for the chosen frameworks.
- **Workflow**: I prefer an iterative development approach, focusing on delivering core features first and then refining them.
- **Interaction**: Please ask for confirmation before making significant architectural changes or implementing new features that deviate from the current design.
- **Explanations**: I prefer detailed explanations for complex logic or design decisions.
- **Code Changes**: Do not make changes to the `/frontend` directory as it is an alternative for future use and not actively maintained.

## System Architecture
Ascendia is built as a polyglot monorepo. The core components include a FastAPI (Python) backend, a React/Vite frontend, and Supabase as the database. AI capabilities are powered by OpenAI for embeddings and chat.

### UI/UX Decisions
- **Brand Color**: Indigo-600 (#4f46e5).
- **Typography**: Amount text in Green (#16a34a), urgent deadlines highlighted in Red.
- **Layout**: Utilizes a responsive grid system (3 columns for desktop, 2 for tablet, 1 for mobile).
- **Components**: Leverages Shadcn UI for consistent and accessible components.

### Technical Implementations
- **Backend**: FastAPI handles API requests, AI integrations, and database interactions with Supabase. It includes endpoints for scholarship CRUD, AI-powered matching, user profile management, and admin functions.
- **Frontend**: A React/Vite application provides the user interface for scholarship discovery, student onboarding, and the Socratic Mentor chat. It uses React Query for data fetching and state management.
- **Database**: Supabase (PostgreSQL) is used for data storage, including scholarships, user profiles, and scholarship drafts. It utilizes PostgreSQL's `vector` extension for AI-powered semantic search and matching.
- **AI Integration**:
    - **Embeddings**: OpenAI's `text-embedding-3-small` generates vector embeddings for scholarships and user profiles, enabling semantic similarity matching.
    - **Chat**: GPT-4o powers the Socratic Mentor, guiding students through scholarship application processes using the STAR method.
    - **Matching Logic**: Employs a two-phase matching approach: hard filters for eligibility criteria followed by semantic similarity ranking.
- **Admin Dashboard**: A protected `/admin` route provides tools for managing scholarships, reviewing AI-extracted scholarship drafts, and monitoring system statistics. **Requires Supabase authentication** - users must sign in to access admin features.
- **Authentication**: Supabase Auth with email/password. JWT tokens are verified on the backend using `SUPABASE_JWT_SECRET`. Protected admin endpoints include:
    - `POST /api/scholarships` (create)
    - `PUT /api/scholarships/{id}` (update)
    - `DELETE /api/scholarships/{id}` (delete)
    - `POST /api/admin/scrape` (URL scraping)
    - `GET/PUT/POST/DELETE /api/admin/drafts` (draft management)
- **Role-Based Admin Access**: Admin privileges are controlled via the `ADMIN_EMAILS` environment variable. Set a comma-separated list of email addresses that should have admin access (e.g., `admin@example.com,user@example.com`). Users with JWT role `admin` or `service_role` are also granted admin access. Non-admin users receive a 403 Forbidden response when attempting to access admin endpoints.
- **High-Precision Mode**: Incorporates detailed Malaysian eligibility criteria (CGPA, SPM A's, household income, state restriction, Bumiputera status) for accurate scholarship filtering.
- **English Proficiency System**: A universal CEFR-based scale maps various English test scores (MUET, IELTS, SPM English) to a common standard, allowing cross-test matching.

### Feature Specifications
- **Scholarship Discovery**: Search and filter scholarships by title and education level, with responsive display.
- **Scholarship Detail View**: Clicking on a scholarship card opens a sliding drawer panel from the right with full details including rich text descriptions (markdown rendered), eligibility requirements, study areas, and an "Apply Now" button. Expired scholarships show "Application Closed" instead.
- **Rich Text Descriptions**: Scholarships can have detailed markdown descriptions edited via MDEditor in the admin panel, rendered with react-markdown in the detail drawer.
- **AI Matching**: Students complete a 3-step onboarding wizard to create a profile (academics, eligibility, interests), which generates an embedding for personalized scholarship recommendations. **Premium feature**.
- **Socratic Mentor Chat**: An AI assistant helps students develop scholarship application essays and responses using guiding questions based on the STAR method. **Premium feature**.
- **Admin Discovery Agent**: An AI-powered tool extracts scholarship data from URLs, creates drafts for admin review, and helps populate the database with new opportunities.
- **Deadline Management**: Scholarship cards visually indicate urgent (<30 days) and expired deadlines.

### Subscription / Monetization System
- **Tiers**: Free and Premium tiers. Free users can browse scholarships; Premium users access AI Matching and Socratic Mentor.
- **Database**: `subscriptions` table tracks user subscription status with fields: `auth_user_id`, `tier`, `status`, `expires_at`, `payment_reference`, `payment_provider`, `amount_paid`.
- **Premium Features** (require active premium subscription):
    - `ai_matching`: AI-powered personalized scholarship recommendations
    - `ai_mentor`: Socratic Mentor chat for essay guidance
    - `priority_support`: Priority customer support
- **Backend Endpoints**:
    - `GET /api/subscription/status`: Get current user's subscription status
    - `GET /api/subscription/check-feature/{feature_name}`: Check access to a specific premium feature
    - `POST /api/subscription/webhook/toyyibpay`: Webhook for ToyyibPay payment callbacks (ready for integration)
    - `POST /api/subscription/activate/{auth_user_id}`: Admin-only endpoint to manually activate subscriptions
- **Frontend Integration**:
    - `useSubscription` hook provides subscription status and feature access checks
    - `UpgradePrompt` component displays when users try to access premium features without subscription
    - Premium features show upgrade modal instead of error when accessed by free users
- **Payment Integration (ToyyibPay)**:
    - **Price**: RM 10/month for Premium
    - **Flow**: User clicks "Upgrade Now" on `/subscription` page -> fills in name/email/phone -> backend creates a bill via ToyyibPay API -> user is redirected to ToyyibPay payment page -> after payment, ToyyibPay sends callback to webhook -> user redirected to `/payment-status` page
    - `POST /api/subscription/create-bill`: Creates a ToyyibPay bill and returns payment URL (requires auth)
    - `POST /api/subscription/webhook/toyyibpay`: Webhook receives form-encoded callback from ToyyibPay with refno, status, billcode, order_id, amount
    - **Environment Variables**: `TOYYIBPAY_SECRET_KEY`, `TOYYIBPAY_CATEGORY_CODE` (secrets), `TOYYIBPAY_API_URL` (defaults to https://toyyibpay.com)
    - **Return URL**: `/payment-status` page displays success/pending/failed status based on `status_id` query param

### Pages
- **Landing Page** (`/`): Marketing page for first-time visitors
- **Scholarships Page** (`/scholarships`): Main scholarship discovery and search
- **Subscription Page** (`/subscription`): Pricing comparison between Free and Premium tiers with upgrade button
- **Dashboard Page** (`/dashboard`): User profile overview, subscription status, and quick actions
- **Onboarding Page** (`/onboarding`): 3-step wizard for creating student profiles
- **Admin Page** (`/admin`): Protected dashboard for managing scholarships and drafts
- **Payment Status Page** (`/payment-status`): Shows payment result after ToyyibPay redirect (success/pending/failed)
- **Login/Signup Pages** (`/login`, `/signup`): Authentication pages

## External Dependencies
- **Supabase**: PostgreSQL database for persistent storage, authentication, and real-time features. Utilizes its `vector` extension for AI-powered similarity search.
- **OpenAI API**:
    - `text-embedding-3-small`: For generating vector embeddings for text data.
    - `GPT-4o`: For the Socratic Mentor chat functionality.
- **Vite**: Frontend build tool.
- **React**: JavaScript library for building user interfaces.
- **FastAPI**: Python web framework for the backend API.