# Tenant-Specific Theme System

## Overview
A comprehensive, tenant-specific theming system that allows each tenant to customize their app's appearance with unique colors and gradients. The selected theme persists in the database and applies globally across all sessions for users under that tenant.

## Features

✅ **Tenant-Specific Themes** - Each tenant has their own theme configuration
✅ **6 Beautiful Presets** - Ocean, Sunset, Forest, Royal, Ember, Professional
✅ **Real-time Updates** - Theme changes apply instantly without page reload
✅ **CSS Variable Integration** - Dynamic theming using CSS custom properties
✅ **Gradient Support** - Custom gradients for sidebar, header, and body
✅ **Persistent Storage** - Theme preferences saved in database per tenant
✅ **Default Fallback** - Automatic fallback to default theme if none configured
✅ **React Context API** - Centralized theme management
✅ **Header Theme Switcher** - Quick access dropdown in app header

## Implementation Details

### Backend

#### 1. Database Migration
```bash
php artisan migrate
```

**Migration:**
- Adds `theme_settings` JSON column to `tenants` table
- Located at: `database/migrations/2025_10_05_102439_add_theme_settings_to_tenants_table.php`

#### 2. Tenant Model (`app/Models/Tenant.php`)

**New Methods:**
- `getTheme()` - Returns theme settings with default fallback
- `getDefaultTheme()` - Static method for default theme
- `getThemePresets()` - Static method for available presets

**Theme Structure:**
```php
[
    'primary_color' => '#3b82f6',
    'secondary_color' => '#8b5cf6',
    'accent_color' => '#10b981',
    'gradient' => [
        'from' => '#3b82f6',
        'via' => '#8b5cf6',
        'to' => '#ec4899',
    ],
    'sidebar_style' => 'gradient', // 'solid' or 'gradient'
    'header_style' => 'solid',
    'body_style' => 'gradient', // 'solid', 'gradient', 'none'
]
```

**Available Presets:**
1. **Ocean** - Blue-cyan-teal gradient
2. **Sunset** - Orange-pink-purple gradient
3. **Forest** - Green gradient
4. **Royal** - Indigo-violet-purple gradient
5. **Ember** - Red-orange-yellow gradient
6. **Professional** - Navy blue gradient

#### 3. Theme Controller (`app/Http/Controllers/Settings/ThemeController.php`)

**Endpoints:**
- `GET /settings/theme` - Theme customization page
- `GET /api/theme` - Get current theme settings
- `PATCH /api/theme` - Update theme settings
- `POST /api/theme/preset` - Apply a preset theme
- `POST /api/theme/reset` - Reset to default theme

**Validation:**
- Hex color validation (`/^#[a-fA-F0-9]{6}$/`)
- Style option validation (`solid`, `gradient`, `none`)

#### 4. Routes (`routes/settings.php`)

```php
// Theme Settings
Route::get('settings/theme', [ThemeController::class, 'index'])->name('settings.theme');
Route::get('api/theme', [ThemeController::class, 'show'])->name('api.theme.show');
Route::patch('api/theme', [ThemeController::class, 'update'])->name('api.theme.update');
Route::post('api/theme/preset', [ThemeController::class, 'applyPreset'])->name('api.theme.preset');
Route::post('api/theme/reset', [ThemeController::class, 'reset'])->name('api.theme.reset');
```

#### 5. Inertia Middleware (`app/Http/Middleware/HandleInertiaRequests.php`)

Shares theme data with all Inertia pages:
```php
'theme' => $request->user()?->tenant
    ? $request->user()->tenant->getTheme()
    : Tenant::getDefaultTheme(),
```

### Frontend

#### 1. Theme Types (`resources/js/types/theme.ts`)

```typescript
export interface Theme {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    gradient: {
        from: string;
        via: string;
        to: string;
    };
    sidebar_style: 'solid' | 'gradient';
    header_style: 'solid' | 'gradient';
    body_style: 'solid' | 'gradient' | 'none';
}
```

