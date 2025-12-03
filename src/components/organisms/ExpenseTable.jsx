import { useState } from "react"
import { format } from "date-fns"
import ApperIcon from "@/components/ApperIcon"
import Button from "@/components/atoms/Button"
import StatusBadge from "@/components/molecules/StatusBadge"
import SearchBar from "@/components/molecules/SearchBar"

const ExpenseTable = ({ 
  expenses, 
  clients, 
  projects, 
  loading, 
  onEdit, 
  onDelete,
  onStatusChange 
}) => {
  const [sortField, setSortField] = useState("date")
  const [sortDirection, setSortDirection] = useState("desc")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const getClientName = (clientId) => {
    if (!clientId) return "N/A"
    const client = clients.find(c => c.Id === clientId)
    return client ? `${client.name} - ${client.company}` : "Unknown Client"
  }

  const getProjectName = (projectId) => {
    if (!projectId) return "N/A"
    const project = projects.find(p => p.Id === projectId)
    return project ? project.name : "Unknown Project"
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredAndSortedExpenses = expenses
    .filter(expense => {
      if (filterCategory && expense.category !== filterCategory) return false
      if (filterStatus && expense.status !== filterStatus) return false
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return expense.description.toLowerCase().includes(searchLower) ||
               expense.category.toLowerCase().includes(searchLower) ||
               getClientName(expense.clientId).toLowerCase().includes(searchLower) ||
               getProjectName(expense.projectId).toLowerCase().includes(searchLower)
      }
      return true
    })
    .sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]
      
      if (sortField === "date") {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }
      
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

  const categoryOptions = [
    { value: "", label: "All Categories" },
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
    { value: "", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "reimbursed", label: "Reimbursed" },
    { value: "rejected", label: "Rejected" }
  ]

  const getSortIcon = (field) => {
    if (sortField !== field) return "ArrowUpDown"
    return sortDirection === "asc" ? "ArrowUp" : "ArrowDown"
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse flex-1" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-16" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-20" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <SearchBar
          placeholder="Search expenses..."
          onSearch={setSearchTerm}
          className="flex-1 min-w-0 max-w-md"
        />
        
        <div className="flex gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <ApperIcon name={getSortIcon("date")} className="h-4 w-4" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={() => handleSort("description")}
                >
                  <div className="flex items-center gap-1">
                    Description
                    <ApperIcon name={getSortIcon("description")} className="h-4 w-4" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={() => handleSort("category")}
                >
                  <div className="flex items-center gap-1">
                    Category
                    <ApperIcon name={getSortIcon("category")} className="h-4 w-4" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center gap-1">
                    Amount
                    <ApperIcon name={getSortIcon("amount")} className="h-4 w-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Client/Project
                </th>
<th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tax Deductible
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredAndSortedExpenses.map((expense) => (
                <tr key={expense.Id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                    {format(new Date(expense.date), "MMM dd, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                    <div className="max-w-xs truncate" title={expense.description}>
                      {expense.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="capitalize text-slate-700 dark:text-slate-300">
                      {expense.category.replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    ${expense.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="space-y-1">
                      <div className="truncate max-w-32" title={getClientName(expense.clientId)}>
                        {getClientName(expense.clientId)}
                      </div>
                      <div className="truncate max-w-32 text-xs" title={getProjectName(expense.projectId)}>
                        {getProjectName(expense.projectId)}
                      </div>
                    </div>
                  </td>
<td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={expense.status} type="expense" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {expense.taxDeductible ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(expense)}
                        icon="Edit"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(expense)}
                        icon="Trash2"
                        className="text-error-600 hover:text-error-700 hover:bg-error-50 dark:hover:bg-error-900/20"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedExpenses.length === 0 && (
          <div className="text-center py-12">
            <ApperIcon name="Receipt" className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              No expenses found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {searchTerm || filterCategory || filterStatus
                ? "Try adjusting your search or filters."
                : "Get started by adding your first expense."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExpenseTable