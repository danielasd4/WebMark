import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';

export interface Company {
  id: string;
  user_id: string;
  name: string;
  company_type: string;
  revenue_type: string;
  predictability: string;
  status: string;
  revenue_goal: number;
  target_hourly_rate: number;
  max_monthly_hours: number;
  current_balance?: number;
}

export interface Transaction {
  id: string;
  company_id: string;
  product_service_id?: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  subcategory: string;
  description: string;
  status: 'pending' | 'paid';
  recurrence_type: 'variable' | 'recurring';
  transaction_date: string;
  hours_spent: number;
  predictability?: string;
  is_archived?: boolean;
}

export interface ProductService {
  id: string;
  user_id: string;
  company_id: string;
  name: string;
  description: string;
  type: string;
  average_price: number;
  average_cost: number;
  average_hours: number;
  estimated_margin: number;
  is_recurring: boolean;
  predictability: string;
  scalability: number;
  owner_dependency: number;
  status: string;
}

export interface RecurringBill {
  id: string;
  user_id: string;
  company_id: string;
  title: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  subcategory: string;
  due_day: number;
  recurrence: string;
  status: string;
  payment_status: string;
  predictability: string;
  notes: string;
}

export interface UserProfile {
  user_id: string;
  total_cash: number;
  total_fixed_costs: number;
  min_hourly_rate: number;
  has_completed_onboarding: boolean;
}

