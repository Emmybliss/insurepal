<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Policy;
use App\Models\PolicyApproval;
use App\Models\PolicyDocument;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PolicyIssuanceService
{
    /**
     * Create a new policy directly (Underwriter level)
     */
    public function createDirectPolicy(array $policyData, User $creator): Policy
    {
        return DB::transaction(function () use ($policyData, $creator) {
            // Generate policy number if not provided
            if (empty($policyData['policy_number'])) {
                $productCode = $this->getProductCode($policyData['policy_product_id']);
                $policyData['policy_number'] = Policy::generatePolicyNumber(
                    $creator->tenant_id,
                    $productCode
                );
            }

            // Set default values
            $policyData['tenant_id'] = $creator->tenant_id;
            $policyData['created_by'] = $creator->id;
            $policyData['status'] = Policy::STATUS_DRAFT;
            $policyData['source_type'] = Policy::SOURCE_DIRECT_ISSUANCE;
            $policyData['issued_by_id'] = $creator->id;

            // Determine if approval is required based on user role and policy amount
            if ($this->requiresApproval($creator, $policyData['total_amount'])) {
                $policyData['approval_status'] = Policy::APPROVAL_PENDING;
            } else {
                $policyData['approval_status'] = Policy::APPROVAL_NOT_REQUIRED;
                $policyData['status'] = Policy::STATUS_ACTIVE; // Auto-issue if no approval required
                $policyData['approved_by'] = $creator->id;
                $policyData['approved_at'] = now();
                $policyData['issued_at'] = now(); // Set issued timestamp
            }

            $policy = Policy::create($policyData);

            // Create approval record if needed
            if ($policy->requiresApproval()) {
                $this->createApprovalRecord($policy, $creator);
            }

            // Generate initial documents
            $this->generatePolicyDocuments($policy);

            Log::info('Direct policy created', [
                'policy_id' => $policy->id,
                'policy_number' => $policy->policy_number,
                'created_by' => $creator->id,
                'tenant_id' => $creator->tenant_id,
            ]);

            return $policy;
        });
    }

    /**
     * Record a placed policy (Broker records policy issued by underwriter)
     */
    public function recordPlacedPolicy(array $policyData, User $recorder, ?UploadedFile $scheduleFile = null, ?UploadedFile $brokerSlipFile = null): Policy
    {
        return DB::transaction(function () use ($policyData, $recorder, $scheduleFile, $brokerSlipFile) {
            $policyData['tenant_id'] = $recorder->tenant_id;
            $policyData['created_by'] = $recorder->id;
            $policyData['source_type'] = Policy::SOURCE_BROKER_RECORDED;
            $policyData['broker_id'] = $recorder->tenant_id;
            $policyData['status'] = Policy::STATUS_RECORDED;
            $policyData['approval_status'] = Policy::APPROVAL_NOT_REQUIRED;
            $policyData['is_policy_issued'] = true;
            $policyData['issued_at'] = now();

            if ($scheduleFile) {
                $path = $scheduleFile->store("tenants/{$recorder->tenant_id}/policies/schedules", 'public');
                $policyData['schedule_file_path'] = $path;
            }

            if ($brokerSlipFile) {
                $path = $brokerSlipFile->store("tenants/{$recorder->tenant_id}/policies/broker-slips", 'public');
                $policyData['broker_slip_file_path'] = $path;
            }

            $policy = Policy::create($policyData);

            Log::info('Placed policy recorded by broker', [
                'policy_id' => $policy->id,
                'policy_number' => $policy->policy_number,
                'broker_slip_number' => $policy->broker_slip_number,
                'broker_id' => $recorder->tenant_id,
            ]);

            return $policy;
        });
    }

    /**
     * Convert a quote to policy
     */
    public function convertQuoteToPolicy(Quote $quote, User $converter, array $additionalData = []): Policy
    {
        return DB::transaction(function () use ($quote, $converter, $additionalData) {
            // Validate quote can be converted
            if (! $quote->canBeConverted()) {
                throw new \Exception('Quote cannot be converted to policy in current status');
            }

            // Prepare policy data from quote
            $policyData = array_merge([
                'tenant_id' => $quote->tenant_id,
                'customer_id' => $quote->customer_id,
                'quote_id' => $quote->id,
                'policy_product_id' => $quote->insurance_product_id, // Note: Quote still uses insurance_product_id
                'coverage_details' => $quote->coverage_details,
                'premium_amount' => $quote->premium_amount,
                'commission_amount' => $quote->commission_amount,
                'total_amount' => $quote->total_amount,
                'form_data' => $quote->form_data,
                'notes' => $quote->notes,
                'created_by' => $converter->id,
            ], $additionalData);

            // Generate policy number
            $productCode = $this->getProductCode($quote->insurance_product_id);
            $policyData['policy_number'] = Policy::generatePolicyNumber(
                $quote->tenant_id,
                $productCode
            );

            // Set status and approval requirements
            if ($this->requiresApproval($converter, $policyData['total_amount'])) {
                $policyData['status'] = Policy::STATUS_PENDING_APPROVAL;
                $policyData['approval_status'] = Policy::APPROVAL_PENDING;
            } else {
                $policyData['status'] = Policy::STATUS_APPROVED;
                $policyData['approval_status'] = Policy::APPROVAL_NOT_REQUIRED;
                $policyData['approved_by'] = $converter->id;
                $policyData['approved_at'] = now();
            }

            $policy = Policy::create($policyData);

            // Update quote status
            $quote->update(['status' => Quote::STATUS_CONVERTED]);

            // Create approval record if needed
            if ($policy->requiresApproval()) {
                $this->createApprovalRecord($policy, $converter, PolicyApproval::TYPE_NEW_POLICY);
            }

            // Generate policy documents
            $this->generatePolicyDocuments($policy);

            Log::info('Quote converted to policy', [
                'policy_id' => $policy->id,
                'quote_id' => $quote->id,
                'policy_number' => $policy->policy_number,
                'converted_by' => $converter->id,
            ]);

            return $policy;
        });
    }

    /**
     * Submit policy for approval (Broker level)
     */
    public function submitPolicyForApproval(Policy $policy, User $submitter, ?string $notes = null): PolicyApproval
    {
        return DB::transaction(function () use ($policy, $submitter, $notes) {
            // Validate policy can be submitted
            if (! $policy->isDraft()) {
                throw new \Exception('Only draft policies can be submitted for approval');
            }

            // Update policy status
            $policy->update([
                'status' => Policy::STATUS_PENDING_APPROVAL,
                'approval_status' => Policy::APPROVAL_PENDING,
            ]);

            // Create or update approval record
            $approval = $this->createApprovalRecord($policy, $submitter, PolicyApproval::TYPE_NEW_POLICY, $notes);

            // Notify underwriters
            $this->notifyUnderwriters($approval);

            Log::info('Policy submitted for approval', [
                'policy_id' => $policy->id,
                'approval_id' => $approval->id,
                'submitted_by' => $submitter->id,
            ]);

            return $approval;
        });
    }

    /**
     * Approve a policy
     */
    public function approvePolicy(Policy $policy, User $approver, ?string $notes = null): void
    {
        DB::transaction(function () use ($policy, $approver, $notes) {
            if (! $policy->isPendingApproval()) {
                throw new \Exception('Policy is not pending approval');
            }

            // Update policy
            $policy->approve($approver, $notes);

            // Update approval record
            $approval = $policy->approvals()->pending()->first();
            if ($approval) {
                $approval->approve($approver, $notes);
            }

            // Generate final policy documents
            $this->generatePolicyDocuments($policy);

            // Notify requestor
            $this->notifyPolicyApproved($policy);

            Log::info('Policy approved', [
                'policy_id' => $policy->id,
                'approved_by' => $approver->id,
            ]);
        });
    }

    /**
     * Reject a policy
     */
    public function rejectPolicy(Policy $policy, User $approver, string $reason): void
    {
        DB::transaction(function () use ($policy, $approver, $reason) {
            if (! $policy->isPendingApproval()) {
                throw new \Exception('Policy is not pending approval');
            }

            // Update policy
            $policy->reject($approver, $reason);

            // Update approval record
            $approval = $policy->approvals()->pending()->first();
            if ($approval) {
                $approval->reject($approver, $reason);
            }

            // Notify requestor
            $this->notifyPolicyRejected($policy, $reason);

            Log::info('Policy rejected', [
                'policy_id' => $policy->id,
                'rejected_by' => $approver->id,
                'reason' => $reason,
            ]);
        });
    }

    /**
     * Issue an approved policy
     */
    public function issuePolicy(Policy $policy): void
    {
        DB::transaction(function () use ($policy) {
            if (! $policy->canBeIssued()) {
                throw new \Exception('Policy cannot be issued in current status');
            }

            // Issue the policy
            $policy->issue();

            // Generate customer-facing documents
            $this->generateCustomerDocuments($policy);

            // Send policy documents to customer
            $this->sendPolicyToCustomer($policy);

            // Create financial note for premium collection
            $this->createFinancialNote($policy);

            Log::info('Policy issued', [
                'policy_id' => $policy->id,
                'policy_number' => $policy->policy_number,
            ]);
        });
    }

    /**
     * Bulk issue multiple policies
     */
    public function bulkIssue(array $policyIds, User $issuer): array
    {
        $results = [];

        foreach ($policyIds as $policyId) {
            try {
                $policy = Policy::findOrFail($policyId);

                // Check permissions
                if (! $this->canIssuePolicy($issuer, $policy)) {
                    $results[$policyId] = ['status' => 'error', 'message' => 'Insufficient permissions'];

                    continue;
                }

                $this->issuePolicy($policy);
                $results[$policyId] = ['status' => 'success', 'message' => 'Policy issued successfully'];
            } catch (\Exception $e) {
                $results[$policyId] = ['status' => 'error', 'message' => $e->getMessage()];
                Log::error('Bulk policy issuance failed', [
                    'policy_id' => $policyId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $results;
    }

    /**
     * Check if approval is required
     */
    protected function requiresApproval(User $user, float $amount): bool
    {
        // Super admins don't need approval
        if ($user->hasRole('super_admin')) {
            return false;
        }

        // Underwriters have higher approval limits
        if ($user->hasRole('underwriter')) {
            $limit = config('insurance.underwriter_approval_limit', 1000000); // 1M default

            return $amount > $limit;
        }

        // Brokers need approval for most policies
        if ($user->hasRole('broker')) {
            $limit = config('insurance.broker_approval_limit', 100000); // 100K default

            return $amount > $limit;
        }

        // Staff members need approval for everything
        return true;
    }

    /**
     * Create approval record
     */
    protected function createApprovalRecord(
        Policy $policy,
        User $requester,
        string $type = PolicyApproval::TYPE_NEW_POLICY,
        ?string $notes = null
    ): PolicyApproval {
        return PolicyApproval::create([
            'tenant_id' => $policy->tenant_id,
            'policy_id' => $policy->id,
            'requested_by' => $requester->id,
            'status' => PolicyApproval::STATUS_PENDING,
            'approval_type' => $type,
            'policy_amount' => $policy->total_amount,
            'approval_data' => $policy->toArray(),
            'request_notes' => $notes,
            'requested_at' => now(),
        ]);
    }

    /**
     * Generate policy documents
     */
    protected function generatePolicyDocuments(Policy $policy): void
    {
        $documentTypes = [
            PolicyDocument::TYPE_POLICY_CERTIFICATE,
            PolicyDocument::TYPE_POLICY_SCHEDULE,
            PolicyDocument::TYPE_TERMS_CONDITIONS,
        ];

        foreach ($documentTypes as $type) {
            PolicyDocument::create([
                'tenant_id' => $policy->tenant_id,
                'policy_id' => $policy->id,
                'document_type' => $type,
                'document_name' => $this->getDocumentName($type, $policy),
                'file_name' => $this->generateFileName($type, $policy),
                'file_path' => '', // Will be set when document is generated
                'file_type' => 'pdf',
                'status' => PolicyDocument::STATUS_GENERATING,
                'is_customer_facing' => $this->isCustomerFacingDocument($type),
                'generated_by' => Auth::id(),
                'generation_data' => $policy->toArray(),
            ]);
        }

        // Queue document generation job
        // GeneratePolicyDocumentsJob::dispatch($policy);
    }

    /**
     * Generate customer-facing documents only
     */
    protected function generateCustomerDocuments(Policy $policy): void
    {
        // Implementation for customer-specific documents
    }

    /**
     * Send policy documents to customer
     */
    protected function sendPolicyToCustomer(Policy $policy): void
    {
        // Implementation for sending documents to customer
        // This would typically queue an email job
    }

    /**
     * Create financial note for premium collection
     */
    protected function createFinancialNote(Policy $policy): void
    {
        // Implementation to create debit note for premium collection
    }

    /**
     * Check if user can issue policy
     */
    protected function canIssuePolicy(User $user, Policy $policy): bool
    {
        // Check basic permissions
        if (! $user->can('create_policies')) {
            return false;
        }

        // Check tenant access
        if ($user->tenant_id !== $policy->tenant_id) {
            return false;
        }

        // Check if policy can be issued
        return $policy->canBeIssued();
    }

    /**
     * Notification methods
     */
    protected function notifyUnderwriters(PolicyApproval $approval): void
    {
        // Send notifications to underwriters about new policy approval request
    }

    protected function notifyPolicyApproved(Policy $policy): void
    {
        // Send notification about policy approval
    }

    protected function notifyPolicyRejected(Policy $policy, string $reason): void
    {
        // Send notification about policy rejection
    }

    /**
     * Helper methods
     */
    protected function getProductCode(int $productId): string
    {
        // Get product code from insurance product
        return 'POL'; // Default
    }

    protected function getDocumentName(string $type, Policy $policy): string
    {
        return match ($type) {
            PolicyDocument::TYPE_POLICY_CERTIFICATE => 'Policy Certificate - '.$policy->policy_number,
            PolicyDocument::TYPE_POLICY_SCHEDULE => 'Policy Schedule - '.$policy->policy_number,
            PolicyDocument::TYPE_TERMS_CONDITIONS => 'Terms & Conditions - '.$policy->policy_number,
            default => ucwords(str_replace('_', ' ', $type)).' - '.$policy->policy_number,
        };
    }

    protected function generateFileName(string $type, Policy $policy): string
    {
        $prefix = strtolower(str_replace('_', '-', $type));

        return "{$prefix}-{$policy->policy_number}.pdf";
    }

    protected function isCustomerFacingDocument(string $type): bool
    {
        return in_array($type, [
            PolicyDocument::TYPE_POLICY_CERTIFICATE,
            PolicyDocument::TYPE_POLICY_SCHEDULE,
            PolicyDocument::TYPE_TERMS_CONDITIONS,
            PolicyDocument::TYPE_COVERAGE_SUMMARY,
        ]);
    }
}
