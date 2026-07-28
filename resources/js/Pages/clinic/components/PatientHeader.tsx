import { Phone, MapPin, Calendar, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PatientHeaderProps {
  patient: any
  visitCount: number
}

export default function PatientHeader({ patient, visitCount }: PatientHeaderProps) {
  const initials = patient.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)

  const regDate = patient.created_at
    ? new Date(patient.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
    : patient.registrationDate || '—'

  return (
    <Card className="overflow-hidden">
      <div className="h-20 sm:h-24 bg-gradient-to-r from-primary/80 to-primary/40" />
      <CardContent className="p-0">
        <div className="px-5 pb-5">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="size-16 sm:size-20 rounded-xl bg-background ring-4 ring-background flex items-center justify-center text-xl sm:text-2xl font-bold text-primary shadow-sm">
              {initials}
            </div>
            <div className="pt-2">
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
                {patient.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[11px] px-2 py-0 h-5 font-normal">
                  <User className="size-2.5 mr-1" />
                  Patient
                </Badge>
                <Badge variant="secondary" className="text-[11px] px-2 py-0 h-5 font-normal">
                  {visitCount} visits
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2.5 text-sm">
              <div className="flex items-center justify-center size-8 rounded-lg bg-muted shrink-0">
                <Phone className="size-3.5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Phone</div>
                <div className="font-medium">{patient.phone}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <div className="flex items-center justify-center size-8 rounded-lg bg-muted shrink-0">
                <MapPin className="size-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Address</div>
                <div className="font-medium truncate">{patient.address || '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <div className="flex items-center justify-center size-8 rounded-lg bg-muted shrink-0">
                <Calendar className="size-3.5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Registered</div>
                <div className="font-medium">{regDate}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