export function useDashboardData(session: any) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringBills, setRecurringBills] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!session?.user?.id || session.user.id === 'demo-user-id') {
      // MOCK DATA FOR DEMO MODE
      setCompanies([
        { id: '1', user_id: 'demo', name: 'Vency Design', company_type: 'Agência', revenue_type: 'Recorrente', predictability: 'Alta', status: 'Ativa', revenue_goal: 15000, target_hourly_rate: 200, max_monthly_hours: 40 },
        { id: '2', user_id: 'demo', name: 'Consultoria Tech', company_type: 'Consultoria', revenue_type: 'Variável', predictability: 'Média', status: 'Ativa', revenue_goal: 10000, target_hourly_rate: 350, max_monthly_hours: 20 },
        { id: '3', user_id: 'demo', name: 'Finanças Família', company_type: 'Financeiro Pessoal', revenue_type: 'N/A', predictability: 'Fixa', status: 'Ativa', revenue_goal: 0, target_hourly_rate: 0, max_monthly_hours: 0 }
      ]);
      setTransactions([
        { id: 't1', company_id: '1', type: 'income', amount: 5000, category: 'Mensalidade', subcategory: 'Design', description: 'Cliente Alpha', status: 'paid', recurrence_type: 'recurring', transaction_date: new Date().toISOString(), hours_spent: 10 },
        { id: 't2', company_id: '1', type: 'income', amount: 3500, category: 'Mensalidade', subcategory: 'Design', description: 'Cliente Beta', status: 'paid', recurrence_type: 'recurring', transaction_date: new Date().toISOString(), hours_spent: 8 },
        { id: 't3', company_id: '2', type: 'income', amount: 12000, category: 'Projeto', subcategory: 'Dev', description: 'App Novo', status: 'paid', recurrence_type: 'variable', transaction_date: new Date().toISOString(), hours_spent: 30 },
        { id: 't4', company_id: '3', type: 'expense', amount: 2500, category: 'Casa', subcategory: 'Aluguel', description: 'Aluguel Maio', status: 'pending', recurrence_type: 'recurring', transaction_date: new Date().toISOString(), hours_spent: 0 }
      ]);
      setUserProfile({
        user_id: 'demo',
        total_cash: 25000,
        total_fixed_costs: 8000,
        min_hourly_rate: 150,
        has_completed_onboarding: true
      });
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Limpar estados para evitar dados "fantasma" do modo demo
    setCompanies([]);
    setTransactions([]);
    setProducts([]);
    setRecurringBills([]);
    setCollaborators([]);
    setUserProfile(null);

    try {
      // 1. Fetch User Profile & Settings
      let { data: profile, error: profileError } = await supabase
        .from('user_profile_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      // MIGRATION LOGIC: LocalStorage -> Supabase
      if (profileError || !profile) {
        const savedSettings = localStorage.getItem('user_settings');
        const hasCompletedOnboarding = localStorage.getItem('has_completed_onboarding') === 'true';
        
        const initialSettings = savedSettings ? JSON.parse(savedSettings) : {
          totalCash: 0,
          totalFixedCosts: 0,
          minHourlyRate: 0
        };

        const { data: newProfile, error: createError } = await supabase
          .from('user_profile_settings')
          .insert({
            user_id: session.user.id,
            total_cash: initialSettings.totalCash || 0,
            total_fixed_costs: initialSettings.totalFixedCosts || 0,
            min_hourly_rate: initialSettings.minHourlyRate || 0,
            has_completed_onboarding: hasCompletedOnboarding
          })
          .select()
          .maybeSingle();

        if (createError) {
      console.error("[Supabase Error] Erro ao criar perfil inicial:", createError);
      // Não lançar erro aqui para não bloquear o app, mas logar para debug
    } else {
      profile = newProfile;
    }
      } else if (profileError) {
        throw profileError;
      }
      setUserProfile(profile);

      // 2. Fetch Core Data
      const [compsRes, txsRes, prodsRes, billsRes, collabsRes] = await Promise.all([
        supabase.from('companies').select('*').eq('is_archived', false).order('name'),
        supabase.from('transactions').select('*').eq('is_archived', false).order('transaction_date', { ascending: false }),
        supabase.from('products_services').select('*').eq('is_archived', false),
        supabase.from('recurring_bills').select('*').eq('is_archived', false),
        supabase.from('collaborators').select('*')
      ]);

      setCompanies(compsRes.data || []);
      setTransactions(txsRes.data || []);
      setProducts(prodsRes.data || []);
      setRecurringBills(billsRes.data || []);
      setCollaborators(collabsRes.data || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session?.user?.id]);

  // --- ACTIONS ---
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!session?.user?.id || session.user.id === 'demo-user-id') {
      console.log("[Demo Mode] Simulação de sucesso no perfil");
      return;
    }
    
    const { error } = await supabase
      .from('user_profile_settings')
      .upsert({ 
        ...data, 
        user_id: session.user.id,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error("[Backend Error] Falha ao atualizar perfil do usuário:", error.message);
      throw new Error("Não foi possível salvar as configurações de perfil.");
    }
    await fetchData();
  };

  const addTransaction = async (data: Partial<Transaction>) => {
    if (!session?.user?.id) return;
    if (session.user.id === 'demo-user-id') return; // Demo Mode
    const { error } = await supabase.from('transactions').insert({ ...data, user_id: session.user.id });
    if (error) {
      console.error("[Backend Error] Falha ao adicionar transação:", error.message);
      throw new Error("Erro ao registrar movimentação financeira.");
    }
    await fetchData();
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    if (!session?.user?.id) return;
    if (session.user.id === 'demo-user-id') return; // Demo Mode
    const { error } = await supabase.from('transactions').update(data).eq('id', id);
    if (error) {
      console.error("[Supabase Error] Falha ao atualizar transação:", error);
      throw new Error("Erro de permissão ou rede ao salvar transação.");
    }
    await fetchData();
  };

  const deleteTransaction = async (id: string) => {
    if (session?.user?.id === 'demo-user-id') return;
    const { error } = await supabase.from('transactions').update({ is_archived: true, archived_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  const updateCollaborator = async (id: string, data: any) => {
    if (session?.user?.id === 'demo-user-id') return;
    const { error } = await supabase.from('collaborators').update(data).eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  const addCollaborator = async (data: any) => {
    if (session?.user?.id === 'demo-user-id') return;
    const { error } = await supabase.from('collaborators').insert({ ...data, user_id: session.user.id });
    if (error) throw error;
    await fetchData();
  };

  const deleteCollaborator = async (id: string) => {
    if (session?.user?.id === 'demo-user-id') return;
    const { error } = await supabase.from('collaborators').delete().eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  const updateCompany = async (id: string, data: any) => {
    if (session?.user?.id === 'demo-user-id') return;
    const { error } = await supabase.from('companies').update(data).eq('id', id);
    if (error) {
      console.error("[Backend Error] Falha ao atualizar empresa:", error.message);
      throw new Error("Erro ao salvar dados da empresa.");
    }
    await fetchData();
  };

  const deleteCompany = async (id: string) => {
    if (session?.user?.id === 'demo-user-id') return;
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  const addRecurringBill = async (data: any) => {
    if (session?.user?.id === 'demo-user-id') return;
    const { error } = await supabase.from('recurring_bills').insert({ ...data, user_id: session.user.id });
    if (error) {
      console.error("[Backend Error] Falha ao adicionar conta recorrente:", error.message);
      throw new Error("Erro ao criar nova assinatura ou conta fixa.");
    }
    await fetchData();
  };

  const updateRecurringBill = async (id: string, data: any) => {
    if (session?.user?.id === 'demo-user-id') return;
    const { error } = await supabase.from('recurring_bills').update(data).eq('id', id);
    if (error) {
      console.error("[Supabase Error] Falha ao atualizar conta recorrente:", error);
      throw new Error("Erro ao salvar alterações na conta fixa.");
    }
    await fetchData();
  };

  const deleteRecurringBill = async (id: string) => {
    if (session?.user?.id === 'demo-user-id') return;
    const { error } = await supabase.from('recurring_bills').delete().eq('id', id);
    if (error) {
      console.error("[Supabase Error] Falha ao excluir conta recorrente:", error);
      throw new Error("Erro ao remover conta fixa.");
    }
    await fetchData();
  };

  const addProduct = async (data: any) => {
    if (session?.user?.id === 'demo-user-id') return;
    const { error } = await supabase.from('products_services').insert({ ...data, user_id: session.user.id });
    if (error) throw error;
    await fetchData();
  };

  const updateProduct = async (id: string, data: any) => {
    if (session?.user?.id === 'demo-user-id') return;
    const { error } = await supabase.from('products_services').update(data).eq('id', id);
    if (error) {
      console.error("[Supabase Error] Falha ao atualizar produto:", error);
      throw new Error("Erro ao salvar alterações no produto/serviço.");
    }
    await fetchData();
  };

  const deleteProduct = async (id: string) => {
    if (session?.user?.id === 'demo-user-id') return;
    const { error } = await supabase.from('products_services').delete().eq('id', id);
    if (error) {
      console.error("[Supabase Error] Falha ao excluir produto:", error);
      throw new Error("Erro ao remover produto/serviço.");
    }
    await fetchData();
  };

  // --- ENGINE: CENTRALIZED CALCULATIONS ---
  const financialEngine = useMemo(() => {
    const now = new Date();
    const currMonth = now.getMonth();
    const currYear = now.getFullYear();

    // 1. Business Logic (PJ)
    const businessCompanies = companies.filter(c => 
      !['Financeiro Pessoal', 'Família', 'Pessoal'].includes(c.company_type) && 
      !c.name.toLowerCase().includes('pf') && 
      !c.name.toLowerCase().includes('daniel')
    );
    const businessIds = businessCompanies.map(c => c.id);
    const bizTxs = transactions.filter(t => businessIds.includes(t.company_id));
    
    // 2. Family Logic (Família/Casa)
    const familyCompanies = companies.filter(c => 
      c.company_type === 'Família' || 
      c.name.toLowerCase().includes('família') || 
      c.name.toLowerCase().includes('casa') ||
      c.name.toLowerCase().includes('conjunta')
    );
    const familyIds = familyCompanies.map(c => c.id);
    const famTxs = transactions.filter(t => familyIds.includes(t.company_id));

    // 3. Personal Logic (Pessoal/Daniel)
    const personalCompanies = companies.filter(c => 
      c.company_type === 'Financeiro Pessoal' || 
      c.company_type === 'Pessoal' ||
      c.name.toLowerCase().includes('daniel') ||
      (c.name.toLowerCase().includes('pf') && !c.name.toLowerCase().includes('família'))
    );
    const personalIds = personalCompanies.map(c => c.id);
    const perTxs = transactions.filter(t => personalIds.includes(t.company_id));

    const bizMonthTxs = bizTxs.filter(t => {
      const d = new Date(t.transaction_date);
      return d.getMonth() === currMonth && d.getFullYear() === currYear;
    });

    const bizIncome = bizMonthTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const bizExpense = bizMonthTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
    const bizHours = bizMonthTxs.reduce((acc, t) => acc + (t.hours_spent || 0), 0);

    return {
      business: {
        income: bizIncome,
        expense: bizExpense,
        profit: bizIncome - bizExpense,
        hourlyRate: bizHours > 0 ? bizIncome / bizHours : 0,
        pendingExpenses: bizTxs.filter(t => t.type === 'expense' && t.status === 'pending').reduce((acc, t) => acc + Number(t.amount), 0),
        predictableRevenue: bizMonthTxs.filter(t => t.type === 'income' && t.recurrence_type === 'recurring').reduce((acc, t) => acc + Number(t.amount), 0),
        variableRevenue: bizMonthTxs.filter(t => t.type === 'income' && t.recurrence_type === 'variable').reduce((acc, t) => acc + Number(t.amount), 0),
        totalHours: bizHours,
        transactions: bizTxs,
        companies: businessCompanies
      },
      family: {
        income: famTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0),
        expense: famTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0),
        transactions: famTxs,
        companies: familyCompanies
      },
      personal: {
        income: perTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0),
        expense: perTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0),
        transactions: perTxs,
        companies: personalCompanies
      }
    };
  }, [companies, transactions]);

  return {
    companies,
    products,
    transactions,
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
    hardDeleteTransaction: deleteTransaction,
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
    refresh: fetchData,
    // Legacy mapping to avoid breaking UI immediately
    metrics: {
      entradasMes: formatCurrency(financialEngine.business.income),
      saidasMes: formatCurrency(financialEngine.business.expense),
      lucroLiquido: formatCurrency(financialEngine.business.profit),
      contasFuturas: formatCurrency(financialEngine.business.pendingExpenses),
      valorHoraMedio: formatCurrency(financialEngine.business.hourlyRate),
      revenue: financialEngine.business.income,
      rawTransactions: transactions,
      receitaVariavel: formatCurrency(financialEngine.business.variableRevenue),
      receitaPrevisivelRaw: financialEngine.business.predictableRevenue,
      receitaPrevisivel: formatCurrency(financialEngine.business.predictableRevenue),
      totalHorasMes: financialEngine.business.totalHours
    }
  };
}

