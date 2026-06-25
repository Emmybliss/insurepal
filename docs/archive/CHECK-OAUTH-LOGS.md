# Check OAuth Logs

After testing the Google OAuth flow, run this command to see the detailed logs:

```bash
php artisan tinker
```

Then run:

```php
// Get the latest 10 log entries
\Illuminate\Support\Facades\DB::table('logs')->latest()->take(10)->get();
```

Or simply check the Laravel log file:

```bash
# Windows
type storage\logs\laravel.log | findstr /i "oauth"

# Or use Laravel Boost
# Check the last 20 log entries for OAuth-related logs
```

## What to Look For

The logs will show:

1. **"OAuth callback started"** - Confirms the callback route was hit
2. **"Google user retrieved"** - Shows the Google user data (email, name, ID)
3. **"User found/created"** - Confirms user creation/lookup worked
4. **"User logged in"** - Confirms authentication succeeded
5. **"Redirecting user"** - Shows where the user is being redirected

## If You See an Error

If you see **"OAuth callback failed"**, the logs will include:

- The exact error message
- The full stack trace

## Common Issues to Check

1. **Missing Environment Variables**: Verify `.env` has `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
2. **Wrong Redirect URI**: Ensure Google Console has the exact callback URL
3. **Database Issues**: Check if users table has OAuth columns
4. **Role Assignment Failure**: Verify 'broker' role exists

## Quick Verification Commands

```bash
# Check Google OAuth config
php artisan tinker
>>> config('services.google')

# Check if OAuth migration ran
php artisan migrate:status

# Check if broker role exists
php artisan tinker
>>> \Spatie\Permission\Models\Role::where('name', 'broker')->first()
```
