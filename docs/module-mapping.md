# SyoloTrip Module Consolidation & File Mapping

This document provides a complete audit and mapping of every legacy file from `apps/web/` and `apps/admin/` to its new location in the consolidated `frontend/` and `backend/` applications.

---

## 1. Frontend Module Mapping

### A. Travel Module (`frontend/src/modules/travel/`)
| Legacy File (`apps/web/`) | Consolidated Location (`frontend/`) | Description |
|---|---|---|
| `src/pages/ExplorePage.tsx` | `src/modules/travel/pages/ExplorePage.tsx` | Landing experience with flight/hotel/train/bus/cab/package search bar |
| `src/pages/FlightSearchPage.tsx` | `src/modules/travel/pages/FlightSearchPage.tsx` | Live airline flight inventory search and filtering |
| `src/pages/HotelSearchPage.tsx` | `src/modules/travel/pages/HotelSearchPage.tsx` | Hotel and stay property search with room selection |
| `src/pages/TrainSearchPage.tsx` | `src/modules/travel/pages/TrainSearchPage.tsx` | Intercity train search and berth selection |
| `src/pages/BusSearchPage.tsx` | `src/modules/travel/pages/BusSearchPage.tsx` | Bus coaches and seat availability search |
| `src/pages/CabSearchPage.tsx` | `src/modules/travel/pages/CabSearchPage.tsx` | City and airport transfer cab booking |
| `src/pages/PackageSearchPage.tsx` | `src/modules/travel/pages/PackageSearchPage.tsx` | Holiday packages catalog, itinerary details |
| `src/pages/BookingCheckoutPage.tsx` | `src/modules/travel/pages/BookingCheckoutPage.tsx` | Unified checkout, promo codes, wallet deduction, Razorpay |
| `src/components/TravelCategoryIcons.tsx` | `src/modules/travel/components/TravelCategoryIcons.tsx` | Isometric SVG travel icons for 10 service verticals |
| `src/components/CalendarPickerModal.tsx` | `src/modules/travel/components/CalendarPickerModal.tsx` | Interactive single and date-range calendar picker |
| `src/components/MapLocationSearchModal.tsx` | `src/modules/travel/components/MapLocationSearchModal.tsx` | Interactive OpenStreetMap place autocomplete and reverse geocoding |
| `src/components/DisclosureBanner.tsx` | `src/modules/travel/components/DisclosureBanner.tsx` | Official booking and compliance disclosure banner |
| `src/components/AppDownloadBanner.tsx` | `src/modules/travel/components/AppDownloadBanner.tsx` | Mobile app download CTA banner |

---

### B. Customer Module (`frontend/src/modules/customer/`)
| Legacy File (`apps/web/`) | Consolidated Location (`frontend/`) | Description |
|---|---|---|
| `src/pages/CustomerDashboardPage.tsx` | `src/modules/customer/pages/CustomerDashboardPage.tsx` | Customer account portal: overview, trips, saved travellers, dual wallet |
| `src/pages/MyTripsPage.tsx` | `src/modules/customer/pages/MyTripsPage.tsx` | Standalone customer trips history and cancellation view |

---

### C. Business / myBiz Module (`frontend/src/modules/business/`)
| Legacy File (`apps/web/`) | Consolidated Location (`frontend/`) | Description |
|---|---|---|
| `src/pages/BusinessLandingPage.tsx` | `src/modules/business/pages/BusinessLandingPage.tsx` | Corporate travel overview and value proposition |
| `src/pages/BusinessRegistrationPage.tsx` | `src/modules/business/pages/BusinessRegistrationPage.tsx` | Corporate and agency self-service onboarding |
| `src/pages/BusinessLoginPage.tsx` | `src/modules/business/pages/BusinessLoginPage.tsx` | Dedicated corporate employee & admin sign-in |
| `src/pages/BusinessDashboardPage.tsx` | `src/modules/business/pages/BusinessDashboardPage.tsx` | Corporate portal wrapper component |
| `src/pages/MyBizLandingPage.tsx` | `src/modules/business/pages/MyBizLandingPage.tsx` | myBiz branded landing portal |
| `src/pages/MyBizDashboardPage.tsx` | `src/modules/business/pages/MyBizDashboardPage.tsx` | Full B2B portal: policies, approvals, employee roster, invoices |

---

### D. Partner / Vendor Module (`frontend/src/modules/partner/`)
| Legacy File (`apps/web/`) | Consolidated Location (`frontend/`) | Description |
|---|---|---|
| `src/pages/ListPropertyPage.tsx` | `src/modules/partner/pages/ListPropertyPage.tsx` | Vendor property listing onboarding page |
| `src/pages/VendorRegistrationPage.tsx` | `src/modules/partner/pages/VendorRegistrationPage.tsx` | Vendor sign-up and authentication |
| `src/pages/VendorKYCPage.tsx` | `src/modules/partner/pages/VendorKYCPage.tsx` | Vendor KYC document submission and verification tracking |
| `src/pages/VendorDashboardPage.tsx` | `src/modules/partner/pages/VendorDashboardPage.tsx` | Partner extranet: rooms, pricing, reservations, notifications |

