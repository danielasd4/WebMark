import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, ArrowRight, Send, Calendar, Sparkles,
  Smartphone, Monitor, CheckCircle2, Users, Loader2
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { EmailEditor } from '../../components/email/EmailEditor'
import { useLists } from '../../hooks/useLists'
import { useCreateCampaign, useUpdateCampaign } from '../../hooks/useCampaigns'

const steps = ['Configurações', 'Conteúdo', 'Listas', 'Revisão']

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  subject: z.string().min(1, 'Assunto é obrigatório'),
  preview_text: z.string().optional(),
  from_name: z.string().min(1, 'Nome do remetente é obrigatório'),
  from_email: z.string().email('E-mail inválido'),
  reply_to: z.string().email().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

const templates = [
  { id: 'blank', name: 'Em branco', desc: 'Comece do zero' },
  { id: 'newsletter', name: 'Newsletter', desc: 'Layout de boletim informativo' },
  { id: 'promo', name: 'Promoção', desc: 'Destaque uma oferta' },
  { id: 'welcome', name: 'Boas-vindas', desc: 'Recepcione novos contatos' },
]

export function NewCampaignPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [selectedLists, setSelectedLists] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('newsletter')
  const [preview, setPreview] = useState<'desktop' | 'mobile'>('desktop')
  const [sendMode, setSendMode] = useState<'now' | 'schedule' | 'draft'>('draft')
  const [scheduledAt, setScheduledAt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const [contentHtml, setContentHtml] = useState('')
  const [finishError, setFinishError] = useState<string | null>(null)

  const { data: lists = [], isLoading: listsLoading } = useLists()
  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign()

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      from_name: 'Equipe WebMark',
      from_email: '',
    }
  })

  const subject = watch('subject') ?? ''

  const generateSubjectWithAI = () => {
    setAiLoading(true)
    setTimeout(() => {
      setValue('subject', '🔥 Novidades exclusivas para você — Não perca!')
      setAiLoading(false)
    }, 1200)
  }

  const toggleList = (id: string) =>
    setSelectedLists(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleFinish = async (asDraft = false) => {
    const values = getValues()
    const status = asDraft ? 'draft' : sendMode === 'now' ? 'sending' : 'scheduled'

    try {
      setFinishError(null)
      const campaign = await createCampaign.mutateAsync({
        ...values,
        content_html: contentHtml,
        status,
        list_ids: selectedLists,
        scheduled_at: sendMode === 'schedule' && scheduledAt ? scheduledAt : undefined,
      })

      if (status === 'sending' && campaign?.id) {
        try {
          const res = await fetch('/.netlify/functions/send-campaign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaign_id: campaign.id }),
          })
          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            await updateCampaign.mutateAsync({ id: campaign.id, values: { status: 'draft' } })
            setFinishError(`Campanha salva como rascunho. Erro no envio: ${body.error || res.statusText}`)
            return
          }
        } catch {
          await updateCampaign.mutateAsync({ id: campaign.id, values: { status: 'draft' } })
          setFinishError('Campanha salva como rascunho. O envio de e-mail só funciona no ambiente Netlify.')
          return
        }
      }

      navigate('/app/campaigns')
    } catch (err: any) {
      setFinishError(err?.message ?? 'Erro ao criar campanha. Tente novamente.')
    }
  }

  const totalEstimated = lists
    .filter(l => selectedLists.includes(l.id))
    .reduce((acc, l) => acc + (l.contact_count ?? 0), 0)

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
              label="Nome interno da campanha *"
              placeholder="Ex: Newsletter Agosto 2024"
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

            <Input
              label="Texto de preview"
              placeholder="Complementa o assunto na caixa de entrada..."
              {...register('preview_text')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input label="Nome do remetente *" error={errors.from_name?.message} {...register('from_name')} />
              <Input label="E-mail do remetente *" type="email" error={errors.from_email?.message} {...register('from_email')} />
            </div>

            <Input label="Responder para" type="email" placeholder="(opcional)" {...register('reply_to')} />
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
          <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs">
            <h2 className="font-semibold text-zinc-900 mb-4">Escolha um template</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`border rounded-xl p-4 text-left transition-all ${
                    selectedTemplate === t.id ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="h-24 bg-zinc-100 rounded-lg mb-3 flex items-center justify-center">
                    <div className="w-8 h-10 bg-zinc-200 rounded-sm" />
                  </div>
                  <p className="text-xs font-medium text-zinc-900">{t.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-zinc-900">Conteúdo do e-mail</h2>
              <div className="flex gap-1 bg-zinc-100 p-1 rounded-lg">
                <button
                  onClick={() => setPreview('desktop')}
                  className={`p-1.5 rounded-md transition-colors ${preview === 'desktop' ? 'bg-white shadow-sm' : 'text-zinc-400'}`}
                >
                  <Monitor size={14} />
                </button>
                <button
                  onClick={() => setPreview('mobile')}
                  className={`p-1.5 rounded-md transition-colors ${preview === 'mobile' ? 'bg-white shadow-sm' : 'text-zinc-400'}`}
                >
                  <Smartphone size={14} />
                </button>
              </div>
            </div>
            {preview === 'desktop' ? (
              <EmailEditor onChange={setContentHtml} />
            ) : (
              <div className="max-w-sm mx-auto border border-zinc-200 rounded-xl overflow-hidden">
                <div className="bg-zinc-900 h-1.5 w-full" />
                <div
                  className="p-4 text-sm prose prose-sm max-w-none min-h-[200px] bg-white"
                  dangerouslySetInnerHTML={{ __html: contentHtml || '<p class="text-zinc-400">Escreva o conteúdo na aba Desktop para ver o preview mobile.</p>' }}
                />
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)} icon={<ArrowLeft size={14} />}>Anterior</Button>
            <Button onClick={() => setStep(2)} icon={<ArrowRight size={14} />}>Próximo: Listas</Button>
          </div>
        </div>
      )}

      {/* Step 2: Lists */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs">
            <h2 className="font-semibold text-zinc-900 mb-1">Selecione as listas de destinatários</h2>
            <p className="text-sm text-zinc-500 mb-5">Escolha uma ou mais listas para envio.</p>

            {listsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-zinc-400" />
              </div>
            ) : lists.length === 0 ? (
              <div className="py-10 text-center">
                <Users size={32} className="text-zinc-300 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Nenhuma lista criada ainda.</p>
                <a href="/app/lists" className="text-xs font-medium text-zinc-900 hover:underline mt-1 inline-block">
                  Criar uma lista →
                </a>
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
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
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
            )}

            {selectedLists.length > 0 && (
              <div className="mt-4 bg-zinc-50 rounded-xl p-4">
                <p className="text-sm font-medium text-zinc-900">
                  Total estimado: {totalEstimated.toLocaleString('pt-BR')} destinatários
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">Duplicados serão removidos automaticamente</p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} icon={<ArrowLeft size={14} />}>Anterior</Button>
            <Button onClick={() => setStep(3)} disabled={selectedLists.length === 0} icon={<ArrowRight size={14} />}>
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
                { label: 'Destinatários', value: totalEstimated.toLocaleString('pt-BR') },
                { label: 'Listas', value: `${selectedLists.length} selecionada${selectedLists.length > 1 ? 's' : ''}` },
                { label: 'Template', value: templates.find(t => t.id === selectedTemplate)?.name || '-' },
                { label: 'Assunto', value: watch('subject') || '—' },
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
