<?php

use App\Http\Controllers\Admin\UserRoleController;
use App\Http\Controllers\API\ExchangeRateController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RoleController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// exchange rate route
Route::get('/exchange-rate', [ExchangeRateController::class, 'getExchangeRate'])->name('api.exchange-rate');

// Role and Permission Management Routes
Route::middleware(['auth:sanctum'])->group(function () {

    // Role Management Routes
    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index'])->name('api.roles.index');
        Route::post('/', [RoleController::class, 'store'])->name('api.roles.store');
        Route::get('/statistics', [RoleController::class, 'statistics'])->name('api.roles.statistics');
        Route::get('/permissions', [RoleController::class, 'getPermissions'])->name('api.roles.permissions');
        Route::get('/{role}', [RoleController::class, 'show'])->name('api.roles.show');
        Route::put('/{role}', [RoleController::class, 'update'])->name('api.roles.update');
        Route::delete('/{role}', [RoleController::class, 'destroy'])->name('api.roles.destroy');
        Route::post('/{role}/assign-permissions', [RoleController::class, 'assignPermissions'])->name('api.roles.assign-permissions');
    });

    // Permission Management Routes
    Route::prefix('permissions')->group(function () {
        Route::get('/', [PermissionController::class, 'index'])->name('api.permissions.index');
        Route::post('/', [PermissionController::class, 'store'])->name('api.permissions.store');
        Route::post('/bulk-create', [PermissionController::class, 'bulkCreate'])->name('api.permissions.bulk-create');
        Route::get('/statistics', [PermissionController::class, 'statistics'])->name('api.permissions.statistics');
        Route::get('/roles', [PermissionController::class, 'getRoles'])->name('api.permissions.roles');
        Route::get('/{permission}', [PermissionController::class, 'show'])->name('api.permissions.show');
        Route::put('/{permission}', [PermissionController::class, 'update'])->name('api.permissions.update');
        Route::delete('/{permission}', [PermissionController::class, 'destroy'])->name('api.permissions.destroy');
        Route::post('/{permission}/assign-roles', [PermissionController::class, 'assignRoles'])->name('api.permissions.assign-roles');
    });

    // User Role Management Routes
    Route::prefix('user-roles')->group(function () {
        Route::get('/', [UserRoleController::class, 'index'])->name('api.user-roles.index');
        Route::get('/statistics', [UserRoleController::class, 'statistics'])->name('api.user-roles.statistics');
        Route::get('/available-roles', [UserRoleController::class, 'getAvailableRoles'])->name('api.user-roles.available-roles');
        Route::get('/available-permissions', [UserRoleController::class, 'getAvailablePermissions'])->name('api.user-roles.available-permissions');
        Route::post('/bulk-assign-roles', [UserRoleController::class, 'bulkAssignRoles'])->name('api.user-roles.bulk-assign');
        Route::get('/{user}', [UserRoleController::class, 'show'])->name('api.user-roles.show');
        Route::post('/{user}/assign-roles', [UserRoleController::class, 'assignRoles'])->name('api.user-roles.assign-roles');
        Route::post('/{user}/assign-permissions', [UserRoleController::class, 'assignPermissions'])->name('api.user-roles.assign-permissions');
        Route::delete('/{user}/remove-role', [UserRoleController::class, 'removeRole'])->name('api.user-roles.remove-role');
        Route::delete('/{user}/remove-permission', [UserRoleController::class, 'removePermission'])->name('api.user-roles.remove-permission');
    });
});

// Public API V1 Routes (Server-to-Server, Protected by X-API-KEY)
Route::prefix('v1')->middleware(\App\Http\Middleware\VerifyTenantApiKey::class)->group(function () {
    // Customers
    Route::post('/customers', [\App\Http\Controllers\API\V1\CustomerController::class, 'store']);
    Route::get('/customers/{id}', [\App\Http\Controllers\API\V1\CustomerController::class, 'show']);
    Route::get('/customers', [\App\Http\Controllers\API\V1\CustomerController::class, 'index']);

    // Products
    Route::get('/products', [\App\Http\Controllers\API\V1\ProductController::class, 'index']);
    Route::get('/products/{id}', [\App\Http\Controllers\API\V1\ProductController::class, 'show']);

    // Quotes & Policies
    Route::post('/policies/quote', [\App\Http\Controllers\API\V1\PolicyController::class, 'quote']);
    Route::post('/policies/issue', [\App\Http\Controllers\API\V1\PolicyController::class, 'issue']);

    // Payments
    Route::post('/payments/initiate', [\App\Http\Controllers\API\V1\PaymentController::class, 'initiate']);
});

