<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class CurrencyService
{
    protected $apiKey;

    protected $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.exchangerate.api_key');
        $this->baseUrl = 'https://v6.exchangerate-api.com/v6/';
    }

    public function getExchangeRate(string $from, string $to): ?float
    {
        $response = Http::get($this->baseUrl.$this->apiKey.'/pair/'.$from.'/'.$to);

        if ($response->successful() && $response->json('result') === 'success') {
            return $response->json('conversion_rate');
        }

        return null;
    }
}
