<?php

namespace Database\Seeders;

use App\Models\DocumentTemplate;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class HtmlDocumentTemplatesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenants = Tenant::all();

        $htmlTemplates = [
            [
                'name' => 'Classic Invoice (HTML)',
                'type' => 'invoice',
                'category' => 'standard',
                'description' => 'A clean, modern HTML/PDF invoice template',
                'html_template_key' => 'invoice.classic',
            ],
            [
                'name' => 'Classic Receipt (HTML)',
                'type' => 'receipt',
                'category' => 'standard',
                'description' => 'A clean, modern HTML/PDF receipt template',
                'html_template_key' => 'receipt.classic',
            ],
            [
                'name' => 'Classic Debit Note (HTML)',
                'type' => 'debit_note',
                'category' => 'standard',
                'description' => 'A clean, modern HTML/PDF debit note template',
                'html_template_key' => 'debit_note.classic',
            ],
            [
                'name' => 'Classic Credit Note (HTML)',
                'type' => 'credit_note',
                'category' => 'standard',
                'description' => 'A clean, modern HTML/PDF credit note template',
                'html_template_key' => 'credit_note.classic',
            ],
        ];

        foreach ($tenants as $tenant) {
            foreach ($htmlTemplates as $templateData) {
                // Check if this tenant already has this exact HTML template
                $exists = DocumentTemplate::where('tenant_id', $tenant->id)
                    ->where('html_template_key', $templateData['html_template_key'])
                    ->where('mode', 'html')
                    ->exists();

                if (! $exists) {
                    // Update existing defaults to false if we are going to set these as default (optional)
                    // Let's just create them as active, but maybe not override their existing default
                    DocumentTemplate::create(array_merge($templateData, [
                        'tenant_id' => $tenant->id,
                        'mode' => 'html',
                        'is_active' => true,
                        'is_default' => false, // let tenant decide if they want to switch to HTML as default
                        'design_json' => [
                            'canvas' => ['width' => 794, 'height' => 1123, 'backgroundColor' => '#ffffff'],
                            'elements' => [],
                        ],
                    ]));
                }
            }
        }
    }
}
