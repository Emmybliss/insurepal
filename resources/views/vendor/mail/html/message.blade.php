<x-mail::layout>
    {{-- Header --}}
    <x-slot:header>
        <x-mail::header :url="isset($tenant) ? $tenant->website ?? config('app.url') : config('app.url')">
            @if (isset($tenant) && $tenant->logo)
                <img src="{{ asset('storage/' . $tenant->logo) }}" class="logo"
                    alt="{{ $tenant->company_name ?? $tenant->name }} Logo">
            @else
                {{ isset($tenant) ? ($tenant->company_name ?? $tenant->name) : config('app.name') }}
            @endif
        </x-mail::header>
    </x-slot:header>

    {{-- Body --}}
    {!! $slot !!}

    {{-- Subcopy --}}
    @isset($subcopy)
        <x-slot:subcopy>
            <x-mail::subcopy>
                {!! $subcopy !!}
            </x-mail::subcopy>
        </x-slot:subcopy>
    @endisset

    {{-- Footer --}}
    <x-slot:footer>
        <x-mail::footer>
            © {{ date('Y') }} {{ isset($tenant) ? ($tenant->company_name ?? $tenant->name) : config('app.name') }}.
            {{ __('All rights reserved.') }}
        </x-mail::footer>
    </x-slot:footer>
</x-mail::layout>