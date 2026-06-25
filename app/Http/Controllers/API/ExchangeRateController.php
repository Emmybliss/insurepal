<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\CurrencyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ExchangeRateController extends Controller
{
    public function getExchangeRate(Request $request, CurrencyService $currencyService)
    {

        $from = strtoupper($request->query('from', ''));
        $to = strtoupper($request->query('to', ''));

        if (! $from || ! $to) {
            return response()->json(['error' => 'Missing "from" or "to" currency.'], 400);
        }

        $cacheKey = "exchange_rate_{$from}_{$to}";
        $cacheDurationSeconds = 60 * 60 * 12; // 12 hours
        $memoryCacheDurationSeconds = 60 * 5;  // 5 minutes in-memory cache

        static $memoryCache = [];

        // Check in-memory cache first
        if (isset($memoryCache[$cacheKey])) {
            return response()->json(['rate' => $memoryCache[$cacheKey], 'source' => 'memory']);
        }

        try {
            // Try fetching fresh rate
            $rate = $currencyService->getExchangeRate($from, $to);

            if ($rate !== null) {
                // Store in both memory and persistent cache
                $memoryCache[$cacheKey] = $rate;
                Cache::put($cacheKey, $rate, $cacheDurationSeconds);

                return response()->json(['rate' => $rate, 'source' => 'fresh']);
            }

            // API returned null, fallback to persistent cache
            if (Cache::has($cacheKey)) {
                $cachedRate = Cache::get($cacheKey);
                // Update memory cache
                $memoryCache[$cacheKey] = $cachedRate;

                return response()->json(['rate' => $cachedRate, 'source' => 'cached']);
            }

            return response()->json(['error' => 'Could not fetch exchange rate.'], 500);

        } catch (\Exception $e) {
            // On exception, fallback to persistent cache
            if (Cache::has($cacheKey)) {
                $cachedRate = Cache::get($cacheKey);
                $memoryCache[$cacheKey] = $cachedRate;

                return response()->json(['rate' => $cachedRate, 'source' => 'cached']);
            }

            return response()->json(['error' => 'Could not fetch exchange rate.'], 500);
        }
    }
}
