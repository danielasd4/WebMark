import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Target, Lock, Mail, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthProps {
  onLogin: () => void;
}

export const Auth = ({ onLogin }: AuthProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;
        
        if (data.session) {
          onLogin();
        } else {
          setSuccess('Cadastro realizado! Verifique seu e-mail para confirmar a conta ou tente fazer login.');
          setIsSignUp(false);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        onLogin();
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary to-primary-hover flex items-center justify-center shadow-2xl shadow-primary/40 mb-6 group transition-transform hover:scale-105">
            <span className="font-display font-bold text-white text-4xl leading-none">V</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight mb-2">Vency Hub</h1>
          <p className="text-slate-400 font-medium">Gestão Financeira Estratégica</p>
        </div>

        <div className="glass-card p-8 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/5">
            <button 
              onClick={() => setIsSignUp(false)}
              className={cn(
                "flex-1 py-3 text-sm font-bold rounded-xl transition-all",
                !isSignUp ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
              )}
            >Entrar</button>
            <button 
              onClick={() => setIsSignUp(true)}
              className={cn(
                "flex-1 py-3 text-sm font-bold rounded-xl transition-all",
                isSignUp ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
              )}
            >Criar Conta</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold text-center animate-in shake-1">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center animate-in zoom-in-95">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail Corporativo ou Pessoal</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-primary" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  required
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary focus:bg-primary/5 rounded-2xl pl-12 pr-4 py-4 text-white outline-none transition-all placeholder:text-slate-600 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-primary" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary focus:bg-primary/5 rounded-2xl pl-12 pr-4 py-4 text-white outline-none transition-all placeholder:text-slate-600 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed mt-8 text-sm"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : (isSignUp ? 'Finalizar Cadastro' : 'Acessar Inteligência')}
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-slate-500 text-xs font-medium">
          Ao acessar, você concorda com nossos <span className="text-slate-400 hover:underline cursor-pointer">Termos de Uso</span>
        </p>
      </div>
    </div>
  );
};
