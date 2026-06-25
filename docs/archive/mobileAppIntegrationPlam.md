You are a senior full-stack mobile engineer and UI/UX product designer.

I have an existing InsurePal SaaS web/PWA project. Inside the parent project folder, there is a new React Native mobile app folder named:

insurepal_mobile

The mobile app is already installed with:

- React Native
- Expo SDK 54
- Default Expo template
- NativeWind
- TypeScript

Your job is to plan the UI/UX and build the full-stack mobile app integration for InsurePal Mobile.

Important:

- Do not destroy or rewrite the existing parent web/PWA project.
- Work only inside the `insurepal_mobile` folder unless backend/API changes are required.
- If backend/API changes are required, inspect the Laravel/Inertia backend first, then create clean API routes/controllers/resources without breaking existing web functionality.
- Follow the current InsurePal architecture, naming patterns, auth system, tenant model, roles, and permissions.
- Build production-grade code, not demo code.
- Use TypeScript strictly.
- Use NativeWind for styling.
- Use Expo-compatible libraries only.
- Keep the design clean, modern, professional, and suitable for an insurance SaaS product.

PROJECT CONTEXT

InsurePal is a multi-tenant insurance management SaaS.

Core tenant types:

1. Super Admin / Mindintel app owner
2. Insurance Underwriters
3. Insurance Brokers
4. Customers of subscribers

Important business rules:

- Underwriters and Brokers are subscribers/tenants.
- Customers belong to subscribers.
- Underwriters should not directly create brokers to avoid bypassing subscription.
- Business relationships between subscribers should happen via request/accept workflow.
- Users should only see tenant-scoped data they are allowed to access.
- Mobile app should focus on practical field usage, quick access, notifications, client/policy lookup, and customer self-service later.

Main existing modules in the web app include:

- Authentication
- Dashboard
- Customers / Clients
- Quotes
- Policies
- Policy Products
- Debit Notes
- Credit Notes
- Claims
- Renewals
- NAICOM Reports
- Notifications
- Support Tickets
- Inbox / Chat / Communications
- Document management
- Billing / Subscription
- Settings
- Role and permission management

OBJECTIVE

Build a complete mobile app foundation for InsurePal Mobile with:

1. A well-planned UI/UX structure
2. Navigation architecture
3. Authentication flow
4. API integration layer
5. Tenant-aware dashboard
6. Core mobile screens
7. Reusable UI components
8. Secure storage
9. Error/loading/empty states
10. Backend Laravel API support where missing

PHASE 1 — INSPECT EXISTING PROJECT

First inspect the project structure.

Check:

- Parent Laravel project structure
- Existing auth implementation
- Existing user, tenant, subscriber, customer, policy, quote, claim, notification models
- Existing routes
- Existing controllers
- Existing middleware
- Existing permissions/roles
- Existing Inertia shared props
- Existing API routes, if any
- Existing Sanctum or token auth configuration
- Existing CORS configuration
- Existing notification implementation
- Existing file/document storage patterns

Then produce a concise implementation plan before coding.

Do not assume. Inspect before modifying.

PHASE 2 — MOBILE UI/UX PLAN

Design the mobile app around the following product experience:

Primary mobile users:

- Broker staff
- Underwriter staff
- Tenant admins
- Field marketers/agents
- Customers later

Main UX principle:
The mobile app should not simply copy the web dashboard. It should focus on speed, field operations, alerts, and quick lookup.

Create this navigation structure:

1. Auth Stack

- Welcome screen
- Login screen
- Forgot password screen
- Optional register/trial request screen if supported by backend

2. Main App Tabs

- Home
- Clients
- Policies
- Claims
- More

3. Home screen
   Show:

- Greeting with user name
- Tenant/company name
- Quick stats cards:
    - Active policies
    - Pending claims
    - Expiring soon
    - Outstanding notes
- Quick actions:
    - Add client
    - Create quote
    - Report claim
    - Search policy
