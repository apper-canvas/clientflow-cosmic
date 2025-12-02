import { Link } from "react-router-dom"
import ApperIcon from "@/components/ApperIcon"
import Button from "@/components/atoms/Button"

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/20 dark:to-accent-900/20 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <ApperIcon name="FileQuestion" className="h-12 w-12 text-primary-600 dark:text-primary-400" />
          </div>
          
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-4">
            404
          </h1>
          
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Page Not Found
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            The page you're looking for doesn't exist or has been moved to a new location.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to="/">
            <Button icon="Home" className="w-full">
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="grid grid-cols-2 gap-3">
            <Link to="/expenses">
              <Button variant="outline" size="sm" icon="Receipt" className="w-full">
                Expenses
              </Button>
            </Link>
            
            <Link to="/projects">
              <Button variant="outline" size="sm" icon="Folder" className="w-full">
                Projects
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Need help? Contact support or visit our help center.
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotFound