import { useState, useCallback, useEffect } from 'react'
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageViewerProps {
  images: { id: number | string; url: string; name?: string }[]
  initialIndex?: number
  open: boolean
  onClose: () => void
}

export default function ImageViewer({ images, initialIndex = 0, open, onClose }: ImageViewerProps) {
  const [index, setIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    setIndex(initialIndex)
    setZoom(1)
  }, [initialIndex, open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goBack()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(5, z + 0.25))
      if (e.key === '-') setZoom(z => Math.max(0.25, z - 0.25))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, index, images.length])

  const goBack = useCallback(() => setIndex(i => Math.max(0, i - 1)), [])
  const goNext = useCallback(() => setIndex(i => Math.min(images.length - 1, i + 1)), [images.length])

  if (!open || images.length === 0) return null

  const current = images[index]

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col" onClick={onClose}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 text-white/80 shrink-0">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm hover:text-white transition-colors">
          <X className="size-5" />
          Close
        </button>
        <div className="text-sm">
          {index + 1} / {images.length}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(0.25, z - 0.25)) }}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"><ZoomOut className="size-4" /></button>
          <span className="text-xs w-8 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(5, z + 0.25)) }}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"><ZoomIn className="size-4" /></button>
          <a href={current.url} download={current.name || 'image'} target="_blank" rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"><Download className="size-4" /></a>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center min-h-0 p-4" onClick={(e) => e.stopPropagation()}>
        {images.length > 1 && index > 0 && (
          <button onClick={(e) => { e.stopPropagation(); goBack() }}
            className="absolute left-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <ChevronLeft className="size-6" />
          </button>
        )}
        <img
          src={current.url}
          alt={current.name || 'Prescription image'}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        />
        {images.length > 1 && index < images.length - 1 && (
          <button onClick={(e) => { e.stopPropagation(); goNext() }}
            className="absolute right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 p-3 shrink-0 overflow-x-auto">
          {images.map((img, i) => (
            <button key={img.id} onClick={(e) => { e.stopPropagation(); setIndex(i) }}
              className={cn(
                'size-12 rounded-lg overflow-hidden border-2 transition-all shrink-0',
                i === index ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
              )}>
              <img src={img.url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
