import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail, Users, Zap, BarChart2, Sparkles, CheckCircle2,
  ArrowRight, Upload, ChevronDown, Star, Shield, Globe,
  TrendingUp, Clock, MessageSquare
} from 'lucide-react'

const plans = [
  { id: 'start', name: 'Start', price: 39.90, sends: '1.000', contacts: '500', color: 'zinc' },
  { id: 'essencial', name: 'Essencial', price: 79.90, sends: '5.000', contacts: '2.500', color: 'zinc', popular: true },
  { id: 'pro', name: 'Pro', price: 149.90, sends: '15.000', contacts: '10.000', color: 'zinc' },
  { id: 'business', name: 'Business', price: 249.90, sends: '50.000', contacts: '30.000', color: 'zinc' },
]

const features = [
  { icon: Sparkles, title: 'IA que organiza seus contatos', desc: 'Arraste qualquer arquivo (PDF, Excel, CSV) e a IA extrai, organiza e deduplica automaticamente.' },
  { icon: Mail, title: 'Campanhas profissionais', desc: 'Editor drag-and-drop, templates prontos e personalização avançada por segmento.' },
  { icon: Zap, title: 'Automações inteligentes', desc: 'Sequências de e-mails, boas-vindas automáticas e fluxos baseados em comportamento.' },
  { icon: BarChart2, title: 'Relatórios em tempo real', desc: 'Taxa de abertura, cliques, bounces e mapa de calor de cliques por campanha.' },
  { icon: Users, title: 'CRM simples e poderoso', desc: 'Histórico completo, tags, segmentação e visão 360° de cada contato.' },
  { icon: Shield, title: 'Segurança e conformidade', desc: 'LGPD, SPF, DKIM, DMARC e gestão de consentimento incluídos.' },
]

const steps = [
  { n: '01', title: 'Crie sua conta', desc: 'Cadastro em menos de 1 minuto, sem cartão de crédito.' },
  { n: '02', title: 'Importe seus contatos', desc: 'Arraste um arquivo ou cole seu texto. A IA faz o resto.' },
  { n: '03', title: 'Crie sua campanha', desc: 'Escolha um template, personalize e agende ou envie agora.' },
  { n: '04', title: 'Acompanhe os resultados', desc: 'Dashboard em tempo real com todas as métricas importantes.' },
]

const testimonials = [
  { name: 'Carla Mendes', role: 'Diretora de Marketing', company: 'TechFlow', text: 'Importei 3.000 contatos de um Excel bagunçado em 4 minutos. A IA organizou tudo automaticamente. Nunca vi nada igual.' },
  { name: 'Ricardo Santos', role: 'CEO', company: 'Pets Online', text: 'Nossa taxa de abertura subiu de 12% para 34% depois de segmentar com o CRM inteligente. Resultado em 2 semanas.' },
  { name: 'Fernanda Costa', role: 'Fundadora', company: 'Escola Digital', text: 'A simplicidade é o diferencial. Minha equipe de 2 pessoas consegue rodar campanhas semanais sem precisar de nenhum treinamento.' },
]

