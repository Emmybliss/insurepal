<?php

use App\Http\Controllers\Admin\UserRoleController;
use App\Http\Controllers\Api\ExchangeRateController;
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

// ===========================================================================
// V1 API — Authenticated (Sanctum, user-scoped)
// ===========================================================================
Route::prefix('v1')->middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::get('/customers', [\App\Http\Controllers\Api\V1\CustomerController::class, 'index']);
    Route::post('/customers', [\App\Http\Controllers\Api\V1\CustomerController::class, 'store']);
    Route::get('/customers/{customer}', [\App\Http\Controllers\Api\V1\CustomerController::class, 'show']);
    Route::put('/customers/{customer}', [\App\Http\Controllers\Api\V1\CustomerController::class, 'update']);
    Route::delete('/customers/{customer}', [\App\Http\Controllers\Api\V1\CustomerController::class, 'destroy']);
    Route::post('/customers/{customer}/provision-access', [\App\Http\Controllers\Api\V1\CustomerController::class, 'provisionAccess']);
    Route::post('/customers/{customer}/revoke-access', [\App\Http\Controllers\Api\V1\CustomerController::class, 'revokeAccess']);
    Route::post('/customers/{customer}/reset-password', [\App\Http\Controllers\Api\V1\CustomerController::class, 'resetPassword']);

    // Quotes
    Route::get('/quotes', [\App\Http\Controllers\Api\V1\QuoteController::class, 'index']);
    Route::post('/quotes', [\App\Http\Controllers\Api\V1\QuoteController::class, 'store']);
    Route::get('/quotes/{quote}', [\App\Http\Controllers\Api\V1\QuoteController::class, 'show']);
    Route::put('/quotes/{quote}', [\App\Http\Controllers\Api\V1\QuoteController::class, 'update']);
    Route::delete('/quotes/{quote}', [\App\Http\Controllers\Api\V1\QuoteController::class, 'destroy']);
    Route::post('/quotes/{quote}/send', [\App\Http\Controllers\Api\V1\QuoteController::class, 'send']);
    Route::post('/quotes/{quote}/accept', [\App\Http\Controllers\Api\V1\QuoteController::class, 'accept']);
    Route::post('/quotes/{quote}/reject', [\App\Http\Controllers\Api\V1\QuoteController::class, 'reject']);
    Route::post('/quotes/{quote}/convert-to-policy', [\App\Http\Controllers\Api\V1\QuoteController::class, 'convertToPolicy']);
    Route::post('/quotes/{quote}/duplicate', [\App\Http\Controllers\Api\V1\QuoteController::class, 'duplicate']);
    Route::post('/quotes/{quote}/extend-validity', [\App\Http\Controllers\Api\V1\QuoteController::class, 'extendValidity']);

    // Policies
    Route::get('/policies', [\App\Http\Controllers\Api\V1\PolicyController::class, 'index']);
    Route::post('/policies', [\App\Http\Controllers\Api\V1\PolicyController::class, 'store']);
    Route::get('/policies/{policy}', [\App\Http\Controllers\Api\V1\PolicyController::class, 'show']);
    Route::put('/policies/{policy}', [\App\Http\Controllers\Api\V1\PolicyController::class, 'update']);
    Route::delete('/policies/{policy}', [\App\Http\Controllers\Api\V1\PolicyController::class, 'destroy']);
    Route::post('/policies/convert-quote', [\App\Http\Controllers\Api\V1\PolicyController::class, 'convertQuote']);
    Route::post('/policies/{policy}/submit-for-approval', [\App\Http\Controllers\Api\V1\PolicyController::class, 'submitForApproval']);
    Route::post('/policies/{policy}/approve', [\App\Http\Controllers\Api\V1\PolicyController::class, 'approve']);
    Route::post('/policies/{policy}/reject', [\App\Http\Controllers\Api\V1\PolicyController::class, 'reject']);
    Route::post('/policies/{policy}/issue', [\App\Http\Controllers\Api\V1\PolicyController::class, 'issue']);
    Route::post('/policies/{policy}/cancel', [\App\Http\Controllers\Api\V1\PolicyController::class, 'cancel']);
    Route::post('/policies/{policy}/suspend', [\App\Http\Controllers\Api\V1\PolicyController::class, 'suspend']);
    Route::post('/policies/{policy}/reinstate', [\App\Http\Controllers\Api\V1\PolicyController::class, 'reinstate']);

    // Claims
    Route::get('/claims', [\App\Http\Controllers\Api\V1\ClaimController::class, 'index']);
    Route::post('/claims', [\App\Http\Controllers\Api\V1\ClaimController::class, 'store']);
    Route::get('/claims/{claim}', [\App\Http\Controllers\Api\V1\ClaimController::class, 'show']);
    Route::put('/claims/{claim}', [\App\Http\Controllers\Api\V1\ClaimController::class, 'update']);
    Route::delete('/claims/{claim}', [\App\Http\Controllers\Api\V1\ClaimController::class, 'destroy']);
    Route::post('/claims/{claim}/submit', [\App\Http\Controllers\Api\V1\ClaimController::class, 'submit']);
    Route::post('/claims/{claim}/start-review', [\App\Http\Controllers\Api\V1\ClaimController::class, 'startReview']);
    Route::post('/claims/{claim}/approve', [\App\Http\Controllers\Api\V1\ClaimController::class, 'approve']);
    Route::post('/claims/{claim}/reject', [\App\Http\Controllers\Api\V1\ClaimController::class, 'reject']);
    Route::post('/claims/{claim}/request-info', [\App\Http\Controllers\Api\V1\ClaimController::class, 'requestInfo']);
    Route::post('/claims/{claim}/settle', [\App\Http\Controllers\Api\V1\ClaimController::class, 'settle']);
    Route::post('/claims/{claim}/close', [\App\Http\Controllers\Api\V1\ClaimController::class, 'close']);
    Route::post('/claims/{claim}/documents', [\App\Http\Controllers\Api\V1\ClaimController::class, 'uploadDocuments']);
    Route::post('/claims/{claim}/comments', [\App\Http\Controllers\Api\V1\ClaimController::class, 'addComment']);

    // Placements
    Route::get('/placements', [\App\Http\Controllers\Api\V1\PlacementController::class, 'index']);
    Route::post('/placements', [\App\Http\Controllers\Api\V1\PlacementController::class, 'store']);
    Route::get('/placements/{placement}', [\App\Http\Controllers\Api\V1\PlacementController::class, 'show']);
    Route::put('/placements/{placement}', [\App\Http\Controllers\Api\V1\PlacementController::class, 'update']);
    Route::delete('/placements/{placement}', [\App\Http\Controllers\Api\V1\PlacementController::class, 'destroy']);
    Route::post('/placements/{placement}/submit-to-market', [\App\Http\Controllers\Api\V1\PlacementController::class, 'submitToMarket']);
    Route::post('/placements/{placement}/bind', [\App\Http\Controllers\Api\V1\PlacementController::class, 'bind']);
    Route::post('/placements/{placement}/cancel', [\App\Http\Controllers\Api\V1\PlacementController::class, 'cancel']);
    Route::post('/placements/{placement}/convert-to-policy', [\App\Http\Controllers\Api\V1\PlacementController::class, 'convertToPolicy']);
    Route::get('/placements/{placement}/markets', [\App\Http\Controllers\Api\V1\PlacementController::class, 'indexMarkets']);
    Route::post('/placements/{placement}/markets', [\App\Http\Controllers\Api\V1\PlacementController::class, 'storeMarket']);
    Route::get('/placements/{placement}/markets/{market}', [\App\Http\Controllers\Api\V1\PlacementController::class, 'showMarket']);
    Route::put('/placements/{placement}/markets/{market}', [\App\Http\Controllers\Api\V1\PlacementController::class, 'updateMarket']);
    Route::delete('/placements/{placement}/markets/{market}', [\App\Http\Controllers\Api\V1\PlacementController::class, 'destroyMarket']);
    Route::post('/placements/{placement}/markets/{market}/respond', [\App\Http\Controllers\Api\V1\PlacementController::class, 'respondMarket']);

    // Broker Slips
    Route::get('/broker-slips', [\App\Http\Controllers\Api\V1\BrokerSlipController::class, 'index']);
    Route::post('/broker-slips', [\App\Http\Controllers\Api\V1\BrokerSlipController::class, 'store']);
    Route::get('/broker-slips/{brokerSlip}', [\App\Http\Controllers\Api\V1\BrokerSlipController::class, 'show']);
    Route::put('/broker-slips/{brokerSlip}', [\App\Http\Controllers\Api\V1\BrokerSlipController::class, 'update']);
    Route::delete('/broker-slips/{brokerSlip}', [\App\Http\Controllers\Api\V1\BrokerSlipController::class, 'destroy']);
    Route::post('/broker-slips/{brokerSlip}/submit-for-review', [\App\Http\Controllers\Api\V1\BrokerSlipController::class, 'submitForReview']);
    Route::post('/broker-slips/{brokerSlip}/approve', [\App\Http\Controllers\Api\V1\BrokerSlipController::class, 'approve']);
    Route::post('/broker-slips/{brokerSlip}/request-changes', [\App\Http\Controllers\Api\V1\BrokerSlipController::class, 'requestChanges']);
    Route::post('/broker-slips/{brokerSlip}/issue', [\App\Http\Controllers\Api\V1\BrokerSlipController::class, 'issue']);
    Route::post('/broker-slips/{brokerSlip}/withdraw', [\App\Http\Controllers\Api\V1\BrokerSlipController::class, 'withdraw']);
    Route::post('/broker-slips/{brokerSlip}/versions', [\App\Http\Controllers\Api\V1\BrokerSlipController::class, 'createVersion']);

    // Invoices
    Route::get('/invoices', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'index']);
    Route::post('/invoices', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'store']);
    Route::get('/invoices/{invoice}', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'show']);
    Route::put('/invoices/{invoice}', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'update']);
    Route::delete('/invoices/{invoice}', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'destroy']);
    Route::get('/invoices/{invoice}/items', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'indexItems']);
    Route::post('/invoices/{invoice}/mark-as-sent', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'markAsSent']);
    Route::post('/invoices/{invoice}/mark-as-paid', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'markAsPaid']);
    Route::post('/invoices/{invoice}/void', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'void']);
    Route::post('/invoices/{invoice}/cancel', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'cancel']);

    // Insurance Companies
    Route::get('/insurance-companies', [\App\Http\Controllers\Api\V1\InsuranceCompanyController::class, 'index']);
    Route::post('/insurance-companies', [\App\Http\Controllers\Api\V1\InsuranceCompanyController::class, 'store']);
    Route::get('/insurance-companies/{insuranceCompany}', [\App\Http\Controllers\Api\V1\InsuranceCompanyController::class, 'show']);
    Route::put('/insurance-companies/{insuranceCompany}', [\App\Http\Controllers\Api\V1\InsuranceCompanyController::class, 'update']);
    Route::delete('/insurance-companies/{insuranceCompany}', [\App\Http\Controllers\Api\V1\InsuranceCompanyController::class, 'destroy']);
    Route::get('/insurance-companies/{insuranceCompany}/branches', [\App\Http\Controllers\Api\V1\InsuranceCompanyController::class, 'indexBranches']);
    Route::post('/insurance-companies/{insuranceCompany}/branches', [\App\Http\Controllers\Api\V1\InsuranceCompanyController::class, 'storeBranch']);
    Route::get('/insurance-companies/{insuranceCompany}/branches/{branch}', [\App\Http\Controllers\Api\V1\InsuranceCompanyController::class, 'showBranch']);
    Route::put('/insurance-companies/{insuranceCompany}/branches/{branch}', [\App\Http\Controllers\Api\V1\InsuranceCompanyController::class, 'updateBranch']);
    Route::delete('/insurance-companies/{insuranceCompany}/branches/{branch}', [\App\Http\Controllers\Api\V1\InsuranceCompanyController::class, 'destroyBranch']);
    Route::get('/insurance-companies/{insuranceCompany}/contacts', [\App\Http\Controllers\Api\V1\InsuranceCompanyController::class, 'indexContacts']);
    Route::post('/insurance-companies/{insuranceCompany}/contacts', [\App\Http\Controllers\Api\V1\InsuranceCompanyController::class, 'storeContact']);
    Route::get('/insurance-companies/{insuranceCompany}/contacts/{contact}', [\App\Http\Controllers\Api\V1\InsuranceCompanyController::class, 'showContact']);
    Route::put('/insurance-companies/{insuranceCompany}/contacts/{contact}', [\App\Http\Controllers\Api\V1\InsuranceCompanyController::class, 'updateContact']);
    Route::delete('/insurance-companies/{insuranceCompany}/contacts/{contact}', [\App\Http\Controllers\Api\V1\InsuranceCompanyController::class, 'destroyContact']);

    // Receipts
    Route::get('/receipts', [\App\Http\Controllers\Api\V1\ReceiptController::class, 'index']);
    Route::post('/receipts', [\App\Http\Controllers\Api\V1\ReceiptController::class, 'store']);
    Route::get('/receipts/{receipt}', [\App\Http\Controllers\Api\V1\ReceiptController::class, 'show']);
    Route::put('/receipts/{receipt}', [\App\Http\Controllers\Api\V1\ReceiptController::class, 'update']);
    Route::delete('/receipts/{receipt}', [\App\Http\Controllers\Api\V1\ReceiptController::class, 'destroy']);
    Route::post('/receipts/{receipt}/mark-as-completed', [\App\Http\Controllers\Api\V1\ReceiptController::class, 'markAsCompleted']);
    Route::post('/receipts/{receipt}/mark-as-refunded', [\App\Http\Controllers\Api\V1\ReceiptController::class, 'markAsRefunded']);
    Route::post('/receipts/{receipt}/void', [\App\Http\Controllers\Api\V1\ReceiptController::class, 'void']);
    Route::get('/receipts/{receipt}/allocations', [\App\Http\Controllers\Api\V1\ReceiptController::class, 'indexAllocations']);

    // Debit Notes
    Route::get('/debit-notes', [\App\Http\Controllers\Api\V1\DebitNoteController::class, 'index']);
    Route::post('/debit-notes', [\App\Http\Controllers\Api\V1\DebitNoteController::class, 'store']);
    Route::get('/debit-notes/{debitNote}', [\App\Http\Controllers\Api\V1\DebitNoteController::class, 'show']);
    Route::put('/debit-notes/{debitNote}', [\App\Http\Controllers\Api\V1\DebitNoteController::class, 'update']);
    Route::delete('/debit-notes/{debitNote}', [\App\Http\Controllers\Api\V1\DebitNoteController::class, 'destroy']);
    Route::post('/debit-notes/{debitNote}/issue', [\App\Http\Controllers\Api\V1\DebitNoteController::class, 'issue']);
    Route::post('/debit-notes/{debitNote}/mark-as-paid', [\App\Http\Controllers\Api\V1\DebitNoteController::class, 'markAsPaid']);
    Route::post('/debit-notes/{debitNote}/cancel', [\App\Http\Controllers\Api\V1\DebitNoteController::class, 'cancel']);

    // Credit Notes
    Route::get('/credit-notes', [\App\Http\Controllers\Api\V1\CreditNoteController::class, 'index']);
    Route::post('/credit-notes', [\App\Http\Controllers\Api\V1\CreditNoteController::class, 'store']);
    Route::get('/credit-notes/{creditNote}', [\App\Http\Controllers\Api\V1\CreditNoteController::class, 'show']);
    Route::put('/credit-notes/{creditNote}', [\App\Http\Controllers\Api\V1\CreditNoteController::class, 'update']);
    Route::delete('/credit-notes/{creditNote}', [\App\Http\Controllers\Api\V1\CreditNoteController::class, 'destroy']);
    Route::post('/credit-notes/{creditNote}/issue', [\App\Http\Controllers\Api\V1\CreditNoteController::class, 'issue']);
    Route::post('/credit-notes/{creditNote}/mark-as-paid', [\App\Http\Controllers\Api\V1\CreditNoteController::class, 'markAsPaid']);
    Route::post('/credit-notes/{creditNote}/cancel', [\App\Http\Controllers\Api\V1\CreditNoteController::class, 'cancel']);

    // Support Tickets
    Route::get('/support-tickets', [\App\Http\Controllers\Api\V1\SupportTicketController::class, 'index']);
    Route::post('/support-tickets', [\App\Http\Controllers\Api\V1\SupportTicketController::class, 'store']);
    Route::get('/support-tickets/{supportTicket}', [\App\Http\Controllers\Api\V1\SupportTicketController::class, 'show']);
    Route::put('/support-tickets/{supportTicket}', [\App\Http\Controllers\Api\V1\SupportTicketController::class, 'update']);
    Route::delete('/support-tickets/{supportTicket}', [\App\Http\Controllers\Api\V1\SupportTicketController::class, 'destroy']);
    Route::post('/support-tickets/{supportTicket}/assign', [\App\Http\Controllers\Api\V1\SupportTicketController::class, 'assign']);
    Route::post('/support-tickets/{supportTicket}/resolve', [\App\Http\Controllers\Api\V1\SupportTicketController::class, 'resolve']);
    Route::post('/support-tickets/{supportTicket}/close', [\App\Http\Controllers\Api\V1\SupportTicketController::class, 'close']);
    Route::post('/support-tickets/{supportTicket}/reopen', [\App\Http\Controllers\Api\V1\SupportTicketController::class, 'reopen']);

    // NAICOM Reports
    Route::get('/reports/naicom/{reportRun}', [\App\Http\Controllers\NaicomReportController::class, 'apiShow'])->name('api.reports.naicom.show');
});

