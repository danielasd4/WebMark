import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  Zap,
  Calendar,
  ArrowUpRight,
  PieChart,
  Target,
  BarChart3,
  Briefcase,
  CreditCard,
  Lightbulb,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Sparkles,
  Send,
  CheckCircle2,
  Plus,
  MoreVertical,
  Copy,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { CompanyCard } from './CompanyCard';
import { DashboardCard } from './DashboardCard';
import { InsightCard } from './InsightCard';
import { cn, formatCurrency } from '../lib/utils';
import { Company, Transaction, ProductService } from '../hooks/useDashboardData';
import { generateCompanyInsights } from '../lib/generateInsights';
import { parseSmartTransaction } from '../lib/smartTransactionParser';

interface CompaniesViewProps {
  companies: Company[];
  transactions: Transaction[];
  products: ProductService[];
  collaborators: any[];
  recurringBills?: any[];
  onAddProduct: (data: Partial<ProductService>) => Promise<void>;
  onUpdateProduct: (id: string, data: Partial<ProductService>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onAddCollaborator: (data: any) => Promise<void>;
  onDeleteCollaborator: (id: string) => Promise<void>;
  onAddCompany: (data: any) => Promise<void>;
  onUpdateCompany: (id: string, data: any) => Promise<void>;
  onDeleteCompany: (id: string) => Promise<void>;
  forceSelectedId?: string;
  onAddTransaction: (data: Partial<Transaction>) => Promise<void>;
  onUpdateTransaction?: (id: string, data: any) => void;
  userProfile?: any;
  onUpdateUserProfile?: (data: any) => Promise<void>;
}

export const CompaniesView = ({ 
  companies, 
  transactions, 
  products, 
  collaborators,
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onAddCollaborator,
  onDeleteCollaborator,
  onAddCompany,
  onUpdateCompany,
  onDeleteCompany,
  forceSelectedId,
  recurringBills = [],
  onAddTransaction,
  onUpdateTransaction,
  userProfile,
  onUpdateUserProfile
}: CompaniesViewProps) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(forceSelectedId || null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductService | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCollab, setNewCollab] = useState({ name: '', role: '', monthly_cost: 0 });
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempTotalCash, setTempTotalCash] = useState(userProfile?.total_cash?.toString() || '');

  React.useEffect(() => {
    if (userProfile?.total_cash !== undefined && userProfile?.total_cash !== null) {
      setTempTotalCash(userProfile.total_cash.toString());
    }
  }, [userProfile?.total_cash]);

  const handleSmartInput = (data: any) => {
    onAddTransaction?.(data);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleUpdateBalance = async () => {
    const newBalance = parseFloat(tempTotalCash);
    if (!isNaN(newBalance)) {
      try {
        await onUpdateUserProfile?.({ total_cash: newBalance });
        setShowSettingsModal(false);
      } catch (e) {
        console.error("Erro ao salvar saldo:", e);
      }
    }
  };

  // Safe localStorage helper
  const getSettings = () => {
    try {
      return JSON.parse(localStorage.getItem('user_settings') || '{}');
    } catch {
      return {};
    }
  };
  const settings = getSettings();

  const selectedCompany = companies?.find((c: Company) => c.id === selectedCompanyId);
  
  // Filtro de Mês para o Layout Original
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const companyTxs = useMemo(() => {
    return transactions?.filter((t: Transaction) => {
      if (t.company_id !== selectedCompanyId || t.is_archived) return false;
      const tDate = new Date(t.transaction_date);
      return tDate >= startOfMonth && tDate <= endOfMonth;
    }) || [];
  }, [transactions, selectedCompanyId, currentDate]);

  // Merge com Contas Recorrentes (Visão Preditiva no Layout Padrão)
  const displayTransactions = useMemo(() => {
    if (!selectedCompany) return [];
    const recurrences = (recurringBills || []).filter((r: any) => r.company_id === selectedCompanyId);
    
    const virtual = recurrences.filter((r: any) => {
      return !companyTxs.some((t: any) => t.recurring_bill_id === r.id || (t.description === r.description && t.amount === r.amount));
    }).map((r: any) => ({
      id: `virtual-${r.id}`,
      description: r.description,
      amount: r.amount,
      category: r.category,
      due_date: new Date(currentDate.getFullYear(), currentDate.getMonth(), r.due_day || 10).toISOString(),
      status: 'pending',
      type: 'expense',
      is_virtual: true,
      recurring_bill_id: r.id
    }));

    return [...companyTxs, ...virtual];
  }, [companyTxs, recurringBills, selectedCompanyId, currentDate, selectedCompany]);

  const companyCollabs = (collaborators || []).filter((c: any) => c.company_id === selectedCompanyId);
  
  const revenue = companyTxs.filter((t: Transaction) => t.type === 'income').reduce((acc: number, t: Transaction) => acc + Number(t.amount), 0);
  const teamCosts = companyCollabs.reduce((acc: number, c: any) => acc + Number(c.monthly_cost || 0), 0);
  const otherCosts = companyTxs.filter((t: Transaction) => t.type === 'expense').reduce((acc: number, t: Transaction) => acc + Number(t.amount), 0);
  
  const costs = otherCosts + teamCosts;
  const profit = revenue - costs;
  const hours = companyTxs.reduce((acc: number, t: Transaction) => acc + Number(t.hours_spent || 0), 0);
  const hourValue = hours > 0 ? revenue / hours : 0;
  const predictableRevenue = companyTxs.filter((t: Transaction) => t.type === 'income' && t.recurrence_type === 'recurring').reduce((acc: number, t: Transaction) => acc + Number(t.amount), 0);
  const variableRevenue = companyTxs.filter((t: Transaction) => t.type === 'income' && t.recurrence_type === 'variable').reduce((acc: number, t: Transaction) => acc + Number(t.amount), 0);
  
  // Métricas Detalhadas Família
  const entriesReceived = companyTxs.filter((t: any) => t.type === 'income' && t.status === 'paid').reduce((acc: any, t: any) => acc + Number(t.amount), 0);
  const entriesPending = revenue - entriesReceived;
  const fixedBills = (recurringBills || []).filter((r: any) => r.company_id === selectedCompanyId).reduce((acc: number, r: any) => acc + Number(r.amount), 0);
  
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  // Cálculos Estratégicos para Família
  const isFamily = selectedCompany?.company_type === 'Financeiro Pessoal';
  const pendingExpenses = displayTransactions.filter(t => t.type === 'expense' && t.status !== 'paid').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalCash = Number(userProfile?.total_cash || 0);
  const freeCash = totalCash - pendingExpenses;

  // Projeção Mês Seguinte
  const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  const nextMonthTxs = (transactions || []).filter((t: any) => {
    if (t.company_id !== selectedCompanyId) return false;
    const d = new Date(t.transaction_date);
    return d.getMonth() === nextMonthDate.getMonth() && d.getFullYear() === nextMonthDate.getFullYear();
  });
  const nextMonthRecurring = (recurringBills || []).filter((r: any) => r.company_id === selectedCompanyId);
  
  const nextMonthRev = nextMonthTxs.filter((t: any) => t.type === 'income').reduce((acc: any, t: any) => acc + Number(t.amount), 0);
  const nextMonthExp = nextMonthTxs.filter((t: any) => t.type === 'expense').reduce((acc: any, t: any) => acc + Number(t.amount), 0) + 
                       nextMonthRecurring.reduce((acc: number, r: any) => acc + Number(r.amount), 0);
  
  const nextMonthProjected = nextMonthRev - nextMonthExp;

  // Próximos Vencimentos (7 dias)
  const next7Days = displayTransactions.filter(t => {
    if (t.status === 'paid') return false;
    const d = new Date(t.date || t.due_date || t.transaction_date);
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return d <= nextWeek;
  }).sort((a, b) => new Date(a.date || a.due_date || a.transaction_date).getTime() - new Date(b.date || b.due_date || b.transaction_date).getTime());

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredTransactions = displayTransactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const costItems = [
    ...companyTxs.filter((t: Transaction) => t.type === 'expense').map((t: Transaction) => ({
      name: t.description || t.category,
      value: Number(t.amount)
    })),
    ...(teamCosts > 0 ? [{ name: 'Folha de Pagamento (Equipe)', value: teamCosts }] : [])
  ];

  const companyProducts = products.filter((p: ProductService) => p.company_id === selectedCompanyId);

  const productItems = companyProducts.map((p: ProductService) => {
    const txs = companyTxs.filter((t: Transaction) => t.product_service_id === p.id);
    const rev = txs.reduce((acc: number, t: Transaction) => acc + Number(t.amount), 0);
    const hrs = txs.reduce((acc: number, t: Transaction) => acc + Number(t.hours_spent || 0), 0);
    return {
      ...p,
      real_revenue: rev,
      real_hours: hrs,
      real_hour_value: hrs > 0 ? rev / hrs : 0
    };
  });

  const topRevenueProduct = productItems.length > 0 ? productItems.reduce((max: any, p: any) => p.real_revenue > (max?.real_revenue || 0) ? p : max, productItems[0]) : null;
  const topHourValueProduct = productItems.length > 0 ? productItems.reduce((max: any, p: any) => p.real_hour_value > (max?.real_hour_value || 0) ? p : max, productItems[0]) : null;

  const insights = selectedCompanyId ? generateCompanyInsights(selectedCompanyId, transactions) : [];

  if (!selectedCompany) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6">
          <div className="flex flex-col">
            <h1 className="text-2xl font-display font-semibold tracking-tight text-zinc-900 mb-1">Empresas</h1>
            <p className="text-[13px] text-zinc-500 font-medium">Selecione uma operação para análise estratégica ou gerencie sua equipe.</p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary h-11 px-6 text-sm"
            >
              <Plus size={18} className="mr-2" />
              Nova Empresa
            </button>
            <div className="flex flex-wrap gap-4 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Caixa Total (R$)</span>
              <input 
                type="number" 
                defaultValue={settings.totalCash || 0}
                onBlur={(e) => {
                  const s = getSettings();
                  s.totalCash = Number(e.target.value);
                  localStorage.setItem('user_settings', JSON.stringify(s));
                }}
                className="bg-transparent border-b border-zinc-200 focus:border-zinc-900 outline-none text-[14px] font-bold text-emerald-600 px-1 py-0.5"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Custo Fixo (PF+PJ)</span>
              <input 
                type="number" 
                defaultValue={settings.totalFixedCosts || 0}
                onBlur={(e) => {
                  const s = getSettings();
                  s.totalFixedCosts = Number(e.target.value);
                  localStorage.setItem('user_settings', JSON.stringify(s));
                }}
                className="bg-transparent border-b border-zinc-200 focus:border-zinc-900 outline-none text-[14px] font-bold text-rose-600 px-1 py-0.5"
              />
            </div>
          </div>
        </div>
      </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company: Company) => {
            const compTxs = transactions.filter((t: Transaction) => t.company_id === company.id);
            const r = compTxs.filter((t: Transaction) => t.type === 'income').reduce((a: number, b: Transaction) => a + Number(b.amount), 0);
            return (
              <div 
                key={company.id} 
                onClick={() => setSelectedCompanyId(company.id)}
                className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="glass-card p-6 h-full flex flex-col justify-between hover:border-zinc-300 transition-colors bg-white">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-2.5 bg-zinc-50 border border-zinc-100 rounded-lg">
                        <Building2 className="text-zinc-600" size={20} />
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border",
                        company.status === 'Ativa' ? 'text-emerald-700 bg-emerald-50 border-emerald-200/50' :
                        company.status === 'Parada' ? 'text-zinc-600 bg-zinc-100 border-zinc-200/50' :
                        'text-amber-700 bg-amber-50 border-amber-200/50'
                      )}>
                        {company.status}
                      </span>
                    </div>
                    
                    <h3 className="text-[17px] font-semibold tracking-tight text-zinc-900 leading-tight mb-1">{company.name}</h3>
                    <p className="text-[13px] text-zinc-500 mb-6">{company.company_type}</p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-zinc-100">
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-zinc-500 font-medium">Faturamento Real</span>
                      <span className="font-semibold text-zinc-900">{formatCurrency(r)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-zinc-500 font-medium">Previsibilidade</span>
                      <span className="font-semibold text-zinc-900">{company.predictability}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showAddModal && (
          <CompanyEditModal 
            company={{ name: '', company_type: 'Prestação de Serviço', status: 'Ativa', predictability: 'Fixa', revenue_goal: 0 }}
            onClose={() => setShowAddModal(false)}
            onSave={async (data: any) => {
              await onAddCompany(data);
              setShowAddModal(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <header className="flex items-center gap-4 mb-8 border-b border-zinc-100 pb-6">
        {!forceSelectedId && (
          <button 
            onClick={() => setSelectedCompanyId(null)}
            className="btn-ghost p-2"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-semibold tracking-tight text-zinc-900">{selectedCompany.name}</h1>
            
            {/* Seletor de Mês Integrado ao Layout */}
            <div className="flex items-center bg-zinc-100 rounded-lg p-0.5 ml-4 border border-zinc-200">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1 hover:bg-white rounded text-zinc-400 hover:text-zinc-900">
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 font-bold text-[11px] text-zinc-600 min-w-[100px] text-center capitalize">
                {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentDate)}
              </span>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1 hover:bg-white rounded text-zinc-400 hover:text-zinc-900">
                <ChevronRight size={14} />
              </button>
            </div>

            <button 
              onClick={() => setShowEditModal(true)}
              className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-900 transition-colors"
              title="Editar Empresa"
            >
              <Settings size={16} />
            </button>
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border",
              selectedCompany.status === 'Ativa' ? 'text-emerald-700 bg-emerald-50 border-emerald-200/50' :
              selectedCompany.status === 'Parada' ? 'text-zinc-600 bg-zinc-100 border-zinc-200/50' :
              'text-amber-700 bg-amber-50 border-amber-200/50'
            )}>
              {selectedCompany.status}
            </span>
          </div>
          <p className="text-[13px] text-zinc-500 font-medium mt-0.5">
            {selectedCompany.company_type === 'Financeiro Pessoal' ? 'Gestão Familiar • Casal' : `${selectedCompany.company_type} • ${selectedCompany.predictability}`}
          </p>
        </div>
      </header>

      {/* Entrada Inteligente - Padrão Vency */}
      <div className="glass-card p-2 bg-white/40 border-zinc-200/50 mb-8">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-zinc-400">
            <Sparkles size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Entrada Inteligente: Ex: 'Aluguel R$ 2500 dia 10' ou 'Venda Produto X R$ 500'..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value;
                if (!val) return;
                
                const parsed = parseSmartTransaction(val, companies, products);
                handleSmartInput({
                  type: 'expense', // Fallback caso o parser falhe
                  ...parsed,
                  company_id: selectedCompany.id,
                  transaction_date: parsed.transaction_date || currentDate.toISOString()
                });
                (e.target as HTMLInputElement).value = '';
              }
            }}
            className="w-full bg-transparent border-none focus:ring-0 py-3 pl-12 pr-32 text-sm font-medium text-zinc-900 placeholder:text-zinc-400"
          />
          <div className="absolute right-2 flex items-center gap-2">
            {showSuccessToast && (
              <span className="text-[10px] font-bold text-emerald-600 animate-in fade-in slide-in-from-right-2 duration-300">
                Lançamento realizado!
              </span>
            )}
            <span className="hidden md:block text-[9px] font-bold text-zinc-300 uppercase tracking-widest mr-2">Quick Entry</span>
            <div className="bg-zinc-900 text-white p-1.5 rounded-lg">
              <Send size={14} />
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <CompanyEditModal 
          company={selectedCompany}
          onClose={() => setShowEditModal(false)}
          onSave={async (data: any) => {
            await onUpdateCompany(selectedCompany.id, data);
            setShowEditModal(false);
          }}
          onDelete={async (id: string) => {
            await onDeleteCompany(id);
            setSelectedCompanyId(null);
            setShowEditModal(false);
          }}
        />
      )}

          {/* Métricas Principais Estratégicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <DashboardCard 
              title={isFamily ? "Entradas (Previsto)" : "Faturamento Total"}
              value={revenue} 
              icon={TrendingUp} 
              variant="success"
              priority="high"
              subtitle={isFamily ? `Recebido: ${formatCurrency(entriesReceived)}` : undefined}
            />
            <DashboardCard 
              title={isFamily ? "Contas Fixas / Mês" : "Custos Operacionais"}
              value={isFamily ? fixedBills : costs} 
              icon={isFamily ? Repeat : TrendingDown} 
              variant="danger"
              priority="high"
              subtitle={isFamily ? "Sua base de custo mensal" : undefined}
            />
            <DashboardCard 
              title={isFamily ? "Sobra Estratégica" : "Lucro Líquido"}
              value={profit} 
              icon={DollarSign} 
              variant={profit >= 0 ? "success" : "danger"}
              priority="high"
              subtitle={isFamily ? "O que sobra no final do mês" : "Margem Líquida"}
            />
            {isFamily ? (
              <DashboardCard 
                title="Caixa Disponível"
                value={freeCash} 
                icon={Wallet} 
                variant={freeCash >= 0 ? "info" : "danger"}
                priority="high"
                subtitle={`Saldo Total: ${formatCurrency(totalCash)}`}
              >
                <button 
                  onClick={() => { setTempTotalCash(totalCash.toString()); setShowSettingsModal(true); }}
                  className="mt-2 text-[10px] font-bold text-zinc-400 hover:text-zinc-900 flex items-center gap-1 transition-colors"
                >
                  <Settings size={10} /> Ajustar Saldo
                </button>
              </DashboardCard>
            ) : (
              <DashboardCard 
                title="Valor/Hora Médio"
                value={hourValue} 
                icon={Clock} 
                variant="neutral"
                priority="medium"
              />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Principal: Dashboards e Extrato */}
            <div className="lg:col-span-2 space-y-6">
              {isFamily && next7Days.length > 0 && (
                <section className="glass-card p-6 border-amber-200/50 bg-amber-50/30">
                  <h3 className="text-[12px] font-bold text-amber-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Clock size={14} /> Radar: Vencimentos Próximos (7 dias)
                  </h3>
                  <div className="space-y-3">
                    {next7Days.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-white border border-amber-100 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-black text-amber-600 bg-amber-100 px-2 py-1 rounded">
                            Dia {new Date(tx.date || tx.due_date || tx.transaction_date).getDate()}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-zinc-900 leading-none mb-1">{tx.description}</p>
                            <p className="text-[10px] text-zinc-400 font-medium uppercase">{tx.category}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-zinc-900">{formatCurrency(Number(tx.amount))}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
        {selectedCompany.company_type !== 'Financeiro Pessoal' && (
          <div className={cn(
            "col-span-1 md:col-span-2 p-4 rounded-xl border flex items-center justify-between gap-4",
            hours > (selectedCompany?.max_monthly_hours || 40) 
              ? "bg-rose-50 border-rose-200 text-rose-900" 
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", hours > (selectedCompany?.max_monthly_hours || 40) ? "bg-rose-500 text-white" : "bg-emerald-500 text-white")}>
                <Users size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">Status de Delegação</p>
                <p className="text-[14px] font-bold">
                  {hours > (selectedCompany?.max_monthly_hours || 40) 
                    ? "Hora de contratar um Designer/Operacional!" 
                    : "Carga horária sob controle."}
                </p>
              </div>
            </div>
            <p className="text-[12px] font-medium text-right max-w-[200px]">
              {hours > (selectedCompany?.max_monthly_hours || 40)
                ? `Você ultrapassou sua meta de ${selectedCompany?.max_monthly_hours || 40}h nesta empresa.`
                : `Você ainda tem ${Math.max(0, (selectedCompany?.max_monthly_hours || 40) - hours)}h disponíveis antes de sobrecarregar.`}
            </p>
          </div>
        )}

              {/* Listagem de Transações do Mês - Estilo Extrato Funcional */}
              <section className="glass-card overflow-hidden mt-6">
                <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h3 className="text-[13px] font-semibold text-zinc-600 uppercase tracking-wider flex items-center gap-2">
                      <Calendar size={14} className="text-zinc-400" />
                      Extrato e Projeções
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="Pesquisar..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="text-[12px] pl-8 pr-4 py-1.5 bg-white border border-zinc-200 rounded-md focus:ring-1 focus:ring-zinc-900 outline-none w-48"
                        />
                        <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={12} />
                      </div>
                      <button 
                        onClick={() => onAddTransaction?.({ company_id: selectedCompanyId, transaction_date: currentDate.toISOString() })}
                        className="text-[12px] font-bold text-zinc-900 hover:bg-zinc-200 transition-colors px-3 py-1.5 bg-white border border-zinc-200 rounded-md shadow-sm"
                      >
                        + Novo Lançamento
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <select 
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="text-[11px] font-bold text-zinc-500 bg-white border border-zinc-200 rounded px-2 py-1 outline-none"
                    >
                      <option value="all">Todas Categorias</option>
                      {Array.from(new Set(displayTransactions.map(t => t.category))).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <select 
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="text-[11px] font-bold text-zinc-500 bg-white border border-zinc-200 rounded px-2 py-1 outline-none"
                    >
                      <option value="all">Todos Status</option>
                      <option value="paid">Pago</option>
                      <option value="pending">Pendente</option>
                      <option value="previsto">Previsto</option>
                    </select>
                  </div>
                </div>
                <div className="divide-y divide-zinc-100">
                  {filteredTransactions.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-[13px] text-zinc-400 italic">Nenhum lançamento encontrado para os filtros aplicados.</p>
                    </div>
                  ) : (
                    filteredTransactions.sort((a:any, b:any) => new Date(b.date || b.due_date || b.transaction_date).getTime() - new Date(a.date || a.due_date).getTime()).map((tx: any) => (
                      <div key={tx.id} className={cn(
                        "flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors group",
                        tx.is_virtual && "bg-zinc-50/30 border-l-2 border-l-zinc-200"
                      )}>
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center border bg-white shadow-sm",
                            tx.status === 'paid' ? "text-emerald-600 border-emerald-100" : "text-zinc-400 border-zinc-100"
                          )}>
                            {tx.type === 'income' ? <ArrowUpRight size={18} /> : <DollarSign size={18} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className={cn("text-sm font-bold", tx.status === 'paid' ? "text-zinc-900" : "text-zinc-500")}>
                                {tx.description}
                              </p>
                              {tx.is_virtual && <span className="text-[8px] font-black bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded uppercase">Fixo</span>}
                            </div>
                            <p className="text-[11px] text-zinc-400 font-medium">
                              {tx.category} • {tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString('pt-BR') : 'Sem data'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className={cn("text-sm font-bold font-display", tx.type === 'income' ? "text-emerald-600" : "text-zinc-900")}>
                            {tx.type === 'income' ? '+' : '-'} {formatCurrency(Number(tx.amount))}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {tx.status === 'pending' && (
                              <button 
                                onClick={() => tx.is_virtual ? onAddTransaction?.({ ...tx, status: 'paid', is_virtual: false, id: undefined }) : onUpdateTransaction?.(tx.id, { status: 'paid' })} 
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            )}
                            <button className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-md">
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Coluna Lateral: Sidebar Estratégica (1/3) */}
            <div className="space-y-6">
              {/* Alerta de Previsibilidade */}
              {isFamily && (
                <section className={cn(
                  "glass-card p-5 border-l-4",
                  nextMonthProjected >= 0 ? "border-l-emerald-500 bg-emerald-50/10" : "border-l-rose-500 bg-rose-50/10"
                )}>
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Zap size={14} className={nextMonthProjected >= 0 ? "text-emerald-500" : "text-rose-500"} />
                    Projeção: {new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(nextMonthDate)}
                  </h4>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold text-zinc-900 leading-none mb-1">{formatCurrency(nextMonthProjected)}</p>
                      <p className="text-[11px] text-zinc-500 font-medium">Saldo previsto p/ o mês</p>
                    </div>
                    {nextMonthProjected < 0 && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-1 rounded animate-pulse">Atenção: Déficit</span>
                    )}
                  </div>
                </section>
              )}

              {/* Metas Financeiras (Somente Família) */}
              {isFamily && (
                <section className="glass-card p-6">
                  <h3 className="text-[12px] font-bold text-zinc-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Target size={14} className="text-zinc-400" /> Metas do Casal
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between text-[11px] mb-2">
                        <span className="font-bold text-zinc-600 uppercase">Reserva de Emergência</span>
                        <span className="font-bold text-zinc-900">72%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full w-[72%] shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1.5 font-medium">Faltam R$ 12.400 para o alvo</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-2">
                        <span className="font-bold text-zinc-600 uppercase">Viagem Europa</span>
                        <span className="font-bold text-zinc-900">35%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-900 rounded-full w-[35%]"></div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Gestão de Cartões */}
              {isFamily && (
                <section className="glass-card p-6">
                  <h3 className="text-[12px] font-bold text-zinc-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <CreditCard size={14} className="text-zinc-400" /> Gestão de Cartões
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white border border-zinc-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[10px] font-black text-zinc-400 uppercase leading-none mb-1">Visa Infinite</p>
                          <p className="text-[13px] font-bold text-zinc-900 tracking-tight">Vence dia 15</p>
                        </div>
                        <span className="text-sm font-black text-rose-600">{formatCurrency(costs * 0.4)}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                          <span>Limite Usado: 42%</span>
                          <span>Limite Total: R$ 25.000</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full w-[42%]"></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-zinc-200 opacity-80">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[10px] font-black text-zinc-400 uppercase leading-none mb-1">Inter Mastercard</p>
                          <p className="text-[13px] font-bold text-zinc-900 tracking-tight">Vence dia 05</p>
                        </div>
                        <span className="text-sm font-black text-zinc-900">{formatCurrency(costs * 0.1)}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                          <span>Limite Usado: 15%</span>
                          <span>Limite Total: R$ 10.000</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <div className="h-full bg-zinc-900 rounded-full w-[15%]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Insights Dinâmicos (Para ambos) */}
              <section className="space-y-3">
                <h3 className="text-[12px] font-bold text-zinc-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Lightbulb size={14} className="text-zinc-400" /> Log Estratégico
                </h3>
                {insights.map(insight => (
                  <InsightCard key={insight.id} text={insight.text} type={insight.type} />
                ))}
              </section>
            </div>
          </div>

      {showProductModal && selectedCompanyId && (
        <ProductModal 
          onClose={() => setShowProductModal(false)}
          companyId={selectedCompanyId}
          initialData={editingProduct}
          onSave={editingProduct ? (data: any) => onUpdateProduct(editingProduct.id, data) : onAddProduct}
          onDelete={editingProduct ? () => onDeleteProduct(editingProduct.id) : undefined}
        />
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px]" onClick={() => setShowSettingsModal(false)} />
          <div className="relative bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-zinc-900 mb-4 tracking-tight">Saldo Atual em Conta</h3>
            <p className="text-sm text-zinc-500 mb-6 leading-relaxed">Insira o saldo total disponível hoje em suas contas bancárias para calcular a sobra real.</p>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase mb-1 block tracking-widest">Valor em Reais (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">R$</span>
                  <input 
                    type="number" 
                    className="input-premium h-12 pl-12 text-xl font-bold text-zinc-900"
                    value={tempTotalCash}
                    onChange={e => setTempTotalCash(e.target.value)}
                    placeholder="0,00"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold text-zinc-500 hover:bg-zinc-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUpdateBalance}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20"
                >
                  Salvar Saldo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente Local Modal
const ProductModal = ({ onClose, companyId, initialData, onSave, onDelete }: any) => {
  const [formData, setFormData] = useState<Partial<ProductService>>(initialData || {
    company_id: companyId,
    name: '',
    type: 'serviço',
    average_price: 0,
    average_hours: 0,
    is_recurring: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (e) {
      alert('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white p-6 rounded-xl w-full max-w-md shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
        <h3 className="text-[15px] font-semibold text-zinc-900 tracking-tight mb-6">
          {initialData ? 'Editar Produto/Serviço' : 'Novo Produto/Serviço'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Nome do Item</label>
            <input 
              required
              type="text" 
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="input-premium" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Tipo</label>
              <select 
                value={formData.type || 'serviço'}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="input-premium"
              >
                <option value="serviço">Serviço</option>
                <option value="projeto">Projeto</option>
                <option value="assinatura">Assinatura / SaaS</option>
                <option value="evento">Evento</option>
                <option value="produto digital">Produto Digital</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Recorrência</label>
              <select 
                value={formData.is_recurring ? 'true' : 'false'}
                onChange={e => setFormData({ ...formData, is_recurring: e.target.value === 'true' })}
                className="input-premium"
              >
                <option value="false">Variável (Única)</option>
                <option value="true">Recorrente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Preço Médio (R$)</label>
              <input 
                type="number" 
                value={formData.average_price || 0}
                onChange={e => setFormData({ ...formData, average_price: Number(e.target.value) })}
                className="input-premium" 
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Horas (Est.)</label>
              <input 
                type="number" 
                value={formData.average_hours || 0}
                onChange={e => setFormData({ ...formData, average_hours: Number(e.target.value) })}
                className="input-premium" 
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3 border-t border-zinc-100 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            {initialData && (
              <button type="button" onClick={() => { if(confirm('Excluir?')) onDelete(); onClose(); }} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md font-medium text-[13px] transition-colors">
                Excluir
              </button>
            )}
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente Local Modal de Edição de Empresa
const CompanyEditModal = ({ onClose, company, onSave, onDelete }: any) => {
  const [formData, setFormData] = useState({
    name: company?.name || '',
    company_type: company?.company_type || 'Financeiro Empresarial',
    predictability: company?.predictability || 'Variável',
    status: company?.status || 'Ativa',
    revenue_goal: company?.revenue_goal || 0,
    target_hourly_rate: company?.target_hourly_rate || 0,
    max_monthly_hours: company?.max_monthly_hours || 0
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (e) {
      alert('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white p-6 rounded-xl w-full max-w-md shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
        <h3 className="text-[15px] font-semibold text-zinc-900 tracking-tight mb-6">Configurações da Empresa</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Nome da Empresa</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="input-premium" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Status</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="input-premium"
              >
                <option value="Ativa">Ativa</option>
                <option value="Parada">Parada</option>
                <option value="Em Prospecção">Em Prospecção</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Tipo</label>
              <select 
                value={formData.company_type}
                onChange={e => setFormData({ ...formData, company_type: e.target.value })}
                className="input-premium"
              >
                <option value="Prestação de Serviço">Serviço</option>
                <option value="SaaS">SaaS</option>
                <option value="CLT">CLT</option>
                <option value="Financeiro Pessoal">Pessoal</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100">
            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Metas e Planejamento</h4>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Meta de Faturamento (R$)</label>
                <input 
                  type="number" 
                  value={formData.revenue_goal}
                  onChange={e => setFormData({ ...formData, revenue_goal: Number(e.target.value) })}
                  className="input-premium" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Meta Valor/Hora (R$)</label>
                  <input 
                    type="number" 
                    value={formData.target_hourly_rate}
                    onChange={e => setFormData({ ...formData, target_hourly_rate: Number(e.target.value) })}
                    className="input-premium" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Horas/Mês (Plan.)</label>
                  <input 
                    type="number" 
                    value={formData.max_monthly_hours}
                    onChange={e => setFormData({ ...formData, max_monthly_hours: Number(e.target.value) })}
                    className="input-premium" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3 border-t border-zinc-100 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            {company?.id && (
              <button 
                type="button" 
                onClick={async () => {
                  if(confirm('Tem certeza que deseja excluir esta empresa? Todos os dados vinculados serão perdidos.')) {
                    try {
                      await onDelete(company.id);
                      onClose();
                    } catch (e: any) {
                      alert(e.message || 'Erro ao excluir empresa. Verifique se há transações vinculadas.');
                    }
                  }
                }} 
                className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md font-medium text-[13px] transition-colors"
              >
                Excluir
              </button>
            )}
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Salvando...' : 'Salvar Metas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
