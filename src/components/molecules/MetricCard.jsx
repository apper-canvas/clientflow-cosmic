import ApperIcon from "@/components/ApperIcon"
import { cn } from "@/utils/cn"

const MetricCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  className,
  onClick 
}) => {
  const isPositiveTrend = trend === "up"
  
  return (
    <div 
      className={cn(
        "metric-card group cursor-default",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {value}
          </p>
          {trend && trendValue && (
            <div className={cn(
              "flex items-center text-sm",
              isPositiveTrend 
                ? "text-success-600 dark:text-success-400" 
                : "text-error-600 dark:text-error-400"
            )}>
              <ApperIcon 
                name={isPositiveTrend ? "TrendingUp" : "TrendingDown"} 
                className="h-4 w-4 mr-1" 
              />
              <span className="font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="bg-primary-100 dark:bg-primary-900/20 p-3 rounded-lg group-hover:bg-primary-200 dark:group-hover:bg-primary-900/30 transition-colors duration-200">
            <ApperIcon 
              name={icon} 
              className="h-6 w-6 text-primary-600 dark:text-primary-400" 
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default MetricCard