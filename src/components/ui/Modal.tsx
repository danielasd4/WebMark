import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
}

export function Modal({ open, onClose, title, description, children, size = 'md', className }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200',
          sizes[size],
          className
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between p-6 border-b border-zinc-100">
            <div>
              {title && <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>}
              {description && <p className="text-sm text-zinc-500 mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors z-10"
          >
            <X size={16} />
          </button>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
