import ApperIcon from "@/components/ApperIcon"
import { cn } from "@/utils/cn"

const Empty = ({ 
  title = "No data found", 
  description = "Get started by adding your first item.",
  actionLabel = "Add Item",
  onAction,
  icon = "FolderOpen",
  className 
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[300px] p-8 text-center", className)}>
      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-6">
        <ApperIcon name={icon} className="h-12 w-12 text-slate-400 dark:text-slate-500" />
      </div>
      
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>
      
      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
        {description}
      </p>
      
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-150"
        >
          <ApperIcon name="Plus" className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default Empty