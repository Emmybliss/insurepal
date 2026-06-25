<x-mail::message>
# Verify Your Email Address

Please click the button below to verify your email address.

<x-mail::button :url="$actionUrl">
Verify Email Address
</x-mail::button>

If you did not create an account, no further action is required.

Thanks,<br>
{{ isset($tenant) ? ($tenant->company_name ?? $tenant->name) : config('app.name') }}
</x-mail::message>
