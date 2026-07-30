import { useState, useRef } from 'react'
import { router, usePage } from '@inertiajs/react'
import { ArrowLeft, Plus, Save, Pill, Clock, CalendarDays, FileText, Package, Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import AddMedicineDialog from './components/AddMedicineDialog'
import type { MedicineEntry } from './components/AddMedicineDialog'

const paymentOptions = [
  { id: 'full' as const, label: 'Full Payment', desc: 'Pay entire amount now' },
  { id: 'partial' as const, label: 'Partial Payment', desc: 'Pay part now, rest later' },
  { id: 'balance' as const, label: 'Add To Balance', desc: 'No payment now' },
]

const paymentMethods = [
  { id: 'cash' as const, label: 'Cash' },
  { id: 'card' as const, label: 'Card' },
  { id: 'easypaisa' as const, label: 'Easypaisa' },
  { id: 'jazzcash' as const, label: 'JazzCash' },
  { id: 'transfer' as const, label: 'Bank Transfer' },
]

export default function NewVisitPage() {
  const { props, url } = usePage()
  const patient = (props as any).patient
  // Products and selling units come from server
  const serverProducts = (props as any).products || []

  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [consultationFee, setConsultationFee] = useState('2000')
  const [paymentOption, setPaymentOption] = useState<'full' | 'partial' | 'balance'>('full')
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [selectedMeds, setSelectedMeds] = useState<MedicineEntry[]>([])
  const [showMedDialog, setShowMedDialog] = useState(false)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [prescriptionImages, setPrescriptionImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // (no completion dialog — Inertia redirects after POST, so we use toast instead)

  if (!patient) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto text-center py-24 text-sm text-muted-foreground">
        Patient not found.
      </div>
    )
  }

  const handleAddMedicine = (entry: MedicineEntry) => {
    if (editingIdx !== null) {
      setSelectedMeds((prev) => prev.map((m, i) => i === editingIdx ? { ...entry, id: m.id } : m))
      setEditingIdx(null)
    } else {
      setSelectedMeds((prev) => [...prev, entry])
    }
  }

  const handleEditMedicine = (idx: number) => {
    setEditingIdx(idx)
    setShowMedDialog(true)
  }

  const handleRemoveMedicine = (idx: number) => {
    setSelectedMeds((prev) => prev.filter((_, i) => i !== idx))
  }

  const consultationAmount = parseInt(consultationFee) || 0
  const medTotal = selectedMeds.reduce((sum, m) => sum + m.total, 0)
  const grandTotal = consultationAmount + medTotal

  const handleSave = () => {
    if (!diagnosis.trim()) { toast.error('Please enter a diagnosis'); return }
    setSaving(true)

    const amountPaid = paymentOption === 'full' ? grandTotal : paymentOption === 'partial' ? Math.round(grandTotal * 0.4) : 0
    const outstanding = grandTotal - amountPaid

    // Payment: sale only tracks medicine costs, consultation fee is stored on consultation
    const medicineAmountPaid = Math.min(amountPaid, medTotal)
    const medicinePaymentStatus = medicineAmountPaid === 0 ? 'unpaid' : medicineAmountPaid >= medTotal ? 'paid' : 'partial'

    router.post('/clinic/visits', {
      patient_id: patient.id,
      diagnosis: diagnosis.trim(),
      notes: notes.trim(),
      consultation_fee: consultationAmount,
      medications: selectedMeds.map(m => ({
        product_id: m.productId,
        selling_unit_id: m.sellingUnitId,
        packaging_quantity: m.packagingQuantity,
        base_unit_quantity: m.baseUnitQuantity,
        unit_price: m.unitPrice,
        total: m.total,
        packaging_name: m.packagingName,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.notes || '',
      })),
      payment_method: paymentMethod,
      amount_paid: medicineAmountPaid,
      payment_status: medicinePaymentStatus,
    }, {
      onSuccess: (page: any) => {
        toast.success(`Visit saved — ${grandTotal > 0 ? 'Rs. ' + grandTotal.toLocaleString() : 'no charge'}`)
        setSaving(false)

        // Upload prescription images in background (fire-and-forget after navigation)
        const consultations = page?.props?.consultations || []
        const prescriptionId = consultations.length > 0
          ? consultations[0]?.prescriptions?.[0]?.id
          : null
        if (prescriptionId && prescriptionImages.length > 0) {
          prescriptionImages.forEach(file => {
            const formData = new FormData()
            formData.append('image', file)
            window.axios.post(`/api/prescriptions/${prescriptionId}/images`, formData).catch(() => {})
          })
        }
      },
      onError: (errs) => {
        const msg = Object.values(errs).join(', ') || 'Failed to save visit'
        toast.error(msg)
        setSaving(false)
      },
    })
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5 pb-24">
        <div className="flex items-center justify-between">
          <button onClick={() => router.visit(`/clinic/patient/${patient.id}`)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" />
            <span>Back to {patient.name}</span>
          </button>
        </div>

        {/* Patient summary */}
        <Card size="sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              {patient.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h2 className="text-sm font-semibold">{patient.name}</h2>
              <p className="text-xs text-muted-foreground">{patient.phone}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Main form */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader><CardTitle>Visit Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Diagnosis <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g. Seasonal allergies — mild rhinitis" value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Clinical Notes</label>
                  <textarea placeholder="Detailed observations, recommendations..." value={notes}
                    onChange={(e) => setNotes(e.target.value)} rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Consultation Fee (Rs.)</label>
                  <input type="number" value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" min="0" />
                </div>
              </CardContent>
            </Card>

            {/* Medicines */}
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Prescription Items</CardTitle>
                <Button size="sm" variant="outline" className="gap-1.5"
                  onClick={() => { setEditingIdx(null); setShowMedDialog(true) }}>
                  <Plus className="size-3.5" /> Add Medicine
                </Button>
              </CardHeader>
              <CardContent>
                {selectedMeds.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <Package className="size-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p>No medicines added yet.</p>
                    <p className="text-xs mt-1">Click "Add Medicine" to prescribe.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedMeds.map((med, idx) => (
                      <div key={med.id || idx} className="flex items-start gap-3 rounded-lg border border-border p-3 group hover:border-muted-foreground/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{med.name}</span>
                            <span className="text-xs text-muted-foreground">×{med.packagingQuantity} {med.packagingName}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                            <span className="text-[11px] inline-flex items-center gap-1 text-muted-foreground">
                              <Pill className="size-3" /> {med.dosage}
                            </span>
                            <span className="text-[11px] inline-flex items-center gap-1 text-muted-foreground">
                              <Clock className="size-3" /> {med.frequency}
                            </span>
                            <span className="text-[11px] inline-flex items-center gap-1 text-muted-foreground">
                              <CalendarDays className="size-3" /> {med.duration}
                            </span>
                            {med.notes && (
                              <span className="text-[11px] inline-flex items-center gap-1 text-muted-foreground">
                                <FileText className="size-3" /> {med.notes}
                              </span>
                            )}
                            <span className="text-xs font-medium text-foreground ml-auto">{formatCurrency(med.total)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditMedicine(idx)}
                            className="flex items-center justify-center size-7 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground">
                            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => handleRemoveMedicine(idx)}
                            className="flex items-center justify-center size-7 rounded-md bg-muted hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-600">
                            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar summary */}
          <div className="lg:col-span-2 space-y-4">
            <div className="sticky top-20 space-y-4">
              <Card>
                <CardHeader><CardTitle>Bill Summary</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Consultation Fee</span>
                    <span className="font-medium">{formatCurrency(consultationAmount)}</span>
                  </div>
                  {selectedMeds.map((m) => (
                    <div key={m.productId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate max-w-[60%]">{m.name} ×{m.packagingQuantity}</span>
                      <span className="font-medium">{formatCurrency(m.total)}</span>
                    </div>
                  ))}
                  {selectedMeds.length > 0 && (
                    <div className="pt-2 border-t border-border flex justify-between text-sm">
                      <span className="text-muted-foreground">Prescription Items</span>
                      <span className="font-medium">{selectedMeds.length}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="text-sm font-semibold">Grand Total</span>
                    <span className="text-lg font-bold">{formatCurrency(grandTotal)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Prescription Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Prescription Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      if (files.length === 0) return
                      setPrescriptionImages(prev => [...prev, ...files])
                      files.forEach(file => {
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          if (ev.target?.result) setImagePreviews(prev => [...prev, ev.target!.result as string])
                        }
                        reader.readAsDataURL(file)
                      })
                      e.target.value = ''
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {imagePreviews.map((preview, idx) => (
                      <div key={idx} className="relative size-16 rounded-lg overflow-hidden border border-border group">
                        <img src={preview} alt="" className="size-full object-cover" />
                        <button onClick={() => {
                          setPrescriptionImages(prev => prev.filter((_, i) => i !== idx))
                          setImagePreviews(prev => prev.filter((_, i) => i !== idx))
                        }}
                          className="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => fileInputRef.current?.click()}
                      className="size-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-primary transition-colors">
                      <Upload className="size-4" />
                      <span className="text-[9px] font-medium">Upload</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {prescriptionImages.length > 0
                      ? `${prescriptionImages.length} file${prescriptionImages.length > 1 ? 's' : ''} selected`
                      : 'JPEG, PNG, or WebP — max 10MB each'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Payment Method</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map((m) => (
                      <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                        className={cn('px-2 py-2 rounded-lg border-2 text-xs font-medium transition-all text-center',
                          paymentMethod === m.id ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:text-foreground')}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment options */}
              <Card>
                <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {paymentOptions.map((opt) => (
                    <button key={opt.id} onClick={() => setPaymentOption(opt.id)}
                      className={cn('w-full text-left p-3 rounded-xl border-2 transition-all',
                        paymentOption === opt.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30')}>
                      <div className="text-sm font-medium text-foreground">{opt.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                      {paymentOption === opt.id && opt.id === 'full' && <div className="text-xs font-semibold text-emerald-600 mt-1">Pay {formatCurrency(grandTotal)} now</div>}
                      {paymentOption === opt.id && opt.id === 'partial' && (
                        <div className="text-xs font-semibold text-amber-600 mt-1">Pay {formatCurrency(Math.round(grandTotal * 0.4))} now, balance later</div>
                      )}
                      {paymentOption === opt.id && opt.id === 'balance' && <div className="text-xs font-semibold text-red-600 mt-1">No payment today — {formatCurrency(grandTotal)} to balance</div>}
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Button onClick={handleSave} disabled={saving} size="lg" className="w-full h-11 gap-1.5 shadow-sm">
                <Save className="size-4" />
                {saving ? 'Saving...' : 'Save Visit'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Medicine Dialog */}
      <AddMedicineDialog
        open={showMedDialog}
        onClose={() => { setShowMedDialog(false); setEditingIdx(null) }}
        onAdd={handleAddMedicine as any}
        selectedIds={selectedMeds.map((m) => m.productId)}
        editEntry={editingIdx !== null ? selectedMeds[editingIdx] : null}
        products={serverProducts}
      />

    </>
  )
}