#### 2. Theme Context (`resources/js/contexts/theme-context.tsx`)

**Provides:**
- `theme` - Current theme object
- `applyTheme(theme)` - Apply custom theme
- `applyPreset(presetKey)` - Apply preset theme
- `resetTheme()` - Reset to default
- `isLoading` - Loading state

**Auto-applies theme to CSS variables on change**

#### 3. Theme Switcher Component (`resources/js/components/theme/theme-switcher.tsx`)

**Features:**
- Dropdown menu with all presets
- Color preview for each preset
- Visual indicator for current theme
- Reset to default option
- Loading state

**Usage:**
```tsx
import { ThemeSwitcher } from '@/components/theme/theme-switcher';

// In your header component
<ThemeSwitcher />
```

#### 4. App Integration (`resources/js/app.tsx`)

Wraps app with `TenantThemeProvider`:
```tsx
<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <TenantThemeProvider>
        <App {...props} />
        <Toaster />
    </TenantThemeProvider>
</ThemeProvider>
```

#### 5. CSS Variables (`resources/css/app.css`)

**Theme Variables:**
```css
:root {
    /* Tenant Theme Colors */
    --color-primary: #3b82f6;
    --color-secondary: #8b5cf6;
    --color-accent: #10b981;
    --gradient-from: #3b82f6;
    --gradient-via: #8b5cf6;
    --gradient-to: #ec4899;
    --sidebar-style: gradient;
    --header-style: solid;
    --body-style: gradient;
}
```

**Utility Classes:**
- `.bg-theme-primary` - Primary color background
- `.bg-theme-secondary` - Secondary color background
- `.bg-theme-accent` - Accent color background
- `.text-theme-primary` - Primary color text
- `.text-theme-secondary` - Secondary color text
- `.text-theme-accent` - Accent color text
- `.bg-theme-gradient` - 135deg diagonal gradient
- `.bg-theme-gradient-to-r` - Left to right gradient
- `.bg-theme-gradient-to-b` - Top to bottom gradient
- `.border-theme-primary` - Primary color border
- `.border-theme-secondary` - Secondary color border
- `.border-theme-accent` - Accent color border

## Usage Examples

### 1. Add Theme Switcher to Header

```tsx
import { ThemeSwitcher } from '@/components/theme/theme-switcher';

export function AppHeader() {
    return (
        <header>
            {/* Other header content */}
            <ThemeSwitcher />
        </header>
    );
}
```

### 2. Use Theme in Components

```tsx
import { useTheme } from '@/contexts/theme-context';

export function MyComponent() {
    const { theme } = useTheme();

    return (
        <div className="bg-theme-gradient p-6">
            <h1 style={{ color: theme.primary_color }}>Hello</h1>
        </div>
    );
}
```

### 3. Apply Theme to Sidebar

```tsx
export function Sidebar() {
    const { theme } = useTheme();
    const className = theme.sidebar_style === 'gradient'
        ? 'bg-theme-gradient'
        : 'bg-theme-primary';

    return (
        <aside className={className}>
            {/* Sidebar content */}
        </aside>
    );
}
```

### 4. Programmatically Change Theme

```tsx
import { useTheme } from '@/contexts/theme-context';

export function ThemeSettings() {
    const { applyPreset, resetTheme } = useTheme();

    return (
        <div>
            <button onClick={() => applyPreset('ocean')}>
                Apply Ocean Theme
            </button>
            <button onClick={resetTheme}>
                Reset Theme
            </button>
        </div>
    );
}
```

## API Reference

### Backend Endpoints

#### Get Theme Settings
```http
GET /api/theme
Authorization: Bearer {token}
```

**Response:**
```json
{
    "theme": {
        "primary_color": "#3b82f6",
        "secondary_color": "#8b5cf6",
        "accent_color": "#10b981",
        "gradient": {
            "from": "#3b82f6",
            "via": "#8b5cf6",
            "to": "#ec4899"
        },
        "sidebar_style": "gradient",
        "header_style": "solid",
        "body_style": "gradient"
    },
    "presets": { ... }
}
```

