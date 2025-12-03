import { useState, useEffect } from "react"
import { format } from "date-fns"
import { toast } from "react-toastify"
import expenseService from "@/services/api/expenseService"
import projectService from "@/services/api/projectService"
import clientService from "@/services/api/clientService"
import ApperIcon from "@/components/ApperIcon"
import Button from "@/components/atoms/Button"
import Select from "@/components/atoms/Select"
import Loading from "@/components/ui/Loading"
import ErrorView from "@/components/ui/ErrorView"
import Empty from "@/components/ui/Empty"
import ExpenseTable from "@/components/organisms/ExpenseTable"
import MetricCard from "@/components/molecules/MetricCard"

const ProjectExpenseReport = () => {
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [projectsLoading, setProjectsLoading] = useState(true)

  // Load projects and clients on component mount
  useEffect(() => {
    loadProjects()
    loadClients()
  }, [])

  // Load report data when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      loadReportData()
    } else {
      setReportData(null)
    }
  }, [selectedProjectId])

  const loadProjects = async () => {
    try {
      setProjectsLoading(true)
      const projectsData = await projectService.getAll()
      setProjects(projectsData)
    } catch (err) {
      console.error("Error loading projects:", err)
      toast.error("Failed to load projects")
    } finally {
      setProjectsLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      const clientsData = await clientService.getAll()
      setClients(clientsData)
    } catch (err) {
      console.error("Error loading clients:", err)
    }
  }

  const loadReportData = async () => {
    if (!selectedProjectId) return

    try {
      setLoading(true)
      setError(null)
      const data = await expenseService.getProjectExpenseReport(selectedProjectId)
      setReportData(data)
    } catch (err) {
      console.error("Error loading project expense report:", err)
      setError("Failed to load expense report")
      toast.error("Failed to load expense report")
    } finally {
      setLoading(false)
    }
  }

  const getSelectedProject = () => {
    return projects.find(p => p.Id === parseInt(selectedProjectId))
  }

  const getClientName = (clientId) => {
    if (!clientId) return "Unassigned"
    const client = clients.find(c => c.Id === clientId)
    return client ? `${client.name} - ${client.company}` : "Unknown Client"
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount)
  }

  const getCategoryDisplayName = (category) => {
    const categoryNames = {
      office: "Office Supplies",
      travel: "Travel & Transportation",
      software: "Software & Tools",
      equipment: "Equipment & Hardware",
      meals: "Meals & Entertainment",
      marketing: "Marketing & Advertising",
      utilities: "Utilities",
      other: "Other"
    }
    return categoryNames[category] || category
  }

  const handleExpenseEdit = (expense) => {
    toast.info("Edit expense functionality would be implemented here")
  }

  const handleExpenseDelete = (expense) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      toast.info("Delete expense functionality would be implemented here")
    }
  }

  const handleExpenseStatusChange = (expense, newStatus) => {
    toast.info(`Status change functionality would be implemented here`)
  }

  if (projectsLoading) {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Project Expense Report
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Detailed expense analysis for project activities
              </p>
            </div>
          </div>
        </div>

        {/* Project Selection */}
        <div className="mb-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select Project
              </label>
              <Select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={projects.length === 0}
              >
                <option value="">Choose a project...</option>
                {projects.map(project => (
                  <option key={project.Id} value={project.Id}>
                    {project.name} - {project.status}
                  </option>
                ))}
              </Select>
            </div>
            
            {selectedProjectId && (
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Selected Project
                </div>
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  {getSelectedProject()?.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500">
                  Status: {getSelectedProject()?.status} | Budget: {formatCurrency(getSelectedProject()?.budget || 0)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8">
            <ErrorView message={error} />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mb-8">
            <Loading />
          </div>
        )}

        {/* No Project Selected */}
        {!selectedProjectId && !loading && (
          <div className="text-center py-12">
            <Empty
              icon="FolderOpen"
              title="Select a Project"
              description="Choose a project from the dropdown above to view its expense report."
            />
          </div>
        )}

        {/* Report Content */}
        {selectedProjectId && reportData && !loading && (
          <div className="space-y-8">
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Expenses"
                value={formatCurrency(reportData.totalAmount)}
                icon="DollarSign"
                className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700"
              />
              <MetricCard
                title="Number of Expenses"
                value={reportData.expenseCount}
                icon="Receipt"
                className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700"
              />
              <MetricCard
                title="Billable Amount"
                value={formatCurrency(reportData.billableBreakdown.billable)}
                icon="TrendingUp"
                className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700"
              />
              <MetricCard
                title="Non-Billable Amount"
                value={formatCurrency(reportData.billableBreakdown.nonBillable)}
                icon="TrendingDown"
                className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700"
              />
            </div>

            {/* Category Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <ApperIcon name="PieChart" className="h-5 w-5 text-primary-600" />
                Expenses by Category
              </h3>
              
              {Object.keys(reportData.byCategory).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(reportData.byCategory).map(([category, data]) => (
                    <div key={category} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {getCategoryDisplayName(category)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {data.count} items
                        </span>
                      </div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(data.amount)}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {((data.amount / reportData.totalAmount) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No category data available
                </div>
              )}
            </div>

            {/* Team Member Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <ApperIcon name="Users" className="h-5 w-5 text-primary-600" />
                Expenses by Team Member
              </h3>
              
              {Object.keys(reportData.byTeamMember).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(reportData.byTeamMember).map(([clientId, data]) => (
                    <div key={clientId} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {getClientName(parseInt(clientId))}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {data.count} expenses
                        </span>
                      </div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(data.amount)}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {((data.amount / reportData.totalAmount) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No team member data available
                </div>
              )}
            </div>

            {/* Billable Status Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <ApperIcon name="Calculator" className="h-5 w-5 text-primary-600" />
                Billable Status
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                    Billable Expenses
                  </div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(reportData.billableBreakdown.billable)}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    {reportData.totalAmount > 0 
                      ? ((reportData.billableBreakdown.billable / reportData.totalAmount) * 100).toFixed(1)
                      : 0
                    }% of total
                  </div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                  <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
                    Non-Billable Expenses
                  </div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {formatCurrency(reportData.billableBreakdown.nonBillable)}
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400">
                    {reportData.totalAmount > 0 
                      ? ((reportData.billableBreakdown.nonBillable / reportData.totalAmount) * 100).toFixed(1)
                      : 0
                    }% of total
                  </div>
                </div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <ApperIcon name="CheckCircle" className="h-5 w-5 text-primary-600" />
                Approval Status
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                    Pending
                  </div>
                  <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                    {formatCurrency(reportData.statusBreakdown.pending || 0)}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                    Approved
                  </div>
                  <div className="text-lg font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(reportData.statusBreakdown.approved || 0)}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                    Reimbursed
                  </div>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(reportData.statusBreakdown.reimbursed || 0)}
                  </div>
                </div>
                
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                  <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                    Rejected
                  </div>
                  <div className="text-lg font-bold text-red-900 dark:text-red-100">
                    {formatCurrency(reportData.statusBreakdown.rejected || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Expense List */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <ApperIcon name="List" className="h-5 w-5 text-primary-600" />
                Detailed Expense List
              </h3>
              
              {reportData.expenses.length > 0 ? (
                <ExpenseTable
                  expenses={reportData.expenses}
                  clients={clients}
                  projects={projects}
                  loading={false}
                  onEdit={handleExpenseEdit}
                  onDelete={handleExpenseDelete}
                  onStatusChange={handleExpenseStatusChange}
                />
              ) : (
                <div className="text-center py-8">
                  <Empty
                    icon="Receipt"
                    title="No Expenses Found"
                    description="This project doesn't have any expenses recorded yet."
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectExpenseReport