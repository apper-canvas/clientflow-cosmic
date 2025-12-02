import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import Button from '@/components/atoms/Button'
import TaskCard from '@/components/organisms/TaskCard'
import ApperIcon from '@/components/ApperIcon'
import Loading from '@/components/ui/Loading'
import taskService, { TASK_STATUSES } from '@/services/api/taskService'

const TaskKanban = ({ 
  tasks = [], 
  loading, 
  onTaskUpdate, 
  onTaskEdit, 
  onTaskDelete, 
  onCreateTask,
  projects = [] 
}) => {
  const [columns, setColumns] = useState({})
  const [draggedTask, setDraggedTask] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)

  useEffect(() => {
    // Group tasks by status
    const groupedTasks = {}
    Object.values(TASK_STATUSES).forEach(status => {
      groupedTasks[status] = tasks.filter(task => task.status === status)
    })
    setColumns(groupedTasks)
  }, [tasks])

  const getColumnColor = (status) => {
    const colors = {
      'To Do': 'border-slate-300 bg-slate-50',
      'In Progress': 'border-blue-300 bg-blue-50',
      'Review': 'border-amber-300 bg-amber-50', 
      'Completed': 'border-green-300 bg-green-50',
      'Cancelled': 'border-red-300 bg-red-50'
    }
    return colors[status] || 'border-slate-300 bg-slate-50'
  }

  const getColumnIcon = (status) => {
    const icons = {
      'To Do': 'Circle',
      'In Progress': 'Clock',
      'Review': 'Eye',
      'Completed': 'CheckCircle',
      'Cancelled': 'XCircle'
    }
    return icons[status] || 'Circle'
  }

  const handleDragStart = (e, task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, status) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }

  const handleDragLeave = (e) => {
    // Only clear dragOverColumn if we're leaving the column container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null)
    }
  }

  const handleDrop = async (e, newStatus) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null)
      return
    }

    try {
      const updatedTask = await taskService.updateStatus(draggedTask.Id, newStatus)
      onTaskUpdate(updatedTask)
      toast.success(`Task moved to ${newStatus}`)
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status')
    }

    setDraggedTask(null)
  }

  const handleCreateTask = (status) => {
    onCreateTask(status)
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="h-full overflow-x-auto">
      <div className="flex gap-6 min-w-max pb-6">
        {Object.values(TASK_STATUSES).map(status => (
          <div
            key={status}
            className={`w-80 flex-shrink-0 rounded-lg border-2 ${getColumnColor(status)} ${
              dragOverColumn === status ? 'border-primary-400 bg-primary-50' : ''
            } transition-colors duration-200`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Column Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ApperIcon 
                    name={getColumnIcon(status)} 
                    className={`w-5 h-5 ${
                      status === 'Completed' ? 'text-green-600' :
                      status === 'In Progress' ? 'text-blue-600' :
                      status === 'Review' ? 'text-amber-600' :
                      status === 'Cancelled' ? 'text-red-600' :
                      'text-slate-600'
                    }`}
                  />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {status}
                  </h3>
                  <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full px-2 py-1 text-xs font-medium">
                    {columns[status]?.length || 0}
                  </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCreateTask(status)}
                  className="text-slate-600 hover:text-primary-600"
                >
                  <ApperIcon name="Plus" className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Column Content */}
            <div className="p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
              {columns[status]?.map(task => (
                <div
                  key={task.Id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  className={`${draggedTask?.Id === task.Id ? 'opacity-50' : ''} transition-opacity`}
                >
                  <TaskCard
                    task={task}
                    onEdit={onTaskEdit}
                    onDelete={onTaskDelete}
                    projects={projects}
                    compact={true}
                    draggable={true}
                  />
                </div>
              ))}
              
              {(!columns[status] || columns[status].length === 0) && (
                <div className="text-center py-8">
                  <ApperIcon 
                    name="Package" 
                    className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" 
                  />
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                    No tasks in {status}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCreateTask(status)}
                    className="text-xs"
                  >
                    <ApperIcon name="Plus" className="w-3 h-3 mr-1" />
                    Add Task
                  </Button>
                </div>
              )}
            </div>

            {/* Drop Zone Indicator */}
            {dragOverColumn === status && draggedTask && (
              <div className="mx-3 mb-3 p-2 border-2 border-dashed border-primary-400 bg-primary-50 rounded-lg flex items-center justify-center">
                <span className="text-sm text-primary-600 font-medium">
                  Drop to move to {status}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TaskKanban