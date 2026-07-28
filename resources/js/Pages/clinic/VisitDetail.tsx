import { useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { ArrowLeft, Calendar, FileText, Pill, Clock, CalendarDays, RefreshCw, Package, Image as ImageIcon, ShoppingCart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import ImageViewer from '@/components/ui/ImageViewer'

const statusConfig: Record<string, { label: string; class: string }> = {
  completed: { label: 'Completed', class: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800' },
  'follow-up': { label: 'Follow-up', class: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800' },
  scheduled: { label: 'Scheduled', class: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800' },
}

export default function VisitDetailPage() {
  const { props } = usePage()
  const c = (props as any).consultation

  // Image viewer state
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerImages, setViewerImages] = useState<{ id: number | string; url: string; name?: string }[]>([])
  const [viewerIndex, setViewerIndex] = useState(0)

  const openViewer = (images: any[], startIndex: number) => {
    setViewerImages(images.map((img: any) => ({
      id: img.id,
      url: img.url || `/storage/prescriptions/${img.image_path}`,
      name: img.original_name || 'Prescription image',
    })))
    setViewerIndex(startIndex)
    setViewerOpen(true)
  }

  if (!c) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center py-24 text-sm text-muted-foreground">
        Visit not found.
      </div>
    )
  }

  const statusCfg = statusConfig[c.status] || statusConfig.completed
  const sale = c.sale || {}
  const saleItems = sale.items || []
  const prescriptions = c.prescriptions || []

  // Flatten all items from all prescriptions
  // Defensive: Laravel serializes 'saleItem' (camelCase), so check both conventions
  const allRxItems = prescriptions.flatMap((rx: any) =>
    (rx.items || []).map((item: any) => {
      const saleItem = item.saleItem || item.sale_item || {}
      return {
        ...item,
        sale_item: saleItem,
        product: saleItem.product || {},
        prescription: rx,
      }
    })
  )

  // All images across prescriptions — build URL from image_path
  const allImages = prescriptions.flatMap((rx: any) =>
    (rx.images || []).map((img: any) => ({
      id: img.id,
      image_path: img.image_path,
      original_name: img.original_name,
      url: `/storage/prescriptions/${img.image_path}`,
    }))
  )

  const patientName = c.patient?.name || 'Unknown Patient'
  const initials = patientName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-24">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.visit(`/clinic/patient/${c.patient_id}`)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          <span>Back to {patientName}</span>
        </button>
        <Badge className={cn('text-[11px] px-2.5 py-1 font-medium border', statusCfg.class)}>
          {statusCfg.label}
        </Badge>
      </div>

      {/* ── Patient + Visit header card ── */}
      <Card className="overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-primary/70 to-primary/30" />
        <CardContent className="p-0">
          <div className="px-5 pb-5 -mt-8">
            <div className="flex items-end gap-4 mb-4">
              <div className="size-14 rounded-xl bg-background ring-4 ring-background flex items-center justify-center text-lg font-bold text-primary shadow-sm">
                {initials}
              </div>
              <div className="pt-1">
                <h1 className="text-lg font-semibold tracking-tight">{patientName}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <Calendar className="size-3.5" />
                  <span>{c.visit_date || '—'}</span>
                  {c.doctor && <><span>·</span><span>{c.doctor.name}</span></>}
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-muted/40 px-3 py-2.5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Fee</div>
                <div className="text-sm font-semibold mt-0.5">{formatCurrency(c.consultation_fee || 0)}</div>
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-2.5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</div>
                <div className="text-sm font-semibold mt-0.5">{formatCurrency(sale.grand_total || 0)}</div>
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-2.5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Paid</div>
                <div className={cn('text-sm font-semibold mt-0.5', (sale.amount_paid || 0) > 0 ? 'text-emerald-600' : 'text-muted-foreground')}>{formatCurrency(sale.amount_paid || 0)}</div>
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-2.5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Medicines</div>
                <div className="text-sm font-semibold mt-0.5">{allRxItems.length}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Clinical details ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Diagnosis & Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="size-4 text-muted-foreground" />
                Visit Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Diagnosis</div>
                <p className="text-sm font-medium">{c.diagnosis || '—'}</p>
              </div>
              {c.notes && (
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Clinical Notes</div>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{c.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prescription Items */}
          {allRxItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Pill className="size-4 text-muted-foreground" />
                  Prescribed Medicines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {allRxItems.map((item: any, idx: number) => {
                  const product = item.sale_item?.product || {}
                  const si = item.sale_item || {}
                  const colors = ['from-sky-500/20 to-blue-500/10', 'from-purple-500/20 to-violet-500/10', 'from-emerald-500/20 to-teal-500/10', 'from-amber-500/20 to-orange-500/10', 'from-rose-500/20 to-pink-500/10']
                  const colorClass = colors[idx % colors.length]
                  return (
                    <div key={item.id} className="rounded-xl border border-border overflow-hidden">
                      <div className={cn('h-1.5 bg-gradient-to-r', colorClass)} />
                      <div className="p-4 space-y-3">
                        {/* Medicine header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">{product.name || si.product_name || 'Medicine'}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{si.packaging_name || 'Unit'} × {si.packaging_quantity || 1}</p>
                          </div>
                          <span className="text-sm font-semibold text-foreground whitespace-nowrap">{formatCurrency(si.total || 0)}</span>
                        </div>
                        {/* Dosage grid */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5"><Pill className="size-2.5" /> Dosage</div>
                            <div className="text-xs font-medium">{item.dosage || '1'}</div>
                          </div>
                          <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5"><Clock className="size-2.5" /> Frequency</div>
                            <div className="text-xs font-medium">{item.frequency || '—'}</div>
                          </div>
                          <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5"><CalendarDays className="size-2.5" /> Duration</div>
                            <div className="text-xs font-medium">{item.duration || '—'}</div>
                          </div>
                        </div>
                        {/* Instructions */}
                        {item.instructions && (
                          <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                            <FileText className="size-3 mt-0.5 shrink-0" />
                            <span>{item.instructions}</span>
                          </div>
                        )}
                        {/* Sale reference */}
                        <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/40 flex items-center gap-2">
                          <ShoppingCart className="size-3" />
                          <span>Base qty: {si.base_quantity || 0} · Price/unit: {formatCurrency(si.unit_price || 0)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {allRxItems.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                <Package className="size-8 mx-auto mb-2 text-muted-foreground/30" />
                No medicines prescribed in this visit.
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right: Sale + Images ── */}
        <div className="space-y-5">
          {/* Sale details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShoppingCart className="size-4 text-muted-foreground" />
                Sale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sale.id ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Invoice</span>
                    <span className="font-medium font-mono text-xs">{sale.invoice_number || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items</span>
                    <span className="font-medium">{saleItems.length}</span>
                  </div>
                  <div className="border-t border-border/60 pt-2 space-y-1.5">
                    {saleItems.map((si: any) => (
                      <div key={si.id} className="flex justify-between text-xs">
                        <span className="text-muted-foreground truncate max-w-[60%]">{si.product_name || 'Item'}</span>
                        <span className="font-medium">{formatCurrency(si.total || 0)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border/60 pt-2 flex justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(sale.grand_total || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className={cn('font-medium', (sale.amount_paid || 0) > 0 ? 'text-emerald-600' : 'text-muted-foreground')}>{formatCurrency(sale.amount_paid || 0)}</span>
                  </div>
                  {(sale.outstanding_balance || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Outstanding</span>
                      <span className="font-medium text-amber-600">{formatCurrency(sale.outstanding_balance || 0)}</span>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full gap-1.5 mt-1"
                    onClick={() => router.visit(`/sales/${sale.id}`)}>
                    <ShoppingCart className="size-3.5" /> View Full Sale
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No sale record</p>
              )}
            </CardContent>
          </Card>

          {/* Prescription Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ImageIcon className="size-4 text-muted-foreground" />
                Images
                {allImages.length > 0 && (
                  <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 h-4 font-normal">{allImages.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allImages.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allImages.map((img: any, idx: number) => (
                    <button key={img.id} onClick={() => openViewer(allImages, idx)}
                      className="size-20 rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors">
                      <img src={img.url} alt="" className="size-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  <ImageIcon className="size-6 mx-auto mb-1 text-muted-foreground/30" />
                  <p className="text-xs">No images</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fullscreen image viewer */}
      <ImageViewer
        images={viewerImages}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        initialIndex={viewerIndex}
      />
    </div>
  )
}
