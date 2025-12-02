import { forwardRef } from "react"
import ApperIcon from "@/components/ApperIcon"
import { cn } from "@/utils/cn"

const Select = forwardRef(({ 
  className, 
  children,
  placeholder,
  error,
  ...props 
}, ref) => {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-10 w-full rounded-md border bg-white dark:bg-slate-800 px-3 py-2 text-sm transition-colors appearance-none cursor-pointer",
          "border-slate-300 dark:border-slate-600",
          "text-slate-900 dark:text-slate-100",
          "focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-error-500 focus:ring-error-500",
          className
        )}
        ref={ref}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ApperIcon 
        name="ChevronDown" 
        className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" 
      />
    </div>
  )
})

Select.displayName = "Select"

export default Select