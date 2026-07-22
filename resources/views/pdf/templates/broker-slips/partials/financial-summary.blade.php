<table class="modern-table" style="margin-top: 10px; margin-bottom: 10px; border: none;">
    <tbody>
        <tr>
            <td class="font-bold uppercase " style="width: 30%; border-bottom: none; padding: 6px 12px; vertical-align: middle; ">TOTAL VALUE:</td>
            <td class="font-bold " style="width: 70%; border-bottom: none; padding: 6px 12px; vertical-align: middle; text-align: right;">{{ number_format($slip->sum_insured ?? 0, 2) }}</td>
        </tr>
        @if($slip->rate)
        <tr>
            <td class="font-bold uppercase " style="border-bottom: none; padding: 6px 12px; vertical-align: middle;">RATE:</td>
            <td class="font-bold " style="border-bottom: none; padding: 6px 12px; vertical-align: middle; text-align: right;">{{ $slip->rate ? (float)$slip->rate . ($slip->rate_basis === 'percentage' ? '%' : ($slip->rate_basis === 'per_mille' ? '‰' : ($slip->rate_basis ? ' ' . str_replace('_', ' ', $slip->rate_basis) : ''))) : '-' }}</td>
        </tr>
        @endif
        <tr>
            <td class="font-bold uppercase " style="border-bottom: none; padding: 6px 12px; vertical-align: middle;">GROSS PREMIUM:</td>
            <td class="font-bold " style="border-bottom: none; padding: 6px 12px; vertical-align: middle; text-align: right;">{{ number_format($slip->gross_premium ?? 0, 2) }}</td>
        </tr>
        @if(($slip->commission_amount ?? 0) > 0)
            <tr>
                <td class="font-bold uppercase " style="border-bottom: none; padding: 6px 12px; vertical-align: middle;">LESS {{ $slip->commission_rate }}% COMM:</td>
                <td class="" style="border-bottom: none; padding: 6px 12px; vertical-align: middle; text-align: right;">{{ number_format($slip->commission_amount, 2) }}</td>
            </tr>
        @endif
        @if(($slip->taxes ?? 0) > 0)
            <tr>
                <td class="font-bold uppercase " style="border-bottom: none; padding: 6px 12px; vertical-align: middle;">LESS {{ $slip->tax_rate ?? '' }}% TAXES:</td>
                <td class="" style="border-bottom: none; padding: 6px 12px; vertical-align: middle; text-align: right;">{{ number_format($slip->taxes, 2) }}</td>
            </tr>
        @endif
        @if(($slip->fees ?? 0) > 0)
            <tr>
                <td class="font-bold uppercase " style="border-bottom: none; padding: 6px 12px; vertical-align: middle;">FEES:</td>
                <td class="" style="border-bottom: none; padding: 6px 12px; vertical-align: middle; text-align: right;">{{ number_format($slip->fees, 2) }}</td>
            </tr>
        @endif
        <tr class="bg-light" style="border-top: 1px solid var(--border-color); border-bottom: 2px solid #000">
            <td class="font-bold uppercase " style="padding: 10px 12px; font-size: 12px; vertical-align: middle;">NET PREMIUM:</td>
            <td class="font-bold " style="padding: 10px 12px; font-size: 13px; vertical-align: middle; text-align: right;">
                {{ number_format($slip->net_premium > 0 ? $slip->net_premium : max($slip->gross_premium, 0), 2) }}
            </td>
        </tr>
    </tbody>
</table>