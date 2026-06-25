<?php

namespace App\Http\Controllers;

use App\Models\TenantDefaultTemplate;
use App\Models\TenantTemplateOverride;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TemplateController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('view_document_templates');

        $templates = config('document-templates.templates', []);

        $tenant = Auth::user()->tenant;

        $defaults = TenantDefaultTemplate::where('tenant_id', $tenant->id)
            ->pluck('template_key', 'document_type')
            ->toArray();

        return Inertia::render('DocumentTemplates/Index', [
            'templates' => $templates,
            'documentTypes' => [
                'certificate' => 'Certificate',
                'invoice' => 'Invoice',
                'debit_note' => 'Debit Note',
                'credit_note' => 'Credit Note',
                'receipt' => 'Receipt',
                'broker_slip' => 'Broker Slip',
            ],
            'defaults' => $defaults,
        ]);
    }

    public function show(string $templateKey)
    {
        Gate::authorize('view_document_templates');

        $registry = config('document-templates.templates', []);
        $resolvedKey = $this->resolveTemplateKey($templateKey, $registry);

        if (! $resolvedKey || ! isset($registry[$resolvedKey])) {
            abort(404, "Template '{$templateKey}' not found.");
        }

        $template = $registry[$resolvedKey];
        $template['key'] = $resolvedKey;
        $template['type'] = $template['type'] ?? 'certificate';

        $sampleData = $this->getSampleData($template['type']);

        return Inertia::render('DocumentTemplates/Show', [
            'template' => $template,
            'placeholders' => $template['supported_placeholders'] ?? [],
            'sampleData' => $sampleData,
        ]);
    }

    public function preview(Request $request, string $templateKey)
    {
        Gate::authorize('view_document_templates');

        $registry = config('document-templates.templates', []);
        $resolvedKey = $this->resolveTemplateKey($templateKey, $registry);

        if (! $resolvedKey || ! isset($registry[$resolvedKey])) {
            abort(404);
        }

        $tenant = Auth::user()->tenant;
        $type = $registry[$resolvedKey]['type'] ?? 'certificate';
        $sampleData = $this->getSampleData($type);

        $override = TenantTemplateOverride::where('tenant_id', $tenant->id)
            ->where('template_key', $resolvedKey)
            ->first();

        $generator = app(\App\Services\Documents\HtmlTemplatePdfGenerator::class);

        $cssOverrides = $this->buildCssOverrides($override);

        $elementToggles = $override?->element_toggles;
        if ($request->has('toggles')) {
            $queryToggles = json_decode($request->query('toggles'), true);
            if (is_array($queryToggles)) {
                $elementToggles = array_merge($elementToggles ?? [], $queryToggles);
            }
        }

        $html = $generator->renderHtml(
            $tenant,
            $resolvedKey,
            $sampleData,
            $cssOverrides,
            $override?->label_overrides ?? [],
            true,
            $elementToggles
        );

        return response($html);
    }

    public function edit(string $templateKey)
    {
        Gate::authorize('edit_document_templates');

        $registry = config('document-templates.templates', []);
        $resolvedKey = $this->resolveTemplateKey($templateKey, $registry);

        if (! $resolvedKey || ! isset($registry[$resolvedKey])) {
            abort(404);
        }

        $tenant = Auth::user()->tenant;
        $override = TenantTemplateOverride::where('tenant_id', $tenant->id)
            ->where('template_key', $resolvedKey)
            ->first();

        $template = $registry[$resolvedKey];
        $template['key'] = $resolvedKey;

        $documentType = $template['type'] ?? 'certificate';

        $defaultEntry = TenantDefaultTemplate::where('tenant_id', $tenant->id)
            ->where('document_type', $documentType)
            ->first();

        return Inertia::render('DocumentTemplates/Edit', [
            'template' => $template,
            'override' => $override,
            'tenantBranding' => [
                'header_image' => $tenant->header_image ? Storage::disk('public')->url($tenant->header_image) : null,
                'footer_image' => $tenant->footer_image ? Storage::disk('public')->url($tenant->footer_image) : null,
                'signature' => $tenant->signature ? Storage::disk('public')->url($tenant->signature) : null,
                'stamp' => $tenant->stamp ? Storage::disk('public')->url($tenant->stamp) : null,
            ],
            'isDefault' => $defaultEntry?->template_key === $resolvedKey,
            'defaultTemplateKey' => $defaultEntry?->template_key,
        ]);
    }

    public function update(Request $request, string $templateKey)
    {
        Gate::authorize('edit_document_templates');

        $registry = config('document-templates.templates', []);
        $resolvedKey = $this->resolveTemplateKey($templateKey, $registry);

        if (! $resolvedKey || ! isset($registry[$resolvedKey])) {
            abort(404);
        }

        $validated = $request->validate([
            'label_overrides' => 'nullable|json',
            'color_overrides' => 'nullable|json',
            'font_overrides' => 'nullable|json',
            'css_overrides' => 'nullable|json',
            'custom_content' => 'nullable|string',
            'header_image' => 'nullable|image|max:2048',
            'footer_image' => 'nullable|image|max:2048',
            'signature' => 'nullable|image|max:1024',
            'stamp' => 'nullable|image|max:1024',
            'element_toggles' => 'nullable|json',
        ]);

        $tenant = Auth::user()->tenant;

        $data = [
            'label_overrides' => $request->input('label_overrides') ? json_decode($request->input('label_overrides'), true) : null,
            'color_overrides' => $request->input('color_overrides') ? json_decode($request->input('color_overrides'), true) : null,
            'font_overrides' => $request->input('font_overrides') ? json_decode($request->input('font_overrides'), true) : null,
            'css_overrides' => $request->input('css_overrides') ? json_decode($request->input('css_overrides'), true) : null,
            'custom_content' => $request->input('custom_content') ?? null,
            'element_toggles' => $request->input('element_toggles') ? json_decode($request->input('element_toggles'), true) : null,
        ];

        $imageFields = ['header_image', 'footer_image', 'signature', 'stamp'];
        foreach ($imageFields as $field) {
            if ($request->hasFile($field)) {
                $existing = TenantTemplateOverride::where('tenant_id', $tenant->id)
                    ->where('template_key', $resolvedKey)
                    ->value($field);

                if ($existing) {
                    Storage::disk('public')->delete($existing);
                }

                $data[$field] = $request->file($field)->store(
                    "tenants/{$tenant->id}/templates/{$resolvedKey}",
                    'public'
                );
            }
        }

        TenantTemplateOverride::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'template_key' => $resolvedKey,
            ],
            $data
        );

        return redirect()->back()->with('success', 'Template overrides saved successfully.');
    }

    protected function buildCssOverrides(?TenantTemplateOverride $override): array
    {
        $css = $override?->css_overrides ?? [];

        $colorOverrides = $override?->color_overrides ?? [];
        if (! empty($colorOverrides)) {
            $registry = config('document-templates.templates', []);
            $colors = $registry[$override->template_key]['customizable_properties']['colors'] ?? [];

            foreach ($colorOverrides as $key => $value) {
                if (isset($colors[$key])) {
                    $selector = $colors[$key]['selector'];
                    $property = $colors[$key]['property'];
                    $css[$selector][$property] = $value;
                }
            }
        }

        $fontOverrides = $override?->font_overrides ?? [];
        if (! empty($fontOverrides)) {
            $registry = config('document-templates.templates', []);
            $typography = $registry[$override->template_key]['customizable_properties']['typography'] ?? [];

            foreach ($fontOverrides as $key => $value) {
                if (isset($typography[$key])) {
                    $selector = $typography[$key]['selector'];
                    $property = $typography[$key]['property'];
                    if (! empty($value)) {
                        $unit = $typography[$key]['unit'] ?? '';
                        $css[$selector][$property] = $value.$unit;
                    }
                }
            }
        }

        return $css;
    }

    public function placeholders(string $templateKey)
    {
        Gate::authorize('view_document_templates');

        $registry = config('document-templates.templates', []);
        $resolvedKey = $this->resolveTemplateKey($templateKey, $registry);

        if (! $resolvedKey || ! isset($registry[$resolvedKey])) {
            abort(404);
        }

        return response()->json([
            'placeholders' => $registry[$resolvedKey]['supported_placeholders'] ?? [],
            'customizable_properties' => $registry[$resolvedKey]['customizable_properties'] ?? [],
            'editable_labels' => $registry[$resolvedKey]['editable_labels'] ?? [],
        ]);
    }

    public function setDefault(string $templateKey)
    {
        Gate::authorize('edit_document_templates');

        $registry = config('document-templates.templates', []);
        $resolvedKey = $this->resolveTemplateKey($templateKey, $registry);

        if (! $resolvedKey || ! isset($registry[$resolvedKey])) {
            return back()->with('error', "Template '{$templateKey}' not found.");
        }

        $tenant = Auth::user()->tenant;
        $documentType = $registry[$resolvedKey]['type'] ?? 'certificate';

        TenantDefaultTemplate::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'document_type' => $documentType,
            ],
            [
                'template_key' => $resolvedKey,
            ]
        );

        return back()->with('success', "{$registry[$resolvedKey]['label']} set as default for {$documentType}.");
    }

    public function removeDefault(string $templateKey)
    {
        Gate::authorize('edit_document_templates');

        $registry = config('document-templates.templates', []);
        $resolvedKey = $this->resolveTemplateKey($templateKey, $registry);

        if (! $resolvedKey || ! isset($registry[$resolvedKey])) {
            return back()->with('error', "Template '{$templateKey}' not found.");
        }

        $tenant = Auth::user()->tenant;
        $documentType = $registry[$resolvedKey]['type'] ?? 'certificate';

        TenantDefaultTemplate::where('tenant_id', $tenant->id)
            ->where('document_type', $documentType)
            ->delete();

        return back()->with('success', "Default template removed for {$documentType}.");
    }

    protected function resolveTemplateKey(string $key, array $registry): ?string
    {
        if (isset($registry[$key])) {
            return $key;
        }

        $normalized = str_replace(['_', '.'], '', $key);
        foreach ($registry as $registeredKey => $config) {
            if (str_replace(['_', '.'], '', $registeredKey) === $normalized) {
                return $registeredKey;
            }
        }

        return null;
    }

    protected function getSampleData(string $type): array
    {
        $user = auth()->user();
        $commonData = [
            'company_name' => 'Insure Pal Insurance Ltd.',
            'company_address' => '123 Insurance Street, Lagos, Nigeria',
            'company_phone' => '+234 800 123 4567',
            'company_email' => 'info@insurepal.com',
            'preparer_name' => $user ? $user->name : 'System User',
            'preparer_signature' => $user ? $user->signature : null,
            'preparer_signature_url' => $user ? $user->signature_url : null,
        ];

        $typeSpecificData = match ($type) {
            'certificate' => [
                'certificate_number' => 'CERT-2025-001234',
                'policy_number' => 'POL-2025-567890',
                'customer_name' => 'John Doe',
                'issue_date' => now()->format('d/m/Y'),
                'expiry_date' => now()->addYear()->format('d/m/Y'),
                'coverage_amount' => '₦5,000,000.00',
                'vehicle_registration' => 'ABC-123-XY',
                'vehicle_make' => 'Toyota',
                'vehicle_model' => 'Camry 2024',
            ],
            'invoice' => [
                'invoice_number' => 'INV-2025-001234',
                'invoice_date' => now()->format('F j, Y'),
                'due_date' => now()->addDays(30)->format('F j, Y'),
                'customer_name' => 'Jane Smith',
                'customer_address' => '456 Customer Ave, Abuja',
                'total_amount' => '750,000.00',
                'tax_amount' => '56,250.00',
                'discount_amount' => '0.00',
                'subtotal' => '693,750.00',
                'payment_terms' => 'Net 30 days',
                'currency' => 'NGN',
                'items' => [
                    ['description' => 'Comprehensive Auto Insurance', 'quantity' => 1, 'unit_price' => '693,750.00', 'total' => '693,750.00'],
                ],
            ],
            'debit_note' => [
                'note_number' => 'DN-2025-001234',
                'note_date' => now()->format('d/m/Y'),
                'issue_date' => now()->format('F j, Y'),
                'policy_number' => 'POL-2025-567890',
                'customer_name' => 'John Doe',
                'customer_address' => '123 Customer Street, Lagos',
                'amount' => '150,000.00',
                'tax_amount' => '0.00',
                'total_amount' => '150,000.00',
                'reason' => 'Premium adjustment for increased coverage',
                'description' => 'Premium adjustment for increased coverage',
                'due_date' => now()->addDays(14)->format('F j, Y'),
                'currency' => 'NGN',
            ],
            'credit_note' => [
                'note_number' => 'CN-2025-001234',
                'note_date' => now()->format('d/m/Y'),
                'issue_date' => now()->format('F j, Y'),
                'policy_number' => 'POL-2025-567890',
                'customer_name' => 'Jane Smith',
                'customer_address' => '456 Customer Ave, Abuja',
                'amount' => '75,000.00',
                'tax_amount' => '0.00',
                'total_amount' => '75,000.00',
                'reason' => 'Policy cancellation - partial refund',
                'description' => 'Policy cancellation - partial refund',
                'refund_method' => 'Bank Transfer',
                'currency' => 'NGN',
            ],
            'receipt' => [
                'receipt_number' => 'RCP-2025-001234',
                'receipt_date' => now()->format('F j, Y'),
                'payment_method' => 'Bank Transfer',
                'customer_name' => 'John Doe',
                'customer_address' => '123 Customer Street, Lagos',
                'amount_paid' => '500,000.00',
                'policy_number' => 'POL-2025-567890',
                'invoice_number' => 'INV-2025-001234',
                'transaction_reference' => 'TRX-20250102-ABC123',
                'currency' => 'NGN',
            ],
            'broker_slip' => [
                'watermark' => 'SAMPLE',
                'verificationUrl' => 'https://insurepal.com/verify/SLIP-SAMPLE',
                'slip' => (object) [
                    'slip_number' => 'SLIP-2025-001234',
                    'created_at' => now(),
                    'status' => 'approved',
                    'version' => 2,
                    'sum_insured' => 5_000_000,
                    'rate' => 0.075,
                    'rate_basis' => 'per_mille',
                    'gross_premium' => 375_000,
                    'commission_amount' => 37_500,
                    'commission_rate' => 10,
                    'taxes' => 7_500,
                    'fees' => 2_000,
                    'net_premium' => 328_000,
                    'total_premium' => 375_000,
                    'createdBy' => (object) ['name' => 'John Doe'],
                ],
                'insurer' => (object) [
                    'name' => 'Nigerian Insurance Co. Ltd',
                    'address' => '100 Broad Street, Lagos',
                ],
                'customer' => (object) [
                    'display_name' => 'ABC Transport Services',
                    'address' => '25 Industrial Road, Ikeja, Lagos',
                ],
                'placement' => (object) [
                    'proposed_start_date' => now(),
                    'proposed_end_date' => now()->addYear(),
                    'policyProduct' => (object) [
                        'name' => 'Motor Comprehensive',
                        'description' => 'Comprehensive motor insurance cover for fleet vehicles',
                        'policyClass' => (object) ['name' => 'Motor'],
                    ],
                ],
                'clauses' => collect([
                    (object) ['title' => 'Warranty Clause', 'text' => 'The insured warrants that all information provided is true and accurate.'],
                    (object) ['title' => 'Cancellation Clause', 'text' => 'This policy may be cancelled by either party with 30 days written notice.'],
                ]),
            ],
            default => [],
        };

        return array_merge($commonData, $typeSpecificData);
    }
}
