# SyoloTrip — Standalone Backend Service

A completely independent, production-grade RESTful API service for the SyoloTrip travel platform built with **Node.js**, **Express**, **TypeScript**, **PostgreSQL**, **Drizzle ORM**, and a centralized **Role-Based Access Control (RBAC)** security engine.

---

## 🏛️ Backend Architecture

- **`app/api/`**: Domain REST controllers (`auth`, `admin`, `travel`, `customer`, `wallet`, `business`, `vendor`, `pricing`, `coupons`)
- **`app/core/`**: Application configuration, environment loaders, and JWT settings
- **`app/database/`**: Relational schemas, Drizzle connection pool, and migrations
- **`app/middleware/`**: JWT Bearer authentication & `requirePermission()` RBAC guard
- **`app/permissions/`**: Centralized RBAC permission engine across all 11 user roles
- **`app/services/`**: Pricing engine, double-entry ledger, approval workflows
- **`data/`**: Cleaned reference datasets (`SS_Journey_Cleaned_Holiday_Packages.xlsx`)
- **`tests/`**: 86 automated native Node.js test suites

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **PostgreSQL**: Running on port `5432` with database `traveler_db`

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` matches your local or cloud PostgreSQL connection string:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/traveler_db
SECRET_KEY=your_secure_jwt_secret_key_here
PORT=8000
```

### 4. Build, Migrate & Seed
```bash
# Compile TypeScript
npm run build

# Seed admin accounts & ingest 480 holiday packages
npm run seed
```

### 5. Start the Server
```bash
# Development mode with hot-reload
npm run dev

# Or compiled production mode
npm run start
```
The API service will listen on **http://localhost:8000/**:
- Health check: `http://localhost:8000/health`
- API Base: `http://localhost:8000/api/v1`

---

## 🧪 Testing
Run the complete automated test suite (86 tests across all subsystems):
```bash
npm test
```

---

## 📚 Documentation
Detailed documentation is included in the [`docs/`](./docs) folder:
- [Architecture Guide](./docs/architecture.md)
- [Module Mapping](./docs/module-mapping.md)
- [Roles & Permissions (RBAC)](./docs/roles-permissions.md)
- [Setup Guide](./docs/setup-guide.md)

