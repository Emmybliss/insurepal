# InsurePal Mobile App - Implementation Plan

## Phase 0: Current State Assessment

### ✅ Backend - Already Available
- **Sanctum**: Installed and working (`auth:sanctum` middleware)
- **Auth**: Session-based web auth (needs token-based extension for mobile)
- **API V1**: Existing endpoints at `/api/v1/*` with tenant scoping (`$request->tenant`)
- **Models**: All core models exist with `BelongsToTenant` trait
- **Permissions**: Spatie roles/permissions system active
- **Tenant Model**: Types: `super_admin`, `underwriter`, `broker`, `customer`

### ⚠️ Backend - Missing for Mobile
- Mobile-specific auth endpoints (token-based login/logout/me)
- Dashboard API for mobile
- Mobile API controllers for clients, policies, claims, notifications

### ✅ Mobile App - Already Available
- Expo SDK 54 + React 19 + expo-router
- React Navigation installed
- Basic folder structure with `app/(tabs)/`

### ⚠️ Mobile App - Missing
- All packages: axios, react-query, secure-store, form libs, UI components
- Auth flow and API client
- All screens (login, dashboard, clients, policies, claims, etc.)

---

## Phase 1: Backend - Create Mobile API Layer

### 1.1 Create Mobile Auth Endpoints
Create `app/Http/Controllers/Mobile/AuthController.php`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/mobile/auth/login` | POST | Token-based login |
| `/api/mobile/auth/logout` | POST | Invalidate token |
| `/api/mobile/auth/me` | GET | Current user + tenant + permissions |

**Login Response** should include:
```json
{
  "token": "sanctum_token",
  "user": { "id", "name", "email", "avatar_url", "roles": [] },
  "tenant": { "id", "name", "type", "logo" },
  "permissions": ["view_clients", "create_clients", ...],
  "subscription": { "plan", "status", "expires_at" },
  "unread_notifications_count": 3
}
```

### 1.2 Add Mobile API Routes
Add to `routes/api.php`:

```php
Route::prefix('mobile')->group(function () {
    // Auth (public)
    Route::post('/auth/login', [Mobile\AuthController::class, 'login']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [Mobile\AuthController::class, 'logout']);
        Route::get('/auth/me', [Mobile\AuthController::class, 'me']);

        // Dashboard
        Route::get('/dashboard', [Mobile\DashboardController::class, 'index']);

        // Clients
        Route::apiResource('/clients', Mobile\ClientController::class);

        // Policies
        Route::get('/policies', [Mobile\PolicyController::class, 'index']);
        Route::get('/policies/{id}', [Mobile\PolicyController::class, 'show']);

        // Claims
        Route::apiResource('/claims', Mobile\ClaimController::class);

        // Quotes (read-only for MVP)
        Route::get('/quotes', [Mobile\QuoteController::class, 'index']);

        // Notifications
        Route::get('/notifications', [Mobile\NotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [Mobile\NotificationController::class, 'markRead']);
        Route::post('/notifications/read-all', [Mobile\NotificationController::class, 'markAllRead']);
    });
});
```

### 1.3 Create Mobile Controllers
Create in `app/Http/Controllers/Mobile/`:
- `AuthController.php` - Token-based auth
- `DashboardController.php` - Mobile dashboard stats
- `ClientController.php` - CRUD with pagination, search, filters
- `PolicyController.php` - List/show with renewal status
- `ClaimController.php` - List, show, create
- `QuoteController.php` - Read-only list
- `NotificationController.php` - List, mark read

### 1.4 API Response Format
Use consistent response:
```json
{
  "success": true,
  "message": "Data fetched",
  "data": {},
  "meta": { "current_page": 1, "total": 50 }
}
```

---

## Phase 2: Mobile App - Install Dependencies

### 2.1 Install Required Packages
In `insurepal_mobile/`:
```bash
npx expo install nativewind react-native-safe-area-context react-native-screens
npx expo install expo-secure-store expo-constants
npm install axios @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
npm install lucide-react-native
npx expo install expo-document-picker expo-image-picker expo-file-system
```

### 2.2 Setup NativeWind
- Add to `tailwind.config.js` (create if not exists)
- Configure in `app/_layout.tsx`

---

## Phase 3: Mobile App - Create App Structure

### 3.1 Project Structure
```
insurepal_mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── forgot-password.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx (Home)
│   │   ├── clients.tsx
│   │   ├── policies.tsx
│   │   ├── claims.tsx
│   │   └── more.tsx
│   ├── clients/
│   │   └── [id].tsx
│   ├── policies/
│   │   └── [id].tsx
│   ├── claims/
│   │   ├── [id].tsx
│   │   └── create.tsx
│   ├── notifications/
│   │   └── index.tsx
│   └── profile/
│       └── index.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── TextInput.tsx
│   │   ├── Card.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingState.tsx
│   ├── layout/
│   │   ├── AppScreen.tsx
│   │   └── AppHeader.tsx
│   └── forms/
├── services/
│   ├── api.ts (axios instance)
│   ├── auth.ts (login, logout, me)
│   └── storage.ts (secure-store)
├── hooks/
│   ├── useAuth.ts
│   ├── useCurrentUser.ts
│   └── usePermissions.ts
├── types/
│   ├── auth.ts
│   ├── client.ts
│   ├── policy.ts
│   └── claim.ts
└── constants/
    ├── colors.ts
    └── config.ts (API URL)
