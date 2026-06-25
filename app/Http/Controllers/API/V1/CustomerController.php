<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = $request->tenant->customers();

        if ($request->has('email')) {
            $query->where('email', $request->email);
        }

        // Basic searching
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {

        $validated = $request->validate([
            'type' => ['required', Rule::in(['individual', 'corporate'])],
            'first_name' => ['required_if:type,individual', 'nullable', 'string', 'max:255'],
            'last_name' => ['required_if:type,individual', 'nullable', 'string', 'max:255'],
            'company_name' => ['required_if:type,corporate', 'nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'], // Unique validation needs to be scoped to tenant usually
            'phone' => ['required', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
        ]);

        // Check if customer exists for this tenant
        $existingCustomer = $request->tenant->customers()->where('email', $validated['email'])->first();
        if ($existingCustomer) {
            return response()->json($existingCustomer, 200);
        }

        $customer = $request->tenant->customers()->create($validated + ['status' => 'active']);

        return response()->json($customer, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        $customer = $request->tenant->customers()->findOrFail($id);

        return response()->json($customer);
    }
}
