import { useState, useEffect } from "react"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import Chart from "react-apexcharts"
import { toast } from "react-toastify"
import Button from "@/components/atoms/Button"
import Input from "@/components/atoms/Input"
import Select from "@/components/atoms/Select"
import Loading from "@/components/ui/Loading"
import ErrorView from "@/components/ui/ErrorView"
import MetricCard from "@/components/molecules/MetricCard"
import expenseService from "@/services/api/expenseService"
import clientService from "@/services/api/clientService"
import projectService from "@/services/api/projectService"

const ExpenseReports = () => {
  const [reportData, setReportData] = useState(null)
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 5)), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd")
  })
  const [periodType, setPeriodType] = useState("month")

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (clients.length > 0 && projects.length > 0) {
      loadReportData()
    }
  }, [dateRange, periodType, clients, projects])

  const loadInitialData = async () => {
    try {
      const [clientsData, projectsData] = await Promise.all([
        clientService.getAll(),
        projectService.getAll()
      ])
      setClients(clientsData)
      setProjects(projectsData)
    } catch (err) {
      setError("Failed to load reference data")
      console.error("Error loading initial data:", err)
    }
  }

  const loadReportData = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await expenseService.getExpenseReports(
        dateRange.startDate, 
        dateRange.endDate
      )
      setReportData(data)
    } catch (err) {
      setError("Failed to load expense reports")
      console.error("Error loading reports:", err)
      toast.error("Failed to load expense reports")
    } finally {
      setLoading(false)
    }
  }

  const getProjectName = (projectId) => {
    if (projectId === 'unassigned') return 'Unassigned'
    const project = projects.find(p => p.Id === projectId)
    return project ? project.name : 'Unknown Project'
  }

  const formatCurrency = (amount) => `$${amount.toLocaleString()}`

  const formatCategoryName = (category) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // Chart Configurations
  const getChartTheme = () => ({
    mode: document.documentElement.classList.contains("dark") ? "dark" : "light"
  })

  const periodChartOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: ["#2C3E85"],
    stroke: {
      curve: "smooth",
      width: 3
    },
    grid: {
      borderColor: "#e2e8f0",
      strokeDashArray: 4
    },
    xaxis: {
      categories: reportData?.byPeriod?.map(item => item.period) || [],
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "12px"
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "12px"
        },
        formatter: (value) => formatCurrency(value)
      }
    },
    tooltip: {
      y: {
        formatter: (value) => formatCurrency(value)
      }
    },
    theme: getChartTheme()
  }

  const categoryChartOptions = {
    chart: {
      type: "donut"
    },
    colors: ["#10B981", "#2C3E85", "#F59E0B", "#EF4444", "#7C3AED", "#6B7280", "#EC4899"],
    labels: reportData?.byCategory?.map(item => formatCategoryName(item.category)) || [],
    legend: {
      position: "bottom",
      labels: {
        colors: "#64748b"
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%"
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
      y: {
        formatter: (value) => formatCurrency(value)
      }
    },
    theme: getChartTheme()
  }

  const projectChartOptions = {
    chart: {
      type: "bar",
      horizontal: true,
      toolbar: { show: false }
    },
    colors: ["#7C3AED"],
    plotOptions: {
      bar: {
        borderRadius: 4,
        dataLabels: {
          position: "top"
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => formatCurrency(value),
      offsetX: -6,
      style: {
        fontSize: "12px",
        colors: ["#fff"]
      }
    },
    xaxis: {
      categories: reportData?.byProject?.slice(0, 10).map(item => getProjectName(item.projectId)) || [],
      labels: {
        formatter: (value) => formatCurrency(value),
        style: {
          colors: "#64748b",
          fontSize: "12px"
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "12px"
        }
      }
    },
    grid: {
      borderColor: "#e2e8f0"
    },
    theme: getChartTheme()
  }

  const billableChartOptions = {
    chart: {
      type: "pie"
    },
    colors: ["#10B981", "#EF4444"],
    labels: reportData?.billableVsNonBillable?.map(item => item.type) || [],
    legend: {
      position: "bottom",
      labels: {
        colors: "#64748b"
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function(val, opts) {
        const value = reportData?.billableVsNonBillable?.[opts.seriesIndex]?.amount || 0
        return formatCurrency(value)
      }
    },
    tooltip: {
      y: {
        formatter: (value) => formatCurrency(value)
      }
    },
    theme: getChartTheme()
  }

  const statusChartOptions = {
    chart: {
      type: "donut"
    },
    colors: ["#F59E0B", "#10B981", "#2C3E85", "#EF4444"],
    labels: reportData?.approvalStatus?.map(item => item.status) || [],
    legend: {
      position: "bottom",
      labels: {
        colors: "#64748b"
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%"
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
      y: {
        formatter: (value) => formatCurrency(value)
      }
    },
    theme: getChartTheme()
  }

  if (loading) return <Loading type="page" />
  if (error) return <ErrorView error={error} onRetry={loadReportData} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            Expense Reports
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Comprehensive expense analytics and insights
          </p>
        </div>
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()} 
          icon="ArrowLeft"
          className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          Back to Expenses
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Start Date
            </label>
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              End Date
            </label>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Period Type
            </label>
            <Select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
            >
              <option value="month">Monthly</option>
              <option value="week">Weekly</option>
              <option value="year">Yearly</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <MetricCard
            title="Total Expenses"
            value={formatCurrency(reportData.totalExpenses)}
            icon="DollarSign"
            trend={null}
            className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20"
          />
          <MetricCard
            title="Total Transactions"
            value={reportData.expenseCount.toLocaleString()}
            icon="Receipt"
            trend={null}
            className="bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20"
          />
          <MetricCard
            title="Categories"
            value={reportData.byCategory?.length || 0}
            icon="Tag"
            trend={null}
            className="bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20"
          />
          <MetricCard
            title="Projects"
            value={reportData.byProject?.length || 0}
            icon="FolderOpen"
            trend={null}
            className="bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20"
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="space-y-6">
        {/* Period Trend Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Expenses by Period
          </h3>
          {reportData?.byPeriod?.length > 0 ? (
            <Chart
              options={periodChartOptions}
              series={[{
                name: "Expenses",
                data: reportData.byPeriod.map(item => item.amount)
              }]}
              type="line"
              height={350}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              No data available for the selected period
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Expenses by Category
            </h3>
            {reportData?.byCategory?.length > 0 ? (
              <Chart
                options={categoryChartOptions}
                series={reportData.byCategory.map(item => item.amount)}
                type="donut"
                height={350}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                No category data available
              </div>
            )}
          </div>

          {/* Billable vs Non-Billable */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Billable vs Non-Billable
            </h3>
            {reportData?.billableVsNonBillable?.length > 0 ? (
              <Chart
                options={billableChartOptions}
                series={reportData.billableVsNonBillable.map(item => item.amount)}
                type="pie"
                height={350}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                No billable data available
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Projects */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Top Projects by Expense
            </h3>
            {reportData?.byProject?.length > 0 ? (
              <Chart
                options={projectChartOptions}
                series={[{
                  name: "Expenses",
                  data: reportData.byProject.slice(0, 10).map(item => item.amount)
                }]}
                type="bar"
                height={350}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                No project data available
              </div>
            )}
          </div>

          {/* Approval Status */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Expenses by Approval Status
            </h3>
            {reportData?.approvalStatus?.length > 0 ? (
              <Chart
                options={statusChartOptions}
                series={reportData.approvalStatus.map(item => item.amount)}
                type="donut"
                height={350}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                No approval status data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExpenseReports