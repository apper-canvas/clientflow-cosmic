import Label from "@/components/atoms/Label"
import Input from "@/components/atoms/Input"
import Select from "@/components/atoms/Select"
import { cn } from "@/utils/cn"

const FormField = ({ 
  label, 
  error, 
  className, 
  children, 
  required,
  type = "input",
  ...props 
}) => {
  const renderInput = () => {
    if (children) return children
    
    switch (type) {
      case "select":
        return <Select error={error} {...props} />
      case "textarea":
        return (
          <textarea
            className={cn(
              "flex min-h-[80px] w-full rounded-md border bg-white dark:bg-slate-800 px-3 py-2 text-sm transition-colors resize-vertical",
              "border-slate-300 dark:border-slate-600",
              "placeholder:text-slate-500 dark:placeholder:text-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "text-slate-900 dark:text-slate-100",
              error && "border-error-500 focus:ring-error-500"
            )}
            {...props}
          />
        )
      default:
        return <Input type={type} error={error} {...props} />
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </Label>
      )}
      {renderInput()}
      {error && (
        <p className="text-sm text-error-500 dark:text-error-400">
          {error}
        </p>
      )}
    </div>
  )
}

export default FormField