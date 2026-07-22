<?php

namespace App\Http\Controllers;

use App\Exports\CustomersExport;
use App\Http\Requests\CustomerRequest;
use App\Http\Requests\ImportCustomerRequest;
use App\Imports\CustomersImport;
use App\Models\Customer;
use App\Services\Customers\CustomerExportService;
use App\Services\Customers\CustomerListingService;
use App\Services\CustomerService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function __construct(
        private CustomerService $customerService,
        private CustomerListingService $customerListingService,
        private CustomerExportService $customerExportService,
    ) {}

    public function index(Request $request)
    {
        return Inertia::render('customers/index', [
            'customers' => $this->customerListingService->list(
                $request->user(),
                $request->only(['search', 'type', 'is_active'])
            ),
            'filters' => $request->only(['search', 'type', 'is_active']),
        ]);
    }

    public function create()
    {
        return Inertia::render('customers/create');
    }

    public function store(CustomerRequest $request)
    {
        $validated = $request->validated();

        if ($request->hasFile('logo_upload')) {
            $validated['logo'] = $request->file('logo_upload')->store('customers/logos', 'public');
        }

        $result = $this->customerService->createCustomer(
            $request->user()->tenant_id,
            $validated
        );

        if ($request->header('X-Quick-Create') === 'true') {
            return response()->json($result['customer']->load('user'));
        }

        $redirect = redirect()->route('customers.show', $result['customer'])
            ->with('success', 'Customer created successfully.');

        if ($result['credentials']) {
            $redirect->with('credentials', $result['credentials']);
        }

        return $redirect;
    }

    public function show(Customer $customer)
    {
        $this->authorize('view', $customer);

        return Inertia::render('customers/show', [
            'customer' => $customer->load([
                'user', 'kyc',
                'quotes' => fn ($q) => $q->latest(),
                'policies' => fn ($q) => $q->latest(),
                'claims' => fn ($q) => $q->latest(),
                'invoices' => fn ($q) => $q->latest(),
                'receipts' => fn ($q) => $q->latest(),
            ]),
            'stats' => $this->customerListingService->getCustomerStats($customer),
            'credentials' => session('credentials'),
        ]);
    }

    public function edit(Customer $customer)
    {
        $this->authorize('update', $customer);

        return Inertia::render('customers/edit', [
            'customer' => $customer,
        ]);
    }

    public function update(CustomerRequest $request, Customer $customer)
    {
        $this->authorize('update', $customer);

        $this->customerService->updateCustomer(
            $customer,
            $request->validated(),
            $request->hasFile('logo_upload') ? $request->file('logo_upload') : null
        );

        return redirect()->route('customers.show', $customer)
            ->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer)
    {
        $this->authorize('delete', $customer);

        $this->customerService->deleteCustomer($customer);

        return redirect()->route('customers.index')
            ->with('success', 'Customer deleted successfully.');
    }

    public function provisionAccess(Request $request, Customer $customer)
    {
        $this->authorize('update', $customer);
        $request->validate(['send_email' => 'boolean']); // single field — leave inline

        try {
            $this->customerService->provisionLoginAccess($customer, $request->boolean('send_email'));

            return back()->with('success', 'Login access provisioned successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to provision access: '.$e->getMessage()]);
        }
    }

    public function revokeAccess(Customer $customer)
    {
        $this->authorize('update', $customer);

        try {
            $this->customerService->revokeLoginAccess($customer);

            return back()->with('success', 'Login access revoked successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to revoke access: '.$e->getMessage()]);
        }
    }

    public function resetPassword(Customer $customer)
    {
        $this->authorize('update', $customer);

        try {
            $this->customerService->resetCustomerPassword($customer);

            return back()->with('success', 'Password reset successfully. New credentials have been sent to the customer.');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Password Reset Failed: '.$e->getMessage());

            return back()->withErrors(['error' => 'Failed to reset password: '.$e->getMessage()]);
        }
    }

    public function downloadPdf(Customer $customer)
    {
        $this->authorize('view', $customer);

        return $this->customerExportService->downloadPdf($customer, request()->user());
    }

    public function downloadExcel(Customer $customer)
    {
        $this->authorize('view', $customer);

        return $this->customerExportService->downloadExcel($customer, request()->user());
    }

    public function exportExcel(Request $request)
    {
        $this->authorize('viewAny', Customer::class);

        $export = new CustomersExport;
        $filepath = $export->exportAll($request->only(['search', 'type']));
        $filename = 'customers_export_'.now()->format('Y_m_d_H_i_s').'.xlsx';

        return $this->safeDownloadAndDelete($filepath, $filename);
    }

    public function exportTemplate()
    {
        $this->authorize('create', Customer::class);

        $export = new CustomersExport;
        $filepath = $export->exportTemplate();

        return $this->safeDownloadAndDelete($filepath, 'customer_import_template.xlsx');
    }

    public function importExcel(ImportCustomerRequest $request)
    {
        $this->authorize('create', Customer::class);

        $filepath = $request->file('file')->store('imports');

        try {
            $import = new CustomersImport;
            $result = $import->import(storage_path('app/private/'.$filepath));

            if ($request->expectsJson()) {
                return response()->json($result);
            }

            $message = $result['created'].' customer(s) created successfully.';
            if ($result['skipped'] > 0) {
                $message .= ' '.$result['skipped'].' row(s) skipped (duplicate emails).';
            }

            if (! empty($result['errors'])) {
                return redirect()->route('customers.index')
                    ->with('success', $message)
                    ->with('import_errors', $result['errors']);
            }

            return redirect()->route('customers.index')
                ->with('success', $message);
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Failed to import customers: '.$e->getMessage()], 422);
            }

            return back()->withErrors(['error' => 'Failed to import customers: '.$e->getMessage()]);
        }
    }
}
