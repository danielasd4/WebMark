import { Users, Mail, TrendingUp, MousePointerClick, Clock, Sparkles, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { StatCard } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useAuth } from '../../hooks/useAuth'
import { useOrganization } from '../../hooks/useOrganization'
import { supabase } from '../../lib/supabase'
import { formatRelativeDate, formatPercent } from '../../lib/utils'
import { initials } from '../../lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'

const statusConfig = {
  sent: { label: 'Enviada', variant: 'success' as const },
  scheduled: { label: 'Agendada', variant: 'info' as const },
  draft: { label: 'Rascunho', variant: 'default' as const },
  sending: { label: 'Enviando', variant: 'warning' as const },
  paused: { label: 'Pausada', variant: 'warning' as const },
  cancelled: { label: 'Cancelada', variant: 'danger' as const },
}

function useDashboardStats(orgId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard-stats', orgId],
    queryFn: async () => {
      if (!orgId) return null

      const [contactsRes, campaignsRes, recentContactsRes, recentCampaignsRes] = await Promise.all([
        supabase.from('contacts').select('id, created_at', { count: 'exact' }).eq('organization_id', orgId),
        supabase.from('campaigns').select('id, status', { count: 'exact' }).eq('organization_id', orgId).eq('status', 'sent'),
        supabase.from('contacts').select('id, first_name, last_name, email, company, created_at').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(5),
        supabase.from('campaigns').select('id, name, status, sent_at, scheduled_at, campaign_stats(total_sent, unique_opens, unique_clicks)').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(5),
      ])

      const totalContacts = contactsRes.count ?? 0
      const sentCampaigns = campaignsRes.count ?? 0

      // Monthly contact growth (last 6 months)
      const now = new Date()
      const monthlyGrowth = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        const label = d.toLocaleDateString('pt-BR', { month: 'short' })
        const count = (contactsRes.data ?? []).filter((c) => {
          const cd = new Date(c.created_at)
          return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear()
        }).length
        return { month: label.charAt(0).toUpperCase() + label.slice(1, 3), novos: count }
      })

      return {
        totalContacts,
        sentCampaigns,
        recentContacts: recentContactsRes.data ?? [],
        recentCampaigns: recentCampaignsRes.data ?? [],
        monthlyGrowth,
      }
    },
    enabled: !!orgId,
    staleTime: 60 * 1000,
  })
}

