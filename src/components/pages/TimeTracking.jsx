import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, subDays, addMonths, subMonths } from 'date-fns';
import { toast } from 'react-toastify';
import timeTrackingService from '@/services/api/timeTrackingService';
import taskService from '@/services/api/taskService';
import projectService from '@/services/api/projectService';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Label from '@/components/atoms/Label';
import ApperIcon from '@/components/ApperIcon';
import Loading from '@/components/ui/Loading';
import Empty from '@/components/ui/Empty';
import { cn } from '@/utils/cn';

const TimeTracking = () => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTimers, setActiveTimers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('daily'); // daily, weekly, monthly, list
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTimeEntryForm, setShowTimeEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    taskId: '',
    projectId: '',
    dateFrom: '',
    dateTo: '',
    billable: '',
    status: ''
  });

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const [entriesData, tasksData, projectsData, timersData] = await Promise.all([
        timeTrackingService.getAll(),
        taskService.getAll(),
        projectService.getAll(),
        timeTrackingService.getActiveTimers()
      ]);
      
      setTimeEntries(entriesData);
      setTasks(tasksData);
      setProjects(projectsData);
      setActiveTimers(timersData);
    } catch (err) {
      toast.error('Failed to load time tracking data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter time entries based on current view and filters
  const getFilteredEntries = () => {
    let filtered = [...timeEntries];

    // Date filtering based on view
    if (view === 'daily') {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      filtered = filtered.filter(entry => entry.date === dateStr);
    } else if (view === 'weekly') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= weekStart && entryDate <= weekEnd;
      });
    } else if (view === 'monthly') {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= monthStart && entryDate <= monthEnd;
      });
    }

    // Apply additional filters
    if (filters.taskId) {
      filtered = filtered.filter(entry => entry.taskId === parseInt(filters.taskId));
    }
    if (filters.projectId) {
      filtered = filtered.filter(entry => entry.projectId === parseInt(filters.projectId));
    }
    if (filters.billable !== '') {
      filtered = filtered.filter(entry => entry.billable === (filters.billable === 'true'));
    }
    if (filters.status) {
      filtered = filtered.filter(entry => entry.status === filters.status);
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(entry => entry.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(entry => entry.date <= filters.dateTo);
    }

    return filtered;
  };

  // Calculate totals
  const calculateTotals = (entries) => {
    const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const billableHours = entries.filter(entry => entry.billable).reduce((sum, entry) => sum + entry.duration, 0);
    const nonBillableHours = totalHours - billableHours;
    const totalAmount = entries.filter(entry => entry.billable).reduce((sum, entry) => sum + entry.totalAmount, 0);

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      billableHours: Math.round(billableHours * 100) / 100,
      nonBillableHours: Math.round(nonBillableHours * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  };

  const filteredEntries = getFilteredEntries();
  const totals = calculateTotals(filteredEntries);

  // Handle timer operations
  const handleStartTimer = async (taskId, description) => {
    try {
      await timeTrackingService.startTimer(taskId, description);
      toast.success('Timer started');
      loadData();
    } catch (err) {
      toast.error('Failed to start timer');
      console.error('Error starting timer:', err);
    }
  };

  const handleStopTimer = async (timerId) => {
    try {
      await timeTrackingService.stopTimer(timerId, true);
      loadData();
    } catch (err) {
      toast.error('Failed to stop timer');
      console.error('Error stopping timer:', err);
    }
  };

  // Handle time entry operations
  const handleCreateEntry = async (entryData) => {
    try {
      await timeTrackingService.create(entryData);
      setShowTimeEntryForm(false);
      loadData();
    } catch (err) {
      toast.error('Failed to create time entry');
      console.error('Error creating entry:', err);
    }
  };

  const handleUpdateEntry = async (entryData) => {
    try {
      await timeTrackingService.update(editingEntry.Id, entryData);
      setShowTimeEntryForm(false);
      setEditingEntry(null);
      loadData();
    } catch (err) {
      toast.error('Failed to update time entry');
      console.error('Error updating entry:', err);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return;
    
    try {
      await timeTrackingService.delete(entryId);
      loadData();
    } catch (err) {
      toast.error('Failed to delete time entry');
      console.error('Error deleting entry:', err);
    }
  };

  // Navigation handlers
  const navigateDate = (direction) => {
    if (view === 'daily') {
      setSelectedDate(direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1));
    } else if (view === 'weekly') {
      setSelectedDate(direction === 'prev' ? subDays(selectedDate, 7) : addDays(selectedDate, 7));
    } else if (view === 'monthly') {
      setSelectedDate(direction === 'prev' ? subMonths(selectedDate, 1) : addMonths(selectedDate, 1));
    }
  };

  const getDateRangeLabel = () => {
    if (view === 'daily') {
      return format(selectedDate, 'EEEE, MMMM d, yyyy');
    } else if (view === 'weekly') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else if (view === 'monthly') {
      return format(selectedDate, 'MMMM yyyy');
    }
    return '';
  };

  // Render view-specific content
  const renderDailyView = () => {
    const dayEntries = filteredEntries;
    
    return (
      <div className="space-y-4">
        {/* Quick Timer Start */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Quick Start Timer</h3>
          <div className="flex gap-2">
            <Select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  handleStartTimer(e.target.value, 'Working on task');
                }
              }}
              className="flex-1"
            >
              <option value="">Select task to start timer...</option>
              {tasks.map(task => (
                <option key={task.Id} value={task.Id}>
                  {task.title}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Active Timers */}
        {activeTimers.length > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              Active Timers
            </h3>
            <div className="space-y-2">
              {activeTimers.map(timer => {
                const task = tasks.find(t => t.Id === timer.taskId);
                return (
                  <div key={timer.Id} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {task?.title || `Task ${timer.taskId}`}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {timer.description}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStopTimer(timer.Id)}
                      icon="Square"
                    >
                      Stop Timer
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Time Entries */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Time Entries - {format(selectedDate, 'MMM d, yyyy')}
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowTimeEntryForm(true)}
              icon="Plus"
            >
              Add Entry
            </Button>
          </div>
          
          <div className="p-4">
            {dayEntries.length === 0 ? (
              <Empty
                title="No time entries"
                description="No time entries found for this day"
                actionLabel="Add Entry"
                onAction={() => setShowTimeEntryForm(true)}
              />
            ) : (
              <div className="space-y-3">
                {dayEntries.map(entry => {
                  const task = tasks.find(t => t.Id === entry.taskId);
                  const project = projects.find(p => p.Id === entry.projectId);
                  
                  return (
                    <div key={entry.Id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {task?.title || 'Unknown Task'}
                          </div>
                          {entry.billable && (
                            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                              Billable
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${
                            entry.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            entry.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {entry.status}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {entry.description}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-1">
                          <span>{entry.startTime} - {entry.endTime}</span>
                          <span>{entry.duration}h</span>
                          {project && <span>{project.name}</span>}
                          {entry.billable && (
                            <span className="font-medium text-green-600 dark:text-green-400">
                              ${entry.totalAmount.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingEntry(entry);
                            setShowTimeEntryForm(true);
                          }}
                          icon="Edit3"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEntry(entry.Id)}
                          icon="Trash2"
                          className="text-red-600 hover:text-red-700"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWeeklyView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(selectedDate, { weekStartsOn: 1 })
    });

    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
          {weekDays.map(day => (
            <div key={day.toISOString()} className="p-4 border-r border-slate-200 dark:border-slate-700 last:border-r-0">
              <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-2">
                {format(day, 'EEE d')}
              </div>
              <div className="space-y-1">
                {filteredEntries
                  .filter(entry => isSameDay(new Date(entry.date), day))
                  .map(entry => {
                    const task = tasks.find(t => t.Id === entry.taskId);
                    return (
                      <div key={entry.Id} className="text-xs p-2 bg-slate-50 dark:bg-slate-900 rounded">
                        <div className="font-medium truncate">{task?.title}</div>
                        <div className="text-slate-600 dark:text-slate-400">{entry.duration}h</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthlyView = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="bg-slate-50 dark:bg-slate-900 p-2 text-center text-sm font-medium text-slate-700 dark:text-slate-300">
              {day}
            </div>
          ))}
          {monthDays.map(day => {
            const dayEntries = filteredEntries.filter(entry => isSameDay(new Date(entry.date), day));
            const dayHours = dayEntries.reduce((sum, entry) => sum + entry.duration, 0);
            
            return (
              <div key={day.toISOString()} className="bg-white dark:bg-slate-800 min-h-24 p-2">
                <div className="text-sm text-slate-900 dark:text-slate-100 mb-1">
                  {format(day, 'd')}
                </div>
                {dayHours > 0 && (
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {dayHours.toFixed(1)}h
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Date</th>
              <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Task</th>
              <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Project</th>
              <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Description</th>
              <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Time</th>
              <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Duration</th>
              <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Billable</th>
              <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Amount</th>
              <th className="text-center p-4 font-medium text-slate-900 dark:text-slate-100">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map(entry => {
              const task = tasks.find(t => t.Id === entry.taskId);
              const project = projects.find(p => p.Id === entry.projectId);
              
              return (
                <tr key={entry.Id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="p-4 text-sm text-slate-900 dark:text-slate-100">
                    {format(new Date(entry.date), 'MMM d')}
                  </td>
                  <td className="p-4 text-sm text-slate-900 dark:text-slate-100">
                    {task?.title || 'Unknown Task'}
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                    {project?.name || '-'}
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {entry.description || '-'}
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                    {entry.startTime} - {entry.endTime}
                  </td>
                  <td className="p-4 text-sm text-slate-900 dark:text-slate-100 font-medium">
                    {entry.duration}h
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      entry.billable 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {entry.billable ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {entry.billable ? `$${entry.totalAmount.toFixed(2)}` : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingEntry(entry);
                          setShowTimeEntryForm(true);
                        }}
                        icon="Edit3"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.Id)}
                        icon="Trash2"
                        className="text-red-600 hover:text-red-700"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
            Time Tracking
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track time, manage timers, and generate timesheets
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowTimeEntryForm(true)}
            icon="Plus"
          >
            Add Entry
          </Button>
          <Button
            variant="primary"
            onClick={loadData}
            icon="RefreshCw"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* View Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate('prev')}
            icon="ChevronLeft"
          />
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 min-w-64 text-center">
            {getDateRangeLabel()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate('next')}
            icon="ChevronRight"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {['daily', 'weekly', 'monthly', 'list'].map(viewMode => (
            <Button
              key={viewMode}
              variant={view === viewMode ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView(viewMode)}
            >
              {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Totals Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {totals.totalHours}h
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Hours</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {totals.billableHours}h
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Billable Hours</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
            {totals.nonBillableHours}h
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Non-Billable Hours</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            ${totals.totalAmount.toFixed(2)}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</div>
        </div>
      </div>

      {/* View Content */}
      {view === 'daily' && renderDailyView()}
      {view === 'weekly' && renderWeeklyView()}
      {view === 'monthly' && renderMonthlyView()}
      {view === 'list' && renderListView()}

      {/* Time Entry Form Modal */}
      {showTimeEntryForm && (
        <TimeEntryForm
          isOpen={showTimeEntryForm}
          onClose={() => {
            setShowTimeEntryForm(false);
            setEditingEntry(null);
          }}
          onSave={editingEntry ? handleUpdateEntry : handleCreateEntry}
          entry={editingEntry}
          tasks={tasks}
          projects={projects}
        />
      )}
    </div>
  );
};

// Time Entry Form Component
const TimeEntryForm = ({ isOpen, onClose, onSave, entry, tasks, projects }) => {
  const [formData, setFormData] = useState({
    taskId: '',
    projectId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    duration: '',
    description: '',
    billable: false,
    hourlyRate: 0,
    status: 'draft'
  });
  const [inputMode, setInputMode] = useState('time'); // 'time' or 'duration'

  useEffect(() => {
    if (entry) {
      setFormData({
        taskId: entry.taskId || '',
        projectId: entry.projectId || '',
        date: entry.date || format(new Date(), 'yyyy-MM-dd'),
        startTime: entry.startTime || '',
        endTime: entry.endTime || '',
        duration: entry.duration || '',
        description: entry.description || '',
        billable: entry.billable || false,
        hourlyRate: entry.hourlyRate || 0,
        status: entry.status || 'draft'
      });
    }
  }, [entry]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.taskId || !formData.date) {
      toast.error('Task and date are required');
      return;
    }

    if (inputMode === 'time' && (!formData.startTime || !formData.endTime)) {
      toast.error('Start time and end time are required');
      return;
    }

    if (inputMode === 'duration' && !formData.duration) {
      toast.error('Duration is required');
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {entry ? 'Edit Time Entry' : 'Add Time Entry'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} icon="X" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Task *</Label>
            <Select
              value={formData.taskId}
              onChange={(e) => {
                const taskId = e.target.value;
                const task = tasks.find(t => t.Id === parseInt(taskId));
                setFormData(prev => ({
                  ...prev,
                  taskId,
                  projectId: task?.projectId || '',
                  billable: task?.billable || false,
                  hourlyRate: task?.hourlyRate || 0
                }));
              }}
              required
            >
              <option value="">Select task</option>
              {tasks.map(task => (
                <option key={task.Id} value={task.Id}>
                  {task.title}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Date *</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label>Time Input Mode</Label>
            <div className="flex gap-2 mt-1">
              <Button
                type="button"
                variant={inputMode === 'time' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setInputMode('time')}
              >
                Start/End Time
              </Button>
              <Button
                type="button"
                variant={inputMode === 'duration' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setInputMode('duration')}
              >
                Duration
              </Button>
            </div>
          </div>

          {inputMode === 'time' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label>End Time *</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <div>
              <Label>Duration (hours) *</Label>
              <Input
                type="number"
                step="0.25"
                min="0"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseFloat(e.target.value) || '' }))}
                placeholder="e.g. 2.5"
              />
            </div>
          )}

          <div>
            <Label>Description</Label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What did you work on?"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.billable}
                onChange={(e) => setFormData(prev => ({ ...prev, billable: e.target.checked }))}
                className="rounded border-slate-300 dark:border-slate-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Billable</span>
            </label>
            
            {formData.billable && (
              <div className="flex-1">
                <Label>Hourly Rate ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {entry ? 'Update' : 'Create'} Entry
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeTracking;