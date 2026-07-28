import { useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const { props } = usePage()
  const settings = (props as any).settings || {}
  const biz = settings?.business || {}
  const { errors, status } = props as any

  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoggingIn(true)

    router.post('/login', { login, password, remember }, {
      onError: () => setLoggingIn(false),
      onFinish: () => setLoggingIn(false),
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            {biz.business_logo ? (
              <img src={biz.business_logo} alt="" className="h-12 w-auto" />
            ) : (
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">{biz.business_name?.[0] || 'I'}</span>
              </div>
            )}
          </div>
          <CardTitle className="text-xl">{biz.business_name || 'Invenos POS'}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </CardHeader>

        <CardContent className="pt-4">
          {status && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
              {status}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email or Username</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="admin@invenos.com"
                autoFocus
                autoComplete="username"
                className={cn(
                  'w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none transition-colors',
                  'focus:border-ring focus:ring-1 focus:ring-ring/30',
                  errors?.login ? 'border-red-400' : 'border-input'
                )}
              />
              {errors?.login && <p className="text-xs text-red-500 mt-1">{errors.login}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(
                    'w-full h-10 px-3 pr-10 rounded-lg border bg-background text-sm outline-none transition-colors',
                    'focus:border-ring focus:ring-1 focus:ring-ring/30',
                    errors?.password ? 'border-red-400' : 'border-input'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors?.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Remember me
              </label>
            </div>

            <Button type="submit" className="w-full h-10 gap-2" disabled={loggingIn}>
              {loggingIn ? <Loader2 className="size-4 animate-spin" /> : null}
              {loggingIn ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

LoginPage.layout = (page: any) => page