#### Update Theme
```http
PATCH /api/theme
Content-Type: application/json
Authorization: Bearer {token}

{
    "primary_color": "#0ea5e9",
    "secondary_color": "#06b6d4",
    "accent_color": "#14b8a6",
    "gradient": {
        "from": "#0ea5e9",
        "via": "#06b6d4",
        "to": "#14b8a6"
    },
    "sidebar_style": "gradient",
    "header_style": "solid",
    "body_style": "gradient"
}
```

#### Apply Preset
```http
POST /api/theme/preset
Content-Type: application/json
Authorization: Bearer {token}

{
    "preset": "ocean"
}
```

#### Reset Theme
```http
POST /api/theme/reset
Authorization: Bearer {token}
```

### React Hooks

#### useTheme()
```tsx
const { theme, applyTheme, applyPreset, resetTheme, isLoading } = useTheme();
```

## Files Modified/Created

### Backend
- ✅ `database/migrations/2025_10_05_102439_add_theme_settings_to_tenants_table.php` (NEW)
- ✅ `app/Models/Tenant.php` (UPDATED)
- ✅ `app/Http/Controllers/Settings/ThemeController.php` (NEW)
- ✅ `routes/settings.php` (UPDATED)
- ✅ `app/Http/Middleware/HandleInertiaRequests.php` (UPDATED)

### Frontend
- ✅ `resources/js/types/theme.ts` (NEW)
- ✅ `resources/js/contexts/theme-context.tsx` (NEW)
- ✅ `resources/js/components/theme/theme-switcher.tsx` (NEW)
- ✅ `resources/js/app.tsx` (UPDATED)
- ✅ `resources/css/app.css` (UPDATED)

## Next Steps

### To Complete Implementation:

1. **Add ThemeSwitcher to App Header**
   - Import and add `<ThemeSwitcher />` to your main app header component

2. **Update Sidebar Component**
   - Apply theme styles based on `theme.sidebar_style`
   - Use `bg-theme-gradient` or `bg-theme-primary` classes

3. **Update Header Component**
   - Apply theme styles based on `theme.header_style`

4. **Update Main Layout**
   - Apply body background based on `theme.body_style`

5. **Create Theme Settings Page** (Optional)
   - Full theme customization UI
   - Color pickers for custom colors
   - Preview before saving

6. **Test Theme System**
   - Test all presets
   - Verify persistence across sessions
   - Check multi-tenant isolation

## Testing

### Manual Testing Steps:

1. **Login as Tenant User**
   ```bash
   php artisan tinker
   >>> Auth::login(User::find(1))
   ```

2. **Apply a Preset**
   - Click theme switcher in header
   - Select a preset (e.g., Ocean)
   - Verify colors change immediately

3. **Check Persistence**
   - Logout and login again
   - Theme should persist

4. **Test API Endpoints**
   ```bash
   # Get theme
   curl -X GET http://your-app.test/api/theme

   # Apply preset
   curl -X POST http://your-app.test/api/theme/preset \
     -H "Content-Type: application/json" \
     -d '{"preset":"ocean"}'
   ```

5. **Test Multi-Tenant Isolation**
   - Login as different tenant
   - Apply different theme
   - Verify each tenant has separate theme

## Troubleshooting

### Theme Not Applying
- Check if `theme_settings` column exists: `php artisan migrate`
- Verify CSS variables are being set in browser dev tools
- Check browser console for errors

### CSS Classes Not Working
- Ensure `resources/css/app.css` has utility classes
- Run `npm run build` or `npm run dev`
- Clear browser cache

### API Errors
- Check routes: `php artisan route:list --name=theme`
- Verify middleware: ensure user is authenticated
- Check tenant relationship: user must have `tenant_id`

## Support

For issues or questions about the theme system:
- Check application logs: `storage/logs/laravel.log`
- Verify database schema: `php artisan migrate:status`
- Test API endpoints with Postman/Insomnia
