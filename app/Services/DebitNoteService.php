<?php

namespace App\Services;

use App\Events\DebitNoteGenerated;
use App\Models\Customer;
use App\Models\DebitNote;
use App\Models\Policy;
use App\Models\PolicyClass;
use App\Models\PolicyType;
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

class DebitNoteService
{
    public function __construct(
        protected DocumentGenerationService $documentService,
        protected PdfService $pdfService
    ) {}

    public function create(array $data, int $tenantId, int $userId): DebitNote
    {
        return DB::transaction(function () use ($data, $tenantId, $userId) {
            $noteNumber = DebitNote::generateDebitNoteNumber($tenantId);
            $sequenceNumber = $this->getNextSequenceNumber($tenantId);

            $note = DebitNote::create([
                'note_number' => $noteNumber,
                'sequence_number' => $sequenceNumber,
                'tenant_id' => $tenantId,
                'customer_id' => $data['customer_id'],
                'policy_id' => $data['policy_id'] ?? null,
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
                'type' => $data['type'] ?? DebitNote::TYPE_STANDARD,
                'transaction_type' => $data['transaction_type'] ?? null,
                'policy_type' => $data['policy_type'] ?? null,
                'class_of_business' => $data['class_of_business'] ?? null,
                'items' => $data['items'] ?? null,
                'metadata' => $data['metadata'] ?? null,
                'status' => DebitNote::STATUS_DRAFT,
                'created_by_id' => $userId,
            ]);

            return $note->fresh();
        });
    }

    public function createFromPolicy(Policy $policy, array $data, int $userId): DebitNote
    {
        return DB::transaction(function () use ($policy, $data, $userId) {
            $sequenceNumber = $this->getNextSequenceNumber($policy->tenant_id);
            $year = now()->year;
            $noteNumber = sprintf('DN-%d-%d-%06d', $year, $policy->tenant_id, $sequenceNumber);

            return DebitNote::create([
                'note_number' => $noteNumber,
                'sequence_number' => $sequenceNumber,
                'tenant_id' => $policy->tenant_id,
                'customer_id' => $policy->customer_id,
                'policy_id' => $policy->id,
                'broker_id' => null,
                'amount' => $data['amount'],
                'tax_amount' => $data['tax_amount'] ?? 0,
                'total_amount' => ($data['amount'] + ($data['tax_amount'] ?? 0)),
                'description' => $data['description'] ?? 'Debit Note for Policy #'.$policy->policy_number,
                'issue_date' => now()->format('Y-m-d'),
                'due_date' => $data['due_date'] ?? now()->addDays(30)->format('Y-m-d'),
                'created_by_id' => $userId,
                'items' => $data['items'] ?? null,
                'premium_breakdown' => $policy->coverage_details,
                'currency_code' => 'NGN',
            ]);
        });
    }

    public function update(DebitNote $debitNote, array $data): DebitNote
    {
        if (! $this->canModify($debitNote)) {
            throw new \RuntimeException('Only draft notes can be edited.');
        }

        $debitNote->update($data);

        return $debitNote->fresh();
    }

    public function delete(DebitNote $debitNote): void
    {
        if (! $this->canModify($debitNote)) {
            throw new \RuntimeException('Only draft notes can be deleted.');
        }

        $debitNote->delete();
    }

    public function issue(DebitNote $debitNote): DebitNote
    {
        if (! $this->canIssueNote($debitNote)) {
            throw new \RuntimeException('Only draft or generated notes can be issued.');
        }

        $debitNote->update([
            'status' => DebitNote::STATUS_ISSUED,
            'issue_date' => now(),
        ]);

        $debitNote = $debitNote->fresh();

        DebitNoteGenerated::dispatch($debitNote);

        return $debitNote;
    }

    public function markAsPaid(DebitNote $debitNote, User $user, ?array $paymentData = null): DebitNote
    {
        if ($debitNote->status !== DebitNote::STATUS_ISSUED) {
            throw new \RuntimeException('Only issued debit notes can be marked as paid.');
        }

        if ($debitNote->paid_at) {
            throw new \RuntimeException('This debit note has already been marked as paid.');
        }

        $updateData = [
            'status' => DebitNote::STATUS_PAID,
            'paid_at' => $paymentData['payment_date'] ?? now(),
        ];

        if (! empty($paymentData['payment_reference'])) {
            $metadata = array_merge(
                (array) $debitNote->metadata,
                [
                    'payment_reference' => $paymentData['payment_reference'],
                    'marked_paid_by' => $user->id,
                    'marked_paid_at' => now(),
                ]
            );
            $updateData['metadata'] = $metadata;
        }

        $debitNote->update($updateData);

        return $debitNote->fresh();
    }

    public function cancel(DebitNote $debitNote, ?string $reason = null, ?int $cancelledBy = null): DebitNote
    {
        if (! $this->canCancelNote($debitNote)) {
            throw new \RuntimeException('Debit note cannot be cancelled in its current status.');
        }

        $debitNote->update([
            'status' => DebitNote::STATUS_CANCELLED,
            'cancelled_at' => now(),
            'cancelled_by_id' => $cancelledBy,
            'cancellation_reason' => $reason,
        ]);

        return $debitNote->fresh();
    }

