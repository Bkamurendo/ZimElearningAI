export default function LeaderboardLoading() {
  return (
    <div className="p-4 lg:p-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-40 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        <div className="h-4 w-56 bg-slate-100 dark:bg-slate-800 rounded-lg" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 w-24 bg-slate-100 dark:bg-slate-800 rounded-full" />
        ))}
      </div>

      {/* Top 3 podium */}
      <div className="flex items-end justify-center gap-4 py-4">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-20 w-16 bg-slate-100 dark:bg-slate-800 rounded-t-xl" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30" />
          <div className="h-28 w-20 bg-amber-50 dark:bg-amber-900/20 rounded-t-xl" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-t-xl" />
        </div>
      </div>

      {/* Leaderboard list */}
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full flex-shrink-0" />
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>
            <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
