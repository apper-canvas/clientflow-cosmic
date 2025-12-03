import React, { useState, useEffect } from 'react';
import ApperIcon from '@/components/ApperIcon';
import { TaskCard } from '@/components/organisms/TaskCard';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import ErrorView from '@/components/ui/ErrorView';
import { taskService } from '@/services/api/taskService';
import { format, subDays, isAfter } from 'date-fns';

const TIME_FILTERS = [
  { value: 'all', label: 'All Time' },
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 3 Months' }
];

export default function CompletedTasks() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('30');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCompletedTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, timeFilter, searchQuery]);

  const loadCompletedTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const completedTasks = await taskService.getCompletedTasks();
      setTasks(completedTasks);
    } catch (err) {
      setError('Failed to load completed tasks');
      console.error('Error loading completed tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    // Time filter
    if (timeFilter !== 'all') {
      const daysAgo = parseInt(timeFilter);
      const cutoffDate = subDays(new Date(), daysAgo);
      filtered = filtered.filter(task => 
        task.completedAt && isAfter(new Date(task.completedAt), cutoffDate)
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.assignedTo?.toLowerCase().includes(query) ||
        task.tags?.some(tag => tag.name.toLowerCase().includes(query))
      );
    }

    setFilteredTasks(filtered);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.update(taskId, { status: newStatus });
      loadCompletedTasks(); // Reload to update the list
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleEdit = (task) => {
    // This would typically open a modal or navigate to edit form
    console.log('Edit task:', task);
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this completed task?')) {
      try {
        await taskService.delete(taskId);
        loadCompletedTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const getTaskStats = () => {
    const totalHours = filteredTasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
    const avgHours = filteredTasks.length > 0 ? totalHours / filteredTasks.length : 0;
    
    const priorityCounts = {
      high: filteredTasks.filter(t => t.priority === 'high').length,
      medium: filteredTasks.filter(t => t.priority === 'medium').length,
      low: filteredTasks.filter(t => t.priority === 'low').length
    };

    return { totalHours, avgHours, priorityCounts };
  };

  const stats = getTaskStats();

  if (isLoading) return <Loading />;
  if (error) return <ErrorView message={error} onRetry={loadCompletedTasks} />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <ApperIcon name="CheckCircle2" size={24} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Completed Tasks
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {filteredTasks.length} of {tasks.length} completed task{tasks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <button
          onClick={loadCompletedTasks}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
        >
          <ApperIcon name="RefreshCw" size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <ApperIcon name="CheckCircle2" size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {filteredTasks.length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ApperIcon name="Clock" size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {Math.round(stats.totalHours)}h
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Hours</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ApperIcon name="TrendingUp" size={16} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.avgHours.toFixed(1)}h
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Avg. per Task</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <ApperIcon name="Zap" size={16} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.priorityCounts.high}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">High Priority</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        {/* Time Filter */}
        <div className="flex items-center gap-2">
          <ApperIcon name="Calendar" size={16} className="text-slate-500" />
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {TIME_FILTERS.map(filter => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <ApperIcon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search completed tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        tasks.length === 0 ? (
          <Empty
            title="No completed tasks"
            description="Complete some tasks to see them appear here."
            icon="CheckCircle2"
            className="mt-12"
          />
        ) : (
          <Empty
            title="No tasks found"
            description="Try adjusting your filters or search query."
            icon="Search"
            className="mt-12"
          />
        )
      ) : (
        <>
          <div className="space-y-4">
            {filteredTasks.map(task => (
              <div key={task.Id} className="relative">
                <TaskCard
                  task={task}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  className="opacity-90 hover:opacity-100 transition-opacity duration-200"
                />
                
                {/* Completion Badge */}
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                    <ApperIcon name="Check" size={12} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Achievement Message */}
          {filteredTasks.length >= 10 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <ApperIcon name="Trophy" size={24} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900 dark:text-green-100 mb-1">
                    🎉 Productivity Champion!
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    You've completed {filteredTasks.length} tasks with a total of {Math.round(stats.totalHours)} hours of work. 
                    Keep up the amazing productivity!
                  </p>
                  
                  {/* Quick Stats */}
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <ApperIcon name="Zap" size={14} className="text-green-600 dark:text-green-400" />
                      <span className="text-green-700 dark:text-green-300">
                        <strong>{stats.priorityCounts.high}</strong> high priority
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ApperIcon name="Target" size={14} className="text-green-600 dark:text-green-400" />
                      <span className="text-green-700 dark:text-green-300">
                        <strong>{stats.priorityCounts.medium}</strong> medium priority
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ApperIcon name="Clock" size={14} className="text-green-600 dark:text-green-400" />
                      <span className="text-green-700 dark:text-green-300">
                        <strong>{stats.avgHours.toFixed(1)}h</strong> average per task
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}