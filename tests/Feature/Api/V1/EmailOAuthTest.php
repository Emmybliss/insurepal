<?php

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create(['status' => 'active']);
    app()->instance('tenant', $this->tenant);

    $this->user = User::factory()->create([
        'tenant_id' => $this->tenant->id,
        'is_active' => true,
    ]);

    $this->token = $this->user->createToken('test-token')->plainTextToken;
    $this->withHeader('Authorization', "Bearer {$this->token}");

    Config::set('email.oauth.gmail.client_id', 'test-gmail-client-id');
    Config::set('email.oauth.gmail.client_secret', 'test-gmail-secret');
    Config::set('email.oauth.gmail.redirect_uri', 'http://localhost/api/v1/email/oauth/gmail/callback');
    Config::set('email.oauth.microsoft365.client_id', 'test-ms-client-id');
    Config::set('email.oauth.microsoft365.client_secret', 'test-ms-secret');
    Config::set('email.oauth.microsoft365.redirect_uri', 'http://localhost/api/v1/email/oauth/microsoft/callback');

    Queue::fake();
});

// ─── Redirect ───

test('redirect returns gmail authorization url', function () {
    $response = $this->getJson('/api/v1/email/oauth/gmail/redirect');

    $response->assertOk()
        ->assertJsonStructure(['success', 'data' => ['authorization_url']]);

    $url = $response->json('data.authorization_url');
    expect($url)->toStartWith('https://accounts.google.com/o/oauth2/v2/auth');
    expect($url)->toContain('client_id=test-gmail-client-id');
    expect($url)->toContain('access_type=offline');
});

test('redirect returns microsoft authorization url', function () {
    $response = $this->getJson('/api/v1/email/oauth/microsoft365/redirect');

    $response->assertOk();
    $url = $response->json('data.authorization_url');
    expect($url)->toStartWith('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    expect($url)->toContain('client_id=test-ms-client-id');
});

test('redirect rejects unsupported provider', function () {
    $response = $this->getJson('/api/v1/email/oauth/yahoo/redirect');

    $response->assertStatus(400);
});

test('redirect requires authentication', function () {
    $this->withoutHeader('Authorization');

    $response = $this->getJson('/api/v1/email/oauth/gmail/redirect');

    $response->assertStatus(401);
});

// ─── Gmail Callback ───

test('gmail callback creates account', function () {
    Http::fake([
        'oauth2.googleapis.com/token' => Http::response([
            'access_token' => 'mock-access-token',
            'refresh_token' => 'mock-refresh-token',
            'expires_in' => 3600,
        ]),
        'www.googleapis.com/oauth2/v2/userinfo' => Http::response([
            'email' => 'test@gmail.com',
            'name' => 'Test User',
        ]),
    ]);

    $response = $this->getJson('/api/v1/email/oauth/gmail/callback?code=mock-auth-code');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Account connected successfully')
        ->assertJsonStructure(['data' => ['id', 'email', 'provider', 'is_active']]);

    expect($response->json('data.email'))->toBe('test@gmail.com');
    expect($response->json('data.provider'))->toBe('gmail');
});

test('gmail callback fails if token exchange fails', function () {
    Http::fake([
        'oauth2.googleapis.com/token' => Http::response(null, 400),
    ]);

    $response = $this->getJson('/api/v1/email/oauth/gmail/callback?code=mock-auth-code');

    $response->assertStatus(400);
});

// ─── Microsoft Callback ───

test('microsoft365 callback creates account', function () {
    Http::fake([
        'login.microsoftonline.com/*' => Http::response([
            'access_token' => 'mock-ms-access-token',
            'refresh_token' => 'mock-ms-refresh-token',
            'expires_in' => 3600,
        ]),
        'graph.microsoft.com/v1.0/me' => Http::response([
            'mail' => 'user@company.com',
            'displayName' => 'User Name',
        ]),
    ]);

    $response = $this->getJson('/api/v1/email/oauth/microsoft365/callback?code=mock-ms-code');

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('message', 'Account connected successfully');

    expect($response->json('data.email'))->toBe('user@company.com');
    expect($response->json('data.provider'))->toBe('microsoft365');
});

// ─── Callback Validation ───

test('callback rejects unsupported provider', function () {
    $response = $this->getJson('/api/v1/email/oauth/yahoo/callback?code=test');

    $response->assertStatus(400);
});

test('callback requires authentication', function () {
    $this->withoutHeader('Authorization');

    $response = $this->getJson('/api/v1/email/oauth/gmail/callback?code=test');

    $response->assertStatus(401);
});

// ─── Tenant Isolation ───

test('oauth account belongs to authenticated users tenant', function () {
    Http::fake([
        'oauth2.googleapis.com/token' => Http::response([
            'access_token' => 'mock-token',
            'refresh_token' => 'mock-refresh',
            'expires_in' => 3600,
        ]),
        'www.googleapis.com/oauth2/v2/userinfo' => Http::response([
            'email' => 'tenant@test.com',
            'name' => 'Tenant User',
        ]),
    ]);

    $response = $this->getJson('/api/v1/email/oauth/gmail/callback?code=test');

    expect($response->json('data.tenant_id'))->toBe($this->tenant->id);
});
