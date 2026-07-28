import { useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Stethoscope, Activity, Pill, CreditCard, Plus, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PatientHeader from './components/PatientHeader'
import VisitsTimeline from './components/VisitsTimeline'
import PrescriptionsList from './components/PrescriptionsList'
import PaymentsOverview from './components/PaymentsOverview'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'visits', label: 'Visits', icon: Stethoscope },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'payments', label: 'Payments', icon: CreditCard },
] as const

type TabId = (typeof tabs)[number]['id']

export default function PatientProfilePage() {
  const { props } = usePage()
  const patient = (props as any).patient
  const consultations = (props as any).consultations || []
  const prescriptions = (props as any).prescriptions || []
  const [activeTab, setActiveTab] = useState<TabId>('visits')

  if (!patient) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto text-center py-24 text-sm text-muted-foreground">
        Patient not found.
      </div>
    )
  }

  // Compute payment stats from consultation-linked sales
  const totalPaid = consultations.reduce((sum: number, c: any) => sum + (c.sale?.amount_paid ?? 0), 0)
  const totalOutstanding = consultations.reduce((sum: number, c: any) => sum + (c.sale?.outstanding_balance ?? 0), 0)

  // Flatten all payments from consultations
  const allPayments = consultations.flatMap((c: any) => {
    const sale = c.sale
    if (!sale || !sale.amount_paid) return []
    return [{
      date: sale.date,
      amount: sale.amount_paid,
      method: sale.payment_method || 'cash',
      reference: sale.invoice_number,
      description: c.diagnosis,
    }]
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => router.visit('/clinic')}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          <span>Back to patients</span>
        </button>
        <Button onClick={() => router.visit(`/clinic/patient/${patient.id}/visit`)}
          className="gap-1.5 h-9 shadow-sm">
          <Plus className="size-4" />
          <span>New Visit</span>
        </Button>
      </div>

      <PatientHeader patient={patient} visitCount={consultations.length} />

      <div className="border-b border-border">
        <div className="flex -mb-px overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap',
                  isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                )}>
                <Icon className="size-4" />
                <span>{tab.label}</span>
                {tab.id === 'visits' && (
                  <span className="inline-flex items-center justify-center size-5 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">{consultations.length}</span>
                )}
                {tab.id === 'prescriptions' && (
                  <span className="inline-flex items-center justify-center size-5 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">{prescriptions.length}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        {activeTab === 'visits' && <VisitsTimeline consultations={consultations} />}
        {activeTab === 'prescriptions' && <PrescriptionsList prescriptions={prescriptions} />}
        {activeTab === 'payments' && (
          <PaymentsOverview
            payments={allPayments}
            totalPaid={totalPaid}
            totalOutstanding={totalOutstanding}
          />
        )}
      </div>
    </div>
  )
}
