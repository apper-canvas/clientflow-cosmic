import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { format, isAfter, isBefore } from "date-fns";
import projectService from "@/services/api/projectService";
import taskService, { TASK_PRIORITIES, TASK_STATUSES, TASK_TYPES } from "@/services/api/taskService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import Empty from "@/components/ui/Empty";
import Select from "@/components/atoms/Select";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import TaskForm from "@/components/organisms/TaskForm";
import TaskKanban from "@/components/organisms/TaskKanban";
import TaskCard from "@/components/organisms/TaskCard";
import Projects from "@/components/pages/Projects";
import SearchBar from "@/components/molecules/SearchBar";
import StatusBadge from "@/components/molecules/StatusBadge";
import TimerWidget from "@/components/organisms/TimerWidget";
import { cn } from "@/utils/cn";

const Tasks = () => {
const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [filteredTasks, setFilteredTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [activeTimer, setActiveTimer] = useState(null)
  
  // View state
  const [view, setView] = useState('list') // 'list' or 'kanban'
  
  // Form state
  const [showForm, setShowForm] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [defaultStatus, setDefaultStatus] = useState(null)
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    projectId: '',
    assignee: '',
    type: '',
    dueDateFrom: '',
    dueDateTo: ''
  })
// Missing state variables
  const [editingTask, setEditingTask] = useState(null)
  // Load data function
  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const [tasksResponse, projectsResponse] = await Promise.all([
        taskService.getAll(),
        projectService.getAll()
      ])
      
      setTasks(tasksResponse?.data || [])
      setProjects(projectsResponse?.data || [])
      
      // Calculate stats
      const taskData = tasksResponse?.data || []
      const stats = {
        total: taskData.length,
        completed: taskData.filter(t => t.status === 'Completed').length,
        overdue: taskData.filter(t => {
          if (!t.dueDate || t.status === 'Completed') return false
          return new Date(t.dueDate) < new Date()
        }).length,
        byStatus: {},
        byPriority: {}
      }
      
      // Group by status and priority
      taskData.forEach(task => {
        stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1
        stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1
      })
      
      setStats(stats)
    } catch (err) {
      setError(err.message || 'Failed to load tasks')
      console.error('Error loading tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load tasks function for compatibility
  const loadTasks = loadData

  // Filter tasks based on current filters
useEffect(() => {
    let filtered = tasks

    // Apply search filter
    if (filters.search?.trim()) {
      const query = filters.search.toLowerCase().trim()
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.assignee?.toLowerCase().includes(query) ||
        task.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status)
    }

    // Apply priority filter
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority)
    }

    // Apply project filter
    if (filters.projectId) {
      filtered = filtered.filter(task => task.projectId === filters.projectId)
    }

    // Apply assignee filter
    if (filters.assignee?.trim()) {
      const assigneeQuery = filters.assignee.toLowerCase().trim()
      filtered = filtered.filter(task => 
        task.assignee?.toLowerCase().includes(assigneeQuery)
      )
    }

    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter(task => task.type === filters.type)
    }

    // Apply due date filters
    if (filters.dueDateFrom) {
      filtered = filtered.filter(task => 
        task.dueDate && new Date(task.dueDate) >= new Date(filters.dueDateFrom)
      )
    }
    
    if (filters.dueDateTo) {
      filtered = filtered.filter(task => 
        task.dueDate && new Date(task.dueDate) <= new Date(filters.dueDateTo)
      )
    }

    setFilteredTasks(filtered)

    // Check for active timer
    const timerTask = filtered.find(task => task.activeTimer)
    setActiveTimer(timerTask?.activeTimer || null)
  }, [tasks, filters])

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      projectId: '',
      assignee: '',
      type: '',
      dueDateFrom: '',
      dueDateTo: ''
    })
  }

  // Form handlers
