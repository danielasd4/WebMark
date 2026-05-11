import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  CreditCard, 
  Clock, 
  Tag, 
  Search, 
  Plus, 
  ChevronDown, 
  Filter,
  Wallet,
  Repeat,
  ShoppingBag,
  Home,
  Utensils,
  Zap,
  Bus,
  HeartPulse,
  GraduationCap,
  Baby,
  Palmtree,
  Church,
  Settings,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Send,
  Sparkles,
  ChevronLeft,
  TrendingUp,
  Trash2,
  Archive
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Company, Transaction, RecurringBill } from '../hooks/useDashboardData';
import { DashboardCard } from './DashboardCard';
import { InsightCard } from './InsightCard';

interface FamilyOfficeViewProps {
  companies: Company[];
  transactions: Transaction[];
  personalTransactions?: Transaction[];
  recurringBills: RecurringBill[];
  onAddTransaction: (data: any) => void;
  onUpdateTransaction: (id: string, data: any) => void;
  onEditTransaction?: (tx: any) => void;
  onDeleteTransaction?: (id: string) => void;
  onAddSubscription?: () => void;
}

export const FamilyOfficeView = ({ 
  companies, 
  transactions: familyTransactions, 
  personalTransactions = [],
  recurringBills,
  onAddTransaction,
  onUpdateTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onAddSubscription
}: FamilyOfficeViewProps) => {
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [subContext, setSubContext] = useState<'all' | 'family' | 'personal'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const transactions = useMemo(() => {
    let list = [];
    if (subContext === 'family') list = familyTransactions;
    else if (subContext === 'personal') list = personalTransactions;
    else list = [...familyTransactions, ...personalTransactions];

    // Remove duplicatas por ID para evitar que transações unificadas apareçam duas vezes
    const uniqueMap = new Map();
    list.forEach(tx => uniqueMap.set(tx.id, tx));
    return Array.from(uniqueMap.values());
  }, [familyTransactions, personalTransactions, subContext]);

  const familyCompanyIds = useMemo(() => 
    companies.filter(c => c.company_type === 'Financeiro Pessoal').map(c => c.id),
    [companies]
  );

  const metrics = useMemo(() => {
    const income = transactions.filter((tx: any) => tx.type === 'income').reduce((acc: number, tx: any) => acc + (tx.amount || 0), 0);
    const expense = transactions.filter((tx: any) => tx.type === 'expense').reduce((acc: number, tx: any) => acc + (tx.amount || 0), 0);

    return {
      totalBalance: income - expense, 
      monthlyIncome: income,
      monthlyExpense: expense,
      toReceive: 0,
      toPay: transactions.filter(t => t.type === 'expense' && t.status === 'pending').reduce((acc, t) => acc + t.amount, 0),
    };
  }, [transactions]);

  const dynamicInsights = useMemo(() => {
    const insights = [];
    const now = new Date();
    const thisMonth = now.getMonth();
    
    const catTotals: Record<string, number> = {};
    transactions
      .filter(tx => new Date(tx.transaction_date).getMonth() === thisMonth && tx.type === 'expense')
      .forEach(tx => {
        catTotals[tx.category] = (catTotals[tx.category] || 0) + (tx.amount || 0);
      });

    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    
    if (sortedCats.length > 0) {
      const [topCat, amount] = sortedCats[0];
      insights.push({
        id: 1,
        text: `Vocês já dedicaram ${formatCurrency(amount)} para ${topCat} este mês.`,
        type: amount > 2000 ? 'warning' : 'info'
      });
    }

    if (metrics.monthlyIncome > 0 && metrics.monthlyExpense > metrics.monthlyIncome) {
      insights.push({
        id: 2,
        text: "As saídas da casa estão superando o que entrou este mês. Atenção ao planejamento!",
        type: "danger"
      });
    } else if (metrics.monthlyIncome > 0) {
      const savingsRate = Math.round(((metrics.monthlyIncome - metrics.monthlyExpense) / metrics.monthlyIncome) * 100);
      if (savingsRate > 10) {
        insights.push({
          id: 3,
          text: `Parabéns! Vocês estão poupando ${savingsRate}% da renda familiar este mês.`,
          type: "success"
        });
      }
    }

    return insights.length > 0 ? insights : [
      { id: 0, text: "Sua casa ainda não tem registros este mês. Que tal começar anotando o mercado ou as contas fixas?", type: "success" }
    ];
  }, [transactions, metrics]);

  const tabs = [
    { id: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'transacoes', label: 'Transações', icon: Repeat },
    { id: 'parcelamentos', label: 'Parcelamentos', icon: CreditCard },
    { id: 'assinaturas', label: 'Assinaturas', icon: Zap },
    { id: 'categorias', label: 'Categorias', icon: Tag },
    { id: 'cartoes', label: 'Cartões', icon: Wallet },
  ];

  // --- REFACTOR: Moving Hooks to Top Level (Rules of Hooks) ---
  const installmentGroups = useMemo(() => {
    const groups: Record<string, { 
      title: string, 
      totalAmount: number, 
      paidAmount: number, 
      totalInstallments: number, 
      paidInstallments: number,
      category: string
    }> = {};

    transactions.forEach(tx => {
      const match = (tx.description || '').match(/(.*?)\s*\(?(\d+)\s*\/\s*(\d+)\)?/i);
      if (match) {
        const [_, baseTitle, current, total] = match;
        const trimmedTitle = (baseTitle || '').trim() || 'Compra Parcelada';
        if (!groups[trimmedTitle]) {
          groups[trimmedTitle] = {
            title: trimmedTitle,
            totalAmount: (tx.amount || 0) * parseInt(total),
            paidAmount: 0,
            totalInstallments: parseInt(total),
            paidInstallments: 0,
            category: tx.category || 'Outros'
          };
        }
        groups[trimmedTitle].paidAmount += (tx.amount || 0);
        groups[trimmedTitle].paidInstallments += 1;
      }
    });

    return Object.values(groups);
  }, [transactions]);

  const categoryMetrics = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const catTotals: Record<string, number> = {};
    transactions
      .filter((tx: any) => {
        const d = new Date(tx.transaction_date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear && tx.type === 'expense';
      })
      .forEach(tx => {
        const cat = tx.category || 'Outros';
        catTotals[cat] = (catTotals[cat] || 0) + (tx.amount || 0);
      });

    const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...Object.values(catTotals), 1);
    
    return { sorted, max };
  }, [transactions]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-zinc-100/50 p-1 rounded-xl border border-zinc-200/50 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-white text-zinc-900 shadow-sm border border-zinc-200" 
                  : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onAddTransaction({ type: 'expense', context_type: 'family' })}
            className="btn-primary"
          >
            <Plus size={16} />
            Nova Transação
          </button>
        </div>
      </div>

      {activeTab === 'visao-geral' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="glass-card bg-zinc-900 border-none p-8 relative overflow-hidden group rounded-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <Sparkles size={18} />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Inteligência Vency Hub</span>
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Família Barbosa</h2>
                <p className="text-zinc-400 text-sm max-w-md font-medium leading-relaxed">
                  Planejamento do Casal: Vocês têm <span className="text-emerald-400 font-bold">{formatCurrency(metrics.monthlyIncome - metrics.monthlyExpense)}</span> disponíveis para investimentos ou lazer este mês.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md text-right">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Dinheiro em Conta</p>
                  <p className="text-2xl font-bold text-white tracking-tighter">{formatCurrency(metrics.totalBalance)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardCard title="O que Entrou" value={metrics.monthlyIncome} icon={ArrowUpRight} variant="success" priority="high" />
            <DashboardCard title="O que Saiu" value={metrics.monthlyExpense} icon={ArrowDownLeft} variant="danger" />
            <DashboardCard title="Sobra do Mês" value={metrics.monthlyIncome - metrics.monthlyExpense} icon={Wallet} variant={(metrics.monthlyIncome - metrics.monthlyExpense) >= 0 ? "success" : "danger"} />
            <DashboardCard title="Boletos a Pagar" value={metrics.toPay} icon={Calendar} variant="warning" subtitle="Próximos dias" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                  <Repeat size={18} className="text-emerald-500" />
                  Atividades Recentes
                </h3>
                <button onClick={() => setActiveTab('transacoes')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest">Ver Histórico</button>
              </div>
              
              <div className="glass-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50/50">
                        <th className="px-6 py-4 text-[11px] font-black text-zinc-400 uppercase tracking-widest">Data</th>
                        <th className="px-6 py-4 text-[11px] font-black text-zinc-400 uppercase tracking-widest">Descrição</th>
                        <th className="px-6 py-4 text-[11px] font-black text-zinc-400 uppercase tracking-widest">Valor</th>
                        <th className="px-6 py-4 text-[11px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {transactions.slice(0, 5).map(tx => (
                        <tr key={tx.id} className="hover:bg-zinc-50 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="text-[12px] font-bold text-zinc-400">
                              {new Date(tx.transaction_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-zinc-900">{tx.description}</span>
                              <span className="text-[11px] font-medium text-zinc-500">{tx.category}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-sm font-black",
                              tx.type === 'income' ? "text-emerald-600" : "text-zinc-900"
                            )}>
                              {tx.type === 'expense' ? '-' : '+'} {formatCurrency(tx.amount || 0)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("badge-success", tx.status !== 'paid' && "badge-warning")}>
                              {tx.status === 'paid' ? 'Pago' : 'Pendente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-500" />
                Insights IA
              </h3>
              <div className="space-y-4">
                {dynamicInsights.map((insight) => (
                  <InsightCard 
                    key={insight.id}
                    text={insight.text}
                    type={insight.type as any}
                  />
                ))}
              </div>

              <h3 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2 pt-4">
                <Calendar size={18} className="text-amber-500" />
                Próximos Vencimentos
              </h3>
              <div className="glass-card p-4 space-y-3">
                {recurringBills
                  .filter(bill => familyCompanyIds.includes(bill.company_id))
                  .slice(0, 3)
                  .map(bill => (
                    <div key={bill.id} className="flex items-center justify-between p-2 hover:bg-zinc-50 rounded-lg transition-colors border border-transparent hover:border-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                          <Clock size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-900">{bill.title}</span>
                          <span className="text-[10px] font-medium text-zinc-400">Vence dia {bill.due_day}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-zinc-900">{formatCurrency(bill.amount)}</span>
                    </div>
                  ))}
                <button 
                  onClick={() => setActiveTab('assinaturas')}
                  className="w-full py-2 text-[10px] font-black text-zinc-400 hover:text-zinc-600 uppercase tracking-widest border-t border-zinc-100 mt-2 transition-colors"
                >
                  Ver Agenda Completa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transacoes' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Pesquisar histórico..." 
                className="input-premium pl-10 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-zinc-100/50 p-1 rounded-lg border border-zinc-200">
                <button onClick={() => setFilterType('all')} className={cn("px-3 py-1 text-[11px] font-bold rounded-md transition-all", filterType === 'all' ? "bg-white text-zinc-900 shadow-sm border border-zinc-200" : "text-zinc-500")}>Tudo</button>
                <button onClick={() => setFilterType('income')} className={cn("px-3 py-1 text-[11px] font-bold rounded-md transition-all", filterType === 'income' ? "bg-white text-emerald-600 shadow-sm border border-zinc-200" : "text-zinc-500")}>O que entrou</button>
                <button onClick={() => setFilterType('expense')} className={cn("px-3 py-1 text-[11px] font-bold rounded-md transition-all", filterType === 'expense' ? "bg-white text-rose-600 shadow-sm border border-zinc-200" : "text-zinc-500")}>O que saiu</button>
              </div>
              <button className="btn-secondary h-10 px-3"><Filter size={14} /> Filtros</button>
            </div>
          </div>

          <div className="glass-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    <th className="px-6 py-4 text-[11px] font-black text-zinc-400 uppercase tracking-widest">Conta</th>
                    <th className="px-6 py-4 text-[11px] font-black text-zinc-400 uppercase tracking-widest">Data</th>
                    <th className="px-6 py-4 text-[11px] font-black text-zinc-400 uppercase tracking-widest">Descrição</th>
                    <th className="px-6 py-4 text-[11px] font-black text-zinc-400 uppercase tracking-widest">Categoria</th>
                    <th className="px-6 py-4 text-[11px] font-black text-zinc-400 uppercase tracking-widest text-right">Valor</th>
                    <th className="px-6 py-4 text-[11px] font-black text-zinc-400 uppercase tracking-widest text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-zinc-50 transition-colors group">
                      <td className="px-6 py-4"><div className="flex items-center gap-2 text-[12px] font-bold text-zinc-600"><Wallet size={14}/> {companies.find(c => c.id === tx.company_id)?.name || 'Carteira'}</div></td>
                      <td className="px-6 py-4 text-[12px] font-bold text-zinc-400">{new Date(tx.transaction_date).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4"><div className="flex flex-col"><span className="text-sm font-bold text-zinc-900">{tx.description}</span><span className="text-[11px] font-medium text-zinc-400">{tx.subcategory || 'Liquidado'}</span></div></td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase tracking-widest border border-zinc-200">
                          {tx.category === 'Mercado' && <ShoppingBag size={10} />}
                          {tx.category === 'Alimentação' && <Utensils size={10} />}
                          {tx.category === 'Moradia' && <Home size={10} />}
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-sm">{tx.type === 'expense' ? '-' : '+'} {formatCurrency(tx.amount || 0)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => onUpdateTransaction(tx.id, { ...tx, status: tx.status === 'paid' ? 'pending' : 'paid' })}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              tx.status === 'paid' ? "text-emerald-500 hover:bg-emerald-50" : "text-zinc-400 hover:bg-zinc-100"
                            )}
                            title={tx.status === 'paid' ? "Marcar como pendente" : "Marcar como pago"}
                          >
                            <div className="w-4 h-4 border-2 border-current rounded-sm flex items-center justify-center">
                              {tx.status === 'paid' && <div className="w-2 h-2 bg-current rounded-sm" />}
                            </div>
                          </button>
                          <button 
                            onClick={() => onEditTransaction ? onEditTransaction(tx) : onUpdateTransaction(tx.id, tx)}
                            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                            title="Editar transação"
                          >
                            <Settings size={14} />
                          </button>
                          <button 
                            onClick={() => onDeleteTransaction && onDeleteTransaction(tx.id)}
                            className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Excluir permanentemente"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-zinc-50/30">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Mostrando {transactions.length} registros</span>
              <div className="flex gap-2">
                <button className="btn-secondary py-1 px-3 text-[11px]">Anterior</button>
                <button className="btn-primary py-1 px-3 text-[11px]">1</button>
                <button className="btn-secondary py-1 px-3 text-[11px]">Próximo</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assinaturas' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              Suas Assinaturas e Contas Fixas
            </h3>
            <button 
              onClick={onAddSubscription}
              className="btn-primary text-xs h-9"
            >
              <Plus size={14} /> Nova Assinatura
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recurringBills
              .filter(bill => familyCompanyIds.includes(bill.company_id))
              .map(bill => (
                <div key={bill.id} className="glass-card p-6 flex flex-col gap-4 group hover:border-emerald-500/30 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      <Zap size={20} />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Vence dia</p>
                      <p className="text-lg font-bold text-zinc-900">{bill.due_day}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900">{bill.title}</h4>
                    <p className="text-[11px] font-medium text-zinc-500">{bill.category}</p>
                  </div>
                  <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-lg font-black text-zinc-900">{formatCurrency(bill.amount)}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                      Ativa
                    </span>
                  </div>
                </div>
              ))}
            {recurringBills.filter(bill => familyCompanyIds.includes(bill.company_id)).length === 0 && (
              <div className="col-span-full py-20 text-center glass-card border-dashed">
                <p className="text-zinc-400 font-medium">Nenhum boleto ou assinatura recorrente da casa cadastrada ainda.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'parcelamentos' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <CreditCard size={18} className="text-indigo-500" />
              Controle de Parcelamentos
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {installmentGroups.map(group => (
              <div key={group.title} className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-500/20 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900">{group.title}</h4>
                    <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{group.category}</p>
                  </div>
                </div>

                <div className="flex-1 max-w-md">
                  <div className="flex justify-between text-[11px] font-black text-zinc-400 mb-2 uppercase tracking-widest">
                    <span>Progresso: {group.paidInstallments}/{group.totalInstallments} parcelas</span>
                    <span>{group.totalAmount > 0 ? Math.round((group.paidAmount / group.totalAmount) * 100) : 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${group.totalAmount > 0 ? (group.paidAmount / group.totalAmount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Restam</p>
                  <p className="text-lg font-black text-zinc-900">{formatCurrency(Math.max(0, group.totalAmount - group.paidAmount))}</p>
                </div>
              </div>
            ))}

            {transactions.filter(tx => (tx.description || '').includes('/')).length === 0 && (
              <div className="py-20 text-center glass-card border-dashed">
                <p className="text-zinc-400 font-medium">Não encontramos nenhum parcelamento (como carro ou móveis) por aqui.</p>
                <p className="text-[11px] text-zinc-500 mt-2">Dica do Casal: Use "(1/10)" na descrição para rastrear as parcelas.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'categorias' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <Tag size={18} className="text-rose-500" />
              Gastos por Categoria (Mês Atual)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categoryMetrics.sorted.map(([cat, total]) => (
              <div key={cat} className="glass-card p-6 space-y-4 hover:border-emerald-500/20 transition-all group">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                      {(cat || '').toLowerCase().includes('mercado') && <ShoppingBag size={18} />}
                      {(cat || '').toLowerCase().includes('aliment') && <Utensils size={18} />}
                      {(cat || '').toLowerCase().includes('mora') && <Home size={18} />}
                      {(cat || '').toLowerCase().includes('trans') && <Bus size={18} />}
                      {(cat || '').toLowerCase().includes('lazer') && <Palmtree size={18} />}
                      {(cat || '').toLowerCase().includes('saúd') && <HeartPulse size={18} />}
                      {(cat || '').toLowerCase().includes('educ') && <GraduationCap size={18} />}
                      {(cat || '').toLowerCase().includes('pet') && <Baby size={18} />}
                      {(cat || '').toLowerCase().includes('carro') && <Send size={18} />}
                      {(cat || '').toLowerCase().includes('invest') && <TrendingUp size={18} />}
                      {(!['mercado', 'aliment', 'mora', 'trans', 'lazer', 'saúd', 'educ', 'pet', 'carro', 'invest'].some(k => (cat || '').toLowerCase().includes(k))) && <Tag size={18} />}
                    </div>
                    <span className="font-bold text-zinc-900">{cat}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-zinc-900">{formatCurrency(total)}</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-zinc-50 rounded-full overflow-hidden border border-zinc-100">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700" 
                    style={{ width: `${categoryMetrics.max > 0 ? (total / categoryMetrics.max) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    {metrics.monthlyExpense > 0 ? Math.round((total / metrics.monthlyExpense) * 100) : 0}% do orçamento
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'cartoes' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <CreditCard size={18} className="text-zinc-900" />
              Gestão de Cartões e Contas
            </h3>
            <button className="btn-primary text-xs h-9">
              <Plus size={14} /> Novo Cartão
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.filter(c => c.company_type === 'Financeiro Pessoal').map(card => (
              <div key={card.id} className="glass-card p-6 bg-zinc-900 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16 rounded-full" />
                
                <div className="relative z-10 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-6 bg-zinc-800 rounded border border-zinc-700 flex items-center justify-center">
                      <div className="w-4 h-3 bg-amber-500/20 rounded-sm" />
                    </div>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Premium Card</span>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Apelido do Cartão</p>
                    <h4 className="text-lg font-bold text-white">{card.name}</h4>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Saldo Atual</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(card.current_balance || 0)}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="glass-card p-6 border-dashed border-2 flex flex-col items-center justify-center text-center group hover:border-zinc-300 transition-all cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 mb-4 group-hover:bg-zinc-100 group-hover:text-zinc-500 transition-all">
                <Plus size={24} />
              </div>
              <p className="text-sm font-bold text-zinc-400 group-hover:text-zinc-600 transition-all">Adicionar novo cartão</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
