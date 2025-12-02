import { forwardRef } from "react"
import { cn } from "@/utils/cn"

const Input = forwardRef(({ 
  className, 
  type = "text", 
  error,
  ...props 
}, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border bg-white dark:bg-slate-800 px-3 py-2 text-sm transition-colors",
        "border-slate-300 dark:border-slate-600",
        "placeholder:text-slate-500 dark:placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "text-slate-900 dark:text-slate-100",
        error && "border-error-500 focus:ring-error-500",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})

Input.displayName = "Input"

export default Input