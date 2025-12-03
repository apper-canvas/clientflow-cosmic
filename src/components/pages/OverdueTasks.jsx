import React, { useState, useEffect } from 'react';
import ApperIcon from '@/components/ApperIcon';
import { TaskCard } from '@/components/organisms/TaskCard';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import ErrorView from '@/components/ui/ErrorView';
import { taskService } from '@/services/api/taskService';
import { format } from 'date-fns';

export default function OverdueTasks() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOverdueTasks();
  }, []);

  const loadOverdueTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const overdueTasks = await taskService.getOverdueTasks();
      setTasks(overdueTasks);
    } catch (err) {
      setError('Failed to load overdue tasks');
      console.error('Error loading overdue tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.update(taskId, { status: newStatus });
      loadOverdueTasks(); // Reload to update the list
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleEdit = (task) => {
    // This would typically open a modal or navigate to edit form
    console.log('Edit task:', task);
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.delete(taskId);
        loadOverdueTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const getDaysOverdue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorView message={error} onRetry={loadOverdueTasks} />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <ApperIcon name="AlertCircle" size={24} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Overdue Tasks
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} past their due date
            </p>
          </div>
        </div>
        
        <button
          onClick={loadOverdueTasks}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
        >
          <ApperIcon name="RefreshCw" size={16} />
          Refresh
        </button>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Empty
          title="No overdue tasks"
          description="Great! All your tasks are on track."
          icon="CheckCircle2"
          className="mt-12"
        />
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
            <div key={task.Id} className="relative">
              {/* Overdue Badge */}
              <div className="absolute -top-2 -right-2 z-10">
                <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                  {getDaysOverdue(task.dueDate)} day{getDaysOverdue(task.dueDate) !== 1 ? 's' : ''} overdue
                </div>
              </div>
              
              <TaskCard
                task={task}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                className="border-l-4 border-l-red-500"
              />
              
              {/* Overdue Details */}
              <div className="mt-2 ml-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-l-red-500">
                <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                  <ApperIcon name="AlertTriangle" size={14} />
                  <span className="font-medium">
                    Due {format(new Date(task.dueDate), 'EEEE, MMMM d, yyyy')}
                  </span>
                  <span className="text-red-600 dark:text-red-400">
                    ({getDaysOverdue(task.dueDate)} day{getDaysOverdue(task.dueDate) !== 1 ? 's' : ''} ago)
                  </span>
                </div>
                
                {task.assignedTo && (
                  <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                    Assigned to: <span className="font-medium">{task.assignedTo}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {tasks.length > 0 && (
        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <h3 className="font-medium text-slate-900 dark:text-white mb-3">
            Overdue Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <ApperIcon name="AlertCircle" size={16} className="text-red-500" />
              <span className="text-slate-600 dark:text-slate-400">
                Total overdue: <strong className="text-red-600">{tasks.length}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ApperIcon name="Zap" size={16} className="text-red-500" />
              <span className="text-slate-600 dark:text-slate-400">
                High priority: <strong className="text-red-600">
                  {tasks.filter(t => t.priority === 'high').length}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ApperIcon name="Clock" size={16} className="text-red-500" />
              <span className="text-slate-600 dark:text-slate-400">
                Avg. days overdue: <strong className="text-red-600">
                  {Math.round(tasks.reduce((sum, task) => sum + getDaysOverdue(task.dueDate), 0) / tasks.length)}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}