- Recent notifications
- Recent activities if backend supports it

4. Clients screen
   Show:

- Search clients
- Filter by individual/corporate
- Client list
- Client detail screen
- Add/edit client form where allowed by permission

5. Policies screen
   Show:

- Search policies
- Filter by status
- Policy list
- Policy detail screen
- Renewal status
- Download/view document if available

6. Claims screen
   Show:

- Claim list
- Claim detail
- Create/report claim
- Claim status timeline if backend supports it
- Upload claim documents if backend supports it

7. More screen
   Show:

- Profile
- Notifications
- Quotes
- Debit Notes
- Credit Notes
- Support Tickets
- Settings
- Logout

8. Notifications screen
   Show:

- All notifications
- Unread filter
- Mark as read
- Notification detail/action where possible

9. Profile screen
   Show:

- User name
- Email
- Role
- Tenant/company
- Subscription/plan summary if available

Design style:

- Professional SaaS look
- Clean white/light background
- Dark text
- Subtle blue/indigo primary color
- Rounded cards
- Clear icons
- Large touch targets
- Mobile-first spacing
- Polished empty states
- Avoid clutter
- Use dashboard cards and quick action grids
- Keep all forms simple and readable

PHASE 3 — INSTALL/VERIFY MOBILE DEPENDENCIES

Inside `insurepal_mobile`, verify or install the needed Expo-compatible packages:

Required:

- expo-router or React Navigation

Preferred option:
Use `expo-router` if the project is already compatible with it. Otherwise use React Navigation.

Install/use:

- nativewind
- react-native-safe-area-context
- react-native-screens
- expo-secure-store
- expo-constants
- axios
- @tanstack/react-query
- react-hook-form
- zod
- @hookform/resolvers
- lucide-react-native
- expo-document-picker
- expo-image-picker
- expo-file-system
- expo-notifications where needed later

Before installing, inspect package.json and avoid duplicate/conflicting packages.

PHASE 4 — APP STRUCTURE

Create a clean mobile folder structure similar to:

insurepal_mobile/
app/ or src/
screens/
auth/
dashboard/
clients/
policies/
claims/
notifications/
profile/
more/
components/
ui/
forms/
cards/
layout/
services/
api.ts
auth.ts
storage.ts
queryClient.ts
hooks/
useAuth.ts
useCurrentUser.ts
usePermissions.ts
navigation/
types/
auth.ts
client.ts
policy.ts
claim.ts
notification.ts
api.ts
constants/
colors.ts
routes.ts
utils/
formatters.ts
validators.ts

If using expo-router, follow Expo Router conventions:

- app/\_layout.tsx
- app/index.tsx
- app/(auth)/login.tsx
- app/(auth)/forgot-password.tsx
- app/(tabs)/\_layout.tsx
- app/(tabs)/home.tsx
- app/(tabs)/clients.tsx
- app/(tabs)/policies.tsx
- app/(tabs)/claims.tsx
- app/(tabs)/more.tsx
- app/clients/[id].tsx
- app/policies/[id].tsx
- app/claims/[id].tsx
- app/notifications/index.tsx
- app/profile/index.tsx

PHASE 5 — AUTHENTICATION

Implement secure auth using Laravel API.

Preferred backend auth:

- Laravel Sanctum token-based API auth for mobile
- Do not use browser session auth for mobile
- Mobile login should receive a token and user payload
- Store token securely using Expo SecureStore
- Attach token to all API requests using Axios interceptor
- Handle 401 by logging user out and redirecting to login

Required mobile auth features:

- Login with email and password
- Secure token storage
- Restore session on app launch
- Logout
- Current user endpoint
- Loading state while checking stored token
- Error handling for invalid credentials
- Support tenant/user role data in auth response

Expected API endpoints if missing:

- POST /api/mobile/auth/login
- POST /api/mobile/auth/logout
- GET /api/mobile/auth/me

The `/me` response should include:

