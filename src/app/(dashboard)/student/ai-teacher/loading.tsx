export default function AITeacherLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] lg:h-screen animate-pulse">
      {/* Top toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        <div className="ml-auto flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 px-4 py-6 space-y-4 overflow-hidden">
        {/* AI message */}
        <div className="flex gap-3 max-w-xl">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          </div>
        </div>
        {/* User message */}
        <div className="flex gap-3 max-w-sm ml-auto">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-lg" />
            <div className="h-4 w-2/3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg ml-auto" />
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
        </div>
        {/* Another AI message */}
        <div className="flex gap-3 max-w-xl">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      </div>
    </div>
  )
}
