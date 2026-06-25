<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Notification::forUser($user->id)
            ->with(['user'])
            ->latest();

        // Filter by read status
        if ($request->filled('status')) {
            match ($request->status) {
                'unread' => $query->unread(),
                'read' => $query->read(),
                default => null,
            };
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->byType($request->type);
        }

        // Filter by priority
        if ($request->filled('priority')) {
            $query->byPriority($request->priority);
        }

        $notifications = $query->paginate(20)->withQueryString();

        // Get counts
        $counts = [
            'all' => Notification::forUser($user->id)->count(),
            'unread' => Notification::forUser($user->id)->unread()->count(),
            'read' => Notification::forUser($user->id)->read()->count(),
        ];

        // Get available types for filtering
        $types = Notification::forUser($user->id)
            ->distinct()
            ->pluck('type')
            ->map(fn ($type) => [
                'value' => $type,
                'label' => ucwords(str_replace('_', ' ', $type)),
            ])
            ->values();

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
            'counts' => $counts,
            'types' => $types,
            'filters' => $request->only(['status', 'type', 'priority']),
        ]);
    }

    public function show(Notification $notification)
    {
        // Ensure user can only view their own notifications
        if ($notification->user_id !== Auth::user()->id) {
            abort(403, 'Unauthorized access to notification.');
        }

        // Mark as read
        $notification->markAsRead();

        return Inertia::render('notifications/show', [
            'notification' => $notification,
        ]);
    }

    public function markAsRead(Request $request)
    {
        $notificationIds = $request->validate([
            'notification_ids' => 'required|array',
            'notification_ids.*' => 'exists:app_notifications,id',
        ])['notification_ids'];

        Notification::whereIn('id', $notificationIds)
            ->forUser(Auth::user()->id)
            ->unread()
            ->update(['read_at' => now()]);

        return back()->with('success', 'Notifications marked as read.');
    }

    public function markAsUnread(Request $request)
    {
        $notificationIds = $request->validate([
            'notification_ids' => 'required|array',
            'notification_ids.*' => 'exists:app_notifications,id',
        ])['notification_ids'];

        Notification::whereIn('id', $notificationIds)
            ->forUser(Auth::user()->id)
            ->update(['read_at' => null]);

        return back()->with('success', 'Notifications marked as unread.');
    }

    public function markAllAsRead()
    {
        Notification::forUser(Auth::user()->id)
            ->unread()
            ->update(['read_at' => now()]);

        return back()->with('success', 'All notifications marked as read.');
    }

    public function destroy(Notification $notification)
    {
        // Ensure user can only delete their own notifications
        if ($notification->user_id !== Auth::user()->id) {
            abort(403, 'Unauthorized access to notification.');
        }

        $notification->delete();

        return back()->with('success', 'Notification deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $notificationIds = $request->validate([
            'notification_ids' => 'required|array',
            'notification_ids.*' => 'exists:app_notifications,id',
        ])['notification_ids'];

        Notification::whereIn('id', $notificationIds)
            ->forUser(Auth::user()->id)
            ->delete();

        return back()->with('success', 'Notifications deleted successfully.');
    }

    public function getUnreadCount()
    {
        $count = Notification::forUser(Auth::user()->id)->unread()->count();

        return response()->json(['count' => $count]);
    }

    public function getRecent()
    {
        $notifications = Notification::forUser(Auth::user()->id)
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($notification) => $this->filterNotificationData($notification));

        return response()->json($notifications);
    }

    private function filterNotificationData($notification): array
    {
        $safeDataFields = ['url', 'icon', 'action_type', 'customer_id', 'policy_id', 'claim_id'];

        $safeData = collect($notification->data ?? [])
            ->only($safeDataFields)
            ->toArray();

        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->title,
            'message' => $notification->message,
            'data' => $safeData,
            'priority' => $notification->priority,
            'read_at' => $notification->read_at?->toISOString(),
            'created_at' => $notification->created_at->toISOString(),
        ];
    }
}
