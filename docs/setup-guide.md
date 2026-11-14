# SyoloTrip Setup & Developer Run Guide

## 1. Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Package Manager**: npm v9+
- **Database**: PostgreSQL 14+ running on `localhost:5432` with database `traveler_db`

---

## 2. Quick Start

### Step 1: Install Dependencies
From the repository root:
```bash
npm install
```
This automatically resolves and links the root workspaces (`frontend`, `backend`, `packages/*`).

### Step 2: Configure Environment Variables

**Backend (`backend/.env`):**
```bash
# Copy example file
cp backend/.env.example backend/.env
```
Default parameters in `backend/.env`:
```env
PORT=8000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/traveler_db
JWT_SECRET=development_jwt_secret_change_in_production_key_12345
ADMIN_EMAIL=admin@ssjourney.com
ADMIN_PASSWORD=ADMIN~321
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=/api/v1
```

### Step 3: Run Database Migrations & Seed Data
```bash
# Build backend TypeScript
npm --workspace=syolotrip-backend run build

# Seed administrative accounts and ingest reference data
npm --workspace=syolotrip-backend run seed
```

---

## 3. Running the Applications

### Standalone Backend Server (Port 8000)
```bash
# Development mode with hot-reload
npm --workspace=syolotrip-backend run dev

# Or production compiled mode
npm --workspace=syolotrip-backend run build
npm --workspace=syolotrip-backend run start
```
API endpoints will be live at:
- Base API: `http://localhost:8000/api/v1`
- Health check: `http://localhost:8000/health`
- OpenAPI Swagger Documentation: `http://localhost:8000/docs`

### Unified Frontend Application (Port 5173)
```bash
# Development server
npm --workspace=syolotrip-frontend run dev

# Production build and typecheck
npm --workspace=syolotrip-frontend run typecheck
npm --workspace=syolotrip-frontend run build
npm --workspace=syolotrip-frontend run preview
```
Application interface will be live at:
- Web Application: `http://localhost:5173/`
- Admin Console: `http://localhost:5173/admin`
- Partner Extranet: `http://localhost:5173/partner/dashboard`
- Corporate myBiz: `http://localhost:5173/business/dashboard`

---

## 4. Default Credentials & Test Accounts

| Portal | Email | Password | Role | Permissions |
|---|---|---|---|---|
| **Admin Console** | `admin@ssjourney.com` | `ADMIN~321` | `ADMIN` | Full Admin Operations |
| **Partner Extranet** | `vendor.demo@traveler.com` | `DemoPass123!` | `PARTNER` | `vendor:*` |
| **Corporate myBiz** | `biz.admin@traveler.com` | `DemoPass123!` | `BUSINESS_ADMIN` | `business:*` |
| **Retail Customer** | `customer.demo@traveler.com` | `DemoPass123!` | `CUSTOMER` | Public Booking & Dual Wallet |

> **Note on 1-Click Demo Login:** The platform provides 1-click demo login buttons directly on the login screens for quick testing across customer, partner, and administrative roles.

---

## 5. Verification & Automated Test Suites

To execute backend integration and unit test suites:
```bash
# Vendor onboarding test suite
node --test backend/tests/vendor_onboarding_system.test.mjs

# Dual wallet & ledger reconciliation test suite
node --test backend/tests/wallet_system.test.mjs

# Corporate myBiz test suite
node --test backend/tests/mybiz_business_system.test.mjs

# Run all backend tests
npm --workspace=syolotrip-backend test
```

To verify frontend build and type-safety:
```bash
npm --workspace=syolotrip-frontend run typecheck
npm --workspace=syolotrip-frontend run build
```

