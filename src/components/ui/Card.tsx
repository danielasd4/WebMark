import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
  hover?: boolean
}

export function Card({ children, className, padding = 'md', onClick, hover }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white border border-zinc-100 rounded-xl shadow-xs',
        {
          'p-0': padding === 'none',
          'p-4': padding === 'sm',
          'p-6': padding === 'md',
          'p-8': padding === 'lg',
          'cursor-pointer hover:border-zinc-200 hover:shadow-sm transition-all': hover || onClick,
        },
        className
      )}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ title, value, change, trend, icon, className }: StatCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-zinc-500">{title}</p>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold text-zinc-900 tracking-tight">{value}</p>
      {change && (
        <p className={cn('text-xs mt-1.5 font-medium', {
          'text-emerald-600': trend === 'up',
          'text-red-500': trend === 'down',
          'text-zinc-400': trend === 'neutral',
        })}>
          {change}
        </p>
      )}
    </Card>
  )
}
