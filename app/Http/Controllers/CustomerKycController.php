<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CustomerKycController extends Controller
{
    /**
     * Show KYC page for Tenant Admin managing a customer.
     */
    public function show(Customer $customer)
    {
        $this->authorize('view', $customer);

        $customer->load(['kyc', 'user']);

        return Inertia::render('customers/kyc', [
            'customer' => $customer,
            'kyc' => $customer->kyc,
        ]);
    }

    /**
     * Update KYC for a customer (Tenant Admin).
     */
    public function update(Request $request, Customer $customer)
    {
        $this->authorize('update', $customer);

        $validated = $request->validate([
            'status' => 'required|in:pending,verified,rejected',
            'identity_type' => 'nullable|string|max:100',
            'identity_number' => 'nullable|string|max:100',
            'nin' => 'nullable|string|max:20',
            'bvn' => 'nullable|string|max:20',
            'notes' => 'nullable|string|max:2000',
            'identity_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'address_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $kyc = $customer->kyc ?? $customer->kyc()->newModelInstance(['customer_id' => $customer->id]);

        $kyc->fill([
            'status' => $validated['status'],
            'identity_type' => $validated['identity_type'] ?? null,
            'identity_number' => $validated['identity_number'] ?? null,
            'nin' => $validated['nin'] ?? null,
            'bvn' => $validated['bvn'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        if ($validated['status'] === 'verified') {
            $kyc->verified_at = $kyc->verified_at ?? now();
        } elseif ($validated['status'] !== 'verified') {
            $kyc->verified_at = null;
        }

        if ($request->hasFile('identity_document')) {
            if ($kyc->identity_document_path) {
                Storage::disk('public')->delete($kyc->identity_document_path);
            }
            $kyc->identity_document_path = $request->file('identity_document')
                ->store('kyc/identity', 'public');
        }

        if ($request->hasFile('address_document')) {
            if ($kyc->address_document_path) {
                Storage::disk('public')->delete($kyc->address_document_path);
            }
            $kyc->address_document_path = $request->file('address_document')
                ->store('kyc/address', 'public');
        }

        $kyc->save();

        return back()->with('success', 'KYC information updated successfully.');
    }

    /**
     * Show KYC page for a Customer (Customer Portal).
     */
    public function customerShow()
    {
        $user = Auth::user();
        $customer = $user->customers()->with(['kyc', 'user'])->first();

        if (! $customer) {
            abort(404, 'Customer profile not found');
        }

        return Inertia::render('customer-portal/kyc', [
            'customer' => $customer,
            'kyc' => $customer->kyc,
        ]);
    }

    /**
     * Customer submits/updates their own KYC from the portal.
     */
    public function customerUpdate(Request $request)
    {
        $user = Auth::user();
        $customer = $user->customers()->first();

        if (! $customer) {
            abort(404, 'Customer profile not found');
        }

        $validated = $request->validate([
            'identity_type' => 'nullable|string|max:100',
            'identity_number' => 'nullable|string|max:100',
            'nin' => 'nullable|string|max:20',
            'bvn' => 'nullable|string|max:20',
            'identity_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'address_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $kyc = $customer->kyc ?? $customer->kyc()->newModelInstance(['customer_id' => $customer->id]);

        // If new documents are uploaded, set status back to pending for review
        $hasNewDocuments = $request->hasFile('identity_document') || $request->hasFile('address_document');

        $kyc->fill([
            'identity_type' => $validated['identity_type'] ?? $kyc->identity_type,
            'identity_number' => $validated['identity_number'] ?? $kyc->identity_number,
            'nin' => $validated['nin'] ?? $kyc->nin,
            'bvn' => $validated['bvn'] ?? $kyc->bvn,
        ]);

        if ($hasNewDocuments) {
            $kyc->status = 'pending';
            $kyc->verified_at = null;
        }

        if ($request->hasFile('identity_document')) {
            if ($kyc->identity_document_path) {
                Storage::disk('public')->delete($kyc->identity_document_path);
            }
            $kyc->identity_document_path = $request->file('identity_document')
                ->store('kyc/identity', 'public');
        }
        if ($request->hasFile('address_document')) {
            if ($kyc->address_document_path) {
                Storage::disk('public')->delete($kyc->address_document_path);
            }
            $kyc->address_document_path = $request->file('address_document')
                ->store('kyc/address', 'public');
        }

        $kyc->save();

        return back()->with('success', 'Your KYC information has been submitted for review.');
    }
}
