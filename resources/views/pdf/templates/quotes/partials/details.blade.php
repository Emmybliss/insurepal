<table class="modern-table" style="margin-top: 10px; margin-bottom: 10px; border: none;">
    <tbody>
        <tr>
            <td class="font-bold uppercase" style="width: 30%; border-bottom: none; padding: 6px 12px; vertical-align: top;">PREPARED FOR:</td>
            <td class="uppercase" style="width: 70%; border-bottom: none; padding: 6px 12px; vertical-align: top;">
                <strong>{{ $customer->display_name ?? $customer->company_name ?? ($customer->first_name . ' ' . $customer->last_name) ?? 'Valued Customer' }}</strong>
                @if(!empty($customer->address))
                    <div class="font-normal text-muted" style="margin-top: 2px; text-transform: none; line-height: 1.3;">{{ $customer->address }}</div>
                @endif
                @if(!empty($customer->email))
                    <div class="font-normal text-muted" style="margin-top: 2px; text-transform: none;">Email: {{ $customer->email }}</div>
                @endif
            </td>
        </tr>
        <tr>
            <td class="font-bold uppercase" style="border-bottom: none; padding: 6px 12px; vertical-align: top;">CLASS / PRODUCT:</td>
            <td class="uppercase" style="border-bottom: none; padding: 6px 12px; vertical-align: top;">
                {{ $quote->policyClass->name ?? $product->name ?? 'General Insurance Risk' }}
            </td>
        </tr>
        <tr>
            <td class="font-bold uppercase" style="border-bottom: none; padding: 6px 12px; vertical-align: top;">COVERAGE PERIOD:</td>
            <td class="uppercase" style="border-bottom: none; padding: 6px 12px; vertical-align: top;">
                @if(!empty($quote->period_start) && !empty($quote->period_end))
                    {{ $quote->period_start->format('jS F Y') }} TO {{ $quote->period_end->format('jS F Y') }}
                @else
                    12 MONTHS FROM INCEPTION
                @endif
            </td>
        </tr>
    </tbody>
</table>
