# SleepSync

A sleep-tracking assistant web app with a Django REST backend and React frontend. Log your sleep, view analytics, track streaks, and get AI-powered recommendations.

## Tech Stack

**Backend:** Django 6.0, Django REST Framework, Groq AI (llama3-8b-8192), SQLite  
**Frontend:** React 19, Vite, Recharts, React Router  
**Package Management:** uv (backend), npm (frontend)

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
| POST | `/api/auth/register/` | No | Create account, returns token |
| POST | `/api/auth/login/` | No | Login, returns token |
| GET | `/api/sleep-entries/` | Yes | List all entries |
| POST | `/api/sleep-entries/` | Yes | Create entry |
| DELETE | `/api/sleep-entries/{id}/` | Yes | Delete entry |
| GET | `/api/sleep-entries/analytics/` | Yes | Aggregate analytics |
| POST | `/api/sleep-entries/recommend/` | Yes | AI recommendation |
| GET | `/api/sleep-goals/` | Yes | List goals |
| POST | `/api/sleep-goals/` | Yes | Create goal |
| GET | `/api/sleep-goals/streak/` | Yes | Streak data |

Auth uses `Token` header. A Postman collection is included at `backend/postman_collection.json`.

## Running Tests

```bash
cd backend
uv run pytest
```

## Project Structure

```
SayOne-Task/
├── backend/
│   ├── core/settings/      # split settings (base/dev/prod)
│   ├── sleep/              # models, views, serializers, services
│   ├── postman_collection.json
│   └── manage.py
└── frontend/
    ├── src/
    │   ├── pages/          # Log, History, Dashboard, Recommendations, Login, Register
    │   ├── api.js          # Axios instance
    │   └── AuthContext.jsx # Auth state management
    └── vite.config.js
```
