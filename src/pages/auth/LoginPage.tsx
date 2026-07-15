import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, ArrowRight } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ email, password }: FormData) => {
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('E-mail ou senha incorretos.')
      return
    }
    navigate('/app/dashboard')
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app/dashboard` },
    })
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Mail size={16} className="text-zinc-900" />
          </div>
          <span className="font-semibold text-white">WebMark</span>
        </Link>
        <div>
          <p className="text-2xl font-semibold text-white leading-snug mb-4">
            "Importei minha lista inteira em 5 minutos e já mandei minha primeira campanha."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center text-white font-semibold">
              AB
            </div>
            <div>
              <p className="text-sm font-medium text-white">Ana Beatriz Silva</p>
              <p className="text-sm text-zinc-400">CEO, Moda Sustentável</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                <Mail size={16} className="text-white" />
              </div>
              <span className="font-semibold text-zinc-900">WebMark</span>
            </Link>
          </div>

          <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Boas-vindas de volta</h1>
          <p className="text-sm text-zinc-500 mb-8">
            Não tem conta?{' '}
            <Link to="/auth/register" className="text-zinc-900 font-medium hover:underline">
              Criar grátis
            </Link>
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full h-10 flex items-center justify-center gap-2 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors mb-6"
          >
            <GoogleIcon />
            Entrar com Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-zinc-100" />
            <span className="text-xs text-zinc-400">ou</span>
            <div className="flex-1 h-px bg-zinc-100" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="voce@empresa.com"
              icon={<Mail size={14} />}
              error={errors.email?.message}
              {...register('email')}
            />
            <div>
              <Input
                label="Senha"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={14} />}
                error={errors.password?.message}
                {...register('password')}
              />
              <div className="flex justify-end mt-1.5">
                <Link to="/auth/forgot-password" className="text-xs text-zinc-500 hover:text-zinc-900">
                  Esqueci a senha
                </Link>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
              Entrar
              <ArrowRight size={16} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
