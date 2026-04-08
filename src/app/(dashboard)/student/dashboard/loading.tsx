export default function DashboardLoading() {
  return (
    <div className="p-4 lg:p-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="h-9 w-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 w-24 bg-slate-100 dark:bg-slate-800 rounded-full" />
        ))}
      </div>

      {/* Content cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
