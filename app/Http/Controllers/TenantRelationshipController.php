<?php

namespace App\Http\Controllers;

use App\Http\Requests\TenantRelationshipRequest;
use App\Models\Tenant;
use App\Models\TenantRelationship;
use App\Notifications\TenantRelationshipAccepted;
use App\Notifications\TenantRelationshipDeclined;
use App\Notifications\TenantRelationshipRemoved;
use App\Notifications\TenantRelationshipRequested;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class TenantRelationshipController extends Controller
{
    /**
     * Display all relationships for current tenant
     */
    public function index(Request $request)
    {
        Gate::authorize('view_tenant_relationships');

        $tenantId = Auth::user()->tenant_id;
        $tab = $request->get('tab', 'all');

        $query = TenantRelationship::query()
            ->with(['requester', 'requested', 'actionedBy'])
            ->forTenant($tenantId);

        // Filter by tab
        switch ($tab) {
            case 'sent':
                $query->sentBy($tenantId);
                break;
            case 'received':
                $query->receivedBy($tenantId);
                break;
            case 'pending':
                $query->pending();
                break;
            case 'accepted':
                $query->accepted();
                break;
        }

        $relationships = $query->latest()
            ->paginate(20)
            ->withQueryString();

        // Get counts for tabs
        $counts = [
            'all' => TenantRelationship::forTenant($tenantId)->count(),
            'sent' => TenantRelationship::sentBy($tenantId)->count(),
            'received' => TenantRelationship::receivedBy($tenantId)->count(),
            'pending' => TenantRelationship::forTenant($tenantId)->pending()->count(),
            'accepted' => TenantRelationship::forTenant($tenantId)->accepted()->count(),
        ];

        return Inertia::render('TenantRelationships/Index', [
            'relationships' => $relationships,
            'counts' => $counts,
            'currentTab' => $tab,
        ]);
    }

    /**
     * Discover and search for tenants to connect with
     */
    public function discover(Request $request)
    {
        Gate::authorize('view_tenant_relationships');

        $currentTenant = Auth::user()->tenant;

        // Verify current tenant is active subscriber
        if (! $currentTenant->isActiveSubscriber()) {
            return redirect()->back()->with('error', 'You must be an active subscriber to discover and connect with other tenants.');
        }

        $query = Tenant::query()
            ->where('id', '!=', $currentTenant->id)
            ->where('status', 'active');

        // Only show compatible tenant types
        if ($currentTenant->type === 'underwriter') {
            $query->where('type', 'broker');
        } elseif ($currentTenant->type === 'broker') {
            $query->where('type', 'underwriter');
        }

        // Search filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('location')) {
            $location = $request->location;
            $query->where(function ($q) use ($location) {
                $q->where('city', 'like', "%{$location}%")
                    ->orWhere('state', 'like', "%{$location}%")
                    ->orWhere('country', 'like', "%{$location}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $tenants = $query->latest()
            ->paginate(20)
            ->withQueryString();

        // Add relationship status for each tenant
        $tenants->getCollection()->transform(function ($tenant) use ($currentTenant) {
            $relationship = TenantRelationship::where(function ($q) use ($currentTenant, $tenant) {
                $q->where('requester_id', $currentTenant->id)
                    ->where('requested_id', $tenant->id);
            })->orWhere(function ($q) use ($currentTenant, $tenant) {
                $q->where('requester_id', $tenant->id)
                    ->where('requested_id', $currentTenant->id);
            })->first();

            $tenant->relationship_status = $relationship ? $relationship->status : null;
            $tenant->relationship_id = $relationship?->id;
            $tenant->is_requester = $relationship && $relationship->requester_id === $currentTenant->id;

            return $tenant;
        });

        return Inertia::render('TenantRelationships/Discover', [
            'tenants' => $tenants,
            'filters' => $request->only(['search', 'location', 'type']),
            'currentTenant' => $currentTenant,
        ]);
    }

    /**
     * Send a relationship request
     */
    public function store(TenantRelationshipRequest $request)
    {
        Gate::authorize('create_tenant_relationships');

        $currentTenant = Auth::user()->tenant;
        $requestedTenant = Tenant::findOrFail($request->requested_id);

        // Verify both tenants are active subscribers
        if (! $currentTenant->isActiveSubscriber()) {
            return redirect()->back()->with('error', 'You must be an active subscriber to send relationship requests.');
        }

        if (! $requestedTenant->isActiveSubscriber()) {
            return redirect()->back()->with('error', 'The tenant you are trying to connect with must be an active subscriber.');
        }

        // Check if relationship already exists
        if (TenantRelationship::existsBetween($currentTenant->id, $requestedTenant->id)) {
            return redirect()->back()->with('error', 'A relationship request already exists with this tenant.');
        }

        // Validate and determine relationship type
        try {
            $relationshipType = TenantRelationship::validateRelationshipType($currentTenant, $requestedTenant);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }

        // Create relationship request
        $relationship = TenantRelationship::create([
            'requester_id' => $currentTenant->id,
            'requested_id' => $requestedTenant->id,
            'relationship_type' => $relationshipType,
            'request_message' => $request->request_message,
            'status' => TenantRelationship::STATUS_PENDING,
        ]);

        // Notify the requested tenant's users
        $requestedTenantUsers = $requestedTenant->users()
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['underwriter', 'broker', 'admin']);
            })->get();

        Notification::send($requestedTenantUsers, new TenantRelationshipRequested($relationship, $currentTenant));

        return redirect()->route('tenant-relationships.index')
            ->with('success', 'Relationship request sent successfully.');
    }

    /**
     * Accept a relationship request
     */
    public function accept(Request $request, TenantRelationship $relationship)
    {
        Gate::authorize('accept_tenant_relationships');

        $currentTenant = Auth::user()->tenant;

        // Verify this tenant is the requested party
        if ($relationship->requested_id !== $currentTenant->id) {
            return redirect()->back()->with('error', 'You are not authorized to accept this request.');
        }

        try {
            $relationship->accept(Auth::user());

            // Notify the requester's users
            $requesterUsers = $relationship->requester->users()
                ->whereHas('roles', function ($query) {
                    $query->whereIn('name', ['underwriter', 'broker', 'admin']);
                })->get();

            Notification::send($requesterUsers, new TenantRelationshipAccepted($relationship, $currentTenant));

            return redirect()->back()->with('success', 'Relationship request accepted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Decline a relationship request
     */
    public function decline(Request $request, TenantRelationship $relationship)
    {
        Gate::authorize('decline_tenant_relationships');

        $currentTenant = Auth::user()->tenant;

        // Verify this tenant is the requested party
        if ($relationship->requested_id !== $currentTenant->id) {
            return redirect()->back()->with('error', 'You are not authorized to decline this request.');
        }

        $request->validate([
            'decline_reason' => 'nullable|string|max:500',
        ]);

        try {
            $relationship->decline(Auth::user(), $request->decline_reason);

            // Notify the requester's users
            $requesterUsers = $relationship->requester->users()
                ->whereHas('roles', function ($query) {
                    $query->whereIn('name', ['underwriter', 'broker', 'admin']);
                })->get();

            Notification::send($requesterUsers, new TenantRelationshipDeclined($relationship, $currentTenant));

            return redirect()->back()->with('success', 'Relationship request declined.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Remove an accepted relationship
     */
    public function destroy(TenantRelationship $relationship)
    {
        Gate::authorize('remove_tenant_relationships');

        $currentTenant = Auth::user()->tenant;

        // Verify this tenant is involved in the relationship
        if (! $relationship->involvesTenant($currentTenant->id)) {
            return redirect()->back()->with('error', 'You are not authorized to remove this relationship.');
        }

        try {
            $otherTenant = $relationship->getOtherTenant($currentTenant->id);

            if ($relationship->isPending() && $relationship->requester_id === $currentTenant->id) {
                // Cancel pending request
                $relationship->cancel(Auth::user());
                $message = 'Relationship request cancelled successfully.';
            } else {
                // Remove accepted relationship
                $relationship->remove(Auth::user());
                $message = 'Relationship removed successfully.';

                // Notify the other tenant's users
                if ($otherTenant) {
                    $otherTenantUsers = $otherTenant->users()
                        ->whereHas('roles', function ($query) {
                            $query->whereIn('name', ['underwriter', 'broker', 'admin']);
                        })->get();

                    Notification::send($otherTenantUsers, new TenantRelationshipRemoved($relationship, $currentTenant));
                }
            }

            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Get relationship details
     */
    public function show(TenantRelationship $relationship)
    {
        Gate::authorize('view_tenant_relationships');

        $currentTenant = Auth::user()->tenant;

        // Verify this tenant is involved in the relationship
        if (! $relationship->involvesTenant($currentTenant->id)) {
            abort(403, 'Unauthorized');
        }

        $relationship->load(['requester', 'requested', 'actionedBy']);

        return Inertia::render('TenantRelationships/Show', [
            'relationship' => $relationship,
            'currentTenant' => $currentTenant,
        ]);
    }
}
