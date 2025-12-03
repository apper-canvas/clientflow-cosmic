import React, { useState } from "react";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import ThemeToggle from "@/components/molecules/ThemeToggle";

const Header = ({ onMenuToggle }) => {
  const [showQuickActions, setShowQuickActions] = useState(false);

  const quickActions = [
    { name: "Add Expense", icon: "Plus", action: () => console.log("Add expense") },
    { name: "New Project", icon: "FolderPlus", action: () => console.log("New project"), disabled: true },
    { name: "Create Invoice", icon: "FileText", action: () => console.log("Create invoice"), disabled: true }
  ]

  return (
<header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ApperIcon name="Menu" className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
          
          <div className="hidden sm:block">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Project Management
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage clients, projects, and billing effortlessly
            </p>
          </div>
        </div>

<div className="flex items-center gap-3">
          {/* Quick Actions */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickActions(!showQuickActions)}
              icon="Zap"
            >
              Quick Actions
            </Button>
            
            {showQuickActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                {quickActions.map((action) => (
                  <button
                    key={action.name}
                    onClick={() => {
                      action.action()
                      setShowQuickActions(false)
                    }}
                    disabled={action.disabled}
                    className="flex items-center w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ApperIcon name={action.icon} className="h-4 w-4 mr-2" />
                    {action.name}
                    {action.disabled && (
                      <span className="ml-auto text-xs text-slate-500">Soon</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

{/* User Profile */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-primary-600 to-accent-600 rounded-full flex items-center justify-center">
              <ApperIcon name="User" className="h-4 w-4 text-white" />
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300">
              Admin
            </span>
          </div>
        </div>
      </div>
      
      {/* Mobile title */}
      <div className="sm:hidden mt-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Dashboard
        </h1>
      </div>
    </header>
  )
}

export default Header