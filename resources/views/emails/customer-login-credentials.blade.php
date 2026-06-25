<x-mail::message>
# Welcome to {{ isset($tenant) ? ($tenant->company_name ?? $tenant->name) : config('app.name') }}

Hello {{ $customer->type === 'corporate' ? $customer->company_name : $customer->first_name . ' ' . $customer->last_name }},

Your customer portal account has been successfully created. Here are your login credentials:

**Email:** {{ $customer->email }}  
**Temporary Password:** {{ $temporaryPassword }}

For your security, please log in and change your password immediately after accessing your account.

<x-mail::button :url="route('login')">
Login to Your Account
</x-mail::button>

If you have any questions, please contact support.

Thanks,<br>
{{ isset($tenant) ? ($tenant->company_name ?? $tenant->name) : config('app.name') }}
</x-mail::message>
