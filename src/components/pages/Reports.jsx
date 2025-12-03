import React, { useEffect, useState } from "react";
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { toast } from "react-toastify";
import Chart from "react-apexcharts";
import reportsService from "@/services/api/reportsService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import Select from "@/components/atoms/Select";
import Label from "@/components/atoms/Label";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import UpcomingDeadlines from "@/components/organisms/UpcomingDeadlines";
import ReportCard from "@/components/organisms/ReportCard";
import ActivityFeed from "@/components/organisms/ActivityFeed";
import MetricCard from "@/components/molecules/MetricCard";

const Reports = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })
const [dashboardData, setDashboardData] = useState(null)
  const [profitLossData, setProfitLossData] = useState(null)
  const [monthlyComparisonData, setMonthlyComparisonData] = useState(null)
  const [ytdSummaryData, setYtdSummaryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadReportData()
  }, [activeTab, dateRange])

  const loadReportData = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (activeTab === 'overview') {
        const data = await reportsService.getOverviewDashboard(dateRange)
        setDashboardData(data)
} else if (activeTab === 'financial') {
        // Load Profit & Loss data
        const [profitLoss, monthlyComparison, ytdSummary] = await Promise.all([
          reportsService.getProfitLossReport({
            startDate: new Date(dateRange.startDate),
            endDate: new Date(dateRange.endDate)
          }),
          reportsService.getMonthlyComparison({
            startDate: new Date(dateRange.startDate),
            endDate: new Date(dateRange.endDate)
          }),
          reportsService.getYearToDateSummary()
        ])
        
        setProfitLossData(profitLoss)
        setMonthlyComparisonData(monthlyComparison)
        setYtdSummaryData(ytdSummary)
      }
    } catch (err) {
      setError('Failed to load report data')
      console.error('Error loading reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format) => {
    try {
      const result = await reportsService.exportReportData(activeTab, format, dateRange)
      if (result.success) {
        toast.success(`Report exported successfully as ${result.filename}`)
      }
    } catch (err) {
      toast.error('Failed to export report')
      console.error('Export error:', err)
    }
  }

  const handlePrint = () => {
    window.print()
    toast.info('Print dialog opened')
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getTrendIndicator = (current, previous) => {
    if (previous === 0) return { value: 0, positive: true }
    const change = ((current - previous) / previous) * 100
    return { value: Math.abs(change).toFixed(1), positive: change >= 0 }
  }

  // Chart configurations
const getRevenueChartOptions = (data) => {
  // Handle both array data and object with months property
  const categories = Array.isArray(data) 
    ? data.map(item => item.period || item.month || 'Unknown') 
    : (data?.months || []);

  return {
    chart: {
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: ['#2C3E85'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px'
        },
        formatter: (value) => formatCurrency(value)
      }
    },
    tooltip: {
      y: {
        formatter: (value) => formatCurrency(value)
      }
    },
    dataLabels: {
      enabled: false
    }
  }
}

const getClientRevenueOptions = (data) => ({
    chart: {
      type: 'bar',
      horizontal: true,
      toolbar: { show: false }
    },
    colors: ['#7C3AED'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => formatCurrency(value),
      offsetX: -6,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      }
    },
    xaxis: {
      categories: Array.isArray(data) ? data.map(item => item.clientName || item.name || 'Unknown') : [],
      labels: {
        formatter: (value) => formatCurrency(value),
        style: {
          colors: '#64748b',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px'
        }
      }
    }
  })

const getProjectStatusOptions = (data) => ({
    chart: {
      type: 'donut'
    },
    colors: ['#10B981', '#2C3E85', '#F59E0B', '#EF4444', '#6B7280'],
    labels: Array.isArray(data) ? data.map(item => item.status || 'Unknown') : [],
    legend: {
      position: 'bottom',
      labels: {
        colors: '#64748b'
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%'
        }
      }
    },
    dataLabels: {
      enabled: false
    }
  })

