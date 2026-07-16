import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import {
  ArrowLeft, ArrowRight, Send, Calendar, Sparkles,
  CheckCircle2, Users, Loader2, Mail,
  Search, X, UserCheck, Filter, List, Upload, Code2, Eye
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { EmailEditor } from '../../components/email/EmailEditor'
import { useLists } from '../../hooks/useLists'
import { useCreateCampaign, useUpdateCampaign } from '../../hooks/useCampaigns'
import { useOrganization } from '../../hooks/useOrganization'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import type { ContactStatus } from '../../types'

const steps = ['Configurações', 'Conteúdo', 'Destinatários', 'Revisão']

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  subject: z.string().min(1, 'Assunto é obrigatório'),
  from_name: z.string().min(1, 'Nome do remetente é obrigatório'),
  from_email: z.string().email('E-mail inválido'),
})

type FormData = z.infer<typeof schema>

export function NewCampaignPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  // Content design fields
  const [emailTitle, setEmailTitle] = useState('')
  const [emailSubtitle, setEmailSubtitle] = useState('')
  const [emailText, setEmailText] = useState('')
  const [emailLogoPreview, setEmailLogoPreview] = useState('')
  const [emailLogoBase64, setEmailLogoBase64] = useState('')
  const [emailLogoFormat, setEmailLogoFormat] = useState<'png' | 'jpeg'>('png')
  const [useHtml, setUseHtml] = useState(false)
  const [contentHtml, setContentHtml] = useState('')
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Recipients
  const [recipientMode, setRecipientMode] = useState<'all' | 'filter' | 'list' | 'individual'>('all')
  const [filterStatuses, setFilterStatuses] = useState<ContactStatus[]>([])
  const [selectedLists, setSelectedLists] = useState<string[]>([])
  const [selectedContacts, setSelectedContacts] = useState<{ id: string; first_name: string; last_name?: string; email: string }[]>([])
  const [contactSearch, setContactSearch] = useState('')

  // Send options
  const [sendMode, setSendMode] = useState<'now' | 'schedule' | 'draft'>('draft')
  const [scheduledAt, setScheduledAt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)

  const { user } = useAuth()
  const { data: org } = useOrganization()
  const { data: lists = [], isLoading: listsLoading } = useLists()
  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign()

  const { data: totalContacts = 0 } = useQuery({
    queryKey: ['contacts-count', org?.id],
    queryFn: async () => {
      if (!org) return 0
      const { count } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id)
      return count ?? 0
    },
    enabled: !!org,
  })

  const { data: filteredCount = 0 } = useQuery({
    queryKey: ['contacts-count-filter', org?.id, filterStatuses],
    queryFn: async () => {
      if (!org || filterStatuses.length === 0) return 0
      const { count } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .in('status', filterStatuses)
        .neq('status', 'unsubscribed')
      return count ?? 0
    },
    enabled: !!org && recipientMode === 'filter',
  })

  const { data: searchedContacts = [] } = useQuery({
    queryKey: ['contacts-search', org?.id, contactSearch],
    queryFn: async () => {
      if (!org || !contactSearch.trim()) return []
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, status')
        .eq('organization_id', org.id)
        .neq('status', 'unsubscribed')
        .or(`first_name.ilike.%${contactSearch}%,last_name.ilike.%${contactSearch}%,email.ilike.%${contactSearch}%`)
        .limit(20)
      if (error) throw error
      return data || []
    },
    enabled: !!org && recipientMode === 'individual' && contactSearch.trim().length > 0,
  })

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { from_name: '', from_email: '' },
  })

  useEffect(() => {
    if (org?.name) {
      const cur = getValues('from_name')
      if (!cur) setValue('from_name', org.name)
    }
    if (user?.email) {
      const cur = getValues('from_email')
      if (!cur) setValue('from_email', user.email)
    }
  }, [org?.name, user?.email])

  const subject = watch('subject') ?? ''

  const generateSubjectWithAI = () => {
    setAiLoading(true)
    setTimeout(() => {
      setValue('subject', '🔥 Novidades exclusivas para você. Não perca!')
      setAiLoading(false)
    }, 1200)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEmailLogoPreview(URL.createObjectURL(file))
    const reader = new FileReader()
    reader.onload = (ev) => setEmailLogoBase64(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const generateEmailHtml = () => {
    if (useHtml) return contentHtml
    return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    ${emailLogoBase64 ? `<div style="background:#fafafa;padding:24px;text-align:center;border-bottom:1px solid #f0f0f0;"><img src="${emailLogoBase64}" style="max-height:64px;max-width:200px;object-fit:contain;" /></div>` : ''}
    <div style="padding:32px;">
      ${emailTitle ? `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#18181b;">${emailTitle}</h1>` : ''}
      ${emailSubtitle ? `<p style="margin:0 0 20px;font-size:16px;color:#71717a;font-weight:500;">${emailSubtitle}</p>` : ''}
      ${emailText ? `<div style="font-size:15px;line-height:1.7;color:#3f3f46;">${emailText.replace(/\n/g, '<br/>')}</div>` : ''}
    </div>
  </div>
</body>
</html>`
  }

  const toggleList = (id: string) =>
    setSelectedLists(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const toggleFilterStatus = (s: ContactStatus) =>
    setFilterStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const toggleContact = (c: { id: string; first_name: string; last_name?: string; email: string }) =>
    setSelectedContacts(prev => prev.some(x => x.id === c.id) ? prev.filter(x => x.id !== c.id) : [...prev, c])

  const handleFinish = async (asDraft = false) => {
    const values = getValues()
    const status = asDraft ? 'draft' : sendMode === 'now' ? 'sending' : 'scheduled'

    try {
      setFinishError(null)
      const recipientJson =
        recipientMode === 'all' ? { send_to_all: true }
        : recipientMode === 'filter' ? { filter_statuses: filterStatuses }
        : recipientMode === 'individual' ? { contact_ids: selectedContacts.map(c => c.id) }
        : undefined

      const campaign = await createCampaign.mutateAsync({
        ...values,
        content_html: generateEmailHtml(),
        content_json: recipientJson,
        status,
        list_ids: recipientMode === 'list' ? selectedLists : [],
        scheduled_at: sendMode === 'schedule' && scheduledAt ? scheduledAt : undefined,
      })

      if (status === 'sending' && campaign?.id) {
        if (import.meta.env.DEV) {
          await updateCampaign.mutateAsync({ id: campaign.id, values: { status: 'draft' } })
          setFinishError('Campanha salva como rascunho. O envio de e-mails só funciona no ambiente publicado (Netlify). Faça deploy para testar o envio real.')
          return
        }
        try {
          const res = await fetch('/.netlify/functions/send-campaign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaign_id: campaign.id }),
          })
          if (!res.ok) {
            const rawText = await res.text().catch(() => '')
            let errorMsg = ''
            try {
              const body = JSON.parse(rawText)
              errorMsg = body.error || ''
            } catch {
              errorMsg = rawText.slice(0, 200)
            }
            if (!errorMsg) errorMsg = `HTTP ${res.status}`
            await updateCampaign.mutateAsync({ id: campaign.id, values: { status: 'draft' } })
            setFinishError(`Campanha salva como rascunho. Erro no envio: ${errorMsg}`)
            return
          }
        } catch (err: any) {
          await updateCampaign.mutateAsync({ id: campaign.id, values: { status: 'draft' } })
          setFinishError(`Campanha salva como rascunho. Erro de conexão: ${err?.message || 'Verifique as configurações do Netlify.'}`)
          return
        }
      }

      navigate('/app/campaigns')
    } catch (err: any) {
      setFinishError(err?.message ?? 'Erro ao criar campanha. Tente novamente.')
    }
  }

  const recipientCount =
    recipientMode === 'all' ? totalContacts
    : recipientMode === 'filter' ? filteredCount
    : recipientMode === 'individual' ? selectedContacts.length
    : lists.filter(l => selectedLists.includes(l.id)).reduce((acc, l) => acc + (l.contact_count ?? 0), 0)

  const canProceedFromStep2 =
    recipientMode === 'all' ||
    (recipientMode === 'filter' && filterStatuses.length > 0) ||
    (recipientMode === 'list' && selectedLists.length > 0) ||
    (recipientMode === 'individual' && selectedContacts.length > 0)

  const hasContent = emailTitle || emailSubtitle || emailText || emailLogoBase64 || contentHtml

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/app/campaigns')}
          className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Nova campanha</h1>
          <p className="text-sm text-zinc-400">Passo {step + 1} de {steps.length}: {steps[step]}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? 'bg-zinc-900' : 'bg-zinc-100'}`}
          />
        ))}
      </div>

      {/* Step 0: Settings */}
      {step === 0 && (
        <form className="space-y-6 bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs">
          <h2 className="font-semibold text-zinc-900">Configurações da campanha</h2>
          <div className="space-y-4">
            <Input
              label="Sobre o que é esta campanha? *"
              placeholder="Ex: Promoção de verão, Newsletter de agosto..."
              error={errors.name?.message}
              {...register('name')}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Assunto do e-mail *</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    placeholder="Ex: Novidades que você não pode perder..."
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    {...register('subject')}
                  />
                  {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={aiLoading}
                  icon={<Sparkles size={13} />}
                  onClick={generateSubjectWithAI}
                >
                  IA
                </Button>
              </div>
              <p className="text-xs text-zinc-400">{subject.length}/150 caracteres</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Nome do remetente *" error={errors.from_name?.message} {...register('from_name')} />
              <Input label="E-mail do remetente *" type="email" placeholder="contato@suaempresa.com" error={errors.from_email?.message} {...register('from_email')} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSubmit(() => setStep(1))}
              icon={<ArrowRight size={14} />}
            >
              Próximo: Conteúdo
            </Button>
          </div>
        </form>
      )}

      {/* Step 1: Content */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs space-y-5">
            {/* Mode toggle */}
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-900">Conteúdo do e-mail</h2>
              <button
                type="button"
                onClick={() => setUseHtml(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  useHtml ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <Code2 size={12} />
                HTML
              </button>
            </div>

            {!useHtml ? (
              <div className="space-y-4">
                {/* Logo */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Logo</label>
                  <div className="flex items-center gap-3">
                    {emailLogoPreview ? (
                      <div className="relative w-16 h-16 rounded-lg border border-zinc-200 overflow-hidden bg-zinc-50 flex items-center justify-center">
                        <img src={emailLogoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => { setEmailLogoPreview(''); setEmailLogoBase64(''); if (logoInputRef.current) logoInputRef.current.value = '' }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-zinc-900 text-white rounded-full flex items-center justify-center hover:bg-zinc-700"
                        >
                          <X size={9} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="w-16 h-16 rounded-lg border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-1 hover:border-zinc-400 transition-colors text-zinc-400 hover:text-zinc-600"
                      >
                        <Upload size={16} />
                        <span className="text-xs">Upload</span>
                      </button>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      className="hidden"
                      accept={emailLogoFormat === 'png' ? 'image/png' : 'image/jpeg'}
                      onChange={handleLogoChange}
                    />
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500">Formato</p>
                      <div className="flex gap-2">
                        {(['png', 'jpeg'] as const).map(fmt => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => setEmailLogoFormat(fmt)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                              emailLogoFormat === fmt ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                            }`}
                          >
                            {fmt.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">Título</label>
                  <input
                    value={emailTitle}
                    onChange={e => setEmailTitle(e.target.value)}
                    placeholder="Ex: Novidades da semana"
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  />
                </div>

                {/* Subtitle */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">Subtítulo</label>
                  <input
                    value={emailSubtitle}
                    onChange={e => setEmailSubtitle(e.target.value)}
                    placeholder="Ex: Confira o que preparamos para você este mês"
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  />
                </div>

                {/* Body text */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">Texto</label>
                  <textarea
                    value={emailText}
                    onChange={e => setEmailText(e.target.value)}
                    placeholder="Escreva o conteúdo principal do e-mail..."
                    rows={5}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            ) : (
              <EmailEditor onChange={setContentHtml} />
            )}
          </div>

          {/* Live Preview */}
          {(hasContent) && (
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-zinc-400" />
                <h3 className="text-sm font-semibold text-zinc-900">Preview do e-mail</h3>
              </div>
              <div className="border border-zinc-100 rounded-xl overflow-hidden">
                {/* Email header simulation */}
                <div className="bg-zinc-50 border-b border-zinc-100 px-4 py-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 w-12 shrink-0">De:</span>
                    <span className="text-xs text-zinc-700 truncate">
                      {watch('from_name') || org?.name || 'Remetente'} &lt;{watch('from_email') || user?.email || 'email@exemplo.com'}&gt;
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 w-12 shrink-0">Assunto:</span>
                    <span className="text-xs font-semibold text-zinc-900 truncate">{watch('subject') || '(sem assunto)'}</span>
                  </div>
                </div>
                {/* Email body */}
                <div className="bg-zinc-50 p-4">
                  <div className="max-w-lg mx-auto bg-white rounded-xl overflow-hidden shadow-sm">
                    {emailLogoPreview && (
                      <div className="bg-zinc-50 border-b border-zinc-100 px-6 py-4 flex justify-center">
                        <img src={emailLogoPreview} alt="Logo" className="max-h-14 max-w-[160px] object-contain" />
                      </div>
                    )}
                    <div className="px-8 py-6 space-y-3">
                      {emailTitle && (
                        <h1 className="text-xl font-bold text-zinc-900 leading-tight">{emailTitle}</h1>
                      )}
                      {emailSubtitle && (
                        <p className="text-sm text-zinc-500 font-medium">{emailSubtitle}</p>
                      )}
                      {emailText && (
                        <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{emailText}</p>
                      )}
                      {useHtml && contentHtml && (
                        <div
                          className="text-sm prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: contentHtml }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)} icon={<ArrowLeft size={14} />}>Anterior</Button>
            <Button onClick={() => setStep(2)} icon={<ArrowRight size={14} />}>Próximo: Destinatários</Button>
          </div>
        </div>
      )}

      {/* Step 2: Recipients */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h2 className="font-semibold text-zinc-900 mb-1">Para quem enviar?</h2>
              <p className="text-sm text-zinc-500">Escolha como quer segmentar os destinatários.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'all', label: 'Todos os contatos', desc: 'Toda a base', icon: <Users size={15} /> },
                { id: 'filter', label: 'Por tipo', desc: 'Lead, cliente, ativo...', icon: <Filter size={15} /> },
                { id: 'list', label: 'Por lista', desc: 'Listas criadas', icon: <List size={15} /> },
                { id: 'individual', label: 'Individual', desc: 'Selecione um a um', icon: <UserCheck size={15} /> },
              ] as const).map(m => (
                <button
                  key={m.id}
                  onClick={() => setRecipientMode(m.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    recipientMode === m.id ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className={`shrink-0 ${recipientMode === m.id ? 'text-zinc-900' : 'text-zinc-400'}`}>{m.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{m.label}</p>
                    <p className="text-xs text-zinc-400">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {recipientMode === 'all' && (
              <div className="bg-zinc-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-900">Toda a base de contatos</p>
                  <p className="text-xs text-zinc-400">Contatos com status "descadastrado" são excluídos automaticamente</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-xl font-bold text-zinc-900">{totalContacts.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-zinc-400">contatos</p>
                </div>
              </div>
            )}

            {recipientMode === 'filter' && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-700">Selecione os tipos de contato:</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'lead', label: 'Lead', desc: 'Potenciais clientes' },
                    { value: 'customer', label: 'Cliente', desc: 'Clientes ativos' },
                    { value: 'active', label: 'Ativo', desc: 'Contatos ativos' },
                    { value: 'inactive', label: 'Inativo', desc: 'Sem interação recente' },
                  ] as { value: ContactStatus; label: string; desc: string }[]).map(s => (
                    <button
                      key={s.value}
                      onClick={() => toggleFilterStatus(s.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        filterStatuses.includes(s.value) ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                        filterStatuses.includes(s.value) ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-300'
                      }`}>
                        {filterStatuses.includes(s.value) && <CheckCircle2 size={10} className="text-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{s.label}</p>
                        <p className="text-xs text-zinc-400">{s.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {filterStatuses.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600 bg-zinc-50 rounded-lg px-3 py-2">
                    <Loader2 size={14} className={filteredCount === 0 && filterStatuses.length > 0 ? 'animate-spin text-zinc-400' : 'hidden'} />
                    <span><span className="font-semibold text-zinc-900">{filteredCount.toLocaleString('pt-BR')}</span> contatos correspondem ao filtro</span>
                  </div>
                )}
              </div>
            )}

            {recipientMode === 'list' && (
              listsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 size={20} className="animate-spin text-zinc-400" />
                </div>
              ) : lists.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-zinc-200 rounded-xl">
                  <Users size={24} className="text-zinc-300 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500 mb-1">Nenhuma lista criada ainda.</p>
                  <p className="text-xs text-zinc-400">
                    Crie listas em <a href="/app/contacts" className="text-zinc-900 font-medium hover:underline">Contatos</a> selecionando contatos e clicando em "Adicionar à lista".
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lists.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => toggleList(list.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                        selectedLists.includes(list.id) ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selectedLists.includes(list.id) ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-300'
                      }`}>
                        {selectedLists.includes(list.id) && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900">{list.name}</p>
                        {list.description && <p className="text-xs text-zinc-400">{list.description}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-zinc-900">{(list.contact_count ?? 0).toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-zinc-400">contatos</p>
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}

            {recipientMode === 'individual' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, e-mail ou empresa..."
                    value={contactSearch}
                    onChange={e => setContactSearch(e.target.value)}
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  />
                </div>

                {selectedContacts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedContacts.map(c => (
                      <span key={c.id} className="inline-flex items-center gap-1.5 bg-zinc-900 text-white text-xs rounded-full px-2.5 py-1">
                        {c.first_name} {c.last_name || ''}
                        <button onClick={() => toggleContact(c)} className="hover:text-zinc-300">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {contactSearch.trim() && (
                  <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    {searchedContacts.length === 0 ? (
                      <p className="text-sm text-zinc-400 text-center py-4">Nenhum contato encontrado</p>
                    ) : (
                      searchedContacts.map(c => {
                        const isSelected = selectedContacts.some(s => s.id === c.id)
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggleContact(c)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b last:border-b-0 border-zinc-100 transition-colors ${
                              isSelected ? 'bg-zinc-50' : 'hover:bg-zinc-50'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                              isSelected ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-300'
                            }`}>
                              {isSelected && <CheckCircle2 size={10} className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-900 truncate">
                                {c.first_name} {c.last_name || ''}
                              </p>
                              <p className="text-xs text-zinc-400 truncate">{c.email}</p>
                            </div>
                            <span className="text-xs text-zinc-400 shrink-0 capitalize">{c.status}</span>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}

                {selectedContacts.length === 0 && !contactSearch.trim() && (
                  <p className="text-sm text-zinc-400 text-center py-3">Digite o nome ou e-mail para encontrar contatos</p>
                )}
              </div>
            )}

            {canProceedFromStep2 && (
              <div className="bg-zinc-50 rounded-xl p-4 flex items-center gap-3">
                <Mail size={16} className="text-zinc-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {recipientCount.toLocaleString('pt-BR')} destinatário{recipientCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {recipientMode === 'all' && 'Toda a base de contatos'}
                    {recipientMode === 'filter' && `Filtro: ${filterStatuses.join(', ')}`}
                    {recipientMode === 'list' && `${selectedLists.length} lista${selectedLists.length > 1 ? 's' : ''}, duplicados removidos automaticamente`}
                    {recipientMode === 'individual' && `${selectedContacts.length} contato${selectedContacts.length !== 1 ? 's' : ''} selecionado${selectedContacts.length !== 1 ? 's' : ''} individualmente`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} icon={<ArrowLeft size={14} />}>Anterior</Button>
            <Button onClick={() => setStep(3)} disabled={!canProceedFromStep2} icon={<ArrowRight size={14} />}>
              Próximo: Revisão
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs space-y-5">
            <h2 className="font-semibold text-zinc-900">Revisar e enviar</h2>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Destinatários', value: recipientCount.toLocaleString('pt-BR') },
                {
                  label: 'Público',
                  value: recipientMode === 'all' ? 'Todos os contatos'
                    : recipientMode === 'filter' ? `Tipo: ${filterStatuses.join(', ')}`
                    : recipientMode === 'individual' ? `${selectedContacts.length} individual${selectedContacts.length !== 1 ? 'is' : ''}`
                    : `${selectedLists.length} lista${selectedLists.length > 1 ? 's' : ''}`
                },
                { label: 'Assunto', value: watch('subject') || '-' },
                { label: 'Conteúdo', value: useHtml ? 'HTML personalizado' : (emailTitle || emailSubtitle || emailText ? 'Criado' : 'Em branco') },
              ].map(({ label, value }) => (
                <div key={label} className="bg-zinc-50 rounded-xl p-4">
                  <p className="text-xs text-zinc-400">{label}</p>
                  <p className="text-sm font-semibold text-zinc-900 mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-900">Quando enviar?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSendMode('now')}
                  className={`p-4 rounded-xl border text-left transition-all ${sendMode === 'now' ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Send size={14} className="text-zinc-600" />
                    <span className="text-sm font-medium text-zinc-900">Agora</span>
                  </div>
                  <p className="text-xs text-zinc-400">Enviar imediatamente</p>
                </button>
                <button
                  onClick={() => setSendMode('schedule')}
                  className={`p-4 rounded-xl border text-left transition-all ${sendMode === 'schedule' ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={14} className="text-zinc-600" />
                    <span className="text-sm font-medium text-zinc-900">Agendar</span>
                  </div>
                  <p className="text-xs text-zinc-400">Escolha data e hora</p>
                </button>
              </div>
              {sendMode === 'schedule' && (
                <Input
                  type="datetime-local"
                  label="Data e hora de envio"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              )}
            </div>
          </div>

          {finishError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{finishError}</p>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)} icon={<ArrowLeft size={14} />}>Anterior</Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                loading={createCampaign.isPending}
                onClick={() => handleFinish(true)}
              >
                Salvar rascunho
              </Button>
              <Button
                loading={createCampaign.isPending}
                onClick={() => handleFinish(false)}
                icon={<Send size={14} />}
              >
                {sendMode === 'schedule' ? 'Agendar campanha' : sendMode === 'now' ? 'Enviar agora' : 'Criar campanha'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
