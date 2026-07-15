import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import { cn } from '../../lib/utils'
import type { Contact } from '../../types'

const quickSchema = z.object({
  first_name: z.string().min(1, 'Nome é obrigatório'),
  last_name: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(['active', 'inactive', 'lead', 'customer', 'unsubscribed']).default('active'),
})

const fullSchema = quickSchema.extend({
  whatsapp: z.string().optional(),
  job_title: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('Brasil'),
  website: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
})

type QuickData = z.infer<typeof quickSchema>
type FullData = z.infer<typeof fullSchema>

const statusOptions = [
  { value: 'active', label: 'Ativo' },
  { value: 'lead', label: 'Lead' },
  { value: 'customer', label: 'Cliente' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'unsubscribed', label: 'Descadastrado' },
]

interface ContactFormProps {
  contact?: Contact | null
  onSave: (data: Partial<Contact>) => Promise<void> | void
  onCancel: () => void
  isSaving?: boolean
  error?: string | null
}

export function ContactForm({ contact, onSave, onCancel, isSaving, error }: ContactFormProps) {
  const [mode, setMode] = useState<'quick' | 'full'>(contact ? 'full' : 'quick')

  const schema = mode === 'quick' ? quickSchema : fullSchema

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<FullData>({
    resolver: zodResolver(schema),
    defaultValues: contact ? {
      first_name: contact.first_name,
      last_name: contact.last_name ?? '',
      email: contact.email,
      phone: contact.phone ?? '',
      whatsapp: contact.whatsapp ?? '',
      company: contact.company ?? '',
      job_title: contact.job_title ?? '',
      city: contact.city ?? '',
      state: contact.state ?? '',
      country: contact.country || 'Brasil',
      website: contact.website ?? '',
      instagram: contact.instagram ?? '',
      linkedin: contact.linkedin ?? '',
      status: contact.status,
      source: contact.source ?? '',
      notes: contact.notes ?? '',
    } : { country: 'Brasil', status: 'active' },
  })

  const loading = isSubmitting || isSaving

  const handleModeSwitch = (next: 'quick' | 'full') => {
    setMode(next)
  }

  return (
    <form onSubmit={handleSubmit(onSave as any)} className="space-y-5">
      {/* Mode tabs — only shown when creating */}
      {!contact && (
        <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl w-fit">
          {(['quick', 'full'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeSwitch(m)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
                mode === m ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              )}
            >
              {m === 'quick' ? 'Rápido' : 'Completo'}
            </button>
          ))}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Core fields — always shown */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nome *"
          placeholder="João"
          error={errors.first_name?.message}
          {...register('first_name')}
        />
        <Input label="Sobrenome" placeholder="Silva" {...register('last_name')} />
      </div>
      <Input
        label="E-mail *"
        type="email"
        placeholder="joao@empresa.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Telefone" placeholder="(11) 99999-0000" {...register('phone')} />
        <Input label="Empresa" placeholder="Minha Empresa" {...register('company')} />
      </div>
      <Select label="Status" options={statusOptions} {...register('status')} />

      {/* Full mode extras */}
      {mode === 'full' && (
        <>
          <div className="border-t border-zinc-100 pt-4">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-4">Informações adicionais</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="WhatsApp" placeholder="(11) 99999-0000" {...register('whatsapp')} />
                <Input label="Cargo" placeholder="CEO" {...register('job_title')} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Cidade" placeholder="São Paulo" {...register('city')} />
                <Input label="Estado" placeholder="SP" {...register('state')} />
                <Input label="País" placeholder="Brasil" {...register('country')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Website" placeholder="https://..." {...register('website')} />
                <Input label="Instagram" placeholder="@usuario" {...register('instagram')} />
              </div>
              <Input label="LinkedIn" placeholder="linkedin.com/in/..." {...register('linkedin')} />
              <Input label="Origem" placeholder="Ex: Indicação, Website..." {...register('source')} />
              <Textarea label="Observações" placeholder="Anotações sobre este contato..." rows={3} {...register('notes')} />
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-zinc-100">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {contact ? 'Salvar alterações' : 'Criar contato'}
        </Button>
      </div>
    </form>
  )
}
