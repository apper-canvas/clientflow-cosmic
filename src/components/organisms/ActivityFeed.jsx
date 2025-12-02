import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import ApperIcon from "@/components/ApperIcon"
import dashboardService from "@/services/api/dashboardService"
import Loading from "@/components/ui/Loading"
import ErrorView from "@/components/ui/ErrorView"
import Empty from "@/components/ui/Empty"

const ActivityFeed = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await dashboardService.getRecentActivities()
      setActivities(data)
    } catch (err) {
      setError("Failed to load activities")
      console.error("Error loading activities:", err)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type) => {
    const icons = {
      project: "Folder",
      task: "CheckSquare",
      invoice: "FileText",
      expense: "Receipt",
      client: "Users"
    }
    return icons[type] || "Activity"
  }

  const getActivityColor = (type) => {
    const colors = {
      project: "text-primary-600 bg-primary-100 dark:text-primary-400 dark:bg-primary-900/20",
      task: "text-success-600 bg-success-100 dark:text-success-400 dark:bg-success-900/20",
      invoice: "text-accent-600 bg-accent-100 dark:text-accent-400 dark:bg-accent-900/20",
      expense: "text-warning-600 bg-warning-100 dark:text-warning-400 dark:bg-warning-900/20",
      client: "text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800"
    }
    return colors[type] || "text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800"
  }

  if (loading) return <Loading type="activity" />
  if (error) return <ErrorView error={error} onRetry={loadActivities} />
  if (!activities.length) return <Empty title="No recent activities" description="Activity will appear here as you work on projects." icon="Activity" />

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Recent Activity
        </h3>
        <button className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
              <ApperIcon 
                name={getActivityIcon(activity.type)} 
                className="h-4 w-4"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-900 dark:text-slate-100">
                {activity.description}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ActivityFeed