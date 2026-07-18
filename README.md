# SleepSync

A sleep-tracking assistant web app with a Django REST backend and React frontend. Log your sleep, view analytics, track streaks, and get AI-powered recommendations.

## Tech Stack

**Backend:** Django 6.0, Django REST Framework, Groq AI (llama3-8b-8192), SQLite/PostgreSQL  
**Frontend:** React 19, Vite, Recharts, React Router, jsPDF  
**Package Management:** uv (backend), npm (frontend)  
**Deployment:** Vercel (frontend), Railway (backend)

## Features

- **Log sleep sessions** — bed time, wake time, quality (1–5), notes, caffeine, exercise, screen time
- **Sleep goals** — set target bed time, wake time, and duration
- **Streaks & weekly score** — track goal adherence over time
- **Analytics dashboard** — avg duration, quality, consistency score, best/worst nights
- **Sleep timeline** — visual bar chart of sleep sessions with quality color coding
- **AI recommendations** — personalized advice based on your sleep patterns (Groq/llama3)
- **Trend analysis** — detect mood factors, caffeine/exercise/screen correlations
- **Wind-down prediction** — optimal wind-down time based on your data
- **PDF export** — weekly/monthly/all-time sleep reports
- **Wearable import** — import CSV/JSON from wearable devices or generate mock data
- **Nightly email summaries** — automated email via management command
- **Auth** — register, login, token-based API auth

## Setup

### Backend

```bash
cd backend
uv sync
cp .env.example .env          # edit with your secret key and GROQ_API_KEY
uv run python manage.py migrate
uv run python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:8000`.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register/` | No | Create account |
| POST | `/api/auth/login/` | No | Login |
| GET/POST | `/api/sleep-entries/` | Yes | List / Create entries |
| DELETE | `/api/sleep-entries/{id}/` | Yes | Delete entry |
| GET | `/api/sleep-entries/analytics/` | Yes | Aggregate analytics |
| POST | `/api/sleep-entries/recommend/` | Yes | AI recommendation |
| GET | `/api/sleep-entries/trends/` | Yes | Trend analysis |
| GET | `/api/sleep-entries/wind_down/` | Yes | Wind-down prediction |
| POST | `/api/sleep-entries/import_wearable/` | Yes | Import CSV/JSON |
| POST | `/api/sleep-entries/mock_generate/` | Yes | Generate mock data |
| GET/POST | `/api/sleep-goals/` | Yes | List / Create goals |
| GET | `/api/sleep-goals/streak/` | Yes | Streak data |

## Running Tests

```bash
cd backend
uv run pytest
```

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
│   │   ├── management/         # email_summary command
│   │   └── tests.py            # unit tests
│   └── manage.py
└── frontend/
    ├── src/
    │   ├── pages/              # Log, History, Timeline, Dashboard, Goal,
    │   │                       # Recommend, Trends, Export, Import, Login, Register
    │   ├── api.js              # Axios instance with auth interceptor
    │   └── AuthContext.jsx     # Auth state management
    ├── vercel.json             # Vercel deployment config
    └── vite.config.js
```
