# Traveler Booking Platform

A professional, scalable travel booking platform inspired by MakeMyTrip, built with clean architecture, strict modularity, and production-grade engineering principles.

---

## 🏛️ Monorepo Structure

```text
traveler/
├── apps/
│   ├── web/               # Customer Travel Portal (Vite + React + TS + Tailwind)
│   └── admin/             # Operations & Inventory Dashboard (Vite + React + TS + Tailwind)
├── backend/
│   ├── app/
│   │   ├── api/v1/        # API v1 versioned endpoints
│   │   ├── core/          # App configuration, security, database sessions
│   │   ├── dependencies/  # FastAPI dependency injection
│   │   ├── models/        # SQLAlchemy 2.0 ORM models
│   │   ├── providers/     # Travel provider adapter contracts & mock providers
│   │   │   ├── flights/
│   │   │   ├── hotels/
│   │   │   ├── buses/
│   │   │   ├── packages/
│   │   │   └── payments/
│   │   ├── repositories/  # Database access layer
│   │   ├── schemas/       # Pydantic v2 validation models
│   │   ├── services/      # Business logic layer
│   │   └── main.py        # FastAPI entrypoint
│   ├── migrations/        # Alembic database migrations
│   ├── tests/             # Automated test suite (pytest)
│   └── requirements.txt   # Backend Python dependencies
├── packages/
│   └── contracts/         # Shared TypeScript interfaces & API contracts
├── docs/                  # Architecture & operational documentation
├── docker-compose.yml     # Local PostgreSQL service
├── .env.example           # Environment template
└── README.md
```

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: >= 20.x (tested on v22.x)
- **Python**: >= 3.11 (tested on 3.14.x)
- **Docker**: For local PostgreSQL database (or standalone PostgreSQL instance)

### 2. Backend Setup
```bash
# In repository root:
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1
# (Linux/macOS)
# source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Start PostgreSQL via Docker Compose
docker compose up -d db

# Run backend server
python -m uvicorn backend.app.main:app --reload --port 8000
```

Backend health endpoints:
- `http://localhost:8000/healthz`
- `http://localhost:8000/api/v1/health`
- Swagger UI: `http://localhost:8000/docs`

### 3. Frontend Setup (Monorepo)
```bash
# Install all workspace dependencies
npm install

# Start Customer Web App (Port 5173)
npm run dev:web

# Start Admin Dashboard (Port 5174)
npm run dev:admin
```

---

## 🧪 Testing & Verification

### Backend Tests
```bash
.\.venv\Scripts\pytest backend/tests -v
```

### Frontend Typecheck & Build
```bash
npm run typecheck
npm run build
```

---

## 🛡️ Phase 1 Disclosure
> **Simulated Travel Notice:** All travel inventory, quotes, flights, hotel rooms, and bookings created in Phase 1 are simulated mock operations. No actual airline tickets, hotel reservations, or payment charges are processed.
# traveler-
