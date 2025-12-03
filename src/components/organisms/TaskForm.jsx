import React, { useEffect, useState } from "react";
import clientService from "@/services/api/clientService";
import projectService from "@/services/api/projectService";
import taskService from "@/services/api/taskService";
import ApperIcon from "@/components/ApperIcon";
import Select from "@/components/atoms/Select";
import Label from "@/components/atoms/Label";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import FormField from "@/components/molecules/FormField";
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' }
];

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' }
];

const PREDEFINED_TAGS = [
  { id: 1, name: 'Design', color: '#3B82F6' },
  { id: 2, name: 'Frontend', color: '#10B981' },
  { id: 3, name: 'High Priority', color: '#EF4444' },
  { id: 4, name: 'Backend', color: '#8B5CF6' },
  { id: 5, name: 'Security', color: '#F59E0B' },
  { id: 6, name: 'Database', color: '#EC4899' },
  { id: 7, name: 'Testing', color: '#06B6D4' },
  { id: 8, name: 'Mobile', color: '#84CC16' },
  { id: 9, name: 'QA', color: '#6366F1' },
  { id: 10, name: 'Documentation', color: '#64748B' },
  { id: 11, name: 'Performance', color: '#F97316' }
];

export function TaskForm({ task, onSubmit, onCancel }) {
const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
    projectId: '',
    clientId: '',
    estimatedHours: 0,
    billable: false,
    hourlyRate: 0,
    tags: []
  });
  
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [availableTags, setAvailableTags] = useState(PREDEFINED_TAGS);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        assignedTo: task.assignedTo || '',
        projectId: task.projectId || '',
        clientId: task.clientId || '',
        estimatedHours: task.estimatedHours || 0,
        billable: task.billable || false,
        hourlyRate: task.hourlyRate || 0,
        tags: task.tags || []
      });
    }
  }, [task]);

  const loadData = async () => {
    try {
      const [projectsData, clientsData, tagsData] = await Promise.all([
        projectService.getAll(),
        clientService.getAll(),
        taskService.getAllTags()
      ]);
      
      setProjects(projectsData);
      setClients(clientsData);
      
      // Combine predefined tags with existing tags
      const allTags = [...PREDEFINED_TAGS];
      tagsData.forEach(tag => {
        if (!allTags.find(t => t.name === tag.name)) {
          allTags.push(tag);
        }
      });
      setAvailableTags(allTags);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

try {
      const taskData = {
        ...formData,
        estimatedHours: parseFloat(formData.estimatedHours) || 0,
        hourlyRate: parseFloat(formData.hourlyRate) || 0
      };

      let savedTask;
      if (task) {
        savedTask = await taskService.update(task.Id, taskData);
      } else {
        savedTask = await taskService.create(taskData);
      }

      // Handle file uploads if any files selected
      if (selectedFiles.length > 0 && savedTask) {
        for (const file of selectedFiles) {
          await taskService.addAttachment(savedTask.Id, {
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type,
            uploadedBy: 'Current User'
          });
        }
      }

      onSubmit(savedTask);
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagToggle = (tag) => {
    setFormData(prev => {
      const isSelected = prev.tags.some(t => t.id === tag.id);
      
      if (isSelected) {
        return {
          ...prev,
          tags: prev.tags.filter(t => t.id !== tag.id)
        };
      } else {
        return {
          ...prev,
          tags: [...prev.tags, tag]
        };
      }
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          {task ? 'Edit Task' : 'Create New Task'}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-slate-500 hover:text-slate-700"
        >
          <ApperIcon name="X" size={16} />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <Label htmlFor="title" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Task Title *
          </Label>
          <Input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter task title"
            required
            className="mt-1"
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Description
          </Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter task description"
            rows={3}
            className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
          />
        </div>

        {/* Priority and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Priority
            </Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => handleInputChange('priority', value)}
              className="mt-1"
            >
              <option value="">Select Priority</option>
              {PRIORITY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="status" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
              className="mt-1"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Due Date and Estimated Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dueDate" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Due Date
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="estimatedHours" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Estimated Hours
            </Label>
            <Input
              id="estimatedHours"
              type="number"
              min="0"
              step="0.5"
              value={formData.estimatedHours}
              onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
              placeholder="0"
              className="mt-1"
            />
          </div>
        </div>
{/* Assigned To */}
        <div>
          <Label htmlFor="assignedTo" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Assigned To
          </Label>
          <Input
            id="assignedTo"
            type="text"
            value={formData.assignedTo}
            onChange={(e) => handleInputChange('assignedTo', e.target.value)}
            placeholder="Enter assignee name"
            className="mt-1"
          />
        </div>

        {/* Project and Client */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="project" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Project
            </Label>
            <Select
              value={formData.projectId}
              onValueChange={(value) => handleInputChange('projectId', value)}
              className="mt-1"
            >
              <option value="">Select Project</option>
              {projects.map(project => (
                <option key={project.Id} value={project.Id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="client" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Client
            </Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => handleInputChange('clientId', value)}
              className="mt-1"
            >
              <option value="">Select Client</option>
              {clients.map(client => (
                <option key={client.Id} value={client.Id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Time Tracking Settings */}
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Time Tracking</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimatedHours" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Estimated Hours
              </Label>
              <Input
                id="estimatedHours"
                type="number"
                step="0.25"
                min="0"
                value={formData.estimatedHours}
                onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="hourlyRate" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Hourly Rate ($)
              </Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                value={formData.hourlyRate}
                onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="billable"
              checked={formData.billable}
              onChange={(e) => handleInputChange('billable', e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-600"
            />
            <Label htmlFor="billable" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Billable task
</Label>
          </div>
        </div>

        {/* Tags */}
        <div>
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
            Tags
          </Label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => {
              const isSelected = formData.tags.some(t => t.id === tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'text-white shadow-md'
                      : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                  style={isSelected ? { backgroundColor: tag.color } : {}}
                >
                  {tag.name}
                  {isSelected && <ApperIcon name="Check" size={12} className="ml-1 inline" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* File Attachments */}
        <div>
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
            File Attachments
          </Label>
          
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              accept="*/*"
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg p-4 transition-colors duration-200"
            >
              <ApperIcon name="Upload" size={32} className="text-slate-400 mb-2" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Click to upload files or drag and drop
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Any file type supported
              </span>
            </label>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-slate-50 dark:bg-slate-700 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <ApperIcon name="File" size={16} className="text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-slate-500 hover:text-red-600"
                  >
                    <ApperIcon name="Trash2" size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="submit"
            disabled={isLoading || !formData.title.trim()}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {isLoading ? (
              <>
                <ApperIcon name="Loader2" size={16} className="mr-2 animate-spin" />
                {task ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <ApperIcon name={task ? "Save" : "Plus"} size={16} className="mr-2" />
                {task ? 'Update Task' : 'Create Task'}
              </>
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default TaskForm;