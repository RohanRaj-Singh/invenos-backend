import { useState, useRef, useEffect } from 'react'
import { Printer, Download, Share2, ChevronDown, FileSpreadsheet, FileText, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ReportToolbarProps {
  onPrint?: () => void
  onRefresh?: () => void
  csvExportUrl?: string
  excelExportUrl?: string
  pdfExportUrl?: string
  shareUrl?: string           // Base URL for share endpoint, e.g. "/reports/share/day-book"
  reportTitle?: string        // Title shown in share dialog
  currentFilters?: Record<string, string>  // Current filter params to pass to share
}

export function ReportToolbar({
  onPrint, onRefresh, csvExportUrl, excelExportUrl, pdfExportUrl,
  shareUrl, reportTitle, currentFilters,
}: ReportToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [sharing, setSharing] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)
  const shareRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const buildShareUrl = (format: string) => {
    if (!shareUrl) return '#'
    const params = new URLSearchParams(currentFilters || {})
    params.set('format', format)
    return `${shareUrl}?${params.toString()}`
  }

  const handleShare = async () => {
    if (!shareUrl) {
      toast.info('Share not available for this report')
      return
    }

    // Check Web Share API support
    if (!navigator.share || !navigator.canShare) {
      // Fallback: download PDF
      window.open(buildShareUrl('pdf'), '_blank')
      toast.success('PDF downloaded')
      return
    }

    setSharing(true)
    try {
      // Fetch the PDF
      const response = await fetch(buildShareUrl('share'))
      const data = await response.json()

      // Fetch the file content
      const pdfResponse = await fetch(data.url)
      const blob = await pdfResponse.blob()
      const file = new File([blob], data.filename, { type: 'application/pdf' })

      // Try native share
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: reportTitle || 'Report',
          text: reportTitle || 'Report from Invenos',
          files: [file],
        })
      } else {
        // Files not supported — try sharing as text with URL
        await navigator.share({
          title: reportTitle || 'Report',
          text: `${reportTitle || 'Report'} — ${buildShareUrl('pdf')}`,
          url: buildShareUrl('pdf'),
        })
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        // User cancelled — not an error
        toast.error('Share failed. Try downloading instead.')
        window.open(buildShareUrl('pdf'), '_blank')
      }
    } finally {
      setSharing(false)
      setShareOpen(false)
    }
  }

  const handlePrint = onPrint || (() => window.print())
  const handleRefresh = onRefresh || (() => window.location.reload())

  return (
    <div className="flex items-center gap-1">
      {/* Print */}
      <button onClick={handlePrint}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
        title="Print">
        <Printer className="size-3.5" />
        <span className="hidden sm:inline">Print</span>
      </button>

      {/* Export dropdown */}
      <div className="relative" ref={exportRef}>
        <button onClick={() => setExportOpen(!exportOpen)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors cursor-pointer">
          <Download className="size-3.5" />
          <span className="hidden sm:inline">Export</span>
          <ChevronDown className="size-3" />
        </button>
        {exportOpen && (
          <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-border bg-card shadow-lg z-50 py-1">
            {csvExportUrl && (
              <a href={csvExportUrl}
                className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors">
                <FileSpreadsheet className="size-3.5 text-emerald-600" />
                CSV
              </a>
            )}
            {excelExportUrl && (
              <a href={excelExportUrl}
                className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors">
                <FileSpreadsheet className="size-3.5 text-blue-600" />
                Excel
              </a>
            )}
            {pdfExportUrl && (
              <a href={pdfExportUrl} target="_blank" rel="noopener"
                className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors">
                <FileText className="size-3.5 text-red-500" />
                PDF
              </a>
            )}
            {!csvExportUrl && !excelExportUrl && !pdfExportUrl && (
              <div className="px-3 py-2 text-xs text-muted-foreground">No export options</div>
            )}
          </div>
        )}
      </div>

      {/* Share dropdown */}
      <div className="relative" ref={shareRef}>
        <button onClick={() => setShareOpen(!shareOpen)} disabled={sharing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors cursor-pointer disabled:opacity-50">
          {sharing ? <Loader2 className="size-3.5 animate-spin" /> : <Share2 className="size-3.5" />}
          <span className="hidden sm:inline">Share</span>
          <ChevronDown className="size-3" />
        </button>
        {shareOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-border bg-card shadow-lg z-50 py-1">
            <button onClick={handleShare}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors text-left">
              <Share2 className="size-3.5 text-primary" />
              Share via...
              <span className="text-[9px] text-muted-foreground ml-auto">PDF</span>
            </button>
            <a href={buildShareUrl('pdf')} target="_blank" rel="noopener"
              className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors">
              <Download className="size-3.5" />
              Download PDF
            </a>
            {shareUrl && (
              <a href={buildShareUrl('pdf')} target="_blank" rel="noopener"
                className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors">
                <Printer className="size-3.5" />
                Print PDF
              </a>
            )}
          </div>
        )}
      </div>

      {/* Refresh */}
      <button onClick={handleRefresh}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
        title="Refresh">
        <RefreshCw className="size-3.5" />
      </button>
    </div>
  )
}