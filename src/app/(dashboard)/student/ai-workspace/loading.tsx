export default function AIWorkspaceLoading() {
  return (
    <div className="p-4 lg:p-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-56 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        <div className="h-4 w-80 bg-slate-100 dark:bg-slate-800 rounded-lg" />
      </div>

      {/* Action buttons row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        ))}
      </div>

      {/* Section heading */}
      <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg" />

      {/* Cards */}
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        ))}
      </div>

      {/* Section heading */}
      <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
