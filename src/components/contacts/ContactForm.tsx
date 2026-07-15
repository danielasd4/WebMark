import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import type { Contact } from '../../types'

const schema = z.object({
  first_name: z.string().min(1, 'Nome é obrigatório'),
  last_name: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  company: z.string().optional(),
  job_title: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('Brasil'),
  website: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  status: z.enum(['active', 'inactive', 'lead', 'customer', 'unsubscribed']).default('active'),
  source: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ContactFormProps {
  contact?: Contact | null
  onSave: (data: FormData) => Promise<void> | void
  onCancel: () => void
  isSaving?: boolean
}

const statusOptions = [
  { value: 'active', label: 'Ativo' },
  { value: 'lead', label: 'Lead' },
  { value: 'customer', label: 'Cliente' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'unsubscribed', label: 'Descadastrado' },
]

export function ContactForm({ contact, onSave, onCancel, isSaving }: ContactFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: contact ? {
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      whatsapp: contact.whatsapp,
      company: contact.company,
      job_title: contact.job_title,
      city: contact.city,
      state: contact.state,
      country: contact.country || 'Brasil',
      website: contact.website,
      instagram: contact.instagram,
      linkedin: contact.linkedin,
      status: contact.status,
      source: contact.source,
      notes: contact.notes,
    } : { country: 'Brasil', status: 'active' },
  })

  const loading = isSubmitting || isSaving

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nome *" placeholder="João" error={errors.first_name?.message} {...register('first_name')} />
        <Input label="Sobrenome" placeholder="Silva" {...register('last_name')} />
      </div>
      <Input label="E-mail *" type="email" placeholder="joao@empresa.com" error={errors.email?.message} {...register('email')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Telefone" placeholder="(11) 99999-0000" {...register('phone')} />
        <Input label="WhatsApp" placeholder="(11) 99999-0000" {...register('whatsapp')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Empresa" placeholder="Minha Empresa Ltda" {...register('company')} />
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
      <div className="grid grid-cols-2 gap-4">
        <Select label="Status" options={statusOptions} {...register('status')} />
        <Input label="Origem" placeholder="Ex: Indicação, Website..." {...register('source')} />
      </div>
      <Textarea label="Observações" placeholder="Anotações sobre este contato..." rows={3} {...register('notes')} />

      <div className="flex gap-3 pt-2">
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
