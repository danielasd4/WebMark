import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { useDashboardData } from './hooks/useDashboardData';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  Calendar, 
  Hourglass,
  Plus,
  ArrowUpRight,
  Target,
  Lightbulb,
  LogOut,
  Loader2,
  PlusCircle,
  LayoutDashboard,
  Briefcase,
  Building2
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { DashboardCard } from './components/DashboardCard';
import { CompanyCard } from './components/CompanyCard';
import { InsightCard } from './components/InsightCard';
import { QuickTransactionModal } from './components/QuickTransactionModal';
import { ReceiptUploaderModal } from './components/ReceiptUploaderModal';
import { CompaniesView } from './components/CompaniesView';
import { TimelineView } from './components/TimelineView';
import { GoalsView } from './components/GoalsView';
import { FinanceView } from './components/FinanceView';
import { BillsView } from './components/BillsView';
import { FechamentosView } from './components/FechamentosView';
import { AiAssistantView } from './components/AiAssistantView';
import { MobileNav } from './components/MobileNav';
import { OnboardingView } from './components/OnboardingView';
import { FamilyView } from './components/FamilyView';
import { FamilyOfficeView } from './components/FamilyOfficeView';
import { FamilyRecurringBillModal } from './components/FamilyRecurringBillModal';
import { SectionTitle } from './components/ui/SectionTitle';
import { generateInsights } from './lib/generateInsights';

