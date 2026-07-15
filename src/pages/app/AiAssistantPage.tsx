import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, User, Paperclip, RefreshCw } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const suggestions = [
  'Criar um assunto de e-mail para campanha de verão',
  'Segmentar contatos que abriram mais de 3 campanhas',
  'Escrever uma sequência de boas-vindas em 3 e-mails',
  'Analisar minha taxa de abertura e dar sugestões',
  'Criar uma campanha de reativação para leads inativos',
]

const initialMessages: Message[] = [
  {
    id: '0',
    role: 'assistant',
    content: 'Olá! Sou o assistente de IA do WebMark. Posso ajudar você a:\n\n• Criar campanhas e assuntos de e-mail\n• Segmentar e encontrar contatos\n• Escrever newsletters e templates\n• Configurar automações\n• Analisar resultados e dar sugestões\n\nComo posso ajudar hoje?',
    timestamp: new Date(),
  },
]

export function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Simulated AI response (integrate with Anthropic API here)
    await new Promise(r => setTimeout(r, 1200))
    const responses: Record<string, string> = {
      default: 'Entendido! Vou analisar sua solicitação.\n\nBaseado nos dados das suas campanhas, aqui está minha sugestão:\n\n**Para a campanha de reativação:**\n\n📧 **Assunto:** "Sentimos sua falta — temos algo especial para você"\n\n📝 **Corpo do e-mail:**\nOlá [Nome],\n\nPercebemos que faz um tempo que não falamos. Preparamos uma oferta exclusiva especialmente para você: **30% de desconto** válido apenas por 48 horas.\n\n[BOTÃO: Aproveitar agora]\n\n💡 **Dica:** Envie entre terça e quinta-feira, às 10h ou 14h — horários com maior taxa de abertura para sua base.',
    }
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responses.default,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, aiMsg])
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">IA Assistente</h1>
          <p className="text-sm text-zinc-400">Powered by Claude — seu especialista em e-mail marketing</p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white border border-zinc-100 rounded-2xl shadow-xs flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'assistant' ? 'bg-zinc-900' : 'bg-zinc-200'
              }`}>
                {msg.role === 'assistant'
                  ? <Sparkles size={14} className="text-white" />
                  : <User size={14} className="text-zinc-600" />
                }
              </div>
              <div className={`max-w-2xl ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-zinc-900 text-white rounded-tr-sm'
                    : 'bg-zinc-50 text-zinc-700 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
                <span className="text-xs text-zinc-300 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-white" />
              </div>
              <div className="bg-zinc-50 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-6 pb-2">
            <p className="text-xs text-zinc-400 mb-2">Sugestões:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:border-zinc-300 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-zinc-100">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte qualquer coisa sobre e-mail marketing, campanhas ou seus contatos..."
                rows={1}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pr-12 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none min-h-[44px] max-h-32"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement
                  t.style.height = 'auto'
                  t.style.height = `${Math.min(t.scrollHeight, 128)}px`
                }}
              />
            </div>
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="text-xs text-zinc-300 mt-2 text-center">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  )
}