const handleFormSubmit = async (taskData) => {
    try {
      if (editingTask) {
        await taskService.update(editingTask.Id, taskData)
        toast.success('Task updated successfully')
      } else {
        await taskService.create(taskData)
        toast.success('Task created successfully')
      }
      setShowForm(false)
      setEditingTask(null)
      loadData()
    } catch (err) {
      toast.error(editingTask ? 'Failed to update task' : 'Failed to create task')
      console.error('Error saving task:', err)
    }
  }

const handleEdit = (task) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleDelete = async (task) => {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return
    }

    try {
      await taskService.delete(task.Id)
      toast.success('Task deleted successfully')
      loadData()
    } catch (err) {
      toast.error('Failed to delete task')
      console.error('Error deleting task:', err)
    }
  }

const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.update(taskId, { status: newStatus });
      loadData();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

// Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  // Early returns after all hooks
  if (loading) return <Loading />
  if (error) return <ErrorView error={error} onRetry={loadData} />
  // Helper functions
  const handleCreateTask = (status = null) => {
    setEditingTask(null)
    setDefaultStatus(status)
    setShowForm(true)
  }

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.Id === projectId)
    return project?.name || `Project ${projectId}`
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'text-green-600',
      'Medium': 'text-blue-600',
      'High': 'text-orange-600',
      'Urgent': 'text-red-600'
    }
    return colors[priority] || 'text-slate-600'
  }

  const getDueDateColor = (dueDate, status) => {
    if (!dueDate || status === 'Completed') return 'text-slate-600'
    
    const due = new Date(dueDate)
    const today = new Date()
    
    if (isBefore(due, today)) {
      return 'text-red-600'
    } else if (isBefore(due, new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000))) {
      return 'text-amber-600'
    }
    return 'text-slate-600'
  }