// --- Error Boundary Component ---
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-50">
          <div className="glass-card p-12 text-center max-w-md bg-white border-zinc-200 shadow-xl">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingDown size={32} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Ops! Algo deu errado</h2>
            <p className="text-zinc-500 mb-8">Esta área encontrou um problema técnico. Seus dados estão seguros, mas o painel falhou ao carregar.</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
            >
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Criar uma sessão simulada se estiver em modo Demo
  const effectiveSession = session || (isDemoMode ? { 
    user: { 
      id: 'demo-user-id', 
      email: 'demo@vencyhub.com',
      user_metadata: { full_name: 'Usuário Demo' }
    } 
  } : null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState(() => {
    const path = window.location.pathname;
    if (path === '/pagamentos' || path === '/contas') return 'contas';
    if (path === '/familia') return 'familia';
    if (path === '/financeiro') return 'financeiro';
    if (path === '/empresas') return 'empresas';
    if (path === '/fechamentos') return 'fechamentos';
    return 'dashboard';
  });

  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [showQuickTransaction, setShowQuickTransaction] = useState(false);
  const [quickTxData, setQuickTxData] = useState<any>(null);

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/pagamentos' || path === '/contas') setCurrentView('contas');
    };
    window.addEventListener('popstate', handleLocationChange);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      subscription.unsubscribe();
    };
  }, []);

  const { 
    companies, 
    transactions, 
    products, 
    recurringBills,
    collaborators,
    userProfile,
    loading, 
    error,
    financialEngine,
    updateUserProfile,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    hardDeleteTransaction,
    updateCompany,
    deleteCompany,
    addRecurringBill,
    updateRecurringBill,
    deleteRecurringBill,
    addCollaborator,
    updateCollaborator,
    deleteCollaborator,
    addProduct,
    updateProduct,
    deleteProduct,
    refresh,
    metrics 
  } = useDashboardData(effectiveSession);

  const logActivity = (action: string, details: string, type?: string, icon?: any) => {
    console.log(`[Activity] ${action}: ${details} (${type})`);
  };

  const hasCompletedOnboarding = userProfile?.has_completed_onboarding || false;
  const insights = generateInsights(companies, transactions, products, recurringBills);

  // Bypass de Autenticação para Desenvolvimento
  if (!session && !isDemoMode) {
    return (
      <div className="relative">
        <Auth onLogin={() => {}} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-slate-900">
        <Loader2 className="animate-spin text-primary mb-4" size={32} />
        <p className="text-slate-500 font-display font-medium">Carregando painel estratégico...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-slate-900 p-6 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6 border border-rose-100">
          <Target size={32} />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">Ops! Algo deu errado</h2>
        <p className="text-slate-500 max-w-md mb-8">{error}</p>
        <button 
          onClick={() => refresh()}
          className="btn-primary"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-slate-900">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      
      <main className="flex-1 p-4 lg:p-10 lg:ml-64 pb-24 lg:pb-10 min-h-screen">
        <ErrorBoundary key={currentView}>
          {currentView === 'dashboard' && (
              <div className="animate-in fade-in duration-300">
                <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                  <SectionTitle 
                    title="Painel Estratégico" 
                    subtitle="Bem-vindo de volta. Aqui está o resumo das suas operações com dados reais."
                    icon={LayoutDashboard}
                    className="mb-0"
                  />
                  
                  <button 
                    onClick={() => { setEditingTransaction({ type: 'income', context_type: 'business' }); setIsModalOpen(true); }}
                    className="btn-primary w-full md:w-auto"
                  >
                    <Plus size={20} />
                    Novo Lançamento
                  </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <DashboardCard title="Entradas do Mês" value={metrics.entradasMes} icon={TrendingUp} variant="success" trend={{ value: 'Real', isPositive: true }} />
                  <DashboardCard title="Saídas do Mês" value={metrics.saidasMes} icon={TrendingDown} variant="danger" trend={{ value: 'Real', isPositive: false }} />
                  <DashboardCard title="Lucro Líquido" value={metrics.lucroLiquido} icon={DollarSign} variant="info" priority="high" />
                  <DashboardCard title="Horas Operacionais" value={`${metrics.totalHorasMes}h`} icon={Hourglass} variant="neutral" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                  <DashboardCard title="Receita Previsível" value={metrics.receitaPrevisivel} icon={Calendar} variant="info" priority="high" />
                  <DashboardCard title="Receita Variável" value={metrics.receitaVariavel} icon={ArrowUpRight} variant="neutral" />
                  <DashboardCard title="Valor/Hora Médio" value={metrics.valorHoraMedio} icon={Target} variant="warning" priority="high" />
                  <DashboardCard title="Contas Futuras" value={metrics.contasFuturas} icon={Calendar} variant="danger" />
                </div>

                <section className="mb-10">
                  <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                    <Lightbulb className="text-primary" size={24} /> Resumo Estratégico
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {insights.slice(0, 3).map((insight) => (
                      <InsightCard key={insight.id} text={insight.text} type={insight.type} />
                    ))}
                    <div className="glass-card p-6 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[13px] font-medium text-zinc-500 mb-1">Meta de Liberdade</h4>
                        <p className="text-[12px] text-zinc-400 mb-6">R$ 15k recorrente com &lt; 30h/sem.</p>
                      </div>
                      <div>
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-3xl font-semibold text-zinc-900">{(metrics.receitaPrevisivelRaw / 150).toFixed(1)}%</span>
                          <span className="text-[12px] text-zinc-400">R$ {metrics.receitaPrevisivelRaw} / R$ 15k</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <div className="h-full bg-zinc-900 rounded-full" style={{ width: `${Math.min((metrics.receitaPrevisivelRaw / 150), 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {currentView === 'familia' && (
              <FamilyOfficeView 
                companies={companies}
                transactions={financialEngine.family.transactions}
                personalTransactions={financialEngine.personal.transactions}
                recurringBills={recurringBills}
                onAddTransaction={(data: any) => { setEditingTransaction(data); setIsModalOpen(true); }}
                onUpdateTransaction={updateTransaction}
                onAddSubscription={() => setIsSubscriptionModalOpen(true)}
              />
            )}

            {currentView === 'empresas' && (
              <CompaniesView 
                companies={companies.filter(c => c.company_type !== 'Financeiro Pessoal')} 
                transactions={metrics.rawTransactions || []}
                products={products}
                collaborators={collaborators}
                recurringBills={recurringBills}
                onAddProduct={addProduct}
                onUpdateProduct={updateProduct}
                onDeleteProduct={deleteProduct}
                onAddCollaborator={addCollaborator}
                onDeleteCollaborator={deleteCollaborator}
                onUpdateCompany={updateCompany}
                onDeleteCompany={deleteCompany}
                onAddTransaction={(data: any) => { setEditingTransaction({ ...data, context_type: 'business' }); setIsModalOpen(true); }}
                onUpdateTransaction={updateTransaction}
                userProfile={userProfile}
                onUpdateUserProfile={updateUserProfile}
              />
            )}
            
            {currentView === 'timeline' && <TimelineView transactions={transactions} companies={companies} />}
            
            {currentView === 'financeiro' && (
              <FinanceView 
                transactions={financialEngine.business.transactions}
                companies={financialEngine.business.companies}
                recurringBills={recurringBills}
                onEditTransaction={(tx: any) => { setEditingTransaction(tx); setIsModalOpen(true); }}
                onUpdateTransaction={updateTransaction}
                onArchiveTransaction={deleteTransaction}
                onHardDeleteTransaction={hardDeleteTransaction}
                onOpenReceiptModal={() => setIsReceiptModalOpen(true)}
              />
            )}

            {currentView === 'contas' && (
              <BillsView 
                companies={companies}
                transactions={transactions}
                recurringBills={recurringBills}
                onAddBill={addRecurringBill}
                onUpdateBill={updateRecurringBill}
                onDeleteBill={deleteRecurringBill}
                onAddTransaction={addTransaction}
              />
            )}

            {currentView === 'metas' && (
              <GoalsView 
                metrics={metrics} 
                companies={companies} 
                collaborators={collaborators}
                userProfile={userProfile}
                updateUserProfile={updateUserProfile}
              />
            )}

            {currentView === 'fechamentos' && (
              <FechamentosView 
                metrics={metrics} 
                onExport={() => alert('Função de exportação em desenvolvimento.')} 
              />
            )}

            {currentView === 'ia' && (
              <AiAssistantView 
                metrics={metrics}
                companies={companies}
                products={products}
                recurringBills={recurringBills}
              />
            )}

            {currentView === 'configuracoes' && (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                  <Building2 size={32} />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900">Configurações Integradas</h3>
                <p className="text-sm text-zinc-500 max-w-xs mt-1">Gerencie metas e equipe diretamente dentro de cada Empresa.</p>
                <button onClick={() => setCurrentView('empresas')} className="btn-primary mt-6">Ir para Empresas</button>
              </div>
            )}
          </ErrorBoundary>
      </main>

      <MobileNav 
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenNewTransaction={() => setIsModalOpen(true)}
      />

      <QuickTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }} 
        companies={companies}
        products={products}
        initialData={editingTransaction}
        onSave={async (data) => {
          if (editingTransaction?.id) {
            await updateTransaction(editingTransaction.id, data);
          } else {
            const match = data.description?.match(/\(1\/(\d+)\)/);
            if (match && data.transaction_date) {
              const totalInstallments = parseInt(match[1]);
              const baseDescription = data.description?.replace(/\s*\(\d+\/\d+\)/g, '').trim();
              const [year, month, day] = data.transaction_date.split('-').map(Number);
              for (let i = 1; i <= totalInstallments; i++) {
                const installmentDate = new Date(year, month - 1 + (i - 1), day);
                const expectedMonth = (month - 1 + (i - 1)) % 12;
                if (installmentDate.getMonth() !== expectedMonth) installmentDate.setDate(0);
                await addTransaction({
                  ...data,
                  description: `${baseDescription} (${i}/${totalInstallments})`,
                  transaction_date: installmentDate.toISOString().split('T')[0],
                  status: i === 1 ? 'paid' : 'pending',
                  recurrence_type: 'variable'
                });
              }
            } else {
              await addTransaction(data);
            }
          }
        }}
      />

      <ReceiptUploaderModal 
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        companies={companies}
        onConfirm={async (data) => addTransaction(data)}
      />
      
      <FamilyRecurringBillModal 
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        companies={companies}
        onSave={async (data) => addRecurringBill(data)}
      />
    </div>
  );
}

export default App;
