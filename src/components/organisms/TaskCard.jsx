import React from "react";
import { format } from "date-fns";
import ApperIcon from "@/components/ApperIcon";
import StatusBadge from '@/components/molecules/StatusBadge'
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-50 border-red-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low': return 'text-green-600 bg-green-50 border-green-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

const getTimeProgress = (estimated, actual) => {
  if (!estimated || estimated === 0) return { percentage: 0, status: 'no-estimate' };
  const percentage = Math.min((actual / estimated) * 100, 100);
  const status = actual > estimated ? 'over' : actual === estimated ? 'complete' : 'on-track';
  return { percentage, status };
};

const formatFileSize = (size) => {
  if (typeof size === 'string') return size;
  if (size === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function TaskCard({ task, onEdit, onDelete, onStatusChange, onStartTimer, onStopTimer, className = '' }) {
  const timeProgress = getTimeProgress(task.estimatedHours, task.actualHours);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const handleStatusChange = (newStatus) => {
    onStatusChange(task.Id, newStatus);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'CheckCircle2';
      case 'in_progress': return 'Clock';
      default: return 'Circle';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      default: return 'text-slate-400';
    }
  };

return (
    <div className={`
      bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border transition-all duration-200 hover:shadow-md
      ${isOverdue ? 'border-red-200 dark:border-red-800' : 'border-slate-200 dark:border-slate-700'}
      ${task.activeTimer ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10' : ''}
      ${className}
    `}>
{/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-slate-900 dark:text-white line-clamp-2">
              {task.title}
            </h3>
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
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-1 ml-3">
          {/* Timer Controls */}
          {task.activeTimer ? (
            <button
              onClick={() => onStopTimer?.(task.Id)}
              className="p-1.5 text-green-600 hover:text-green-700 bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/40 rounded-lg transition-colors duration-200"
              title="Stop timer"
            >
              <ApperIcon name="Square" size={14} />
            </button>
          ) : (
            <button
              onClick={() => onStartTimer?.(task.Id)}
              className="p-1.5 text-slate-400 hover:text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors duration-200"
              title="Start timer"
            >
              <ApperIcon name="Play" size={14} />
            </button>
          )}
          
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
            title="Edit task"
          >
            <ApperIcon name="Edit3" size={14} />
          </button>
          <button
            onClick={() => onDelete(task.Id)}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
            title="Delete task"
          >
            <ApperIcon name="Trash2" size={14} />
          </button>
        </div>
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.tags.slice(0, 3).map(tag => (
            <span
              key={tag.id}
              className="px-2 py-1 text-xs font-medium rounded-full text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
              +{task.tags.length - 3} more
            </span>
          )}
        </div>
      )}

{/* Time Tracking Progress */}
      {task.estimatedHours > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
            <span>Progress: {task.actualHours || 0}h / {task.estimatedHours}h</span>
            <span className={`font-medium ${
              timeProgress.status === 'over' ? 'text-red-600' : 
              timeProgress.status === 'complete' ? 'text-green-600' : 
              'text-blue-600'
            }`}>
              {Math.round(timeProgress.percentage)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                timeProgress.status === 'over' ? 'bg-red-500' :
                timeProgress.status === 'complete' ? 'bg-green-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${Math.min(timeProgress.percentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Time Entries Summary */}
      {task.timeEntries && task.timeEntries.length > 0 && (
        <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {task.timeEntries.length} time {task.timeEntries.length === 1 ? 'entry' : 'entries'}
            {task.timeEntries.some(e => e.billable) && (
              <span className="ml-2 text-green-600 dark:text-green-400">
                ${task.timeEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.totalAmount || 0), 0).toFixed(2)} billable
              </span>
            )}
          </div>
        </div>
      )}

      {/* Status and Priority */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStatusChange(
              task.status === 'completed' ? 'todo' : 
              task.status === 'todo' ? 'in_progress' : 'completed'
            )}
            className={`p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 ${getStatusColor(task.status)}`}
            title="Change status"
          >
            <ApperIcon name={getStatusIcon(task.status)} size={16} />
          </button>
          <StatusBadge status={task.status} />
        </div>

        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
          {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
        </div>
      </div>

      {/* Meta Information */}
      <div className="space-y-2">
        {/* Due Date */}
        {task.dueDate && (
          <div className="flex items-center gap-2 text-sm">
            <ApperIcon 
              name={isOverdue ? "AlertCircle" : "Calendar"} 
              size={14} 
              className={isOverdue ? "text-red-500" : "text-slate-500"} 
            />
            <span className={isOverdue ? "text-red-600 font-medium" : "text-slate-600 dark:text-slate-400"}>
              {isOverdue ? 'Overdue: ' : 'Due: '}
              {format(new Date(task.dueDate), 'MMM d, yyyy')}
            </span>
          </div>
        )}

        {/* Assigned To */}
        {task.assignedTo && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <ApperIcon name="User" size={14} className="text-slate-500" />
            <span>{task.assignedTo}</span>
          </div>
        )}

        {/* Comments and Attachments Count */}
        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center gap-1">
              <ApperIcon name="MessageSquare" size={14} className="text-slate-500" />
              <span>{task.comments.length} comment{task.comments.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          
          {task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center gap-1">
              <ApperIcon name="Paperclip" size={14} className="text-slate-500" />
              <span>{task.attachments.length} file{task.attachments.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Attachments Preview */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {task.attachments.slice(0, 2).map(attachment => (
              <div
                key={attachment.id}
                className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-700 rounded text-xs"
              >
                <ApperIcon name="File" size={12} className="text-slate-500" />
                <span className="text-slate-600 dark:text-slate-400 truncate max-w-20">
                  {attachment.name}
                </span>
                <span className="text-slate-500">
                  {formatFileSize(attachment.size)}
                </span>
              </div>
            ))}
            {task.attachments.length > 2 && (
              <div className="flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-600 rounded text-xs text-slate-600 dark:text-slate-400">
                +{task.attachments.length - 2} more
              </div>
            )}
          </div>
        )}
      </div>

{/* Active Timer Display */}
      {task.activeTimer && (
        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Timer active</span>
            <span className="text-slate-500 dark:text-slate-400 text-xs">
              Started {format(new Date(task.activeTimer.startTime), 'HH:mm')}
            </span>
          </div>
        </div>
      )}

      {/* Completion Date */}
      {task.status === 'completed' && task.completedAt && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <ApperIcon name="CheckCircle2" size={14} />
            <span>
              Completed on {format(new Date(task.completedAt), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskCard;