export default function RevisionPackLoading() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div>
          <div className="h-7 w-64 bg-gray-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-4 w-96 bg-gray-200 dark:bg-slate-700 rounded mt-2" />
        </div>

        {/* Subject cards skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-16 bg-gray-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
              <div className="h-3 w-40 bg-gray-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>

        {/* Generate buttons skeleton */}
        <div className="flex flex-wrap gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-44 bg-gray-200 dark:bg-slate-700 rounded-xl" />
          ))}
        </div>

        {/* Content area skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 space-y-4">
          <div className="h-6 w-48 bg-gray-200 dark:bg-slate-700 rounded-lg" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 space-y-3">
          <div className="h-6 w-56 bg-gray-200 dark:bg-slate-700 rounded-lg" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 h-52" />
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 h-52" />
        </div>
      </div>
    </div>
  )
}
