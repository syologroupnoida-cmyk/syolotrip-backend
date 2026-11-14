# SyoloTrip Unified System Architecture

## 1. High-Level System Architecture

SyoloTrip is structured into two completely independent, decoupled, and production-ready applications:
1. **Unified Frontend Application (`frontend/`)**: Single-page application built on React 18, Vite, React Router v6, Tailwind CSS, TanStack Query, and Zustand. All end-user travel discovery, customer portal, B2B corporate (myBiz), partner extranet, and administrative control centers run within this single shell.
2. **Standalone Independent Backend (`backend/`)**: High-performance RESTful API service built on Node.js, Express, TypeScript, PostgreSQL (via Drizzle ORM), JWT authentication, and a centralized Role-Based Access Control (RBAC) engine.

```mermaid
graph TD
    Client[Browser / Client Device] -->|Single Entry Point :5173| Frontend[Unified Frontend - frontend/]

    subgraph "Unified Frontend Application"
        Router[React Router v6 Router Engine]
        AuthProvider[Unified AuthProvider & RBAC Store]
        ApiClient[Consolidated Axios API Client]
        MainLayout[Main Shell Layout - Customer/Travel/B2B/Vendor]
        AdminLayout[Admin Shell Layout - Control Console]

        Router --> MainLayout
        Router --> AdminLayout

        MainLayout --> TravelModule[modules/travel]
        MainLayout --> CustomerModule[modules/customer]
        MainLayout --> BusinessModule[modules/business]
        MainLayout --> PartnerModule[modules/partner]

        AdminLayout --> AdminModule[modules/admin]
    end

    Frontend -->|REST APIs :8000/api/v1| StandaloneBackend[Independent Backend - backend/]

    subgraph "Standalone Backend API"
        AuthMiddleware[JWT Auth & RBAC Middleware]
        RBACEngine[Centralized Permissions Engine]
        APIControllers[Express v1 API Routes]
        Services[Business Logic & Service Layer]
        DatabaseORM[Drizzle ORM & Query Builder]

        AuthMiddleware --> RBACEngine
        APIControllers --> AuthMiddleware
        APIControllers --> Services
        Services --> DatabaseORM
    end

    StandaloneBackend -->|TCP 5432| Postgres[(PostgreSQL Database traveler_db)]
```

---

## 2. Unified Frontend Architecture (`frontend/`)

The unified frontend eliminates fragmented applications by providing:
- **One Package & Entry Point**: Single `package.json`, single Vite configuration (`vite.config.ts`), and single entry script (`src/main.tsx`).
- **Unified Application Providers**: `AppProviders` encapsulates:
  - `QueryClientProvider` (TanStack Query for server cache and data fetching)
  - `ThemeProvider` (Persistent dark / light theme management)
  - `AuthProvider` (Single source of truth for session tokens, roles, and granular permissions)
  - `CurrencyProvider` (Multi-currency live exchange rates: INR, USD, EUR, GBP, AED, SGD)
  - `WishlistProvider` (Synchronized wishlist and saved experiences)
- **Centralized Routing & Protected Routes**: React Router v6 with declarative `ProtectedRoute` guards checking both role membership and granular permission requirements before rendering child modules.
- **Adaptive Application Layouts**:
  - `MainLayout`: Customer header with dynamic context-aware auth actions, currency picker, cart/wishlist modals, and unified footer.
  - `AdminLayout`: Professional admin sidebar, theme switcher, environment status, and breadcrumbs.

