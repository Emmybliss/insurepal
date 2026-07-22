<?php

namespace App\Services\Claims;

use App\Models\Claim;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RegisterClaimService
{
    public function register(array $data, User $user): Claim
    {
        return DB::transaction(function () use ($data, $user) {
            $claim = Claim::create([
                'tenant_id' => $user->tenant_id,
                'policy_id' => $data['policy_id'],
                'customer_id' => $data['customer_id'],
                'claim_reference' => Claim::generateClaimReference($user->tenant_id),
                'claim_type' => $data['claim_type'],
                'incident_date' => $data['incident_date'],
                'incident_description' => $data['incident_description'],
                'incident_location' => $data['incident_location'] ?? null,
                'claim_amount' => $data['claim_amount'],
                'internal_notes' => $data['internal_notes'] ?? null,
                'metadata' => $data['metadata'] ?? null,
                'status' => Claim::STATUS_DRAFT,
            ]);

            $claim->logActivity($user, 'created', 'Claim created');

            return $claim;
        });
    }

    public function updateClaim(Claim $claim, array $data, User $user): Claim
    {
        $claim->update($data);
        $claim->logActivity($user, 'updated', 'Claim details updated');

        return $claim;
    }

    public function uploadDocuments(Claim $claim, array $files, User $user, array $documentTypes = [], array $descriptions = []): void
    {
        DB::transaction(function () use ($claim, $files, $user, $documentTypes, $descriptions) {
            foreach ($files as $index => $file) {
                $path = $file->store('claims/'.$claim->id.'/documents', 'public');

                $claim->documents()->create([
                    'uploaded_by' => $user->id,
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_type' => $file->getClientOriginalExtension(),
                    'file_size' => $file->getSize(),
                    'document_type' => $documentTypes[$index] ?? 'other',
                    'description' => $descriptions[$index] ?? null,
                ]);
            }

            $claim->logActivity($user, 'documents_uploaded', 'Documents uploaded to claim');
        });
    }
}
