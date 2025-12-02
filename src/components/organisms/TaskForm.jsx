import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import projectService from "@/services/api/projectService";
import taskService, { TASK_PRIORITIES, TASK_STATUSES, TASK_TYPES } from "@/services/api/taskService";
import ApperIcon from "@/components/ApperIcon";
import Select from "@/components/atoms/Select";
import Label from "@/components/atoms/Label";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import FormField from "@/components/molecules/FormField";

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
    blocks: [],
    tags: [],
    billable: false,
    progress: 0,
    parentTaskId: null,
    subtasks: [],
    timeEntries: [],
    activeTimer: null
  })
  
  const [newTag, setNewTag] = useState('')
  const [newSubtask, setNewSubtask] = useState({ title: '', assignee: '', status: 'To Do' })
  const [showSubtaskForm, setShowSubtaskForm] = useState(false)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerStartTime, setTimerStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [manualTimeEntry, setManualTimeEntry] = useState({ duration: '', description: '', date: '' })
  const [showTimeForm, setShowTimeForm] = useState(false)
  
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
        blocks: task.blocks || [],
        tags: task.tags || [],
        billable: task.billable || false,
        progress: task.progress || 0,
        parentTaskId: task.parentTaskId || null,
        subtasks: task.subtasks || [],
        timeEntries: task.timeEntries || [],
        activeTimer: null
      })
    } else {
      setFormData(prev => ({
        ...prev,
        status: defaultStatus || 'To Do',
        tags: [],
        subtasks: [],
        timeEntries: [],
        activeTimer: null
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
    // Cleanup timer if running
    if (formData.activeTimer) {
      clearInterval(formData.activeTimer)
    }
    
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
      blocks: [],
      tags: [],
      billable: false,
      progress: 0,
      parentTaskId: null,
      subtasks: [],
      timeEntries: [],
      activeTimer: null
    })
    setErrors({})
    setNewTag('')
    setNewSubtask({ title: '', assignee: '', status: 'To Do' })
    setShowSubtaskForm(false)
    setTimerRunning(false)
    setTimerStartTime(null)
    setElapsedTime(0)
    setManualTimeEntry({ duration: '', description: '', date: '' })
    setShowTimeForm(false)
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

  // Tag management functions
  const addTag = () => {
    if (!newTag.trim()) return
    
    const tagToAdd = newTag.trim()
    if (!formData.tags.includes(tagToAdd)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagToAdd]
      }))
    }
    setNewTag('')
  }

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  // Timer functions
  const startTimer = () => {
    const startTime = Date.now()
    setTimerStartTime(startTime)
    setTimerRunning(true)
    setElapsedTime(0)
    
    // Start timer interval
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime)
    }, 1000)
    
    // Store interval ID for cleanup
    setFormData(prev => ({
      ...prev,
      activeTimer: interval
    }))
  }

  const stopTimer = () => {
    if (formData.activeTimer) {
      clearInterval(formData.activeTimer)
    }
    
    if (timerStartTime && elapsedTime > 0) {
      const durationHours = elapsedTime / (1000 * 60 * 60)
      const timeEntry = {
        duration: durationHours.toFixed(2),
        date: new Date().toISOString().split('T')[0],
        description: 'Timer entry',
        billable: formData.billable,
        startTime: new Date(timerStartTime).toISOString(),
        endTime: new Date().toISOString()
      }
      
      setFormData(prev => ({
        ...prev,
        timeEntries: [...(prev.timeEntries || []), timeEntry],
        actualHours: (parseFloat(prev.actualHours || 0) + durationHours).toFixed(2),
        activeTimer: null
      }))
    }
    
    setTimerRunning(false)
    setTimerStartTime(null)
    setElapsedTime(0)
  }

  const formatDuration = (milliseconds) => {
    if (!milliseconds) return '00:00:00'
    
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Manual time entry functions
  const addManualTimeEntry = () => {
    if (!manualTimeEntry.duration || !manualTimeEntry.date) return
    
    const duration = parseFloat(manualTimeEntry.duration)
    if (isNaN(duration) || duration <= 0) {
      toast.error('Please enter a valid duration')
      return
    }
    
    const timeEntry = {
      duration: duration.toFixed(2),
      date: manualTimeEntry.date,
      description: manualTimeEntry.description || 'Manual entry',
      billable: formData.billable,
      manual: true
    }
    
    setFormData(prev => ({
      ...prev,
      timeEntries: [...(prev.timeEntries || []), timeEntry],
      actualHours: (parseFloat(prev.actualHours || 0) + duration).toFixed(2)
    }))
    
    setManualTimeEntry({ duration: '', description: '', date: '' })
    setShowTimeForm(false)
    toast.success('Time entry added successfully')
  }

  const removeTimeEntry = (index) => {
    const entryToRemove = formData.timeEntries[index]
    if (!entryToRemove) return
    
    const duration = parseFloat(entryToRemove.duration)
    
    setFormData(prev => ({
      ...prev,
      timeEntries: prev.timeEntries.filter((_, i) => i !== index),
      actualHours: Math.max(0, parseFloat(prev.actualHours || 0) - duration).toFixed(2)
    }))
  }

  // Subtask management functions
  const addSubtask = () => {
    if (!newSubtask.title.trim()) return
    
    const subtask = {
      id: Date.now(), // Temporary ID for new subtasks
      title: newSubtask.title.trim(),
      assignee: newSubtask.assignee.trim(),
      status: newSubtask.status,
      createdAt: new Date().toISOString()
    }
    
    setFormData(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, subtask]
    }))
    
    setNewSubtask({ title: '', assignee: '', status: 'To Do' })
    setShowSubtaskForm(false)
  }

  const removeSubtask = (index) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index)
    }))
    updateProgress()
  }

  const updateSubtaskStatus = (index, status) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map((subtask, i) => 
        i === index ? { ...subtask, status } : subtask
      )
    }))
    updateProgress()
  }

  const bulkCompleteSubtasks = () => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(subtask => ({
        ...subtask,
        status: 'Completed'
      }))
    }))
    updateProgress()
  }

  const convertSubtaskToMainTask = (index) => {
    const subtask = formData.subtasks[index]
    if (!subtask) return
    
    // Remove from subtasks
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index)
    }))
    
    // Create new task data for callback
    const newTaskData = {
      title: subtask.title,
      description: `Converted from subtask of: ${formData.title}`,
      projectId: formData.projectId,
      assignee: subtask.assignee,
      status: subtask.status,
      type: formData.type,
      priority: 'Medium',
      parentTaskId: task?.Id || null
    }
    
    // If there's a callback to create new task, call it
    if (onSave && typeof onSave === 'function') {
      toast.info('Subtask converted. Create the new task separately.')
    }
    
    updateProgress()
  }

  const updateProgress = () => {
    setTimeout(() => {
      setFormData(prev => {
        const completedSubtasks = prev.subtasks.filter(s => s.status === 'Completed').length
        const totalSubtasks = prev.subtasks.length
        const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0
        
        return {
          ...prev,
          progress
        }
      })
    }, 0)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (formData.activeTimer) {
        clearInterval(formData.activeTimer)
      }
    }
  }, [formData.activeTimer])

  // Update progress when subtasks change
  useEffect(() => {
    updateProgress()
  }, [formData.subtasks.length])

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

          {/* Enhanced Properties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FormField label="Billable">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.billable}
                    onChange={(e) => handleInputChange('billable', e.target.checked)}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    This task is billable to client
                  </span>
                </label>
              </FormField>
            </div>

            {formData.subtasks.length > 0 && (
              <FormField label="Progress">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>Task Progress</span>
                    <span>{formData.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${formData.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Progress is calculated based on completed subtasks
                  </p>
                </div>
              </FormField>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Tags & Labels
            </h3>
            
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-xs">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-primary-500 hover:text-primary-700 dark:hover:text-primary-200"
                    >
                      <ApperIcon name="X" className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter tag name"
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag} disabled={!newTag.trim()}>
                  Add Tag
                </Button>
              </div>
            </div>
          </div>

          {/* Time Tracking */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Time Tracking
            </h3>

            {/* Timer Controls */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              {timerRunning ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Timer Running: {formatDuration(elapsedTime)}
                    </span>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={stopTimer}
                    className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900"
                  >
                    <ApperIcon name="Square" className="w-4 h-4 mr-2" />
                    Stop Timer
                  </Button>
                </div>
              ) : (
                <Button 
                  type="button" 
                  onClick={startTimer}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <ApperIcon name="Play" className="w-4 h-4 mr-2" />
                  Start Timer
                </Button>
              )}

              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowTimeForm(!showTimeForm)}
              >
                <ApperIcon name="Clock" className="w-4 h-4 mr-2" />
                Manual Entry
              </Button>
            </div>

            {/* Manual Time Entry */}
            {showTimeForm && (
              <div className="p-4 border border-slate-300 dark:border-slate-600 rounded-lg">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                  Add Manual Time Entry
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Duration (hours)">
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      value={manualTimeEntry.duration}
                      onChange={(e) => setManualTimeEntry(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="1.5"
                    />
                  </FormField>
                  
                  <FormField label="Date">
                    <Input
                      type="date"
                      value={manualTimeEntry.date}
                      onChange={(e) => setManualTimeEntry(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </FormField>
                  
                  <FormField label="Description">
                    <Input
                      value={manualTimeEntry.description}
                      onChange={(e) => setManualTimeEntry(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Work description"
                    />
                  </FormField>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button 
                    type="button" 
                    onClick={addManualTimeEntry}
                    disabled={!manualTimeEntry.duration || !manualTimeEntry.date}
                  >
                    Add Entry
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowTimeForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Time Entries List */}
            {formData.timeEntries && formData.timeEntries.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Time Entries ({formData.timeEntries.length})
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {formData.timeEntries.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700 rounded text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{entry.duration}h</span>
                        <span>{entry.date}</span>
                        {entry.description && <span className="text-slate-600 dark:text-slate-400">{entry.description}</span>}
                        {entry.billable && <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">Billable</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTimeEntry(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <ApperIcon name="Trash2" className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                <div className="relative">
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.actualHours}
                    onChange={(e) => handleInputChange('actualHours', e.target.value)}
                    placeholder="0"
                    className={errors.actualHours ? 'border-red-500' : ''}
                    disabled={formData.timeEntries?.length > 0}
                  />
                  {formData.timeEntries?.length > 0 && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Auto-calculated
                      </span>
                    </div>
                  )}
                </div>
              </FormField>
            </div>
          </div>

          {/* Subtasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Subtasks & Checklist
              </h3>
              <Button 
                type="button" 
                onClick={() => setShowSubtaskForm(!showSubtaskForm)}
                variant="outline"
              >
                <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
                Add Subtask
              </Button>
            </div>

            {/* Add Subtask Form */}
            {showSubtaskForm && (
              <div className="p-4 border border-slate-300 dark:border-slate-600 rounded-lg">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                  Create New Subtask
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Subtask Title">
                    <Input
                      value={newSubtask.title}
                      onChange={(e) => setNewSubtask(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter subtask title"
                    />
                  </FormField>
                  
                  <FormField label="Assigned To">
                    <Input
                      value={newSubtask.assignee}
                      onChange={(e) => setNewSubtask(prev => ({ ...prev, assignee: e.target.value }))}
                      placeholder="Assignee name"
                    />
                  </FormField>
                  
                  <FormField label="Status">
                    <Select
                      value={newSubtask.status}
                      onChange={(e) => setNewSubtask(prev => ({ ...prev, status: e.target.value }))}
                    >
                      {Object.values(TASK_STATUSES).map(status => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button 
                    type="button" 
                    onClick={addSubtask}
                    disabled={!newSubtask.title.trim()}
                  >
                    Add Subtask
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowSubtaskForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Subtasks List */}
            {formData.subtasks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Subtasks ({formData.subtasks.length})
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={bulkCompleteSubtasks}
                  >
                    Complete All
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {formData.subtasks.map((subtask, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={subtask.status === 'Completed'}
                          onChange={(e) => updateSubtaskStatus(index, e.target.checked ? 'Completed' : 'To Do')}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${subtask.status === 'Completed' ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            {subtask.title}
                          </span>
                          {subtask.assignee && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Assigned to {subtask.assignee}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            subtask.status === 'Completed' 
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}>
                            {subtask.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => convertSubtaskToMainTask(index)}
                            className="text-primary-600 hover:text-primary-800 dark:hover:text-primary-400"
                            title="Convert to main task"
                          >
                            <ApperIcon name="ArrowUpRight" className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSubtask(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <ApperIcon name="Trash2" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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