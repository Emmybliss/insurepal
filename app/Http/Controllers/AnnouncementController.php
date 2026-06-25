<?php

namespace App\Http\Controllers;

use App\Events\AnnouncementCreated;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnnouncementController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Announcement::class);

        $query = Announcement::query()
            ->with(['createdBy'])
            ->where('tenant_id', auth()->user()->tenant_id)
            ->latest();

        // Filter by type
        if ($request->filled('type')) {
            $query->byType($request->type);
        }

        // Filter by priority
        if ($request->filled('priority')) {
            $query->byPriority($request->priority);
        }

        // Filter by status
        if ($request->filled('status')) {
            match ($request->status) {
                'active' => $query->active(),
                'expired' => $query->expired(),
                'inactive' => $query->where('is_active', false),
                default => null,
            };
        }

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $announcements = $query->paginate(20)->withQueryString();

        // Get counts
        $counts = [
            'all' => Announcement::where('tenant_id', auth()->user()->tenant_id)->count(),
            'active' => Announcement::where('tenant_id', auth()->user()->tenant_id)->active()->count(),
            'expired' => Announcement::where('tenant_id', auth()->user()->tenant_id)->expired()->count(),
            'inactive' => Announcement::where('tenant_id', auth()->user()->tenant_id)->where('is_active', false)->count(),
        ];

        // Get available types for filtering
        $types = [
            ['value' => 'general', 'label' => 'General'],
            ['value' => 'maintenance', 'label' => 'Maintenance'],
            ['value' => 'update', 'label' => 'Update'],
            ['value' => 'security', 'label' => 'Security'],
            ['value' => 'feature', 'label' => 'Feature'],
        ];

        return Inertia::render('announcements/index', [
            'announcements' => $announcements,
            'counts' => $counts,
            'types' => $types,
            'filters' => $request->only(['type', 'priority', 'status', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $this->authorize('create', Announcement::class);

        return Inertia::render('announcements/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Announcement::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string|min:10',
            'type' => 'required|in:general,maintenance,update,security,feature',
            'priority' => 'required|in:low,medium,high',
            'expires_at' => 'nullable|date|after:now',
            'is_active' => 'boolean',
        ]);

        $announcement = Announcement::create([
            ...$validated,
            'tenant_id' => auth()->user()->tenant_id,
            'created_by' => auth()->id(),
        ]);

        // Dispatch broadcast event
        event(new AnnouncementCreated($announcement, auth()->user()->tenant));

        return redirect()->route('announcements.index')
            ->with('success', 'Announcement created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Announcement $announcement)
    {
        $this->authorize('view', $announcement);

        $announcement->load(['createdBy']);

        return Inertia::render('announcements/show', [
            'announcement' => $announcement,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Announcement $announcement)
    {
        $this->authorize('update', $announcement);

        return Inertia::render('announcements/edit', [
            'announcement' => $announcement,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Announcement $announcement)
    {
        $this->authorize('update', $announcement);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string|min:10',
            'type' => 'required|in:general,maintenance,update,security,feature',
            'priority' => 'required|in:low,medium,high',
            'expires_at' => 'nullable|date|after:now',
            'is_active' => 'boolean',
        ]);

        $announcement->update($validated);

        return redirect()->route('announcements.show', $announcement)
            ->with('success', 'Announcement updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Announcement $announcement)
    {
        $this->authorize('delete', $announcement);

        $announcement->delete();

        return redirect()->route('announcements.index')
            ->with('success', 'Announcement deleted successfully.');
    }

    /**
     * Toggle the active status of the announcement.
     */
    public function toggle(Announcement $announcement)
    {
        $this->authorize('update', $announcement);

        $announcement->update(['is_active' => ! $announcement->is_active]);

        $status = $announcement->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "Announcement {$status} successfully.");
    }

    /**
     * Get active announcements for the current tenant.
     */
    public function getActive()
    {
        $announcements = Announcement::where('tenant_id', auth()->user()->tenant_id)
            ->active()
            ->latest()
            ->limit(10)
            ->get();

        return response()->json($announcements);
    }
}
