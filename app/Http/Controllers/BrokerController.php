<?php

namespace App\Http\Controllers;

use App\Http\Requests\BrokerRequest;
use App\Models\Tenant;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class BrokerController extends Controller
{
    public function __construct()
    {
        $this->middleware('tenant.type:underwriter');
        $this->middleware('permission:view_brokers')->only(['index', 'show']);
        $this->middleware('permission:create_brokers')->only(['create', 'store']);
        $this->middleware('permission:edit_brokers')->only(['edit', 'update']);
        $this->middleware('permission:delete_brokers')->only(['destroy']);
    }

    /**
     * Display a listing of brokers under this underwriter.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $currentTenant = $user->tenant;

        // Get brokers that are associated with this underwriter
        $query = Tenant::query()
            ->where('type', 'broker')
            ->where('parent_tenant_id', $currentTenant->id)
            ->with(['users' => function ($q) {
                $q->whereHas('roles', function ($roleQuery) {
                    $roleQuery->where('name', 'broker');
                })->limit(1);
            }, 'policies', 'quotes']);

        // Search functionality
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                    ->orWhere('contact_email', 'like', "%{$search}%")
                    ->orWhere('contact_phone', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $brokers = $query->paginate(15)->withQueryString();

        // Add computed properties
        $brokers->through(function ($broker) {
            $primaryUser = $broker->users->first();
            $broker->primary_contact_name = $primaryUser ? $primaryUser->name : 'N/A';
            $broker->policies_count = $broker->policies->count();
            $broker->quotes_count = $broker->quotes->count();
            $broker->total_premium = $broker->policies->where('status', 'active')->sum('premium_amount');

            return $broker;
        });

        $stats = [
            'total_brokers' => Tenant::where('type', 'broker')->where('parent_tenant_id', $currentTenant->id)->count(),
            'active_brokers' => Tenant::where('type', 'broker')->where('parent_tenant_id', $currentTenant->id)->where('status', 'active')->count(),
            'pending_brokers' => Tenant::where('type', 'broker')->where('parent_tenant_id', $currentTenant->id)->where('status', 'pending')->count(),
            'total_commission' => Tenant::where('type', 'broker')
                ->where('parent_tenant_id', $currentTenant->id)
                ->join('policies', 'tenants.id', '=', 'policies.tenant_id')
                ->where('policies.status', 'active')
                ->sum('policies.commission_amount'),
        ];

        return Inertia::render('Brokers/Index', [
            'brokers' => $brokers,
            'stats' => $stats,
            'filters' => [
                'search' => $request->search,
                'status' => $request->get('status', 'all'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new broker.
     */
    public function create(): Response
    {
        return Inertia::render('Brokers/Create');
    }

    /**
     * Store a newly created broker in storage.
     */
    public function store(BrokerRequest $request): RedirectResponse
    {
        $user = $request->user();
        $currentTenant = $user->tenant;

        DB::transaction(function () use ($request, $currentTenant) {
            // Create broker tenant
            $brokerTenant = Tenant::create([
                'name' => $request->company_name,
                'company_name' => $request->company_name,
                'type' => 'broker',
                'status' => 'active',
                'parent_tenant_id' => $currentTenant->id,
                'known_company_id' => $request->known_company_id,
                'known_company_source' => $request->known_company_source,
                'email' => $request->contact_email,
                'phone' => $request->contact_phone,
                'contact_email' => $request->contact_email,
                'contact_phone' => $request->contact_phone,
                'address' => $request->address,
                'city' => $request->city,
                'state' => $request->state,
                'postal_code' => $request->postal_code,
                'country' => $request->country ?? 'Nigeria',
                'settings' => [
                    'commission_rate' => $request->commission_rate ?? 10,
                    'payment_terms' => $request->payment_terms ?? 30,
                ],
            ]);

            if ($request->hasFile('logo')) {
                $path = $request->file('logo')->store('tenants/logos', 'public');
                $brokerTenant->update(['logo' => $path]);
            }

            $temporaryPassword = \Illuminate\Support\Str::random(12);

            // Create primary broker user
            $brokerUser = User::create([
                'name' => $request->primary_contact_name,
                'email' => $request->primary_contact_email,
                'password' => Hash::make($temporaryPassword),
                'tenant_id' => $brokerTenant->id,
                'email_verified_at' => now(),
                'is_active' => true,
            ]);

            // Assign broker role
            $brokerUser->assignRole('broker');

            // Send login credentials email to the new broker
            Mail::to($request->primary_contact_email)->send(
                new \App\Mail\BrokerLoginCredentials($brokerTenant, $brokerUser, $temporaryPassword)
            );
        });

        return redirect()->route('brokers.index')
            ->with('success', 'Broker created successfully.');
    }

    /**
     * Display the specified broker.
     */
    public function show(Request $request, Tenant $broker): Response
    {
        $user = $request->user();
        $currentTenant = $user->tenant;

        // Ensure the broker belongs to this underwriter
        if ($broker->parent_tenant_id !== $currentTenant->id) {
            abort(403, 'Unauthorized access to broker.');
        }

        $broker->load([
            'users.roles',
            'policies.customer',
            'quotes.customer',
            'customers',
            'kyc',
        ]);

        $stats = [
            'total_policies' => $broker->policies->count(),
            'active_policies' => $broker->policies->where('status', 'active')->count(),
            'total_quotes' => $broker->quotes->count(),
            'pending_quotes' => $broker->quotes->where('status', 'pending')->count(),
            'total_customers' => $broker->customers->count(),
            'total_premium' => $broker->policies->where('status', 'active')->sum('premium_amount'),
            'total_commission' => $broker->policies->where('status', 'active')->sum('commission_amount'),
        ];

        return Inertia::render('Brokers/Show', [
            'broker' => $broker,
            'stats' => $stats,
            'recent_policies' => $broker->policies()->with('customer')->latest()->limit(5)->get(),
            'recent_quotes' => $broker->quotes()->with('customer')->latest()->limit(5)->get(),
        ]);
    }

    /**
     * Show the form for editing the specified broker.
     */
    public function edit(Request $request, Tenant $broker): Response
    {
        $user = $request->user();
        $currentTenant = $user->tenant;

        // Ensure the broker belongs to this underwriter
        if ($broker->parent_tenant_id !== $currentTenant->id) {
            abort(403, 'Unauthorized access to broker.');
        }

        $broker->load(['users' => function ($q) {
            $q->whereHas('roles', function ($roleQuery) {
                $roleQuery->where('name', 'broker');
            })->first();
        }]);

        return Inertia::render('Brokers/Edit', [
            'broker' => $broker,
            'primaryUser' => $broker->users->first(),
        ]);
    }

    /**
     * Update the specified broker in storage.
     */
    public function update(BrokerRequest $request, Tenant $broker): RedirectResponse
    {
        $user = $request->user();
        $currentTenant = $user->tenant;

        // Ensure the broker belongs to this underwriter
        if ($broker->parent_tenant_id !== $currentTenant->id) {
            abort(403, 'Unauthorized access to broker.');
        }

        DB::transaction(function () use ($request, $broker) {
            // Update broker tenant
            $broker->update([
                'name' => $request->company_name,
                'company_name' => $request->company_name,
                'email' => $request->contact_email,
                'phone' => $request->contact_phone,
                'contact_email' => $request->contact_email,
                'contact_phone' => $request->contact_phone,
                'address' => $request->address,
                'city' => $request->city,
                'state' => $request->state,
                'postal_code' => $request->postal_code,
                'country' => $request->country ?? 'Nigeria',
                'settings' => array_merge($broker->settings ?? [], [
                    'commission_rate' => $request->commission_rate ?? 10,
                    'payment_terms' => $request->payment_terms ?? 30,
                ]),
            ]);

            if ($request->hasFile('logo')) {
                if ($broker->logo) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($broker->logo);
                }
                $path = $request->file('logo')->store('tenants/logos', 'public');
                $broker->update(['logo' => $path]);
            }

            // Update primary broker user if email or name changed
            $primaryUser = $broker->users()->whereHas('roles', function ($roleQuery) {
                $roleQuery->where('name', 'broker');
            })->first();

            if ($primaryUser) {
                $updateData = [
                    'name' => $request->primary_contact_name,
                    'email' => $request->primary_contact_email,
                ];

                // Update password if provided
                if ($request->password) {
                    $updateData['password'] = Hash::make($request->password);
                }

                $primaryUser->update($updateData);
            }
        });

        return redirect()->route('brokers.show', $broker)
            ->with('success', 'Broker updated successfully.');
    }

    /**
     * Toggle broker status (activate/deactivate).
     */
    public function toggleStatus(Request $request, Tenant $broker): RedirectResponse
    {
        $user = $request->user();
        $currentTenant = $user->tenant;

        // Ensure the broker belongs to this underwriter
        if ($broker->parent_tenant_id !== $currentTenant->id) {
            abort(403, 'Unauthorized access to broker.');
        }

        $newStatus = $broker->status === 'active' ? 'suspended' : 'active';
        $broker->update(['status' => $newStatus]);

        // Also update the primary user's status
        $primaryUser = $broker->users()->whereHas('roles', function ($roleQuery) {
            $roleQuery->where('name', 'broker');
        })->first();

        if ($primaryUser) {
            $primaryUser->update(['is_active' => $newStatus === 'active']);
        }

        $message = $newStatus === 'active' ? 'Broker activated successfully.' : 'Broker suspended successfully.';

        return redirect()->back()->with('success', $message);
    }

    /**
     * Remove the specified broker from storage.
     */
    public function destroy(Request $request, Tenant $broker): RedirectResponse
    {
        $user = $request->user();
        $currentTenant = $user->tenant;

        // Ensure the broker belongs to this underwriter
        if ($broker->parent_tenant_id !== $currentTenant->id) {
            abort(403, 'Unauthorized access to broker.');
        }

        // Check if broker has active policies
        if ($broker->policies()->where('status', 'active')->exists()) {
            return redirect()->back()
                ->withErrors(['error' => 'Cannot delete broker with active policies.']);
        }

        DB::transaction(function () use ($broker) {
            // Delete associated users
            $broker->users()->delete();

            // Update related records instead of deleting them
            $broker->policies()->update(['tenant_id' => null]);
            $broker->quotes()->update(['tenant_id' => null]);
            $broker->customers()->update(['tenant_id' => null]);

            // Delete the broker tenant
            $broker->delete();
        });

        return redirect()->route('brokers.index')
            ->with('success', 'Broker deleted successfully.');
    }

    /**
     * Download broker data as PDF
     */
    public function downloadPdf(Tenant $broker)
    {
        $user = Auth::user();
        $currentTenant = $user->tenant;

        if ($broker->parent_tenant_id !== $currentTenant->id) {
            abort(403, 'Unauthorized access to broker.');
        }

        $broker->load(['users', 'policies.policyProduct', 'quotes.insuranceProduct', 'customers']);

        $pdf = Pdf::loadView('pdfs.broker', [
            'broker' => $broker,
            'company' => $currentTenant,
        ]);

        $slug = \Illuminate\Support\Str::slug($broker->company_name);
        $fileName = ($slug ?: 'broker-'.$broker->id).'.pdf';

        return $pdf->download($fileName);
    }

    /**
     * Download broker data as Excel
     */
    public function downloadExcel(Tenant $broker)
    {
        $user = Auth::user();
        $currentTenant = $user->tenant;

        if ($broker->parent_tenant_id !== $currentTenant->id) {
            abort(403, 'Unauthorized access to broker.');
        }

        $broker->load(['users', 'policies', 'quotes', 'customers']);

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Broker Details');

        // Headers
        $headers = ['Field', 'Value'];
        $sheet->fromArray($headers, null, 'A1');

        $data = [
            ['Company Name', $broker->company_name],
            ['Contact Email', $broker->contact_email],
            ['Contact Phone', $broker->contact_phone],
            ['Status', $broker->status],
            ['Address', $broker->address],
            ['City', $broker->city],
            ['State', $broker->state],
            ['Postal Code', $broker->postal_code],
            ['Country', $broker->country],
            ['Commission Rate', ($broker->settings['commission_rate'] ?? 10).'%'],
            ['Payment Terms', ($broker->settings['payment_terms'] ?? 30).' days'],
            ['Total Policies', $broker->policies->count()],
            ['Active Policies', $broker->policies->where('status', 'active')->count()],
            ['Created At', $broker->created_at->format('Y-m-d H:i:s')],
        ];

        $sheet->fromArray($data, null, 'A2');

        // Policies Sheet
        if ($broker->policies->count() > 0) {
            $policySheet = $spreadsheet->createSheet();
            $policySheet->setTitle('Policies');
            $policyHeaders = ['Policy Number', 'Customer', 'Type', 'Premium', 'Status', 'Start Date', 'Expiry Date'];
            $policySheet->fromArray($policyHeaders, null, 'A1');

            $policyData = $broker->policies->map(function ($p) {
                return [
                    $p->policy_number,
                    $p->customer?->display_name ?? 'N/A',
                    $p->type,
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
        if ($broker->quotes->count() > 0) {
            $quoteSheet = $spreadsheet->createSheet();
            $quoteSheet->setTitle('Quotes');
            $quoteHeaders = ['Quote Number', 'Customer', 'Premium', 'Status', 'Valid Until', 'Created At'];
            $quoteSheet->fromArray($quoteHeaders, null, 'A1');

            $quoteData = $broker->quotes->map(function ($q) {
                return [
                    $q->quote_number,
                    $q->customer?->display_name ?? 'N/A',
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
        $slug = \Illuminate\Support\Str::slug($broker->company_name);
        $fileName = ($slug ?: 'broker-'.$broker->id).'.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), 'excel');
        $writer->save($tempFile);

        return response()->download($tempFile, $fileName)->deleteFileAfterSend(true);
    }
}
