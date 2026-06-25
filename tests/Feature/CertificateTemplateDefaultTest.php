<?php

it('returns config templates array with expected structure', function () {
    $templates = config('document-templates.templates');

    expect($templates)->toBeArray();
    expect($templates)->not->toBeEmpty();
});

it('each template has required keys', function () {
    $templates = config('document-templates.templates');

    foreach ($templates as $template) {
        expect($template)->toHaveKeys(['label', 'type', 'view_path']);
        expect($template['type'])->toBeString();
        expect($template['label'])->toBeString();
        expect($template['view_path'])->toStartWith('pdf.templates.');
    }
});

it('templates have customization options', function () {
    $templates = config('document-templates.templates');

    foreach ($templates as $template) {
        expect($template)->toHaveKey('customizable_properties');
        expect($template['customizable_properties'])->toHaveKey('colors');
    }
});

it('invoice templates have editable labels', function () {
    $templates = config('document-templates.templates');
    $invoice = $templates['invoice.classic'];

    expect($invoice['editable_labels']['title']['default'])->toBe('Invoice');
    expect($invoice['editable_labels']['bill_to']['default'])->toBe('Bill To:');
});

it('receipt templates have editable labels', function () {
    $templates = config('document-templates.templates');
    $receipt = $templates['receipt.classic'];

    expect($receipt['editable_labels']['title']['default'])->toBe('Receipt');
    expect($receipt['editable_labels']['received_from']['default'])->toBe('Received From:');
});
