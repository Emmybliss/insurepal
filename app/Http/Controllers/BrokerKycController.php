<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\TenantKyc;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class BrokerKycController extends Controller
{
    /**
     * Show KYC details for a specific broker (Underwriter view).
     */
    public function show(Tenant $broker)
    {
        $user = Auth::user();

        // Ensure the current user's tenant is the parent of the broker
        if ($broker->parent_tenant_id !== $user->tenant_id) {
            abort(403, 'Unauthorized access to broker KYC.');
        }

        $broker->load('kyc');

        return Inertia::render('Brokers/Kyc', [
            'broker' => $broker,
            'kyc' => $broker->kyc,
        ]);
    }

    /**
     * Update KYC status (Underwriter view).
     */
    public function update(Request $request, Tenant $broker)
    {
        $user = Auth::user();

        if ($broker->parent_tenant_id !== $user->tenant_id) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,verified,rejected',
            'notes' => 'nullable|string|max:2000',
            'rc_number' => 'nullable|string|max:50',
            'naicom_reg_number' => 'nullable|string|max:50',
            'tin' => 'nullable|string|max:50',
            'incorporation_cert' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'naicom_license' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'prof_indemnity' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $kyc = $broker->kyc ?? new TenantKyc(['tenant_id' => $broker->id]);

        $kyc->status = $validated['status'];
        $kyc->notes = $validated['notes'];
        $kyc->rc_number = $validated['rc_number'] ?? $kyc->rc_number;
        $kyc->naicom_reg_number = $validated['naicom_reg_number'] ?? $kyc->naicom_reg_number;
        $kyc->tin = $validated['tin'] ?? $kyc->tin;

        if ($validated['status'] === 'verified') {
            $kyc->verified_at = now();
        } else {
            $kyc->verified_at = null;
        }

        if ($request->hasFile('incorporation_cert')) {
            if ($kyc->incorporation_cert_path) {
                Storage::disk('public')->delete($kyc->incorporation_cert_path);
            }
            $kyc->incorporation_cert_path = $request->file('incorporation_cert')->store('kyc/tenants/certs', 'public');
        }

        if ($request->hasFile('naicom_license')) {
            if ($kyc->naicom_license_path) {
                Storage::disk('public')->delete($kyc->naicom_license_path);
            }
            $kyc->naicom_license_path = $request->file('naicom_license')->store('kyc/tenants/licenses', 'public');
        }

        if ($request->hasFile('prof_indemnity')) {
            if ($kyc->prof_indemnity_path) {
                Storage::disk('public')->delete($kyc->prof_indemnity_path);
            }
            $kyc->prof_indemnity_path = $request->file('prof_indemnity')->store('kyc/tenants/indemnity', 'public');
        }

        $kyc->save();

        return back()->with('success', 'Broker KYC updated successfully.');
    }

    /**
     * Show KYC submission page for the broker (Broker view).
     */
    public function brokerShow()
    {
        $tenant = Auth::user()->tenant;

        if ($tenant->type !== 'broker') {
            abort(403, 'Only brokers can access this page.');
        }

        $tenant->load('kyc');

        return Inertia::render('settings/BrokerKyc', [
            'tenant' => $tenant,
            'kyc' => $tenant->kyc,
        ]);
    }

    /**
     * Broker submits/updates their own KYC documents.
     */
    public function brokerUpdate(Request $request)
    {
        $tenant = Auth::user()->tenant;

        $validated = $request->validate([
            'rc_number' => 'nullable|string|max:50',
            'naicom_reg_number' => 'nullable|string|max:50',
            'tin' => 'nullable|string|max:50',
            'incorporation_cert' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'naicom_license' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'prof_indemnity' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $kyc = $tenant->kyc ?? new TenantKyc(['tenant_id' => $tenant->id]);

        $kyc->fill([
            'rc_number' => $validated['rc_number'] ?? $kyc->rc_number,
            'naicom_reg_number' => $validated['naicom_reg_number'] ?? $kyc->naicom_reg_number,
            'tin' => $validated['tin'] ?? $kyc->tin,
            'status' => 'pending', // Reset to pending for review
            'verified_at' => null,
        ]);

        if ($request->hasFile('incorporation_cert')) {
            if ($kyc->incorporation_cert_path) {
                Storage::disk('public')->delete($kyc->incorporation_cert_path);
            }
            $kyc->incorporation_cert_path = $request->file('incorporation_cert')->store('kyc/tenants/certs', 'public');
        }

        if ($request->hasFile('naicom_license')) {
            if ($kyc->naicom_license_path) {
                Storage::disk('public')->delete($kyc->naicom_license_path);
            }
            $kyc->naicom_license_path = $request->file('naicom_license')->store('kyc/tenants/licenses', 'public');
        }

        if ($request->hasFile('prof_indemnity')) {
            if ($kyc->prof_indemnity_path) {
                Storage::disk('public')->delete($kyc->prof_indemnity_path);
            }
            $kyc->prof_indemnity_path = $request->file('prof_indemnity')->store('kyc/tenants/indemnity', 'public');
        }

        $kyc->save();

        return back()->with('success', 'Your KYC documents have been submitted for review.');
    }
}
