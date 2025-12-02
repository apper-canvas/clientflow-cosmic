import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import Button from "@/components/atoms/Button"
import Input from "@/components/atoms/Input"
import Select from "@/components/atoms/Select"
import Label from "@/components/atoms/Label"
import FormField from "@/components/molecules/FormField"
import ApperIcon from "@/components/ApperIcon"
import projectService from "@/services/api/projectService"

const ProjectForm = ({ 
  project, 
  isOpen, 
  onClose, 
  onSave,
  clients = [] 
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    clientId: "",
    projectType: "Fixed Price",
    status: "Planning",
    priority: "Medium",
    startDate: "",
    deadline: "",
    budget: "",
    totalHours: "",
    billingType: "Billable",
    projectManager: "",
    teamMembers: "",
    tags: "",
    projectCode: "",
    progress: 0
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        clientId: project.clientId || "",
        projectType: project.projectType || "Fixed Price",
        status: project.status || "Planning",
        priority: project.priority || "Medium",
        startDate: project.startDate ? project.startDate.split('T')[0] : "",
        deadline: project.deadline ? project.deadline.split('T')[0] : "",
        budget: project.budget || "",
        totalHours: project.totalHours || "",
        billingType: project.billingType || "Billable",
        projectManager: project.projectManager || "",
        teamMembers: Array.isArray(project.teamMembers) ? project.teamMembers.join(", ") : "",
        tags: Array.isArray(project.tags) ? project.tags.join(", ") : "",
        projectCode: project.projectCode || "",
        progress: project.progress || 0
      })
    } else {
      // Generate project code for new projects
      const code = `PRJ-${Date.now().toString().slice(-6)}`
      setFormData(prev => ({
        ...prev,
        projectCode: code
      }))
    }
  }, [project])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required"
    }

    if (!formData.clientId) {
      newErrors.clientId = "Client selection is required"
    }

    if (formData.budget && isNaN(parseFloat(formData.budget))) {
      newErrors.budget = "Budget must be a valid number"
    }

    if (formData.totalHours && isNaN(parseFloat(formData.totalHours))) {
      newErrors.totalHours = "Hours must be a valid number"
    }

    if (formData.startDate && formData.deadline) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.deadline)
      if (end < start) {
        newErrors.deadline = "Deadline must be after start date"
      }
    }

    if (formData.progress < 0 || formData.progress > 100) {
      newErrors.progress = "Progress must be between 0 and 100"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      
      const submitData = {
        ...formData,
        clientId: parseInt(formData.clientId),
        budget: formData.budget ? parseFloat(formData.budget) : null,
        totalHours: formData.totalHours ? parseFloat(formData.totalHours) : null,
        progress: parseInt(formData.progress),
        teamMembers: formData.teamMembers 
          ? formData.teamMembers.split(",").map(m => m.trim()).filter(m => m)
          : [],
        tags: formData.tags 
          ? formData.tags.split(",").map(t => t.trim()).filter(t => t)
          : [],
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
      }

      let savedProject
      if (project) {
        savedProject = await projectService.update(project.Id, submitData)
      } else {
        savedProject = await projectService.create(submitData)
      }
      
      onSave(savedProject)
    } catch (err) {
      toast.error(err.message || "Failed to save project")
      console.error("Error saving project:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-slate-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              {project ? "Edit Project" : "Create New Project"}
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ApperIcon name="X" className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">
                  Basic Information
                </h4>
                
                <FormField
                  label="Project Name"
                  error={errors.name}
                  required
                >
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Enter project name"
                    className={errors.name ? "border-red-500" : ""}
                  />
                </FormField>

                <FormField
                  label="Project Code"
                  error={errors.projectCode}
                >
                  <Input
                    value={formData.projectCode}
                    onChange={(e) => handleChange("projectCode", e.target.value)}
                    placeholder="PRJ-XXXXXX"
                  />
                </FormField>

                <FormField
                  label="Client"
                  error={errors.clientId}
                  required
                >
                  <Select
                    value={formData.clientId}
                    onChange={(e) => handleChange("clientId", e.target.value)}
                    className={errors.clientId ? "border-red-500" : ""}
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.Id} value={client.Id}>
                        {client.company || client.name}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField
                  label="Description"
                  error={errors.description}
                >
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100 resize-none"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Enter project description"
                  />
                </FormField>
              </div>

              {/* Project Details */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">
                  Project Details
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Project Type"
                    error={errors.projectType}
                  >
                    <Select
                      value={formData.projectType}
                      onChange={(e) => handleChange("projectType", e.target.value)}
                    >
                      <option value="Fixed Price">Fixed Price</option>
                      <option value="Hourly">Hourly</option>
                      <option value="Retainer">Retainer</option>
                      <option value="Recurring">Recurring</option>
                    </Select>
                  </FormField>

                  <FormField
                    label="Status"
                    error={errors.status}
                  >
                    <Select
                      value={formData.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                    >
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </Select>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Priority"
                    error={errors.priority}
                  >
                    <Select
                      value={formData.priority}
                      onChange={(e) => handleChange("priority", e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </Select>
                  </FormField>

                  <FormField
                    label="Billing Type"
                    error={errors.billingType}
                  >
                    <Select
                      value={formData.billingType}
                      onChange={(e) => handleChange("billingType", e.target.value)}
                    >
                      <option value="Billable">Billable</option>
                      <option value="Non-billable">Non-billable</option>
                      <option value="Internal">Internal</option>
                    </Select>
                  </FormField>
                </div>
              </div>
            </div>

            {/* Timeline & Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-md font-medium text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">
                  Timeline
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Start Date"
                    error={errors.startDate}
                  >
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleChange("startDate", e.target.value)}
                    />
                  </FormField>

                  <FormField
                    label="Deadline"
                    error={errors.deadline}
                  >
                    <Input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => handleChange("deadline", e.target.value)}
                      className={errors.deadline ? "border-red-500" : ""}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Progress (%)"
                  error={errors.progress}
                >
                  <div className="flex items-center gap-3">
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.progress}
                      onChange={(e) => handleChange("progress", e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400 min-w-12">
                      {formData.progress}%
                    </span>
                  </div>
                </FormField>
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-medium text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">
                  Budget & Resources
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Budget ($)"
                    error={errors.budget}
                  >
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.budget}
                      onChange={(e) => handleChange("budget", e.target.value)}
                      placeholder="0.00"
                      className={errors.budget ? "border-red-500" : ""}
                    />
                  </FormField>

                  <FormField
                    label="Estimated Hours"
                    error={errors.totalHours}
                  >
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.totalHours}
                      onChange={(e) => handleChange("totalHours", e.target.value)}
                      placeholder="0"
                      className={errors.totalHours ? "border-red-500" : ""}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Project Manager"
                  error={errors.projectManager}
                >
                  <Input
                    value={formData.projectManager}
                    onChange={(e) => handleChange("projectManager", e.target.value)}
                    placeholder="Assign project manager"
                  />
                </FormField>
              </div>
            </div>

            {/* Team & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Team Members"
                error={errors.teamMembers}
              >
                <Input
                  value={formData.teamMembers}
                  onChange={(e) => handleChange("teamMembers", e.target.value)}
                  placeholder="Enter team members (comma separated)"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Separate multiple members with commas
                </p>
              </FormField>

              <FormField
                label="Tags"
                error={errors.tags}
              >
                <Input
                  value={formData.tags}
                  onChange={(e) => handleChange("tags", e.target.value)}
                  placeholder="Enter tags (comma separated)"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Separate multiple tags with commas
                </p>
              </FormField>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading && <ApperIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />}
                {project ? "Update Project" : "Create Project"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProjectForm