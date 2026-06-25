<?php

return [

    /*
    |--------------------------------------------------------------------------
    | HTML Document Templates Registry
    |--------------------------------------------------------------------------
    |
    | This file registers all available HTML/Blade templates that can be used
    | for generating financial notes in the backend.
    |
    */

    'templates' => [
        // Debit Notes
        'debit_note.classic' => [
            'label' => 'Classic Debit Note',
            'type' => 'debit_note',
            'view_path' => 'pdf.templates.debit-notes.classic',
            'preview_image' => null,
            'supported_placeholders' => [
                'note_number', 'issue_date', 'due_date', 'customer_name',
                'customer_address', 'policy_number', 'amount', 'tax_amount',
                'total_amount', 'description', 'currency',
            ],
            'customizable_properties' => [
                'colors' => [
                    'primary' => [
                        'label' => 'Primary Accent Color',
                        'selector' => '.primary-accent, h1',
                        'property' => 'color',
                        'type' => 'color',
                    ],
                    'background' => [
                        'label' => 'Page Background',
                        'selector' => 'body',
                        'property' => 'background-color',
                        'type' => 'color',
                    ],
                    'table_header' => [
                        'label' => 'Table Header Background',
                        'selector' => 'th',
                        'property' => 'background-color',
                        'type' => 'color',
                    ],
                ],
                'typography' => [
                    'base_font' => [
                        'label' => 'Base Font Size',
                        'selector' => 'body',
                        'property' => 'font-size',
                        'type' => 'number',
                        'unit' => 'px',
                        'min' => 10,
                        'max' => 24,
                    ],
                    'heading_font' => [
                        'label' => 'Heading Font Size',
                        'selector' => 'h1',
                        'property' => 'font-size',
                        'type' => 'number',
                        'unit' => 'px',
                        'min' => 18,
                        'max' => 48,
                    ],
                    'font_family' => [
                        'label' => 'Font Family',
                        'selector' => 'body',
                        'property' => 'font-family',
                        'type' => 'select',
                        'options' => [
                            ['label' => 'Sans Serif (Modern)', 'value' => "'Helvetica Neue', Helvetica, Arial, sans-serif"],
                            ['label' => 'Serif (Classic)', 'value' => "Georgia, 'Times New Roman', Times, serif"],
                            ['label' => 'Century Gothic', 'value' => "'Century Gothic', AppleGothic, sans-serif"],
                            ['label' => 'Times Roman', 'value' => "'Times New Roman', Times, serif"],
                            ['label' => 'Monospace (Technical)', 'value' => "Monaco, 'Courier New', Courier, monospace"],
                            ['label' => 'Inter (Sleek)', 'value' => "'Inter', system-ui, sans-serif"],
                            ['label' => 'Playfair Display (Elegant)', 'value' => "'Playfair Display', serif"],
                        ],
                    ],
                ],
            ],
            'editable_labels' => [
                'title' => [
                    'label' => 'Document Title',
                    'default' => 'Debit Note',
                    'key' => 'title_label',
                ],
                'bill_to' => [
                    'label' => 'Recipient Label',
                    'default' => 'Insured:',
                    'key' => 'recipient_label',
                ],
            ],
        ],

        // Credit Notes
        'credit_note.classic' => [
            'label' => 'Classic Credit Note',
            'type' => 'credit_note',
            'view_path' => 'pdf.templates.credit-notes.classic',
            'preview_image' => null,
            'supported_placeholders' => [
                'note_number', 'issue_date', 'customer_name', 'customer_address',
                'policy_number', 'amount', 'tax_amount', 'total_amount',
                'description', 'currency',
            ],
            'customizable_properties' => [
                'colors' => [
                    'primary' => [
                        'label' => 'Primary Accent Color',
                        'selector' => '.primary-accent, h1',
                        'property' => 'color',
                        'type' => 'color',
                    ],
                    'table_header' => [
                        'label' => 'Table Header Background',
                        'selector' => 'th',
                        'property' => 'background-color',
                        'type' => 'color',
                    ],
                ],
                'typography' => [
                    'base_font' => [
                        'label' => 'Base Font Size',
                        'selector' => 'body',
                        'property' => 'font-size',
                        'type' => 'number',
                        'unit' => 'px',
                    ],
                    'font_family' => [
                        'label' => 'Font Family',
                        'selector' => 'body',
                        'property' => 'font-family',
                        'type' => 'select',
                        'options' => [
                            ['label' => 'Sans Serif (Modern)', 'value' => "'Helvetica Neue', Helvetica, Arial, sans-serif"],
                            ['label' => 'Serif (Classic)', 'value' => "Georgia, 'Times New Roman', Times, serif"],
                            ['label' => 'Century Gothic', 'value' => "'Century Gothic', AppleGothic, sans-serif"],
                            ['label' => 'Times Roman', 'value' => "'Times New Roman', Times, serif"],
                            ['label' => 'Monospace (Technical)', 'value' => "Monaco, 'Courier New', Courier, monospace"],
                            ['label' => 'Inter (Sleek)', 'value' => "'Inter', system-ui, sans-serif"],
                            ['label' => 'Playfair Display (Elegant)', 'value' => "'Playfair Display', serif"],
                        ],
                    ],
                ],
            ],
            'editable_labels' => [
                'title' => [
                    'label' => 'Document Title',
                    'default' => 'Credit Note',
                    'key' => 'title_label',
                ],
                'bill_to' => [
                    'label' => 'Recipient Label',
                    'default' => 'Insurer:',
                    'key' => 'recipient_label',
                ],
            ],
        ],

        // Invoices
        'invoice.classic' => [
            'label' => 'Classic Invoice',
            'type' => 'invoice',
            'view_path' => 'pdf.templates.invoices.classic',
            'preview_image' => null,
            'supported_placeholders' => [
                'invoice_number', 'invoice_date', 'due_date', 'customer_name',
                'customer_address', 'subtotal', 'tax_amount', 'discount_amount',
                'total_amount', 'currency', 'items',
            ],
            'customizable_properties' => [
                'colors' => [
                    'primary' => [
                        'label' => 'Primary Accent Color',
                        'selector' => '.primary-accent, h1',
                        'property' => 'color',
                        'type' => 'color',
                    ],
                    'table_header' => [
                        'label' => 'Table Header Background',
                        'selector' => 'th',
                        'property' => 'background-color',
                        'type' => 'color',
                    ],
                ],
                'typography' => [
                    'base_font' => [
                        'label' => 'Base Font Size',
                        'selector' => 'body',
                        'property' => 'font-size',
                        'type' => 'number',
                        'unit' => 'px',
                    ],
                    'font_family' => [
                        'label' => 'Font Family',
                        'selector' => 'body',
                        'property' => 'font-family',
                        'type' => 'select',
                        'options' => [
                            ['label' => 'Sans Serif (Modern)', 'value' => "'Helvetica Neue', Helvetica, Arial, sans-serif"],
                            ['label' => 'Serif (Classic)', 'value' => "Georgia, 'Times New Roman', Times, serif"],
                            ['label' => 'Century Gothic', 'value' => "'Century Gothic', AppleGothic, sans-serif"],
                            ['label' => 'Times Roman', 'value' => "'Times New Roman', Times, serif"],
                            ['label' => 'Monospace (Technical)', 'value' => "Monaco, 'Courier New', Courier, monospace"],
                            ['label' => 'Inter (Sleek)', 'value' => "'Inter', system-ui, sans-serif"],
                            ['label' => 'Playfair Display (Elegant)', 'value' => "'Playfair Display', serif"],
                        ],
                    ],
                ],
            ],
            'editable_labels' => [
                'title' => [
                    'label' => 'Document Title',
                    'default' => 'Invoice',
                    'key' => 'title_label',
                ],
                'bill_to' => [
                    'label' => 'Recipient Label',
                    'default' => 'Bill To:',
                    'key' => 'recipient_label',
                ],
            ],
        ],

        // Receipts
        'receipt.classic' => [
            'label' => 'Classic Receipt',
            'type' => 'receipt',
            'view_path' => 'pdf.templates.receipts.classic',
            'preview_image' => null,
            'supported_placeholders' => [
                'receipt_number', 'receipt_date', 'amount_paid', 'payment_method',
                'transaction_reference', 'customer_name', 'invoice_number', 'currency',
            ],
            'customizable_properties' => [
                'colors' => [
                    'primary' => [
                        'label' => 'Primary Accent Color',
                        'selector' => '.primary-accent, h1',
                        'property' => 'color',
                        'type' => 'color',
                    ],
                    'amount_bg' => [
                        'label' => 'Amount Box Background',
                        'selector' => '.amount-box',
                        'property' => 'background-color',
                        'type' => 'color',
                    ],
                    'font_family' => [
                        'label' => 'Font Family',
                        'selector' => 'body',
                        'property' => 'font-family',
                        'type' => 'select',
                        'options' => [
                            ['label' => 'Sans Serif (Modern)', 'value' => "'Helvetica Neue', Helvetica, Arial, sans-serif"],
                            ['label' => 'Serif (Classic)', 'value' => "Georgia, 'Times New Roman', Times, serif"],
                            ['label' => 'Century Gothic', 'value' => "'Century Gothic', AppleGothic, sans-serif"],
                            ['label' => 'Times Roman', 'value' => "'Times New Roman', Times, serif"],
                            ['label' => 'Monospace (Technical)', 'value' => "Monaco, 'Courier New', Courier, monospace"],
                            ['label' => 'Inter (Sleek)', 'value' => "'Inter', system-ui, sans-serif"],
                            ['label' => 'Playfair Display (Elegant)', 'value' => "'Playfair Display', serif"],
                        ],
                    ],
                ],
            ],
            'editable_labels' => [
                'title' => [
                    'label' => 'Document Title',
                    'default' => 'Receipt',
                    'key' => 'title_label',
                ],
                'received_from' => [
                    'label' => 'Payer Label',
                    'default' => 'Received From:',
                    'key' => 'payer_label',
                ],
            ],
        ],

        // Broker Slips
        'broker_slip.standard' => [
            'label' => 'Standard Broker Slip',
            'type' => 'broker_slip',
            'view_path' => 'pdf.templates.broker-slips.standard',
            'preview_image' => null,
            'supported_placeholders' => [
                'slip_number', 'insurer_name', 'customer_name',
                'sum_insured', 'gross_premium', 'net_premium',
                'commission_amount', 'rate', 'status',
            ],
            'customizable_properties' => [
                'colors' => [
                    'primary' => [
                        'label' => 'Primary Accent Color',
                        'selector' => '.primary-accent, h1',
                        'property' => 'color',
                        'type' => 'color',
                    ],
                    'table_header' => [
                        'label' => 'Table Header Background',
                        'selector' => 'th',
                        'property' => 'background-color',
                        'type' => 'color',
                    ],
                ],
                'typography' => [
                    'base_font' => [
                        'label' => 'Base Font Size',
                        'selector' => 'body',
                        'property' => 'font-size',
                        'type' => 'number',
                        'unit' => 'px',
                    ],
                    'font_family' => [
                        'label' => 'Font Family',
                        'selector' => 'body',
                        'property' => 'font-family',
                        'type' => 'select',
                        'options' => [
                            ['label' => 'Sans Serif (Modern)', 'value' => "'Helvetica Neue', Helvetica, Arial, sans-serif"],
                            ['label' => 'Serif (Classic)', 'value' => "Georgia, 'Times New Roman', Times, serif"],
                            ['label' => 'Century Gothic', 'value' => "'Century Gothic', AppleGothic, sans-serif"],
                            ['label' => 'Times Roman', 'value' => "'Times New Roman', Times, serif"],
                            ['label' => 'Monospace (Technical)', 'value' => "Monaco, 'Courier New', Courier, monospace"],
                            ['label' => 'Inter (Sleek)', 'value' => "'Inter', system-ui, sans-serif"],
                            ['label' => 'Playfair Display (Elegant)', 'value' => "'Playfair Display', serif"],
                        ],
                    ],
                ],
            ],
            'editable_labels' => [
                'title' => [
                    'label' => 'Document Title',
                    'default' => 'Broker Slip',
                    'key' => 'title_label',
                ],
                'bill_to' => [
                    'label' => 'Recipient Label',
                    'default' => 'To:',
                    'key' => 'recipient_label',
                ],
            ],
        ],
    ],
];
