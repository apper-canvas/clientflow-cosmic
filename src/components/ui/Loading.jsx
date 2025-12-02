import { cn } from "@/utils/cn"

const Loading = ({ className, type = "dashboard" }) => {
  if (type === "table") {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 bg-white dark:bg-slate-800 rounded-lg">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse flex-1" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-16" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-20" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Metric Cards Loading */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24" />
                <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-20" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart Loading */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-32" />
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
      </div>

      {/* Activity Feed Loading */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-32" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Loading