```

---

## Phase 4: Mobile App - Core Features

### 4.1 Authentication
- **Login Screen**: Email + password form with validation
- **Token Storage**: Store in `expo-secure-store`
- **Session Restore**: Check token on app launch, validate with `/me`
- **Logout**: Clear token, redirect to login
- **401 Handler**: Auto-logout on token expiry

### 4.2 Dashboard (Home Tab)
- Greeting with user name
- Tenant/company name badge
- Stats cards: Active policies, Pending claims, Expiring soon, Outstanding notes
- Quick actions grid: Add client, Create quote, Report claim, Search
- Recent notifications list
- Pull-to-refresh

### 4.3 Clients Tab
- Search bar (name, email, phone, company)
- Filter chips: All, Individual, Corporate
- Client list with pagination
- Client detail: Contact info, policies, claims
- Add client form (if permission allows)

### 4.4 Policies Tab
- Search by policy number, insured name, product
- Filter: All, Active, Expired, Pending
- Policy list with status badges
- Policy detail: Full info, renewal status, documents
- Expiry warning indicators

### 4.5 Claims Tab
- Search and filter by status
- Claim list
- Claim detail with timeline
- Create claim: Select policy, incident date, description, amount, upload docs

### 4.6 More Tab
- Profile (name, email, role, tenant, subscription)
- Notifications (unread count badge)
- Quotes (read-only for MVP)
- Support Tickets (link to web or basic view)
- Settings (theme, notifications preferences)
- Logout

---

## Phase 5: UI Components & Forms

### 5.1 Reusable Components
- `Button` - variants: primary, secondary, outline, danger
- `TextInput` - with label, error, secure option
- `Card` - with shadow, rounded corners
- `StatCard` - for dashboard stats
- `QuickActionCard` - for dashboard actions
- `StatusBadge` - for policy/claim status
- `EmptyState` - with icon, title, description
- `LoadingState` - skeleton or spinner
- `ErrorState` - with retry button

### 5.2 Forms
Use `react-hook-form` + `zod`:
- Login form schema
- Client create/edit schema
- Claim create schema
- Password reset schema

---

## Phase 6: Environment Configuration

### 6.1 Mobile App
Create `insurepal_mobile/app.json` or use environment:
```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000/api/mobile
```

For production:
```
EXPO_PUBLIC_API_URL=https://insurepal.app/api/mobile
```

### 6.2 Backend CORS
Ensure `config/cors.php` allows mobile app origins (for Expo)

---

## Testing Checklist

| Feature | Test |
|---------|------|
| Login | Valid/invalid credentials, token stored |
| Session restore | App restart, valid token |
| Logout | Token cleared |
| Dashboard | Stats load, tenant-scoped |
| Clients list | Search, filter, pagination |
| Client detail | All info loads |
| Policies list | Search, filter, status |
| Claims list | Filter by status |
| Create claim | Form validation, submission |
| Notifications | List, mark read |
| 401 handling | Redirect to login |
| Permission hiding | UI elements hidden based on permissions |

---

## Summary of Files to Create

### Backend (Laravel)
1. `app/Http/Controllers/Mobile/AuthController.php`
2. `app/Http/Controllers/Mobile/DashboardController.php`
3. `app/Http/Controllers/Mobile/ClientController.php`
4. `app/Http/Controllers/Mobile/PolicyController.php`
5. `app/Http/Controllers/Mobile/ClaimController.php`
6. `app/Http/Controllers/Mobile/QuoteController.php`
7. `app/Http/Controllers/Mobile/NotificationController.php`
8. `app/Http/Resources/Mobile/` - API Resources
9. `routes/api.php` - Add mobile routes

### Mobile (React Native/Expo)
1. Install all packages
2. Create services: api.ts, auth.ts, storage.ts
3. Create hooks: useAuth, usePermissions
4. Create types
5. Create UI components
6. Create all screens (login, home, tabs, detail views)
7. Configure navigation
8. Add environment config