import { useState } from 'react'
import { Plus, Zap, Play, Pause, MoreHorizontal, Users, Mail, Clock, GitBranch, Trash2, Edit, Copy } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { formatDate } from '../../lib/utils'

const mockAutomations = [
  {
    id: '1', name: 'Boas-vindas', trigger: 'Contato adicionado', status: 'active',
    enrolled: 247, steps: 4, description: 'Sequência de 3 e-mails para novos contatos',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: '2', name: 'Reativação 90 dias', trigger: 'Inatividade +90 dias', status: 'active',
    enrolled: 89, steps: 3, description: 'Recupera contatos inativos com oferta especial',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: '3', name: 'Aniversário', trigger: 'Data de aniversário', status: 'inactive',
    enrolled: 0, steps: 1, description: 'E-mail personalizado no aniversário do contato',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
]

const triggerTemplates = [
  { icon: Users, name: 'Novo contato', desc: 'Dispara quando um contato é adicionado' },
  { icon: Mail, name: 'E-mail aberto', desc: 'Dispara quando um e-mail é aberto' },
  { icon: Clock, name: 'Data/Hora', desc: 'Dispara em uma data específica' },
  { icon: GitBranch, name: 'Tag adicionada', desc: 'Dispara quando uma tag é aplicada' },
]

export function AutomationsPage() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Automações</h1>
          <p className="text-zinc-500 mt-1">Fluxos automáticos de e-mail</p>
        </div>
        <Button size="sm" icon={<Plus size={14} />}>
          Nova automação
        </Button>
      </div>

      {/* Active automations */}
      <div className="space-y-3">
        {mockAutomations.map((auto) => (
          <div key={auto.id} className="bg-white border border-zinc-100 rounded-xl p-5 shadow-xs hover:border-zinc-200 transition-all group">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${auto.status === 'active' ? 'bg-emerald-50' : 'bg-zinc-100'}`}>
                  <Zap size={18} className={auto.status === 'active' ? 'text-emerald-600' : 'text-zinc-400'} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-zinc-900">{auto.name}</h3>
                    <Badge variant={auto.status === 'active' ? 'success' : 'default'}>
                      {auto.status === 'active' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{auto.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Users size={11} /> {auto.enrolled} inscritos</span>
                    <span className="flex items-center gap-1"><GitBranch size={11} /> {auto.steps} etapas</span>
                    <span className="flex items-center gap-1"><Zap size={11} /> {auto.trigger}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors">
                  {auto.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === auto.id ? null : auto.id)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {activeMenu === auto.id && (
                    <div className="absolute right-0 top-8 w-40 bg-white border border-zinc-200 rounded-xl shadow-xl z-10 py-1">
                      <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                        <Edit size={13} /> Editar
                      </button>
                      <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                        <Copy size={13} /> Duplicar
                      </button>
                      <div className="border-t border-zinc-100 my-1" />
                      <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                        <Trash2 size={13} /> Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Templates */}
      <div>
        <h2 className="font-semibold text-zinc-900 mb-4">Começar com um template</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {triggerTemplates.map(({ icon: Icon, name, desc }) => (
            <button key={name} className="bg-white border border-zinc-100 rounded-xl p-4 text-left hover:border-zinc-300 hover:shadow-sm transition-all group">
              <div className="w-9 h-9 bg-zinc-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-zinc-200 transition-colors">
                <Icon size={16} className="text-zinc-600" />
              </div>
              <p className="text-sm font-medium text-zinc-900">{name}</p>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
