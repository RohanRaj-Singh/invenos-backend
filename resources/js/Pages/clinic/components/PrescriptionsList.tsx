import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Pill, Clock, CalendarDays, RefreshCw, FileText, Package, Image as ImageIcon, Trash2, RotateCcw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import ImageViewer from '@/components/ui/ImageViewer'

interface PrescriptionsListProps {
  prescriptions: any[]
}

export default function PrescriptionsList({ prescriptions }: PrescriptionsListProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerImages, setViewerImages] = useState<{ id: number | string; url: string; name?: string }[]>([])
  const [viewerIndex, setViewerIndex] = useState(0)

  const openViewer = (images: any[], startIndex: number) => {
    setViewerImages(images.map((img: any) => ({
      id: img.id,
      url: `/storage/prescriptions/${img.image_path}`,
      name: img.original_name || 'Prescription image',
    })))
    setViewerIndex(startIndex)
    setViewerOpen(true)
  }

  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    router.delete(`/clinic/prescriptions/${deleteTarget.id}`, {
      data: { reason: deleteReason || 'Manual deletion' },
      onSuccess: () => {
        toast.success('Prescription deleted.')
        setDeleteTarget(null)
        setDeleteReason('')
      },
      onError: (err) => toast.error(Object.values(err).join(', ')),
      onFinish: () => setIsDeleting(false),
    })
  }

  const handleRestore = (rx: any) => {
    router.post(`/clinic/prescriptions/${rx.id}/restore`, {}, {
      onSuccess: () => {
        toast.success('Prescription restored.')
        setDeleteTarget(null)
      },
      onError: (err) => toast.error(Object.values(err).join(', ')),
    })
  }

  return (
    <div className="space-y-3">
      {prescriptions.map((rx: any, idx: number) => {
        const colors = [
          'from-sky-500/20 to-blue-500/10 text-blue-600 dark:text-blue-400',
          'from-purple-500/20 to-violet-500/10 text-purple-600 dark:text-purple-400',
          'from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400',
          'from-amber-500/20 to-orange-500/10 text-amber-600 dark:text-amber-400',
          'from-rose-500/20 to-pink-500/10 text-rose-600 dark:text-rose-400',
        ]
        const colorClass = colors[idx % colors.length]

        // Backend: prescription.items[].saleItem.product.name
        // Each item has sale_item_id → sale_item → product
        const items = rx.items || []

        return (
          <Card key={rx.id} size="sm" className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex items-center justify-center size-10 rounded-xl bg-gradient-to-br shrink-0', colorClass)}>
                      <Pill className="size-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-foreground">
                        Prescription #{rx.id}
                      </h5>
                      <p className="text-xs text-muted-foreground">
                        {rx.prescribed_by || 'Dr. Ahmed'} · {rx.date || '—'}
                      </p>
                    </div>
                  </div>
                  {rx.refillable && (
                    <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 font-medium text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 shrink-0">
                      <RefreshCw className="size-2.5 mr-1" />
                      Refillable
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 shrink-0">
                    {rx.deleted_at ? (
                      <button onClick={() => handleRestore(rx)}
                        className="p-1.5 rounded-lg text-primary hover:bg-primary/5 transition-colors" title="Restore">
                        <RotateCcw className="size-3.5" />
                      </button>
                    ) : (
                      <button onClick={() => { setDeleteTarget(rx); setDeleteReason('') }}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Items list */}
                {items.length > 0 ? (
                  <div className="space-y-2">
                    {items.map((item: any) => {
                      const saleItem = item.sale_item || item.saleItem || {}
                      const product = saleItem.product || {}
                      return (
                        <div key={item.id} className="rounded-lg bg-muted/40 p-3 border border-border/50">
                          <div className="text-sm font-semibold text-foreground mb-2">{product.name || saleItem.product_name || 'Medicine'}</div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="px-2 py-1.5 rounded bg-muted/50">
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                                <Pill className="size-2.5" /> Dosage
                              </div>
                              <div className="text-xs font-medium text-foreground">{item.dosage || '1'}</div>
                            </div>
                            <div className="px-2 py-1.5 rounded bg-muted/50">
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                                <Clock className="size-2.5" /> Frequency
                              </div>
                              <div className="text-xs font-medium text-foreground">{item.frequency || '—'}</div>
                            </div>
                            <div className="px-2 py-1.5 rounded bg-muted/50">
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                                <CalendarDays className="size-2.5" /> Duration
                              </div>
                              <div className="text-xs font-medium text-foreground">{item.duration || '—'}</div>
                            </div>
                          </div>
                          {item.instructions && (
                            <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/40">
                              <FileText className="size-3 mt-0.5 shrink-0" />
                              <span>{item.instructions}</span>
                            </div>
                          )}
                          {/* Prescription images */}
                          {rx.images && rx.images.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/40">
                              {rx.images.map((img: any, imgIdx: number) => (
                                <button key={img.id} onClick={() => openViewer(rx.images, imgIdx)}
                                  className="size-10 rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors">
                                  <img
                                    src={`/storage/prescriptions/${img.image_path}`}
                                    alt=""
                                    className="size-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                          {/* Show linked sale info */}
                          {saleItem.packaging_quantity && (
                            <div className="text-[10px] text-muted-foreground mt-1.5">
                              ×{saleItem.packaging_quantity} {saleItem.packaging_name || 'unit'} @ Rs.{saleItem.unit_price || 0}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground italic">
                    No medicine details
                  </div>
                )}

                {rx.notes && (
                  <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border">
                    <FileText className="size-3 mt-0.5 shrink-0" />
                    <span>{rx.notes}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {prescriptions.length === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          <Package className="size-8 mx-auto mb-2 text-muted-foreground/30" />
          No prescriptions found.
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-md gap-0 p-0">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle className="text-base flex items-center gap-2 text-red-500">
              <Trash2 className="size-5" />
              Delete Prescription
            </DialogTitle>
          </DialogHeader>
          <div className="p-5 space-y-4">
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              This will <strong>soft-delete</strong> the prescription. No inventory or balance will be impacted
              — linked sale items remain unchanged. You can restore it from the Recycle Bin later.
            </DialogDescription>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Reason for deletion</label>
              <input type="text" value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Incorrect prescription, etc."
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteReason('') }} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleDelete} disabled={isDeleting} className="flex-1 gap-1.5 bg-red-600 hover:bg-red-700">
                <Trash2 className="size-4" /> {isDeleting ? 'Deleting...' : 'Delete Prescription'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
