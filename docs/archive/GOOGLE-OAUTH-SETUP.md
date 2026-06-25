# Google OAuth Authentication Setup Guide

This guide explains how to set up Google OAuth authentication for the Insure Pal application.

## Overview

The authentication flow supports both traditional email/password registration and Google OAuth. After successful authentication, users are guided through a subscription and onboarding process.

## Authentication Flow

### New Users (OAuth or Email/Password)
1. **Authentication** → User logs in or signs up (Google or Email/Password)
2. **Plan Selection** → User selects a subscription plan
3. **Payment** → User completes payment via Paystack
4. **Onboarding** → User fills company details
5. **Dashboard** → User accesses their dashboard

### Returning Users
1. **Authentication** → User logs in
2. **Dashboard** → Direct access (if onboarding completed)

## Google OAuth Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client IDs**
5. Configure the OAuth consent screen:
   - Application name: **Insure Pal**
   - User support email: Your email
   - Authorized domains: Your domain
   - Developer contact: Your email
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: **Insure Pal Web Client**
   - Authorized redirect URIs:
     - `http://localhost/auth/google/callback` (development)
     - `https://your-domain.com/auth/google/callback` (production)

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI="${APP_URL}/auth/google/callback"
```

Replace `your_google_client_id_here` and `your_google_client_secret_here` with the credentials from Google Cloud Console.

### 3. Update APP_URL

Ensure your `APP_URL` is correctly set in `.env`:

**Development:**
```env
APP_URL=http://insurepal-ai-saas.test
```

**Production:**
```env
APP_URL=https://your-domain.com
```

## Database Changes

The following fields have been added to the `users` table:

- `provider_id` (string, nullable) - OAuth provider user ID
- `provider_name` (string, nullable) - OAuth provider name (e.g., 'google')
- `avatar` (string, nullable) - User's avatar URL from OAuth provider
- `password` (string, nullable) - Made nullable for OAuth users

## How It Works

### Google OAuth Flow

1. User clicks "Continue with Google" on login/register page
2. User is redirected to Google's consent screen
3. After approval, Google redirects back to the callback URL
4. The application:
   - Checks if user exists by provider_id
   - If not, checks by email
   - If email exists, links the account to Google
   - If user doesn't exist, creates new user and tenant
5. User is logged in and redirected based on onboarding status

### Redirection Logic

**Super Admin:**
- Goes directly to admin dashboard

**New Users (OAuth or Email/Password):**
- No subscription → Select Plan page
- Subscription selected but not paid → Select Plan page
- Payment completed → Company Details form
- Onboarding completed → Dashboard

**Returning Users:**
- Onboarding completed → Dashboard
- Onboarding incomplete → Continue from last step

## Code Structure

### Backend Files

**Controllers:**
- `app/Http/Controllers/Auth/SocialiteController.php` - Handles Google OAuth
- `app/Http/Controllers/Auth/AuthenticatedSessionController.php` - Email/password login with redirection
- `app/Http/Controllers/Auth/RegisteredUserController.php` - Email/password registration
- `app/Http/Controllers/Auth/SubscriberRegistrationController.php` - Subscriber registration

**Routes:**
- `routes/auth.php` - Authentication routes including OAuth

**Middleware:**
- `app/Http/Middleware/EnsureOnboardingCompleted.php` - Enforces onboarding flow

**Configuration:**
- `config/services.php` - Google OAuth credentials

### Frontend Files

**Pages:**
- `resources/js/pages/auth/login.tsx` - Login page with Google button
- `resources/js/pages/auth/RegisterSubscriber.tsx` - Subscriber registration with Google button
- `resources/js/pages/Onboarding/SelectPlan.tsx` - Plan selection
- `resources/js/pages/Onboarding/CompanyDetails.tsx` - Company details form

## Testing OAuth Flow

### Local Development

1. Ensure your app is accessible via Herd (e.g., `http://insurepal-ai-saas.test`)
2. Add the local callback URL to Google Console:
   ```
   http://insurepal-ai-saas.test/auth/google/callback
   ```
