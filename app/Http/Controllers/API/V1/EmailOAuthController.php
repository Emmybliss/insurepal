<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\EmailAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EmailOAuthController extends Controller
{
    public function redirect(string $provider): JsonResponse
    {
        $config = config("email.oauth.{$provider}");

        if (! $config) {
            return response()->json(['success' => false, 'error' => 'Unsupported provider'], 400);
        }

        $url = match ($provider) {
            'gmail' => $this->gmailAuthUrl($config),
            'microsoft365' => $this->microsoftAuthUrl($config),
            default => null,
        };

        if (! $url) {
            return response()->json(['success' => false, 'error' => 'Unsupported provider'], 400);
        }

        return response()->json(['success' => true, 'data' => ['authorization_url' => $url]]);
    }

    public function callback(Request $request, string $provider): JsonResponse
    {
        $config = config("email.oauth.{$provider}");

        if (! $config) {
            return response()->json(['success' => false, 'error' => 'Unsupported provider'], 400);
        }

        try {
            $tokenData = match ($provider) {
                'gmail' => $this->exchangeGmailCode($config, $request->code),
                'microsoft365' => $this->exchangeMicrosoftCode($config, $request->code),
                default => null,
            };

            if (! $tokenData) {
                return response()->json(['success' => false, 'error' => 'Failed to exchange code'], 400);
            }

            $userInfo = match ($provider) {
                'gmail' => $this->getGmailUserInfo($tokenData['access_token']),
                'microsoft365' => $this->getMicrosoftUserInfo($tokenData['access_token']),
                default => null,
            };

            $email = $userInfo['email'] ?? $userInfo['mail'] ?? null;

            $account = EmailAccount::create([
                'tenant_id' => $request->user()->tenant_id,
                'provider' => $provider,
                'email' => $email,
                'account_name' => $userInfo['name'] ?? $userInfo['displayName'] ?? $email,
                'oauth_token_encrypted' => encrypt($tokenData['access_token']),
                'refresh_token_encrypted' => isset($tokenData['refresh_token']) ? encrypt($tokenData['refresh_token']) : null,
                'token_expires_at' => now()->addSeconds($tokenData['expires_in'] ?? 3600),
                'is_active' => true,
            ]);

            dispatch(new \App\Jobs\SyncEmailAccount(emailAccount: $account));

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Account connected successfully',
                    'data' => $account,
                ]);
            }

            return redirect(route('settings.company').'?connection=success');
        } catch (\Exception $e) {
            Log::error('OAuth callback failed', ['provider' => $provider, 'error' => $e->getMessage()]);

            return response()->json(['success' => false, 'error' => 'Authentication failed'], 500);
        }
    }

    private function gmailAuthUrl(array $config): string
    {
        $params = http_build_query([
            'client_id' => $config['client_id'],
            'redirect_uri' => $config['redirect_uri'],
            'response_type' => 'code',
            'scope' => 'https://mail.google.com/',
            'access_type' => 'offline',
            'prompt' => 'consent',
        ]);

        return "https://accounts.google.com/o/oauth2/v2/auth?{$params}";
    }

    private function microsoftAuthUrl(array $config): string
    {
        $params = http_build_query([
            'client_id' => $config['client_id'],
            'redirect_uri' => $config['redirect_uri'],
            'response_type' => 'code',
            'scope' => 'Mail.Read Mail.Send Mail.ReadWrite offline_access',
        ]);

        return "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?{$params}";
    }

    private function exchangeGmailCode(array $config, string $code): ?array
    {
        $response = Http::post('https://oauth2.googleapis.com/token', [
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret'],
            'redirect_uri' => $config['redirect_uri'],
            'code' => $code,
            'grant_type' => 'authorization_code',
        ]);

        return $response->json();
    }

    private function exchangeMicrosoftCode(array $config, string $code): ?array
    {
        $response = Http::post('https://login.microsoftonline.com/common/oauth2/v2.0/token', [
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret'],
            'redirect_uri' => $config['redirect_uri'],
            'code' => $code,
            'grant_type' => 'authorization_code',
        ]);

        return $response->json();
    }

    private function getGmailUserInfo(string $accessToken): array
    {
        $response = Http::withToken($accessToken)
            ->get('https://www.googleapis.com/oauth2/v2/userinfo');

        return $response->json();
    }

    private function getMicrosoftUserInfo(string $accessToken): array
    {
        $response = Http::withToken($accessToken)
            ->get('https://graph.microsoft.com/v1.0/me');

        return $response->json();
    }
}
