import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import Button from '@/components/atoms/Button'
import Input from '@/components/atoms/Input'
import Select from '@/components/atoms/Select'
import Label from '@/components/atoms/Label'
import FormField from '@/components/molecules/FormField'
import ApperIcon from '@/components/ApperIcon'
import taskService, { TASK_STATUSES, TASK_PRIORITIES, TASK_TYPES } from '@/services/api/taskService'
import projectService from '@/services/api/projectService'

const TaskForm = ({ 
  task = null, 
  isOpen, 
  onClose, 
  onSave,
  projects = [],
  defaultStatus = null
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignee: '',
    dueDate: '',
    priority: 'Medium',
    status: 'To Do',
    type: 'Development',
    estimatedHours: '',
    actualHours: '',
    startDate: '',
    blockedBy: [],
    blocks: []
  })
  
  const [loading, setLoading] = useState(false)
  const [availableProjects, setAvailableProjects] = useState([])
  const [availableTasks, setAvailableTasks] = useState([])
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        projectId: task.projectId?.toString() || '',
        assignee: task.assignee || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        priority: task.priority || 'Medium',
        status: task.status || 'To Do',
        type: task.type || 'Development',
        estimatedHours: task.estimatedHours?.toString() || '',
        actualHours: task.actualHours?.toString() || '',
        startDate: task.startDate ? task.startDate.split('T')[0] : '',
        blockedBy: task.blockedBy || [],
        blocks: task.blocks || []
      })
    } else {
      setFormData(prev => ({
        ...prev,
        status: defaultStatus || 'To Do'
      }))
    }
  }, [task, defaultStatus])

  useEffect(() => {
    if (isOpen) {
      loadProjects()
      loadAvailableTasks()
    }
  }, [isOpen])

  const loadProjects = async () => {
    try {
      if (projects.length > 0) {
        setAvailableProjects(projects)
      } else {
        const projectsData = await projectService.getAll()
        setAvailableProjects(projectsData)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
    }
  }

  const loadAvailableTasks = async () => {
    try {
      const tasksData = await taskService.getAll()
      // Filter out current task from dependencies
      const filteredTasks = task 
        ? tasksData.filter(t => t.Id !== task.Id)
        : tasksData
      setAvailableTasks(filteredTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.projectId) {
      newErrors.projectId = 'Project is required'
    }

    if (formData.estimatedHours && isNaN(parseFloat(formData.estimatedHours))) {
      newErrors.estimatedHours = 'Must be a valid number'
    }

    if (formData.actualHours && isNaN(parseFloat(formData.actualHours))) {
      newErrors.actualHours = 'Must be a valid number'
    }

    if (formData.dueDate && formData.startDate && 
        new Date(formData.dueDate) < new Date(formData.startDate)) {
      newErrors.dueDate = 'Due date cannot be before start date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const taskData = {
        ...formData,
        projectId: parseInt(formData.projectId),
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
        actualHours: formData.actualHours ? parseFloat(formData.actualHours) : null
      }

      let savedTask
      if (task) {
        savedTask = await taskService.update(task.Id, taskData)
        toast.success('Task updated successfully')
      } else {
        savedTask = await taskService.create(taskData)
        toast.success('Task created successfully')
      }

      // Update dependencies if changed
      if (task && (
        JSON.stringify(formData.blockedBy) !== JSON.stringify(task.blockedBy) ||
        JSON.stringify(formData.blocks) !== JSON.stringify(task.blocks)
      )) {
        await taskService.updateDependencies(savedTask.Id, {
          blockedBy: formData.blockedBy,
          blocks: formData.blocks
        })
      }

      onSave(savedTask)
      handleClose()
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error(`Failed to ${task ? 'update' : 'create'} task`)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      projectId: '',
      assignee: '',
      dueDate: '',
      priority: 'Medium',
      status: 'To Do',
      type: 'Development',
      estimatedHours: '',
      actualHours: '',
      startDate: '',
      blockedBy: [],
      blocks: []
    })
    setErrors({})
    onClose()
  }

  const getProjectName = (projectId) => {
    const project = availableProjects.find(p => p.Id === projectId)
    return project?.name || `Project ${projectId}`
  }

  const handleDependencyChange = (field, taskId, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], parseInt(taskId)]
        : prev[field].filter(id => id !== parseInt(taskId))
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
      
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <ApperIcon name="X" className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6">
            <FormField
              label="Title"
              error={errors.title}
              required
            >
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter task title"
                className={errors.title ? 'border-red-500' : ''}
              />
            </FormField>

            <FormField label="Description">
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter task description"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Project"
                error={errors.projectId}
                required
              >
                <Select
                  value={formData.projectId}
                  onChange={(e) => handleInputChange('projectId', e.target.value)}
                  className={errors.projectId ? 'border-red-500' : ''}
                >
                  <option value="">Select project</option>
                  {availableProjects.map(project => (
                    <option key={project.Id} value={project.Id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Assigned To">
                <Input
                  value={formData.assignee}
                  onChange={(e) => handleInputChange('assignee', e.target.value)}
                  placeholder="Enter assignee name"
                />
              </FormField>
            </div>
          </div>

          {/* Task Properties */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField label="Status">
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                {Object.values(TASK_STATUSES).map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Priority">
              <Select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
              >
                {Object.values(TASK_PRIORITIES).map(priority => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Type">
              <Select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
              >
                {Object.values(TASK_TYPES).map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          {/* Dates and Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Start Date">
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </FormField>

              <FormField
                label="Due Date"
                error={errors.dueDate}
              >
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className={errors.dueDate ? 'border-red-500' : ''}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Estimated Hours"
                error={errors.estimatedHours}
              >
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.estimatedHours}
                  onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
                  placeholder="0"
                  className={errors.estimatedHours ? 'border-red-500' : ''}
                />
              </FormField>

              <FormField
                label="Actual Hours"
                error={errors.actualHours}
              >
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.actualHours}
                  onChange={(e) => handleInputChange('actualHours', e.target.value)}
                  placeholder="0"
                  className={errors.actualHours ? 'border-red-500' : ''}
                />
              </FormField>
            </div>
          </div>

          {/* Dependencies */}
          {availableTasks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Dependencies
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Blocked By */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Blocked By (this task cannot start until these are complete)
                  </Label>
                  <div className="max-h-32 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded-md p-2">
                    {availableTasks.slice(0, 10).map(availableTask => (
                      <label key={`blocked-${availableTask.Id}`} className="flex items-center space-x-2 p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded">
                        <input
                          type="checkbox"
                          checked={formData.blockedBy.includes(availableTask.Id)}
                          onChange={(e) => handleDependencyChange('blockedBy', availableTask.Id, e.target.checked)}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {availableTask.title} ({getProjectName(availableTask.projectId)})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Blocks */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Blocks (these tasks cannot start until this is complete)
                  </Label>
                  <div className="max-h-32 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded-md p-2">
                    {availableTasks.slice(0, 10).map(availableTask => (
                      <label key={`blocks-${availableTask.Id}`} className="flex items-center space-x-2 p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded">
                        <input
                          type="checkbox"
                          checked={formData.blocks.includes(availableTask.Id)}
                          onChange={(e) => handleDependencyChange('blocks', availableTask.Id, e.target.checked)}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {availableTask.title} ({getProjectName(availableTask.projectId)})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[100px]"
            >
              {loading ? (
                <div className="flex items-center">
                  <ApperIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </div>
              ) : (
                task ? 'Update Task' : 'Create Task'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskForm