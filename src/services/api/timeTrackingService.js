import { toast } from "react-toastify";
import React from "react";

// Mock data for time entries
let timeEntries = [
  {
    Id: 1,
    taskId: 1,
    projectId: 1,
    userId: 1,
    userName: "Sarah Johnson",
    date: "2024-01-15",
    startTime: "09:00",
    endTime: "11:30",
    duration: 2.5,
    description: "Working on homepage mockups",
    billable: true,
    hourlyRate: 85,
    totalAmount: 212.50,
    status: "approved",
    submittedAt: "2024-01-15T11:35:00Z",
    approvedAt: "2024-01-15T14:20:00Z",
    approvedBy: "Mike Chen",
    rejectionReason: null,
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T14:20:00Z"
  },
  {
    Id: 2,
    taskId: 2,
    projectId: 1,
    userId: 2,
    userName: "Alex Rodriguez",
    date: "2024-01-15",
    startTime: "13:00",
    endTime: "17:00",
    duration: 4,
    description: "Authentication implementation",
    billable: true,
    hourlyRate: 95,
    totalAmount: 380,
    status: "submitted",
    submittedAt: "2024-01-15T17:05:00Z",
    approvedAt: null,
    approvedBy: null,
    rejectionReason: null,
    createdAt: "2024-01-15T13:00:00Z",
    updatedAt: "2024-01-15T17:05:00Z"
  },
  {
    Id: 3,
    taskId: 1,
    projectId: 1,
    userId: 1,
    userName: "Sarah Johnson",
    date: "2024-01-14",
    startTime: "10:00",
    endTime: "12:00",
    duration: 2,
    description: "Design research and wireframing",
    billable: false,
    hourlyRate: 85,
    totalAmount: 0,
    status: "draft",
    submittedAt: null,
    approvedAt: null,
    approvedBy: null,
    rejectionReason: null,
    createdAt: "2024-01-14T10:00:00Z",
    updatedAt: "2024-01-14T12:00:00Z"
  },
  {
    Id: 4,
    taskId: 2,
    projectId: 1,
    userId: 3,
    userName: "Lisa Wong",
    date: "2024-01-16",
    startTime: "09:30",
    endTime: "12:30",
    duration: 3,
    description: "Code review and testing",
    billable: true,
    hourlyRate: 90,
    totalAmount: 270,
    status: "rejected",
    submittedAt: "2024-01-16T12:35:00Z",
    approvedAt: null,
    approvedBy: null,
    rejectionReason: "Please provide more detailed description of testing activities",
    rejectedAt: "2024-01-16T15:20:00Z",
    rejectedBy: "Mike Chen",
    createdAt: "2024-01-16T09:30:00Z",
    updatedAt: "2024-01-16T15:20:00Z"
  },
  {
    Id: 5,
    taskId: 1,
    projectId: 1,
    userId: 1,
    userName: "Sarah Johnson",
    date: "2024-01-12",
    startTime: "14:00",
    endTime: "18:00",
    duration: 4,
    description: "Final mockup revisions and client presentation",
    billable: true,
    hourlyRate: 85,
    totalAmount: 340,
    status: "invoiced",
    submittedAt: "2024-01-12T18:05:00Z",
    approvedAt: "2024-01-13T09:15:00Z",
    approvedBy: "Mike Chen",
    invoicedAt: "2024-01-14T16:30:00Z",
    rejectionReason: null,
    createdAt: "2024-01-12T14:00:00Z",
    updatedAt: "2024-01-14T16:30:00Z"
  }
];

// Status constants
export const TIME_ENTRY_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted', 
  APPROVED: 'approved',
  REJECTED: 'rejected',
  INVOICED: 'invoiced'
};

let activeTimers = [
  // {
  //   Id: 1,
  //   taskId: 1,
  //   projectId: 1,
  //   userId: 1,
  //   userName: "Sarah Johnson",
  //   startTime: new Date().toISOString(),
  //   description: "Working on task",
  //   isPaused: false,
  //   pausedDuration: 0
  // }
];

let nextId = Math.max(...timeEntries.map(t => t.Id), 0) + 1;
let nextTimerId = 1;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const timeTrackingService = {
  // Time Entry CRUD operations
  async getAll() {
    await delay(200);
    return [...timeEntries];
  },

  async getById(id) {
    await delay(200);
    const entry = timeEntries.find(t => t.Id === parseInt(id));
    return entry ? { ...entry } : null;
  },

  async create(entryData) {
    await delay(300);
    
    // Validate required fields
    if (!entryData.taskId || !entryData.date) {
      throw new Error('Task and date are required');
    }

    // Calculate duration if start/end times provided
    let duration = entryData.duration;
    if (entryData.startTime && entryData.endTime && !duration) {
      const start = new Date(`${entryData.date}T${entryData.startTime}`);
      const end = new Date(`${entryData.date}T${entryData.endTime}`);
      duration = (end - start) / (1000 * 60 * 60);
    }

    // Calculate total amount
    const hourlyRate = entryData.hourlyRate || 0;
    const totalAmount = entryData.billable ? (duration * hourlyRate) : 0;

    const newEntry = {
      Id: nextId++,
      taskId: parseInt(entryData.taskId),
      projectId: entryData.projectId || null,
      userId: entryData.userId || 1,
      userName: entryData.userName || "Current User",
      date: entryData.date,
      startTime: entryData.startTime || "",
      endTime: entryData.endTime || "",
      duration: parseFloat(duration) || 0,
      description: entryData.description || "",
      billable: entryData.billable || false,
hourlyRate: parseFloat(hourlyRate),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      status: TIME_ENTRY_STATUSES.DRAFT,
      submittedAt: null,
      approvedAt: null,
      approvedBy: null,
      rejectionReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    timeEntries.push(newEntry);
    toast.success('Time entry created successfully');
    return { ...newEntry };
  },

  async update(id, entryData) {
    await delay(300);
    const index = timeEntries.findIndex(t => t.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Time entry not found');
    }

    // Calculate duration if start/end times provided
    let duration = entryData.duration;
    if (entryData.startTime && entryData.endTime && !duration) {
      const start = new Date(`${entryData.date}T${entryData.startTime}`);
      const end = new Date(`${entryData.date}T${entryData.endTime}`);
      duration = (end - start) / (1000 * 60 * 60);
    }

    // Calculate total amount
    const hourlyRate = entryData.hourlyRate || timeEntries[index].hourlyRate || 0;
    const finalDuration = duration !== undefined ? duration : timeEntries[index].duration;
    const totalAmount = entryData.billable !== undefined 
      ? (entryData.billable ? (finalDuration * hourlyRate) : 0)
      : (timeEntries[index].billable ? (finalDuration * hourlyRate) : 0);

    const updatedEntry = {
      ...timeEntries[index],
      ...entryData,
      duration: parseFloat(finalDuration),
hourlyRate: parseFloat(hourlyRate),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      updatedAt: new Date().toISOString()
    };
    timeEntries[index] = updatedEntry;
    toast.success('Time entry updated successfully');
    return { ...updatedEntry };
  },

  async delete(id) {
    await delay(200);
    const index = timeEntries.findIndex(t => t.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Time entry not found');
    }

    timeEntries.splice(index, 1);
    toast.success('Time entry deleted successfully');
    return true;
  },

  // Timer operations
  async getActiveTimers() {
    await delay(200);
    return [...activeTimers];
  },

  async startTimer(taskId, description = "Working on task") {
    await delay(300);
    
    // Stop any existing timer for this task
    activeTimers = activeTimers.filter(timer => timer.taskId !== parseInt(taskId));

    const newTimer = {
      Id: nextTimerId++,
      taskId: parseInt(taskId),
      projectId: null, // Will be set based on task
      userId: 1,
      userName: "Current User",
      startTime: new Date().toISOString(),
      description,
      isPaused: false,
      pausedDuration: 0
    };

    activeTimers.push(newTimer);
    toast.success('Timer started');
    return { ...newTimer };
  },

  async stopTimer(timerId, saveEntry = true) {
    await delay(300);
    const index = activeTimers.findIndex(t => t.Id === parseInt(timerId));
    if (index === -1) {
      throw new Error('Timer not found');
    }

    const timer = activeTimers[index];
    const now = new Date();
    const startTime = new Date(timer.startTime);
    const totalMs = now - startTime - (timer.pausedDuration || 0);
    const duration = totalMs / (1000 * 60 * 60); // Convert to hours

    activeTimers.splice(index, 1);

    if (saveEntry && duration > 0) {
      // Create time entry from timer
      const timeEntry = await this.create({
        taskId: timer.taskId,
        projectId: timer.projectId,
        userId: timer.userId,
        userName: timer.userName,
        date: startTime.toISOString().split('T')[0],
        startTime: startTime.toTimeString().slice(0, 5),
        endTime: now.toTimeString().slice(0, 5),
        duration: parseFloat(duration.toFixed(2)),
        description: timer.description,
billable: false, // Default to non-billable
        hourlyRate: 0,
        status: TIME_ENTRY_STATUSES.DRAFT
      });
      
      toast.success('Timer stopped and time entry created');
      return timeEntry;
    }

    toast.success('Timer stopped');
    return null;
  },

  async pauseTimer(timerId) {
    await delay(200);
    const index = activeTimers.findIndex(t => t.Id === parseInt(timerId));
    if (index === -1) {
      throw new Error('Timer not found');
    }

    activeTimers[index].isPaused = true;
    activeTimers[index].pauseStartTime = new Date().toISOString();
    return { ...activeTimers[index] };
  },

  async resumeTimer(timerId) {
    await delay(200);
    const index = activeTimers.findIndex(t => t.Id === parseInt(timerId));
    if (index === -1) {
      throw new Error('Timer not found');
    }

    const timer = activeTimers[index];
    if (timer.isPaused && timer.pauseStartTime) {
      const pauseTime = new Date() - new Date(timer.pauseStartTime);
      timer.pausedDuration = (timer.pausedDuration || 0) + pauseTime;
    }

    timer.isPaused = false;
    delete timer.pauseStartTime;
return { ...timer };
  },

  // Submit time entry for approval
  submitForApproval: async (entryId) => {
    await delay(500);
    const entry = timeEntries.find(e => e.Id === entryId);
    if (!entry) {
      throw new Error('Time entry not found');
    }
    if (entry.status !== TIME_ENTRY_STATUSES.DRAFT) {
      throw new Error('Only draft entries can be submitted for approval');
    }
    
    entry.status = TIME_ENTRY_STATUSES.SUBMITTED;
    entry.submittedAt = new Date().toISOString();
    entry.updatedAt = new Date().toISOString();
    
    return { ...entry };
  },

  // Approve time entry
  approveEntry: async (entryId, approverName = 'Project Manager') => {
    await delay(500);
    const entry = timeEntries.find(e => e.Id === entryId);
    if (!entry) {
      throw new Error('Time entry not found');
    }
    if (entry.status !== TIME_ENTRY_STATUSES.SUBMITTED) {
      throw new Error('Only submitted entries can be approved');
    }
    
    entry.status = TIME_ENTRY_STATUSES.APPROVED;
    entry.approvedAt = new Date().toISOString();
    entry.approvedBy = approverName;
    entry.rejectionReason = null;
    entry.updatedAt = new Date().toISOString();
    
    return { ...entry };
  },

  // Reject time entry
  rejectEntry: async (entryId, reason, rejectorName = 'Project Manager') => {
    await delay(500);
    const entry = timeEntries.find(e => e.Id === entryId);
    if (!entry) {
      throw new Error('Time entry not found');
    }
    if (entry.status !== TIME_ENTRY_STATUSES.SUBMITTED) {
      throw new Error('Only submitted entries can be rejected');
    }
    
    entry.status = TIME_ENTRY_STATUSES.REJECTED;
    entry.rejectionReason = reason;
    entry.rejectedAt = new Date().toISOString();
    entry.rejectedBy = rejectorName;
    entry.approvedAt = null;
    entry.approvedBy = null;
    entry.updatedAt = new Date().toISOString();
    
    return { ...entry };
  },

  // Get approval queue (submitted entries)
  getApprovalQueue: async () => {
    await delay(300);
    return timeEntries.filter(entry => entry.status === TIME_ENTRY_STATUSES.SUBMITTED)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  },

  // Bulk approve entries
  bulkApproveEntries: async (entryIds, approverName = 'Project Manager') => {
    await delay(800);
    const results = [];
    
    for (const entryId of entryIds) {
      const entry = timeEntries.find(e => e.Id === entryId);
      if (entry && entry.status === TIME_ENTRY_STATUSES.SUBMITTED) {
        entry.status = TIME_ENTRY_STATUSES.APPROVED;
        entry.approvedAt = new Date().toISOString();
        entry.approvedBy = approverName;
        entry.rejectionReason = null;
        entry.updatedAt = new Date().toISOString();
        results.push({ ...entry });
      }
    }
    
    return results;
  },

  // Bulk reject entries
  bulkRejectEntries: async (entryIds, reason, rejectorName = 'Project Manager') => {
    await delay(800);
    const results = [];
    
    for (const entryId of entryIds) {
      const entry = timeEntries.find(e => e.Id === entryId);
      if (entry && entry.status === TIME_ENTRY_STATUSES.SUBMITTED) {
        entry.status = TIME_ENTRY_STATUSES.REJECTED;
        entry.rejectionReason = reason;
        entry.rejectedAt = new Date().toISOString();
        entry.rejectedBy = rejectorName;
        entry.approvedAt = null;
        entry.approvedBy = null;
        entry.updatedAt = new Date().toISOString();
        results.push({ ...entry });
      }
    }
    
    return results;
  },

  // Mark entry as invoiced (only approved entries)
  markAsInvoiced: async (entryId) => {
    await delay(500);
    const entry = timeEntries.find(e => e.Id === entryId);
    if (!entry) {
      throw new Error('Time entry not found');
    }
    if (entry.status !== TIME_ENTRY_STATUSES.APPROVED) {
      throw new Error('Only approved entries can be marked as invoiced');
    }
    
    entry.status = TIME_ENTRY_STATUSES.INVOICED;
    entry.invoicedAt = new Date().toISOString();
    entry.updatedAt = new Date().toISOString();
    
    return { ...entry };
  },

  // Get entries by status
  getEntriesByStatus: async (status) => {
    await delay(300);
    return timeEntries.filter(entry => entry.status === status)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  // Check if entry can be edited
  canEditEntry: (entry) => {
    return entry.status === TIME_ENTRY_STATUSES.DRAFT || entry.status === TIME_ENTRY_STATUSES.REJECTED;
  },

  // Check if entry can be deleted
  canDeleteEntry: (entry) => {
    return entry.status === TIME_ENTRY_STATUSES.DRAFT || entry.status === TIME_ENTRY_STATUSES.REJECTED;
  }
};

export default timeTrackingService;