export function DashboardPage() {
  const { user } = useAuth()
  const { data: org } = useOrganization()
  const { data: stats, isLoading } = useDashboardStats(org?.id)

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'usuário'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Olá, {firstName} 👋
          </h1>
          <p className="text-zinc-500 mt-1">Aqui está o resumo das suas campanhas e contatos.</p>
        </div>
        <Link
          to="/app/campaigns/new"
          className="inline-flex items-center gap-2 h-9 px-4 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <Mail size={14} />
          Nova campanha
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-zinc-300" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total de contatos"
              value={stats?.totalContacts.toLocaleString('pt-BR') ?? '0'}
              icon={<Users size={16} />}
            />
            <StatCard
              title="Campanhas enviadas"
              value={stats?.sentCampaigns.toLocaleString('pt-BR') ?? '0'}
              icon={<Mail size={16} />}
            />
            <StatCard
              title="Taxa de abertura"
              value="—"
              icon={<TrendingUp size={16} />}
            />
            <StatCard
              title="Taxa de cliques"
              value="—"
              icon={<MousePointerClick size={16} />}
            />
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-zinc-100 rounded-xl p-6 shadow-xs">
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-zinc-900">Crescimento de contatos</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Novos contatos por mês</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats?.monthlyGrowth ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNovos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#18181b" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ border: '1px solid #e4e4e7', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="novos" stroke="#18181b" strokeWidth={2} fill="url(#colorNovos)" name="Novos contatos" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-zinc-100 rounded-xl p-6 shadow-xs">
              <h2 className="text-sm font-semibold text-zinc-900 mb-1">Contatos por mês</h2>
              <p className="text-xs text-zinc-400 mb-6">Últimos 6 meses</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats?.monthlyGrowth ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ border: '1px solid #e4e4e7', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="novos" fill="#18181b" radius={[4, 4, 0, 0]} name="Novos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent campaigns + contacts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-zinc-100 rounded-xl shadow-xs">
              <div className="flex items-center justify-between p-5 border-b border-zinc-50">
                <h2 className="text-sm font-semibold text-zinc-900">Últimas campanhas</h2>
                <Link to="/app/campaigns" className="text-xs text-zinc-400 hover:text-zinc-600">Ver todas</Link>
              </div>
              <div className="divide-y divide-zinc-50">
                {(stats?.recentCampaigns ?? []).length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-xs text-zinc-400">Nenhuma campanha ainda.</p>
                    <Link to="/app/campaigns/new" className="text-xs font-medium text-zinc-900 hover:underline mt-1 inline-block">
                      Criar primeira campanha →
                    </Link>
                  </div>
                )}
                {(stats?.recentCampaigns ?? []).map((c: any) => {
                  const status = statusConfig[c.status as keyof typeof statusConfig] ?? statusConfig.draft
                  const s = c.campaign_stats
                  return (
                    <div key={c.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-50 transition-colors">
                      <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                        <Mail size={14} className="text-zinc-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">{c.name}</p>
                        {c.status === 'sent' && s && (
                          <p className="text-xs text-zinc-400">
                            {s.total_sent.toLocaleString('pt-BR')} enviados
                            {s.total_sent > 0 ? ` · ${formatPercent((s.unique_opens / s.total_sent) * 100)} abertos` : ''}
                          </p>
                        )}
                        {c.status === 'scheduled' && c.scheduled_at && (
                          <p className="text-xs text-zinc-400 flex items-center gap-1">
                            <Clock size={10} />
                            Agendada
                          </p>
                        )}
                        {c.status === 'draft' && (
                          <p className="text-xs text-zinc-400">Rascunho — não enviada</p>
                        )}
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white border border-zinc-100 rounded-xl shadow-xs">
              <div className="flex items-center justify-between p-5 border-b border-zinc-50">
                <h2 className="text-sm font-semibold text-zinc-900">Últimos contatos</h2>
                <Link to="/app/contacts" className="text-xs text-zinc-400 hover:text-zinc-600">Ver todos</Link>
              </div>
              <div className="divide-y divide-zinc-50">
                {(stats?.recentContacts ?? []).length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-xs text-zinc-400">Nenhum contato ainda.</p>
                    <Link to="/app/contacts" className="text-xs font-medium text-zinc-900 hover:underline mt-1 inline-block">
                      Adicionar primeiro contato →
                    </Link>
                  </div>
                )}
                {(stats?.recentContacts ?? []).map((c: any) => (
                  <div key={c.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-50 transition-colors">
                    <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-zinc-600">
                        {initials(`${c.first_name} ${c.last_name ?? ''}`)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900">{c.first_name} {c.last_name}</p>
                      <p className="text-xs text-zinc-400">{c.company ?? c.email}</p>
                    </div>
                    <span className="text-xs text-zinc-400">{formatRelativeDate(c.created_at)}</span>
                  </div>
                ))}
              </div>

              {/* AI suggestion */}
              <div className="m-4 bg-zinc-50 rounded-xl p-4 flex gap-3">
                <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center shrink-0">
                  <Sparkles size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-900">IA Assistente</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Use a IA para criar campanhas, escrever assuntos e segmentar seus contatos.
                  </p>
                  <Link to="/app/ai" className="text-xs font-medium text-zinc-900 hover:underline mt-1.5 inline-block">
                    Abrir IA →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Plan usage */}
          {org && (
            <div className="bg-white border border-zinc-100 rounded-xl p-6 shadow-xs">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900">
                    Uso do plano — {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">{org.name}</p>
                </div>
                <Link to="/app/settings/billing" className="text-xs text-zinc-500 hover:text-zinc-900 font-medium">
                  Fazer upgrade
                </Link>
              </div>
              <div>
                <div className="flex justify-between text-xs text-zinc-500 mb-2">
                  <span>Envios utilizados</span>
                  <span>
                    <strong className="text-zinc-900">{org.sends_used.toLocaleString('pt-BR')}</strong> / {org.sends_limit.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 rounded-full transition-all"
                    style={{ width: `${Math.min((org.sends_used / org.sends_limit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
