import React, { useEffect, useState } from "react";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { toast } from "react-toastify";
import expenseService from "@/services/api/expenseService";
import clientService from "@/services/api/clientService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import Select from "@/components/atoms/Select";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import ExpenseTable from "@/components/organisms/ExpenseTable";
import Expenses from "@/components/pages/Expenses";
import MetricCard from "@/components/molecules/MetricCard";
import StatusBadge from "@/components/molecules/StatusBadge";

const EmployeeExpenseReport = () => {
  const [reportData, setReportData] = useState(null)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 5)), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd")
  })
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (clients.length > 0) {
      loadReportData()
    }
  }, [dateRange, clients])

const loadInitialData = async () => {
    try {
      const clientsData = await clientService.getAll()
      setClients(clientsData)
    } catch (err) {
      setError("Failed to load employee data")
      console.error("Error loading initial data:", err)
    }
  }

  const loadReportData = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await expenseService.getEmployeeExpenseReport(
        dateRange.startDate, 
        dateRange.endDate
      )
      setReportData(data)
    } catch (err) {
      setError("Failed to load employee expense report")
      console.error("Error loading reports:", err)
      toast.error("Failed to load employee expense report")
    } finally {
      setLoading(false)
    }
  }

const getEmployeeName = (employeeId) => {
    if (employeeId === 'unassigned') return 'Unassigned'
    const employee = clients.find(c => c.Id === employeeId)
    return employee ? `${employee.name} - ${employee.company}` : 'Unknown Employee'
  }

  const formatCurrency = (amount) => `$${amount.toLocaleString()}`

  const getFilteredEmployees = () => {
    if (!reportData?.byEmployee) return []
    let filtered = reportData.byEmployee

    if (selectedEmployeeId) {
      filtered = filtered.filter(emp => emp.employeeId === parseInt(selectedEmployeeId))
    }

    if (statusFilter) {
      filtered = filtered.filter(emp => {
        if (statusFilter === 'pending') return emp.pendingAmount > 0
        if (statusFilter === 'approved') return emp.approvedAmount > 0
        if (statusFilter === 'reimbursed') return emp.reimbursedAmount > 0
        if (statusFilter === 'rejected') return emp.rejectedAmount > 0
        return true
      })
    }

    return filtered
  }

  const getFilteredExpenses = () => {
    if (!reportData?.expenses) return []
    let filtered = reportData.expenses

    if (selectedEmployeeId) {
      filtered = filtered.filter(exp => exp.clientId === parseInt(selectedEmployeeId))
    }

    if (statusFilter) {
      filtered = filtered.filter(exp => exp.status === statusFilter)
    }

    return filtered
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
            Employee Expense Report
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Team member expense analysis, reimbursement tracking, and approval status
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              Team Member
            </label>
            <Select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="">All Employees</option>
              {clients.map(client => (
                <option key={client.Id} value={client.Id}>
                  {client.name} - {client.company}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Status Filter
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved (Awaiting Reimbursement)</option>
              <option value="reimbursed">Reimbursed</option>
              <option value="rejected">Rejected</option>
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
            title="Reimbursed Amount"
            value={formatCurrency(reportData.reimbursementStatus?.reimbursed || 0)}
            icon="CheckCircle"
            trend={null}
            className="bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20"
          />
          <MetricCard
            title="Pending Approvals"
            value={`${reportData.pendingApprovals?.count || 0} (${formatCurrency(reportData.pendingApprovals?.totalAmount || 0)})`}
            icon="Clock"
            trend={null}
            className="bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20"
          />
          <MetricCard
            title="Outstanding Amount"
            value={formatCurrency(reportData.reimbursementStatus?.totalOutstanding || 0)}
            icon="AlertCircle"
            trend={null}
            className="bg-gradient-to-br from-error-50 to-error-100 dark:from-error-900/20 dark:to-error-800/20"
          />
        </div>
)}

      {/* Team Member Breakdown */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <ApperIcon name="Users" className="h-5 w-5 text-primary-600" />
          Employee Expense Summary
        </h3>
        
        <div className="space-y-4">
          {getFilteredEmployees().map((employee) => (
            <div key={employee.employeeId} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">
                  {getEmployeeName(employee.employeeId)}
                </h4>
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(employee.totalAmount)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-700">
                  <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Pending</div>
                  <div className="text-sm font-bold text-yellow-900 dark:text-yellow-100">
                    {formatCurrency(employee.pendingAmount)}
                  </div>
                </div>
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-300">Approved</div>
                  <div className="text-sm font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(employee.approvedAmount)}
                  </div>
                </div>
                <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
                  <div className="text-xs font-medium text-green-700 dark:text-green-300">Reimbursed</div>
                  <div className="text-sm font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(employee.reimbursedAmount)}
                  </div>
                </div>
                <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-700">
                  <div className="text-xs font-medium text-red-700 dark:text-red-300">Rejected</div>
                  <div className="text-sm font-bold text-red-900 dark:text-red-100">
                    {formatCurrency(employee.rejectedAmount)}
                  </div>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {employee.expenseCount} expenses total
              </div>
            </div>
          ))}
          
          {getFilteredEmployees().length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No employees found for the selected filters
            </div>
          )}
        </div>
      </div>

      {/* Reimbursement Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <ApperIcon name="CheckCircle" className="h-5 w-5 text-primary-600" />
            Reimbursement Status
          </h3>
          
          {reportData?.reimbursementStatus && (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
                <span className="text-green-700 dark:text-green-300 font-medium">Reimbursed</span>
                <span className="text-green-900 dark:text-green-100 font-bold">
                  {formatCurrency(reportData.reimbursementStatus.reimbursed)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                <span className="text-blue-700 dark:text-blue-300 font-medium">Pending Reimbursement</span>
                <span className="text-blue-900 dark:text-blue-100 font-bold">
                  {formatCurrency(reportData.reimbursementStatus.pendingReimbursement)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-700">
                <span className="text-yellow-700 dark:text-yellow-300 font-medium">Awaiting Approval</span>
                <span className="text-yellow-900 dark:text-yellow-100 font-bold">
                  {formatCurrency(reportData.reimbursementStatus.awaitingApproval)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <ApperIcon name="Clock" className="h-5 w-5 text-primary-600" />
            Pending Approvals ({reportData?.pendingApprovals?.count || 0})
          </h3>
          
          {reportData?.pendingApprovals?.expenses?.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {reportData.pendingApprovals.expenses.slice(0, 5).map((expense) => (
                <div key={expense.Id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-32">
                      {expense.description}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {getEmployeeName(expense.clientId)} • {format(new Date(expense.date), "MMM dd")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(expense.amount)}
                    </div>
                    <StatusBadge status={expense.status} type="expense" />
                  </div>
                </div>
              ))}
              
              {reportData.pendingApprovals.expenses.length > 5 && (
                <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
                  +{reportData.pendingApprovals.expenses.length - 5} more pending...
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No pending approvals
            </div>
          )}
        </div>
      </div>

      {/* Detailed Expense List */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <ApperIcon name="List" className="h-5 w-5 text-primary-600" />
          Filtered Expense Details
        </h3>
        
        <ExpenseTable
          expenses={getFilteredExpenses()}
          clients={clients}
          projects={[]}
          loading={false}
          onEdit={(expense) => toast.info("Edit functionality would be implemented here")}
          onDelete={(expense) => toast.info("Delete functionality would be implemented here")}
          onStatusChange={(expense, status) => toast.info("Status change functionality would be implemented here")}
        />
      </div>
</div>
  )
}

export default EmployeeExpenseReport