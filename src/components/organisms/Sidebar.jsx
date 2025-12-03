import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import Tasks from "@/components/pages/Tasks";
import Dashboard from "@/components/pages/Dashboard";
import Expenses from "@/components/pages/Expenses";
import Clients from "@/components/pages/Clients";
import Projects from "@/components/pages/Projects";
import { cn } from "@/utils/cn";

const Sidebar = ({ isOpen, onToggle }) => {
  const location = useLocation()
  
const navigationItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: "LayoutDashboard"
    },
    {
      name: "Tasks",
      href: "/tasks",
      icon: "CheckSquare"
    },
    {
      name: "Projects",
      href: "/projects",
      icon: "Folder"
    },
    {
      name: "Clients",
      href: "/clients",
      icon: "Users"
    },
    {
      name: "Time Tracking",
      href: "/time-tracking",
      icon: "Clock"
    },
    {
      name: "Expenses",
      href: "/expenses",
      icon: "Receipt"
    },
{
      name: "Invoices",
      href: "/invoices",
      icon: "FileText"
    },
    {
      name: "Documents", 
      href: "/coming-soon",
      icon: "Folder",
      comingSoon: true
    },
    {
      name: "Reports",
      href: "/reports",
      icon: "BarChart3",
      comingSoon: true
    }
  ]

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-8">
          <div className="bg-gradient-to-br from-primary-600 to-accent-600 p-2 rounded-lg">
            <ApperIcon name="Briefcase" className="h-8 w-8 text-white" />
          </div>
          <div className="ml-3">
<h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              WorkSphere
            </h1>
          </div>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
{navigationItems.map((item) => {
            const isActive = item.href === "/" ? location.pathname === "/" : location.pathname.startsWith(item.href)
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 text-primary-700 dark:text-primary-300 border-l-4 border-accent-500"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <ApperIcon
                  name={item.icon}
                  className={cn(
                    "mr-3 h-5 w-5 transition-colors",
                    isActive 
                      ? "text-primary-600 dark:text-primary-400" 
                      : "text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  )}
                />
                <span className="flex-1">{item.name}</span>
                {item.comingSoon && (
                  <span className="bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 text-xs px-2 py-0.5 rounded-full font-medium">
                    Soon
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  )

  // Mobile Sidebar
  const MobileSidebar = () => (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-40 bg-slate-600/50 backdrop-blur-sm"
            onClick={onToggle}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-primary-600 to-accent-600 p-2 rounded-lg">
                  <ApperIcon name="Briefcase" className="h-6 w-6 text-white" />
                </div>
<div className="ml-3">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    WorkSphere
                  </h1>
                </div>
              </div>
              <button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ApperIcon name="X" className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            
<nav className="mt-5 px-2 space-y-1">
              {navigationItems.map((item) => {
                const isActive = item.href === "/" ? location.pathname === "/" : location.pathname.startsWith(item.href)
                
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={onToggle}
                    className={cn(
                      "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 text-primary-700 dark:text-primary-300 border-l-4 border-accent-500"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <ApperIcon
                      name={item.icon}
                      className={cn(
                        "mr-3 h-5 w-5 transition-colors",
                        isActive 
                          ? "text-primary-600 dark:text-primary-400" 
                          : "text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                      )}
                    />
                    <span className="flex-1">{item.name}</span>
                    {item.comingSoon && (
                      <span className="bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 text-xs px-2 py-0.5 rounded-full font-medium">
                        Soon
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  )
}

export default Sidebar