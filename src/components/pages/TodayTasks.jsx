import React, { useState, useEffect } from 'react';
import ApperIcon from '@/components/ApperIcon';
import { TaskCard } from '@/components/organisms/TaskCard';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import ErrorView from '@/components/ui/ErrorView';
import { taskService } from '@/services/api/taskService';
import { format } from 'date-fns';

export default function TodayTasks() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTodayTasks();
  }, []);

  const loadTodayTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const todayTasks = await taskService.getTodayTasks();
      setTasks(todayTasks);
    } catch (err) {
      setError('Failed to load today\'s tasks');
      console.error('Error loading today\'s tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.update(taskId, { status: newStatus });
      loadTodayTasks(); // Reload to update the list
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
        loadTodayTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const getTasksByPriority = () => {
    const high = tasks.filter(t => t.priority === 'high');
    const medium = tasks.filter(t => t.priority === 'medium');
    const low = tasks.filter(t => t.priority === 'low');
    return { high, medium, low };
  };

  const priorityTasks = getTasksByPriority();
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  if (isLoading) return <Loading />;
  if (error) return <ErrorView message={error} onRetry={loadTodayTasks} />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <ApperIcon name="Clock" size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Today's Tasks
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {format(new Date(), 'EEEE, MMMM d, yyyy')} • {tasks.length} task{tasks.length !== 1 ? 's' : ''} due today
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Progress Ring */}
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                className="text-slate-200 dark:text-slate-700"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                strokeDasharray={`${tasks.length > 0 ? (completedTasks.length / tasks.length) * 87.96 : 0} 87.96`}
                className="text-green-500 transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
              </span>
            </div>
          </div>
          
          <button
            onClick={loadTodayTasks}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
          >
            <ApperIcon name="RefreshCw" size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <ApperIcon name="Zap" size={16} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {priorityTasks.high.length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">High Priority</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <ApperIcon name="Clock" size={16} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {pendingTasks.length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <ApperIcon name="CheckCircle2" size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {completedTasks.length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ApperIcon name="Target" size={16} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {Math.round(tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0))}h
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Estimated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Empty
          title="No tasks due today"
          description="Enjoy your day! No tasks are scheduled for today."
          icon="Calendar"
          className="mt-12"
        />
      ) : (
        <div className="space-y-6">
          {/* High Priority Tasks */}
          {priorityTasks.high.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded">
                  <ApperIcon name="Zap" size={16} className="text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  High Priority ({priorityTasks.high.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {priorityTasks.high.map(task => (
                  <TaskCard
                    key={task.Id}
                    task={task}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    className="border-l-4 border-l-red-500"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Medium Priority Tasks */}
          {priorityTasks.medium.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                  <ApperIcon name="Circle" size={16} className="text-yellow-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Medium Priority ({priorityTasks.medium.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {priorityTasks.medium.map(task => (
                  <TaskCard
                    key={task.Id}
                    task={task}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    className="border-l-4 border-l-yellow-500"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Low Priority Tasks */}
          {priorityTasks.low.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded">
                  <ApperIcon name="ArrowDown" size={16} className="text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Low Priority ({priorityTasks.low.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {priorityTasks.low.map(task => (
                  <TaskCard
                    key={task.Id}
                    task={task}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    className="border-l-4 border-l-green-500"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Motivation Message */}
      {tasks.length > 0 && (
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <ApperIcon name="Lightbulb" size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                {completedTasks.length === tasks.length ? 
                  "🎉 Amazing! All tasks completed!" : 
                  "💪 You've got this!"
                }
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {completedTasks.length === tasks.length ? 
                  "Take a moment to celebrate your productivity. Consider tackling tomorrow's tasks or taking a well-deserved break!" :
                  `${pendingTasks.length} task${pendingTasks.length !== 1 ? 's' : ''} remaining. Focus on high-priority items first to maximize your impact today.`
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}