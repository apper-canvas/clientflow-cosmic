import { useState, useEffect } from "react"
import Chart from "react-apexcharts"
import { format, subMonths, startOfMonth } from "date-fns"
import dashboardService from "@/services/api/dashboardService"

const DashboardCharts = () => {
  const [revenueData, setRevenueData] = useState([])
  const [projectStatusData, setProjectStatusData] = useState([])
  const [topClientsData, setTopClientsData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChartData()
  }, [])

  const loadChartData = async () => {
    try {
      const [revenue, projectStatus, topClients] = await Promise.all([
        dashboardService.getRevenueChart(),
        dashboardService.getProjectStatusChart(),
        dashboardService.getTopClientsChart()
      ])
      
      setRevenueData(revenue)
      setProjectStatusData(projectStatus)
      setTopClientsData(topClients)
    } catch (error) {
      console.error("Error loading chart data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Revenue Chart Configuration
  const revenueChartOptions = {
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
      categories: revenueData.map(item => item.month),
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
        formatter: (value) => `$${value.toLocaleString()}`
      }
    },
    tooltip: {
      y: {
        formatter: (value) => `$${value.toLocaleString()}`
      }
    },
    theme: {
      mode: document.documentElement.classList.contains("dark") ? "dark" : "light"
    }
  }

  const revenueChartSeries = [{
    name: "Revenue",
    data: revenueData.map(item => item.amount)
  }]

  // Project Status Chart Configuration
const projectStatusOptions = {
    chart: {
      type: "donut"
    },
    colors: ["#10B981", "#2C3E85", "#F59E0B", "#EF4444", "#6B7280"],
    labels: projectStatusData.map(item => item.status),
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
        formatter: (value) => `${value} projects`
      }
    },
    theme: {
      mode: document.documentElement.classList.contains("dark") ? "dark" : "light"
    }
  }
  const projectStatusSeries = projectStatusData.map(item => item.count)

  // Top Clients Chart Configuration
  const topClientsOptions = {
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
      formatter: (value) => `$${value.toLocaleString()}`,
      offsetX: -6,
      style: {
        fontSize: "12px",
        colors: ["#fff"]
      }
    },
    xaxis: {
      categories: topClientsData.map(item => item.name),
labels: {
        formatter: (value) => `$${value.toLocaleString()}`,
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
    theme: {
      mode: document.documentElement.classList.contains("dark") ? "dark" : "light"
    }
  }

  const topClientsSeries = [{
    name: "Revenue",
    data: topClientsData.map(item => item.revenue)
  }]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-32 mb-4" />
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-32 mb-4" />
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-32 mb-4" />
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Revenue Chart */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Revenue Trend (Last 6 Months)
        </h3>
        <Chart
          options={revenueChartOptions}
          series={revenueChartSeries}
          type="line"
          height={300}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Project Status Overview
          </h3>
          <Chart
            options={projectStatusOptions}
            series={projectStatusSeries}
            type="donut"
            height={300}
          />
        </div>

        {/* Top Clients Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Top Clients by Revenue
          </h3>
          <Chart
            options={topClientsOptions}
            series={topClientsSeries}
            type="bar"
            height={300}
          />
        </div>
      </div>
    </div>
  )
}

export default DashboardCharts