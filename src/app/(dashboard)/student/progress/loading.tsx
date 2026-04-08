export default function ProgressLoading() {
  return (
    <div className="p-4 lg:p-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-44 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800 rounded-lg" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        ))}
      </div>

      {/* Subject progress bars */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
          </div>
        ))}
      </div>

      {/* Mastery heatmap placeholder */}
      <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
    </div>
  )
}
