<?php

namespace App\Http\Controllers;

use App\Models\Policy;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RenewalController extends Controller
{
    /**
     * Display a listing of policy renewals.
     */
    public function index(Request $request): Response
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        $tenantId = $user->tenant_id;

        // If the logged-in user is a customer, scope to their own policies only
        $customerScope = null;
        if ($user->hasRole('customer')) {
            $customerScope = \App\Models\Customer::where('user_id', $user->id)->value('id');
        }

        $query = Policy::query()
            ->where('tenant_id', $tenantId)
            ->when($customerScope, fn ($q) => $q->where('customer_id', $customerScope))
            ->with(['customer', 'quote', 'policyClass', 'tenant'])
            ->whereIn('status', ['active', 'expired']);

        // Filter by renewal status
        switch ($request->get('filter', 'all')) {
            case 'upcoming':
                $query->where('expiry_date', '>=', now())
                    ->where('expiry_date', '<=', now()->addDays(60))
                    ->orderBy('expiry_date', 'asc');
                break;
            case 'overdue':
                $query->where('expiry_date', '<', now())
                    ->whereNull('renewed_at')
                    ->orderBy('expiry_date', 'desc');
                break;
            case 'renewed':
                $query->whereNotNull('renewed_at')
                    ->orderBy('renewed_at', 'desc');
                break;
            case 'all':
                $query->orderBy('expiry_date', 'asc');
                break;
        }

        // Search functionality
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('policy_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($q) use ($search) {
                        $q->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $renewals = $query->paginate(15)->withQueryString();

        // Build a base stats query scoped to tenant (and customer if applicable)
        $statsBase = Policy::where('tenant_id', $tenantId)
            ->when($customerScope, fn ($q) => $q->where('customer_id', $customerScope));

        $stats = [
            'upcoming_count' => (clone $statsBase)->where('status', 'active')
                ->where('expiry_date', '>=', now())
                ->where('expiry_date', '<=', now()->addDays(60))
                ->count(),
            'overdue_count' => (clone $statsBase)->whereIn('status', ['active', 'expired'])
                ->where('expiry_date', '<', now())
                ->whereNull('renewed_at')
                ->count(),
            'renewed_this_month' => (clone $statsBase)->whereNotNull('renewed_at')
                ->whereMonth('renewed_at', now()->month)
                ->whereYear('renewed_at', now()->year)
                ->count(),
            'total_active' => (clone $statsBase)->whereIn('status', ['active', 'expired'])->count(),
        ];

        return Inertia::render('Renewals/Index', [
            'renewals' => $renewals,
            'stats' => $stats,
            'filters' => [
                'search' => $request->search,
                'filter' => $request->get('filter', 'all'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new renewal.
     */
    public function create(): Response
    {
        return Inertia::render('Renewals/Create');
    }

    /**
     * Store a newly created renewal in storage.
     */
    public function store(Request $request)
    {
        // This would typically handle bulk renewal operations
        return redirect()->route('renewals.index')
            ->with('success', 'Renewal processed successfully.');
    }

    /**
     * Display the specified renewal.
     */
    public function show(Policy $policy): Response
    {
        $policy->load(['customer', 'quote', 'policyClass', 'tenant', 'debitNotes']);

        return Inertia::render('Renewals/Show', [
            'policy' => $policy,
            'renewalHistory' => $this->getRenewalHistory($policy),
        ]);
    }

    /**
     * Show the form for editing the specified renewal.
     */
    public function edit(Policy $policy): Response
    {
        $policy->load(['customer', 'quote', 'policyClass']);

        return Inertia::render('Renewals/Edit', [
            'policy' => $policy,
        ]);
    }

    /**
     * Update the specified renewal in storage.
     */
    public function update(Request $request, Policy $policy)
    {
        $validated = $request->validate([
            'expiry_date' => 'required|date|after:today',
            'premium_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $policy->update($validated);

        return redirect()->route('renewals.index')
            ->with('success', 'Renewal updated successfully.');
    }

    /**
     * Remove the specified renewal from storage.
     */
    public function destroy(Policy $policy)
    {
        // Typically this would cancel a renewal
        $policy->update(['status' => 'cancelled']);

        return redirect()->route('renewals.index')
            ->with('success', 'Renewal cancelled successfully.');
    }

    /**
     * Process renewal for a specific policy
     */
    public function processRenewal(Request $request, Policy $policy)
    {
        $validated = $request->validate([
            'new_expiry_date' => 'required|date|after:today',
            'new_premium' => 'required|numeric|min:0',
            'renewal_notes' => 'nullable|string',
        ]);

        // Create renewal record
        $policy->update([
            'renewed_at' => now(),
            'expiry_date' => $validated['new_expiry_date'],
            'premium_amount' => $validated['new_premium'],
            'notes' => $validated['renewal_notes'],
        ]);

        return redirect()->route('renewals.show', $policy)
            ->with('success', 'Policy renewed successfully.');
    }

    /**
     * Send renewal reminders
     */
    public function sendReminders(Request $request)
    {
        $policies = Policy::where('status', 'active')
            ->where('expiry_date', '>=', now())
            ->where('expiry_date', '<=', now()->addDays(30))
            ->whereNull('renewed_at')
            ->with(['customer', 'tenant'])
            ->get();

        // Here you would send actual renewal reminders via email/SMS
        // This is a placeholder for the actual implementation

        return redirect()->route('renewals.index')
            ->with('success', "Sent renewal reminders to {$policies->count()} customers.");
    }

    public function sendNotice(Request $request, Policy $policy)
    {
        $request->validate([
            'channel' => 'required|in:email,sms,portal',
        ]);

        if ($policy->tenant_id !== \Illuminate\Support\Facades\Auth::user()->tenant_id) {
            abort(403);
        }

        $policy->loadMissing(['customer', 'tenant', 'policyClass']);

        if ($request->channel === 'email' && empty($policy->customer?->email)) {
            return redirect()->back()->with('error', 'Cannot send email: customer has no email address on file.');
        }

        $noticeType = $policy->isExpired() ? 'expired' : 'expiring';
        $isSuccessful = true;
        $errorMessage = null;
        $smsService = app(\App\Services\SmsService::class);

        if ($request->channel === 'sms') {
            $recipient = $policy->customer?->phone ?? 'unknown';
            $isSuccessful = $smsService->sendRenewalNotice($policy, $noticeType);
            $errorMessage = $isSuccessful ? null : 'SMS delivery failed';

            if ($isSuccessful) {
                return redirect()->back()->with('success', "SMS notification sent successfully to {$recipient}.");
            }

            return redirect()->back()->with('error', 'Failed to send notification: '.$errorMessage);
        }

        if ($request->channel === 'portal') {
            $title = $noticeType === 'expired' ? 'Policy Expired' : 'Policy Expiring Soon';
            $expiryFormatted = $policy->expiry_date ? \Carbon\Carbon::parse($policy->expiry_date)->format('M d, Y') : 'N/A';
            $message = $noticeType === 'expired'
                ? "Your policy {$policy->policy_number} expired on {$expiryFormatted}."
                : "Your policy {$policy->policy_number} expires on {$expiryFormatted}.";

            \App\Models\Notification::createForUser(
                $policy->customer->user,
                'renewal_reminder',
                $title,
                $message,
                [
                    'policy_id' => $policy->id,
                    'policy_number' => $policy->policy_number,
                    'channel' => 'portal',
                    'url' => route('renewals.show', $policy->id),
                ],
                'high'
            );

            \App\Models\PolicyNotificationLog::create([
                'tenant_id' => $policy->tenant_id,
                'policy_id' => $policy->id,
                'channel' => 'portal',
                'recipient' => (string) $policy->customer->id,
                'is_successful' => true,
                'error_message' => null,
                'notice_type' => $noticeType,
            ]);

            return redirect()->back()->with('success', 'Portal notification sent successfully.');
        }

        try {
            $policy->customer->notify(
                new \App\Notifications\PolicyRenewalNotice($policy, $noticeType, $request->channel)
            );
        } catch (\Symfony\Component\Mailer\Exception\TransportException $e) {
            $isSuccessful = false;
            $errorMessage = 'Mail transport error: '.$e->getMessage();
            \Illuminate\Support\Facades\Log::error("[RenewalNotice] SMTP transport error for policy {$policy->policy_number}: {$e->getMessage()}");
        } catch (\Exception $e) {
            $isSuccessful = false;
            $errorMessage = $e->getMessage();
            \Illuminate\Support\Facades\Log::error("[RenewalNotice] Failed to send {$request->channel} notice for policy {$policy->policy_number}: {$e->getMessage()}");
        }

        $recipient = match ($request->channel) {
            'email' => $policy->customer?->email ?? 'unknown',
            default => (string) ($policy->customer?->id ?? 'unknown'),
        };

        \App\Models\PolicyNotificationLog::create([
            'tenant_id' => $policy->tenant_id,
            'policy_id' => $policy->id,
            'channel' => $request->channel,
            'recipient' => $recipient,
            'is_successful' => $isSuccessful,
            'error_message' => $errorMessage,
            'notice_type' => $noticeType,
        ]);

        if ($isSuccessful) {
            $channelLabel = ucfirst($request->channel);

            return redirect()->back()->with('success', "{$channelLabel} notification sent successfully to {$recipient}.");
        }

        return redirect()->back()->with('error', 'Failed to send notification: '.$errorMessage);
    }

    public function sendNoticeToAllChannels(Policy $policy)
    {
        if ($policy->tenant_id !== \Illuminate\Support\Facades\Auth::user()->tenant_id) {
            abort(403);
        }

        $policy->loadMissing(['customer', 'tenant', 'policyClass']);

        $noticeType = $policy->isExpired() ? 'expired' : 'expiring';
        $channelsSent = [];
        $failedChannels = [];
        $smsService = app(\App\Services\SmsService::class);

        // Email
        if (! empty($policy->customer?->email)) {
            try {
                $policy->customer->notify(
                    new \App\Notifications\PolicyRenewalNotice($policy, $noticeType, 'email')
                );
                $channelsSent[] = 'email';
                \App\Models\PolicyNotificationLog::create([
                    'tenant_id' => $policy->tenant_id,
                    'policy_id' => $policy->id,
                    'channel' => 'email',
                    'recipient' => $policy->customer?->email,
                    'is_successful' => true,
                    'error_message' => null,
                    'notice_type' => $noticeType,
                ]);
            } catch (\Exception $e) {
                $failedChannels[] = 'email';
                \App\Models\PolicyNotificationLog::create([
                    'tenant_id' => $policy->tenant_id,
                    'policy_id' => $policy->id,
                    'channel' => 'email',
                    'recipient' => $policy->customer?->email,
                    'is_successful' => false,
                    'error_message' => $e->getMessage(),
                    'notice_type' => $noticeType,
                ]);
            }
        }

        // SMS
        if (! empty($policy->customer?->phone)) {
            $isSuccessful = $smsService->sendRenewalNotice($policy, $noticeType);
            if ($isSuccessful) {
                $channelsSent[] = 'sms';
            } else {
                $failedChannels[] = 'sms';
            }
            \App\Models\PolicyNotificationLog::create([
                'tenant_id' => $policy->tenant_id,
                'policy_id' => $policy->id,
                'channel' => 'sms',
                'recipient' => $policy->customer?->phone,
                'is_successful' => $isSuccessful,
                'error_message' => $isSuccessful ? null : 'SMS delivery failed',
                'notice_type' => $noticeType,
            ]);
        }

        // Portal
        $expiryFormatted = $policy->expiry_date ? \Carbon\Carbon::parse($policy->expiry_date)->format('M d, Y') : 'N/A';
        $title = $noticeType === 'expired' ? 'Policy Expired' : 'Policy Expiring Soon';
        $message = $noticeType === 'expired'
            ? "Your policy {$policy->policy_number} expired on {$expiryFormatted}."
            : "Your policy {$policy->policy_number} expires on {$expiryFormatted}.";

        \App\Models\Notification::createForUser(
            $policy->customer->user,
            'renewal_reminder',
            $title,
            $message,
            [
                'policy_id' => $policy->id,
                'policy_number' => $policy->policy_number,
                'channel' => 'portal',
                'url' => route('renewals.show', $policy->id),
            ],
            'high'
        );

        \App\Models\PolicyNotificationLog::create([
            'tenant_id' => $policy->tenant_id,
            'policy_id' => $policy->id,
            'channel' => 'portal',
            'recipient' => (string) $policy->customer->id,
            'is_successful' => true,
            'error_message' => null,
            'notice_type' => $noticeType,
        ]);
        $channelsSent[] = 'portal';

        if (empty($channelsSent)) {
            return redirect()->back()->with('error', 'Cannot send notifications: customer has no contact details.');
        }

        $message = 'Notifications queued for: '.implode(', ', array_map('ucfirst', $channelsSent));
        if (! empty($failedChannels)) {
            $message .= '. Failed: '.implode(', ', array_map('ucfirst', $failedChannels));
        }

        return redirect()->back()->with('success', $message);
    }

    public function clearNotificationLogs(Policy $policy)
    {
        if ($policy->tenant_id !== \Illuminate\Support\Facades\Auth::user()->tenant_id) {
            abort(403);
        }

        $count = \App\Models\PolicyNotificationLog::where('policy_id', $policy->id)->delete();

        return redirect()->back()->with('success', "Cleared {$count} notification logs.");
    }

    public function toggleAutoRenewal(Policy $policy)
    {
        if ($policy->tenant_id !== \Illuminate\Support\Facades\Auth::user()->tenant_id) {
            abort(403);
        }

        $policy->update([
            'auto_renewal_notification' => ! $policy->auto_renewal_notification,
        ]);

        return redirect()->back()->with('success', 'Auto-renewal notification updated successfully.');
    }

    private function getRenewalHistory(Policy $policy)
    {
        return [
            'renewals' => [],
            'reminders_sent' => \App\Models\PolicyNotificationLog::where('policy_id', $policy->id)->orderBy('created_at', 'desc')->limit(5)->get(),
            'payments' => [],
        ];
    }
}
