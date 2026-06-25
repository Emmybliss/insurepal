<x-mail::message>
# Password Reset Successful

Hello {{ $customer->type === 'corporate' ? $customer->company_name : $customer->first_name . ' ' . $customer->last_name }},

Your password has been successfully reset. Here are your new login credentials:

**Email:** {{ $customer->email }}  
**New Password:** {{ $temporaryPassword }}

For your security, please log in and change your password immediately after accessing your account.

<x-mail::button :url="route('login')">
Login to Your Account
</x-mail::button>

If you did not request this password reset, please contact support immediately.

Thanks,<br>
{{ isset($tenant) ? ($tenant->company_name ?? $tenant->name) : config('app.name') }}
</x-mail::message>
        