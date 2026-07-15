import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ email }: { email: string }) => {
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) { setError(error.message); return }
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link to="/auth/login" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-8">
          <ArrowLeft size={16} />
          Voltar ao login
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-semibold text-zinc-900 mb-2">E-mail enviado!</h2>
            <p className="text-zinc-500">Verifique sua caixa de entrada e clique no link para redefinir sua senha.</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center mb-4">
                <Mail size={20} className="text-zinc-600" />
              </div>
              <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Esqueceu a senha?</h1>
              <p className="text-sm text-zinc-500">Informe seu e-mail e enviaremos um link de redefinição.</p>
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
                Enviar link de redefinição
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
