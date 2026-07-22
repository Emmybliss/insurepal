<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class NotificationSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email_notifications' => 'boolean',
            'sms_notifications' => 'boolean',
            'push_notifications' => 'boolean',
            'marketing_notifications' => 'boolean',
            'policy_expiry_notifications' => 'boolean',
            'payment_due_notifications' => 'boolean',
            'claim_status_notifications' => 'boolean',
            'system_maintenance_notifications' => 'boolean',
        ];
    }
}
