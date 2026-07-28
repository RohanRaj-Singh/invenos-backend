import { useState, useRef } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Database, Download, Upload, Trash2, HardDrive, Loader2 } from 'lucide-react'
import { SettingsLayout, SettingsSection, SettingsCard } from '../components/SettingsComponents'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface BackupEntry {
  name: string
  size: string
  date: string
}

export default function BackupRestorePage() {
  const { props } = usePage()
  const backups = ((props as any).backups || []) as BackupEntry[]
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleCreateBackup = () => {
    setCreating(true)
    router.post('/settings/backup', {}, {
      onSuccess: () => { setCreating(false); toast.success('Backup created') },
      onError: () => { setCreating(false); toast.error('Backup failed') },
    })
  }

  const handleRestoreUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    router.post('/settings/backup/restore', form, {
      onSuccess: () => toast.success('Database restored'),
      onError: (errs) => toast.error(Object.values(errs).join(', ') || 'Restore failed'),
    })
    e.target.value = ''
  }

  const handleDelete = (name: string) => {
    router.delete(`/settings/backup/${encodeURIComponent(name)}`, {
      onSuccess: () => toast.success('Backup deleted'),
      onError: () => toast.error('Delete failed'),
    })
    setConfirmDelete(null)
  }

  return (
    <SettingsLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-cyan-600/20 to-cyan-600/5 flex items-center justify-center shrink-0">
            <Database className="size-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Backup & Restore</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Create and restore MySQL database backups.</p>
          </div>
        </div>

        <SettingsSection title="Backup Actions">
          <SettingsCard>
            <div className="flex items-center gap-4">
              <Button size="sm" className="gap-1.5" onClick={handleCreateBackup} disabled={creating}>
                {creating ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                {creating ? 'Creating...' : 'Create Backup'}
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4" /> Restore from File
              </Button>
              <input ref={fileInputRef} type="file" accept=".sql,.txt" className="hidden" onChange={handleRestoreUpload} />
            </div>
          </SettingsCard>
        </SettingsSection>

        <SettingsSection title="Backup History">
          <SettingsCard>
            {backups.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <HardDrive className="size-8 mx-auto mb-2 text-muted-foreground/30" />
                No backups yet. Click "Create Backup" to generate one.
              </div>
            ) : (
              <div className="space-y-1">
                {backups.map((b) => (
                  <div key={b.name} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <HardDrive className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{b.name}</div>
                        <div className="text-xs text-muted-foreground">{b.size} · {b.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <a href={`/settings/backup/download/${encodeURIComponent(b.name)}`}
                        className="inline-flex items-center justify-center size-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Download"
                      >
                        <Download className="size-3.5" />
                      </a>
                      {confirmDelete === b.name ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(b.name)}
                            className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
                          >Confirm</button>
                          <button onClick={() => setConfirmDelete(null)}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(b.name)}
                          className="inline-flex items-center justify-center size-8 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SettingsCard>
        </SettingsSection>

        <SettingsSection title="Scheduled Backups">
          <SettingsCard>
            <p className="text-sm text-muted-foreground">
              For automatic scheduled backups, configure a cron job running: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">php artisan backup:create</code>
            </p>
          </SettingsCard>
        </SettingsSection>
      </div>
    </SettingsLayout>
  )
}
