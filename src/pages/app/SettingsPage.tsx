import { useState, useEffect } from 'react'
import { User, Building2, Mail, Bell, Globe, CreditCard, Loader2, Plus, Trash2, Check } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { cn } from '../../lib/utils'
import { useOrganization } from '../../hooks/useOrganization'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

const sections = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'company', label: 'Empresa', icon: Building2 },
  { id: 'senders', label: 'Remetentes', icon: Mail },
  { id: 'domains', label: 'Domínios', icon: Globe },
  { id: 'billing', label: 'Plano', icon: CreditCard },
  { id: 'notifications', label: 'Notificações', icon: Bell },
]

const allPlans = [
  { id: 'start', name: 'Start', price: 'Grátis', limit: 1_000, features: ['1.000 envios/mês', 'Até 500 contatos', 'Campanhas ilimitadas'] },
  { id: 'essencial', name: 'Essencial', price: 'R$ 79,90/mês', limit: 5_000, features: ['5.000 envios/mês', 'Até 2.500 contatos', 'Relatórios avançados'] },
  { id: 'pro', name: 'Pro', price: 'R$ 179/mês', limit: 25_000, features: ['25.000 envios/mês', 'Até 10.000 contatos', 'Automações', 'Suporte prioritário'] },
  { id: 'business', name: 'Business', price: 'R$ 399/mês', limit: 100_000, features: ['100.000 envios/mês', 'Contatos ilimitados', 'API access', 'SLA garantido'] },
  { id: 'enterprise', name: 'Enterprise', price: 'Sob consulta', limit: 0, features: ['Volume personalizado', 'Infraestrutura dedicada', 'Suporte 24/7', 'Onboarding customizado'] },
]

type Sender = { id: string; name: string; email: string }
type Domain = { id: string; domain: string; status: 'pending' | 'verified' }

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none',
        checked ? 'bg-zinc-900' : 'bg-zinc-200'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  )
}

