import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Sparkles, Upload, X, Loader2, CheckCircle2 } from 'lucide-react'
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

type FullData = z.infer<typeof fullSchema>

const statusOptions = [
  { value: 'active', label: 'Ativo' },
  { value: 'lead', label: 'Lead' },
  { value: 'customer', label: 'Cliente' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'unsubscribed', label: 'Descadastrado' },
]

const FULL_FIELDS = ['job_title', 'whatsapp', 'city', 'state', 'linkedin', 'instagram', 'website', 'notes']

// Parse vCard file without AI
function parseVCard(text: string): Partial<FullData> {
  const line = (prefix: string) =>
    text.split('\n').find(l => l.toUpperCase().startsWith(prefix.toUpperCase()))?.split(':').slice(1).join(':').trim().replace(/\r/g, '')

  const fn = line('FN:') || ''
  const [first_name = '', ...rest] = fn.split(' ')
  const last_name = rest.join(' ') || undefined
  const email = text.split('\n').find(l => l.toUpperCase().startsWith('EMAIL'))?.split(':').slice(1).join(':').trim().replace(/\r/g, '')
  const phone = text.split('\n').find(l => l.toUpperCase().startsWith('TEL'))?.split(':').slice(1).join(':').trim().replace(/\r/g, '')
  const company = line('ORG:')?.split(';')[0]
  const job_title = line('TITLE:')
  const website = text.split('\n').find(l => l.toUpperCase().startsWith('URL'))?.split(':').slice(1).join(':').trim().replace(/\r/g, '')
  const linkedin = text.split('\n').find(l => l.toLowerCase().includes('linkedin'))?.split(':').slice(1).join(':').trim().replace(/\r/g, '')
  const adr = text.split('\n').find(l => l.toUpperCase().startsWith('ADR'))?.split(':').slice(1).join(':').split(';') || []
  const city = adr[3]?.trim()
  const state = adr[4]?.trim()
  const country = adr[6]?.trim()

  return { first_name, last_name, email, phone, company, job_title, website, linkedin, city, state, country }
}

// Extract text from PDF using pdfjs-dist
async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((item: any) => item.str).join(' ') + '\n'
  }
  return text
}

// Convert File to base64 (without data: prefix)
function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
  })
}

interface ContactFormProps {
  contact?: Contact | null
  onSave: (data: Partial<Contact>) => Promise<void> | void
  onCancel: () => void
  isSaving?: boolean
  error?: string | null
}

export function ContactForm({ contact, onSave, onCancel, isSaving, error }: ContactFormProps) {
  const [mode, setMode] = useState<'quick' | 'full'>(contact ? 'full' : 'quick')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiFileName, setAiFileName] = useState<string | null>(null)
  const [aiFilledCount, setAiFilledCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const schema = mode === 'quick' ? quickSchema : fullSchema

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FullData>({
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

  const fillFromData = (data: Partial<FullData>) => {
    let count = 0
    const allFields = [
      'first_name', 'last_name', 'email', 'phone', 'company', 'job_title',
      'whatsapp', 'city', 'state', 'country', 'website', 'instagram', 'linkedin', 'notes',
    ] as const
    for (const field of allFields) {
      const val = data[field]
      if (val && String(val).trim()) {
        setValue(field, val as string)
        count++
      }
    }
    setAiFilledCount(count)
    if (FULL_FIELDS.some(f => !!(data as any)[f])) setMode('full')
  }

  const processFile = async (file: File) => {
    setAiFileName(file.name)
    setAiError(null)
    setAiFilledCount(0)
    setAiLoading(true)

    try {
      // vCard — parse client-side, no AI needed
      if (file.name.toLowerCase().endsWith('.vcf')) {
        const text = await file.text()
        fillFromData(parseVCard(text))
        return
      }

      let body: object

      if (file.type.startsWith('image/')) {
        const data = await toBase64(file)
        body = { type: 'image', data, media_type: file.type }
      } else if (file.type === 'application/pdf') {
        const text = await extractPdfText(file)
        body = { type: 'text', data: text }
      } else {
        const text = await file.text()
        body = { type: 'text', data: text }
      }

      const res = await fetch('/.netlify/functions/extract-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao processar arquivo')
      fillFromData(json.contact || {})
    } catch (err: any) {
      setAiError(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const clearAi = () => {
    setAiFileName(null)
    setAiFilledCount(0)
    setAiError(null)
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
              onClick={() => setMode(m)}
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

      {/* AI file upload zone — optional, only on create */}
      {!contact && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={13} className="text-zinc-400" />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Preencher com IA (opcional)</span>
          </div>

          {!aiFileName ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all',
                isDragging
                  ? 'border-zinc-900 bg-zinc-50'
                  : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
              )}
            >
              <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                <Upload size={14} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-700">Arraste ou selecione um arquivo</p>
                <p className="text-xs text-zinc-400 mt-0.5">Cartão de visita (imagem), PDF, .vcf ou .txt</p>
              </div>
            </div>
          ) : (
            <div className={cn(
              'border rounded-xl p-3 flex items-center gap-3',
              aiLoading ? 'border-zinc-200 bg-zinc-50' : aiError ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
            )}>
              {aiLoading ? (
                <Loader2 size={16} className="text-zinc-400 animate-spin shrink-0" />
              ) : aiError ? (
                <AlertCircle size={16} className="text-red-500 shrink-0" />
              ) : (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-700 truncate">{aiFileName}</p>
                <p className={cn('text-xs mt-0.5', aiError ? 'text-red-500' : 'text-zinc-400')}>
                  {aiLoading
                    ? 'Lendo com IA...'
                    : aiError
                      ? aiError
                      : `${aiFilledCount} campo${aiFilledCount !== 1 ? 's' : ''} preenchido${aiFilledCount !== 1 ? 's' : ''} automaticamente`}
                </p>
              </div>
              {!aiLoading && (
                <button type="button" onClick={clearAi} className="text-zinc-400 hover:text-zinc-600 shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.vcf,.txt"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Core fields */}
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
