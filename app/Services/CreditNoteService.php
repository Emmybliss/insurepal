<?php

namespace App\Services;

use App\Events\CreditNoteGenerated;
use App\Models\CreditNote;
use App\Models\Customer;
use App\Models\Policy;
use App\Models\TenantDefaultTemplate;
use App\Models\User;
use App\Services\Documents\DocumentVerificationService;
use App\Services\Documents\FinancialNotePayloadMapper;
use App\Services\Documents\HtmlTemplatePdfGenerator;
use App\Services\Pdf\PdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CreditNoteService
{
    public function __construct(
        protected PdfService $pdfService
    ) {}

    public function create(array $data, int $tenantId, int $userId): CreditNote
    {
        return DB::transaction(function () use ($data, $tenantId, $userId) {
            $noteNumber = CreditNote::generateCreditNoteNumber($tenantId);
            $sequenceNumber = CreditNote::withTrashed()->where('tenant_id', $tenantId)->count() + 1;

            $note = CreditNote::create([
                'note_number' => $noteNumber,
                'sequence_number' => $sequenceNumber,
                'tenant_id' => $tenantId,
                'customer_id' => $data['customer_id'],
                'policy_id' => $data['policy_id'] ?? null,
                'debit_note_id' => $data['debit_note_id'],
                'description' => $data['description'],
                'amount' => $data['amount'],
                'tax_rate' => $data['tax_rate'] ?? 0,
                'tax_amount' => $data['tax_amount'] ?? 0,
                'commission_rate' => $data['commission_rate'] ?? 0,
                'commission_amount' => $data['commission_amount'] ?? 0,
                'total_amount' => $data['total_amount'],
                'issue_date' => $data['issue_date'] ?? null,
                'due_date' => $data['due_date'] ?? null,
                'currency_code' => $data['currency_code'] ?? 'NGN',
                'exchange_rate' => $data['exchange_rate'] ?? 1,
                'transaction_type' => $data['transaction_type'] ?? null,
                'insurer_id' => $data['insurer_id'] ?? null,
                'insurer_name' => $data['insurer_name'] ?? null,
                'insurer_email' => $data['insurer_email'] ?? null,
                'insurer_phone' => $data['insurer_phone'] ?? null,
                'insurer_address' => $data['insurer_address'] ?? null,
                'insurer_source' => $data['insurer_source'] ?? null,
                'items' => $data['items'] ?? null,
                'metadata' => $data['metadata'] ?? null,
                'status' => CreditNote::STATUS_DRAFT,
                'created_by_id' => $userId,
            ]);

            return $note->fresh();
        });
    }

    public function createCreditNoteFromPolicy(Policy $policy, User $user, array $data): CreditNote
    {
        $tenantId = $policy->tenant_id;
        $year = now()->year;
        $lastCreditNote = CreditNote::withTrashed()->where('tenant_id', $user->tenant_id)->latest('id')->first();
        $lastNumber = $lastCreditNote ? intval(substr($lastCreditNote->note_number, -6)) : 0;
        $newNumber = str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);
        $referenceNumber = sprintf('CN-%d-%d-%06d', $year, $tenantId, $newNumber);

        $creditNote = CreditNote::create([
            'note_number' => $newNumber,
            'reference_number' => $referenceNumber,
            'tenant_id' => $tenantId,
            'customer_id' => $policy->customer_id,
            'policy_id' => $policy->id,
            'amount' => $data['amount'],
            'tax_amount' => $data['tax_amount'] ?? 0,
            'total_amount' => $data['amount'] + ($data['tax_amount'] ?? 0),
            'description' => $data['description'] ?? 'Credit Note for Policy #'.$policy->policy_number,
            'issue_date' => now()->format('Y-m-d'),
            'created_by_id' => $user->id,
            'items' => $data['items'] ?? null,
            'currency_code' => 'NGN',
        ]);

        return $creditNote;
    }

    // ─── Status Check Methods ───

    public function canModify(CreditNote $creditNote): bool
    {
        return $creditNote->status === 'draft';
    }

    public function canIssueNote(CreditNote $creditNote): bool
    {
        return in_array($creditNote->status, ['draft', 'generated']);
    }

    // ─── CRUD Methods ───

    public function update(CreditNote $creditNote, array $data): CreditNote
    {
        if (! $this->canModify($creditNote)) {
            throw new \RuntimeException('Only draft notes can be edited.');
        }

        $creditNote->update($data);

        return $creditNote->fresh();
    }

    public function delete(CreditNote $creditNote): void
    {
        if (! $this->canModify($creditNote)) {
            throw new \RuntimeException('Only draft notes can be deleted.');
        }

        $creditNote->delete();
    }

    public function issue(CreditNote $creditNote): CreditNote
    {
        if (! $this->canIssueNote($creditNote)) {
            throw new \RuntimeException('Only draft or generated notes can be issued.');
        }

        $creditNote->update([
            'status' => 'issued',
            'issue_date' => now(),
        ]);

        $creditNote = $creditNote->fresh();

        CreditNoteGenerated::dispatch($creditNote);

        return $creditNote;
    }

    public function markAsPaid(CreditNote $creditNote, User $user, ?array $paymentData = null): CreditNote
    {
        if ($creditNote->status !== 'issued') {
            throw new \RuntimeException('Only issued credit notes can be marked as paid.');
        }

        if ($creditNote->paid_at) {
            throw new \RuntimeException('This credit note has already been marked as paid.');
        }

        $updateData = [
            'status' => 'paid',
            'paid_at' => $paymentData['payment_date'] ?? now(),
        ];

        if (! empty($paymentData['payment_reference'])) {
            $metadata = array_merge(
                (array) $creditNote->metadata,
                [
                    'payment_reference' => $paymentData['payment_reference'],
                    'marked_paid_by' => $user->id,
                    'marked_paid_at' => now(),
                ]
            );
            $updateData['metadata'] = $metadata;
        }

        $creditNote->update($updateData);

        return $creditNote->fresh();
    }

    public function cancel(CreditNote $creditNote, ?string $reason = null, ?int $cancelledBy = null): CreditNote
    {
        if ($creditNote->status === 'paid') {
            throw new \RuntimeException('Paid notes cannot be cancelled.');
        }

        $creditNote->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancelled_by_id' => $cancelledBy,
            'cancellation_reason' => $reason,
        ]);

        return $creditNote->fresh();
    }

    // ─── PDF/Document Methods ───

    public function getGenerationOptions(CreditNote $creditNote): array
    {
        $registry = config('document-templates.templates', []);
        $defaultTemplateKey = TenantDefaultTemplate::getDefaultTemplateKey($creditNote->tenant_id, 'credit_note')
            ?? 'credit_note.classic';
        $defaultTemplate = $registry[$defaultTemplateKey] ?? null;

        $existingNotes = CreditNote::where('policy_id', $creditNote->policy_id)
            ->active()
            ->get(['id', 'type', 'status', 'note_number', 'generated_at']);

        $tempNoteNumber = CreditNote::generateCreditNoteNumber(
            $creditNote->tenant_id,
            'TEMP'
        );

        return [
            'registry' => $registry,
            'defaultTemplateKey' => $defaultTemplateKey,
            'defaultTemplate' => $defaultTemplate,
            'existingCreditNotes' => $existingNotes,
            'qrBarcodeData' => [
                'qr_code_policy' => url('/media/qrcode/'.urlencode($creditNote->policy?->policy_number ?? 'N/A')),
                'qr_code_credit_note' => url('/media/qrcode/'.urlencode($tempNoteNumber)),
                'barcode_policy' => url('/media/barcode/'.urlencode($creditNote->policy?->policy_number ?? 'N/A')),
                'barcode_credit_note' => url('/media/barcode/'.urlencode($tempNoteNumber)),
            ],
        ];
    }

    public function generatePdf(CreditNote $creditNote, string $templateKey, string $type): CreditNote
    {
        $registry = config('document-templates.templates', []);
        $template = $registry[$templateKey] ?? null;

        if (! $template) {
            throw new \RuntimeException("Template '{$templateKey}' not found.");
        }

        $mapper = app(FinancialNotePayloadMapper::class);
        $generator = app(HtmlTemplatePdfGenerator::class);
        $verificationService = app(DocumentVerificationService::class);

        $payload = $mapper->mapCreditNote($creditNote);
        $fileName = 'credit-note-'.uniqid().'.pdf';

        $result = $generator->generateAndStore(
            $creditNote->tenant,
            $templateKey,
            $payload,
            'credit-notes',
            $fileName
        );

        $snapshot = $verificationService->computeSnapshot($payload);
        $documentHash = $verificationService->generateDocumentHash($snapshot);

        $metadata = $creditNote->metadata ?? [];
        $metadata['metadata'] = array_merge(
            (array) ($metadata['metadata'] ?? []),
            [
                'template_key' => $templateKey,
                'generated_at' => now()->toISOString(),
            ]
        );

        $creditNote->update([
            'type' => $type,
            'status' => CreditNote::STATUS_GENERATED,
            'generated_at' => now(),
            'file_path' => $result['path'],
            'file_name' => $fileName,
            'file_size' => $result['file_size'],
            'file_hash' => $result['file_hash'],
            'metadata' => $metadata,
            'snapshot_json' => $snapshot,
            'document_hash' => $documentHash,
        ]);

        return $creditNote->fresh();
    }

    public function regeneratePdf(CreditNote $creditNote, string $templateKey, string $type): CreditNote
    {
        if ($creditNote->file_path && Storage::disk('public')->exists($creditNote->file_path)) {
            Storage::disk('public')->delete($creditNote->file_path);
        }

        $mapper = app(FinancialNotePayloadMapper::class);
        $generator = app(HtmlTemplatePdfGenerator::class);
        $verificationService = app(DocumentVerificationService::class);

        $payload = $mapper->mapCreditNote($creditNote);
        $fileName = 'credit-note-'.uniqid().'.pdf';

        $result = $generator->generateAndStore(
            $creditNote->tenant,
            $templateKey,
            $payload,
            'credit-notes',
            $fileName
        );

        $snapshot = $verificationService->computeSnapshot($payload);
        $documentHash = $verificationService->generateDocumentHash($snapshot);

        $creditNote->update([
            'type' => $type,
            'status' => CreditNote::STATUS_GENERATED,
            'file_path' => $result['path'],
            'file_name' => $fileName,
            'file_size' => $result['file_size'],
            'file_hash' => $result['file_hash'],
            'snapshot_json' => $snapshot,
            'document_hash' => $documentHash,
            'metadata' => [
                'template_key' => $templateKey,
                'regenerated_at' => now()->toISOString(),
            ],
        ]);

        return $creditNote->fresh();
    }

    public function downloadPdf(CreditNote $creditNote): ?string
    {
        if (! $creditNote->file_path || ! Storage::disk('public')->exists($creditNote->file_path)) {
            return null;
        }

        return $creditNote->file_path;
    }

    public function generate(CreditNote $creditNote, string $templateKey, string $type): CreditNote
    {
        $creditNote = $this->generatePdf($creditNote, $templateKey, $type);

        if (method_exists($creditNote, 'addToAuditTrail')) {
            $creditNote->addToAuditTrail('generated', 'Credit note generated', 'Template: '.$templateKey);
        }

        CreditNoteGenerated::dispatch($creditNote);

        return $creditNote;
    }

    public function regenerate(CreditNote $creditNote, string $templateKey, string $type): CreditNote
    {
        $creditNote = $this->regeneratePdf($creditNote, $templateKey, $type);

        if (method_exists($creditNote, 'addToAuditTrail')) {
            $creditNote->addToAuditTrail('regenerated', 'Credit note regenerated with new PDF', 'Template: '.$templateKey);
        }

        return $creditNote;
    }

    public function download(CreditNote $creditNote): ?string
    {
        $filePath = $this->downloadPdf($creditNote);

        if ($filePath && method_exists($creditNote, 'addToAuditTrail')) {
            $creditNote->addToAuditTrail('downloaded', 'Credit note downloaded by '.request()->user()->name);
        }

        return $filePath;
    }

    public function preview(CreditNote $creditNote): ?string
    {
        $filePath = $this->downloadPdf($creditNote);

        if ($filePath && method_exists($creditNote, 'addToAuditTrail')) {
            $creditNote->addToAuditTrail('previewed', 'Credit note previewed by '.request()->user()->name);
        }

        return $filePath;
    }

    public function htmlPreview(CreditNote $creditNote, string $templateKey): ?string
    {
        $creditNote->load(['customer', 'policy.policyProduct', 'createdBy', 'tenant']);

        $registry = config('document-templates.templates', []);
        $template = $registry[$templateKey] ?? null;

        if (! $template) {
            return null;
        }

        $mapper = app(FinancialNotePayloadMapper::class);
        $generator = app(HtmlTemplatePdfGenerator::class);

        $payload = $mapper->mapCreditNote($creditNote);

        try {
            return $generator->renderHtml(
                $creditNote->tenant,
                $templateKey,
                $payload,
                $template['css_overrides'] ?? [],
                $template['label_overrides'] ?? [],
                true
            );
        } catch (\Exception $e) {
            Log::error('HTML Preview Error: '.$e->getMessage());

            return null;
        }
    }

    public function getEditData(CreditNote $creditNote): array
    {
        return [
            'customers' => Customer::active()->get(),
            'policies' => Policy::where('customer_id', $creditNote->customer_id)
                ->with('policyProduct')
                ->get(),
            'debit_notes' => \App\Models\DebitNote::with(['customer', 'policy.policyProduct', 'policy.policyClass', 'policy.policyType'])
                ->where('tenant_id', $creditNote->tenant_id)
                ->where('status', '!=', 'cancelled')
                ->get(),
            'tenant_id' => $creditNote->tenant_id,
        ];
    }

    // ─── Legacy UI methods (kept for backward compatibility) ───

    public function buildQuery(Request $request)
    {
        $query = CreditNote::query()
            ->with(['customer', 'policy', 'createdBy'])
            ->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('note_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        return $query;
    }

    public function listNotes(Request $request, int $perPage = 10)
    {
        $query = $this->buildQuery($request);
        $notes = $query->paginate($perPage);

        $customers = \App\Models\Customer::select('id', 'first_name', 'last_name', 'company_name', 'type')->get();

        $stats = [
            'total_credit' => CreditNote::sum('amount'),
            'outstanding_credit' => CreditNote::where('status', 'issued')->sum('amount'),
            'overdue_count' => CreditNote::where('status', 'issued')
                ->where('due_date', '<', now())
                ->count(),
        ];

        return compact('notes', 'customers', 'stats');
    }

    public function getPoliciesByCustomer(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
        ]);

        $policies = Policy::where('customer_id', $request->customer_id)
            ->with('policyProduct:id,name')
            ->select('id', 'policy_number', 'policy_product_id', 'premium_amount')
            ->get();

        return $policies;
    }

    public function bulkAction(Request $request)
    {
        $request->validate([
            'action' => 'required|in:issue,cancel,delete',
            'note_ids' => 'required|array|min:1',
            'note_ids.*' => 'exists:credit_notes,id',
        ]);

        $notes = CreditNote::whereIn('id', $request->note_ids)->get();
        $processed = 0;

        foreach ($notes as $note) {
            try {
                match ($request->action) {
                    'issue' => $note->status === 'draft' ? $note->update(['status' => 'issued']) && $processed++ : null,
                    'cancel' => $note->status !== 'paid' ? $note->update(['status' => 'cancelled']) && $processed++ : null,
                    'delete' => $note->status === 'draft' ? $note->delete() && $processed++ : null,
                };
            } catch (\Exception $e) {
                continue;
            }
        }

        return $processed;
    }

    public function generatePdfDirect(CreditNote $creditNote): string
    {
        $creditNote->load(['customer', 'policy.policyProduct', 'createdBy', 'tenant']);

        $registry = config('document-templates.templates', []);
        $defaultTemplateKey = TenantDefaultTemplate::getDefaultTemplateKey($creditNote->tenant_id, 'credit_note')
            ?? 'credit_note.classic';

        $mapper = app(FinancialNotePayloadMapper::class);
        $payload = $mapper->mapCreditNote($creditNote);

        $generator = app(HtmlTemplatePdfGenerator::class);
        $html = $generator->renderHtml($creditNote->tenant, $defaultTemplateKey, $payload);

        return $this->pdfService->renderHtml($html);
    }
}
