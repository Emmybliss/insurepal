<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\EmailAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EmailOAuthController extends Controller
{
    public function redirect(Request $request, string $provider)
    {
        $config = config("email.oauth.{$provider}");

        if (! $config || empty($config['client_id'])) {
            $msg = 'OAuth application credentials for '.ucfirst($provider).' are not configured in system settings.';
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'error' => $msg], 400);
            }

            return redirect('/settings/company?error='.urlencode($msg));
        }

        $redirectUri = $this->resolveRedirectUri($config['redirect_uri'] ?? null, $provider);

        $url = match ($provider) {
            'gmail' => $this->gmailAuthUrl($config, $redirectUri),
            'microsoft365' => $this->microsoftAuthUrl($config, $redirectUri),
            default => null,
        };

        if (! $url) {
            return response()->json(['success' => false, 'error' => 'Unsupported OAuth provider'], 400);
        }

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json(['success' => true, 'data' => ['authorization_url' => $url]]);
        }

        return redirect()->away($url);
    }

    public function callback(Request $request, string $provider)
    {
        $config = config("email.oauth.{$provider}");

        if (! $config) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'error' => 'Unsupported OAuth provider'], 400);
            }

            return redirect('/settings/company?error='.urlencode('Unsupported OAuth provider'));
        }

        if ($request->filled('error')) {
            $error = $request->input('error_description') ?: $request->input('error');
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'error' => 'Authorization declined: '.$error], 400);
            }

            return redirect('/settings/company?error='.urlencode('Authorization declined: '.$error));
        }

        $code = $request->input('code');
        if (! $code) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'error' => 'No authorization code provided'], 400);
            }

            return redirect('/settings/company?error='.urlencode('No authorization code provided'));
        }

        $redirectUri = $this->resolveRedirectUri($config['redirect_uri'] ?? null, $provider);

        try {
            $tokenData = match ($provider) {
                'gmail' => $this->exchangeGmailCode($config, $code, $redirectUri),
                'microsoft365' => $this->exchangeMicrosoftCode($config, $code, $redirectUri),
                default => null,
            };

            if (! $tokenData || empty($tokenData['access_token'])) {
                $err = $tokenData['error_description'] ?? $tokenData['error'] ?? 'Failed to exchange authorization code';
                if ($request->wantsJson()) {
                    return response()->json(['success' => false, 'error' => $err], 400);
                }

                return redirect('/settings/company?error='.urlencode($err));
            }

            $userInfo = match ($provider) {
                'gmail' => $this->getGmailUserInfo($tokenData['access_token']),
                'microsoft365' => $this->getMicrosoftUserInfo($tokenData['access_token']),
                default => null,
            };

            $email = $userInfo['email'] ?? $userInfo['mail'] ?? $userInfo['userPrincipalName'] ?? null;
            if (! $email) {
                $err = 'Unable to retrieve account email address from provider';
                if ($request->wantsJson()) {
                    return response()->json(['success' => false, 'error' => $err], 400);
                }

                return redirect('/settings/company?error='.urlencode($err));
            }

            $user = $request->user();
            $tenantId = $user ? $user->tenant_id : null;

            if (! $tenantId) {
                if ($request->wantsJson()) {
                    return response()->json(['success' => false, 'error' => 'Unauthenticated or tenant missing'], 401);
                }

                return redirect('/login');
            }

            $account = EmailAccount::updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'provider' => $provider,
                    'email' => strtolower($email),
                ],
                [
                    'account_name' => $userInfo['name'] ?? $userInfo['displayName'] ?? $email,
                    'oauth_token_encrypted' => Crypt::encryptString($tokenData['access_token']),
                    'refresh_token_encrypted' => isset($tokenData['refresh_token']) ? Crypt::encryptString($tokenData['refresh_token']) : null,
                    'token_expires_at' => now()->addSeconds($tokenData['expires_in'] ?? 3600),
                    'is_active' => true,
                    'sync_status' => 'idle',
                    'sync_error' => null,
                ]
            );

            // Queue initial mailbox sync
            dispatch(new \App\Jobs\SyncEmailAccount(emailAccount: $account));

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Account connected successfully',
                    'data' => $account,
                ]);
            }

            return redirect('/settings/company?connection=success');
        } catch (\Throwable $e) {
            Log::error('OAuth callback failed', ['provider' => $provider, 'error' => $e->getMessage()]);

            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'error' => 'Authentication failed: '.$e->getMessage()], 400);
            }

            return redirect('/settings/company?error='.urlencode('Authentication failed: '.$e->getMessage()));
        }
    }

    private function resolveRedirectUri(?string $configUri, string $provider): string
    {
        if ($configUri && str_starts_with($configUri, 'http')) {
            return $configUri;
        }

        $path = $configUri ?: "/api/v1/email/oauth/{$provider}/callback";

        return url($path);
    }

    private function gmailAuthUrl(array $config, string $redirectUri): string
    {
        $params = http_build_query([
            'client_id' => $config['client_id'],
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'https://mail.google.com/ https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
            'access_type' => 'offline',
            'prompt' => 'consent',
        ]);

        return "https://accounts.google.com/o/oauth2/v2/auth?{$params}";
    }

    private function microsoftAuthUrl(array $config, string $redirectUri): string
    {
        $params = http_build_query([
            'client_id' => $config['client_id'],
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'User.Read Mail.ReadWrite Mail.Send offline_access',
            'prompt' => 'select_account',
        ]);

        return "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?{$params}";
    }

    private function exchangeGmailCode(array $config, string $code, string $redirectUri): ?array
    {
        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret'],
            'redirect_uri' => $redirectUri,
            'code' => $code,
            'grant_type' => 'authorization_code',
        ]);

        return $response->json();
    }

    private function exchangeMicrosoftCode(array $config, string $code, string $redirectUri): ?array
    {
        $response = Http::asForm()->post('https://login.microsoftonline.com/common/oauth2/v2.0/token', [
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret'],
            'redirect_uri' => $redirectUri,
            'code' => $code,
            'grant_type' => 'authorization_code',
        ]);

        return $response->json();
    }

    private function getGmailUserInfo(string $accessToken): array
    {
        $response = Http::withToken($accessToken)->get('https://www.googleapis.com/oauth2/v2/userinfo');

        return $response->json() ?: [];
    }

    private function getMicrosoftUserInfo(string $accessToken): array
    {
        $response = Http::withToken($accessToken)->get('https://graph.microsoft.com/v1.0/me');

        return $response->json() ?: [];
    }
}
