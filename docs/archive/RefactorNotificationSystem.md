Use this prompt in Claude Code:

````text
You are a senior Laravel 12 + Inertia React TypeScript engineer.

Analyze the entire codebase and refactor the existing notification system to use Laravel Reverb for real-time notifications.

Project context:
- Backend: Laravel 12
- Frontend: Inertia.js + React + TypeScript
- Styling/UI: Tailwind CSS + Shadcn UI
- Auth: Laravel auth system
- App type: multi-tenant SaaS insurance platform
- Current notification system may already include database notifications, custom notification hooks, unread counts, notification dropdowns, toast alerts, or polling-based fetching.
- Laravel Reverb may already be installed, but confirm before making assumptions.

Main goal:
Convert the notification system into a proper real-time notification architecture using Laravel Broadcasting + Laravel Reverb + Laravel Echo, while preserving database persistence, unread/read state, and existing UI behavior.

Do not blindly rewrite everything. First inspect the codebase, understand what exists, then refactor safely.

---

## 1. Codebase analysis

First analyze and document the current notification implementation.

Check for:

- Notification models, migrations, and database tables
- Laravel Notification classes
- Custom notification controllers
- Routes related to notifications
- Existing API/Inertia endpoints for:
  - listing notifications
  - unread count
  - marking one as read
  - marking all as read
  - deleting notifications
- Existing frontend notification components
- Existing hooks such as:
  - useNotifications
  - useUnreadNotifications
  - useNotificationStore
  - useEcho
- Existing polling or interval-based notification fetching
- Existing toast implementation
- Existing auth/user context in Inertia shared props
- Existing tenant scoping logic
- Existing broadcasting configuration
- Existing `.env` variables
- Existing queue configuration
- Existing Laravel Echo setup
- Existing Reverb installation/config files

After analysis, summarize:
- what currently exists
- what is reusable
- what is broken or incomplete
- what should be refactored
- what should not be touched

---

## 2. Backend Reverb setup

Check whether Laravel Reverb is installed.

If not installed, add it properly:

```bash
composer require laravel/reverb
php artisan reverb:install
````

If already installed, verify:

- `config/reverb.php`
- `config/broadcasting.php`
- `.env` Reverb variables
- `routes/channels.php`
- queue configuration
- broadcasting driver

Configure Laravel to use Reverb:

```env
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=insurepal
REVERB_APP_KEY=local-reverb-key
REVERB_APP_SECRET=local-reverb-secret
REVERB_HOST=127.0.0.1
REVERB_PORT=8080
REVERB_SCHEME=http

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

For production, make sure the code supports these values being overridden from the server `.env`.

Do not hardcode local values in application code.

---

## 3. Broadcasting architecture

Implement a clean event-based notification broadcasting system.

Create or refactor an event similar to:

```php
App\Events\NotificationCreated
```

The event should:

- implement `ShouldBroadcast`
- broadcast on a private user-specific channel
- include only safe frontend notification payload
- avoid leaking tenant-private data
- support multi-tenant scoping where applicable
- broadcast as a clear event name, for example:

```php
public function broadcastAs(): string
{
    return 'notification.created';
}
```

Use a channel naming pattern like:

```php
private-user.{userId}
```

or, if tenant scoping is already central in the app:

```php
tenant.{tenantId}.user.{userId}
```

Choose the best pattern based on the existing codebase.

Add the channel authorization in `routes/channels.php`.

Example:

```php
Broadcast::channel('private-user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
```

If using tenant-scoped channels:

```php
Broadcast::channel('tenant.{tenantId}.user.{userId}', function ($user, $tenantId, $userId) {
    return (int) $user->id === (int) $userId
        && (int) $user->tenant_id === (int) $tenantId;
});
```

Adapt this to the real tenant ownership fields in the codebase.

---

## 4. Database persistence must remain

Real-time notifications must not replace database notifications.

The correct flow should be:

1. Notification is created and saved in the database.
2. Notification event is broadcast through Reverb.
3. Frontend receives the event instantly.
4. Frontend adds the notification to the dropdown/list.
5. Unread count updates immediately.
6. Notification still appears after page reload because it is stored in the database.

Do not create a fragile real-time-only system.

Make sure the app still works if Reverb is temporarily unavailable.

---

## 5. Notification payload standard

Standardize the notification payload returned to the frontend.

Use a shape like:

```ts
type NotificationPayload = {
    id: string | number;
    type: string;
    title: string;
    message: string;
    url?: string | null;
    data?: Record<string, unknown>;
    read_at?: string | null;
    created_at: string;
};
```

Backend API responses and broadcast events should use the same payload shape as much as possible.

If existing frontend uses a different shape, either preserve compatibility or update the hook/components cleanly.

Avoid sending entire Eloquent models over broadcasts.

---

## 6. Backend notification actions

Ensure the following backend actions exist and work:

- Get recent notifications
- Get unread notification count
- Mark one notification as read
- Mark all notifications as read
- Delete notification, if the current UI supports deleting
- Optional: clear all notifications, only if currently supported

All actions must be authenticated.

All actions must be tenant-safe.

A user must not be able to read, update, or delete another user's notifications.

Use policies or strict query constraints where appropriate.

---

## 7. Frontend Laravel Echo setup

Inspect the current frontend bootstrap files, likely:

- `resources/js/bootstrap.ts`
- `resources/js/app.tsx`
- `resources/js/lib/echo.ts`
- existing Echo setup if any

Install missing frontend dependencies if needed:

```bash
npm install laravel-echo pusher-js
```

Configure Laravel Echo for Reverb.

Example:

```ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Echo: Echo<'reverb'>;
        Pusher: typeof Pusher;
    }
}

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: '/broadcasting/auth',
    auth: {
        headers: {
            'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
        },
    },
});
```

Adapt based on the existing project structure.

Avoid duplicate Echo initialization.

---

## 8. React notification hook

Create or refactor a reusable hook, for example:

```ts
useRealtimeNotifications(userId, tenantId?)
```

The hook should:

- fetch initial notifications from the backend
- fetch or calculate unread count
- subscribe to the correct private Reverb channel
- listen for `.notification.created`
- prepend new notifications to the notification list
- increment unread count
- optionally show a toast
- cleanly unsubscribe on component unmount
- prevent duplicate listeners
- avoid memory leaks
- handle missing user ID gracefully
- avoid breaking SSR/Inertia hydration

If an existing `useNotifications` hook exists, refactor it instead of creating another overlapping hook.

Expected behavior:

```ts
window.Echo.private(`private-user.${userId}`).listen('.notification.created', (event) => {
    // update state
});
```

If tenant-scoped channels are used:

```ts
window.Echo.private(`tenant.${tenantId}.user.${userId}`).listen('.notification.created', (event) => {
    // update state
});
```

---

## 9. Notification UI

Update existing notification UI components to use the real-time hook.

The UI should support:

- notification dropdown
- unread badge/count
- recent notification list
- empty state
- loading state
- mark one as read
- mark all as read
- clickable notification links
- relative timestamps
- toast popup for newly received notifications

Preserve the current visual style unless there is a clear bug.

Do not redesign the entire app.

Use Shadcn UI and existing components where already used.

---

## 10. Multi-tenant safety

This is critical.

Before broadcasting or exposing notification data:

- confirm the recipient user owns the notification
- confirm tenant scoping where applicable
- do not broadcast sensitive policy, claim, customer, or financial note data directly
- broadcast only minimal safe notification text and URL
- never expose another tenant's notification through API endpoints
- verify channel authorization prevents cross-user listening

If the current notifications relate to:

- policy creation
- quote creation
- claim update
- debit note
- credit note
- tenant onboarding
- support ticket
- messages/conversations

then make sure the notification routes and broadcast events respect the same tenant boundaries as those modules.

---

## 11. Queues and broadcasting

Check whether notifications/events should be queued.

If the project already uses queues:

- implement `ShouldQueue` where appropriate
- make sure broadcast events work through the queue
- document required queue worker command

If queues are not reliably configured yet:

- use `ShouldBroadcastNow` temporarily only where necessary
- prefer the clean long-term architecture with queue workers

Recommended production commands:

```bash
php artisan reverb:start
php artisan queue:work
php artisan schedule:work
```

If Supervisor is used on the VPS, add or update Supervisor config examples for:

- Reverb server
- queue worker
- Laravel scheduler if applicable

Do not make assumptions about the VPS paths. Use placeholders and document where to adjust.

---

## 12. VPS/Nginx production readiness

Because this project is deployed on a VPS with Nginx, add production notes for WebSocket proxying.

Check whether the app needs Nginx WebSocket proxy config like:

```nginx
location /app/ {
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Scheme $scheme;
    proxy_set_header SERVER_PORT $server_port;
    proxy_set_header REMOTE_ADDR $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";

    proxy_pass http://127.0.0.1:8080;
}
```

Also consider production `.env` values:

```env
REVERB_HOST=insurepal.app
REVERB_PORT=443
REVERB_SCHEME=https

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

For local development, preserve local WebSocket values.

---

## 13. Backward compatibility

If existing frontend components expect older notification endpoints or props:

- preserve old route names where possible
- add new endpoints only if needed
- avoid breaking existing notification dropdown behavior
- avoid duplicate unread count sources
- remove old polling only after real-time works
- if keeping polling fallback, make it low-frequency and intentional

---

## 14. Testing and validation

Add or update tests where possible.

Test:

- authenticated user can fetch own notifications
- user cannot access another user's notification
- notification can be marked as read
- all notifications can be marked as read
- notification event broadcasts to the correct private channel
- channel authorization works
- payload does not leak sensitive model data
- frontend hook subscribes and unsubscribes correctly where practical

Also manually verify:

```bash
php artisan route:list | grep notification
php artisan route:list | grep broadcasting
php artisan reverb:start
php artisan queue:work
npm run dev
```

Then trigger a real notification and confirm:

- notification appears instantly
- unread badge increments
- database notification remains after refresh
- mark-as-read works
- no console Echo/auth errors
- no duplicate notifications after navigating pages
- no cross-tenant notification leak

---

## 15. Deliverables

At the end, provide:

1. Summary of existing notification system found
2. Files changed
3. New or updated backend events/controllers/routes
4. New or updated frontend hooks/components
5. Required `.env` variables
6. Required npm/composer packages
7. Required VPS/Supervisor/Nginx notes
8. Manual testing checklist
9. Any risks or assumptions

Important:

- Do not remove existing notification functionality without replacing it.
- Do not expose sensitive data in broadcast payloads.
- Do not create duplicate notification systems.
- Do not hardcode Reverb credentials.
- Do not skip database persistence.
- Do not make UI changes unrelated to notifications.
- Prioritize a clean, production-ready implementation.

```

My opinion: **don’t use Reverb as the notification storage layer**. Use it only as the delivery pipe. The database remains the truth, Reverb simply makes the UI update instantly.
```