### Frontend Directory Structure
```
frontend/
├── public/                 # Static branding emblems, logos, and hero imagery
├── src/
│   ├── app/
│   │   ├── layouts/        # MainLayout and AdminLayout shells
│   │   ├── providers/      # AppProviders and AuthProvider
│   │   └── router/         # React Router v6 router & ProtectedRoute
│   ├── modules/
│   │   ├── travel/         # Flights, Hotels, Trains, Buses, Cabs, Packages, Checkout
│   │   ├── customer/       # Dashboard, My Trips, Saved Travellers, Dual Wallet
│   │   ├── business/       # myBiz Corporate Portal, Employee Travel, Invoices
│   │   ├── partner/        # Extranet, Property Listing, KYC Onboarding
│   │   └── admin/          # 10 Services, Inventory, Pricing, Coupons, Users, Roles
│   ├── components/
│   │   ├── navigation/     # Header, Footer, AdminHeader, AdminSidebar
│   │   └── ui/             # AuthModal, WishlistModal, ForbiddenPage, NotFoundPage
│   ├── contexts/           # ThemeContext, CurrencyContext, WishlistContext
│   ├── hooks/              # useAuth, useRBAC, useTheme, useCurrency, useWishlist
│   ├── services/           # Consolidated api.ts client with Bearer interceptors
│   ├── utils/              # routeContext.ts path normalizers and matchers
│   ├── App.tsx             # Root component wrapping AppProviders & Router
│   ├── main.tsx            # DOM mount point
│   └── index.css           # Consolidated Tailwind layers and custom styling
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Standalone Backend Architecture (`backend/`)

The backend is fully self-contained and operates independently of any specific frontend deployment:
- **Modular Route Structure (`app/api/`)**: Domain controllers for auth, travel searches, customer profiles, wallet operations, partner onboarding, myBiz corporate travel, and admin management.
- **Centralized Security Layer (`app/permissions/rbac.ts`)**: Pure TypeScript permission matrix associating platform roles with granular action permissions.
- **Database & Migration Layer (`app/database/`)**: Drizzle ORM schema defining relational tables for users, bookings, inventory, dual wallets, partners, and corporate accounts.
- **Master Workbook Reference Ingestion (`app/database/ingestReferenceData.ts`)**: Automated ingestion of holiday packages from clean Excel workbooks (`data/SS_Journey_Cleaned_Holiday_Packages.xlsx`).

### Backend Directory Structure
```
backend/
├── app/
│   ├── api/                # Express route controllers (/auth, /admin, /wallet, etc.)
│   ├── core/               # Environment config, JWT secrets, and port bindings
│   ├── database/           # Drizzle ORM schema, connection pool, migrations
│   ├── middleware/         # Auth verification and permission enforcement
│   ├── permissions/        # Centralized RBAC definition matrix
│   ├── services/           # Business logic and domain services
│   ├── contracts/          # Self-contained shared TypeScript interfaces
│   ├── index.ts            # Express server initialization
│   └── seed.ts             # Database seeder and administrator bootstrap
├── data/                   # Master reference datasets (Excel workbooks)
├── tests/                  # Node.js native test suites
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 4. End-to-End Authentication & Authorization Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Admin
    participant FE as Frontend (AuthProvider)
    participant API as Standalone Backend (/api/v1)
    participant RBAC as Backend RBAC Engine
    participant DB as PostgreSQL Database

    User->>FE: Enter Credentials / Click Login
    FE->>API: POST /auth/login { email, password }
    API->>DB: Query user by email & hash compare
    DB-->>API: User record (id, role, isActive)
    API->>RBAC: Resolve permissions for role
    RBAC-->>API: List of granted permission strings
    API-->>FE: Return AuthResponse { user: { role, permissions }, tokens: { accessToken } }
    FE->>FE: Store token in localStorage & update AuthState
    FE->>FE: Evaluate Route Guard for target path

    alt Authorized
        FE->>User: Render module view with authorized actions
        User->>FE: Trigger API action (e.g. Update Inventory)
        FE->>API: PATCH /admin/services/flights/:id (Header: Bearer Token)
        API->>RBAC: Verify req.user.role & requirePermission('inventory:update')
        RBAC-->>API: Granted
        API->>DB: Execute query
        API-->>FE: 200 OK Response
    else Unauthorized
        FE->>User: Display 403 Forbidden Page / hide restricted nav items
    end
```

