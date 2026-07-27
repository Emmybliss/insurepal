<?php

test('qr code and barcode media endpoints are publicly accessible without 403', function () {
    $qrResponse = $this->get(route('media.qrcode', ['data' => urlencode('https://example.com/verify')]));
    $qrResponse->assertStatus(200);
    $qrResponse->assertHeader('Content-Type', 'image/png');

    $barcodeResponse = $this->get(route('media.barcode', ['data' => urlencode('TEST-12345')]));
    $barcodeResponse->assertStatus(200);
    $barcodeResponse->assertHeader('Content-Type', 'image/png');
});

test('certificate verify endpoint is publicly accessible', function () {
    $response = $this->get(route('certificates.verify', ['certificateNumber' => 'NON-EXISTENT-CERT']));
    $response->assertStatus(200);
});
