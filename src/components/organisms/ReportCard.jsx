import { useState } from 'react'
import ApperIcon from '@/components/ApperIcon'
import Button from '@/components/atoms/Button'
import { cn } from '@/utils/cn'

const ReportCard = ({ 
  title, 
  children, 
  icon, 
  actions = [], 
  isLoading = false,
  className = '',
  collapsible = false,
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed)
    }
  }

  return (
    <div className={cn(
      "bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
              <ApperIcon name={icon} className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          {collapsible && (
            <button
              onClick={toggleCollapse}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ApperIcon 
                name={isCollapsed ? "ChevronDown" : "ChevronUp"} 
                className="h-4 w-4 text-slate-500" 
              />
            </button>
          )}
        </div>
        
        {actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "ghost"}
                size="sm"
                icon={action.icon}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  )
}

export default ReportCard