3. Update `.env`:
   ```env
   APP_URL=http://insurepal-ai-saas.test
   ```
4. Clear config cache:
   ```bash
   php artisan config:clear
   ```
5. Test the flow:
   - Visit login page
   - Click "Continue with Google"
   - Authorize the app
   - Verify redirection to Select Plan page

### Test Scenarios

1. **New Google User:**
   - Click "Continue with Google"
   - Should create user + tenant
   - Should redirect to Select Plan page

2. **Existing Email User (First Google Login):**
   - User exists with email but no Google link
   - Click "Continue with Google" with same email
   - Should link Google account to existing user
   - Should redirect based on onboarding status

3. **Returning Google User:**
   - User has completed onboarding
   - Click "Continue with Google"
   - Should redirect to Dashboard

4. **Email/Password User:**
   - Register with email/password
   - Should redirect to Select Plan page

## Security Considerations

1. **OAuth State Validation:** Laravel Socialite handles state validation automatically
2. **HTTPS Required:** Always use HTTPS in production for OAuth callbacks
3. **Email Verification:** OAuth users are auto-verified since Google verifies emails
4. **Random Passwords:** OAuth users get random passwords (they won't use them)

## Technical Implementation Notes

### Why Use `<a>` Instead of Inertia `<Link>`?

OAuth redirects require a full page navigation to an external site (Google), not an AJAX/XHR request. The Inertia `<Link>` component uses AJAX, which causes CORS errors when trying to redirect to Google's OAuth consent screen.

**Solution:** Use a regular `<a>` tag for the OAuth redirect button, which performs a standard browser navigation.

## Troubleshooting

### Common Issues

**OAuth Callback Redirects to Login Page:**
- **Cause:** OAuth callback route was inside the `guest` middleware group, which redirects authenticated users
- **Fix:** The callback route must be OUTSIDE the `guest` middleware to handle all authentication states
- **Solution:** See `routes/auth.php` - the callback route is now independent of middleware groups

**CORS Error When Clicking Google Button:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```
- **Cause:** Using Inertia's `<Link>` component instead of regular `<a>` tag
- **Fix:** Ensure OAuth buttons use `<a href={route('auth.google')}>` not `<Link href={route('auth.google')}>`

**"Invalid redirect URI" Error:**
- Verify the redirect URI in Google Console matches exactly with your `GOOGLE_REDIRECT_URI`
- Check that `APP_URL` in `.env` is correct
- Clear config cache: `php artisan config:clear`

**"Client ID not found" Error:**
- Verify `GOOGLE_CLIENT_ID` is set correctly in `.env`
- Check that credentials are from the correct Google Cloud project
- Clear config cache

**User Not Redirecting Properly:**
- Check `EnsureOnboardingCompleted` middleware is registered
- Verify onboarding routes are accessible
- Check user's `tenant->onboarding_steps` in database

**Session Issues:**
- Ensure session driver is configured correctly
- For production, consider using `redis` or `database` session driver
- Clear browser cookies and try again

## Production Deployment Checklist

- [ ] Set up Google OAuth credentials for production domain
- [ ] Update `GOOGLE_REDIRECT_URI` with production URL
- [ ] Ensure `APP_URL` is set to production domain
- [ ] Use HTTPS for all OAuth callbacks
- [ ] Test OAuth flow on production
- [ ] Monitor error logs for OAuth failures
- [ ] Set up proper session storage (Redis/Database)

## Additional OAuth Providers

To add LinkedIn or other providers:

1. Install provider: `composer require laravel/socialite`
2. Add credentials to `config/services.php`
3. Create routes similar to Google OAuth
4. Update `SocialiteController` to handle the new provider
5. Add provider button to login/register pages

## Support

For issues or questions:
- Check Laravel Socialite documentation: https://laravel.com/docs/socialite
- Review Google OAuth documentation: https://developers.google.com/identity/protocols/oauth2
- Check application logs: `storage/logs/laravel.log`
