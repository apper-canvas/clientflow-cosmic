import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import Button from "@/components/atoms/Button"
import ExpenseTable from "@/components/organisms/ExpenseTable"
import ExpenseForm from "@/components/organisms/ExpenseForm"
import Loading from "@/components/ui/Loading"
import ErrorView from "@/components/ui/ErrorView"
import Empty from "@/components/ui/Empty"
import expenseService from "@/services/api/expenseService"
import clientService from "@/services/api/clientService"
import projectService from "@/services/api/projectService"

const Expenses = () => {
  const [expenses, setExpenses] = useState([])
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")
      const [expensesData, clientsData, projectsData] = await Promise.all([
        expenseService.getAll(),
        clientService.getAll(),
        projectService.getAll()
      ])
      setExpenses(expensesData)
      setClients(clientsData)
      setProjects(projectsData)
    } catch (err) {
      setError("Failed to load expenses data")
      console.error("Error loading expenses:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = () => {
    setEditingExpense(null)
    setShowForm(true)
  }

  const handleEditExpense = (expense) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  const handleDeleteExpense = async (expense) => {
    if (!window.confirm(`Are you sure you want to delete this expense: "${expense.description}"?`)) {
      return
    }

    try {
      await expenseService.delete(expense.Id)
      setExpenses(expenses.filter(e => e.Id !== expense.Id))
      toast.success("Expense deleted successfully!")
    } catch (error) {
      toast.error("Failed to delete expense. Please try again.")
      console.error("Error deleting expense:", error)
    }
  }

  const handleSaveExpense = (savedExpense) => {
    if (editingExpense) {
      setExpenses(expenses.map(e => e.Id === savedExpense.Id ? savedExpense : e))
    } else {
      setExpenses([savedExpense, ...expenses])
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingExpense(null)
  }

  const calculateTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0)
  }

  const getExpensesByStatus = (status) => {
    return expenses.filter(expense => expense.status === status).length
  }

  if (loading) return <Loading type="table" />
  if (error) return <ErrorView error={error} onRetry={loadData} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            Expense Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Track and manage all your business expenses
          </p>
</div>
        <div className="flex gap-3">
          <Button onClick={handleAddExpense} icon="Plus">
            Add Expense
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = '/tax-reports'} 
            icon="FileText"
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            Tax Report
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = '/expense-reports'} 
            icon="BarChart3"
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            View Reports
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  ${calculateTotalExpenses().toLocaleString()}
                </p>
              </div>
              <div className="bg-primary-100 dark:bg-primary-900/20 p-3 rounded-lg">
                <span className="text-primary-600 dark:text-primary-400 text-xl">💳</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Pending
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {getExpensesByStatus("pending")}
                </p>
              </div>
              <div className="bg-warning-100 dark:bg-warning-900/20 p-3 rounded-lg">
                <span className="text-warning-600 dark:text-warning-400 text-xl">⏳</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Approved
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {getExpensesByStatus("approved")}
                </p>
              </div>
              <div className="bg-success-100 dark:bg-success-900/20 p-3 rounded-lg">
                <span className="text-success-600 dark:text-success-400 text-xl">✅</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Reimbursed
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {getExpensesByStatus("reimbursed")}
                </p>
              </div>
              <div className="bg-success-100 dark:bg-success-900/20 p-3 rounded-lg">
                <span className="text-success-600 dark:text-success-400 text-xl">💰</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Table or Empty State */}
      {expenses.length === 0 ? (
        <Empty
          title="No expenses yet"
          description="Start tracking your business expenses to keep your finances organized."
          actionLabel="Add First Expense"
          onAction={handleAddExpense}
          icon="Receipt"
        />
      ) : (
        <ExpenseTable
          expenses={expenses}
          clients={clients}
          projects={projects}
          loading={false}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
        />
      )}

      {/* Expense Form Modal */}
      <ExpenseForm
        expense={editingExpense}
        isOpen={showForm}
        onClose={handleCloseForm}
        onSave={handleSaveExpense}
      />
    </div>
  )
}

export default Expenses