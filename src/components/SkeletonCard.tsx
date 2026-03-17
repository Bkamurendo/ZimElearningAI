export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 animate-pulse ${className}`}>
      <div className="h-10 w-10 bg-gray-200 dark:bg-slate-700 rounded-xl mb-4" />
      <div className="h-8 w-16 bg-gray-200 dark:bg-slate-700 rounded-lg mb-2" />
      <div className="h-3 w-24 bg-gray-100 dark:bg-slate-600 rounded" />
    </div>
  )
}

export function SkeletonRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 p-4 animate-pulse ${className}`}>
      <div className="h-10 w-10 bg-gray-200 dark:bg-slate-700 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-gray-100 dark:bg-slate-600 rounded w-1/2" />
      </div>
    </div>
  )
}

export function SkeletonBanner({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-200 dark:bg-slate-700 rounded-2xl p-8 animate-pulse ${className}`}>
      <div className="h-4 w-24 bg-gray-300 dark:bg-slate-600 rounded mb-3" />
      <div className="h-8 w-48 bg-gray-300 dark:bg-slate-600 rounded mb-4" />
      <div className="flex gap-2">
        <div className="h-6 w-20 bg-gray-300 dark:bg-slate-600 rounded-full" />
        <div className="h-6 w-20 bg-gray-300 dark:bg-slate-600 rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 4, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