    public function generatePdf(DebitNote $debitNote, string $templateKey, string $type): DebitNote
    {
        $mapper = app(FinancialNotePayloadMapper::class);
        $generator = app(HtmlTemplatePdfGenerator::class);
        $verificationService = app(DocumentVerificationService::class);

        $payload = $mapper->mapDebitNote($debitNote);
        $fileName = 'debit-note-'.uniqid().'.pdf';

        $result = $generator->generateAndStore(
            $debitNote->tenant,
            $templateKey,
            $payload,
            'debit-notes',
            $fileName
        );

        $snapshot = $verificationService->computeSnapshot($payload);
        $documentHash = $verificationService->generateDocumentHash($snapshot);

        $metadata = $debitNote->metadata ?? [];
        $metadata['metadata'] = array_merge(
            (array) ($metadata['metadata'] ?? []),
            [
                'template_key' => $templateKey,
                'generated_at' => now()->toISOString(),
            ]
        );

        $debitNote->update([
            'type' => $type,
            'status' => DebitNote::STATUS_GENERATED,
            'generated_at' => now(),
            'file_path' => $result['path'],
            'file_name' => $fileName,
            'file_size' => $result['file_size'],
            'file_hash' => $result['file_hash'],
            'metadata' => $metadata,
            'snapshot_json' => $snapshot,
            'document_hash' => $documentHash,
        ]);

        return $debitNote->fresh();
    }

