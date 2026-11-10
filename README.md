# Syolo Travels (SS Journey Platform)

A professional, scalable full-stack travel booking & management platform — **Explore · Book · Travel · Manage** — built with clean monorepo architecture, strict modularity, and modern Node.js and TypeScript engineering.

---

## 🏛️ Monorepo Structure

```text
traveler/
├── apps/
│   ├── web/               # Customer Travel Portal & B2B myBiz Portal (Vite + React + TS + Tailwind)
│   ├── admin/             # Platform Admin & Operations Dashboard (Vite + React + TS + Tailwind)
│   ├── mobile/            # Syolo Trips Customer Mobile App (Expo + React Native + TS)
│   ├── partner/           # Syolo Travels Partner Extranet Mobile App (Expo + React Native + TS)
│   └── server/            # REST API Backend (Node.js + Express + TypeScript + PostgreSQL)
├── packages/
│   └── contracts/         # Shared TypeScript interfaces, types & API contracts
├── data/                  # Cleaned reference datasets (e.g. Holiday packages catalog)
├── docker-compose.yml     # Local PostgreSQL service
├── .env.example           # Environment configuration template
└── package.json           # Monorepo workspaces definition
```

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: >= 20.x (tested on v22.x)
- **npm**: >= 10.x
- **Docker**: For local PostgreSQL database (or an existing PostgreSQL instance)

### 2. Environment Setup
```bash
# Copy environment configuration
cp .env.example .env

# Start local PostgreSQL database container
docker compose up -d
```

### 3. Install Dependencies
```bash
# Install all workspace dependencies across the monorepo
npm install
```

### 4. Build Shared Contracts & Seed Database
```bash
# Build the shared contracts package
npm --workspace=@traveler/contracts run build

# Seed database with initial reference data & holiday packages
npm run backend:seed
```

### 5. Running Applications

| Application | Command | Default Port / URL |
|---|---|---|
| **Backend API Server** | `npm run dev:backend` | http://localhost:8000 |
| **Customer Web App** | `npm run dev:web` | http://localhost:5173 |
| **Admin Control Panel** | `npm run dev:admin` | http://localhost:5174 |
| **Customer Mobile App** | `npm run mobile:web` (or `npm run dev:mobile`) | http://localhost:8081 |
| **Partner Mobile App** | `npm run partner:web` (or `npm run dev:partner`) | http://localhost:8082 |

---

## 🧪 Testing & Verification

```bash
# Run backend test suite (Node.js native test runner)
npm --workspace=@traveler/server run test

# Typecheck all workspaces
npm run typecheck

# Production build for all workspaces
npm run build
```

---

## 🛡️ Phase 1 Disclosure
> **Simulated Travel Notice:** All travel inventory, quotes, flights, hotel rooms, and bookings created in Phase 1 are simulated operations. No actual airline tickets, hotel reservations, or real payment charges are processed.
