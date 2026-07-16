import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Search, MoreHorizontal, Mail, Copy, Trash2,
  Edit, BarChart2, Clock, Send, FileText, Zap, Loader2
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { formatDate, formatPercent } from '../../lib/utils'
import { useCampaigns, useDeleteCampaign } from '../../hooks/useCampaigns'

const statusConfig = {
  sent: { label: 'Enviada', variant: 'success' as const, icon: <Send size={11} /> },
  scheduled: { label: 'Agendada', variant: 'info' as const, icon: <Clock size={11} /> },
  draft: { label: 'Rascunho', variant: 'default' as const, icon: <FileText size={11} /> },
  sending: { label: 'Enviando', variant: 'warning' as const, icon: <Zap size={11} /> },
  paused: { label: 'Pausada', variant: 'warning' as const, icon: <Clock size={11} /> },
  cancelled: { label: 'Cancelada', variant: 'danger' as const, icon: <Trash2 size={11} /> },
}

export function CampaignsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const { data: campaigns = [], isLoading, error } = useCampaigns(filter, search)
  const deleteCampaign = useDeleteCampaign()

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta campanha?')) return
    await deleteCampaign.mutateAsync(id)
    setActiveMenu(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Campanhas</h1>
          <p className="text-zinc-500 mt-1">
            {isLoading ? 'Carregando...' : `${campaigns.length} campanha${campaigns.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link to="/app/campaigns/new">
          <Button size="sm" icon={<Plus size={14} />}>
            Nova campanha
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-64">
          <Input
            placeholder="Buscar campanhas..."
            icon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'sent', label: 'Enviadas' },
            { key: 'scheduled', label: 'Agendadas' },
            { key: 'draft', label: 'Rascunhos' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="py-20 flex items-center justify-center bg-white border border-zinc-100 rounded-xl">
          <Loader2 size={24} className="animate-spin text-zinc-400" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="py-16 text-center bg-white border border-zinc-100 rounded-xl">
          <p className="text-sm text-red-500">Erro ao carregar campanhas.</p>
        </div>
      )}

      {/* Campaign cards */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const status = statusConfig[campaign.status as keyof typeof statusConfig]
            const stats = (campaign as any).campaign_stats
            return (
              <div key={campaign.id} className="bg-white border border-zinc-100 rounded-xl p-5 shadow-xs hover:border-zinc-200 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                    <Mail size={18} className="text-zinc-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-zinc-900">{campaign.name}</h3>
                          <Badge variant={status.variant}>
                            <span className="flex items-center gap-1">
                              {status.icon}
                              {status.label}
                            </span>
                          </Badge>
                        </div>
                        <p className="text-sm text-zinc-500 mt-0.5 truncate">{campaign.subject}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {campaign.status === 'draft' && (
                          <Link to={`/app/campaigns/${campaign.id}/edit`}>
                            <Button variant="outline" size="xs" icon={<Edit size={12} />}>
                              Editar
                            </Button>
                          </Link>
                        )}
                        <div className="relative">
                          <button
                            onClick={() => setActiveMenu(activeMenu === campaign.id ? null : campaign.id)}
                            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                          {activeMenu === campaign.id && (
                            <div className="absolute right-0 top-8 w-44 bg-white border border-zinc-200 rounded-xl shadow-xl z-10 py-1">
                              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                                <Copy size={13} /> Duplicar
                              </button>
                              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                                <BarChart2 size={13} /> Ver relatório
                              </button>
                              <div className="border-t border-zinc-100 my-1" />
                              <button
                                onClick={() => handleDelete(campaign.id)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={13} /> Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    {stats && (
                      <div className="flex items-center gap-6 mt-4">
                        <div>
                          <p className="text-xs text-zinc-400">Enviados</p>
                          <p className="text-sm font-semibold text-zinc-900">{stats.total_sent.toLocaleString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-400">Abertura</p>
                          <p className="text-sm font-semibold text-emerald-600">
                            {stats.total_sent > 0 ? formatPercent((stats.unique_opens / stats.total_sent) * 100) : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-400">Cliques</p>
                          <p className="text-sm font-semibold text-blue-600">
                            {stats.total_sent > 0 ? formatPercent((stats.unique_clicks / stats.total_sent) * 100) : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-400">Bounces</p>
                          <p className="text-sm font-semibold text-red-500">
                            {stats.total_sent > 0 ? formatPercent((stats.bounces / stats.total_sent) * 100) : '-'}
                          </p>
                        </div>
                        {campaign.sent_at && (
                          <div className="ml-auto text-xs text-zinc-400">
                            Enviada em {formatDate(campaign.sent_at)}
                          </div>
                        )}
                      </div>
                    )}

                    {campaign.status === 'scheduled' && campaign.scheduled_at && (
                      <div className="flex items-center gap-2 mt-3 text-xs text-blue-600">
                        <Clock size={11} />
                        Agendada para {formatDate(campaign.scheduled_at)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {campaigns.length === 0 && (
            <div className="py-16 text-center bg-white border border-zinc-100 rounded-xl">
              <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={20} className="text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-900">Nenhuma campanha ainda</p>
              <p className="text-xs text-zinc-400 mt-1 mb-6">Crie sua primeira campanha e comece a enviar e-mails.</p>
              <Link to="/app/campaigns/new">
                <Button size="sm" icon={<Plus size={14} />}>Nova campanha</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
