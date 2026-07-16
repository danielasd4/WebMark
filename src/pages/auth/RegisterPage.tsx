import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, Building2, ArrowRight, CheckCircle2 } from 'lucide-react'

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
  full_name: z.string().min(2, 'Nome muito curto'),
  company_name: z.string().min(2, 'Nome da empresa muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

type FormData = z.infer<typeof schema>

const benefits = [
  '14 dias grátis, sem cartão',
  'Importação com IA em minutos',
  'Suporte por e-mail incluído',
]

export function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ full_name, company_name, email, password }: FormData) => {
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, company_name },
        emailRedirectTo: `${window.location.origin}/app/dashboard`,
      },
    })
    if (error) {
      setError(error.message)
      return
    }
    setSuccess(true)
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app/dashboard` },
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-semibold text-zinc-900 mb-2">Confirme seu e-mail</h2>
          <p className="text-zinc-500 mb-6">
            Enviamos um link de confirmação para o seu e-mail. Clique nele para ativar sua conta.
          </p>
          <Link to="/auth/login" className="text-sm font-medium text-zinc-900 hover:underline">
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 flex-col justify-between p-12">
        <Link to="/" className="flex items-center">
          <img src="/Identidade Visual/Group 3.png" alt="WebMark" className="h-8 w-auto brightness-0 invert" />
        </Link>
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold text-white leading-snug">
            Comece a enviar<br />campanhas hoje.
          </h2>
          <div className="space-y-3">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-sm text-zinc-300">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center">
              <img src="/Identidade Visual/Group 3.png" alt="WebMark" className="h-8 w-auto" />
            </Link>
          </div>

          <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Criar conta grátis</h1>
          <p className="text-sm text-zinc-500 mb-8">
            Já tem conta?{' '}
            <Link to="/auth/login" className="text-zinc-900 font-medium hover:underline">
              Entrar
            </Link>
          </p>

          <button
            onClick={handleGoogleLogin}
            className="w-full h-10 flex items-center justify-center gap-2 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors mb-6"
          >
            <GoogleIcon />
            Continuar com Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-zinc-100" />
            <span className="text-xs text-zinc-400">ou</span>
            <div className="flex-1 h-px bg-zinc-100" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nome completo"
              placeholder="João Silva"
              icon={<User size={14} />}
              error={errors.full_name?.message}
              {...register('full_name')}
            />
            <Input
              label="Nome da empresa"
              placeholder="Minha Empresa Ltda"
              icon={<Building2 size={14} />}
              error={errors.company_name?.message}
              {...register('company_name')}
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="voce@empresa.com"
              icon={<Mail size={14} />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={14} />}
              error={errors.password?.message}
              {...register('password')}
            />

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
              Criar conta grátis
              <ArrowRight size={16} />
            </Button>

            <p className="text-xs text-zinc-400 text-center">
              Ao criar uma conta, você concorda com nossos{' '}
              <Link to="/terms" className="underline">Termos</Link> e{' '}
              <Link to="/privacy" className="underline">Política de Privacidade</Link>.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
