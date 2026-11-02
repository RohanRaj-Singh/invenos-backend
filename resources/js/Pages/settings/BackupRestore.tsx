import { useEffect, useMemo, useRef, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Download,
  Eye,
  EyeOff,
  FileArchive,
  HardDrive,
  Info,
  Loader2,
  Lock,
  RotateCcw,
  Server,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react'
import { SettingsLayout } from '../components/SettingsComponents'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BackupRow {
  id: number
  filename: string
  status: string
  size_bytes: number | null
  sha256: string | null
  encrypted: boolean
  kind: string
  created_at: string
  completed_at: string | null
  verified_at: string | null
  pending_jobs: number
  failure_reason: string | null
  included_scope?: { prescriptions?: number; logos?: number } | null
}

interface Preview {
  artifact: string
  source: string
  created_at: string | null
  app_version: string | null
  schema_version: number | null
  encrypted: boolean
  size_bytes: number
  table_count: number
  row_count: number
  file_count: number
  pending_jobs: number
  warnings: string[]
  confirmation_phrase: string
}

interface Paginator {
  data: BackupRow[]
  current_page: number
  last_page: number
  total: number
}

interface BackupSettings {
  enabled: boolean
  frequency: string
  time: string
  timezone: string
  retain_daily: number
  retain_weekly: number
  retain_monthly: number
  retain_safety: number
}

type Tab = 'backups' | 'restore' | 'schedule'

const TABS: { id: Tab; label: string; icon: typeof HardDrive }[] = [
  { id: 'backups', label: 'Backups', icon: HardDrive },
  { id: 'restore', label: 'Restore', icon: RotateCcw },
  { id: 'schedule', label: 'Automatic backups', icon: CalendarClock },
]

const STATUS_META: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  verified: { label: 'Protected', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: ShieldCheck },
  completed: { label: 'Ready', className: 'border-sky-200 bg-sky-50 text-sky-700', icon: CheckCircle2 },
  running: { label: 'In progress', className: 'border-amber-200 bg-amber-50 text-amber-700', icon: Loader2 },
  pending: { label: 'Waiting', className: 'border-border bg-muted text-muted-foreground', icon: Clock },
  failed: { label: 'Failed', className: 'border-red-200 bg-red-50 text-red-700', icon: XCircle },
  expired: { label: 'Removed', className: 'border-border bg-muted text-muted-foreground', icon: XCircle },
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index++
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatRelative(value: string | null | undefined): string {
  if (!value) return 'never'
  const diff = new Date(value).getTime() - Date.now()
  const minutes = Math.round(diff / 60000)
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour')
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return formatter.format(days, 'day')
  return formatter.format(Math.round(days / 30), 'month')
}

function friendlyName(backup: BackupRow): string {
  const date = new Date(backup.created_at)
  const label = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (backup.kind === 'safety') return `Safety copy · ${label}, ${time}`
  return `Backup · ${label}, ${time}`
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending
  const Icon = meta.icon

  return (
    <Badge variant="outline" className={cn('gap-1 h-6 px-2', meta.className)}>
      <Icon className={cn('size-3', status === 'running' && 'animate-spin')} aria-hidden="true" />
      {meta.label}
    </Badge>
  )
}

function PasswordInput({
  value,
  onChange,
  label,
  placeholder,
  autoComplete = 'new-password',
  disabled,
  describedBy,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  autoComplete?: string
  disabled?: boolean
  describedBy?: string
}) {
  const [visible, setVisible] = useState(false)
  const id = useRef(`password-${Math.random().toString(36).slice(2)}`).current

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-describedby={describedBy}
          className="h-11 w-full rounded-lg border border-input bg-background px-3 pr-11 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={0}
        >
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

function Switch({ checked, onChange, label, description }: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}) {
  const id = useRef(`switch-${Math.random().toString(36).slice(2)}`).current

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
          checked ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block size-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
        <span className="sr-only">{checked ? 'On' : 'Off'}</span>
      </button>
    </div>
  )
}