- user id
- name
- email
- roles
- permissions
- tenant/subscriber/company data
- subscription summary if available
- unread notification count if available

PHASE 6 — BACKEND API DESIGN

If the Laravel backend does not already have proper mobile APIs, create a clean mobile API layer.

Use routes like:

Route::prefix('mobile')->middleware(['auth:sanctum'])->group(function () {
Route::get('/me', ...);

    Route::get('/dashboard', ...);

    Route::apiResource('/clients', MobileClientController::class);
    Route::apiResource('/policies', MobilePolicyController::class)->only(['index', 'show']);
    Route::apiResource('/quotes', MobileQuoteController::class)->only(['index', 'show', 'store']);
    Route::apiResource('/claims', MobileClaimController::class);
    Route::get('/notifications', ...);
    Route::post('/notifications/{id}/read', ...);
    Route::post('/notifications/read-all', ...);

});

Important backend requirements:

- Respect tenant scoping.
- Respect roles and permissions.
- Do not expose cross-tenant data.
- Use API Resources for clean JSON.
- Use Form Requests for validation.
- Use pagination for list endpoints.
- Use search/filter query params.
- Return consistent response format.
- Never expose sensitive internal fields.
- Keep API separate from Inertia web controllers where practical.

Use response format like:

{
"success": true,
"message": "Fetched successfully",
"data": {},
"meta": {}
}

For validation errors, return standard Laravel validation JSON.

PHASE 7 — DASHBOARD API

Create or connect:

GET /api/mobile/dashboard

Return:

- active_policies_count
- pending_claims_count
- expiring_soon_count
- outstanding_notes_count
- recent_notifications
- recent_clients
- recent_policies
- quick_links/permissions if useful

Ensure values are scoped to the logged-in user’s tenant and permissions.

PHASE 8 — CLIENTS MODULE

Mobile screens:

- Clients list
- Client details
- Add client
- Edit client if allowed

List features:

- Search by name, email, phone, company name
- Filter by type: individual/corporate
- Pull to refresh
- Pagination/infinite scroll
- Empty state

Client detail:

- Basic info
- Contact info
- Customer type
- Policies linked to client
- Claims linked to client if available
- Notes/documents if available

Backend:

- GET /api/mobile/clients
- POST /api/mobile/clients
- GET /api/mobile/clients/{id}
- PUT/PATCH /api/mobile/clients/{id}
- DELETE /api/mobile/clients/{id} only if permission allows

PHASE 9 — POLICIES MODULE

Mobile screens:

- Policy list
- Policy detail

List features:

- Search by policy number, insured name, product, status
- Filter by status
- Show expiry/renewal warning
- Pull to refresh
- Pagination

Policy detail:

- Policy number
- Customer/insured
- Product/class
- Start date
- End date
- Premium
- Status
- Renewal status
- Related debit/credit notes
- Download/view document if backend supports file URLs

Backend:

- GET /api/mobile/policies
- GET /api/mobile/policies/{id}

PHASE 10 — CLAIMS MODULE

Mobile screens:

- Claims list
- Claim detail
- Report/create claim

List features:

- Search
- Filter by status
- Pull to refresh
- Pagination

Create claim:

- Select policy
- Incident date
- Claim description
- Claim amount if applicable
- Upload supporting document/image if backend supports
- Submit claim

Backend:

- GET /api/mobile/claims
- POST /api/mobile/claims
- GET /api/mobile/claims/{id}
- PUT/PATCH /api/mobile/claims/{id} where allowed

PHASE 11 — NOTIFICATIONS

Mobile:

- Show unread count badge
- List notifications
- Mark single notification as read
- Mark all as read

Backend:

- GET /api/mobile/notifications
- POST /api/mobile/notifications/{id}/read
- POST /api/mobile/notifications/read-all

Later-ready:

- Expo push notifications
- Laravel Reverb realtime integration can come after MVP
- Do not force realtime in the first version unless already working

PHASE 12 — API CLIENT

Create a strong API service layer:

- axios instance
- base URL from environment config
- auth token interceptor
- 401 handler
- typed response helpers
- error normalization
- pagination helpers

Use environment config:

- EXPO_PUBLIC_API_URL

Example:
EXPO_PUBLIC_API_URL=https://insurepal.app/api/mobile

For local testing:
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000/api/mobile

Do not hard-code localhost because mobile devices/emulators may not resolve it correctly.

PHASE 13 — STATE MANAGEMENT

Use:

- React Query for server state
- Context or lightweight auth provider for auth session
- SecureStore for token
- Local component state for forms

Avoid overengineering with Redux unless already installed and necessary.

PHASE 14 — UI COMPONENTS

Create reusable components:

- AppScreen
- AppHeader
- StatCard
- QuickActionCard
- EmptyState
- LoadingState
- ErrorState
- SearchInput
- FilterChip
- Button
- TextInput
- SelectInput where needed
- FormErrorText
- ListItemCard
- StatusBadge
- NotificationItem
- AvatarInitials

All components should support:

- Loading states
- Disabled states
- Good spacing
- Dark text readability
- Consistent border radius
- Consistent typography

PHASE 15 — FORMS AND VALIDATION

Use:

- react-hook-form
- zod

Create schemas for:

- login
- client create/edit
- claim create
- quote create if implemented

Display validation errors clearly.

PHASE 16 — PERMISSIONS

Create a `usePermissions()` hook.

The mobile UI must hide or disable actions the user does not have permission for.

Examples:

- Hide “Add Client” if user cannot create clients.
- Hide “Edit Client” if user cannot update clients.
- Hide delete actions unless permission exists.
- Hide financial notes if user cannot view them.

Still enforce permissions on backend. Frontend hiding is only for UX.

PHASE 17 — SECURITY

Apply these rules:

- Store auth token only in SecureStore.
- Do not log tokens.
- Do not expose sensitive tenant data.
- Enforce tenant scoping in backend queries.
- Add rate limiting to mobile login endpoint.
- Use Laravel validation.
- Use API Resources to prevent leaking fields.
- Protect file download URLs.
- Validate upload mime types and size.
- Handle expired tokens gracefully.

PHASE 18 — ERROR, EMPTY, AND LOADING STATES

Every screen must have:

- Loading state
- Error state with retry
- Empty state
- Pull-to-refresh where appropriate

Examples:

- No clients yet
- No policies found
- No claims submitted
- No notifications

PHASE 19 — DELIVERABLES

After implementation, provide:

1. UI/UX plan summary
2. Mobile navigation map
3. Files created/modified
4. Backend files created/modified
5. Environment variables required
6. Commands to run
7. Testing checklist
8. Remaining TODOs

PHASE 20 — TESTING CHECKLIST

Test:

- App launches successfully
- Login works
- Invalid login shows error
- Token is saved securely
- App restores session after restart
- Logout clears token
- Dashboard loads
- Clients list loads
- Client details load
- Client creation works if allowed
- Policies list loads
- Policy detail loads
- Claims list loads
- Claim creation works
- Notifications load
- Mark as read works
- 401 redirects to login
- Tenant data isolation is respected
- Permissions hide unauthorized actions
- Android works
- iOS-compatible code is maintained

VERY IMPORTANT BUILD RULES

- Do not generate fake-only screens that are disconnected from the backend unless clearly marked as temporary.
- If an endpoint is missing, add it properly in Laravel.
- Do not break existing Inertia routes.
- Do not mix web auth assumptions with mobile token auth.
- Do not expose all model fields directly.
- Do not use `any` everywhere in TypeScript.
- Do not hard-code production domain directly inside components.
- Do not create messy one-file screens. Keep components reusable.
- Keep MVP focused and expandable.

START NOW:

1. Inspect the project.
2. Identify existing backend APIs/auth.
3. Propose the implementation plan.
4. Then implement the mobile app foundation and backend mobile API layer step by step.
