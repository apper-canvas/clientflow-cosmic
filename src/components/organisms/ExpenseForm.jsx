import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import Button from "@/components/atoms/Button"
import FormField from "@/components/molecules/FormField"
import ApperIcon from "@/components/ApperIcon"
import expenseService from "@/services/api/expenseService"
import clientService from "@/services/api/clientService"
import projectService from "@/services/api/projectService"

const ExpenseForm = ({ expense, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    clientId: "",
    projectId: "",
    status: "pending"
  })
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      loadFormData()
    }
  }, [isOpen])

  useEffect(() => {
    if (expense) {
      setFormData({
        amount: expense.amount.toString(),
        description: expense.description,
        category: expense.category,
        date: expense.date,
        clientId: expense.clientId || "",
        projectId: expense.projectId || "",
        status: expense.status
      })
    } else {
      setFormData({
        amount: "",
        description: "",
        category: "",
        date: new Date().toISOString().split("T")[0],
        clientId: "",
        projectId: "",
        status: "pending"
      })
    }
    setErrors({})
  }, [expense])

  const loadFormData = async () => {
    try {
      const [clientsData, projectsData] = await Promise.all([
        clientService.getAll(),
        projectService.getAll()
      ])
      setClients(clientsData)
      setProjects(projectsData)
    } catch (error) {
      console.error("Error loading form data:", error)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount is required and must be greater than 0"
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }
    if (!formData.category) {
      newErrors.category = "Category is required"
    }
    if (!formData.date) {
      newErrors.date = "Date is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)
      
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        clientId: formData.clientId || null,
        projectId: formData.projectId || null
      }

      let savedExpense
      if (expense) {
        savedExpense = await expenseService.update(expense.Id, expenseData)
        toast.success("Expense updated successfully!")
      } else {
        savedExpense = await expenseService.create(expenseData)
        toast.success("Expense added successfully!")
      }

      onSave(savedExpense)
      onClose()
    } catch (error) {
      toast.error("Failed to save expense. Please try again.")
      console.error("Error saving expense:", error)
    } finally {
      setLoading(false)
    }
  }

  const categoryOptions = [
    { value: "office", label: "Office Supplies" },
    { value: "travel", label: "Travel & Transportation" },
    { value: "software", label: "Software & Tools" },
    { value: "equipment", label: "Equipment & Hardware" },
    { value: "meals", label: "Meals & Entertainment" },
    { value: "marketing", label: "Marketing & Advertising" },
    { value: "utilities", label: "Utilities" },
    { value: "other", label: "Other" }
  ]

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "reimbursed", label: "Reimbursed" },
    { value: "rejected", label: "Rejected" }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-500/75 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {expense ? "Edit Expense" : "Add New Expense"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ApperIcon name="X" className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                error={errors.amount}
                required
                placeholder="0.00"
              />
              
              <FormField
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                error={errors.date}
                required
              />
            </div>

            <FormField
              label="Description"
              type="textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              error={errors.description}
              required
              placeholder="Enter expense description..."
              rows={3}
            />

            <FormField
              label="Category"
              type="select"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              error={errors.category}
              required
              placeholder="Select a category"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Client"
                type="select"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                placeholder="Select a client (optional)"
              >
                {clients.map(client => (
                  <option key={client.Id} value={client.Id}>
                    {client.name} - {client.company}
                  </option>
                ))}
              </FormField>

              <FormField
                label="Project"
                type="select"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                placeholder="Select a project (optional)"
              >
                {projects.map(project => (
                  <option key={project.Id} value={project.Id}>
                    {project.name}
                  </option>
                ))}
              </FormField>
            </div>

            <FormField
              label="Status"
              type="select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FormField>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                loading={loading}
                className="flex-1"
                icon="Save"
              >
                {expense ? "Update Expense" : "Add Expense"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ExpenseForm