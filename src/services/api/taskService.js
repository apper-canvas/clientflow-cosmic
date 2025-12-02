import tasksData from "@/services/mockData/tasks.json";
import projectsData from "@/services/mockData/projects.json";

let tasks = [...tasksData];

// Utility functions
const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));
const getNextId = () => Math.max(...tasks.map(t => t.Id), 0) + 1;

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
},

  // Subtask operations
  async getSubtasks(parentId) {
    await delay();
    const allTasks = await this.getAll();
    return allTasks.filter(task => task.parentTaskId === parentId);
  },

  async createSubtask(parentId, subtaskData) {
    await delay();
    const newSubtask = {
      ...subtaskData,
      Id: getNextId(),
      parentTaskId: parentId,
      createdAt: new Date().toISOString(),
      progress: 0,
      timeEntries: [],
      activeTimer: null
    };

    tasks.push(newSubtask);
    
    // Update parent task progress
    await this.updateTaskProgress(parentId);
    
    return newSubtask;
  },

  async updateSubtask(id, data) {
    await delay();
    const index = tasks.findIndex(task => task.Id === id);
    if (index === -1) {
      throw new Error('Subtask not found');
    }

    tasks[index] = { ...tasks[index], ...data, updatedAt: new Date().toISOString() };
    
    // Update parent task progress if this is a subtask
    if (tasks[index].parentTaskId) {
      await this.updateTaskProgress(tasks[index].parentTaskId);
    }
    
    return tasks[index];
  },

  async deleteSubtask(id) {
    await delay();
    const taskIndex = tasks.findIndex(task => task.Id === id);
    if (taskIndex === -1) {
      throw new Error('Subtask not found');
    }

    const parentId = tasks[taskIndex].parentTaskId;
    tasks.splice(taskIndex, 1);

    // Update parent task progress
    if (parentId) {
      await this.updateTaskProgress(parentId);
    }

    return true;
  },

  async convertSubtaskToMainTask(id) {
    await delay();
    const index = tasks.findIndex(task => task.Id === id);
    if (index === -1) {
      throw new Error('Subtask not found');
    }

    const parentId = tasks[index].parentTaskId;
    tasks[index].parentTaskId = null;
    tasks[index].updatedAt = new Date().toISOString();

    // Update parent task progress
    if (parentId) {
      await this.updateTaskProgress(parentId);
    }

    return tasks[index];
  },

  async updateTaskProgress(taskId) {
    await delay();
    const subtasks = await this.getSubtasks(taskId);
    if (subtasks.length === 0) return;

    const completedSubtasks = subtasks.filter(subtask => subtask.status === 'Completed').length;
    const progress = Math.round((completedSubtasks / subtasks.length) * 100);

    const taskIndex = tasks.findIndex(task => task.Id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].progress = progress;
      tasks[taskIndex].updatedAt = new Date().toISOString();
    }
  },

  async reorderSubtasks(parentId, subtaskIds) {
    await delay();
    const subtasks = tasks.filter(task => task.parentTaskId === parentId);
    
    subtaskIds.forEach((id, index) => {
      const taskIndex = tasks.findIndex(task => task.Id === id);
      if (taskIndex !== -1) {
        tasks[taskIndex].order = index;
        tasks[taskIndex].updatedAt = new Date().toISOString();
      }
    });

    return true;
  },

  // Time tracking operations
  async startTimer(taskId) {
    await delay();
    const index = tasks.findIndex(task => task.Id === taskId);
    if (index === -1) {
      throw new Error('Task not found');
    }

    // Stop any other active timers
    tasks.forEach(task => {
      if (task.activeTimer) {
        task.activeTimer = null;
      }
    });

    tasks[index].activeTimer = {
      startTime: new Date().toISOString(),
      description: 'Working on task'
    };
    tasks[index].updatedAt = new Date().toISOString();

    return tasks[index];
  },

  async stopTimer(taskId, description = '') {
    await delay();
    const index = tasks.findIndex(task => task.Id === taskId);
    if (index === -1) {
      throw new Error('Task not found');
    }

    const task = tasks[index];
    if (!task.activeTimer) {
      throw new Error('No active timer for this task');
    }

    const startTime = new Date(task.activeTimer.startTime);
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000 / 60 / 60; // Convert to hours

    const timeEntry = {
      id: Date.now(),
      startTime: task.activeTimer.startTime,
      endTime: endTime.toISOString(),
      duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
      description: description || task.activeTimer.description,
      date: startTime.toISOString().split('T')[0],
      billable: task.billable || false
    };

    if (!task.timeEntries) {
      task.timeEntries = [];
    }
    task.timeEntries.push(timeEntry);

    // Update actual hours
    const totalHours = task.timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
    task.actualHours = Math.round(totalHours * 100) / 100;

    task.activeTimer = null;
    task.updatedAt = new Date().toISOString();

    return tasks[index];
  },

  async addTimeEntry(taskId, timeEntry) {
    await delay();
    const index = tasks.findIndex(task => task.Id === taskId);
    if (index === -1) {
      throw new Error('Task not found');
    }

    const task = tasks[index];
    if (!task.timeEntries) {
      task.timeEntries = [];
    }

    const newEntry = {
      id: Date.now(),
      ...timeEntry,
      date: timeEntry.date || new Date().toISOString().split('T')[0]
    };

    task.timeEntries.push(newEntry);

    // Update actual hours
    const totalHours = task.timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
    task.actualHours = Math.round(totalHours * 100) / 100;
    task.updatedAt = new Date().toISOString();

    return tasks[index];
  },

  async getTimeEntries(taskId) {
    await delay();
    const task = tasks.find(task => task.Id === taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    return task.timeEntries || [];
  },

  async deleteTimeEntry(taskId, entryId) {
    await delay();
    const index = tasks.findIndex(task => task.Id === taskId);
    if (index === -1) {
      throw new Error('Task not found');
    }

    const task = tasks[index];
    if (!task.timeEntries) {
      return task;
    }

    task.timeEntries = task.timeEntries.filter(entry => entry.id !== entryId);

    // Update actual hours
    const totalHours = task.timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
    task.actualHours = Math.round(totalHours * 100) / 100;
    task.updatedAt = new Date().toISOString();

    return tasks[index];
  },

  // Tag management
  async addTag(taskId, tag) {
    await delay();
    const index = tasks.findIndex(task => task.Id === taskId);
    if (index === -1) {
      throw new Error('Task not found');
    }

    const task = tasks[index];
    if (!task.tags) {
      task.tags = [];
    }

    if (!task.tags.includes(tag)) {
      task.tags.push(tag);
      task.updatedAt = new Date().toISOString();
    }

    return tasks[index];
  },

  async removeTag(taskId, tag) {
    await delay();
    const index = tasks.findIndex(task => task.Id === taskId);
    if (index === -1) {
      throw new Error('Task not found');
    }

    const task = tasks[index];
    if (task.tags) {
      task.tags = task.tags.filter(t => t !== tag);
      task.updatedAt = new Date().toISOString();
    }

    return tasks[index];
  },

  // Filtering operations
  async getMyTasks(assignee) {
    await delay();
    const allTasks = await this.getAll();
    return allTasks.filter(task => task.assignee === assignee);
  },

  async getTeamTasks() {
    await delay();
    return await this.getAll();
  },

  async getProjectTasks(projectId) {
    await delay();
    const allTasks = await this.getAll();
    return allTasks.filter(task => task.projectId === projectId);
  },

  async getTasksByTags(tags) {
    await delay();
    const allTasks = await this.getAll();
    return allTasks.filter(task => 
      task.tags && tags.some(tag => task.tags.includes(tag))
    );
  },

  // Bulk operations
  async bulkUpdateSubtasks(parentId, updates) {
    await delay();
    const subtasks = tasks.filter(task => task.parentTaskId === parentId);
    
    updates.forEach(update => {
      const index = tasks.findIndex(task => task.Id === update.id);
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...update.data, updatedAt: new Date().toISOString() };
      }
    });

    // Update parent progress
    await this.updateTaskProgress(parentId);

    return subtasks;
  },

  async bulkCompleteSubtasks(parentId, subtaskIds) {
    await delay();
    subtaskIds.forEach(id => {
      const index = tasks.findIndex(task => task.Id === id);
      if (index !== -1) {
        tasks[index].status = 'Completed';
        tasks[index].updatedAt = new Date().toISOString();
      }
    });

    // Update parent progress
    await this.updateTaskProgress(parentId);

    return true;
  },

  // Get active timer across all tasks
  async getActiveTimer() {
    await delay();
    return tasks.find(task => task.activeTimer);
  }
}

export default taskService