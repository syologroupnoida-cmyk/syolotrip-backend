# Traveler (SS Journey) — Backend Service

A production-ready, modular monolith backend for the SS Journey travel booking platform built with **FastAPI**, **PostgreSQL**, **SQLAlchemy 2.x (async)**, **Alembic**, and **Pydantic v2**.

---

## 1. Architecture Overview

The backend is structured as a clean modular monolith:

```
backend/
├── app/
│   ├── api/v1/          # FastAPI routers & dependency injection
│   │   ├── deps.py      # JWT authentication and role authorization (Admin/Customer)
│   │   ├── api.py       # Unified router mounting
│   │   └── endpoints/   # auth, flights, hotels, buses, packages, bookings, payments, admin, health
│   ├── core/            # Configuration, database engine, security & JWT utilities
│   ├── models/          # SQLAlchemy 2.x ORM models (UUID PKs, INR numeric pricing, indexes)
│   ├── repositories/    # Database queries & transactions with eager-loading
│   ├── schemas/         # Pydantic v2 request/response schemas with validation
│   ├── services/        # Business logic, pricing calculations, inventory & payment state machines
│   └── main.py          # FastAPI application entrypoint with CORS & exception handlers
├── migrations/          # Alembic database migrations
├── tests/               # 21 automated integration & unit tests
├── seed.py              # Idempotent database seeder (flights, hotels, buses, packages, users)
├── create_admin.py      # Admin creation & privilege promotion CLI
├── Dockerfile           # Multi-stage container image
└── requirements.txt     # Python dependencies
```

---

## 2. Prerequisites & Setup

- **Python 3.11+** (or Python 3.12 / 3.14)
- **PostgreSQL 15+** (Local or Managed on Supabase/Render/Neon)

### Local Virtual Environment

```bash
# 1. Create and activate virtual environment
python -m venv .venv

# Windows
.\.venv\Scripts\activate
# Linux / macOS
source .venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt
```

### Environment Configuration

Copy `.env.example` to `.env` in the repository root:

```ini
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/traveler_db
SECRET_KEY=your-secure-random-jwt-secret-key-at-least-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=["http://localhost:5173","http://localhost:5174","http://localhost:8081","*"]
ENVIRONMENT=development
PORT=8000
```

---

## 3. Database Migrations & Seeding

```bash
# Run database migrations to head
alembic upgrade head

# Run idempotent database seeder (safe to rerun at any time)
python -m backend.seed

# Create or promote an admin account via CLI
python -m backend.create_admin
```

### Pre-seeded Demo Accounts
- **Administrator:** `admin@ssjourney.com` / `Admin@123`
- **Customer:** `customer@ssjourney.com` / `Customer@123`

---

## 4. Running the Backend

### Development Mode (with hot-reload)
```bash
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger UI documentation is available at:
- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/redoc`

### Docker Compose Mode
To spin up both a fresh PostgreSQL 17 instance and the Backend service with a single command:
```bash
docker compose up -d --build
```

---

## 5. Running Automated Tests

A comprehensive test suite of 21 tests covers health, configuration, authentication, travel search & filtering, booking lifecycle, demo payments, and admin metrics:

```bash
pytest backend/tests -v
```

Expected output:
```
============================= 21 passed in 2.57s ==============================
```

---

## 6. API Reference

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/healthz` | GET | Public | Liveness probe |
| `/api/v1/health` | GET | Public | Detailed health check (PostgreSQL status & timestamp) |
| `/api/v1/auth/register` | POST | Public | Register customer account |
| `/api/v1/auth/login` | POST | Public | Authenticate user & issue JWT |
| `/api/v1/auth/me` | GET | Bearer | Get current user profile |
| `/api/v1/flights` | GET | Public | Search flights (from/to, date, cabin, price filter) |
| `/api/v1/flights/{id}` | GET | Public | Flight details |
| `/api/v1/hotels` | GET | Public | Search hotels (city, stars, price filter) |
| `/api/v1/hotels/{id}` | GET | Public | Hotel details & room types |
| `/api/v1/buses` | GET | Public | Search bus routes |
| `/api/v1/packages` | GET | Public | Search holiday packages |
| `/api/v1/bookings` | POST | Public/Bearer | Create booking with server-side price validation |
| `/api/v1/bookings/my-trips` | GET | Bearer | Customer's travel history & active bookings |
| `/api/v1/bookings/{id}` | GET | Bearer/Ref | Retrieve booking details |
| `/api/v1/bookings/{id}/cancel`| POST | Bearer | Cancel booking & release seats/rooms |
| `/api/v1/payments/demo` | POST | Public/Bearer | Process demo simulation payment |
| `/api/v1/admin/overview` | GET | Admin | Platform metrics: users, bookings, revenue, audit |
| `/api/v1/admin/bookings` | GET | Admin | Paginated admin booking list |
| `/api/v1/admin/audit-logs` | GET | Admin | System audit trail |

---

## 7. Render & Production Cloud Deployment

### Step 1: Create a PostgreSQL Database on Render
1. In your [Render Dashboard](https://dashboard.render.com/), click **New +** > **PostgreSQL**.
2. Name: `traveler-db`
3. Database: `traveler_db`
4. Region: Choose the region closest to your users (e.g., Singapore or Frankfurt).
5. Copy the **Internal Database URL** (or External if connecting remotely).
   - Change the URL scheme from `postgres://` to `postgresql+asyncpg://`.

### Step 2: Create a Web Service for Backend
1. Click **New +** > **Web Service**.
2. Connect your Git repository.
3. Configure the service:
   - **Environment:** `Docker` (or `Python 3`)
   - **Dockerfile Path:** `backend/Dockerfile`
   - **Docker Context Directory:** `.`
   - **Branch:** `main`
   - **Region:** Same region as PostgreSQL database.
4. Set Environment Variables in Render:
   - `DATABASE_URL`: `postgresql+asyncpg://<user>:<password>@<host>:5432/<database>`
   - `SECRET_KEY`: `<Generate a random 64-character secret>`
   - `ALGORITHM`: `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `1440`
   - `CORS_ORIGINS`: `["https://your-traveler-frontend.onrender.com","*"]`
   - `ENVIRONMENT`: `production`

### Step 3: Deployment Execution
The container automatically:
1. Runs `alembic upgrade head` to apply all schema migrations.
2. Runs `python -m backend.seed` to seed default demo inventory.
3. Starts Uvicorn with ASGI production workers on `$PORT`.

### Step 4: Verify Deployment
Run:
```bash
curl https://your-traveler-backend.onrender.com/healthz
curl https://your-traveler-backend.onrender.com/api/v1/health
```
Both endpoints should return `status: "healthy"` and `"database": "connected"`.
