<?php

namespace App\Http\Controllers;

use App\Models\InsuranceCompany;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InsuranceCompanySearchController extends Controller
{
    /**
     * Search for insurance companies (registry + existing tenants).
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->get('q');
        $type = $request->get('type', 'all'); // broker, underwriter, all

        if (empty($query) || strlen($query) < 2) {
            return response()->json([]);
        }

        // 1. Search Registry
        $registryResults = InsuranceCompany::query()
            ->active()
            ->byType($type)
            ->where('name', 'like', "%{$query}%")
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'source' => 'registry',
                    'name' => $item->name,
                    'email' => $item->email,
                    'phone' => $item->phone,
                    'address' => $item->address,
                    'website' => $item->website,
                    'naicom_reg_number' => $item->naicom_reg_number,
                    'ncrib_reg_number' => $item->ncrib_reg_number,
                    'rc_number' => $item->rc_number,
                ];
            });

        // 2. Search Existing Tenants
        $tenantQuery = Tenant::query()
            ->where('name', 'like', "%{$query}%");

        if ($type !== 'all') {
            $tenantQuery->where('type', $type);
        }

        $tenantResults = $tenantQuery->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'source' => 'tenant',
                    'name' => $item->name,
                    'email' => $item->contact_email ?? $item->email,
                    'phone' => $item->contact_phone ?? $item->phone,
                    'address' => $item->address,
                    'website' => $item->website,
                    'naicom_reg_number' => $item->naicom_reg_number,
                    'ncrib_reg_number' => $item->ncrib_reg_number,
                    'rc_number' => $item->rc_number,
                ];
            });

        // 3. Merge and De-duplicate by name
        $merged = $registryResults->concat($tenantResults)
            ->unique(function ($item) {
                return strtolower(trim($item['name']));
            })
            ->values();

        return response()->json($merged);
    }

    /**
     * Specifically search for underwriters (for credit notes).
     */
    public function searchUnderwriters(Request $request): JsonResponse
    {
        $request->merge(['type' => 'underwriter']);

        return $this->search($request);
    }
}
