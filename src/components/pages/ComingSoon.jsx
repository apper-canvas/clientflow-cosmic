import ApperIcon from "@/components/ApperIcon"

const ComingSoon = ({ feature = "Feature" }) => {
  const getFeatureIcon = (featureName) => {
    const icons = {
      "Clients": "Users",
      "Projects": "Folder",
      "Tasks": "CheckSquare",
      "Time Tracking": "Clock",
      "Invoices & Billing": "FileText",
      "Reports": "BarChart3"
    }
    return icons[featureName] || "Zap"
  }

  const getFeatureDescription = (featureName) => {
    const descriptions = {
      "Clients": "Manage your client contacts, company information, and communication history in one centralized location.",
      "Projects": "Create, organize, and track all your client projects with timelines, budgets, and team assignments.",
      "Tasks": "Break down projects into manageable tasks with priorities, deadlines, and progress tracking.",
      "Time Tracking": "Track billable hours across projects and tasks with detailed time logs and reporting.",
      "Invoices & Billing": "Generate professional invoices, track payments, and manage your billing workflow.",
      "Reports": "Comprehensive analytics and insights into your business performance, revenue, and project metrics."
    }
    return descriptions[featureName] || "This powerful feature is currently in development and will be available soon."
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/20 dark:to-accent-900/20 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <ApperIcon 
            name={getFeatureIcon(feature)} 
            className="h-12 w-12 text-primary-600 dark:text-primary-400" 
          />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          {feature} Coming Soon
        </h1>
        
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
          {getFeatureDescription(feature)}
        </p>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ApperIcon name="Calendar" className="h-5 w-5 text-accent-600 dark:text-accent-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Estimated Launch
            </span>
          </div>
          
          <div className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent font-bold text-lg">
            Q2 2024
          </div>
        </div>
        
        <div className="mt-8">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            We're working hard to bring you the best experience. 
            In the meantime, explore other features like Expenses and Dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ComingSoon