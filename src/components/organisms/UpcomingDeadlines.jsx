import { useState, useEffect } from "react"
import { format, differenceInDays } from "date-fns"
import ApperIcon from "@/components/ApperIcon"
import StatusBadge from "@/components/molecules/StatusBadge"
import dashboardService from "@/services/api/dashboardService"
import Loading from "@/components/ui/Loading"
import ErrorView from "@/components/ui/ErrorView"
import Empty from "@/components/ui/Empty"

const UpcomingDeadlines = () => {
  const [deadlines, setDeadlines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadDeadlines()
  }, [])

  const loadDeadlines = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await dashboardService.getUpcomingDeadlines()
      setDeadlines(data)
    } catch (err) {
      setError("Failed to load deadlines")
      console.error("Error loading deadlines:", err)
    } finally {
      setLoading(false)
    }
  }

  const getDaysUntilDeadline = (date) => {
    return differenceInDays(new Date(date), new Date())
  }

  const getUrgencyColor = (daysUntil) => {
    if (daysUntil < 0) return "text-error-600 dark:text-error-400"
    if (daysUntil <= 3) return "text-warning-600 dark:text-warning-400"
    return "text-slate-600 dark:text-slate-400"
  }

  const getUrgencyBadge = (daysUntil) => {
    if (daysUntil < 0) return { text: "Overdue", variant: "error" }
    if (daysUntil === 0) return { text: "Due Today", variant: "warning" }
    if (daysUntil <= 3) return { text: "Due Soon", variant: "warning" }
    return { text: "Upcoming", variant: "default" }
  }

  if (loading) return <Loading type="list" />
  if (error) return <ErrorView error={error} onRetry={loadDeadlines} />
  if (!deadlines.length) return <Empty title="No upcoming deadlines" description="You're all caught up! New deadlines will appear here." icon="Calendar" />

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Upcoming Deadlines
        </h3>
        <ApperIcon name="Calendar" className="h-5 w-5 text-slate-400" />
      </div>

      <div className="space-y-3">
        {deadlines.map((item) => {
          const daysUntil = getDaysUntilDeadline(item.deadline)
          const urgency = getUrgencyBadge(daysUntil)
          
          return (
            <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {item.name}
                  </h4>
                  <StatusBadge status={urgency.text.toLowerCase().replace(" ", "-")} type="priority" />
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <span>{format(new Date(item.deadline), "MMM dd, yyyy")}</span>
                  <span className={getUrgencyColor(daysUntil)}>
                    {daysUntil < 0 
                      ? `${Math.abs(daysUntil)} days overdue`
                      : daysUntil === 0 
                        ? "Due today"
                        : `${daysUntil} days left`
                    }
                  </span>
                </div>
                {item.client && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Client: {item.client}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <ApperIcon 
                  name={item.type === "project" ? "Folder" : item.type === "task" ? "CheckSquare" : "FileText"} 
                  className="h-4 w-4 text-slate-400" 
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default UpcomingDeadlines