const faqs = [
  { q: 'Preciso de cartão de crédito para testar?', a: 'Não. O período trial de 14 dias é totalmente gratuito e sem necessidade de cartão.' },
  { q: 'Posso importar contatos do meu sistema atual?', a: 'Sim. Suportamos CSV, Excel, PDF, DOCX e até colagem de texto. A IA identifica e organiza os dados automaticamente.' },
  { q: 'O que acontece quando atinjo o limite de envios?', a: 'O sistema bloqueia automaticamente novos envios e avisa você com antecedência para fazer upgrade.' },
  { q: 'Vocês ajudam com a configuração de DNS/SPF/DKIM?', a: 'Sim! Temos um guia passo a passo e suporte por e-mail para configurar seu domínio próprio.' },
  { q: 'Existe contrato de fidelidade?', a: 'Não. Você pode cancelar a qualquer momento. Cobramos mensalmente, sem multa.' },
]

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Mail size={14} className="text-white" />
            </div>
            <span className="font-semibold text-zinc-900">WebMark</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-zinc-500">
            <a href="#features" className="hover:text-zinc-900 transition-colors">Recursos</a>
            <a href="#how" className="hover:text-zinc-900 transition-colors">Como funciona</a>
            <a href="#plans" className="hover:text-zinc-900 transition-colors">Planos</a>
            <a href="#faq" className="hover:text-zinc-900 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Entrar
            </Link>
            <Link
              to="/auth/register"
              className="h-8 px-4 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors flex items-center"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center bg-gradient-to-b from-zinc-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-zinc-100 rounded-full px-4 py-1.5 text-sm font-medium text-zinc-600 mb-6">
            <Sparkles size={14} />
            IA que organiza seus contatos automaticamente
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-zinc-900 tracking-tight leading-tight mb-6">
            CRM + E-mail Marketing<br />
            <span className="text-zinc-400">sem complicação</span>
          </h1>
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Importe seus contatos com IA, crie campanhas profissionais e acompanhe resultados em tempo real.
            Do zero ao envio em menos de 10 minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/auth/register"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 transition-colors text-base"
            >
              Começar grátis por 14 dias
              <ArrowRight size={18} />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 border border-zinc-200 text-zinc-700 font-medium rounded-xl hover:bg-zinc-50 transition-colors text-base"
            >
              Ver como funciona
            </a>
          </div>
          <p className="text-sm text-zinc-400 mt-4">Sem cartão de crédito · Cancele quando quiser</p>
        </div>

        {/* Mock dashboard */}
        <div className="max-w-5xl mx-auto mt-16 bg-white border border-zinc-200 rounded-2xl shadow-2xl shadow-zinc-100 overflow-hidden">
          <div className="bg-zinc-50 border-b border-zinc-100 h-10 flex items-center px-4 gap-2">
            <div className="w-3 h-3 bg-zinc-200 rounded-full" />
            <div className="w-3 h-3 bg-zinc-200 rounded-full" />
            <div className="w-3 h-3 bg-zinc-200 rounded-full" />
            <span className="text-xs text-zinc-400 ml-2">app.webmark.com.br/dashboard</span>
          </div>
          <div className="grid grid-cols-4 gap-4 p-6">
            {[
              { label: 'Contatos', value: '2.847', change: '+12%' },
              { label: 'Campanhas', value: '18', change: '+3 este mês' },
              { label: 'Taxa de abertura', value: '34.2%', change: '+8.4pp' },
              { label: 'Cliques', value: '1.204', change: '+22%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-zinc-50 rounded-xl p-4 text-left">
                <p className="text-xs text-zinc-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-semibold text-zinc-900">{stat.value}</p>
                <p className="text-xs text-emerald-600 font-medium">{stat.change}</p>
              </div>
            ))}
          </div>
          <div className="px-6 pb-6">
            <div className="bg-zinc-50 rounded-xl p-4 h-32 flex items-end gap-1">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-zinc-200 rounded-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">Tudo que você precisa, nada que você não usa</h2>
            <p className="text-lg text-zinc-500 max-w-xl mx-auto">
              Uma plataforma completa projetada para ser usada sem treinamento.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm mb-4">
                  <Icon size={18} className="text-zinc-700" />
                </div>
                <h3 className="font-semibold text-zinc-900 mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6 bg-zinc-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Do cadastro ao envio em minutos</h2>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto">
              Quatro passos para sua primeira campanha profissional.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="text-center">
                <div className="text-5xl font-bold text-zinc-700 mb-4">{n}</div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Upload demo */}
          <div className="mt-16 bg-zinc-800 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-zinc-700 rounded-xl flex items-center justify-center">
                  <Upload size={18} className="text-zinc-300" />
                </div>
                <div>
                  <p className="font-semibold text-white">Importação com IA</p>
                  <p className="text-xs text-zinc-400">Suporta PDF, Excel, CSV, DOCX, imagens</p>
                </div>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Arraste qualquer arquivo com seus contatos. Nossa IA identifica nomes, e-mails, telefones, empresas e cargos automaticamente, mesmo de arquivos desorganizados.
              </p>
            </div>
            <div className="flex-1 bg-zinc-900 rounded-xl p-4 w-full">
              <div className="border-2 border-dashed border-zinc-600 rounded-lg p-8 text-center">
                <Upload size={24} className="text-zinc-500 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">Arraste seus arquivos aqui</p>
                <p className="text-xs text-zinc-600 mt-1">PDF, Excel, CSV, DOCX, TXT, Imagem</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">O que nossos clientes dizem</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, company, text }) => (
              <div key={name} className="bg-zinc-50 rounded-xl p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-700 text-sm leading-relaxed mb-6">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-zinc-200 rounded-full flex items-center justify-center text-xs font-semibold text-zinc-600">
                    {name.split(' ').map(n => n[0]).join('').slice(0,2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{name}</p>
                    <p className="text-xs text-zinc-400">{role}, {company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="py-24 px-6 bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">Planos simples e transparentes</h2>
            <p className="text-lg text-zinc-500">Sem surpresas. Cancele quando quiser.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl p-6 border ${plan.popular ? 'border-zinc-900 shadow-xl' : 'border-zinc-100 shadow-sm'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-zinc-900 text-white text-xs font-medium px-3 py-1 rounded-full">Mais popular</span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-semibold text-zinc-900 mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-zinc-900">R${plan.price.toFixed(2).replace('.', ',')}</span>
                    <span className="text-zinc-400 text-sm">/mês</span>
                  </div>
                </div>
                <div className="space-y-3 mb-8">
                  {[
                    `${plan.sends} envios/mês`,
                    `${plan.contacts} contatos`,
                    'Automações incluídas',
                    'Relatórios completos',
                    'Suporte por e-mail',
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      <span className="text-zinc-600">{f}</span>
                    </div>
                  ))}
                </div>
                <Link
                  to="/auth/register"
                  className={`w-full flex items-center justify-center h-9 rounded-lg text-sm font-medium transition-colors ${
                    plan.popular
                      ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                      : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  Começar grátis
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-zinc-500 text-sm">
              Precisa de mais?{' '}
              <a href="mailto:contato@webmark.com.br" className="text-zinc-900 font-medium hover:underline">
                Fale conosco sobre o plano Enterprise
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">Perguntas frequentes</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {faqs.map(({ q, a }, i) => (
              <div key={i} className="py-5">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left"
                >
                  <span className="font-medium text-zinc-900">{q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-zinc-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <p className="mt-3 text-sm text-zinc-500 leading-relaxed">{a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-zinc-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Pronto para crescer?</h2>
          <p className="text-zinc-400 text-lg mb-10">
            Comece grátis hoje e envie sua primeira campanha ainda esta semana.
          </p>
          <Link
            to="/auth/register"
            className="inline-flex items-center gap-2 h-12 px-8 bg-white text-zinc-900 font-semibold rounded-xl hover:bg-zinc-100 transition-colors text-base"
          >
            Criar conta grátis
            <ArrowRight size={18} />
          </Link>
          <p className="text-zinc-500 text-sm mt-4">14 dias grátis · Sem cartão · Cancele quando quiser</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 text-zinc-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-zinc-800 rounded-lg flex items-center justify-center">
                  <Mail size={14} className="text-white" />
                </div>
                <span className="font-semibold text-white">WebMark</span>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                CRM Inteligente + E-mail Marketing para pequenas e médias empresas.
              </p>
            </div>
            {[
              { title: 'Produto', links: ['Recursos', 'Planos', 'API', 'Integrações'] },
              { title: 'Empresa', links: ['Sobre', 'Blog', 'Carreiras', 'Contato'] },
              { title: 'Legal', links: ['Privacidade', 'Termos', 'LGPD', 'Cookies'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="font-semibold text-white text-sm mb-4">{title}</h4>
                <ul className="space-y-2.5">
                  {links.map((l) => (
                    <li key={l}><a href="#" className="text-sm hover:text-white transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-600">© 2024 WebMark. Todos os direitos reservados.</p>
            <p className="text-xs text-zinc-600">Feito com ❤ no Brasil</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
