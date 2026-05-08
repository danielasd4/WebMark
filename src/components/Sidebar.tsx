import React from 'react';
import {
  LayoutDashboard,
  History,
  Wallet,
  CreditCard,
  Building2,
  Target,
  Archive,
  Bot,
  LogOut,
  Home
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group relative",
      active
        ? "bg-zinc-100/80 text-zinc-900"
        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
    )}
  >
    <Icon size={16} strokeWidth={active ? 2.5 : 2} className={cn(
      "transition-colors",
      active ? "text-zinc-900" : "text-zinc-400 group-hover:text-zinc-600"
    )} />
    <span className={cn(
      "text-[13px] tracking-tight",
      active ? "font-semibold" : "font-medium"
    )}>{label}</span>
  </button>
);

export const Sidebar = ({ currentView, onNavigate }: { currentView: string, onNavigate: (view: string) => void }) => {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Erro ao sair:", error);
    window.location.reload(); // Recarregar para limpar estados
  };

  return (
    <aside className="hidden lg:flex w-60 bg-surface border-r border-zinc-200/80 h-screen flex-col fixed left-0 top-0 z-50">
      {/* Branding Vency - Minimalist */}
      <div className="px-6 py-8 flex items-center gap-3">
        <div className="w-6 h-6 bg-zinc-900 rounded flex items-center justify-center">
          <span className="font-display font-bold text-white text-xs leading-none">V</span>
        </div>
        <span className="font-display font-semibold text-lg tracking-tighter text-zinc-900">Vency Hub</span>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar space-y-6">
        <div>
          <p className="px-3 text-[11px] font-medium text-zinc-400 tracking-tight mb-2">Painel de Controle</p>
          <div className="space-y-0.5">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={currentView === 'dashboard'} onClick={() => onNavigate('dashboard')} />
            <SidebarItem icon={Home} label="Família" active={currentView === 'familia'} onClick={() => onNavigate('familia')} />
            <SidebarItem icon={History} label="Histórico" active={currentView === 'timeline'} onClick={() => onNavigate('timeline')} />
            <SidebarItem icon={Wallet} label="Financeiro" active={currentView === 'financeiro'} onClick={() => onNavigate('financeiro')} />
            <SidebarItem icon={CreditCard} label="Contas" active={currentView === 'contas'} onClick={() => onNavigate('contas')} />
            <SidebarItem icon={Building2} label="Empresas" active={currentView === 'empresas'} onClick={() => onNavigate('empresas')} />
            <SidebarItem icon={Target} label="Metas" active={currentView === 'metas'} onClick={() => onNavigate('metas')} />
            <SidebarItem icon={Archive} label="Fechamentos" active={currentView === 'fechamentos'} onClick={() => onNavigate('fechamentos')} />
          </div>
        </div>

        <div>
          <p className="px-3 text-[11px] font-medium text-zinc-400 tracking-tight mb-2">Inteligência Estratégica</p>
          <div className="space-y-0.5">
            <SidebarItem icon={Bot} label="Inteligência IA" active={currentView === 'ia'} onClick={() => onNavigate('ia')} />
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-zinc-200/80 mt-auto">
        {/* User Profile technical mini-card */}
        <div className="mb-2 px-3 py-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-900 font-semibold text-xs border border-zinc-200">
            DB
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[13px] tracking-tight text-zinc-900 leading-none mb-1">Usuário Real</span>
            <span className="text-[11px] text-zinc-500 font-medium tracking-tight">Vency Premium</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-md transition-all font-medium text-[13px] tracking-tight group"
        >
          <LogOut size={16} className="group-hover:text-zinc-900" />
          Encerrar Sessão
        </button>
      </div>
    </aside>
  );
};
