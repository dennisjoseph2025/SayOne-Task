# SleepSync

A sleep-tracking assistant web app with a Django REST backend and React frontend. Log your sleep, view analytics, track streaks, and get AI-powered recommendations.

## Tech Stack

**Backend:** Django 6.0, Django REST Framework, Groq AI (llama-3.1-8b-instant), SQLite/PostgreSQL  
**Frontend:** React 19, Vite 8, Recharts, React Router, jsPDF, Lucide React  
**Package Management:** uv (backend), npm (frontend)  
**Deployment:** Vercel (frontend), Railway (backend)

## Features

- **Log sleep sessions** — bed time, wake time, quality (1–5 slider), notes, caffeine intake, exercise, screen time before bed
- **Sleep goals** — set target sleep duration and bedtime, with automatic streak tracking
- **Streaks & weekly score** — track goal adherence over consecutive nights
- **Analytics dashboard** — avg duration, quality, consistency score, best/worst nights, stat cards with icons
- **Sleep timeline** — visual bar chart of sleep sessions with quality color coding and time-axis gridlines
- **AI recommendations** — personalized sleep advice powered by Groq/llama3 with hero UI and spinner
- **Trend analysis** — correlations for caffeine, exercise, screen time; weekly quality-by-day chart
- **Wind-down prediction** — optimal wind-down time based on your data and sleep patterns
- **PDF export** — generate downloadable sleep reports with per-night details and averages
- **Wearable import** — import CSV/JSON from wearable devices or load 30-day mock data
- **Nightly email summaries** — automated email via management command
- **Auth** — register, login, token-based API auth with password visibility toggle
- **Skeleton loading** — shimmer placeholders on every page while data loads
- **Toast notifications** — non-intrusive feedback for all user actions
- **Server-side pagination** — efficient data loading with page navigation and ellipsis
- **Responsive design** — hamburger nav, mobile-optimized layouts at 640px/768px breakpoints
- **Accessible UI** — aria-labels, focus-visible rings, semantic HTML

## Setup

### Backend

```bash
cd backend
uv sync
cp .env.example .env          # edit with your secret key and GROQ_API_KEY
uv run python manage.py migrate
uv run python manage.py createsuperuser
uv run python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:8000`.

## Environment Variables

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `DJANGO_SECRET_KEY` | Yes | Django secret key |
| `DJANGO_DEBUG` | No | Set `True` for development (default: `False`) |
| `GROQ_API_KEY` | No | Groq API key for AI features ([get one here](https://console.groq.com/keys)) |
| `DATABASE_URL` | No | PostgreSQL URL (defaults to SQLite) |
| `DJANGO_ALLOWED_HOSTS` | No | Comma-separated allowed hosts |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend API URL (defaults to `/api` for Vite proxy) |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register/` | No | Create account |
| POST | `/api/auth/login/` | No | Login |
| GET/POST | `/api/sleep-entries/` | Yes | List (paginated) / Create entries |
| DELETE | `/api/sleep-entries/{id}/` | Yes | Delete entry |
| GET | `/api/sleep-entries/analytics/` | Yes | Aggregate analytics |
| POST | `/api/sleep-entries/generate_recommendations/` | Yes | AI recommendation |
| GET | `/api/sleep-entries/trends/` | Yes | Trend analysis |
| GET | `/api/sleep-entries/wind_down/` | Yes | Wind-down prediction |
| POST | `/api/wearable-import/` | Yes | Import CSV/JSON |
| POST | `/api/wearable-import/mock-data/` | Yes | Generate mock data |
| GET/POST | `/api/sleep-goals/` | Yes | List / Create goals |
| GET | `/api/sleep-goals/streak/` | Yes | Streak data |

## Running Tests

```bash
cd backend
uv run python manage.py test sleep.tests -v 2
```

26 tests covering: auth, CRUD, analytics, streaks, pagination, and model validation.

## Nightly Email Summary

```bash
cd backend
uv run python manage.py email_summary
```

Run via cron for automated nightly emails (requires SMTP settings in .env).

## Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Set root directory to `frontend`
4. Add env var: `VITE_API_URL=https://your-railway-app.up.railway.app/api`

### Backend (Railway)

1. Push to GitHub
2. Import repo on [railway.app](https://railway.app)
3. Set root directory to backend or use `railway.json`
4. Add env vars: `DJANGO_SECRET_KEY`, `GROQ_API_KEY`, `DATABASE_URL`, `DJANGO_ALLOWED_HOSTS`

## Project Structure

```
SayOne-Task/
├── backend/
│   ├── core/settings/          # split settings (base/dev/prod)
│   ├── sleep/
│   │   ├── models.py           # SleepEntry, SleepGoal
│   │   ├── views.py            # ViewSets, auth, import, mock
│   │   ├── services.py         # analytics, streaks, AI, trends, wind-down
│   │   ├── pagination.py       # StandardPagination (10 per page)
│   │   ├── management/         # email_summary, shell commands
│   │   └── tests.py            # 26 unit tests
│   ├── postman_collection.json # API collection for Postman
│   └── manage.py
└── frontend/
    ├── src/
    │   ├── pages/              # Log, History, Timeline, Dashboard, Goal,
    │   │                       # Recommend, Trends, Export, Import, Login, Register
    │   ├── api.js              # Axios instance with auth interceptor
    │   ├── AuthContext.jsx     # Auth state management
    │   ├── ToastContext.jsx    # Toast notification system
    │   ├── utils.js            # Shared helpers (quality colors, pagination)
    │   ├── index.css           # Global styles, CSS variables, animations
    │   └── App.css             # Layout, nav, forms, components
    ├── vercel.json             # Vercel deployment config
    └── vite.config.js
```