export function SettingsPage() {
  const [active, setActive] = useState('profile')
  const { user } = useAuth()
  const { data: org, isLoading: orgLoading } = useOrganization()
  const queryClient = useQueryClient()

  // Profile
  const [profileName, setProfileName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Company
  const [companyName, setCompanyName] = useState('')
  const [companyWebsite, setCompanyWebsite] = useState('')
  const [companyCity, setCompanyCity] = useState('')
  const [companyState, setCompanyState] = useState('')
  const [companySaving, setCompanySaving] = useState(false)
  const [companySaved, setCompanySaved] = useState(false)

  // Senders
  const [senders, setSenders] = useState<Sender[]>([])
  const [addingSender, setAddingSender] = useState(false)
  const [newSenderName, setNewSenderName] = useState('')
  const [newSenderEmail, setNewSenderEmail] = useState('')

  // Domains
  const [domains, setDomains] = useState<Domain[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [savingDomain, setSavingDomain] = useState(false)

  // Notifications
  const [notifications, setNotifications] = useState({
    campaign_sent: true,
    contact_unsubscribed: true,
    weekly_report: false,
    deliverability_alerts: true,
  })

  useEffect(() => {
    if (user) {
      setProfileName(user.user_metadata?.full_name ?? '')
    }
  }, [user])

  useEffect(() => {
    if (org) {
      setCompanyName(org.name ?? '')
      setCompanyWebsite(org.website ?? '')
      setSenders([{ id: 'default', name: org.name ?? 'Empresa', email: user?.email ?? '' }])
    }
  }, [org, user])

  const saveProfile = async () => {
    setProfileSaving(true)
    try {
      await supabase.auth.updateUser({ data: { full_name: profileName } })
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } finally {
      setProfileSaving(false)
    }
  }

  const saveCompany = async () => {
    if (!org) return
    setCompanySaving(true)
    try {
      await supabase
        .from('organizations')
        .update({ name: companyName, website: companyWebsite || null })
        .eq('id', org.id)
      queryClient.invalidateQueries({ queryKey: ['organization'] })
      setCompanySaved(true)
      setTimeout(() => setCompanySaved(false), 2000)
    } finally {
      setCompanySaving(false)
    }
  }

  const addSender = () => {
    if (!newSenderName.trim() || !newSenderEmail.trim()) return
    setSenders(prev => [...prev, { id: Date.now().toString(), name: newSenderName.trim(), email: newSenderEmail.trim() }])
    setNewSenderName('')
    setNewSenderEmail('')
    setAddingSender(false)
  }

  const removeSender = (id: string) => setSenders(prev => prev.filter(s => s.id !== id))

  const addDomain = () => {
    if (!newDomain.trim()) return
    setSavingDomain(true)
    setTimeout(() => {
      setDomains(prev => [...prev, { id: Date.now().toString(), domain: newDomain.trim(), status: 'pending' }])
      setNewDomain('')
      setSavingDomain(false)
    }, 800)
  }

  const removeDomain = (id: string) => setDomains(prev => prev.filter(d => d.id !== id))

  const currentPlan = allPlans.find(p => p.id === org?.plan) ?? allPlans[0]
  const otherPlans = allPlans.filter(p => p.id !== currentPlan.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Configurações</h1>
        <p className="text-zinc-500 mt-1">Gerencie sua conta, domínio e plano</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav className="w-52 shrink-0">
          <div className="space-y-0.5">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                  active === id ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                )}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Perfil */}
          {active === 'profile' && (
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <h2 className="font-semibold text-zinc-900 mb-1">Perfil pessoal</h2>
                <p className="text-sm text-zinc-500">Suas informações pessoais de conta</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Nome completo</label>
                    <input
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    />
                  </div>
                  <Input label="E-mail" defaultValue={user?.email ?? ''} type="email" readOnly />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">Telefone</label>
                  <input
                    value={profilePhone}
                    onChange={e => setProfilePhone(e.target.value)}
                    placeholder="(11) 99999-0000"
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-100 flex justify-end">
                <Button size="sm" loading={profileSaving} onClick={saveProfile} icon={profileSaved ? <Check size={13} /> : undefined}>
                  {profileSaved ? 'Salvo!' : 'Salvar alterações'}
                </Button>
              </div>
            </div>
          )}

          {/* Empresa */}
          {active === 'company' && (
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <h2 className="font-semibold text-zinc-900 mb-1">Dados da empresa</h2>
                <p className="text-sm text-zinc-500">Informações usadas nos e-mails enviados</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">Nome da empresa</label>
                  <input
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">Website</label>
                  <input
                    value={companyWebsite}
                    onChange={e => setCompanyWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Cidade</label>
                    <input
                      value={companyCity}
                      onChange={e => setCompanyCity(e.target.value)}
                      placeholder="São Paulo"
                      className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Estado</label>
                    <input
                      value={companyState}
                      onChange={e => setCompanyState(e.target.value)}
                      placeholder="SP"
                      className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-100 flex justify-end">
                <Button size="sm" loading={companySaving} onClick={saveCompany} icon={companySaved ? <Check size={13} /> : undefined}>
                  {companySaved ? 'Salvo!' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}

          {/* Remetentes */}
          {active === 'senders' && (
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-zinc-900 mb-1">Remetentes</h2>
                  <p className="text-sm text-zinc-500">E-mails autorizados a enviar campanhas</p>
                </div>
                {!addingSender && (
                  <Button size="sm" variant="outline" icon={<Plus size={13} />} onClick={() => setAddingSender(true)}>
                    Adicionar
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {senders.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-zinc-50">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{s.name}</p>
                      <p className="text-xs text-zinc-400">{s.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-md">Verificado</span>
                      {senders.length > 1 && (
                        <button
                          onClick={() => removeSender(s.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {addingSender && (
                <div className="border border-zinc-200 rounded-xl p-4 space-y-3 bg-zinc-50">
                  <p className="text-sm font-medium text-zinc-900">Novo remetente</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-zinc-500">Nome</label>
                      <input
                        autoFocus
                        value={newSenderName}
                        onChange={e => setNewSenderName(e.target.value)}
                        placeholder="Ex: Newsletter"
                        className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-zinc-500">E-mail</label>
                      <input
                        value={newSenderEmail}
                        onChange={e => setNewSenderEmail(e.target.value)}
                        placeholder="email@empresa.com"
                        type="email"
                        className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => { setAddingSender(false); setNewSenderName(''); setNewSenderEmail('') }}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={addSender}>Adicionar</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Domínios */}
          {active === 'domains' && (
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <h2 className="font-semibold text-zinc-900 mb-1">Domínio próprio</h2>
                <p className="text-sm text-zinc-500">Configure SPF, DKIM e DMARC para melhorar a entregabilidade</p>
              </div>

              <div className="flex gap-2">
                <input
                  value={newDomain}
                  onChange={e => setNewDomain(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addDomain() }}
                  placeholder="empresa.com.br"
                  className="flex-1 h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                />
                <Button size="sm" onClick={addDomain} loading={savingDomain}>
                  Adicionar domínio
                </Button>
              </div>

              {domains.length > 0 && (
                <div className="space-y-3">
                  {domains.map(d => (
                    <div key={d.id} className="border border-zinc-100 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-zinc-50">
                        <div className="flex items-center gap-3">
                          <Globe size={14} className="text-zinc-400" />
                          <span className="text-sm font-medium text-zinc-900">{d.domain}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-md',
                            d.status === 'verified' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'
                          )}>
                            {d.status === 'verified' ? 'Verificado' : 'Pendente'}
                          </span>
                          <button
                            onClick={() => removeDomain(d.id)}
                            className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      {d.status === 'pending' && (
                        <div className="px-4 py-3 space-y-2 border-t border-zinc-100">
                          <p className="text-xs text-zinc-500 font-medium">Adicione os registros DNS no seu provedor:</p>
                          {[
                            { type: 'SPF', record: `v=spf1 include:_spf.webmark.com.br ~all` },
                            { type: 'DKIM', record: `webmark._domainkey.${d.domain}` },
                          ].map(({ type, record }) => (
                            <div key={type} className="bg-zinc-50 rounded-lg p-2.5 border border-zinc-100">
                              <span className="text-xs font-semibold text-zinc-500">{type}: </span>
                              <code className="text-xs text-zinc-700 font-mono break-all">{record}</code>
                            </div>
                          ))}
                          <Button size="sm" variant="outline" className="mt-1">Verificar domínio</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {domains.length === 0 && (
                <div className="py-8 text-center border border-dashed border-zinc-200 rounded-xl">
                  <Globe size={24} className="text-zinc-300 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">Nenhum domínio adicionado ainda</p>
                  <p className="text-xs text-zinc-400 mt-1">Adicione seu domínio para enviar e-mails com identidade própria</p>
                </div>
              )}
            </div>
          )}

          {/* Plano */}
          {active === 'billing' && (
            <div className="space-y-5">
              {orgLoading ? (
                <div className="bg-white border border-zinc-100 rounded-2xl p-6 flex justify-center">
                  <Loader2 size={20} className="animate-spin text-zinc-400" />
                </div>
              ) : org && (
                <>
                  {/* Current plan */}
                  <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs space-y-4">
                    <div>
                      <h2 className="font-semibold text-zinc-900 mb-1">Plano e cobrança</h2>
                      <p className="text-sm text-zinc-500">Seu plano atual</p>
                    </div>
                    <div className="bg-zinc-50 rounded-xl p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Plano atual</span>
                          <p className="text-xl font-bold text-zinc-900 mt-1">{currentPlan.name}</p>
                          <p className="text-sm text-zinc-500">{currentPlan.price} · {currentPlan.limit > 0 ? currentPlan.limit.toLocaleString('pt-BR') + ' envios/mês' : 'Volume personalizado'}</p>
                        </div>
                      </div>
                      {currentPlan.limit > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-zinc-500">
                            <span>Envios utilizados</span>
                            <span><strong className="text-zinc-900">{(org.sends_used ?? 0).toLocaleString('pt-BR')}</strong> / {(org.sends_limit ?? currentPlan.limit).toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-zinc-900 rounded-full transition-all"
                              style={{ width: `${Math.min(((org.sends_used ?? 0) / (org.sends_limit ?? currentPlan.limit)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Other plans */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-zinc-700">Outros planos disponíveis</p>
                    {otherPlans.map(plan => (
                      <div key={plan.id} className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <p className="font-semibold text-zinc-900">{plan.name}</p>
                            <p className="text-sm text-zinc-500">{plan.price}</p>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            {plan.features.map(f => (
                              <span key={f} className="text-xs text-zinc-400">{f}</span>
                            ))}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="shrink-0">
                          {plan.id === 'enterprise' ? 'Falar com vendas' : 'Fazer upgrade'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notificações */}
          {active === 'notifications' && (
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <h2 className="font-semibold text-zinc-900 mb-1">Notificações</h2>
                <p className="text-sm text-zinc-500">Escolha quando deseja ser notificado por e-mail</p>
              </div>
              <div className="space-y-4">
                {([
                  { key: 'campaign_sent', label: 'Campanha enviada', desc: 'Receba confirmação quando uma campanha for enviada com sucesso' },
                  { key: 'contact_unsubscribed', label: 'Descadastramento de contato', desc: 'Seja notificado quando um contato se descadastrar' },
                  { key: 'weekly_report', label: 'Relatório semanal', desc: 'Resumo semanal de envios, aberturas e cliques' },
                  { key: 'deliverability_alerts', label: 'Alertas de entregabilidade', desc: 'Aviso quando a taxa de bounce estiver alta' },
                ] as { key: keyof typeof notifications; label: string; desc: string }[]).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-zinc-50 last:border-0">
                    <div className="flex-1 pr-4">
                      <p className="text-sm font-medium text-zinc-900">{label}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
                    </div>
                    <Toggle checked={notifications[key]} onChange={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))} />
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-zinc-100 flex justify-end">
                <Button size="sm">Salvar preferências</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
