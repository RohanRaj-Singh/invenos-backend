<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $event = $request->get('event', '');
        $userId = $request->get('user_id') ? (int) $request->get('user_id') : null;
        $auditableType = $request->get('auditable_type', '');
        $dateFrom = $request->get('date_from', '');
        $dateTo = $request->get('date_to', '');
        $search = $request->get('search', '');
        $perPage = min((int) $request->get('per_page', 50), 100);

        $query = AuditLog::with('user');

        if ($event) {
            $query->where('event', $event);
        }

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($auditableType) {
            $query->where('auditable_type', 'like', "%{$auditableType}%");
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('reason', 'like', "%{$search}%")
                  ->orWhere('event', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%");
            });
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->through(fn ($log) => [
                'id' => $log->id,
                'user' => $log->user?->name ?? 'System',
                'event' => $log->event,
                'auditable_type' => class_basename($log->auditable_type),
                'auditable_id' => $log->auditable_id,
                'description' => $log->description,
                'reason' => $log->reason,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at,
            ]);

        // Get unique events for filter dropdown
        $events = AuditLog::select('event')
            ->distinct()
            ->orderBy('event')
            ->pluck('event');

        // Get users who have audit logs for filter dropdown
        $users = User::whereHas('auditLogs')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('utilities/AuditLog', [
            'logs' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
            'filters' => [
                'event' => $event,
                'user_id' => $userId,
                'auditable_type' => $auditableType,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'search' => $search,
            ],
            'events' => $events,
            'users' => $users,
        ]);
    }
}
