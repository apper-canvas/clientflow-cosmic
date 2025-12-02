import ApperIcon from "@/components/ApperIcon"
import { cn } from "@/utils/cn"

const ErrorView = ({ error, onRetry, className }) => {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[300px] p-8 text-center", className)}>
      <div className="bg-error-100 dark:bg-error-900/20 p-4 rounded-full mb-6">
        <ApperIcon name="AlertTriangle" className="h-12 w-12 text-error-600 dark:text-error-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Something went wrong
      </h3>
      
      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
        {error || "We encountered an error while loading your data. Please try again."}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-150"
        >
          <ApperIcon name="RotateCcw" className="h-4 w-4" />
          Try Again
        </button>
      )}
    </div>
  )
}

export default ErrorView