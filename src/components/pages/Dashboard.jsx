import { useState, useEffect } from "react"
import MetricCard from "@/components/molecules/MetricCard"
import DashboardCharts from "@/components/organisms/DashboardCharts"
import ActivityFeed from "@/components/organisms/ActivityFeed"
import UpcomingDeadlines from "@/components/organisms/UpcomingDeadlines"
import dashboardService from "@/services/api/dashboardService"
import Loading from "@/components/ui/Loading"
import ErrorView from "@/components/ui/ErrorView"

const Dashboard = () => {
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadDashboardMetrics()
  }, [])

  const loadDashboardMetrics = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await dashboardService.getMetrics()
      setMetrics(data)
    } catch (err) {
      setError("Failed to load dashboard data")
      console.error("Error loading dashboard metrics:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />
  if (error) return <ErrorView error={error} onRetry={loadDashboardMetrics} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
          Dashboard Overview
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Monitor your business performance and project progress at a glance.
        </p>
      </div>

      {/* Metrics Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            trend={metric.trend}
            trendValue={metric.trendValue}
          />
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts />

      {/* Activity & Deadlines */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed />
        <UpcomingDeadlines />
      </div>
    </div>
  )
}

export default Dashboard