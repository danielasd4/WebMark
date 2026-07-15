import { cn } from '../../lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-zinc-100 rounded-md', className)} />
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-zinc-100 rounded-xl p-6 shadow-xs">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-32 mb-1" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-zinc-50 last:border-0">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-32 mb-1.5" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  )
}
