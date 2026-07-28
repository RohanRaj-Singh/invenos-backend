import { useState } from 'react'
import { Printer, Share2, ChevronDown, ExternalLink, MessageCircle, FileDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface DocumentActionsProps {
  title: string
  invoiceNumber: string
  partyName: string
  total: number
  outstanding: number
  currency?: string
}

/** Toolbar above the invoice paper — Print button + Share dropdown */
export default function DocumentActions({
  title, invoiceNumber, partyName, total, outstanding, currency = 'Rs.',
}: DocumentActionsProps) {
  const [shareOpen, setShareOpen] = useState(false)

  const whatsappMessage = encodeURIComponent(
    `*${title}*\n\n` +
    `Invoice: ${invoiceNumber}\n` +
    `Party: ${partyName}\n` +
    `Total: ${currency} ${total.toLocaleString()}` +
    (outstanding > 0 ? `\nOutstanding: ${currency} ${outstanding.toLocaleString()}` : '') +
    `\n\nThank you for your business.`
  )

  const shareActions = [
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      primary: true,
      onClick: () => {
        window.open(`https://wa.me/?text=${whatsappMessage}`, '_blank')
        setShareOpen(false)
      },
    },
    {
      label: 'Copy Link',
      icon: ExternalLink,
      onClick: () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard')
        setShareOpen(false)
      },
    },
    {
      label: 'Download PDF (coming soon)',
      icon: FileDown,
      disabled: true,
      onClick: () => {
        toast.info('PDF export coming soon')
        setShareOpen(false)
      },
    },
  ]

  return (
    <div className="no-print bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
      <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-1.5 text-gray-600 hover:text-gray-900">
        <X className="size-4" />
        <span className="hidden sm:inline">Close</span>
      </Button>

      <div className="flex items-center gap-2">
        {/* Print */}
        <Button onClick={() => window.print()} className="gap-2 shadow-sm">
          <Printer className="size-4" />
          <span className="hidden sm:inline">Print</span>
        </Button>

        {/* Share dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShareOpen(!shareOpen)}
            className="gap-2"
          >
            <Share2 className="size-4" />
            <span className="hidden sm:inline">Share</span>
            <ChevronDown className="size-3.5 text-gray-400" />
          </Button>

          {shareOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShareOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                {shareActions.map((action, i) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={i}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors',
                        action.disabled
                          ? 'text-gray-300 cursor-not-allowed'
                          : action.primary
                            ? 'text-emerald-700 hover:bg-emerald-50 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{action.label}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