const handleStartTimer = async (taskId) => {
    try {
      await taskService.startTimer(taskId)
      toast.success('Timer started')
      loadData()
    } catch (err) {
      toast.error('Failed to start timer')
      console.error('Error starting timer:', err)
    }
  }

  const handleStopTimer = async (taskId) => {
    try {
      await taskService.stopTimer(taskId)
      toast.success('Timer stopped')
      loadData()
    } catch (err) {
      toast.error('Failed to stop timer')
      console.error('Error stopping timer:', err)
    }
  }

  const handlePauseTimer = async (taskId) => {
    try {
      await taskService.pauseTimer(taskId)
      toast.success('Timer paused')
      loadData()
    } catch (err) {
      toast.error('Failed to pause timer')
      console.error('Error pausing timer:', err)
    }
  }

  const handleResumeTimer = async (taskId) => {
    try {
      await taskService.resumeTimer(taskId)
      toast.success('Timer resumed')
      loadData()
    } catch (err) {
      toast.error('Failed to resume timer')
      console.error('Error resuming timer:', err)
    }
  }

  const handleAddManualTime = async (taskId) => {
    const hours = prompt('Enter hours worked:')
    if (!hours || isNaN(parseFloat(hours))) {
      return
    }

    const description = prompt('Enter description (optional):') || ''
    
    try {
      await taskService.addTimeEntry(taskId, {
        duration: parseFloat(hours),
        description,
        date: new Date().toISOString().split('T')[0],
        billable: false
      })
      toast.success('Time entry added')
      loadData()
    } catch (err) {
      toast.error('Failed to add time entry')
      console.error('Error adding time entry:', err)
    }
  }

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => prev.map(task => 
      task.Id === updatedTask.Id ? updatedTask : task
    ))
  }

  return (
    <div className="space-y-6">
<div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
            Task Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage and track your project tasks efficiently.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'list'
                  ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ApperIcon name="List" className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ApperIcon name="Columns" className="w-4 h-4" />
              Kanban
            </button>
          </div>
          
          <Button onClick={() => handleCreateTask()}>
            <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Tasks</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
              </div>
              <ApperIcon name="CheckSquare" className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.byStatus['In Progress'] || 0}</p>
              </div>
              <ApperIcon name="Clock" className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <ApperIcon name="CheckCircle" className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <ApperIcon name="AlertTriangle" className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Urgent</p>
                <p className="text-2xl font-bold text-orange-600">{stats.byPriority['Urgent'] || 0}</p>
              </div>
              <ApperIcon name="Flame" className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Filters
          </h3>
          {(filters.search || filters.status || filters.priority || filters.projectId || filters.assignee || filters.type || filters.dueDateFrom || filters.dueDateTo) && (
            <Button
              variant="secondary" 
              size="sm"
              onClick={handleClearFilters}
            >
              <ApperIcon name="X" className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <SearchBar
              placeholder="Search tasks..."
              value={filters.search}
              onSearch={(value) => handleFilterChange('search', value)}
              className="w-full"
            />
          </div>
          
          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            {Object.values(TASK_STATUSES).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </Select>
          
          <Select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <option value="">All Priorities</option>
            {Object.values(TASK_PRIORITIES).map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </Select>
          
          <Select
            value={filters.projectId}
            onChange={(e) => handleFilterChange('projectId', e.target.value)}
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project.Id} value={project.Id}>{project.name}</option>
            ))}
          </Select>
          
          <Input
            placeholder="Filter by assignee..."
            value={filters.assignee}
            onChange={(e) => handleFilterChange('assignee', e.target.value)}
          />
          
          <Select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">All Types</option>
            {Object.values(TASK_TYPES).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
          
          <Input
            type="date"
            placeholder="Due from..."
            value={filters.dueDateFrom}
            onChange={(e) => handleFilterChange('dueDateFrom', e.target.value)}
          />
          
          <Input
            type="date"
            placeholder="Due to..."
            value={filters.dueDateTo}
            onChange={(e) => handleFilterChange('dueDateTo', e.target.value)}
          />
        </div>
      </div>
{/* Content */}
      {view === 'kanban' ? (
        <TaskKanban
          tasks={filteredTasks}
          loading={loading}
          onTaskUpdate={handleTaskUpdate}
          onTaskEdit={handleEdit}
          onTaskDelete={handleDelete}
          onCreateTask={handleCreateTask}
          onStartTimer={handleStartTimer}
          onStopTimer={handleStopTimer}
          projects={projects}
        />
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          {filteredTasks.length === 0 ? (
            <Empty
              title="No tasks found"
              description="No tasks match your current filters. Try adjusting your search criteria or create a new task."
              actionLabel="Create Task"
              onAction={() => handleCreateTask()}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Task</th>
                    <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Project</th>
                    <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Assignee</th>
                    <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Status</th>
                    <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Priority</th>
                    <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Due Date</th>
                    <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Progress</th>
                    <th className="text-center p-4 font-medium text-slate-900 dark:text-slate-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr 
                      key={task.Id} 
                      className={cn(
                        "border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors",
                        task.activeTimer && "bg-green-50 dark:bg-green-900/10"
                      )}
                    >
                      <td className="p-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-slate-900 dark:text-slate-100">
                              {task.title}
                            </h4>
                            {task.activeTimer && (
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Timer running"></div>
                            )}
                            {task.billable && (
                              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">
                                Billable
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs">
                              <ApperIcon name="Tag" className="w-3 h-3" />
                              {task.type}
                            </span>
                            {task.subtasks && task.subtasks.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-xs">
                                <ApperIcon name="CheckSquare" className="w-3 h-3" />
                                {task.subtasks.filter(s => s.status === 'Completed').length}/{task.subtasks.length}
                              </span>
                            )}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                {task.tags.slice(0, 2).map((tag, index) => (
                                  <span key={index} className="px-1.5 py-0.5 bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-300 rounded text-xs">
                                    {tag}
                                  </span>
                                ))}
                                {task.tags.length > 2 && (
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    +{task.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                            {task.Id && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                #{task.Id}
                              </span>
                            )}
                          </div>
                          {/* Progress bar for tasks with subtasks */}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                                <span>Progress</span>
                                <span>{task.progress || 0}%</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                <div 
                                  className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${task.progress || 0}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-slate-900 dark:text-slate-100">
                          {getProjectName(task.projectId)}
                        </div>
                      </td>
                      <td className="p-4">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                              {task.assignee.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-slate-900 dark:text-slate-100">
                              {task.assignee}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={task.status} type="task" />
                      </td>
                      <td className="p-4">
                        <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="p-4">
                        {task.dueDate ? (
                          <span className={`text-sm ${getDueDateColor(task.dueDate, task.status)}`}>
                            {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            No due date
                          </span>
                        )}
                      </td>
                      <td className="p-4">
<div className="space-y-2">
                          {/* Time Tracking */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                              <span>Tracked: {task.actualHours || 0}h</span>
                              {task.estimatedHours && <span>Est: {task.estimatedHours}h</span>}
                            </div>
                            {task.estimatedHours && (
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                <div 
                                  className="bg-primary-600 h-1.5 rounded-full"
                                  style={{ 
                                    width: `${Math.min(((task.actualHours || 0) / task.estimatedHours) * 100, 100)}%` 
                                  }}
                                />
                              </div>
                            )}
                            {task.timeEntries && task.timeEntries.length > 0 && (
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {task.timeEntries.length} time entries
                                {task.timeEntries.some(e => e.billable) && (
                                  <span className="ml-2 text-green-600 dark:text-green-400">
                                    ${task.timeEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.totalAmount || 0), 0).toFixed(2)} billable
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Timer Controls */}
                          <div className="flex items-center gap-1">
                            {task.activeTimer ? (
                              <>
                                {task.activeTimer.isPaused ? (
                                  <button
                                    onClick={() => handleResumeTimer(task.Id)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded transition-colors"
                                    title="Resume timer"
                                  >
                                    <ApperIcon name="Play" className="w-3 h-3" />
                                    Resume
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handlePauseTimer(task.Id)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 text-yellow-700 dark:text-yellow-300 rounded transition-colors"
                                    title="Pause timer"
                                  >
                                    <ApperIcon name="Pause" className="w-3 h-3" />
                                    Pause
                                  </button>
                                )}
                                <button
                                  onClick={() => handleStopTimer(task.Id)}
                                  className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded transition-colors"
                                  title="Stop timer"
                                >
                                  <ApperIcon name="Square" className="w-3 h-3" />
                                  Stop
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleStartTimer(task.Id)}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded transition-colors"
                                title="Start timer"
                              >
                                <ApperIcon name="Play" className="w-3 h-3" />
                                Start
                              </button>
                            )}
                            <button
                              onClick={() => handleAddManualTime(task.Id)}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded transition-colors"
                              title="Add manual time"
                            >
                              <ApperIcon name="Clock" className="w-3 h-3" />
                              Manual
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(task)}
                          >
                            <ApperIcon name="Edit" className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(task)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <ApperIcon name="Trash2" className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

{/* Task Form */}
      {showForm && (
        <TaskForm
          task={editingTask || selectedTask}
          isOpen={showForm}
          onClose={() => {
            setShowForm(false)
            setEditingTask(null)
            setSelectedTask(null)
            setDefaultStatus(null)
          }}
          onSave={async (savedTask) => {
            setShowForm(false)
            setEditingTask(null)
            setSelectedTask(null)
            setDefaultStatus(null)
            await loadData()
          }}
          projects={projects}
          defaultStatus={defaultStatus}
        />
      )}

      {/* Timer Widget */}
      {activeTimer && (
        <TimerWidget
          activeTimer={activeTimer}
          onStop={handleStopTimer}
          onPause={handlePauseTimer}
          onResume={handleResumeTimer}
        />
      )}
    </div>
    </div>
  )
}

export default Tasks