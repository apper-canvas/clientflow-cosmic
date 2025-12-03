import { useState, useEffect } from 'react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { toast } from 'react-toastify'
import Chart from 'react-apexcharts'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import Select from '@/components/atoms/Select'
import Input from '@/components/atoms/Input'
import MetricCard from '@/components/molecules/MetricCard'
import ReportCard from '@/components/organisms/ReportCard'
import ActivityFeed from '@/components/organisms/ActivityFeed'
import UpcomingDeadlines from '@/components/organisms/UpcomingDeadlines'
import Loading from '@/components/ui/Loading'
import ErrorView from '@/components/ui/ErrorView'
import reportsService from '@/services/api/reportsService'

const Reports = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })
  const [dashboardData, setDashboardData] = useState(null)
  const [financialData, setFinancialData] = useState(null)
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
        const data = await reportsService.getFinancialSummary({
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate)
        })
        setFinancialData(data)
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
  const getRevenueChartOptions = (data) => ({
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: ['#2C3E85'],
    stroke: {
      curve: 'smooth',
      width: 3
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4
    },
    xaxis: {
      categories: data?.months || [],
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
    }
  })

  const getProjectStatusOptions = (data) => ({
    chart: {
      type: 'donut'
    },
    colors: ['#10B981', '#2C3E85', '#F59E0B', '#EF4444', '#6B7280'],
    labels: data?.map(item => item.status) || [],
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
      categories: data?.map(item => item.company) || [],
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

  const reportTabs = [
    { id: 'overview', label: 'Overview Dashboard', icon: 'BarChart3' },
    { id: 'financial', label: 'Financial Reports', icon: 'DollarSign' },
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
                  data: dashboardData.revenueChart?.revenue || []
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

        {/* Financial Reports Tab */}
        {activeTab === 'financial' && financialData && (
          <div className="space-y-8">
            {/* Financial Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(financialData.totalRevenue)}
                icon="DollarSign"
                className="bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20"
              />
              <MetricCard
                title="Total Expenses"
                value={formatCurrency(financialData.totalExpenses)}
                icon="Receipt"
                className="bg-gradient-to-br from-error-50 to-error-100 dark:from-error-900/20 dark:to-error-800/20"
              />
              <MetricCard
                title="Gross Profit"
                value={formatCurrency(financialData.grossProfit)}
                icon="TrendingUp"
                className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20"
              />
              <MetricCard
                title="Profit Margin"
                value={`${financialData.profitMargin.toFixed(1)}%`}
                icon="Percent"
                className="bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20"
              />
            </div>

            {/* Invoice Breakdown */}
            <ReportCard
              title="Invoice Breakdown"
              icon="FileText"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-lg bg-success-50 dark:bg-success-900/20">
                  <div className="text-2xl font-bold text-success-600 dark:text-success-400">
                    {financialData.invoiceBreakdown.paid}
                  </div>
                  <div className="text-sm text-success-700 dark:text-success-300">Paid Invoices</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-warning-50 dark:bg-warning-900/20">
                  <div className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                    {financialData.invoiceBreakdown.pending}
                  </div>
                  <div className="text-sm text-warning-700 dark:text-warning-300">Pending Invoices</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-error-50 dark:bg-error-900/20">
                  <div className="text-2xl font-bold text-error-600 dark:text-error-400">
                    {financialData.invoiceBreakdown.overdue}
                  </div>
                  <div className="text-sm text-error-700 dark:text-error-300">Overdue Invoices</div>
                </div>
              </div>
            </ReportCard>

            {/* Expense Breakdown */}
            <ReportCard
              title="Expenses by Category"
              icon="PieChart"
            >
              <div className="space-y-3">
                {financialData.expenseBreakdown?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{item.category}</span>
                    <span className="text-slate-600 dark:text-slate-400">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </ReportCard>
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