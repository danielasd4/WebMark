import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:ring-zinc-900 shadow-sm': variant === 'primary',
            'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus-visible:ring-zinc-300': variant === 'secondary',
            'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-zinc-300': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600': variant === 'danger',
            'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 focus-visible:ring-zinc-300': variant === 'outline',
          },
          {
            'text-xs px-2.5 py-1.5 h-7': size === 'xs',
            'text-sm px-3 py-1.5 h-8': size === 'sm',
            'text-sm px-4 py-2 h-9': size === 'md',
            'text-base px-5 py-2.5 h-11': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" size={16} /> : icon}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