    public function regeneratePdf(DebitNote $debitNote, string $templateKey, string $type): DebitNote
    {
        if ($debitNote->file_path && Storage::disk('public')->exists($debitNote->file_path)) {
            Storage::disk('public')->delete($debitNote->file_path);
        }

        $mapper = app(FinancialNotePayloadMapper::class);
        $generator = app(HtmlTemplatePdfGenerator::class);
        $verificationService = app(DocumentVerificationService::class);

        $payload = $mapper->mapDebitNote($debitNote);
        $fileName = 'debit-note-'.uniqid().'.pdf';

        $result = $generator->generateAndStore(
            $debitNote->tenant,
            $templateKey,
            $payload,
            'debit-notes',
            $fileName
        );

        $snapshot = $verificationService->computeSnapshot($payload);
        $documentHash = $verificationService->generateDocumentHash($snapshot);

        $debitNote->update([
            'type' => $type,
            'status' => DebitNote::STATUS_GENERATED,
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

        return $debitNote->fresh();
    }

    public function downloadPdf(DebitNote $debitNote): ?string
    {
        if (! $debitNote->file_path || ! Storage::disk('public')->exists($debitNote->file_path)) {
            return null;
        }

        return $debitNote->file_path;
    }

    protected function generateNoteNumber(int $tenantId): string
    {
        return DebitNote::generateDebitNoteNumber($tenantId);
    }

    protected function getNextSequenceNumber(int $tenantId): int
    {
        return DB::transaction(function () use ($tenantId) {
            $lastSequence = DebitNote::withTrashed()
                ->where('tenant_id', $tenantId)
                ->orderBy('sequence_number', 'desc')
                ->lockForUpdate()
                ->first();

            return $lastSequence ? $lastSequence->sequence_number + 1 : 1;
        });
    }

    // ─── Status Check Methods ───

    public function canModify(DebitNote $debitNote): bool
    {
        return $debitNote->status === DebitNote::STATUS_DRAFT;
    }

    public function canIssueNote(DebitNote $debitNote): bool
    {
        return in_array($debitNote->status, [DebitNote::STATUS_DRAFT, DebitNote::STATUS_GENERATED]);
    }

    public function canCancelNote(DebitNote $debitNote): bool
    {
        return ! in_array($debitNote->status, [DebitNote::STATUS_PAID, DebitNote::STATUS_CANCELLED, 'void']);
    }

    public function getGenerationOptions(DebitNote $debitNote): array
    {
        $registry = config('document-templates.templates', []);
        $defaultTemplateKey = TenantDefaultTemplate::getDefaultTemplateKey($debitNote->tenant_id, 'debit_note')
            ?? 'debit_note.classic';
        $defaultTemplate = $registry[$defaultTemplateKey] ?? null;

        $existingNotes = DebitNote::where('policy_id', $debitNote->policy_id)
            ->active()
            ->get(['id', 'type', 'status', 'note_number', 'generated_at']);

        $tempNoteNumber = DebitNote::generateDebitNoteNumber(
            $debitNote->tenant_id,
            'TEMP'
        );

        return [
            'registry' => $registry,
            'defaultTemplateKey' => $defaultTemplateKey,
            'defaultTemplate' => $defaultTemplate,
            'existingDebitNotes' => $existingNotes,
            'qrBarcodeData' => [
                'qr_code_policy' => url('/media/qrcode/'.urlencode($debitNote->policy?->policy_number ?? 'N/A')),
                'qr_code_debit_note' => url('/media/qrcode/'.urlencode($tempNoteNumber)),
                'barcode_policy' => url('/media/barcode/'.urlencode($debitNote->policy?->policy_number ?? 'N/A')),
                'barcode_debit_note' => url('/media/barcode/'.urlencode($tempNoteNumber)),
            ],
        ];
    }

    public function generate(DebitNote $debitNote, string $templateKey, string $type): DebitNote
    {
        $registry = config('document-templates.templates', []);
        $template = $registry[$templateKey] ?? null;

        if (! $template) {
            throw new \RuntimeException("Template '{$templateKey}' not found.");
        }

        $debitNote = $this->generatePdf($debitNote, $templateKey, $type);

        if (method_exists($debitNote, 'addToAuditTrail')) {
            $debitNote->addToAuditTrail('generated', 'Debit note generated', 'Template: '.$templateKey);
        }

        DebitNoteGenerated::dispatch($debitNote);

        return $debitNote;
    }

    public function regenerate(DebitNote $debitNote, string $templateKey, string $type): DebitNote
    {
        $debitNote = $this->regeneratePdf($debitNote, $templateKey, $type);

        if (method_exists($debitNote, 'addToAuditTrail')) {
            $debitNote->addToAuditTrail('regenerated', 'Debit note regenerated with new PDF', 'Template: '.$templateKey);
        }

        return $debitNote;
    }

    public function download(DebitNote $debitNote): ?string
    {
        $filePath = $this->downloadPdf($debitNote);

        if ($filePath && method_exists($debitNote, 'addToAuditTrail')) {
            $debitNote->addToAuditTrail('downloaded', 'Debit note downloaded by '.request()->user()->name);
        }

        return $filePath;
    }

    public function preview(DebitNote $debitNote): ?string
    {
        $filePath = $this->downloadPdf($debitNote);

        if ($filePath && method_exists($debitNote, 'addToAuditTrail')) {
            $debitNote->addToAuditTrail('previewed', 'Debit note previewed by '.request()->user()->name);
        }

        return $filePath;
    }

    public function htmlPreview(DebitNote $debitNote, string $templateKey): ?string
    {
        $debitNote->load(['customer', 'policy.policyProduct', 'createdBy', 'tenant']);

        $registry = config('document-templates.templates', []);
        $template = $registry[$templateKey] ?? null;

        if (! $template) {
            return null;
        }

        $mapper = app(FinancialNotePayloadMapper::class);
        $generator = app(HtmlTemplatePdfGenerator::class);

        $payload = $mapper->mapDebitNote($debitNote);

        try {
            return $generator->renderHtml(
                $debitNote->tenant,
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

    public function getEditData(DebitNote $debitNote): array
    {
        return [
            'customers' => Customer::active()->get(),
            'policies' => Policy::where('customer_id', $debitNote->customer_id)
                ->with('policyProduct')
                ->get(),
            'tenant_id' => $debitNote->tenant_id,
            'policyTypes' => PolicyType::where('is_active', true)->orderBy('sort_order')->get(['id', 'name']),
            'policyClasses' => PolicyClass::select('id', 'name', 'policy_type_id')->get(),
        ];
    }

    // ─── Legacy UI methods (kept for backward compatibility) ───

    public function buildQuery(Request $request)
    {
        $query = DebitNote::query()
            ->with(['customer', 'policy', 'createdBy'])
            ->latest();

        return $query;
    }

    public function listNotes(Request $request, int $perPage = 10)
    {
        $query = $this->buildQuery($request);
        $notes = $query->paginate($perPage);

        $customers = \App\Models\Customer::select('id', 'first_name', 'last_name', 'company_name', 'type')->get();

        $stats = [
            'total_debit' => DebitNote::sum('amount'),
            'outstanding_debit' => DebitNote::where('status', 'issued')->sum('amount'),
            'overdue_count' => DebitNote::where('status', 'issued')
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
            'note_ids.*' => 'exists:debit_notes,id',
        ]);

        $notes = DebitNote::whereIn('id', $request->note_ids)->get();
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

    public function generatePdfDirect(DebitNote $debitNote): string
    {
        $debitNote->load(['customer', 'policy.policyProduct', 'createdBy', 'tenant']);

        $registry = config('document-templates.templates', []);
        $defaultTemplateKey = TenantDefaultTemplate::getDefaultTemplateKey($debitNote->tenant_id, 'debit_note')
            ?? 'debit_note.classic';

        $mapper = app(FinancialNotePayloadMapper::class);
        $payload = $mapper->mapDebitNote($debitNote);

        $generator = app(HtmlTemplatePdfGenerator::class);
        $html = $generator->renderHtml($debitNote->tenant, $defaultTemplateKey, $payload);

        return $this->pdfService->renderHtml($html);
    }
}
