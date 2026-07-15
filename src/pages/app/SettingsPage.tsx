import { useState } from 'react'
import { User, Building2, Mail, Key, Bell, Shield, Globe, CreditCard, Webhook, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { cn } from '../../lib/utils'
import { useOrganization } from '../../hooks/useOrganization'
import { useAuth } from '../../hooks/useAuth'

const sections = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'company', label: 'Empresa', icon: Building2 },
  { id: 'senders', label: 'Remetentes', icon: Mail },
  { id: 'domains', label: 'Domínios', icon: Globe },
  { id: 'billing', label: 'Plano e cobrança', icon: CreditCard },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'security', label: 'Segurança', icon: Shield },
]

const planLabels: Record<string, { name: string; price: string; limit: number }> = {
  start:      { name: 'Start',      price: 'Grátis',       limit: 1_000 },
  essencial:  { name: 'Essencial',  price: 'R$ 79,90/mês', limit: 5_000 },
  pro:        { name: 'Pro',        price: 'R$ 179/mês',   limit: 25_000 },
  business:   { name: 'Business',   price: 'R$ 399/mês',   limit: 100_000 },
  enterprise: { name: 'Enterprise', price: 'Sob consulta',  limit: 0 },
}

export function SettingsPage() {
  const [active, setActive] = useState('profile')
  const { user } = useAuth()
  const { data: org, isLoading: orgLoading } = useOrganization()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Configurações</h1>
        <p className="text-zinc-500 mt-1">Gerencie sua conta, domínio e integrações</p>
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
        <div className="flex-1">
          {active === 'profile' && (
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <h2 className="font-semibold text-zinc-900 mb-1">Perfil pessoal</h2>
                <p className="text-sm text-zinc-500">Suas informações pessoais de conta</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Nome completo" defaultValue={user?.user_metadata?.full_name ?? ''} />
                  <Input label="E-mail" defaultValue={user?.email ?? ''} type="email" readOnly />
                </div>
                <Input label="Telefone" placeholder="(11) 99999-0000" />
              </div>
              <div className="pt-4 border-t border-zinc-100 flex justify-end">
                <Button size="sm">Salvar alterações</Button>
              </div>
            </div>
          )}

          {active === 'company' && (
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <h2 className="font-semibold text-zinc-900 mb-1">Dados da empresa</h2>
                <p className="text-sm text-zinc-500">Informações usadas nos e-mails enviados</p>
              </div>
              <div className="space-y-4">
                <Input label="Nome da empresa" defaultValue="Minha Empresa Ltda" />
                <Input label="Website" placeholder="https://..." />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Cidade" placeholder="São Paulo" />
                  <Input label="Estado" placeholder="SP" />
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-100 flex justify-end">
                <Button size="sm">Salvar</Button>
              </div>
            </div>
          )}

          {active === 'senders' && (
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-zinc-900 mb-1">Remetentes verificados</h2>
                  <p className="text-sm text-zinc-500">E-mails autorizados a enviar campanhas</p>
                </div>
                <Button size="sm" variant="outline">Adicionar remetente</Button>
              </div>
              <div className="divide-y divide-zinc-100">
                {[
                  { email: 'contato@empresa.com', name: 'Equipe WebMark', verified: true },
                  { email: 'newsletter@empresa.com', name: 'Newsletter', verified: true },
                ].map((s) => (
                  <div key={s.email} className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{s.name}</p>
                      <p className="text-xs text-zinc-400">{s.email}</p>
                    </div>
                    <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-md">Verificado</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'domains' && (
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <h2 className="font-semibold text-zinc-900 mb-1">Domínio próprio</h2>
                <p className="text-sm text-zinc-500">Configure SPF, DKIM e DMARC para melhorar a entregabilidade</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-5 space-y-4">
                <Input label="Seu domínio" placeholder="empresa.com.br" />
                <div className="space-y-3">
                  {[
                    { type: 'SPF', record: 'v=spf1 include:_spf.webmark.com.br ~all' },
                    { type: 'DKIM', record: 'webmark._domainkey.empresa.com' },
                  ].map(({ type, record }) => (
                    <div key={type} className="bg-white rounded-lg p-3 border border-zinc-200">
                      <p className="text-xs font-semibold text-zinc-500 mb-1">{type} Record</p>
                      <code className="text-xs text-zinc-700 font-mono break-all">{record}</code>
                    </div>
                  ))}
                </div>
              </div>
              <Button size="sm">Verificar domínio</Button>
            </div>
          )}

          {active === 'billing' && (
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <h2 className="font-semibold text-zinc-900 mb-1">Plano e cobrança</h2>
                <p className="text-sm text-zinc-500">Gerencie seu plano e forma de pagamento</p>
              </div>
              {orgLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 size={20} className="animate-spin text-zinc-400" />
                </div>
              ) : org ? (() => {
                const plan = planLabels[org.plan] ?? planLabels.start
                const used = org.sends_used ?? 0
                const limit = org.sends_limit ?? plan.limit
                const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
                return (
                  <div className="bg-zinc-50 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="text-xs font-semibold text-zinc-500 uppercase">Plano atual</span>
                        <p className="text-xl font-bold text-zinc-900 mt-1">{plan.name}</p>
                        <p className="text-sm text-zinc-500">{plan.price} · {limit.toLocaleString('pt-BR')} envios</p>
                      </div>
                      <Button variant="outline" size="sm">Fazer upgrade</Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-zinc-500">
                        <span>Envios utilizados</span>
                        <span><strong className="text-zinc-900">{used.toLocaleString('pt-BR')}</strong> / {limit.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-900 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })() : null}
              <Button variant="outline" size="sm">Gerenciar no Stripe →</Button>
            </div>
          )}

          {active === 'api' && (
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-zinc-900 mb-1">API Keys</h2>
                  <p className="text-sm text-zinc-500">Integre o WebMark com outros sistemas</p>
                </div>
                <Button size="sm" variant="outline">Gerar nova chave</Button>
              </div>
              <div className="bg-zinc-50 rounded-xl p-4 font-mono text-xs text-zinc-600 break-all">
                wm_live_••••••••••••••••••••••••••••••••
              </div>
              <p className="text-xs text-zinc-400">
                Sua API key dá acesso completo à conta. Nunca a compartilhe publicamente.
              </p>
            </div>
          )}

          {active === 'webhooks' && (
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-zinc-900 mb-1">Webhooks</h2>
                  <p className="text-sm text-zinc-500">Receba notificações em tempo real</p>
                </div>
                <Button size="sm" variant="outline">Adicionar endpoint</Button>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-700">Eventos disponíveis</p>
                {['email.opened', 'email.clicked', 'email.bounced', 'contact.unsubscribed', 'campaign.sent'].map(event => (
                  <div key={event} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <code className="text-zinc-600 font-mono text-xs">{event}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(active === 'notifications' || active === 'security') && (
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-xs">
              <h2 className="font-semibold text-zinc-900 mb-2">{sections.find(s => s.id === active)?.label}</h2>
              <p className="text-sm text-zinc-400">Em breve — esta seção está sendo desenvolvida.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