export default function BackupRestorePage() {
  const { props } = usePage()
  const backups = ((props as any).backups || { data: [], current_page: 1, last_page: 1, total: 0 }) as Paginator
  const stats = (props as any).stats || { total: 0, verified: 0, total_bytes: 0, last_verified_at: null, pending_jobs: 0 }
  const initialSettings = ((props as any).backupSettings || {}) as Partial<BackupSettings>
  const businessTimezone = ((props as any).businessTimezone || 'Asia/Karachi') as string
  const preview = ((props as any).restorePreview || null) as Preview | null
  const restoreRunId = ((props as any).restoreRunId || null) as number | null
  const errors = ((props as any).errors || {}) as Record<string, string>

  const [tab, setTab] = useState<Tab>('backups')
  const [createOpen, setCreateOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [verifyingId, setVerifyingId] = useState<number | null>(null)
  const [verifyPasswords, setVerifyPasswords] = useState<Record<number, string>>({})
  const [deleteTarget, setDeleteTarget] = useState<BackupRow | null>(null)
  const [deleteForce, setDeleteForce] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [inspecting, setInspecting] = useState(false)
  const [restorePassword, setRestorePassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [forceRestore, setForceRestore] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [selectedServerBackup, setSelectedServerBackup] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [settings, setSettings] = useState<BackupSettings>({
    enabled: initialSettings.enabled ?? false,
    frequency: initialSettings.frequency ?? 'daily',
    time: initialSettings.time ?? '02:00',
    timezone: initialSettings.timezone ?? businessTimezone,
    retain_daily: initialSettings.retain_daily ?? 7,
    retain_weekly: initialSettings.retain_weekly ?? 4,
    retain_monthly: initialSettings.retain_monthly ?? 12,
    retain_safety: initialSettings.retain_safety ?? 3,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const lastVerified = stats.last_verified_at ? new Date(stats.last_verified_at) : null
  const daysSinceBackup = lastVerified ? (Date.now() - lastVerified.getTime()) / 86400000 : null
  const isProtected = daysSinceBackup !== null && daysSinceBackup <= 7
  const restorable = (((props as any).restorableBackups || backups.data.filter((backup) => ['verified', 'completed'].includes(backup.status))) as BackupRow[])
  const hasChanges = JSON.stringify(settings) !== JSON.stringify({
    enabled: initialSettings.enabled ?? false,
    frequency: initialSettings.frequency ?? 'daily',
    time: initialSettings.time ?? '02:00',
    timezone: initialSettings.timezone ?? businessTimezone,
    retain_daily: initialSettings.retain_daily ?? 7,
    retain_weekly: initialSettings.retain_weekly ?? 4,
    retain_monthly: initialSettings.retain_monthly ?? 12,
    retain_safety: initialSettings.retain_safety ?? 3,
  })
  const settingsSummary = useMemo(() => {
    const every = settings.frequency === 'daily' ? 'every day' : settings.frequency === 'weekly' ? 'every week' : 'every month'
    return `We'll create a backup ${every} at ${settings.time} (${settings.timezone}). We keep the last ${settings.retain_daily} daily, ${settings.retain_weekly} weekly and ${settings.retain_monthly} monthly copies.`
  }, [settings])

  useEffect(() => {
    if (preview && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [preview?.artifact])

  const selectTab = (next: Tab) => {
    setTab(next)
    requestAnimationFrame(() => panelRef.current?.focus())
  }

  const handleCreate = () => {
    if (password && password !== confirmPassword) {
      toast.error('The two passwords do not match')
      return
    }

    setCreating(true)
    router.post('/settings/backup', { password: password || null }, {
      preserveScroll: true,
      onSuccess: () => {
        setCreating(false)
        setCreateOpen(false)
        setPassword('')
        setConfirmPassword('')
        toast.success('Backup created and checked')
      },
      onError: () => setCreating(false),
    })
  }

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const form = new FormData()
    form.append('file', file)
    if (restorePassword) form.append('password', restorePassword)

    setInspecting(true)
    router.post('/settings/backup/inspect', form, {
      forceFormData: true,
      onSuccess: () => {
        setInspecting(false)
        toast.success('Backup checked. Review it below before restoring.')
      },
      onError: () => {
        setInspecting(false)
        toast.error('This file could not be used. Check the password or choose another backup.')
      },
    })

    event.target.value = ''
  }

  const handleInspectServer = () => {
    if (!selectedServerBackup) {
      toast.error('Choose a backup first')
      return
    }

    setInspecting(true)
    router.post(`/settings/backup/${selectedServerBackup}/inspect`, { password: restorePassword || null }, {
      preserveScroll: true,
      onSuccess: () => {
        setInspecting(false)
        toast.success('Backup checked. Review it below before restoring.')
      },
      onError: () => {
        setInspecting(false)
        toast.error('This backup could not be read. Check the password and try again.')
      },
    })
  }

  const handleRestore = () => {
    if (!restoreRunId) return

    setRestoring(true)
    router.post(`/settings/backup/restore/${restoreRunId}`, {
      confirmation,
      password: restorePassword || null,
      force: forceRestore,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setRestoring(false)
        setConfirmation('')
        setTab('backups')
        toast.success('Restore complete. Your data has been replaced.')
      },
      onError: () => {
        setRestoring(false)
        toast.error('Restore failed. Your previous data should still be intact — check the message above.')
      },
    })
  }

  const handleVerify = (backup: BackupRow) => {
    setVerifyingId(backup.id)
    router.post(`/settings/backup/${backup.id}/verify`, { password: verifyPasswords[backup.id] || null }, {
      preserveScroll: true,
      onSuccess: () => {
        setVerifyingId(null)
        toast.success('Backup checked successfully')
      },
      onError: () => {
        setVerifyingId(null)
        toast.error('This backup did not pass the check')
      },
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return

    setDeleting(true)
    router.delete(`/settings/backup/${deleteTarget.id}`, {
      data: { force: deleteForce },
      preserveScroll: true,
      onSuccess: () => {
        setDeleting(false)
        setDeleteTarget(null)
        setDeleteForce(false)
        toast.success('Backup deleted')
      },
      onError: () => {
        setDeleting(false)
        toast.error('That backup could not be deleted. It may be the newest copy.')
      },
    })
  }

  const saveSettings = () => {
    setSavingSettings(true)
    const payload: Record<string, string | number | boolean> = { ...settings }

    router.put('/settings', { backup: payload }, {
      preserveScroll: true,
      onSuccess: () => {
        setSavingSettings(false)
        toast.success('Automatic backup settings saved')
      },
      onError: () => {
        setSavingSettings(false)
        toast.error('Could not save these settings')
      },
    })
  }

  const errorList = Object.values(errors).filter(Boolean)

  return (
    <SettingsLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600/20 to-cyan-600/5">
              <Database className="size-5 text-cyan-700" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Backup & Restore</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Keep a safe copy of your shop data and bring it back if something goes wrong.
              </p>
            </div>
          </div>

          <Button size="lg" className="h-11 gap-2 px-4" onClick={() => setCreateOpen(true)}>
            <Database className="size-4" aria-hidden="true" />
            Back up now
          </Button>
        </header>

        {errorList.length > 0 && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              {errorList.map((message) => <p key={message}>{message}</p>)}
            </div>
          </div>
        )}

        <section
          className={cn(
            'rounded-2xl border p-4 sm:p-5',
            isProtected ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/60',
          )}
          aria-live="polite"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', isProtected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                {isProtected ? <ShieldCheck className="size-5" aria-hidden="true" /> : <AlertTriangle className="size-5" aria-hidden="true" />}
              </div>
              <div>
                <p className={cn('text-sm font-semibold', isProtected ? 'text-emerald-900' : 'text-amber-900')}>
                  {isProtected ? 'Your shop data is protected' : lastVerified ? 'Your last backup is getting old' : 'No backup yet'}
                </p>
                <p className={cn('mt-0.5 text-xs', isProtected ? 'text-emerald-800' : 'text-amber-800')}>
                  {lastVerified
                    ? `Last backup ${formatRelative(stats.last_verified_at)} · ${formatDateTime(stats.last_verified_at)}`
                    : 'Create your first backup so your sales, stock and customers can be recovered.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1">
                <HardDrive className="size-3" aria-hidden="true" /> {stats.total} backup{stats.total === 1 ? '' : 's'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1">
                <FileArchive className="size-3" aria-hidden="true" /> {formatBytes(stats.total_bytes)} used
              </span>
              {stats.pending_jobs > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-amber-800">
                  <Clock className="size-3" aria-hidden="true" /> {stats.pending_jobs} queued job{stats.pending_jobs === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>
        </section>

        <div role="tablist" aria-label="Backup sections" className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              id={`tab-${id}`}
              onClick={() => selectTab(id)}
              className={cn(
                'inline-flex h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                tab === id ? 'bg-background text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        <div
          ref={panelRef}
          id={`panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          tabIndex={-1}
          className="space-y-5 outline-none"
        >
          {tab === 'backups' && (
            <section className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Your backups</h2>
                  <p className="text-xs text-muted-foreground">Download a copy, check it, or restore it later.</p>
                </div>
              </div>

              {backups.data.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
                  <HardDrive className="mx-auto size-10 text-muted-foreground/40" aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-medium">No backups yet</h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                    Create a backup to protect your products, sales, customers and uploaded files.
                  </p>
                  <Button className="mt-4 h-11 gap-2" onClick={() => setCreateOpen(true)}>
                    <Database className="size-4" aria-hidden="true" />
                    Create your first backup
                  </Button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {backups.data.map((backup) => {
                    const restorableRow = ['verified', 'completed'].includes(backup.status)

                    return (
                      <li key={backup.id} className="rounded-xl border border-border bg-card p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
                                <FileArchive className="size-4 text-muted-foreground" aria-hidden="true" />
                              </span>
                              <span className="text-sm font-medium">{friendlyName(backup)}</span>
                              <StatusBadge status={backup.status} />
                              {backup.encrypted && (
                                <Badge variant="outline" className="h-6 gap-1 px-2">
                                  <Lock className="size-3" aria-hidden="true" /> Encrypted
                                </Badge>
                              )}
                            </div>

                            <p className="pl-10 text-xs text-muted-foreground">
                              {formatBytes(backup.size_bytes)}
                              {backup.included_scope?.prescriptions
                                ? ` · ${backup.included_scope.prescriptions} prescription file(s)`
                                : ''}
                            </p>

                            {backup.failure_reason && (
                              <p className="pl-10 text-xs text-red-700">{backup.failure_reason}</p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <a
                              href={`/settings/backup/${backup.id}/download`}
                              aria-disabled={!restorableRow}
                              tabIndex={restorableRow ? 0 : -1}
                              onClick={(event) => {
                                if (!restorableRow) event.preventDefault()
                              }}
                              className={cn(
                                buttonVariants({ variant: 'outline', size: 'lg' }),
                                'h-10 gap-1.5',
                                !restorableRow && 'pointer-events-none opacity-50',
                              )}
                            >
                              <Download className="size-4" aria-hidden="true" />
                              Download
                            </a>

                            <Button
                              variant="outline"
                              size="lg"
                              className="h-10 gap-1.5"
                              disabled={!restorableRow}
                              onClick={() => {
                                setSelectedServerBackup(String(backup.id))
                                setRestorePassword('')
                                setTab('restore')
                                requestAnimationFrame(() => panelRef.current?.focus())
                              }}
                            >
                              <RotateCcw className="size-4" aria-hidden="true" />
                              Restore
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon-lg"
                              className="size-10 text-muted-foreground hover:text-red-600"
                              aria-label={`Delete backup from ${formatDateTime(backup.created_at)}`}
                              title="Delete backup"
                              onClick={() => {
                                setDeleteTarget(backup)
                                setDeleteForce(false)
                              }}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>

                        <details className="mt-3 border-t border-border pt-3">
                          <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                            <ChevronDown className="size-3" aria-hidden="true" /> Details and checks
                          </summary>
                          <div className="mt-3 space-y-3 text-xs text-muted-foreground">
                            <dl className="grid gap-2 sm:grid-cols-2">
                              <div>
                                <dt className="font-medium text-foreground">File</dt>
                                <dd className="break-all font-mono text-[11px]">{backup.filename}</dd>
                              </div>
                              <div>
                                <dt className="font-medium text-foreground">Type</dt>
                                <dd>{backup.kind === 'safety' ? 'Safety copy made before a restore' : backup.kind}</dd>
                              </div>
                              <div>
                                <dt className="font-medium text-foreground">Verified</dt>
                                <dd>{formatDateTime(backup.verified_at)}</dd>
                              </div>
                              {backup.sha256 && (
                                <div>
                                  <dt className="font-medium text-foreground">Checksum</dt>
                                  <dd className="break-all font-mono text-[11px]">{backup.sha256}</dd>
                                </div>
                              )}
                            </dl>

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <div className="flex-1">
                                <PasswordInput
                                  value={verifyPasswords[backup.id] ?? ''}
                                  onChange={(value) => setVerifyPasswords((current) => ({ ...current, [backup.id]: value }))}
                                  label="Password for this backup (only if encrypted)"
                                  autoComplete="off"
                                />
                              </div>
                              <Button
                                variant="outline"
                                size="lg"
                                className="h-10 gap-1.5"
                                disabled={verifyingId === backup.id}
                                onClick={() => handleVerify(backup)}
                              >
                                {verifyingId === backup.id ? (
                                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                ) : (
                                  <ShieldCheck className="size-4" aria-hidden="true" />
                                )}
                                Check file
                              </Button>
                            </div>
                          </div>
                        </details>
                      </li>
                    )
                  })}
                </ul>
              )}

              {backups.last_page > 1 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Page {backups.current_page} of {backups.last_page}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-10"
                      disabled={backups.current_page <= 1}
                      onClick={() => router.get('/settings/backup', { page: backups.current_page - 1 }, { preserveScroll: true })}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-10"
                      disabled={backups.current_page >= backups.last_page}
                      onClick={() => router.get('/settings/backup', { page: backups.current_page + 1 }, { preserveScroll: true })}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}

          {tab === 'restore' && (
            <section className="space-y-4">
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />
                  <div>
                    <h2 className="text-sm font-semibold text-red-900">Restoring replaces your current data</h2>
                    <p className="mt-1 text-xs text-red-800">
                      Your products, sales, customers and uploaded files will be replaced with the backup.
                      A safety copy is made automatically first.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <Upload className="size-4 text-muted-foreground" aria-hidden="true" />
                    <h3 className="text-sm font-medium">Upload a backup file</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Choose an .invbak file saved on this device.</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".invbak,.zip"
                    className="sr-only"
                    aria-label="Choose a backup file"
                    onChange={handleUpload}
                  />
                  <Button
                    variant="outline"
                    size="lg"
                    className="mt-3 h-11 w-full gap-1.5"
                    disabled={inspecting}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {inspecting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
                    Choose file
                  </Button>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <Server className="size-4 text-muted-foreground" aria-hidden="true" />
                    <h3 className="text-sm font-medium">Use a backup from this shop</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Pick one of the backups stored in the app.</p>

                  <label htmlFor="server-backup" className="sr-only">Backup stored in the app</label>
                  <select
                    id="server-backup"
                    value={selectedServerBackup}
                    onChange={(event) => setSelectedServerBackup(event.target.value)}
                    className="mt-3 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">Choose a backup…</option>
                    {restorable.map((backup) => (
                      <option key={backup.id} value={backup.id}>
                        {friendlyName(backup)} · {formatBytes(backup.size_bytes)}
                      </option>
                    ))}
                  </select>

                  <Button
                    size="lg"
                    className="mt-2 h-11 w-full gap-1.5"
                    disabled={inspecting || !selectedServerBackup}
                    onClick={handleInspectServer}
                  >
                    {inspecting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="size-4" aria-hidden="true" />}
                    Review this backup
                  </Button>

                  {selectedServerBackup && !preview && (
                    <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
                      Selected. Review it to see what will be restored.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <PasswordInput
                  value={restorePassword}
                  onChange={setRestorePassword}
                  label="Backup password (only if the backup is encrypted)"
                  placeholder="Leave empty if you did not set a password"
                  autoComplete="off"
                  describedBy="restore-password-help"
                />
                <p id="restore-password-help" className="mt-1 text-xs text-muted-foreground">
                  The password was chosen when the backup was created. It is never stored by the app.
                </p>
              </div>

              {(errors.restore || errors.file) && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <p>{errors.restore || errors.file}</p>
                </div>
              )}

              {preview && restoreRunId ? (
                <div ref={previewRef} className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <Check className="size-4" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-amber-900">Backup checked and ready</h3>
                        <p className="text-xs text-amber-800">Nothing has been changed yet.</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="h-9 text-amber-900 hover:bg-amber-100"
                      onClick={() => router.get('/settings/backup', {}, { preserveScroll: true })}
                    >
                      Choose a different backup
                    </Button>
                  </div>

                  <ol className="flex flex-wrap items-center gap-2 text-xs font-medium text-amber-900" aria-label="Restore steps">
                    <li className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1">
                      <CheckCircle2 className="size-3" aria-hidden="true" /> 1. Checked
                    </li>
                    <li className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-amber-200">
                      2. Review
                    </li>
                    <li className="text-amber-700">3. Restore</li>
                  </ol>

                  <dl className="grid gap-2 text-xs text-amber-900 sm:grid-cols-2">
                    <div><dt className="font-medium">Made on</dt><dd>{formatDateTime(preview.created_at)}</dd></div>
                    <div><dt className="font-medium">Source</dt><dd>{preview.source === 'upload' ? 'Uploaded file' : 'Stored backup'}</dd></div>
                    <div><dt className="font-medium">Data</dt><dd>{preview.table_count} tables · {preview.row_count} records</dd></div>
                    <div><dt className="font-medium">Files</dt><dd>{preview.file_count} uploaded file(s)</dd></div>
                    <div><dt className="font-medium">Password</dt><dd>{preview.encrypted ? 'Protected' : 'Not protected'}</dd></div>
                    <div><dt className="font-medium">File</dt><dd className="break-all font-mono text-[11px]">{preview.artifact}</dd></div>
                  </dl>

                  {preview.warnings.length > 0 && (
                    <div className="rounded-lg bg-amber-100 p-3 text-xs text-amber-900">
                      <p className="font-medium">Please note</p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-4">
                        {preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="restore-confirmation" className="block text-xs font-medium text-amber-900">
                      Type <span className="rounded bg-white px-1.5 py-0.5 font-mono">{preview.confirmation_phrase}</span> to confirm
                    </label>
                    <input
                      id="restore-confirmation"
                      value={confirmation}
                      onChange={(event) => setConfirmation(event.target.value)}
                      autoComplete="off"
                      className="h-11 w-full rounded-lg border border-amber-300 bg-white px-3 text-base text-gray-900 outline-none focus-visible:border-amber-500 focus-visible:ring-3 focus-visible:ring-amber-500/30 md:text-sm"
                    />
                  </div>

                  {stats.pending_jobs > 0 && (
                    <label className="flex items-start gap-2 text-xs text-amber-900">
                      <input
                        type="checkbox"
                        checked={forceRestore}
                        onChange={(event) => setForceRestore(event.target.checked)}
                        className="mt-0.5 size-4"
                      />
                      I understand that {stats.pending_jobs} queued job{stats.pending_jobs === 1 ? '' : 's'} will be discarded.
                    </label>
                  )}

                  <Button
                    variant="destructive"
                    size="lg"
                    className="h-11 w-full gap-1.5 sm:w-auto"
                    disabled={restoring || confirmation.trim() !== preview.confirmation_phrase}
                    onClick={handleRestore}
                  >
                    {restoring ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="size-4" aria-hidden="true" />}
                    {restoring ? 'Restoring — keep this page open…' : 'Restore this backup'}
                  </Button>

                  <p className="text-[11px] text-amber-800" aria-live="polite">
                    Restoring can take a minute. Do not close this page.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-card px-6 py-8 text-center">
                  <Info className="mx-auto size-8 text-muted-foreground/50" aria-hidden="true" />
                  <p className="mt-2 text-sm font-medium">Choose a backup to review it</p>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                    Upload a file or pick a stored backup. You will see what it contains before anything is replaced.
                  </p>
                </div>
              )}
            </section>
          )}

          {tab === 'schedule' && (
            <section className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
                <Switch
                  checked={settings.enabled}
                  onChange={(enabled) => setSettings({ ...settings, enabled })}
                  label="Automatic backups"
                  description="Let the app make a backup for you on a schedule."
                />
              </div>

              <div className={cn('space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5', !settings.enabled && 'opacity-60')}>
                <fieldset disabled={!settings.enabled} className="space-y-4">
                  <legend className="text-sm font-medium">When should it run?</legend>

                  <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted/40 p-1" role="group" aria-label="Backup frequency">
                    {[
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={settings.frequency === option.value}
                        onClick={() => setSettings({ ...settings, frequency: option.value })}
                        className={cn(
                          'h-10 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                          settings.frequency === option.value ? 'bg-background text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="backup-time" className="block text-sm font-medium">Time of day</label>
                      <input
                        id="backup-time"
                        type="time"
                        value={settings.time}
                        onChange={(event) => setSettings({ ...settings, time: event.target.value })}
                        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="backup-timezone" className="block text-sm font-medium">Timezone</label>
                      <input
                        id="backup-timezone"
                        value={settings.timezone}
                        onChange={(event) => setSettings({ ...settings, timezone: event.target.value })}
                        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                      <p className="text-xs text-muted-foreground">Usually your business timezone: {businessTimezone}.</p>
                    </div>
                  </div>

                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">How many copies should we keep?</legend>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { key: 'retain_daily', label: 'Daily copies' },
                        { key: 'retain_weekly', label: 'Weekly copies' },
                        { key: 'retain_monthly', label: 'Monthly copies' },
                        { key: 'retain_safety', label: 'Safety copies' },
                      ].map(({ key, label }) => (
                        <div key={key} className="space-y-1.5">
                          <label htmlFor={`retain-${key}`} className="block text-xs font-medium text-muted-foreground">{label}</label>
                          <input
                            id={`retain-${key}`}
                            type="number"
                            min={1}
                            value={(settings as any)[key]}
                            onChange={(event) => setSettings({ ...settings, [key]: Number(event.target.value) })}
                            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Manual backups are never deleted automatically.
                    </p>
                  </fieldset>
                </fieldset>

                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  {settingsSummary}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    size="lg"
                    className="h-11 gap-1.5"
                    disabled={!hasChanges || savingSettings}
                    onClick={saveSettings}
                  >
                    {savingSettings ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
                    Save schedule
                  </Button>
                  <span className="text-xs text-muted-foreground" aria-live="polite">
                    {hasChanges ? 'You have unsaved changes.' : 'Schedule is up to date.'}
                  </span>
                </div>
              </div>

              <details className="rounded-xl border border-border bg-card p-4">
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                  For your hosting provider
                </summary>
                <p className="mt-2 text-xs text-muted-foreground">
                  Automatic backups need the scheduler to run every minute. On cPanel or a VPS, add:
                </p>
                <code className="mt-2 block overflow-x-auto rounded-lg bg-muted px-3 py-2 text-[11px]">
                  * * * * * cd /path/to/app &amp;&amp; php artisan schedule:run &gt;&gt; /dev/null 2&gt;&amp;1
                </code>
              </details>
            </section>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a backup</DialogTitle>
            <DialogDescription>
              We save your database, prescription images and branding files into one checked file.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">What is included</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                <li>Products, stock, sales, purchases, customers and payments</li>
                <li>Prescription images and your branding logo</li>
                <li>Settings, users and permissions</li>
              </ul>
            </div>

            <PasswordInput
              value={password}
              onChange={setPassword}
              label="Password (recommended)"
              placeholder="At least 8 characters"
              describedBy="create-password-help"
            />
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              label="Repeat password"
              autoComplete="new-password"
              describedBy="create-password-help"
            />
            <p id="create-password-help" className="text-xs text-muted-foreground">
              Keep this password safe. Without it, an encrypted backup cannot be restored. Leave both fields empty to create an unencrypted backup.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" size="lg" className="h-11" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button size="lg" className="h-11 gap-2" onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Database className="size-4" aria-hidden="true" />}
              {creating ? 'Creating and checking…' : 'Create backup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this backup?</DialogTitle>
            <DialogDescription>
              {deleteTarget ? `${friendlyName(deleteTarget)} will be removed from this server. This cannot be undone.` : ''}
            </DialogDescription>
          </DialogHeader>

          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={deleteForce}
              onChange={(event) => setDeleteForce(event.target.checked)}
              className="mt-0.5 size-4"
            />
            Delete it even if it is the newest working backup.
          </label>

          <DialogFooter>
            <Button variant="outline" size="lg" className="h-11" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Keep it
            </Button>
            <Button variant="destructive" size="lg" className="h-11 gap-2" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
              Delete backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsLayout>
  )
}
