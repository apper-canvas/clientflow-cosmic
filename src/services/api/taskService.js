import mockTasks from "../mockData/tasks.json";
import { toast } from "react-toastify";
import React from "react";

let tasks = [...mockTasks];
let nextId = Math.max(...tasks.map(t => t.Id)) + 1;
let nextCommentId = Math.max(...tasks.flatMap(t => t.comments?.map(c => c.id) || [])) + 1;
let nextAttachmentId = Math.max(...tasks.flatMap(t => t.attachments?.map(a => a.id) || [])) + 1;

// Active timers storage
let activeTaskTimers = new Map();
// Task priority constants for filtering and display
export const TASK_PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent'
};

// Task type constants for categorization
export const TASK_TYPES = {
  TASK: 'Task',
  BUG: 'Bug',
  FEATURE: 'Feature',
  EPIC: 'Epic'
};

// Task status constants for Kanban board
export const TASK_STATUSES = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress', 
  REVIEW: 'Review',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};
// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Task management
export const taskService = {
  async getAll() {
    await delay(300);
    return tasks.map(task => ({ ...task }));
  },

  async getById(id) {
    await delay(200);
    const task = tasks.find(t => t.Id === parseInt(id));
    return task ? { ...task } : null;
  },

  async create(taskData) {
    await delay(400);
    const newTask = {
      ...taskData,
      Id: nextId++,
      status: taskData.status || 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedHours: taskData.estimatedHours || 0,
      actualHours: 0,
      tags: taskData.tags || [],
      attachments: [],
      comments: []
    };
    tasks.push(newTask);
    toast.success('Task created successfully!');
    return { ...newTask };
  },

  async update(id, updates) {
    await delay(350);
    const index = tasks.findIndex(t => t.Id === parseInt(id));
    if (index === -1) {
      toast.error('Task not found');
      return null;
    }
    
    const updatedTask = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      ...(updates.status === 'completed' && !tasks[index].completedAt ? {
        completedAt: new Date().toISOString()
      } : {})
    };
    
    tasks[index] = updatedTask;
    toast.success('Task updated successfully!');
    return { ...updatedTask };
  },

  async delete(id) {
    await delay(250);
    const index = tasks.findIndex(t => t.Id === parseInt(id));
    if (index === -1) {
      toast.error('Task not found');
      return false;
    }
    
    tasks.splice(index, 1);
    toast.success('Task deleted successfully!');
    return true;
  },

  // Task filtering methods
  async getOverdueTasks() {
    await delay(300);
    const today = new Date().toDateString();
    return tasks
      .filter(task => 
        task.status !== 'completed' && 
        task.dueDate && 
        new Date(task.dueDate).toDateString() < today
      )
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  },

  async getTodayTasks() {
    await delay(300);
    const today = new Date().toDateString();
    return tasks
      .filter(task => 
        task.dueDate && 
        new Date(task.dueDate).toDateString() === today
      )
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  },

  async getThisWeekTasks() {
    await delay(300);
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    return tasks
      .filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate >= weekStart && taskDate <= weekEnd;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  },

  async getCompletedTasks() {
    await delay(300);
    return tasks
      .filter(task => task.status === 'completed')
      .sort((a, b) => new Date(b.completedAt || b.updatedAt) - new Date(a.completedAt || a.updatedAt));
  },

