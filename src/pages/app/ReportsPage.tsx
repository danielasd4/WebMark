import { Download, TrendingUp, MousePointerClick, AlertCircle, UserMinus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { StatCard } from '../../components/ui/Card'
import { formatPercent } from '../../lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts'

const monthlyData = [
  { month: 'Jan', abertura: 28.4, cliques: 6.2, bounce: 2.1 },
  { month: 'Fev', abertura: 31.2, cliques: 7.1, bounce: 1.8 },
  { month: 'Mar', abertura: 29.8, cliques: 6.8, bounce: 2.3 },
  { month: 'Abr', abertura: 33.5, cliques: 8.0, bounce: 1.5 },
  { month: 'Mai', abertura: 35.1, cliques: 8.7, bounce: 1.2 },
  { month: 'Jun', abertura: 34.2, cliques: 8.1, bounce: 1.4 },
]

const deviceData = [
  { name: 'Mobile', value: 58 },
  { name: 'Desktop', value: 34 },
  { name: 'Tablet', value: 8 },
]

const COLORS = ['#18181b', '#71717a', '#d4d4d8']

const topCampaigns = [
  { name: 'Promoção Verão', abertura: 41.5, cliques: 12.3 },
  { name: 'Newsletter Jul', abertura: 34.2, cliques: 8.1 },
  { name: 'Boas-vindas', abertura: 62.4, cliques: 18.9 },
  { name: 'Reativação', abertura: 22.1, cliques: 4.7 },
]

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Relatórios</h1>
          <p className="text-zinc-500 mt-1">Visão geral do desempenho das campanhas</p>
        </div>
        <Button variant="outline" size="sm" icon={<Download size={14} />}>
          Exportar CSV
        </Button>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Taxa média de abertura" value="34.2%" change="+5.8pp vs. mês anterior" trend="up" icon={<TrendingUp size={16} />} />
        <StatCard title="Taxa de cliques (CTR)" value="8.1%" change="+1.2pp vs. mês anterior" trend="up" icon={<MousePointerClick size={16} />} />
        <StatCard title="Taxa de bounce" value="1.6%" change="-0.3pp vs. mês anterior" trend="up" icon={<AlertCircle size={16} />} />
        <StatCard title="Descadastros" value="0.4%" change="-0.1pp vs. mês anterior" trend="up" icon={<UserMinus size={16} />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Open/Click rate over time */}
        <div className="lg:col-span-2 bg-white border border-zinc-100 rounded-xl p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-zinc-900 mb-1">Abertura e cliques ao longo do tempo</h2>
          <p className="text-xs text-zinc-400 mb-6">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ab" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#18181b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ border: '1px solid #e4e4e7', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="abertura" stroke="#18181b" strokeWidth={2} fill="url(#ab)" name="Abertura" />
              <Area type="monotone" dataKey="cliques" stroke="#3b82f6" strokeWidth={2} fill="url(#cl)" name="Cliques" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Devices */}
        <div className="bg-white border border-zinc-100 rounded-xl p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-zinc-900 mb-1">Dispositivos</h2>
          <p className="text-xs text-zinc-400 mb-6">De onde as aberturas vieram</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={deviceData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                {deviceData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ border: '1px solid #e4e4e7', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {deviceData.map(({ name, value }, i) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-zinc-600">{name}</span>
                </div>
                <span className="font-medium text-zinc-900">{value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top campaigns */}
      <div className="bg-white border border-zinc-100 rounded-xl p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-zinc-900 mb-6">Top campanhas</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topCampaigns} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} unit="%" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} width={100} />
            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ border: '1px solid #e4e4e7', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="abertura" fill="#18181b" radius={[0, 4, 4, 0]} name="Abertura" />
            <Bar dataKey="cliques" fill="#d4d4d8" radius={[0, 4, 4, 0]} name="Cliques" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
