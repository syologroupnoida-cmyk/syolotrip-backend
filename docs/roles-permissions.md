# SyoloTrip Role-Based Access Control (RBAC) Specification

## 1. Overview & Security Philosophy

SyoloTrip enforces strict, multi-tiered authorization:
1. **Frontend Defensive Guards**: The frontend UI inspects the user's role and granted permissions to dynamically render navigation items, action buttons, and protect URL routes using `<ProtectedRoute />`. Unauthorized direct URL navigation renders a `403 Forbidden` screen.
2. **Backend Authoritative Enforcement**: The backend independently validates every incoming HTTP request. Client-supplied roles and permissions in requests are strictly ignored; permissions are resolved directly from the authenticated user token and verified through `requirePermission(...)` middleware.
3. **Super Admin Global Bypass**: The `SUPER_ADMIN` role inherently possesses wildcard (`*`) authorization across all domains.

---

## 2. Platform User Roles

SyoloTrip defines 11 distinct user roles categorized across four operational tiers:

### Tier 1: Platform Governance & Management
| Role Key | Name | Primary Responsibility |
|---|---|---|
| `SUPER_ADMIN` | Super Administrator | Complete root access to all system features, configuration, and security settings. |
| `ADMIN` | System Administrator | Full operational management across bookings, services, commercials, and user accounts. |
| `OPERATIONS_ADMIN` | Operations Administrator | Day-to-day order execution, booking status changes, and customer support interventions. |

### Tier 2: Specialized Administrative Roles
| Role Key | Name | Primary Responsibility |
|---|---|---|
| `INVENTORY_MANAGER` | Inventory Manager | Managing suppliers, inventory catalogs, services, and reference data. |
| `FINANCE_ADMIN` | Finance & Commercials Admin | Dynamic pricing rules, markups, coupons, dual wallet ledger, and payment reconciliation. |
| `SUPPORT_ADMIN` | Support Specialist | Read-only inspection of customer accounts, bookings, and audit trails. |

### Tier 3: Business & Supplier Portals
| Role Key | Name | Primary Responsibility |
|---|---|---|
| `PARTNER` | Extranet Partner / Vendor | Management of listed properties, rooms, daily rates, and guest reservations. |
| `BUSINESS_ADMIN` | Corporate Client Admin | Organization management, corporate travel policy rules, employee invites, and invoice approvals. |
| `AGENCY_ADMIN` | Travel Agency Administrator | Multi-traveller corporate bookings, sub-agent accounts, and credit limits. |
| `EMPLOYEE` | Corporate Employee | Submitting travel requests within company policy guidelines. |

### Tier 4: Direct Consumers
| Role Key | Name | Primary Responsibility |
|---|---|---|
| `CUSTOMER` | Retail Traveller / Consumer | Booking public travel services, dual wallet balances, and trip management. |

---

## 3. Comprehensive RBAC Permissions Matrix

| Permission Key | Domain | Super Admin | Admin | Operations Admin | Inventory Mgr | Finance Admin | Support Admin | Partner | Business Admin | Customer |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `*` (Wildcard) | Global | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `dashboard:read` | Analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `booking:read` | Orders | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `booking:create` | Orders | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `booking:update` | Orders | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `booking:cancel` | Orders | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `inventory:read` | Services | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `inventory:create` | Services | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `inventory:update` | Services | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `inventory:delete` | Services | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `master_data:read`| Master Tables | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `master_data:write`| Master Tables | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `pricing:read` | Pricing Engine | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `pricing:write` | Pricing Engine | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `coupon:read` | Offers | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `coupon:write` | Offers | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `wallet:read` | Dual Wallet | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `wallet:adjust` | Dual Wallet | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `wallet:freeze` | Dual Wallet | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `user:read` | Users | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `user:update` | Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `role:manage` | RBAC | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `business:read` | B2B / myBiz | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `business:verify` | B2B / myBiz | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `business:manage` | B2B / myBiz | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `vendor:read` | Extranet | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `vendor:manage` | Extranet | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `import:read` | Data I/O | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `import:execute` | Data I/O | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `audit:read` | Trail | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `settings:read` | Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `settings:manage`| Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Code Implementation References

### Backend Enforcement
File: `backend/app/middleware/auth.ts`
```typescript
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }
    const hasPerm = hasUserPermission(req.user.role, permission);
    if (!hasPerm) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Missing required permission '${permission}'`,
      });
    }
    return next();
  };
};
```

### Frontend Guard
File: `frontend/src/app/router/ProtectedRoute.tsx`
```typescript
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermissions,
}) => {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <ForbiddenPage title="Role Restriction" requiredRole={allowedRoles.join(' or ')} />;
  }

  if (requiredPermissions && !requiredPermissions.every((p) => hasPermission(p))) {
    return <ForbiddenPage title="Permission Denied" />;
  }

  return <>{children}</>;
};
```

