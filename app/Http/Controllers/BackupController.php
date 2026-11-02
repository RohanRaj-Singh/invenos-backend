<?php

namespace App\Http\Controllers;

use App\Domains\Backup\Services\BackupService;
use App\Domains\Backup\Services\BackupVerifier;
use App\Domains\Backup\Services\RestoreService;
use App\Domains\Settings\Services\SettingService;
use App\Models\AuditLog;
use App\Models\Backup;
use App\Models\RestoreRun;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class BackupController extends Controller
{
    public function __construct(
        private readonly BackupService $backupService,
        private readonly BackupVerifier $verifier,
        private readonly RestoreService $restoreService,
    ) {
    }

    public function index(Request $request): Response
    {
        $this->ensureAdmin($request);

        $backups = Backup::query()->latest()->paginate(15)->withQueryString();

        $settings = app(SettingService::class)->get();

        return Inertia::render('settings/BackupRestore', [
            'backups' => $backups,
            'stats' => [
                'total' => Backup::query()->count(),
                'verified' => Backup::query()->where('status', Backup::STATUS_VERIFIED)->count(),
                'total_bytes' => (int) Backup::query()->sum('size_bytes'),
                'last_verified_at' => Backup::query()->whereNotNull('verified_at')->max('verified_at'),
                'pending_jobs' => $this->pendingJobs(),
            ],
            'backupSettings' => $settings['backup'] ?? [],
            'restorableBackups' => Backup::query()
                ->completed()
                ->latest('created_at')
                ->limit(50)
                ->get(['id', 'filename', 'created_at', 'size_bytes', 'kind', 'status']),
            'businessTimezone' => $settings['business']['timezone'] ?? 'Asia/Karachi',
            'restorePreview' => session('restore_preview'),
            'restoreRunId' => session('restore_run_id'),
            'verifyResult' => session('verify_result'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'password' => ['nullable', 'string', 'min:8', 'max:255'],
        ]);

        try {
            $backup = $this->backupService->create(
                $data['password'] ?? null,
                $request->user()->id
            );

            $this->audit($request->user(), 'backup.created', $backup, $backup->filename);

            return back()->with('success', 'Backup created: '.$backup->filename);
        } catch (Throwable $e) {
            $this->audit($request->user(), 'backup.failed', null, $e->getMessage());

            return back()->withErrors(['backup' => $e->getMessage()]);
        }
    }

    public function download(Request $request, Backup $backup)
    {
        $this->ensureAdmin($request);

        abort_unless($backup->isDownloadable(), 404);

        $path = Storage::disk($backup->disk)->path($backup->path);
        abort_unless(is_file($path), 404);

        $this->audit($request->user(), 'backup.downloaded', $backup, $backup->filename);

        return response()->download($path, $backup->filename, [
            'Content-Type' => 'application/octet-stream',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function verify(Request $request, Backup $backup): RedirectResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'password' => ['nullable', 'string', 'max:255'],
        ]);

        $result = $this->verifier->verify($backup, $data['password'] ?? null);

        if ($result['content_verified']) {
            $backup->forceFill([
                'status' => Backup::STATUS_VERIFIED,
                'verified_at' => now(),
                'failure_reason' => null,
            ])->save();

            $this->audit($request->user(), 'backup.verified', $backup);

            return back()->with('success', 'Backup verified successfully.');
        }

        if (! $result['checksum_ok']) {
            $backup->forceFill([
                'status' => Backup::STATUS_FAILED,
                'failure_reason' => implode(' ', $result['errors']),
            ])->save();
        }

        return back()->withErrors([
            'backup' => $result['errors'][0] ?? 'Backup could not be verified.',
        ]);
    }

    public function destroy(Request $request, Backup $backup): RedirectResponse
    {
        $this->ensureAdmin($request);

        if (in_array($backup->status, [Backup::STATUS_RUNNING, Backup::STATUS_PENDING], true)) {
            return back()->withErrors(['backup' => 'A running backup cannot be deleted.']);
        }

        $newest = Backup::query()->completed()->latest('completed_at')->first();

        if (! $request->boolean('force') && $newest && $newest->id === $backup->id) {
            return back()->withErrors(['backup' => 'This is the newest completed backup. Confirm "force" to remove it.']);
        }

        Storage::disk($backup->disk)->delete($backup->path);
        $backup->forceFill(['status' => Backup::STATUS_EXPIRED])->save();
        $backup->delete();

        $this->audit($request->user(), 'backup.deleted', $backup, 'filename: '.$backup->filename);

        return back()->with('success', 'Backup deleted.');
    }

    public function inspectUpload(Request $request): RedirectResponse
    {
        $this->ensureAdmin($request);

        $request->validate([
            'file' => ['required', 'file', 'max:1048576'],
            'password' => ['nullable', 'string', 'max:255'],
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());

        if (! in_array($extension, ['invbak', 'zip'], true)) {
            return back()->withErrors(['file' => 'Upload an .invbak backup file.']);
        }

        try {
            $run = $this->restoreService->inspectUpload($file, $request->input('password'), $request->user()->id);

            return redirect()
                ->route('settings.backup')
                ->with('restore_preview', $run->preview)
                ->with('restore_run_id', $run->id);
        } catch (Throwable $e) {
            return back()->withErrors(['file' => $e->getMessage()]);
        }
    }

    public function inspectBackup(Request $request, Backup $backup): RedirectResponse
    {
        $this->ensureAdmin($request);

        try {
            $run = $this->restoreService->inspectBackup(
                $backup,
                $request->input('password'),
                $request->user()->id
            );

            return redirect()
                ->route('settings.backup')
                ->with('restore_preview', $run->preview)
                ->with('restore_run_id', $run->id);
        } catch (Throwable $e) {
            return back()->withErrors(['restore' => $e->getMessage()]);
        }
    }

    public function restore(Request $request, RestoreRun $restoreRun): RedirectResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'confirmation' => ['required', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'max:255'],
            'force' => ['sometimes', 'boolean'],
        ]);

        try {
            $this->restoreService->restore(
                $restoreRun,
                $data['confirmation'],
                $data['password'] ?? null,
                (bool) ($data['force'] ?? false)
            );

            $this->audit($request->user(), 'backup.restored', $restoreRun->backup, $restoreRun->artifact_name);

            return redirect()->route('settings.backup')->with('success', 'Restore completed successfully.');
        } catch (Throwable $e) {
            return back()->withErrors(['restore' => $e->getMessage()]);
        }
    }

    private function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()?->isAdmin(), 403);
    }

    private function pendingJobs(): int
    {
        try {
            return (int) DB::table('jobs')->count();
        } catch (Throwable) {
            return 0;
        }
    }

    private function audit(?User $user, string $event, ?Backup $backup, ?string $reason = null): void
    {
        try {
            AuditLog::create([
                'user_id' => $user?->id,
                'event' => $event,
                'auditable_type' => $backup ? Backup::class : RestoreRun::class,
                'auditable_id' => $backup?->id ?? 0,
                'description' => $event,
                'reason' => $reason,
                'ip_address' => request()->ip(),
            ]);
        } catch (Throwable) {
        }
    }
}
