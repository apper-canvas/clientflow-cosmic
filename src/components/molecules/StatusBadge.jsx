import { cn } from "@/utils/cn"

const StatusBadge = ({ status, type = "default", className }) => {
  const variants = {
    project: {
      planning: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      active: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400",
      "on-hold": "bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
      completed: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400",
      cancelled: "bg-error-100 text-error-700 dark:bg-error-900/20 dark:text-error-400"
    },
    task: {
      todo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      "in-progress": "bg-accent-100 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400",
      review: "bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
      completed: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400"
    },
    invoice: {
      draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      sent: "bg-accent-100 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400",
      paid: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400",
      overdue: "bg-error-100 text-error-700 dark:bg-error-900/20 dark:text-error-400",
      cancelled: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
    },
    expense: {
      pending: "bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
      approved: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400",
      reimbursed: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400",
      rejected: "bg-error-100 text-error-700 dark:bg-error-900/20 dark:text-error-400"
    },
    priority: {
      low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      medium: "bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400",
      high: "bg-error-100 text-error-700 dark:bg-error-900/20 dark:text-error-400",
      urgent: "bg-error-200 text-error-800 dark:bg-error-900/40 dark:text-error-300"
    },
    default: {
      active: "bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400",
      inactive: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      pending: "bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400"
    }
  }

  const statusClasses = variants[type]?.[status] || variants.default[status] || variants.default.inactive

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        statusClasses,
        className
      )}
    >
      {status?.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase()) || "Unknown"}
    </span>
  )
}

export default StatusBadge