// Time tracking methods
  async updateTimeTracking(id, timeData) {
    await delay(200);
    const task = tasks.find(t => t.Id === parseInt(id));
    if (!task) {
      toast.error('Task not found');
      return null;
    }

    const updatedTask = {
      ...task,
      estimatedHours: timeData.estimatedHours ?? task.estimatedHours,
      actualHours: timeData.actualHours ?? task.actualHours,
      billable: timeData.billable ?? task.billable,
      hourlyRate: timeData.hourlyRate ?? task.hourlyRate,
      updatedAt: new Date().toISOString()
    };

    const index = tasks.findIndex(t => t.Id === parseInt(id));
    tasks[index] = updatedTask;
    
    toast.success('Time tracking updated!');
    return { ...updatedTask };
  },

  // Comment methods
  async addComment(taskId, commentData) {
    await delay(300);
    const task = tasks.find(t => t.Id === parseInt(taskId));
    if (!task) {
      toast.error('Task not found');
      return null;
    }

    const newComment = {
      id: nextCommentId++,
      author: commentData.author || 'Current User',
      content: commentData.content,
      createdAt: new Date().toISOString(),
      parentId: commentData.parentId || null
    };

    if (!task.comments) task.comments = [];
    task.comments.push(newComment);
    
    const index = tasks.findIndex(t => t.Id === parseInt(taskId));
    tasks[index] = { ...task, updatedAt: new Date().toISOString() };
    
    toast.success('Comment added successfully!');
    return { ...newComment };
  },

  async updateComment(taskId, commentId, updates) {
    await delay(250);
    const task = tasks.find(t => t.Id === parseInt(taskId));
    if (!task || !task.comments) {
      toast.error('Task or comment not found');
      return null;
    }

    const commentIndex = task.comments.findIndex(c => c.id === parseInt(commentId));
    if (commentIndex === -1) {
      toast.error('Comment not found');
      return null;
    }

    task.comments[commentIndex] = {
      ...task.comments[commentIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const taskIndex = tasks.findIndex(t => t.Id === parseInt(taskId));
    tasks[taskIndex] = { ...task, updatedAt: new Date().toISOString() };
    
    toast.success('Comment updated successfully!');
    return { ...task.comments[commentIndex] };
  },

  async deleteComment(taskId, commentId) {
    await delay(200);
    const task = tasks.find(t => t.Id === parseInt(taskId));
    if (!task || !task.comments) {
      toast.error('Task or comment not found');
      return false;
    }

    const commentIndex = task.comments.findIndex(c => c.id === parseInt(commentId));
    if (commentIndex === -1) {
      toast.error('Comment not found');
      return false;
    }

    // Remove comment and its replies
    task.comments = task.comments.filter(c => 
      c.id !== parseInt(commentId) && c.parentId !== parseInt(commentId)
    );

    const taskIndex = tasks.findIndex(t => t.Id === parseInt(taskId));
    tasks[taskIndex] = { ...task, updatedAt: new Date().toISOString() };
    
    toast.success('Comment deleted successfully!');
    return true;
  },

  // Attachment methods
  async addAttachment(taskId, attachmentData) {
    await delay(500); // Simulate file upload delay
    const task = tasks.find(t => t.Id === parseInt(taskId));
    if (!task) {
      toast.error('Task not found');
      return null;
    }

    const newAttachment = {
      id: nextAttachmentId++,
      name: attachmentData.name,
      size: attachmentData.size,
      type: attachmentData.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: attachmentData.uploadedBy || 'Current User',
      url: attachmentData.url || `#attachment-${nextAttachmentId - 1}` // Mock URL
    };

    if (!task.attachments) task.attachments = [];
    task.attachments.push(newAttachment);
    
    const index = tasks.findIndex(t => t.Id === parseInt(taskId));
    tasks[index] = { ...task, updatedAt: new Date().toISOString() };
    
    toast.success(`File "${attachmentData.name}" uploaded successfully!`);
    return { ...newAttachment };
  },

  async deleteAttachment(taskId, attachmentId) {
    await delay(200);
    const task = tasks.find(t => t.Id === parseInt(taskId));
    if (!task || !task.attachments) {
      toast.error('Task or attachment not found');
      return false;
    }

    const attachmentIndex = task.attachments.findIndex(a => a.id === parseInt(attachmentId));
    if (attachmentIndex === -1) {
      toast.error('Attachment not found');
      return false;
    }

    const attachmentName = task.attachments[attachmentIndex].name;
    task.attachments.splice(attachmentIndex, 1);

    const taskIndex = tasks.findIndex(t => t.Id === parseInt(taskId));
    tasks[taskIndex] = { ...task, updatedAt: new Date().toISOString() };
    
    toast.success(`File "${attachmentName}" deleted successfully!`);
    return true;
  },

  // Tag methods
  async updateTags(taskId, tags) {
    await delay(200);
    const task = tasks.find(t => t.Id === parseInt(taskId));
    if (!task) {
      toast.error('Task not found');
      return null;
    }

    const updatedTask = {
      ...task,
      tags: tags || [],
      updatedAt: new Date().toISOString()
    };

    const index = tasks.findIndex(t => t.Id === parseInt(taskId));
    tasks[index] = updatedTask;
    
    toast.success('Tags updated successfully!');
    return { ...updatedTask };
  },

  // Get available tags across all tasks
  async getAllTags() {
    await delay(100);
    const allTags = tasks.flatMap(task => task.tags || []);
    const uniqueTags = allTags.reduce((acc, tag) => {
      if (!acc.find(t => t.name === tag.name)) {
        acc.push(tag);
      }
      return acc;
    }, []);
    
return uniqueTags.sort((a, b) => a.name.localeCompare(b.name));
  },

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
if (newStatus === 'completed' || newStatus === 'Completed') {
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

const statuses = ['todo', 'in-progress', 'completed', 'cancelled'];
        statuses.forEach(status => {
          stats.byStatus[status] = tasks.filter(t => t.status === status).length
        })

        const priorities = ['low', 'medium', 'high', 'urgent'];
        priorities.forEach(priority => {
          stats.byPriority[priority] = tasks.filter(t => t.priority === priority).length
        })

        const today = new Date()
        stats.overdue = tasks.filter(t => 
          t.dueDate && 
          new Date(t.dueDate) < today && 
          t.status !== 'completed'
        ).length

        stats.completed = tasks.filter(t => t.status === 'completed').length
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
    if (!parentId) return [];
    await delay(200);
    const allTasks = await this.getAll();
    return allTasks.filter(task => task.parentTaskId === parseInt(parentId));
  },

async createSubtask(parentId, subtaskData) {
    if (!parentId || !subtaskData) {
      throw new Error('Parent ID and subtask data are required');
    }
    await delay(200);
    const newSubtask = {
      ...subtaskData,
      Id: nextId++,
      parentTaskId: parseInt(parentId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 0,
      timeEntries: [],
      activeTimer: null,
      status: subtaskData.status || 'todo'
    };
    tasks.push(newSubtask);
    
    // Update parent task progress
    await this.updateTaskProgress(parentId);
    
    return newSubtask;
  },

async updateSubtask(id, data) {
    if (!id || !data) {
      throw new Error('Task ID and update data are required');
    }
    await delay(200);
    const index = tasks.findIndex(task => task.Id === parseInt(id));
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
    if (!id) {
      throw new Error('Task ID is required');
    }
    await delay(200);
    const taskIndex = tasks.findIndex(task => task.Id === parseInt(id));
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
    if (!id) {
      throw new Error('Task ID is required');
    }
    await delay(200);
    const index = tasks.findIndex(task => task.Id === parseInt(id));
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
    if (!taskId) return;
    await delay(200);
    const subtasks = await this.getSubtasks(taskId);
    if (!subtasks || subtasks.length === 0) return;

    const completedSubtasks = subtasks.filter(subtask => subtask.status === 'completed' || subtask.status === 'Completed').length;
    const progress = Math.round((completedSubtasks / subtasks.length) * 100);

    const taskIndex = tasks.findIndex(task => task.Id === parseInt(taskId));
    if (taskIndex !== -1) {
      tasks[taskIndex].progress = progress;
      tasks[taskIndex].updatedAt = new Date().toISOString();
    }
  },

async reorderSubtasks(parentId, subtaskIds) {
    if (!parentId || !Array.isArray(subtaskIds)) {
      throw new Error('Parent ID and subtask IDs array are required');
    }
    await delay(200);
    const subtasks = tasks.filter(task => task.parentTaskId === parseInt(parentId));
    
    subtaskIds.forEach((id, index) => {
      const taskIndex = tasks.findIndex(task => task.Id === parseInt(id));
      if (taskIndex !== -1) {
        tasks[taskIndex].order = index;
        tasks[taskIndex].updatedAt = new Date().toISOString();
      }
    });

    return true;
  },

// Enhanced time tracking operations
  async startTimer(taskId, description = 'Working on task') {
    if (!taskId) {
      throw new Error('Task ID is required');
    }
    await delay(200);
    
    const task = tasks.find(t => t.Id === parseInt(taskId));
    if (!task) {
      throw new Error('Task not found');
    }

    // Stop any other active timers
    activeTaskTimers.clear();

    // Create timer entry
    const timerId = Date.now();
    const timer = {
      Id: timerId,
      taskId: parseInt(taskId),
      projectId: task.projectId,
      startTime: new Date().toISOString(),
      description,
      isPaused: false,
      pausedDuration: 0
    };

    activeTaskTimers.set(timerId, timer);
    
    // Mark task as having active timer
    const index = tasks.findIndex(t => t.Id === parseInt(taskId));
    tasks[index] = {
      ...tasks[index],
      activeTimer: timer,
      updatedAt: new Date().toISOString()
    };

    toast.success('Timer started');
    return { ...tasks[index] };
  },

  async stopTimer(taskId, description = '') {
    if (!taskId) {
      throw new Error('Task ID is required');
    }
    await delay(200);
    
    const index = tasks.findIndex(task => task.Id === parseInt(taskId));
    if (index === -1) {
      throw new Error('Task not found');
    }

    const task = tasks[index];
    if (!task.activeTimer) {
      throw new Error('No active timer for this task');
    }

    const startTime = new Date(task.activeTimer.startTime);
    const endTime = new Date();
    const totalMs = endTime - startTime - (task.activeTimer.pausedDuration || 0);
    const duration = totalMs / (1000 * 60 * 60); // Convert to hours

    // Create time entry
    const timeEntry = {
      id: Date.now(),
      startTime: task.activeTimer.startTime,
      endTime: endTime.toISOString(),
      duration: Math.round(duration * 100) / 100,
      description: description || task.activeTimer.description,
      date: startTime.toISOString().split('T')[0],
      billable: task.billable || false,
      hourlyRate: task.hourlyRate || 0
    };

    if (!task.timeEntries) {
      task.timeEntries = [];
    }
    task.timeEntries.push(timeEntry);

    // Update actual hours
    const totalHours = task.timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
    task.actualHours = Math.round(totalHours * 100) / 100;

    // Remove timer
    activeTaskTimers.delete(task.activeTimer.Id);
    task.activeTimer = null;
    task.updatedAt = new Date().toISOString();

    toast.success('Timer stopped and time logged');
    return tasks[index];
  },

  async pauseTimer(taskId) {
    await delay(200);
    const task = tasks.find(t => t.Id === parseInt(taskId));
    if (!task?.activeTimer) {
      throw new Error('No active timer found');
    }

    task.activeTimer.isPaused = true;
    task.activeTimer.pauseStartTime = new Date().toISOString();
    activeTaskTimers.set(task.activeTimer.Id, task.activeTimer);

    const index = tasks.findIndex(t => t.Id === parseInt(taskId));
    tasks[index] = { ...task, updatedAt: new Date().toISOString() };

    return tasks[index];
  },

  async resumeTimer(taskId) {
    await delay(200);
    const task = tasks.find(t => t.Id === parseInt(taskId));
    if (!task?.activeTimer) {
      throw new Error('No active timer found');
    }

    if (task.activeTimer.isPaused && task.activeTimer.pauseStartTime) {
      const pauseTime = new Date() - new Date(task.activeTimer.pauseStartTime);
      task.activeTimer.pausedDuration = (task.activeTimer.pausedDuration || 0) + pauseTime;
    }

    task.activeTimer.isPaused = false;
    delete task.activeTimer.pauseStartTime;
    activeTaskTimers.set(task.activeTimer.Id, task.activeTimer);

    const index = tasks.findIndex(t => t.Id === parseInt(taskId));
    tasks[index] = { ...task, updatedAt: new Date().toISOString() };

    return tasks[index];
  },

  async addTimeEntry(taskId, timeEntry) {
    if (!taskId || !timeEntry) {
      throw new Error('Task ID and time entry data are required');
    }
    await delay(200);
    const index = tasks.findIndex(task => task.Id === parseInt(taskId));
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

    toast.success('Time entry added');
    return tasks[index];
  },

  async getTimeEntries(taskId) {
    if (!taskId) {
      throw new Error('Task ID is required');
    }
    await delay(200);
    const task = tasks.find(task => task.Id === parseInt(taskId));
    if (!task) {
      throw new Error('Task not found');
    }
    return task.timeEntries || [];
  },

  async deleteTimeEntry(taskId, entryId) {
    if (!taskId || !entryId) {
      throw new Error('Task ID and entry ID are required');
    }
    await delay(200);
    const index = tasks.findIndex(task => task.Id === parseInt(taskId));
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

    toast.success('Time entry deleted');
    return tasks[index];
  },

  // Tag management
  async addTag(taskId, tag) {
    if (!taskId || !tag) {
      throw new Error('Task ID and tag are required');
    }
    await delay(200);
    const index = tasks.findIndex(task => task.Id === parseInt(taskId));
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
    if (!taskId || !tag) {
      throw new Error('Task ID and tag are required');
    }
    await delay(200);
    const index = tasks.findIndex(task => task.Id === parseInt(taskId));
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
    if (!assignee) {
      throw new Error('Assignee is required');
    }
    await delay(200);
    const allTasks = await this.getAll();
    return allTasks.filter(task => task.assignee === assignee);
  },

  async getTeamTasks() {
    await delay(200);
    return await this.getAll();
  },

  async getProjectTasks(projectId) {
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    await delay(200);
    const allTasks = await this.getAll();
    return allTasks.filter(task => task.projectId === parseInt(projectId));
  },

  async getTasksByTags(tags) {
    if (!Array.isArray(tags) || tags.length === 0) {
      throw new Error('Tags array is required');
    }
    await delay(200);
    const allTasks = await this.getAll();
    return allTasks.filter(task => 
      task.tags && Array.isArray(task.tags) && tags.some(tag => task.tags.includes(tag))
    );
  },

  // Bulk operations
  async bulkUpdateSubtasks(parentId, updates) {
    if (!parentId || !Array.isArray(updates)) {
      throw new Error('Parent ID and updates array are required');
    }
    await delay(200);
    const subtasks = tasks.filter(task => task.parentTaskId === parseInt(parentId));
    
    updates.forEach(update => {
      if (update && update.id) {
        const index = tasks.findIndex(task => task.Id === parseInt(update.id));
        if (index !== -1) {
          tasks[index] = { ...tasks[index], ...update.data, updatedAt: new Date().toISOString() };
        }
      }
    });

    // Update parent progress
    await this.updateTaskProgress(parentId);

    return subtasks;
  },

  async bulkCompleteSubtasks(parentId, subtaskIds) {
    if (!parentId || !Array.isArray(subtaskIds)) {
      throw new Error('Parent ID and subtask IDs array are required');
    }
    await delay(200);
    subtaskIds.forEach(id => {
      const index = tasks.findIndex(task => task.Id === parseInt(id));
      if (index !== -1) {
        tasks[index].status = 'completed';
        tasks[index].updatedAt = new Date().toISOString();
        if (!tasks[index].completedAt) {
          tasks[index].completedAt = new Date().toISOString();
        }
      }
    });

    // Update parent progress
    await this.updateTaskProgress(parentId);

    return true;
  },

  // Get active timer across all tasks
  async getActiveTimer() {
    await delay(200);
    return tasks.find(task => task.activeTimer) || null;
  },

  // Get all active timers
  async getAllActiveTimers() {
    await delay(200);
    return Array.from(activeTaskTimers.values());
  }
}

export default taskService