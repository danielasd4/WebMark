import { useState } from 'react';
import { ArrowRight, CheckCircle2, Building2, Briefcase, Sparkles, Target, DollarSign, Activity, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface OnboardingProps {
  onComplete: () => void;
  onUpdateUserProfile: (data: any) => Promise<void>;
}

export const OnboardingView = ({ onComplete, onUpdateUserProfile }: OnboardingProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: '',
    operationTypes: [] as string[],
    monthlyGoal: '',
    fixedCosts: '',
    hasRecurring: false
  });

  const operationOptions = [
    { id: 'servico', label: 'Prestação de Serviço' },
    { id: 'saas', label: 'SaaS / Software' },
    { id: 'financeiro_pessoal', label: 'Gestão Pessoal / Família' },
    { id: 'ecommerce', label: 'E-commerce' },
    { id: 'clt', label: 'CLT / Fixo' },
    { id: 'projetos', label: 'Projetos Fechados' }
  ];

  const toggleOperation = (id: string) => {
    setData(prev => ({
      ...prev,
      operationTypes: prev.operationTypes.includes(id)
        ? prev.operationTypes.filter(t => t !== id)
        : [...prev.operationTypes, id]
    }));
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Segurança: No modo demo ou sem UUID real (ex: 'demo-user-id'), apenas simulamos sucesso
      if (!userId || userId.length < 30) {
        setLoading(false);
        onComplete();
        return;
      }

      // 1. Criar empresa base primária com base nas operações
      const selectedId = data.operationTypes[0] || 'servico';
      const typeMap: Record<string, string> = {
        'servico': 'Prestação de Serviço',
        'saas': 'SaaS / Software',
        'financeiro_pessoal': 'Financeiro Pessoal',
        'ecommerce': 'E-commerce',
        'clt': 'CLT / Fixo',
        'projetos': 'Projetos Fechados'
      };
      
      const primaryType = typeMap[selectedId] || 'Prestação de Serviço';
      const companyName = data.name ? `Operações de ${data.name.split(' ')[0]}` : (selectedId === 'financeiro_pessoal' ? 'Finanças Família' : 'Minha Operação');
      
      const { error: compErr } = await supabase.from('companies').insert({
        user_id: userId,
        name: companyName,
        company_type: primaryType,
        revenue_type: selectedId === 'financeiro_pessoal' ? 'N/A' : (data.hasRecurring ? 'Mista' : 'Variável'),
        predictability: selectedId === 'financeiro_pessoal' ? 'Fixa' : (data.hasRecurring ? 'Média' : 'Baixa'),
        status: 'Ativa'
      });

      if (compErr) console.error("Erro ao criar empresa no onboarding:", compErr);

      // 2. Salvar parâmetros estratégicos base no Banco de Dados
      await onUpdateUserProfile({
        total_cash: 0,
        total_fixed_costs: Number(data.fixedCosts) || 0,
        min_hourly_rate: 100,
        has_completed_onboarding: true
      });

      setLoading(false);
      onComplete();
    } catch (e) {
      console.error("Erro geral no onboarding:", e);
      setLoading(false);
      onComplete();
    }
  };



  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-center p-4">
      
      <div className="w-full max-w-xl">
        <div className="mb-12 text-center">
          <div className="w-16 h-16 bg-primary/20 text-primary rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
            <Sparkles size={32} />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Bem-vindo ao Copiloto</h1>
          <p className="text-slate-400">Vamos personalizar a inteligência para o seu contexto.</p>
        </div>

        <div className="glass-card p-8 sm:p-10 relative overflow-hidden">
          {/* Progress */}
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Como podemos te chamar?</h2>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Seu nome ou apelido"
                  value={data.name}
                  onChange={e => setData({...data, name: e.target.value})}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 text-xl text-white outline-none focus:border-primary transition-all"
                />
              </div>
              <button 
                disabled={!data.name.trim()}
                onClick={() => setStep(2)}
                className="w-full py-4 bg-primary hover:bg-primary-hover disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                Continuar <ArrowRight size={20} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <h2 className="text-2xl font-bold text-white mb-2">Qual a natureza do seu trabalho?</h2>
              <p className="text-slate-400 text-sm mb-6">Selecione os modelos que mais geram receita para você hoje.</p>
              
              <div className="grid grid-cols-2 gap-3">
                {operationOptions.map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => toggleOperation(opt.id)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all",
                      data.operationTypes.includes(opt.id) 
                        ? "bg-primary/20 border-primary text-white"
                        : "bg-slate-900 border-white/10 text-slate-400 hover:border-white/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{opt.label}</span>
                      {data.operationTypes.includes(opt.id) && <CheckCircle2 size={16} className="text-primary" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                <button onClick={() => setStep(1)} className="px-6 py-4 text-slate-400 hover:text-white font-bold">Voltar</button>
                <button 
                  disabled={data.operationTypes.length === 0}
                  onClick={() => setStep(3)}
                  className="flex-1 py-4 bg-primary hover:bg-primary-hover disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  Continuar <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <h2 className="text-2xl font-bold text-white mb-6">Alinhamento Estratégico</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-2"><Target size={14}/> Meta de Faturamento Mensal</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                    <input 
                      type="number" 
                      placeholder="15000"
                      value={data.monthlyGoal}
                      onChange={e => setData({...data, monthlyGoal: e.target.value})}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-white outline-none focus:border-primary transition-all font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-2"><DollarSign size={14}/> Custo Fixo Médio (Mensal)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                    <input 
                      type="number" 
                      placeholder="3500"
                      value={data.fixedCosts}
                      onChange={e => setData({...data, fixedCosts: e.target.value})}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-white outline-none focus:border-primary transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-xl border border-white/10 mt-4 cursor-pointer" onClick={() => setData({...data, hasRecurring: !data.hasRecurring})}>
                  <div className={cn("w-6 h-6 rounded flex items-center justify-center border transition-colors", data.hasRecurring ? "bg-primary border-primary text-white" : "border-white/20")}>
                    {data.hasRecurring && <CheckCircle2 size={16} />}
                  </div>
                  <span className="text-sm text-slate-300">Eu possuo contratos ou clientes de receita recorrente.</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                <button onClick={() => setStep(2)} className="px-6 py-4 text-slate-400 hover:text-white font-bold">Voltar</button>
                <button disabled={loading} onClick={handleFinish} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl transition-all font-bold text-sm">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Finalizar Configuração
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
