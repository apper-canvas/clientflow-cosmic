import React, { useState, useEffect } from 'react';
import ApperIcon from '@/components/ApperIcon';
import { TaskCard } from '@/components/organisms/TaskCard';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import ErrorView from '@/components/ui/ErrorView';
import { taskService } from '@/services/api/taskService';
import { format, startOfWeek, endOfWeek, isSameDay, addDays } from 'date-fns';

export default function WeekTasks() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWeekTasks();
  }, []);

  const loadWeekTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const weekTasks = await taskService.getThisWeekTasks();
      setTasks(weekTasks);
    } catch (err) {
      setError('Failed to load this week\'s tasks');
      console.error('Error loading week tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.update(taskId, { status: newStatus });
      loadWeekTasks(); // Reload to update the list
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
        loadWeekTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const getTasksByDay = () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayTasks = tasks.filter(task => 
        task.dueDate && isSameDay(new Date(task.dueDate), day)
      );
      
      days.push({
        date: day,
        tasks: dayTasks,
        isToday: isSameDay(day, new Date()),
        isPast: day < new Date() && !isSameDay(day, new Date())
      });
    }
    
    return days;
  };

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
  const dayGroups = getTasksByDay();
  const completedTasks = tasks.filter(t => t.status === 'completed');

  if (isLoading) return <Loading />;
  if (error) return <ErrorView message={error} onRetry={loadWeekTasks} />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <ApperIcon name="Calendar" size={24} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              This Week's Tasks
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')} • {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0}%` 
                }}
              />
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {completedTasks.length}/{tasks.length}
            </span>
          </div>
          
          <button
            onClick={loadWeekTasks}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
          >
            <ApperIcon name="RefreshCw" size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Week Overview */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {dayGroups.map((day, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border text-center ${
              day.isToday 
                ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800' 
                : day.isPast
                ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className={`text-xs font-medium mb-1 ${
              day.isToday ? 'text-purple-700 dark:text-purple-300' : 'text-slate-600 dark:text-slate-400'
            }`}>
              {format(day.date, 'EEE')}
            </div>
            <div className={`text-lg font-bold mb-2 ${
              day.isToday ? 'text-purple-900 dark:text-purple-100' : 'text-slate-900 dark:text-white'
            }`}>
              {format(day.date, 'd')}
            </div>
            <div className="flex flex-col gap-1">
              {day.tasks.length > 0 ? (
                <>
                  <div className={`text-xs font-medium ${
                    day.isToday ? 'text-purple-700 dark:text-purple-300' : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {day.tasks.length} task{day.tasks.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex justify-center gap-1">
                    {day.tasks.slice(0, 3).map(task => (
                      <div
                        key={task.Id}
                        className={`w-2 h-2 rounded-full ${
                          task.status === 'completed' ? 'bg-green-500' :
                          task.priority === 'high' ? 'bg-red-500' :
                          task.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-slate-400'
                        }`}
                        title={task.title}
                      />
                    ))}
                    {day.tasks.length > 3 && (
                      <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    )}
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tasks by Day */}
      {tasks.length === 0 ? (
        <Empty
          title="No tasks this week"
          description="Your schedule is clear for this week. Time to plan ahead!"
          icon="Calendar"
          className="mt-12"
        />
      ) : (
        <div className="space-y-8">
          {dayGroups.filter(day => day.tasks.length > 0).map((day, index) => (
            <div key={index}>
              <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className={`p-2 rounded-lg ${
                  day.isToday 
                    ? 'bg-purple-100 dark:bg-purple-900/30' 
                    : day.isPast
                    ? 'bg-slate-100 dark:bg-slate-800'
                    : 'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  <ApperIcon 
                    name={
                      day.isToday ? "Clock" : 
                      day.isPast ? "CheckCircle2" : 
                      "Calendar"
                    } 
                    size={20} 
                    className={
                      day.isToday ? 'text-purple-600 dark:text-purple-400' :
                      day.isPast ? 'text-slate-500' :
                      'text-blue-600 dark:text-blue-400'
                    }
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {day.isToday ? 'Today' : format(day.date, 'EEEE')}
                    {day.isPast && !day.isToday && (
                      <span className="text-sm text-slate-500 ml-2">({format(day.date, 'MMM d')})</span>
                    )}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {format(day.date, 'MMMM d, yyyy')} • {day.tasks.length} task{day.tasks.length !== 1 ? 's' : ''}
                    {day.tasks.filter(t => t.status === 'completed').length > 0 && (
                      <span className="text-green-600 dark:text-green-400 ml-2">
                        ({day.tasks.filter(t => t.status === 'completed').length} completed)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {day.tasks.map(task => (
                  <TaskCard
                    key={task.Id}
                    task={task}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    className={`${
                      day.isToday ? 'border-l-4 border-l-purple-500' :
                      day.isPast ? 'opacity-75' :
                      ''
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Week Summary */}
      {tasks.length > 0 && (
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-3">
            <ApperIcon name="TrendingUp" size={20} className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-3">
                Week Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-purple-700 dark:text-purple-300 font-medium">Total Tasks:</span>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {tasks.length}
                  </div>
                </div>
                <div>
                  <span className="text-purple-700 dark:text-purple-300 font-medium">Completed:</span>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {completedTasks.length}
                  </div>
                </div>
                <div>
                  <span className="text-purple-700 dark:text-purple-300 font-medium">Remaining:</span>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {tasks.length - completedTasks.length}
                  </div>
                </div>
                <div>
                  <span className="text-purple-700 dark:text-purple-300 font-medium">Estimated Hours:</span>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0))}h
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}