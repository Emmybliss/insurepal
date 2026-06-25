<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationSettingsController extends Controller
{
    /**
     * Show the notification settings page.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $settings = $user->settings ?? [];

        // Get user's notification preferences from settings
        $notificationPreferences = [
            'email_notifications' => $settings['email_notifications'] ?? true,
            'sms_notifications' => $settings['sms_notifications'] ?? false,
            'push_notifications' => $settings['push_notifications'] ?? true,
            'marketing_notifications' => $settings['marketing_notifications'] ?? false,
            'policy_expiry_notifications' => $settings['policy_expiry_notifications'] ?? true,
            'payment_due_notifications' => $settings['payment_due_notifications'] ?? true,
            'claim_status_notifications' => $settings['claim_status_notifications'] ?? true,
            'system_maintenance_notifications' => $settings['system_maintenance_notifications'] ?? true,
        ];

        return Inertia::render('settings/notifications', [
            'notification_preferences' => $notificationPreferences,
        ]);
    }

    /**
     * Update the user's notification preferences.
     */
    public function update(Request $request)
    {
        $request->validate([
            'email_notifications' => 'boolean',
            'sms_notifications' => 'boolean',
            'push_notifications' => 'boolean',
            'marketing_notifications' => 'boolean',
            'policy_expiry_notifications' => 'boolean',
            'payment_due_notifications' => 'boolean',
            'claim_status_notifications' => 'boolean',
            'system_maintenance_notifications' => 'boolean',
        ]);

        $user = $request->user();
        $settings = $user->settings ?? [];

        // Update notification preferences in settings
        $settings['email_notifications'] = $request->boolean('email_notifications');
        $settings['sms_notifications'] = $request->boolean('sms_notifications');
        $settings['push_notifications'] = $request->boolean('push_notifications');
        $settings['marketing_notifications'] = $request->boolean('marketing_notifications');
        $settings['policy_expiry_notifications'] = $request->boolean('policy_expiry_notifications');
        $settings['payment_due_notifications'] = $request->boolean('payment_due_notifications');
        $settings['claim_status_notifications'] = $request->boolean('claim_status_notifications');
        $settings['system_maintenance_notifications'] = $request->boolean('system_maintenance_notifications');

        $user->update(['settings' => $settings]);

        return redirect()->route('settings.notifications')
            ->with('success', 'Notification preferences updated successfully.');
    }
}
