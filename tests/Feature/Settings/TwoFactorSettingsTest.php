<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PragmaRX\Google2FA\Google2FA;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create([
        'is_active' => true,
    ]);
});

// ─── View 2FA Page ───

test('can view two factor settings page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('settings.two-factor'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('settings/two-factor')
        ->where('enabled', false)
        ->where('confirming', false)
        ->where('isOAuthUser', false)
    );
});

test('shows confirming state when 2fa secret is set but not confirmed', function () {
    $this->user->forceFill([
        'two_factor_secret' => encrypt('test-secret'),
        'two_factor_recovery_codes' => encrypt(json_encode(['code1', 'code2'])),
        'two_factor_confirmed_at' => null,
    ])->save();

    $this->actingAs($this->user);

    $response = $this->get(route('settings.two-factor'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('enabled', false)
        ->where('confirming', true)
        ->has('qrCodeSvg')
    );
});

test('shows recovery codes when 2fa is enabled', function () {
    $this->user->forceFill([
        'two_factor_secret' => encrypt('test-secret'),
        'two_factor_recovery_codes' => encrypt(json_encode(['code1', 'code2'])),
        'two_factor_confirmed_at' => now(),
    ])->save();

    $this->actingAs($this->user);

    $response = $this->get(route('settings.two-factor'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('enabled', true)
        ->where('confirming', false)
        ->has('recoveryCodes')
    );
});

test('shows oauth user state on two factor page', function () {
    $this->user->forceFill(['provider_id' => 'google|12345'])->save();

    $this->actingAs($this->user);

    $response = $this->get(route('settings.two-factor'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('isOAuthUser', true)
    );
});

// ─── Initialize 2FA (Store) ───

test('can initialize 2fa setup', function () {
    $this->actingAs($this->user);

    $response = $this->from(route('settings.two-factor'))->post(route('two-factor.store'));

    $response->assertRedirect(route('settings.two-factor'));

    $this->user->refresh();
    expect($this->user->two_factor_secret)->not->toBeNull();
    expect($this->user->two_factor_recovery_codes)->not->toBeNull();
    expect($this->user->two_factor_confirmed_at)->toBeNull();
});

test('blocks oauth users from setting up 2fa', function () {
    $this->user->forceFill(['provider_id' => 'google|12345'])->save();

    $this->actingAs($this->user);

    $response = $this->from(route('settings.two-factor'))->post(route('two-factor.store'));

    $response->assertRedirect(route('settings.two-factor'));
    $response->assertSessionHasErrors(['error']);
});

// ─── Confirm 2FA ───

test('can confirm 2fa with valid code', function () {
    $google2fa = new Google2FA;
    $secret = $google2fa->generateSecretKey();
    $this->user->forceFill([
        'two_factor_secret' => encrypt($secret),
        'two_factor_recovery_codes' => encrypt(json_encode(['code1', 'code2'])),
        'two_factor_confirmed_at' => null,
    ])->save();

    $validCode = $google2fa->getCurrentOtp($secret);

    $this->actingAs($this->user);

    $response = $this->from(route('settings.two-factor'))->post(route('two-factor.confirm'), [
        'code' => $validCode,
    ]);

    $response->assertRedirect(route('settings.two-factor'));
    $response->assertSessionHas('status');

    $this->user->refresh();
    expect($this->user->two_factor_confirmed_at)->not->toBeNull();
});

test('cannot confirm 2fa with invalid code', function () {
    $secret = (new Google2FA)->generateSecretKey();
    $this->user->forceFill([
        'two_factor_secret' => encrypt($secret),
        'two_factor_recovery_codes' => encrypt(json_encode(['code1', 'code2'])),
        'two_factor_confirmed_at' => null,
    ])->save();

    $this->actingAs($this->user);

    $response = $this->from(route('settings.two-factor'))->post(route('two-factor.confirm'), [
        'code' => '000000',
    ]);

    $response->assertRedirect(route('settings.two-factor'));
    $response->assertSessionHasErrors(['code']);
});

test('cannot confirm 2fa when no secret is set', function () {
    $this->actingAs($this->user);

    $response = $this->from(route('settings.two-factor'))->post(route('two-factor.confirm'), [
        'code' => '123456',
    ]);

    $response->assertRedirect(route('settings.two-factor'));
    $response->assertSessionHasErrors(['code']);
});

test('validates confirm code is required', function () {
    $this->actingAs($this->user);

    $response = $this->from(route('settings.two-factor'))->post(route('two-factor.confirm'), []);

    $response->assertRedirect(route('settings.two-factor'));
    $response->assertSessionHasErrors(['code']);
});

// ─── Disable 2FA (Destroy) ───

test('can disable 2fa with correct password', function () {
    $this->user->forceFill([
        'two_factor_secret' => encrypt('test-secret'),
        'two_factor_recovery_codes' => encrypt(json_encode(['code1'])),
        'two_factor_confirmed_at' => now(),
    ])->save();

    $this->actingAs($this->user);

    $response = $this->from(route('settings.two-factor'))->delete(route('two-factor.destroy'), [
        'password' => 'password',
    ]);

    $response->assertRedirect(route('settings.two-factor'));
    $response->assertSessionHas('status');

    $this->user->refresh();
    expect($this->user->two_factor_secret)->toBeNull();
    expect($this->user->two_factor_recovery_codes)->toBeNull();
    expect($this->user->two_factor_confirmed_at)->toBeNull();
});

test('validates password is required to disable 2fa', function () {
    $this->actingAs($this->user);

    $response = $this->from(route('settings.two-factor'))->delete(route('two-factor.destroy'), []);

    $response->assertRedirect(route('settings.two-factor'));
    $response->assertSessionHasErrors(['password']);
});

test('requires correct password to disable 2fa', function () {
    $this->user->forceFill([
        'two_factor_secret' => encrypt('test-secret'),
        'two_factor_recovery_codes' => encrypt(json_encode(['code1'])),
        'two_factor_confirmed_at' => now(),
    ])->save();

    $this->actingAs($this->user);

    $response = $this->from(route('settings.two-factor'))->delete(route('two-factor.destroy'), [
        'password' => 'wrong-password',
    ]);

    $response->assertRedirect(route('settings.two-factor'));
    $response->assertSessionHasErrors(['password']);

    $this->user->refresh();
    expect($this->user->two_factor_confirmed_at)->not->toBeNull();
});

// ─── Recovery Codes ───

test('can regenerate recovery codes when 2fa is enabled', function () {
    $this->user->forceFill([
        'two_factor_secret' => encrypt('test-secret'),
        'two_factor_recovery_codes' => encrypt(json_encode(['old-code-1', 'old-code-2'])),
        'two_factor_confirmed_at' => now(),
    ])->save();

    $this->actingAs($this->user);

    $response = $this->from(route('settings.two-factor'))->post(route('two-factor.recovery-codes'));

    $response->assertRedirect(route('settings.two-factor'));
    $response->assertSessionHas('status');

    $this->user->refresh();
    $codes = json_decode(decrypt($this->user->two_factor_recovery_codes));
    expect($codes)->toHaveCount(8);
});

test('cannot regenerate recovery codes when 2fa is not enabled', function () {
    $this->actingAs($this->user);

    $response = $this->from(route('settings.two-factor'))->post(route('two-factor.recovery-codes'));

    $response->assertRedirect(route('settings.two-factor'));
    $response->assertSessionHasErrors(['error']);
});

// ─── Authentication ───

test('requires authentication for all two factor routes', function () {
    $this->get(route('settings.two-factor'))->assertRedirect(route('login'));
    $this->post(route('two-factor.store'))->assertRedirect(route('login'));
    $this->post(route('two-factor.confirm'))->assertRedirect(route('login'));
    $this->delete(route('two-factor.destroy'))->assertRedirect(route('login'));
    $this->post(route('two-factor.recovery-codes'))->assertRedirect(route('login'));
});
