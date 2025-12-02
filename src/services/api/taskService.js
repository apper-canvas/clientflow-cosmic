import tasksData from '@/services/mockData/tasks.json'
import projectsData from '@/services/mockData/projects.json'

let tasks = [...tasksData]

// Task statuses
export const TASK_STATUSES = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress', 
  REVIEW: 'Review',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
}

// Task priorities  
export const TASK_PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High', 
  URGENT: 'Urgent'
}

// Task types
export const TASK_TYPES = {
  DEVELOPMENT: 'Development',
  DESIGN: 'Design',
  TESTING: 'Testing',
  BUG: 'Bug',
  DOCUMENTATION: 'Documentation',
  MEETING: 'Meeting',
  OTHER: 'Other'
}

const taskService = {
  // Get all tasks with optional filtering
  getAll(filters = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredTasks = [...tasks]

        // Apply filters
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          filteredTasks = filteredTasks.filter(task =>
            task.title?.toLowerCase().includes(searchLower) ||
            task.description?.toLowerCase().includes(searchLower)
          )
        }

        if (filters.status) {
          filteredTasks = filteredTasks.filter(task => task.status === filters.status)
        }

        if (filters.priority) {
          filteredTasks = filteredTasks.filter(task => task.priority === filters.priority)
        }

        if (filters.projectId) {
          filteredTasks = filteredTasks.filter(task => task.projectId === parseInt(filters.projectId))
        }

        if (filters.assignee) {
          filteredTasks = filteredTasks.filter(task => 
            task.assignee?.toLowerCase().includes(filters.assignee.toLowerCase())
          )
        }

        if (filters.type) {
          filteredTasks = filteredTasks.filter(task => task.type === filters.type)
        }

        if (filters.dueDateFrom) {
          filteredTasks = filteredTasks.filter(task => 
            task.dueDate && new Date(task.dueDate) >= new Date(filters.dueDateFrom)
          )
        }

        if (filters.dueDateTo) {
          filteredTasks = filteredTasks.filter(task => 
            task.dueDate && new Date(task.dueDate) <= new Date(filters.dueDateTo)
          )
        }

        // Sort by priority and due date
        filteredTasks.sort((a, b) => {
          const priorityOrder = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
          const aPriority = priorityOrder[a.priority] || 0
          const bPriority = priorityOrder[b.priority] || 0
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority
          }
          
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate)
          }
          
          return a.Id - b.Id
        })

        resolve(filteredTasks)
      }, 300)
    })
  },

  // Get task by ID
  getById(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const task = tasks.find(t => t.Id === parseInt(id))
        if (task) {
          resolve({ ...task })
        } else {
          reject(new Error('Task not found'))
        }
      }, 200)
    })
  },

  // Create new task
  create(taskData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newTask = {
          ...taskData,
          Id: Math.max(...tasks.map(t => t.Id), 0) + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        tasks.push(newTask)
        resolve({ ...newTask })
      }, 300)
    })
  },

  // Update task
  update(id, taskData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = tasks.findIndex(t => t.Id === parseInt(id))
        if (index !== -1) {
          const updatedTask = {
            ...tasks[index],
            ...taskData,
            Id: parseInt(id),
            updatedAt: new Date().toISOString()
          }
          tasks[index] = updatedTask
          resolve({ ...updatedTask })
        } else {
          reject(new Error('Task not found'))
        }
      }, 300)
    })
  },

  // Delete task
  delete(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = tasks.findIndex(t => t.Id === parseInt(id))
        if (index !== -1) {
          tasks.splice(index, 1)
          resolve(true)
        } else {
          reject(new Error('Task not found'))
        }
      }, 200)
    })
  },

  // Update task status (for Kanban drag-drop)
  updateStatus(id, newStatus) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = tasks.findIndex(t => t.Id === parseInt(id))
        if (index !== -1) {
          tasks[index] = {
            ...tasks[index],
            status: newStatus,
            updatedAt: new Date().toISOString()
          }
          if (newStatus === TASK_STATUSES.COMPLETED) {
            tasks[index].completedAt = new Date().toISOString()
          }
          resolve({ ...tasks[index] })
        } else {
          reject(new Error('Task not found'))
        }
      }, 200)
    })
  },

  // Get tasks by status (for Kanban view)
  getByStatus(status) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filteredTasks = tasks.filter(task => task.status === status)
        resolve(filteredTasks.map(task => ({ ...task })))
      }, 200)
    })
  },

  // Get task statistics
  getStats() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const stats = {
          total: tasks.length,
          byStatus: {},
          byPriority: {},
          overdue: 0,
          completed: 0
        }

        Object.values(TASK_STATUSES).forEach(status => {
          stats.byStatus[status] = tasks.filter(t => t.status === status).length
        })

        Object.values(TASK_PRIORITIES).forEach(priority => {
          stats.byPriority[priority] = tasks.filter(t => t.priority === priority).length
        })

        const today = new Date()
        stats.overdue = tasks.filter(t => 
          t.dueDate && 
          new Date(t.dueDate) < today && 
          t.status !== TASK_STATUSES.COMPLETED
        ).length

        stats.completed = tasks.filter(t => t.status === TASK_STATUSES.COMPLETED).length

        resolve(stats)
      }, 200)
    })
  },

  // Get task dependencies
  getDependencies(taskId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const task = tasks.find(t => t.Id === parseInt(taskId))
        const dependencies = {
          blockedBy: task?.blockedBy || [],
          blocks: task?.blocks || []
        }
        resolve(dependencies)
      }, 150)
    })
  },

  // Update task dependencies
  updateDependencies(taskId, dependencies) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = tasks.findIndex(t => t.Id === parseInt(taskId))
        if (index !== -1) {
          tasks[index] = {
            ...tasks[index],
            ...dependencies,
            updatedAt: new Date().toISOString()
          }
          resolve({ ...tasks[index] })
        } else {
          reject(new Error('Task not found'))
        }
      }, 200)
    })
  }
}

export default taskService