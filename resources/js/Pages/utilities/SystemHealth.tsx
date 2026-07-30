import { usePage } from '@inertiajs/react'
import { Activity, Database, HardDrive, Server, CheckCircle2, XCircle, AlertTriangle, Trash2, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SystemHealthData {
  database: {
    connected: boolean
    name: string
    size_mb: number | null
    driver: string
  }
  migrations: {
    count: number
    last: string | null
  }
  storage: {
    total_gb: number
    free_gb: number
    used_pct: number
  }
  recycle_bin: {
    total: number
    products: number
    contacts: number
    sales: number
    purchases: number
  }
  application: {
    php_version: string
    laravel_version: string
    environment: string
    debug: boolean
    timezone: string
  }
  last_audit: string | null
}

export default function SystemHealthPage() {
  const { props } = usePage()
  const data = (props as any).health as SystemHealthData

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Activity className="size-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Utilities</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">System Health</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of system status and diagnostics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Database */}
        <Card>
          <CardHeader className="flex-row items-center gap-2 pb-2">
            <Database className="size-4 text-primary" />
            <CardTitle className="text-sm">Database</CardTitle>
            {data.database.connected ? (
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-800 dark:text-emerald-400 ml-auto">
                <CheckCircle2 className="size-3 mr-0.5" /> Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-red-600 border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-800 dark:text-red-400 ml-auto">
                <XCircle className="size-3 mr-0.5" /> Disconnected
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <Row label="Driver" value={data.database.driver} />
              <Row label="Database" value={data.database.name} />
              <Row label="Size" value={data.database.size_mb ? `${data.database.size_mb} MB` : 'N/A'} />
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader className="flex-row items-center gap-2 pb-2">
            <HardDrive className="size-4 text-primary" />
            <CardTitle className="text-sm">Storage</CardTitle>
            <span className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded ml-auto',
              data.storage.used_pct > 85
                ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                : data.storage.used_pct > 65
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
            )}>
              {data.storage.used_pct}% used
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Storage bar */}
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    data.storage.used_pct > 85 ? 'bg-red-500' : data.storage.used_pct > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${Math.min(data.storage.used_pct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{data.storage.total_gb - data.storage.free_gb} GB used</span>
                <span>{data.storage.free_gb} GB free</span>
              </div>
              <Row label="Total" value={`${data.storage.total_gb} GB`} />
            </div>
          </CardContent>
        </Card>

        {/* Migrations */}
        <Card>
          <CardHeader className="flex-row items-center gap-2 pb-2">
            <Server className="size-4 text-primary" />
            <CardTitle className="text-sm">Migrations</CardTitle>
            <Badge variant="outline" className="text-[10px] ml-auto">{data.migrations.count} run</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <Row label="Total" value={`${data.migrations.count} migrations`} />
              <Row label="Last" value={data.migrations.last ?? 'N/A'} />
            </div>
          </CardContent>
        </Card>

        {/* Application */}
        <Card>
          <CardHeader className="flex-row items-center gap-2 pb-2">
            <Activity className="size-4 text-primary" />
            <CardTitle className="text-sm">Application</CardTitle>
            <span className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded ml-auto',
              data.application.environment === 'production'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
            )}>
              {data.application.environment}
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <Row label="PHP" value={data.application.php_version} />
              <Row label="Laravel" value={data.application.laravel_version} />
              <Row label="Timezone" value={data.application.timezone} />
              <Row label="Debug mode" value={data.application.debug ? 'Enabled' : 'Disabled'} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recycle Bin Summary */}
      <Card>
        <CardHeader className="flex-row items-center gap-2 pb-2">
          <Trash2 className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm">Recycle Bin</CardTitle>
          <Badge variant="outline" className="text-[10px] ml-auto">{data.recycle_bin.total} records</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Products" count={data.recycle_bin.products} />
            <StatBox label="Contacts" count={data.recycle_bin.contacts} />
            <StatBox label="Sales" count={data.recycle_bin.sales} />
            <StatBox label="Purchases" count={data.recycle_bin.purchases} />
          </div>
        </CardContent>
      </Card>

      {/* Last Activity */}
      {data.last_audit && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3" />
          Last lifecycle event: {data.last_audit}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ───

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

function StatBox({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-lg border border-border p-3 text-center">
      <div className="text-lg font-bold text-foreground tabular-nums">{count}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  )
}