// Widget API Routes (Client-side, Protected by X-Tenant-Key)
Route::prefix('v1/widget')->middleware(\App\Http\Middleware\VerifyWidgetAccess::class)->group(function () {
    // Products (Public info)
    Route::get('/products', [\App\Http\Controllers\API\V1\ProductController::class, 'index']);
    Route::get('/products/{id}', [\App\Http\Controllers\API\V1\ProductController::class, 'show']);

    // Quotes (Public calculation)
    Route::post('/policies/quote', [\App\Http\Controllers\API\V1\PolicyController::class, 'quote']);

    // Payments
    Route::post('/payments/initiate', [\App\Http\Controllers\API\V1\PaymentController::class, 'initiate']);
});

// Webhooks (Paystack)
Route::post('/v1/payments/webhook/paystack', [\App\Http\Controllers\API\V1\PaymentController::class, 'handleWebhook']);

// Mobile API Routes
Route::prefix('mobile')->group(function () {
    // Public routes (no auth required)
    Route::post('/auth/login', [\App\Http\Controllers\Mobile\AuthController::class, 'login']);

    // Protected routes (requires Sanctum auth)
    Route::middleware('auth:sanctum')->group(function () {
        // Auth
        Route::post('/auth/logout', [\App\Http\Controllers\Mobile\AuthController::class, 'logout']);
        Route::get('/auth/me', [\App\Http\Controllers\Mobile\AuthController::class, 'me']);

        // Dashboard
        Route::get('/dashboard', [\App\Http\Controllers\Mobile\DashboardController::class, 'index']);

        // Clients
        Route::get('/clients', [\App\Http\Controllers\Mobile\ClientController::class, 'index']);
        Route::post('/clients', [\App\Http\Controllers\Mobile\ClientController::class, 'store']);
        Route::get('/clients/{id}', [\App\Http\Controllers\Mobile\ClientController::class, 'show']);
        Route::put('/clients/{id}', [\App\Http\Controllers\Mobile\ClientController::class, 'update']);
        Route::delete('/clients/{id}', [\App\Http\Controllers\Mobile\ClientController::class, 'destroy']);

        // Policies
        Route::get('/policies', [\App\Http\Controllers\Mobile\PolicyController::class, 'index']);
        Route::get('/policies/{id}', [\App\Http\Controllers\Mobile\PolicyController::class, 'show']);

        // Claims
        Route::get('/claims', [\App\Http\Controllers\Mobile\ClaimController::class, 'index']);
        Route::post('/claims', [\App\Http\Controllers\Mobile\ClaimController::class, 'store']);
        Route::get('/claims/{id}', [\App\Http\Controllers\Mobile\ClaimController::class, 'show']);
        Route::put('/claims/{id}', [\App\Http\Controllers\Mobile\ClaimController::class, 'update']);

        // Quotes (read-only)
        Route::get('/quotes', [\App\Http\Controllers\Mobile\QuoteController::class, 'index']);
        Route::get('/quotes/{id}', [\App\Http\Controllers\Mobile\QuoteController::class, 'show']);

        // Notifications
        Route::get('/notifications', [\App\Http\Controllers\Mobile\NotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [\App\Http\Controllers\Mobile\NotificationController::class, 'markRead']);
        Route::post('/notifications/read-all', [\App\Http\Controllers\Mobile\NotificationController::class, 'markAllRead']);
        Route::delete('/notifications/{id}', [\App\Http\Controllers\Mobile\NotificationController::class, 'destroy']);
    });
});