// AI Assistant Routes
Route::prefix('v1/ai')->middleware('auth:sanctum')->group(function () {
    Route::post('/chat', [\App\Http\Controllers\Api\V1\AIAssistantController::class, 'chat']);
    Route::get('/conversations', [\App\Http\Controllers\Api\V1\AIAssistantController::class, 'conversations']);
    Route::get('/conversations/{id}', [\App\Http\Controllers\Api\V1\AIAssistantController::class, 'showConversation']);
    Route::delete('/conversations/{id}', [\App\Http\Controllers\Api\V1\AIAssistantController::class, 'deleteConversation']);
    Route::get('/approvals', [\App\Http\Controllers\Api\V1\AIAssistantController::class, 'approvals']);
    Route::post('/approvals/{id}/approve', [\App\Http\Controllers\Api\V1\AIAssistantController::class, 'approveAction']);
    Route::post('/approvals/{id}/reject', [\App\Http\Controllers\Api\V1\AIAssistantController::class, 'rejectAction']);
    Route::get('/suggestions', [\App\Http\Controllers\Api\V1\AIAssistantController::class, 'suggestions']);
});

// Public API V1 Routes (Server-to-Server, Protected by X-API-KEY) — Legacy compatibility
Route::prefix('v1')->middleware(\App\Http\Middleware\VerifyTenantApiKey::class)->group(function () {
    // Products
    Route::get('/products', [\App\Http\Controllers\Api\V1\ProductController::class, 'index']);
    Route::get('/products/{id}', [\App\Http\Controllers\Api\V1\ProductController::class, 'show']);

    // Quotes & Policies
    Route::post('/policies/quote', [\App\Http\Controllers\Api\V1\PolicyController::class, 'quote']);
    Route::post('/policies/issue', [\App\Http\Controllers\Api\V1\PolicyController::class, 'issue']);

    // Payments
    Route::post('/payments/initiate', [\App\Http\Controllers\Api\V1\PaymentController::class, 'initiate']);
});

