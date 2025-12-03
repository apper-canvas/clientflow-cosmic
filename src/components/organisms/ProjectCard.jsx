import { format, differenceInDays } from "date-fns"
import { useState } from "react"
import Button from "@/components/atoms/Button"
import StatusBadge from '@/components/molecules/StatusBadge'
import ApperIcon from "@/components/ApperIcon"

const ProjectCard = ({ 
  project, 
  client, 
  viewMode = "grid",
  onView,
  onEdit, 
  onDelete 
}) => {
  const [showActions, setShowActions] = useState(false)

  const getStatusColor = (status) => {
    const colors = {
      "Planning": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      "In Progress": "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
      "On Hold": "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400",
      "Completed": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      "Cancelled": "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
    }
    return colors[status] || "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
  }

  const getPriorityIcon = (priority) => {
    const icons = {
      "Low": "ArrowDown",
      "Medium": "Minus",
      "High": "ArrowUp", 
      "Critical": "AlertTriangle"
    }
    return icons[priority] || "Minus"
  }

  const getPriorityColor = (priority) => {
    const colors = {
      "Low": "text-green-600",
      "Medium": "text-amber-600",
      "High": "text-orange-600", 
      "Critical": "text-red-600"
    }
    return colors[priority] || "text-slate-600"
  }

  const getDaysUntilDeadline = () => {
    if (!project.deadline) return null
    const days = differenceInDays(new Date(project.deadline), new Date())
    return days
  }

  const daysUntilDeadline = getDaysUntilDeadline()

  if (viewMode === "list") {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 
                  className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-primary-600"
                  onClick={() => onView(project)}
                >
                  {project.name}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                {project.priority && (
                  <div className={`flex items-center gap-1 ${getPriorityColor(project.priority)}`}>
                    <ApperIcon name={getPriorityIcon(project.priority)} className="w-3 h-3" />
                    <span className="text-xs font-medium">{project.priority}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                {client && (
                  <span className="flex items-center gap-1">
                    <ApperIcon name="Building" className="w-3 h-3" />
                    {client.company || client.name}
                  </span>
                )}
                {project.deadline && (
                  <span className="flex items-center gap-1">
                    <ApperIcon name="Calendar" className="w-3 h-3" />
                    {format(new Date(project.deadline), "MMM dd")}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <ApperIcon name="DollarSign" className="w-3 h-3" />
                  ${(project.budget || 0).toLocaleString()}
                </span>
                <span>{project.progress || 0}% complete</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onView(project)}>
              <ApperIcon name="Eye" className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(project)}>
              <ApperIcon name="Edit" className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(project)}>
              <ApperIcon name="Trash2" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 
            className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 cursor-pointer hover:text-primary-600 line-clamp-2"
            onClick={() => onView(project)}
          >
            {project.name}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
            {project.priority && (
              <div className={`flex items-center gap-1 ${getPriorityColor(project.priority)}`}>
                <ApperIcon name={getPriorityIcon(project.priority)} className="w-3 h-3" />
                <span className="text-xs font-medium">{project.priority}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowActions(!showActions)}
          >
            <ApperIcon name="MoreVertical" className="w-4 h-4" />
          </Button>
          {showActions && (
            <div className="absolute right-0 top-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 min-w-32">
              <button
                className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-lg"
                onClick={() => {
                  onView(project)
                  setShowActions(false)
                }}
              >
                <ApperIcon name="Eye" className="w-4 h-4 mr-2 inline" />
                View Details
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => {
                  onEdit(project)
                  setShowActions(false)
                }}
              >
                <ApperIcon name="Edit" className="w-4 h-4 mr-2 inline" />
                Edit
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                onClick={() => {
                  onDelete(project)
                  setShowActions(false)
                }}
              >
                <ApperIcon name="Trash2" className="w-4 h-4 mr-2 inline" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {project.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="space-y-3 mb-4">
        {client && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <ApperIcon name="Building" className="w-4 h-4" />
            <span>{client.company || client.name}</span>
          </div>
        )}
        
        {project.deadline && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <ApperIcon name="Calendar" className="w-4 h-4" />
            <span>Due {format(new Date(project.deadline), "MMM dd, yyyy")}</span>
            {daysUntilDeadline !== null && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                daysUntilDeadline < 0 
                  ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400" 
                  : daysUntilDeadline <= 7 
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" 
                    : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              }`}>
                {daysUntilDeadline < 0 
                  ? `${Math.abs(daysUntilDeadline)}d overdue`
                  : daysUntilDeadline === 0
                    ? "Due today"
                    : `${daysUntilDeadline}d left`
                }
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <ApperIcon name="DollarSign" className="w-4 h-4" />
          <span>${(project.budget || 0).toLocaleString()} budget</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress</span>
          <span className="text-sm text-slate-600 dark:text-slate-400">{project.progress || 0}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress || 0}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          variant="primary" 
          size="sm" 
          className="flex-1"
          onClick={() => onView(project)}
        >
          View Details
        </Button>
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => onEdit(project)}
        >
          <ApperIcon name="Edit" className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export default ProjectCard