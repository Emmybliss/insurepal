<table class="modern-table" style="margin-top: 10px; margin-bottom: 5px; border: none;">
    <tbody>
        <tr>
            <td class="font-bold uppercase " style="width: 30%; border-bottom: none; padding: 6px 12px; vertical-align: top; ">TO:</td>
            <td class=" uppercase " style="width: 70%; border-bottom: none; padding: 6px 12px; vertical-align: top;">
                {{ $insurer->name ?? 'TBA' }}
                @if(!empty($insurer->address))
                    <div class="font-normal text-muted" style="margin-top: 2px; text-transform: none; line-height: 1.3;">{{ $insurer->address }}</div>
                @endif
            </td>
        </tr>
        <tr>
            <td class="font-bold uppercase " style="border-bottom: none; padding: 6px 12px; vertical-align: top;">INSURED:</td>
            <td class=" uppercase " style="border-bottom: none; padding: 6px 12px; vertical-align: top;">
                {{ $customer->display_name ?? 'N/A' }}
                @if(!empty($customer->address))
                    <div class="font-normal text-muted" style=" margin-top: 2px; text-transform: none; line-height: 1.3;">{{ $customer->address }}</div>
                @endif
            </td>
        </tr>
        <tr>
            <td class="font-bold uppercase " style="border-bottom: none; padding: 6px 12px; vertical-align: top;">CLASS OF BUSINESS:</td>
            <td class=" uppercase" style="border-bottom: none; padding: 6px 12px; vertical-align: top;">{{ $placement->policyClass->name ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td class="font-bold uppercase " style="border-bottom: none; padding: 6px 12px; vertical-align: top;">PERIOD:</td>
            <td class=" uppercase" style="border-bottom: none; padding: 6px 12px; vertical-align: top;">
                @if(!empty($placement->proposed_start_date) && !empty($placement->proposed_end_date))
                    {{ $placement->proposed_start_date->format('jS F Y') }} TO {{ $placement->proposed_end_date->format('jS F Y') }}
                @else
                    N/A
                @endif
            </td>
        </tr>
    </tbody>
</table>
