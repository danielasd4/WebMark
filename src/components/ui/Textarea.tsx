import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const areaId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={areaId} className="text-sm font-medium text-zinc-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          className={cn(
            'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none',
            error && 'border-red-400 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
