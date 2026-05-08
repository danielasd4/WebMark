import React from 'react';
import { cn, formatCurrency } from '../lib/utils';

interface DashboardCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  className?: string;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  priority?: 'high' | 'medium' | 'low';
  soft?: boolean;
  children?: React.ReactNode;
}

export const DashboardCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  subtitle,
  className,
  variant = 'neutral',
  priority = 'medium',
  soft = false,
  children
}: DashboardCardProps) => {
  // Cores sutis apenas para o ícone
  const iconColors = {
    success: "text-emerald-600",
    danger: "text-rose-600",
    warning: "text-amber-600",
    info: "text-blue-600",
    neutral: "text-zinc-500"
  };

  return (
    <div className={cn(
      "glass-card p-6 group flex flex-col justify-between transition-all duration-300",
      soft ? "rounded-[24px] border-white/50 bg-white/40 shadow-sm hover:shadow-md" : "rounded-2xl bg-white",
      priority === 'high' && !soft ? "bg-zinc-900/[0.02] border-zinc-300" : "",
      className
    )}>
      <div className="flex justify-between items-start mb-6">
        <span className="text-[13px] font-medium text-zinc-500 tracking-tight">
          {title}
        </span>
        <div className={cn("transition-transform group-hover:scale-110 duration-300", iconColors[variant])}>
          <Icon size={16} strokeWidth={2} />
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <h3 className={cn(
          "font-display tracking-tighter leading-none text-zinc-900",
          priority === 'high' ? "text-3xl font-semibold" : "text-2xl font-medium"
        )}>
          {typeof value === 'number' ? formatCurrency(value) : value}
        </h3>
        
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span className={cn(
              "text-[12px] font-medium flex items-center gap-0.5", 
              trend.isPositive ? "text-emerald-600" : "text-rose-600"
            )}>
              {trend.isPositive ? "↑" : "↓"} {trend.value}%
            </span>
          )}
          {subtitle && (
            <span className="text-[12px] text-zinc-400 font-medium tracking-tight">{subtitle}</span>
          )}
          {!subtitle && trend && (
            <span className="text-[12px] text-zinc-400 font-medium tracking-tight">vs. último mês</span>
          )}
        </div>

        {children && (
          <div className="mt-4 pt-4 border-t border-zinc-100">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};