const getTopClientsOptions = (data) => ({
    chart: {
      type: 'bar',
      horizontal: true,
      toolbar: { show: false }
    },
    colors: ['#7C3AED'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => formatCurrency(value),
      offsetX: -6,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      }
    },
    xaxis: {
      categories: Array.isArray(data) ? data.map(item => item.company || item.name || 'Unknown') : [],
      labels: {
        formatter: (value) => formatCurrency(value),
        style: {
          colors: '#64748b',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px'
        }
      }
    }
  })

  // Load revenue analysis data
  const [revenueData, setRevenueData] = useState(null)
  const [revenueByClient, setRevenueByClient] = useState(null)
  const [revenueByProject, setRevenueByProject] = useState(null)
  const [revenueForecast, setRevenueForecast] = useState(null)
  const [revenuePeriod, setRevenuePeriod] = useState('monthly')
  
  const loadRevenueData = async () => {
    try {
      setLoading(true)
      const [revenue, clients, projects, forecast] = await Promise.all([
        reportsService.getRevenueAnalysis(dateRange, revenuePeriod),
        reportsService.getRevenueByClient(dateRange),
        reportsService.getRevenueByProject(dateRange),
        reportsService.getRevenueForecast(6)
      ])
      
      setRevenueData(revenue)
      setRevenueByClient(clients)
      setRevenueByProject(projects)
      setRevenueForecast(forecast)
    } catch (err) {
      setError('Failed to load revenue data')
      console.error('Revenue data error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle revenue period change
  const handleRevenuePeriodChange = (newPeriod) => {
    setRevenuePeriod(newPeriod)
  }

  // Export revenue report
  const handleExportRevenue = async (format) => {
    try {
      const result = await reportsService.exportReportData('revenue', format, dateRange)
      if (result.success) {
        toast.success(`Revenue report exported: ${result.filename}`)
      }
    } catch (err) {
      toast.error('Failed to export revenue report')
    }
  }

  // Load revenue data when dependencies change
  useEffect(() => {
    if (activeTab === 'financial') {
      loadRevenueData()
    }
  }, [activeTab, dateRange, revenuePeriod])

const reportTabs = [
    { id: 'overview', label: 'Overview Dashboard', icon: 'BarChart3' },
    { id: 'financial', label: 'Profit & Loss Report', icon: 'DollarSign' },
    { id: 'projects', label: 'Project Analytics', icon: 'Folder' },
    { id: 'team', label: 'Team Performance', icon: 'Users' },
    { id: 'clients', label: 'Client Insights', icon: 'Building' }
  ]

  if (loading) return <Loading type="page" />
  if (error) return <ErrorView error={error} onRetry={loadReportData} />

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Reports & Analytics
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Comprehensive insights and data visualization for your business
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Date Range Selector */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                <ApperIcon name="Calendar" className="h-4 w-4 text-slate-400" />
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="border-0 bg-transparent p-1 text-sm w-32"
                />
                <span className="text-slate-400 text-sm">to</span>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="border-0 bg-transparent p-1 text-sm w-32"
                />
              </div>
              
              {/* Export Options */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon="Download"
                  onClick={() => handleExport('pdf')}
                >
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon="FileSpreadsheet"
                  onClick={() => handleExport('csv')}
                >
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon="Printer"
                  onClick={handlePrint}
                >
                  Print
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Categories Navigation */}
        <div className="mb-8">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="flex space-x-8 overflow-x-auto">
              {reportTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <ApperIcon name={tab.icon} className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(dashboardData.totalRevenue.current)}
                icon="DollarSign"
                trend={getTrendIndicator(dashboardData.totalRevenue.current, dashboardData.totalRevenue.previous)}
                className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20"
              />
              <MetricCard
                title="Outstanding Invoices"
                value={formatCurrency(dashboardData.outstandingInvoices)}
                icon="Clock"
                className="bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20"
              />
              <MetricCard
                title="Active Projects"
                value={dashboardData.activeProjects}
                icon="Folder"
                className="bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20"
              />
              <MetricCard
                title="Hours Logged"
                value={`${dashboardData.hoursLogged}h`}
                icon="Clock"
                className="bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20"
              />
            </div>

            {/* Revenue Trend Chart */}
            <ReportCard
              title="Revenue Trend (6 Months)"
              icon="TrendingUp"
              actions={[
                { label: 'View Details', icon: 'ExternalLink', variant: 'outline' }
              ]}
            >
              <Chart
options={getRevenueChartOptions(dashboardData.revenueChart)}
                series={[{
                  name: 'Revenue',
                  data: Array.isArray(dashboardData.revenueChart?.revenue) 
                    ? dashboardData.revenueChart.revenue 
                    : (Array.isArray(dashboardData.revenueChart) 
                      ? dashboardData.revenueChart.map(item => item.value || item.amount || 0)
                      : [])
                }]}
                type="line"
                height={300}
              />
            </ReportCard>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Clients Chart */}
              <ReportCard
                title="Top 5 Clients by Revenue"
                icon="Users"
                collapsible
              >
                <Chart
                  options={getTopClientsOptions(dashboardData.topClients)}
                  series={[{
                    name: 'Revenue',
                    data: dashboardData.topClients?.map(client => client.revenue) || []
                  }]}
                  type="bar"
                  height={300}
                />
              </ReportCard>

              {/* Project Status Distribution */}
              <ReportCard
                title="Project Status Distribution"
                icon="PieChart"
                collapsible
              >
                <Chart
                  options={getProjectStatusOptions(dashboardData.projectStatusDistribution)}
                  series={dashboardData.projectStatusDistribution?.map(item => item.count) || []}
                  type="donut"
                  height={300}
                />
              </ReportCard>
            </div>

            {/* Team Productivity */}
            <ReportCard
              title="Team Productivity"
              icon="Users"
              collapsible
            >
              <div className="space-y-4">
                {dashboardData.teamProductivity?.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">{member.name}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{member.hours}h logged this month</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {member.efficiency}%
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Efficiency</div>
                    </div>
                  </div>
                ))}
              </div>
            </ReportCard>

            {/* Activity and Deadlines */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <ActivityFeed />
              </div>
              <div>
                <UpcomingDeadlines />
              </div>
            </div>
          </div>
        )}
{/* Profit & Loss Report Tab */}
        {activeTab === 'financial' && (
          <div className="space-y-8">
            {/* P&L Data Loading */}
            {profitLossData && (
              <>
                {/* Main P&L Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="Total Revenue"
                    value={formatCurrency(profitLossData.totalRevenue)}
                    icon="DollarSign"
                    className="bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20"
                  />
                  <MetricCard
                    title="Total Expenses"
                    value={formatCurrency(profitLossData.totalExpenses)}
                    icon="Receipt"
                    className="bg-gradient-to-br from-error-50 to-error-100 dark:from-error-900/20 dark:to-error-800/20"
                  />
                  <MetricCard
                    title="Gross Profit"
                    value={formatCurrency(profitLossData.grossProfit)}
                    icon="TrendingUp"
                    className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20"
                  />
                  <MetricCard
                    title="Profit Margin"
                    value={`${profitLossData.profitMargin.toFixed(1)}%`}
                    icon="Percent"
                    className="bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20"
                  />
                </div>

                {/* Revenue vs Expenses Chart */}
                <ReportCard
                  title="Revenue vs Expenses Analysis"
                  icon="BarChart3"
                  className="col-span-full"
                >
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Monthly comparison showing revenue, expenses, and profit trends</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport('csv')}
                          className="flex items-center gap-2"
                        >
                          <ApperIcon name="Download" size={16} />
                          Export CSV
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport('pdf')}
                          className="flex items-center gap-2"
                        >
                          <ApperIcon name="FileText" size={16} />
                          Export PDF
                        </Button>
                      </div>
                    </div>
                    {profitLossData.revenueVsExpensesChart && (
                      <Chart
                        options={{
                          chart: {
                            type: 'bar',
                            toolbar: { show: false },
                            stacked: false
                          },
                          colors: ['#10B981', '#EF4444', '#2C3E85'],
                          plotOptions: {
                            bar: {
                              borderRadius: 4,
                              dataLabels: {
                                position: 'top'
                              }
                            }
                          },
                          dataLabels: {
                            enabled: false
                          },
                          stroke: {
                            show: true,
                            width: 2,
                            colors: ['transparent']
                          },
                          xaxis: {
                            categories: profitLossData.revenueVsExpensesChart.map(item => item.period),
                            labels: {
                              style: {
                                colors: '#64748b',
                                fontSize: '12px'
                              }
                            }
                          },
                          yaxis: {
                            labels: {
                              style: {
                                colors: '#64748b',
                                fontSize: '12px'
                              },
                              formatter: (value) => formatCurrency(value)
                            }
                          },
                          tooltip: {
                            y: {
                              formatter: (value) => formatCurrency(value)
                            }
                          },
                          legend: {
                            position: 'top',
                            horizontalAlign: 'center'
                          },
                          grid: {
                            borderColor: '#e2e8f0',
                            strokeDashArray: 4
                          }
                        }}
                        series={[
                          {
                            name: 'Revenue',
                            data: profitLossData.revenueVsExpensesChart.map(item => item.revenue)
                          },
                          {
                            name: 'Expenses',
                            data: profitLossData.revenueVsExpensesChart.map(item => item.expenses)
                          },
                          {
                            name: 'Profit',
                            data: profitLossData.revenueVsExpensesChart.map(item => item.profit)
                          }
                        ]}
                        type="bar"
                        height={400}
                      />
                    )}
                  </div>
                </ReportCard>

                {/* Breakdown by Project */}
                {profitLossData.projectBreakdown && profitLossData.projectBreakdown.length > 0 && (
                  <ReportCard
                    title="Profit & Loss by Project"
                    icon="Briefcase"
                  >
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {profitLossData.projectBreakdown.slice(0, 8).map((project, index) => (
                          <div key={project.projectId} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                {project.projectName}
                              </h4>
                              <span className={`text-sm font-medium px-2 py-1 rounded ${
                                project.margin > 0 
                                  ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                                  : 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400'
                              }`}>
                                {project.margin > 0 ? '+' : ''}{project.margin.toFixed(1)}%
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-slate-600 dark:text-slate-400">Revenue</div>
                                <div className="font-medium text-success-600 dark:text-success-400">
                                  {formatCurrency(project.revenue)}
                                </div>
                              </div>
                              <div>
                                <div className="text-slate-600 dark:text-slate-400">Expenses</div>
                                <div className="font-medium text-error-600 dark:text-error-400">
                                  {formatCurrency(project.expenses)}
                                </div>
                              </div>
                              <div>
                                <div className="text-slate-600 dark:text-slate-400">Profit</div>
                                <div className={`font-medium ${
                                  project.profit > 0 
                                    ? 'text-success-600 dark:text-success-400'
                                    : 'text-error-600 dark:text-error-400'
                                }`}>
                                  {formatCurrency(project.profit)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ReportCard>
                )}

                {/* Breakdown by Category */}
                {profitLossData.categoryBreakdown && profitLossData.categoryBreakdown.length > 0 && (
                  <ReportCard
                    title="Expenses by Category"
                    icon="PieChart"
                  >
                    <div className="space-y-4">
                      <Chart
                        options={{
                          chart: {
                            type: 'donut'
                          },
                          colors: ['#2C3E85', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#6B7280'],
                          labels: profitLossData.categoryBreakdown.map(item => item.category),
                          legend: {
                            position: 'bottom',
                            labels: {
                              colors: '#64748b'
                            }
                          },
                          plotOptions: {
                            pie: {
                              donut: {
                                size: '70%'
                              }
                            }
                          },
                          dataLabels: {
                            enabled: true,
                            formatter: (val) => `${val.toFixed(1)}%`
                          },
                          tooltip: {
                            y: {
                              formatter: (value, { seriesIndex }) => {
                                const category = profitLossData.categoryBreakdown[seriesIndex]
                                return formatCurrency(category.amount)
                              }
                            }
                          }
                        }}
                        series={profitLossData.categoryBreakdown.map(item => item.percentage)}
                        type="donut"
                        height={350}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        {profitLossData.categoryBreakdown.map((category, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                            <span className="font-medium text-slate-900 dark:text-slate-100">{category.category}</span>
                            <div className="text-right">
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {formatCurrency(category.amount)}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {category.percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ReportCard>
                )}
              </>
            )}

            {/* Monthly Comparison */}
            {monthlyComparisonData && (
              <ReportCard
                title="Monthly Comparison"
                icon="Calendar"
              >
                <div className="space-y-6">
                  {/* Trend Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {monthlyComparisonData.trends.revenue > 0 ? '+' : ''}{monthlyComparisonData.trends.revenue.toFixed(1)}%
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">Revenue Trend</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                      <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {monthlyComparisonData.trends.expenses > 0 ? '+' : ''}{monthlyComparisonData.trends.expenses.toFixed(1)}%
                      </div>
                      <div className="text-sm text-orange-700 dark:text-orange-300">Expense Trend</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {monthlyComparisonData.trends.profit > 0 ? '+' : ''}{monthlyComparisonData.trends.profit.toFixed(1)}%
                      </div>
                      <div className="text-sm text-purple-700 dark:text-purple-300">Profit Trend</div>
                    </div>
                  </div>

                  {/* Monthly Data Chart */}
                  <Chart
                    options={{
                      chart: {
                        type: 'line',
                        toolbar: { show: false }
                      },
                      colors: ['#10B981', '#EF4444', '#2C3E85'],
                      stroke: {
                        curve: 'smooth',
                        width: 3
                      },
                      xaxis: {
                        categories: monthlyComparisonData.monthlyData.map(item => item.month),
                        labels: {
                          style: {
                            colors: '#64748b',
                            fontSize: '12px'
                          }
                        }
                      },
                      yaxis: {
                        labels: {
                          style: {
                            colors: '#64748b',
                            fontSize: '12px'
                          },
                          formatter: (value) => formatCurrency(value)
                        }
                      },
                      tooltip: {
                        y: {
                          formatter: (value) => formatCurrency(value)
                        }
                      },
                      legend: {
                        position: 'top',
                        horizontalAlign: 'center'
                      },
                      grid: {
                        borderColor: '#e2e8f0',
                        strokeDashArray: 4
                      }
                    }}
                    series={[
                      {
                        name: 'Revenue',
                        data: monthlyComparisonData.monthlyData.map(item => item.revenue)
                      },
                      {
                        name: 'Expenses',
                        data: monthlyComparisonData.monthlyData.map(item => item.expenses)
                      },
                      {
                        name: 'Profit',
                        data: monthlyComparisonData.monthlyData.map(item => item.profit)
                      }
                    ]}
                    type="line"
                    height={350}
                  />
                </div>
              </ReportCard>
            )}

            {/* Year-to-Date Summary */}
            {ytdSummaryData && (
              <ReportCard
                title="Year-to-Date Summary"
                icon="Trophy"
              >
                <div className="space-y-6">
                  {/* Current vs Previous Year */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                        {new Date().getFullYear()} (Current Year)
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-success-50 dark:bg-success-900/20">
                          <span className="text-success-700 dark:text-success-300">Total Revenue</span>
                          <span className="font-semibold text-success-600 dark:text-success-400">
                            {formatCurrency(ytdSummaryData.currentYear.revenue)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-error-50 dark:bg-error-900/20">
                          <span className="text-error-700 dark:text-error-300">Total Expenses</span>
                          <span className="font-semibold text-error-600 dark:text-error-400">
                            {formatCurrency(ytdSummaryData.currentYear.expenses)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                          <span className="text-primary-700 dark:text-primary-300">Net Profit</span>
                          <span className="font-semibold text-primary-600 dark:text-primary-400">
                            {formatCurrency(ytdSummaryData.currentYear.profit)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-accent-50 dark:bg-accent-900/20">
                          <span className="text-accent-700 dark:text-accent-300">Profit Margin</span>
                          <span className="font-semibold text-accent-600 dark:text-accent-400">
                            {ytdSummaryData.currentYear.margin.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                        {new Date().getFullYear() - 1} (Previous Year)
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                          <span className="text-slate-700 dark:text-slate-300">Total Revenue</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            {formatCurrency(ytdSummaryData.previousYear.revenue)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                          <span className="text-slate-700 dark:text-slate-300">Total Expenses</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            {formatCurrency(ytdSummaryData.previousYear.expenses)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                          <span className="text-slate-700 dark:text-slate-300">Net Profit</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            {formatCurrency(ytdSummaryData.previousYear.profit)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                          <span className="text-slate-700 dark:text-slate-300">Profit Margin</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            {ytdSummaryData.previousYear.margin.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Growth Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <ApperIcon 
                          name={ytdSummaryData.growth.revenue >= 0 ? "TrendingUp" : "TrendingDown"} 
                          className={`h-5 w-5 ${ytdSummaryData.growth.revenue >= 0 ? 'text-success-600' : 'text-error-600'}`} 
                        />
                        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {ytdSummaryData.growth.revenue > 0 ? '+' : ''}{ytdSummaryData.growth.revenue.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Revenue Growth</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <ApperIcon 
                          name={ytdSummaryData.growth.expenses >= 0 ? "TrendingUp" : "TrendingDown"} 
                          className={`h-5 w-5 ${ytdSummaryData.growth.expenses >= 0 ? 'text-error-600' : 'text-success-600'}`} 
                        />
                        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {ytdSummaryData.growth.expenses > 0 ? '+' : ''}{ytdSummaryData.growth.expenses.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Expense Growth</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <ApperIcon 
                          name={ytdSummaryData.growth.profit >= 0 ? "TrendingUp" : "TrendingDown"} 
                          className={`h-5 w-5 ${ytdSummaryData.growth.profit >= 0 ? 'text-success-600' : 'text-error-600'}`} 
                        />
                        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {ytdSummaryData.growth.profit > 0 ? '+' : ''}{ytdSummaryData.growth.profit.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Profit Growth</div>
                    </div>
                  </div>

                  {/* Average Monthly Performance */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Average Monthly Performance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                        <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(ytdSummaryData.averageMonthly.revenue)}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Avg Monthly Revenue</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                        <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(ytdSummaryData.averageMonthly.expenses)}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Avg Monthly Expenses</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                        <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(ytdSummaryData.averageMonthly.profit)}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Avg Monthly Profit</div>
                      </div>
                    </div>
                  </div>
                </div>
              </ReportCard>
            )}
          </div>
        )}

        {/* Other tabs - Coming soon */}
        {['projects', 'team', 'clients'].includes(activeTab) && (
          <ReportCard
            title={reportTabs.find(t => t.id === activeTab)?.label}
            icon={reportTabs.find(t => t.id === activeTab)?.icon}
          >
            <div className="text-center py-12">
              <ApperIcon name="Construction" className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Coming Soon
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                This report section is currently under development and will be available soon.
              </p>
            </div>
          </ReportCard>
        )}
      </div>
    </div>
  )
}

export default Reports