import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Mail, Send, X, ArrowRight } from 'lucide-react'
import { Button } from './ui/Button'

const STORAGE_KEY = 'webmark_onboarding_done'

const steps = [
  {
    icon: Users,
    color: 'bg-blue-50 text-blue-600',
    title: 'Cadastre seus contatos',
    desc: 'Adicione manualmente, importe CSV ou deixe a IA ler um cartão de visita.',
  },
  {
    icon: Mail,
    color: 'bg-violet-50 text-violet-600',
    title: 'Crie uma campanha',
    desc: 'Escolha um template, escreva o e-mail e defina o assunto em minutos.',
  },
  {
    icon: Send,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Dispare para sua lista',
    desc: 'Envie agora ou agende para o melhor horário. Veja abertura e cliques em tempo real.',
  },
]

export function OnboardingWelcome() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY))

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  const startCampaign = () => {
    dismiss()
    navigate('/app/campaigns/new')
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center mb-3">
              <Mail size={18} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900">Bem-vindo ao WebMark!</h2>
            <p className="text-sm text-zinc-500 mt-1">Envie seu primeiro e-mail em 3 passos simples.</p>
          </div>
          <button
            onClick={dismiss}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Steps */}
        <div className="px-6 space-y-3">
          {steps.map(({ icon: Icon, color, title, desc }, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-400">{i + 1}</span>
                  <p className="text-sm font-semibold text-zinc-900">{title}</p>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="p-6 pt-5 flex gap-3">
          <Button variant="outline" onClick={dismiss} className="flex-1">
            Explorar depois
          </Button>
          <Button onClick={startCampaign} className="flex-1" icon={<ArrowRight size={14} />}>
            Criar campanha
          </Button>
        </div>
      </div>
    </div>
  )
}
