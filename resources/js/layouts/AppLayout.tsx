import { useState, useEffect, type ReactNode } from 'react'
import { Head, usePage } from '@inertiajs/react'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children?: ReactNode
  title?: string
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  const { props } = usePage()
  const flash = (props as any)?.flash || {}

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  // Show flash messages as toasts when they arrive from the server
  useEffect(() => {
    if (flash.success) {
      import('sonner').then(({ toast }) => toast.success(flash.success))
    }
    if (flash.error) {
      import('sonner').then(({ toast }) => toast.error(flash.error))
    }
  }, [flash])

  return (
    <>
      <Head title={title ?? 'Invenos'} />

      <div className="flex h-screen overflow-hidden bg-background">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile sidebar drawer */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-background border-r border-border transform transition-transform duration-200 ease-in-out md:hidden',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <Sidebar mobile onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main area */}
        <div className="flex flex-col flex-1 min-w-0">
          <Header
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            dark={dark}
            onToggleDark={() => setDark(!dark)}
          />

          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Bottom navigation (mobile only) */}
        <BottomNav />
      </div>
    </>
  )
}
