<?php

use App\Enums\CommissionTransactionType;

test('has all expected cases', function () {
    expect(CommissionTransactionType::cases())->toHaveCount(8);

    expect(CommissionTransactionType::Policy->value)->toBe('policy');
    expect(CommissionTransactionType::CreditNote->value)->toBe('credit_note');
    expect(CommissionTransactionType::DebitNote->value)->toBe('debit_note');
    expect(CommissionTransactionType::Endorsement->value)->toBe('endorsement');
    expect(CommissionTransactionType::Cancellation->value)->toBe('cancellation');
    expect(CommissionTransactionType::Reversal->value)->toBe('reversal');
    expect(CommissionTransactionType::ManualAdjustment->value)->toBe('manual_adjustment');
    expect(CommissionTransactionType::Renewal->value)->toBe('renewal');
});

test('label returns human readable text', function () {
    expect(CommissionTransactionType::Policy->label())->toBe('Policy');
    expect(CommissionTransactionType::CreditNote->label())->toBe('Credit Note');
    expect(CommissionTransactionType::DebitNote->label())->toBe('Debit Note');
    expect(CommissionTransactionType::Endorsement->label())->toBe('Endorsement');
    expect(CommissionTransactionType::Cancellation->label())->toBe('Cancellation');
    expect(CommissionTransactionType::Reversal->label())->toBe('Reversal');
    expect(CommissionTransactionType::ManualAdjustment->label())->toBe('Manual Adjustment');
    expect(CommissionTransactionType::Renewal->label())->toBe('Renewal');
});

test('sign returns correct symbol', function () {
    expect(CommissionTransactionType::Policy->sign())->toBe('+');
    expect(CommissionTransactionType::DebitNote->sign())->toBe('+');
    expect(CommissionTransactionType::Renewal->sign())->toBe('+');
    expect(CommissionTransactionType::CreditNote->sign())->toBe('-');
    expect(CommissionTransactionType::Cancellation->sign())->toBe('-');
    expect(CommissionTransactionType::Endorsement->sign())->toBe('±');
    expect(CommissionTransactionType::Reversal->sign())->toBe('±');
    expect(CommissionTransactionType::ManualAdjustment->sign())->toBe('±');
});

test('isPositive and isNegative work correctly', function () {
    expect(CommissionTransactionType::Policy->isPositive())->toBeTrue();
    expect(CommissionTransactionType::CreditNote->isNegative())->toBeTrue();
    expect(CommissionTransactionType::DebitNote->isPositive())->toBeTrue();
    expect(CommissionTransactionType::Cancellation->isNegative())->toBeTrue();
    expect(CommissionTransactionType::Endorsement->isPositive())->toBeFalse();
    expect(CommissionTransactionType::Endorsement->isNegative())->toBeFalse();
});
