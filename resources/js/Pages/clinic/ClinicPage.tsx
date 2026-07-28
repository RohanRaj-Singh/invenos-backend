import { useState, useMemo } from 'react'
import { router, usePage } from '@inertiajs/react'
import {
  Stethoscope, ArrowRight, Phone, Calendar, Users, Search, Plus, X, User
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BackendPatient {
  id: number
  name: string
  phone: string
  address: string | null
  created_at: string
  consultations_count?: number
}

export default function ClinicPage() {
  const { props } = usePage()
  const patients = (props as any).patients || []
  const statsRaw = (props as any).stats || {}
  const filters = (props as any).filters || {}

  const [search, setSearch] = useState(filters.search || '')
  const [showAddDialog, setShowAddDialog] = useState(false)

  // New patient form state
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formAddress, setFormAddress] = useState('')

  const filteredPatients = useMemo(() => {
    if (!search.trim()) return patients
    const q = search.toLowerCase()
    return patients.filter((p: BackendPatient) =>
      p.name.toLowerCase().includes(q) || p.phone.includes(q)
    )
  }, [search, patients])

  const handleAddPatient = () => {
    if (!formName.trim() || !formPhone.trim()) {
      toast.error('Please fill in name and phone')
      return
    }
    router.post('/contacts', {
      name: formName.trim(),
      phone: formPhone.trim(),
      address: formAddress.trim(),
      roles: ['patient', 'customer'],
      type: 'person',
      _redirect_url: '/clinic',
    }, {
      preserveState: true,
      onSuccess: () => {
        toast.success(`${formName.trim()} registered as patient`)
        setShowAddDialog(false)
        setFormName(''); setFormPhone(''); setFormAddress('')
        router.reload()
      },
      onError: (errs) => {
        const msg = Object.values(errs).join(', ')
        toast.error(msg || 'Failed to register patient')
      },
    })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Stethoscope className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Clinic Module
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage patient records, visits, and prescriptions.
          </p>
        </div>
        <Button size="sm" className="gap-1.5 shadow-sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">New Patient</span>
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input type="text" placeholder="Search patients by name or phone..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-9 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors" />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <Card size="sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary mb-1"><Users className="size-4" /></div>
            <div className="text-xl font-bold">{statsRaw.total_patients ?? patients.length}</div>
            <div className="text-xs text-muted-foreground">Total Patients</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-500 mb-1"><Calendar className="size-4" /></div>
            <div className="text-xl font-bold">{statsRaw.this_week_visits ?? 0}</div>
            <div className="text-xs text-muted-foreground">This Week</div>
          </CardContent>
        </Card>
      </div>

      {/* Patient grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-sm text-muted-foreground">
            <Users className="size-12 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-foreground mb-1">No patients found</p>
            <p className="text-xs mb-4">Try a different search term.</p>
            <Button variant="outline" size="sm" onClick={() => setSearch('')}>Clear Search</Button>
          </div>
        ) : (
          filteredPatients.map((patient: BackendPatient) => {
            const initials = patient.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
            return (
              <button key={patient.id} onClick={() => router.visit(`/clinic/patient/${patient.id}`)}
                className="group text-left">
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.98]">
                  <CardContent className="p-0">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-base font-bold text-primary">
                          {initials}
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors mt-1" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">{patient.name}</h3>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="size-3" />
                          <span>{patient.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="size-3" />
                          <span>Registered {patient.created_at?.split('T')[0] || '—'}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          {(patient as any).consultations_count || 0} visits
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                          View Profile
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            )
          })
        )}
      </div>

      {/* New Patient Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(v) => { if (!v) setShowAddDialog(false) }}>
        <DialogContent className="sm:max-w-md gap-0 p-0">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle className="text-base">Register New Patient</DialogTitle>
          </DialogHeader>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Full Name <span className="text-red-500">*</span></label>
              <input type="text" placeholder="e.g. Muhammad Ali" value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Phone <span className="text-red-500">*</span></label>
              <input type="text" placeholder="0300-1234567" value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Address</label>
              <input type="text" placeholder="e.g. Lahore" value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30" />
            </div>
            <Button onClick={handleAddPatient} size="lg" className="w-full h-11 gap-1.5 shadow-sm">
              <User className="size-4" /> Register Patient
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
