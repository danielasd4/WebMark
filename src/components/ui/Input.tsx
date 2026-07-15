import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-zinc-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-0 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
              icon && 'pl-9',
              error && 'border-red-400 focus:ring-red-500',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-zinc-400">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
