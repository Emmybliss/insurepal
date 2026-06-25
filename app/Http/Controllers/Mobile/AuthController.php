<?php

namespace App\Http\Controllers\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Resources\Mobile\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = \App\Models\User::where('email', $request->email)->first();

        if (! $user || ! \Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
                'errors' => [
                    'email' => ['The provided credentials are incorrect.'],
                ],
            ], 422);
        }

        if ($user->login_access === false) {
            return response()->json([
                'success' => false,
                'message' => 'Login access has been revoked. Please contact your administrator.',
                'errors' => [
                    'email' => ['Your login access has been revoked.'],
                ],
            ], 422);
        }

        if ($user->isOAuthUser()) {
            return response()->json([
                'success' => false,
                'message' => 'Please sign in with your OAuth provider.',
                'errors' => [
                    'email' => ['This account was created via OAuth. Please use the OAuth login.'],
                ],
            ], 422);
        }

        $tenant = $user->tenant;

        if (! $tenant) {
            return response()->json([
                'success' => false,
                'message' => 'No tenant found. Please contact support.',
            ], 422);
        }

        if (! $tenant->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is not active. Please contact support.',
            ], 422);
        }

        $token = $user->createToken('mobile-app')->plainTextToken;

        $user->update(['last_login_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'token' => $token,
                'user' => new UserResource($user),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenant = $user->tenant;

        $subscription = null;
        if ($tenant && $tenant->subscription) {
            $subscription = [
                'plan' => $tenant->subscription->plan?->name,
                'status' => $tenant->subscription->status,
                'expires_at' => $tenant->subscription->ends_at?->toISOString(),
            ];
        } elseif ($tenant && $tenant->isOnTrial()) {
            $subscription = [
                'plan' => 'Trial',
                'status' => 'trial',
                'expires_at' => $tenant->trial_ends_at?->toISOString(),
            ];
        }

        $unreadNotificationsCount = \App\Models\Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        $permissions = $user->getAllPermissions()->pluck('name')->toArray();

        return response()->json([
            'success' => true,
            'message' => 'User fetched successfully',
            'data' => [
                'user' => new UserResource($user),
                'tenant' => $tenant ? [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'type' => $tenant->type,
                    'logo' => $tenant->logo ? asset('storage/'.$tenant->logo) : null,
                ] : null,
                'permissions' => $permissions,
                'subscription' => $subscription,
                'unread_notifications_count' => $unreadNotificationsCount,
            ],
        ]);
    }
}
