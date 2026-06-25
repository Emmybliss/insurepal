<?php

namespace App\Http\Controllers;

use App\Exports\CustomersExport;
use App\Http\Requests\CustomerRequest;
use App\Http\Requests\ImportCustomerRequest;
use App\Imports\CustomersImport;
use App\Models\Customer;
use App\Services\CustomerService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class CustomerController extends Controller
{
    public function __construct(
        private CustomerService $customerService
    ) {}

    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Customer::query()
            ->forTenant($user->tenant_id)
            ->with(['user', 'kyc', 'quotes.insuranceProduct', 'policies.policyProduct'])
            ->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        $customers = $query->paginate(15)->withQueryString();

        return Inertia::render('customers/index', [
            'customers' => $customers,
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
            $path = $request->file('logo_upload')->store('customers/logos', 'public');
            $validated['logo'] = $path;
        }

        $result = $this->customerService->createCustomer(
            Auth::user()->tenant_id,
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

        $customer->load([
            'user',
            'kyc',
            'quotes' => function ($query) {
                $query->latest();
            },
            'policies' => function ($query) {
                $query->latest();
            },
            'claims' => function ($query) {
                $query->latest();
            },
            'invoices' => function ($query) {
                $query->latest();
            },
            'receipts' => function ($query) {
                $query->latest();
            },
        ]);

        return Inertia::render('customers/show', [
            'customer' => $customer,
            'stats' => [
                'total_quotes' => $customer->quotes->count(),
                'total_policies' => $customer->policies->count(),
                'active_policies' => $customer->policies->filter(fn ($p) => $p->isActive() && ! $p->isExpired())->count(),
                'total_premium' => $customer->policies->filter(fn ($p) => $p->isActive() && ! $p->isExpired())->sum('premium_amount'),
                'total_claims' => $customer->claims->count(),
                'total_invoices' => $customer->invoices->count(),
            ],
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

        $validated = $request->validated();

        if ($request->hasFile('logo_upload')) {
            if ($customer->logo) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($customer->logo);
            }
            $path = $request->file('logo_upload')->store('customers/logos', 'public');
            $validated['logo'] = $path;
        }

        $customer->update($validated);

        return redirect()->route('customers.show', $customer)
            ->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer)
    {
        $this->authorize('delete', $customer);

        if ($customer->user_id) {
            $customer->user->delete();
        }

        $customer->delete();

        return redirect()->route('customers.index')
            ->with('success', 'Customer deleted successfully.');
    }

    /**
     * Provision login access for a customer
     */
    public function provisionAccess(Request $request, Customer $customer)
    {
        $this->authorize('update', $customer);

        $request->validate([
            'send_email' => 'boolean',
        ]);

        try {
            $this->customerService->provisionLoginAccess($customer, $request->boolean('send_email'));

            return back()->with('success', 'Login access provisioned successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to provision access: '.$e->getMessage()]);
        }
    }

    /**
     * Revoke login access for a customer
     */
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

    /**
     * Reset customer password and send new credentials
     */
    public function resetPassword(Customer $customer)
    {
        $this->authorize('update', $customer);

        try {
            $newPassword = $this->customerService->resetCustomerPassword($customer);

            return back()->with('success', 'Password reset successfully. New credentials have been sent to the customer.');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Password Reset Failed: '.$e->getMessage());

            return back()->withErrors(['error' => 'Failed to reset password: '.$e->getMessage()]);
        }
    }

    /**
     * Download customer data as PDF
     */
    public function downloadPdf(Customer $customer)
    {
        $this->authorize('view', $customer);

        $customer->load(['user', 'kyc', 'policies.policyProduct', 'quotes.insuranceProduct']);

        $pdf = Pdf::loadView('pdfs.customer', [
            'customer' => $customer,
            'company' => Auth::user()->tenant,
        ]);

        $slug = \Illuminate\Support\Str::slug($customer->display_name);
        $fileName = ($slug ?: 'customer-'.$customer->id).'.pdf';

        return $pdf->download($fileName);
    }

    /**
     * Download customer data as Excel
     */
    public function downloadExcel(Customer $customer)
    {
        $this->authorize('view', $customer);

        $customer->load(['user', 'kyc', 'policies.policyProduct', 'quotes.insuranceProduct']);

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Customer Details');

        // Headers
        $headers = ['Field', 'Value'];
        $sheet->fromArray($headers, null, 'A1');

        $data = [
            ['Name', $customer->name],
            ['Email', $customer->email],
            ['Phone', $customer->phone],
            ['Type', $customer->type],
            ['Company Name', $customer->company_name],
            ['Status', $customer->is_active ? 'Active' : 'Inactive'],
            ['Date of Birth', $customer->date_of_birth],
            ['Address', $customer->address],
            ['City', $customer->city],
            ['State', $customer->state],
            ['Country', $customer->country],
            ['Created At', $customer->created_at->format('Y-m-d H:i:s')],
        ];

        $sheet->fromArray($data, null, 'A2');

        // Policies Sheet
        if ($customer->policies->count() > 0) {
            $policySheet = $spreadsheet->createSheet();
            $policySheet->setTitle('Policies');
            $policyHeaders = ['Policy Number', 'Type', 'Product', 'Premium', 'Status', 'Start Date', 'Expiry Date'];
            $policySheet->fromArray($policyHeaders, null, 'A1');

            $policyData = $customer->policies->map(function ($p) {
                return [
                    $p->policy_number,
                    $p->type,
                    $p->policyProduct?->name ?? 'N/A',
                    $p->premium_amount,
                    $p->status,
                    $p->start_date ? $p->start_date->format('Y-m-d') : 'N/A',
                    $p->expiry_date ? $p->expiry_date->format('Y-m-d') : 'N/A',
                ];
            })->toArray();

            $policySheet->fromArray($policyData, null, 'A2');
            $policySheet->getStyle('A1:G1')->getFont()->setBold(true);
            foreach (range('A', 'G') as $col) {
                $policySheet->getColumnDimension($col)->setAutoSize(true);
            }
        }

        // Quotes Sheet
        if ($customer->quotes->count() > 0) {
            $quoteSheet = $spreadsheet->createSheet();
            $quoteSheet->setTitle('Quotes');
            $quoteHeaders = ['Quote Number', 'Product', 'Premium', 'Status', 'Valid Until', 'Created At'];
            $quoteSheet->fromArray($quoteHeaders, null, 'A1');

            $quoteData = $customer->quotes->map(function ($q) {
                return [
                    $q->quote_number,
                    $q->insuranceProduct?->name ?? 'N/A',
                    $q->premium_amount,
                    $q->status,
                    $q->valid_until ? $q->valid_until->format('Y-m-d') : 'N/A',
                    $q->created_at->format('Y-m-d'),
                ];
            })->toArray();

            $quoteSheet->fromArray($quoteData, null, 'A2');
            $quoteSheet->getStyle('A1:F1')->getFont()->setBold(true);
            foreach (range('A', 'F') as $col) {
                $quoteSheet->getColumnDimension($col)->setAutoSize(true);
            }
        }

        // Switch back to the first sheet
        $spreadsheet->setActiveSheetIndex(0);

        // Formatting
        $sheet->getStyle('A1:B1')->getFont()->setBold(true);
        $sheet->getColumnDimension('A')->setAutoSize(true);
        $sheet->getColumnDimension('B')->setAutoSize(true);

        $writer = new Xlsx($spreadsheet);
        $slug = \Illuminate\Support\Str::slug($customer->display_name);
        $fileName = ($slug ?: 'customer-'.$customer->id).'.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), 'excel');
        $writer->save($tempFile);

        return response()->download($tempFile, $fileName)->deleteFileAfterSend(true);
    }

    /**
     * Export all/filtered customers as Excel
     */
    public function exportExcel(Request $request)
    {
        $this->authorize('viewAny', Customer::class);

        $export = new CustomersExport;
        $filepath = $export->exportAll($request->only(['search', 'type']));

        $filename = 'customers_export_'.now()->format('Y_m_d_H_i_s').'.xlsx';

        return response()->download($filepath, $filename)->deleteFileAfterSend(true);
    }

    /**
     * Export empty Excel template for import
     */
    public function exportTemplate()
    {
        $this->authorize('create', Customer::class);

        $export = new CustomersExport;
        $filepath = $export->exportTemplate();

        return response()->download($filepath, 'customer_import_template.xlsx')->deleteFileAfterSend(true);
    }

    /**
     * Import customers from uploaded Excel file
     */
    public function importExcel(ImportCustomerRequest $request)
    {
        $this->authorize('create', Customer::class);

        $file = $request->file('file');
        $filepath = $file->store('imports');

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
