import React, { useState, useEffect, useRef } from 'react';
import { X, Save, ArrowRight, ChevronDown, ChevronUp, UploadCloud, Bot, Loader2, Clock, Wallet, Search, Plus, Utensils, ShoppingBag, CreditCard, Check } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Company, Transaction, ProductService } from '../hooks/useDashboardData';

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  products: ProductService[];
  onSave: (data: Partial<Transaction>) => Promise<void>;
  initialData?: Transaction | null;
}

export const QuickTransactionModal = ({ isOpen, onClose, companies, products, onSave, initialData }: QuickTransactionModalProps) => {
  const [data, setData] = useState<Partial<Transaction>>({
    type: 'expense',
    amount: 0,
    description: '',
    category: 'Alimentação',
    transaction_date: new Date().toISOString().split('T')[0],
    company_id: '',
    subcategory: 'BRL - Real Brasileiro'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setData(initialData);
      } else {
        setData({
          type: 'expense',
          amount: 0,
          description: '',
          category: 'Alimentação',
          transaction_date: new Date().toISOString().split('T')[0],
          company_id: companies.find(c => c.company_type === 'Financeiro Pessoal')?.id || companies[0]?.id || '',
          subcategory: 'BRL - Real Brasileiro',
          status: 'paid',
          recurrence_type: 'variable',
          predictability: 'Fixa'
        });
      }
      setError(null);
    }
  }, [isOpen, initialData, companies]);

  const handleSave = async () => {
    if (!data.amount || data.amount <= 0) { setError("Valor inválido."); return; }
    if (!data.description) { setError("Descrição obrigatória."); return; }
    if (!data.transaction_date) { setError("Data obrigatória."); return; }

    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        ...data,
        status: data.status || 'paid',
        transaction_date: data.transaction_date,
        recurrence_type: data.recurrence_type || 'variable',
        predictability: data.predictability || 'Fixa'
      });
      onClose();
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const currencies = [
    { code: 'BRL', name: 'Real Brasileiro' },
    { code: 'USD', name: 'Dólar Americano' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'Libra Esterlina' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white p-8 rounded-[24px] shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Novo Registro</h3>
            <p className="text-zinc-500 text-[13px] font-medium tracking-tight">Preencha os dados da transação familiar.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Conta/Carteira */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Conta de Origem</label>
              <select 
                value={data.company_id}
                onChange={e => setData({...data, company_id: e.target.value})}
                className="input-premium h-12 bg-zinc-50/50"
              >
                <option value="">Selecione...</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Valor */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Valor</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">R$</span>
                <input 
                  type="text"
                  value={data.amount ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(data.amount) : ''}
                  onChange={e => {
                    const val = e.target.value.replace(/[^\d]/g, '');
                    setData({ ...data, amount: val ? parseFloat(val) / 100 : 0 });
                  }}
                  className="input-premium h-12 pl-10 text-lg font-bold"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Descrição / Título</label>
            <input 
              type="text"
              value={data.description}
              onChange={e => setData({ ...data, description: e.target.value })}
              className="input-premium h-12"
              placeholder="Ex: Compra Mensal Mercado..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Categoria */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Categoria</label>
              <select 
                value={data.category}
                onChange={e => setData({...data, category: e.target.value})}
                className="input-premium h-12 bg-zinc-50/50"
              >
                {/* Categorias Dinâmicas baseadas no tipo da empresa */}
                {(() => {
                  const selectedCompany = companies.find(c => c.id === data.company_id);
                  if (selectedCompany?.company_type === 'Financeiro Pessoal') {
                    return (
                      <>
                        <option value="Alimentação">Alimentação</option>
                        <option value="Mercado">Mercado</option>
                        <option value="Moradia">Moradia</option>
                        <option value="Transporte">Transporte</option>
                        <option value="Lazer">Lazer</option>
                        <option value="Saúde">Saúde</option>
                        <option value="Educação">Educação</option>
                        <option value="Investimentos">Investimentos</option>
                        <option value="Outros">Outros</option>
                      </>
                    );
                  } else {
                    return (
                      <>
                        <option value="Serviços / Vendas">Serviços / Vendas</option>
                        <option value="Consultoria">Consultoria</option>
                        <option value="Assinaturas / SaaS">Assinaturas / SaaS</option>
                        <option value="Impostos">Impostos</option>
                        <option value="Marketing / Ads">Marketing / Ads</option>
                        <option value="Pró-labore">Pró-labore</option>
                        <option value="Infraestrutura">Infraestrutura</option>
                        <option value="Outros">Outros</option>
                      </>
                    );
                  }
                })()}
              </select>
            </div>

            {/* Tipo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Tipo de Fluxo</label>
              <div className="flex bg-zinc-100 p-1 rounded-md border border-zinc-200 h-12">
                <button 
                  onClick={() => setData({...data, type: 'expense'})}
                  className={cn("flex-1 text-[11px] font-bold rounded transition-all", data.type === 'expense' ? "bg-white text-rose-600 shadow-sm" : "text-zinc-500")}
                >Saída</button>
                <button 
                  onClick={() => setData({...data, type: 'income'})}
                  className={cn("flex-1 text-[11px] font-bold rounded transition-all", data.type === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-500")}
                >Entrada</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Data */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Data</label>
              <input 
                type="date" 
                value={data.transaction_date}
                onChange={e => setData({...data, transaction_date: e.target.value})}
                className="input-premium h-12"
              />
            </div>

            {/* Parcelas */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-zinc-400 uppercase tracking-widest ml-1">Parcelas</label>
              <select 
                className="input-premium h-12 bg-zinc-50/50"
                onChange={e => {
                  const installments = parseInt(e.target.value);
                  // Limpar qualquer sufixo de parcela anterior antes de adicionar o novo
                  const baseDescription = data.description?.replace(/\s*\(\d+\/\d+\)/g, '').trim();
                  if (installments > 1) {
                    setData({ ...data, description: `${baseDescription} (1/${installments})` });
                  } else {
                    setData({ ...data, description: baseDescription });
                  }
                }}
              >
                <option value="1">À vista (1x)</option>
                <option value="2">2x sem juros</option>
                <option value="3">3x sem juros</option>
                <option value="4">4x</option>
                <option value="5">5x</option>
                <option value="6">6x</option>
                <option value="10">10x</option>
                <option value="12">12x</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Moeda */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Moeda</label>
              <select 
                value={data.subcategory}
                onChange={e => setData({...data, subcategory: e.target.value})}
                className="input-premium h-12"
              >
                {currencies.map(curr => (
                  <option key={curr.code} value={`${curr.code} - ${curr.name}`}>
                    {curr.code} - {curr.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status (Opcional, mas útil) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Status</label>
              <select 
                value={data.status || 'paid'}
                onChange={e => setData({...data, status: e.target.value as any})}
                className="input-premium h-12 bg-zinc-50/50"
              >
                <option value="paid">Confirmado / Pago</option>
                <option value="pending">Pendente / Agendado</option>
              </select>
            </div>
          </div>
        </div>

        {error && <div className="mt-6 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold text-center">{error}</div>}

        <div className="mt-10 flex gap-3">
          <button 
            onClick={onClose}
            className="btn-secondary flex-1 h-12"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary flex-[1.5] h-12"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {isSaving ? 'Salvando...' : 'Confirmar Registro'}
          </button>
        </div>
      </div>
    </div>
  );
};