// Widget API Routes (Client-side, Protected by X-Tenant-Key)
Route::prefix('v1/widget')->middleware(\App\Http\Middleware\VerifyWidgetAccess::class)->group(function () {
    // Products (Public info)
    Route::get('/products', [\App\Http\Controllers\Api\V1\ProductController::class, 'index']);
    Route::get('/products/{id}', [\App\Http\Controllers\Api\V1\ProductController::class, 'show']);

    // Quotes (Public calculation)
    Route::post('/policies/quote', [\App\Http\Controllers\Api\V1\PolicyController::class, 'quote']);

    // Payments
    Route::post('/payments/initiate', [\App\Http\Controllers\Api\V1\PaymentController::class, 'initiate']);
});

// Email Platform Routes
Route::prefix('v1/email')->middleware('auth:sanctum')->group(function () {
    // OAuth
    Route::get('/oauth/{provider}/redirect', [\App\Http\Controllers\Api\V1\EmailOAuthController::class, 'redirect']);
    Route::get('/oauth/{provider}/callback', [\App\Http\Controllers\Api\V1\EmailOAuthController::class, 'callback']);

    // Accounts
    Route::get('/accounts', [\App\Http\Controllers\Api\V1\EmailController::class, 'accounts']);
    Route::post('/accounts', [\App\Http\Controllers\Api\V1\EmailController::class, 'storeAccount']);
    Route::get('/accounts/{account}', [\App\Http\Controllers\Api\V1\EmailController::class, 'showAccount']);
    Route::patch('/accounts/{account}', [\App\Http\Controllers\Api\V1\EmailController::class, 'updateAccount']);
    Route::delete('/accounts/{account}', [\App\Http\Controllers\Api\V1\EmailController::class, 'deleteAccount']);
    Route::post('/accounts/{account}/sync', [\App\Http\Controllers\Api\V1\EmailController::class, 'syncAccount']);

    // Folders
    Route::get('/accounts/{account}/folders', [\App\Http\Controllers\Api\V1\EmailController::class, 'folders']);

    // Messages
    Route::get('/messages', [\App\Http\Controllers\Api\V1\EmailController::class, 'messages']);
    Route::get('/messages/{message}', [\App\Http\Controllers\Api\V1\EmailController::class, 'showMessage']);
    Route::post('/messages/{message}/read', [\App\Http\Controllers\Api\V1\EmailController::class, 'markRead']);
    Route::post('/messages/{message}/flag', [\App\Http\Controllers\Api\V1\EmailController::class, 'toggleFlag']);
    Route::post('/messages/{message}/move', [\App\Http\Controllers\Api\V1\EmailController::class, 'moveMessage']);
    Route::post('/messages/batch', [\App\Http\Controllers\Api\V1\EmailController::class, 'batchMessages']);

    // Attachments
    Route::get('/attachments/{attachment}/download', [\App\Http\Controllers\Api\V1\EmailController::class, 'downloadAttachment']);

    // Compose
    Route::post('/compose', [\App\Http\Controllers\Api\V1\EmailController::class, 'compose']);
    Route::post('/compose/reply/{message}', [\App\Http\Controllers\Api\V1\EmailController::class, 'replyMessage']);
    Route::post('/compose/forward/{message}', [\App\Http\Controllers\Api\V1\EmailController::class, 'forwardMessage']);

    // Signatures
    Route::get('/signatures', [\App\Http\Controllers\Api\V1\EmailController::class, 'signatures']);
    Route::post('/signatures', [\App\Http\Controllers\Api\V1\EmailController::class, 'storeSignature']);
    Route::delete('/signatures/{signature}', [\App\Http\Controllers\Api\V1\EmailController::class, 'deleteSignature']);

    // Templates
    Route::get('/templates', [\App\Http\Controllers\Api\V1\EmailController::class, 'templates']);
    Route::post('/templates', [\App\Http\Controllers\Api\V1\EmailController::class, 'storeTemplate']);
    Route::put('/templates/{template}', [\App\Http\Controllers\Api\V1\EmailController::class, 'updateTemplate']);
    Route::delete('/templates/{template}', [\App\Http\Controllers\Api\V1\EmailController::class, 'deleteTemplate']);

    // Search
    Route::get('/search', [\App\Http\Controllers\Api\V1\EmailController::class, 'search']);
});

// Webhooks (Paystack)
Route::post('/v1/payments/webhook/paystack', [\App\Http\Controllers\Api\V1\PaymentController::class, 'handleWebhook']);

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
