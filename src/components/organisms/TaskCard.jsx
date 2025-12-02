import { useState } from 'react'
import { format, isAfter, isBefore, isToday } from 'date-fns'
import Button from '@/components/atoms/Button'
import StatusBadge from '@/components/molecules/StatusBadge'
import ApperIcon from '@/components/ApperIcon'

const TaskCard = ({ 
  task, 
  onEdit, 
  onDelete, 
  onStatusChange,
  showProject = true,
  projects = [],
  compact = false,
  draggable = false,
  ...dragProps
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false)

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'text-green-600 bg-green-50 border-green-200',
      'Medium': 'text-blue-600 bg-blue-50 border-blue-200',
      'High': 'text-orange-600 bg-orange-50 border-orange-200',
      'Urgent': 'text-red-600 bg-red-50 border-red-200'
    }
    return colors[priority] || 'text-slate-600 bg-slate-50 border-slate-200'
  }

  const getPriorityIcon = (priority) => {
    const icons = {
      'Low': 'ArrowDown',
      'Medium': 'Minus',
      'High': 'ArrowUp', 
      'Urgent': 'AlertTriangle'
    }
    return icons[priority] || 'Minus'
  }

  const getTypeIcon = (type) => {
    const icons = {
      'Development': 'Code',
      'Design': 'Palette',
      'Testing': 'TestTube',
      'Bug': 'Bug',
      'Documentation': 'FileText',
      'Meeting': 'Users',
      'Other': 'Circle'
    }
    return icons[type] || 'Circle'
  }

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return null
    
    const due = new Date(dueDate)
    const today = new Date()
    
    if (isToday(due)) {
      return { status: 'today', color: 'text-amber-600 bg-amber-50', label: 'Due Today' }
    } else if (isBefore(due, today)) {
      return { status: 'overdue', color: 'text-red-600 bg-red-50', label: 'Overdue' }
    } else if (isBefore(due, new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000))) {
      return { status: 'soon', color: 'text-amber-600 bg-amber-50', label: 'Due Soon' }
    }
    return { status: 'future', color: 'text-slate-600 bg-slate-50', label: 'Upcoming' }
  }

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.Id === projectId)
    return project?.name || `Project ${projectId}`
  }

  const getProgressPercentage = () => {
    if (!task.estimatedHours || !task.actualHours) return 0
    return Math.min((task.actualHours / task.estimatedHours) * 100, 100)
  }

  const dueDateInfo = getDueDateStatus(task.dueDate)
  const progressPercentage = getProgressPercentage()

  return (
    <div 
      className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-all duration-200 ${
        draggable ? 'cursor-move' : 'cursor-default'
      } ${compact ? 'p-3' : 'p-4'}`}
      onMouseEnter={() => setShowQuickActions(true)}
      onMouseLeave={() => setShowQuickActions(false)}
      {...(draggable ? dragProps : {})}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-slate-900 dark:text-slate-100 truncate ${
            compact ? 'text-sm' : 'text-base'
          }`}>
            {task.title}
          </h3>
          {task.description && (
            <p className={`text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 ${
              compact ? 'text-xs' : 'text-sm'
            }`}>
              {task.description}
            </p>
          )}
        </div>

        {showQuickActions && !compact && (
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ApperIcon name="Edit" className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
            >
              <ApperIcon name="Trash2" className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Meta Information */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Priority */}
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
          <ApperIcon name={getPriorityIcon(task.priority)} className="w-3 h-3" />
          {task.priority}
        </div>

        {/* Type */}
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
          <ApperIcon name={getTypeIcon(task.type)} className="w-3 h-3" />
          {task.type}
        </div>

        {/* Project */}
        {showProject && task.projectId && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <ApperIcon name="Folder" className="w-3 h-3" />
            {getProjectName(task.projectId)}
          </div>
        )}
      </div>

      {/* Due Date */}
      {task.dueDate && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ApperIcon name="Calendar" className="w-4 h-4 text-slate-500" />
            <span className={`text-sm ${dueDateInfo?.color?.split(' ')[0] || 'text-slate-600'}`}>
              {format(new Date(task.dueDate), 'MMM dd, yyyy')}
            </span>
          </div>
          {dueDateInfo && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${dueDateInfo.color}`}>
              {dueDateInfo.label}
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {task.estimatedHours && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-600 dark:text-slate-400">Progress</span>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {task.actualHours || 0}h / {task.estimatedHours}h
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                progressPercentage > 100 ? 'bg-red-500' : 
                progressPercentage > 80 ? 'bg-amber-500' : 'bg-primary-500'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Assignee */}
      {task.assignee && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
            {task.assignee.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {task.assignee}
          </span>
        </div>
      )}

      {/* Dependencies */}
      {(task.blockedBy?.length > 0 || task.blocks?.length > 0) && (
        <div className="flex items-center gap-2 mb-3">
          {task.blockedBy?.length > 0 && (
            <div className="flex items-center gap-1">
              <ApperIcon name="Lock" className="w-3 h-3 text-red-500" />
              <span className="text-xs text-red-600 dark:text-red-400">
                Blocked by {task.blockedBy.length}
              </span>
            </div>
          )}
          {task.blocks?.length > 0 && (
            <div className="flex items-center gap-1">
              <ApperIcon name="Shield" className="w-3 h-3 text-orange-500" />
              <span className="text-xs text-orange-600 dark:text-orange-400">
                Blocks {task.blocks.length}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
        <StatusBadge 
          status={task.status} 
          type="task"
          className="text-xs"
        />
        
        <div className="flex items-center gap-2">
          {task.Id && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              #{task.Id}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskCard