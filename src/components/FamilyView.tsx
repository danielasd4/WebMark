import React, { useState, useMemo } from 'react';
import { 
  Home, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Clock, 
  ArrowUpRight, 
  Wallet,
  CreditCard,
  Utensils,
  GraduationCap,
  Zap,
  Phone,
  Heart,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  Repeat,
  ArrowRight,
  Loader2,
  PiggyBank,
  ShieldCheck,
  CreditCard as CardIcon,
  LineChart,
  Sparkles,
  Send
} from 'lucide-react';
import { cn } from '../lib/utils';

export const FamilyView = ({ 
  companies = [], 
  transactions = [], 
  recurringBills = [], 
  onAddTransaction, 
  onUpdateTransaction,
  onConfirmVirtual 
}: any) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'contas' | 'entradas' | 'investimentos'>('contas');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Estado para Entrada Inteligente
  const [smartInput, setSmartInput] = useState('');
  const [isProcessingSmart, setIsProcessingSmart] = useState(false);

  const familyCompany = companies.find((c: any) => c.company_type === 'Financeiro Pessoal');
  
  // Helpers de Data
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const formatDateLong = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(dateStr));
    } catch (e) {
      return '-';
    }
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  // Lógica de Entrada Inteligente (Simulada para agilidade, mas integrada ao onAddTransaction)
  const handleSmartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartInput.trim() || !familyCompany) return;

    setIsProcessingSmart(true);
    
    // Pequeno delay para sensação de IA processando
    setTimeout(() => {
      // Tenta extrair valor (ex: R$ 100 ou 100)
      const amountMatch = smartInput.match(/(?:R\$?\s?)?(\d+(?:[.,]\d{2})?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0;
      
      // Tenta detectar se é entrada ou saída
      const isIncome = smartInput.toLowerCase().includes('recebi') || 
                       smartInput.toLowerCase().includes('salário') || 
                       smartInput.toLowerCase().includes('renda') ||
                       smartInput.toLowerCase().includes('aporte');
      
      const isInvestment = smartInput.toLowerCase().includes('investimento') || 
                           smartInput.toLowerCase().includes('aporte');

      onAddTransaction({
        description: smartInput.split(/[R$|\d]/)[0].trim() || 'Lançamento Inteligente',
        amount: amount,
        type: isIncome ? 'income' : 'expense',
        category: isInvestment ? 'Investimento' : (isIncome ? 'Renda' : 'Casa'),
        transaction_date: new Date().toISOString(),
        company_id: familyCompany.id,
        status: isIncome ? 'paid' : 'pending'
      });

      setSmartInput('');
      setIsProcessingSmart(false);
    }, 800);
  };

  // Transações Reais
  const monthTxs = useMemo(() => {
    if (!familyCompany) return [];
    return transactions.filter((t: any) => {
      if (t.company_id !== familyCompany.id || t.is_archived) return false;
      const tDate = new Date(t.transaction_date || t.due_date);
      return tDate >= startOfMonth && tDate <= endOfMonth;
    });
  }, [transactions, currentDate, familyCompany]);

  const incomes = monthTxs.filter((t: any) => t.type === 'income' && !t.category?.toLowerCase().includes('investimento'));
  const investments = transactions.filter((t: any) => 
    t.company_id === familyCompany?.id && 
    (t.category?.toLowerCase().includes('investimento') || t.description?.toLowerCase().includes('aporte'))
  );
  
  const allMonthlyExpenses = useMemo(() => {
    const actualExpenses = monthTxs.filter((t: any) => t.type === 'expense');
    const familyRecurrences = (recurringBills || []).filter((r: any) => r.company_id === familyCompany?.id);
    
    const virtualExpenses = familyRecurrences.filter((r: any) => {
      return !actualExpenses.some((t: any) => t.recurring_bill_id === r.id || (t.description === r.description && t.amount === r.amount));
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

    return [...actualExpenses, ...virtualExpenses];
  }, [monthTxs, recurringBills, familyCompany, currentDate]);

  const totalIncome = incomes.reduce((acc: number, t: any) => acc + Number(t.amount), 0);
  const totalExpenses = allMonthlyExpenses.reduce((acc: number, t: any) => acc + Number(t.amount), 0);
  const totalInvestedMonth = investments.filter((t:any) => {
    const d = new Date(t.transaction_date);
    return d >= startOfMonth && d <= endOfMonth;
  }).reduce((acc: number, t: any) => acc + Number(t.amount), 0);
  
  const cardExpenses = allMonthlyExpenses.filter((t: any) => (t.category || '').toLowerCase().includes('cartão'));
  const totalCard = cardExpenses.reduce((acc: number, t: any) => acc + Number(t.amount), 0);

  const pendingExpenses = allMonthlyExpenses.filter((t: any) => t.status === 'pending').reduce((acc: number, t: any) => acc + Number(t.amount), 0);
  const overdueExpenses = allMonthlyExpenses.filter((t: any) => {
    if (t.status === 'paid' || !t.due_date) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    return new Date(t.due_date) < today;
  });

  const handleAction = async (action: () => Promise<void>, id: string) => {
    setProcessingId(id);
    try {
      await action();
    } finally {
      setProcessingId(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('mercado') || cat.includes('alimentacao')) return Utensils;
    if (cat.includes('escola') || cat.includes('faculdade')) return GraduationCap;
    if (cat.includes('luz') || cat.includes('energia')) return Zap;
    if (cat.includes('internet') || cat.includes('celular')) return Phone;
    if (cat.includes('saude')) return Heart;
    if (cat.includes('cartão')) return CardIcon;
    if (cat.includes('investimento')) return PiggyBank;
    return DollarSign;
  };

  if (!familyCompany) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header com Seletor Temporal */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200/60 pb-8">
        <div>
          <div className="flex items-center gap-2 text-zinc-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-pulse" />
            Vency Family Office
          </div>
          <div className="flex items-center gap-6">
            <h1 className="text-4xl font-display font-bold tracking-tight text-zinc-900">Nossa Família</h1>
            <div className="flex items-center bg-white border border-zinc-200 rounded-2xl p-1 shadow-sm">
              <button onClick={prevMonth} className="p-2 hover:bg-zinc-50 rounded-xl transition-all text-zinc-400">
                <ChevronLeft size={20} />
              </button>
              <span className="px-6 font-display font-bold text-sm text-zinc-900 min-w-[160px] text-center capitalize">
                {formatDateLong(currentDate)}
              </span>
              <button onClick={nextMonth} className="p-2 hover:bg-zinc-50 rounded-xl transition-all text-zinc-400">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Entrada Inteligente - Igual da Empresa */}
      <div className="glass-card p-2 bg-white/40 border-zinc-200/50">
        <form onSubmit={handleSmartSubmit} className="relative flex items-center">
          <div className="absolute left-4 text-zinc-400">
            {isProcessingSmart ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
          </div>
          <input 
            type="text"
            value={smartInput}
            onChange={(e) => setSmartInput(e.target.value)}
            placeholder="Digite algo como 'Mercado R$ 450' ou 'Salário Adrieli 5000'..."
            className="w-full bg-transparent border-none focus:ring-0 py-4 pl-12 pr-32 text-sm font-medium text-zinc-900 placeholder:text-zinc-400"
          />
          <div className="absolute right-2 flex items-center gap-2">
            <span className="hidden md:block text-[10px] font-bold text-zinc-300 uppercase tracking-widest mr-2">Entrada Inteligente</span>
            <button 
              type="submit"
              disabled={!smartInput.trim() || isProcessingSmart}
              className="bg-zinc-900 text-white p-2 rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* Stats Dashboard 360º */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Renda Mensal</p>
          <p className="text-3xl font-display font-bold text-zinc-900">R$ {totalIncome.toLocaleString('pt-BR')}</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> Saldo Positivo
          </p>
        </div>

        <div className="glass-card p-6">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Total de Contas</p>
          <p className="text-3xl font-display font-bold text-rose-600">R$ {totalExpenses.toLocaleString('pt-BR')}</p>
          <div className="mt-2 w-full bg-zinc-100 h-1 rounded-full">
            <div className="bg-rose-500 h-full" style={{ width: `${totalIncome > 0 ? Math.min(100, (totalExpenses/totalIncome)*100) : 0}%` }} />
          </div>
        </div>

        <div className="glass-card p-6">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Cartão de Crédito</p>
          <p className="text-3xl font-display font-bold text-zinc-900">R$ {totalCard.toLocaleString('pt-BR')}</p>
          <p className="text-[10px] text-zinc-500 font-medium mt-2">{cardExpenses.length} faturas lançadas</p>
        </div>

        <div className="glass-card p-6 bg-zinc-900 text-white border-none shadow-xl shadow-zinc-200">
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Investido este Mês</p>
          <p className="text-3xl font-display font-bold text-white">R$ {totalInvestedMonth.toLocaleString('pt-BR')}</p>
          <p className="text-[10px] text-emerald-400 font-bold mt-2 flex items-center gap-1">
            <ShieldCheck size={12} /> Patrimônio Crescendo
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-8 border-b border-zinc-100 pb-px">
            <button onClick={() => setActiveTab('contas')} className={cn("text-sm font-bold transition-all py-4 relative", activeTab === 'contas' ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600")}>
              Contas e Boletos
              {activeTab === 'contas' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-full" />}
            </button>
            <button onClick={() => setActiveTab('entradas')} className={cn("text-sm font-bold transition-all py-4 relative", activeTab === 'entradas' ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600")}>
              Salários e Rendas
              {activeTab === 'entradas' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-full" />}
            </button>
            <button onClick={() => setActiveTab('investimentos')} className={cn("text-sm font-bold transition-all py-4 relative", activeTab === 'investimentos' ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600")}>
              Investimentos
              {activeTab === 'investimentos' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-full" />}
            </button>
          </div>

          <div className="space-y-3">
            {activeTab === 'contas' && (
              <>
                {overdueExpenses.map((tx: any) => (
                  <TransactionRowPremium key={tx.id} tx={tx} isOverdue processing={processingId === tx.id} onUpdate={(id:string, data:any) => handleAction(() => onUpdateTransaction(id, data), id)} onConfirm={(data:any) => handleAction(() => onConfirmVirtual(data), tx.id)} icon={getCategoryIcon(tx.category)} formatDate={formatDateShort} />
                ))}
                {allMonthlyExpenses.filter((t: any) => t.status === 'pending' && !overdueExpenses.find((o:any) => o.id === t.id)).sort((a: any, b: any) => new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime()).map((tx: any) => (
                  <TransactionRowPremium key={tx.id} tx={tx} processing={processingId === tx.id} onUpdate={(id:string, data:any) => handleAction(() => onUpdateTransaction(id, data), id)} onConfirm={(data:any) => handleAction(() => onConfirmVirtual(data), tx.id)} icon={getCategoryIcon(tx.category)} formatDate={formatDateShort} />
                ))}
                <div className="pt-10">
                  <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em] mb-4">Pagamentos Liquidados</p>
                  {allMonthlyExpenses.filter((t: any) => t.status === 'paid').map((tx: any) => (
                    <TransactionRowPremium key={tx.id} tx={tx} isPaid processing={processingId === tx.id} onUpdate={(id:string, data:any) => handleAction(() => onUpdateTransaction(id, data), id)} onConfirm={(data:any) => handleAction(() => onConfirmVirtual(data), tx.id)} icon={getCategoryIcon(tx.category)} formatDate={formatDateShort} />
                  ))}
                </div>
              </>
            )}

            {activeTab === 'entradas' && (
              <div className="space-y-4">
                {incomes.map((tx: any) => (
                  <div key={tx.id} className="glass-card p-6 flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <ArrowUpRight size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">{tx.description}</p>
                        <p className="text-[11px] text-zinc-500 font-medium">Recebido em {formatDateShort(tx.transaction_date)}</p>
                      </div>
                    </div>
                    <p className="text-xl font-display font-bold text-emerald-600">R$ {Number(tx.amount).toLocaleString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'investimentos' && (
              <div className="space-y-4">
                <div className="glass-card p-6 bg-emerald-950 text-white border-none flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-2xl">
                      <LineChart size={32} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Patrimônio Acumulado</h4>
                      <p className="text-emerald-300 text-sm">Total de aportes registrados</p>
                    </div>
                  </div>
                  <p className="text-3xl font-display font-bold">R$ {investments.reduce((acc:any, t:any)=>acc+Number(t.amount),0).toLocaleString('pt-BR')}</p>
                </div>
                {investments.map((tx: any) => (
                  <div key={tx.id} className="glass-card p-6 flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-zinc-100 text-zinc-900 rounded-2xl flex items-center justify-center">
                        <PiggyBank size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">{tx.description}</p>
                        <p className="text-[11px] text-zinc-500 font-medium">Aporte em {formatDateShort(tx.transaction_date)}</p>
                      </div>
                    </div>
                    <p className="text-xl font-display font-bold text-zinc-900">R$ {Number(tx.amount).toLocaleString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <section className="glass-card p-6 bg-zinc-50/50">
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <ShieldCheck size={14} />
              Capacidade de Aporte
            </h3>
            <div className="space-y-4">
              <div className="p-5 border border-zinc-200 rounded-2xl bg-white shadow-sm space-y-3">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tighter">
                  <span className="text-zinc-400">Taxa de Poupança</span>
                  <span className="text-emerald-600">{totalIncome > 0 ? Math.round(((totalIncome - totalExpenses)/totalIncome)*100) : 0}%</span>
                </div>
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${Math.max(0, ((totalIncome-totalExpenses)/totalIncome)*100)}%` }} />
                </div>
                <p className="text-[10px] text-zinc-500 leading-tight italic">Você pode investir R$ {(totalIncome - totalExpenses).toLocaleString('pt-BR')} este mês.</p>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};

const TransactionRowPremium = ({ tx, isOverdue, isPaid, onUpdate, onConfirm, processing, icon: Icon, formatDate }: any) => {
  const isVirtual = tx.is_virtual;

  return (
    <div className={cn(
      "glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all duration-300",
      isOverdue ? "border-rose-200 bg-rose-50/10" : "hover:border-zinc-300",
      isPaid && "opacity-50 grayscale bg-zinc-50/30 shadow-none border-dashed",
      isVirtual && "border-zinc-200 border-dashed bg-zinc-50/20"
    )}>
      <div className="flex items-center gap-5">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
          isOverdue ? "bg-rose-500 text-white" : isPaid ? "bg-zinc-100 text-zinc-400" : isVirtual ? "bg-zinc-100 text-zinc-500" : "bg-white border border-zinc-100 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white"
        )}>
          {processing ? <Loader2 className="animate-spin" size={20} /> : <Icon size={24} strokeWidth={1.5} />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className={cn("font-bold text-zinc-900 tracking-tight", isPaid && "text-zinc-400")}>{tx.description}</p>
            {isVirtual && <span className="text-[9px] font-black bg-zinc-200 px-1.5 py-0.5 rounded uppercase tracking-tighter">Fixo</span>}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-tighter">
              <Calendar size={12} strokeWidth={2.5} />
              <span>{isPaid ? `Pago ${formatDate(tx.transaction_date || tx.updated_at)}` : `Vence ${formatDate(tx.due_date)}`}</span>
            </div>
            {isOverdue && <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-100 px-2 py-0.5 rounded tracking-widest">Atraso</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-8">
        <p className={cn("text-xl font-display font-bold", isOverdue ? "text-rose-600" : isPaid ? "text-zinc-400" : "text-zinc-900")}>
          R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        
        <div className="flex items-center gap-2">
          {isVirtual ? (
            <button disabled={processing} onClick={() => onConfirm({ description: tx.description, amount: tx.amount, category: tx.category, type: 'expense', status: 'paid', transaction_date: new Date().toISOString(), company_id: tx.company_id, recurring_bill_id: tx.recurring_bill_id })} className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl transition-all font-bold text-[11px] uppercase tracking-wider">
              {processing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Confirmar Pagamento
            </button>
          ) : !isPaid ? (
            <button disabled={processing} onClick={() => onUpdate(tx.id, { status: 'paid', transaction_date: new Date().toISOString() })} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl transition-all font-bold text-[11px] uppercase tracking-wider">
              {processing ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={16} />} Pagar
            </button>
          ) : (
            <button disabled={processing} onClick={() => onUpdate(tx.id, { status: 'pending' })} className="p-2 text-zinc-300 hover:text-zinc-900 transition-all rounded-lg">
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