---

### E. Admin Module (`frontend/src/modules/admin/`)
| Legacy File (`apps/admin/`) | Consolidated Location (`frontend/`) | Description |
|---|---|---|
| `src/pages/AdminLoginPage.tsx` | `src/modules/admin/pages/AdminLoginPage.tsx` | Administrator credential sign-in and bypass |
| `src/pages/DashboardOverview.tsx` | `src/modules/admin/pages/DashboardOverview.tsx` | Executive KPI analytics, revenue, booking distribution |
| `src/pages/BookingsManagement.tsx` | `src/modules/admin/pages/BookingsManagement.tsx` | Centralized booking search, filters, and status modification |
| `src/pages/UniversalServiceManagement.tsx` | `src/modules/admin/pages/UniversalServiceManagement.tsx` | Universal CRUD across 10 service verticals |
| `src/pages/MasterDataManagement.tsx` | `src/modules/admin/pages/MasterDataManagement.tsx` | Reference data management: airports, airlines, cities, bus stations |
| `src/pages/PricingManagement.tsx` | `src/modules/admin/pages/PricingManagement.tsx` | Dynamic markup rules engine, B2C vs B2B comparison, audit trail |
| `src/pages/CouponsManagement.tsx` | `src/modules/admin/pages/CouponsManagement.tsx` | Promotional discount vouchers and validity rules |
| `src/pages/WalletManagement.tsx` | `src/modules/admin/pages/WalletManagement.tsx` | Double-entry wallet ledger, customer accounts, freeze/adjust |
| `src/pages/CustomersManagement.tsx` | `src/modules/admin/pages/CustomersManagement.tsx` | Registered customer roster, status toggle, detail drawer |
| `src/pages/BusinessManagement.tsx` | `src/modules/admin/pages/BusinessManagement.tsx` | B2B companies review, verification, credit limits, employees |
| `src/pages/RolesManagement.tsx` | `src/modules/admin/pages/RolesManagement.tsx` | RBAC role definitions and granular permission assignment |
| `src/pages/UsersManagement.tsx` | `src/modules/admin/pages/UsersManagement.tsx` | System staff accounts and role assignment |
| `src/pages/ImportExportManagement.tsx` | `src/modules/admin/pages/ImportExportManagement.tsx` | Universal XLSX/CSV spreadsheet bulk import and export center |
| `src/pages/AuditLogsManagement.tsx` | `src/modules/admin/pages/AuditLogsManagement.tsx` | Immutable platform activity audit trail |
| `src/pages/PlatformSettings.tsx` | `src/modules/admin/pages/PlatformSettings.tsx` | Operational flags, environment status, and health monitor |

---

### F. Navigation & Shared Components
| Legacy File | Consolidated Location (`frontend/`) | Description |
|---|---|---|
| `apps/web/src/components/Header.tsx` | `src/components/navigation/Header.tsx` | Main application navigation bar with context-aware auth |
| `apps/web/src/components/Footer.tsx` | `src/components/navigation/Footer.tsx` | Universal footer with module shortcuts |
| `apps/admin/src/components/AdminHeader.tsx` | `src/components/navigation/AdminHeader.tsx` | Admin top header with theme switcher & health status |
| `apps/admin/src/components/AdminSidebar.tsx` | `src/components/navigation/AdminSidebar.tsx` | RBAC-filtered admin navigation sidebar |
| `apps/web/src/components/AuthModal.tsx` | `src/components/ui/AuthModal.tsx` | Global modal for customer login and registration |
| `apps/web/src/components/WishlistModal.tsx` | `src/components/ui/WishlistModal.tsx` | Global drawer for saved properties and packages |
| *New* | `src/components/ui/ForbiddenPage.tsx` | Professional 403 Forbidden Access screen |
| *New* | `src/components/ui/NotFoundPage.tsx` | Professional 404 Page Not Found screen |

---

## 2. Backend Consolidation Mapping

| Legacy File (`services/api/`) | Consolidated Location (`backend/`) | Notes |
|---|---|---|
| `src/routes/` | `app/api/` | Express route controllers organized by domain |
| `src/core/` | `app/core/` | Configuration, environment loading, JWT settings |
| `src/db/` | `app/database/` | Drizzle ORM schemas, migration runners, and pool |
| `src/middleware/auth.ts` | `app/middleware/auth.ts` | Bearer auth + permission injection |
| *New* | `app/permissions/rbac.ts` | Centralized RBAC permissions engine |
| `src/services/` | `app/services/` | Domain business logic services |
| `tests/` | `tests/` | Automated test suite (all tests passing) |
| Root `data/*.xlsx` | `data/` | Master reference Excel datasets |

