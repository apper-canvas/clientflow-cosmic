import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { format, differenceInDays } from "date-fns"
import { toast } from "react-toastify"
import Button from "@/components/atoms/Button"
import StatusBadge from "@/components/molecules/StatusBadge"
import MetricCard from "@/components/molecules/MetricCard"
import ProjectForm from "@/components/organisms/ProjectForm"
import Loading from "@/components/ui/Loading"
import ErrorView from "@/components/ui/ErrorView"
import ApperIcon from "@/components/ApperIcon"
import projectService from "@/services/api/projectService"
import clientService from "@/services/api/clientService"

const ProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [client, setClient] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showEditForm, setShowEditForm] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadProjectData()
  }, [id])

  const loadProjectData = async () => {
    try {
      setLoading(true)
      setError("")
      
      const [projectData, clientsData, metricsData] = await Promise.all([
        projectService.getById(id),
        clientService.getAll(),
        projectService.getProjectMetrics(id)
      ])
      
      setProject(projectData)
      setClients(clientsData)
      setMetrics(metricsData)
      
      const projectClient = clientsData.find(c => c.Id === projectData.clientId)
      setClient(projectClient)
    } catch (err) {
      setError("Failed to load project details")
      console.error("Error loading project:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProject = () => {
    setShowEditForm(true)
  }

  const handleDeleteProject = async () => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await projectService.delete(project.Id)
      toast.success("Project deleted successfully")
      navigate("/projects")
    } catch (err) {
      toast.error("Failed to delete project")
      console.error("Error deleting project:", err)
    }
  }

  const handleSaveProject = async (savedProject) => {
    try {
      setProject(savedProject)
      setShowEditForm(false)
      toast.success("Project updated successfully")
      // Reload metrics after update
      const metricsData = await projectService.getProjectMetrics(id)
      setMetrics(metricsData)
    } catch (err) {
      toast.error("Failed to update project")
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      "Planning": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      "In Progress": "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
      "On Hold": "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400",
      "Completed": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      "Cancelled": "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
    }
    return colors[status] || "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
  }

  const getPriorityColor = (priority) => {
    const colors = {
      "Low": "text-green-600",
      "Medium": "text-amber-600", 
      "High": "text-orange-600",
      "Critical": "text-red-600"
    }
    return colors[priority] || "text-slate-600"
  }

  const getDaysUntilDeadline = () => {
    if (!project.deadline) return null
    const days = differenceInDays(new Date(project.deadline), new Date())
    return days
  }

  if (loading) return <Loading />
  if (error) return <ErrorView error={error} onRetry={loadProjectData} />
  if (!project) return <ErrorView error="Project not found" />

  const daysUntilDeadline = getDaysUntilDeadline()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/projects")}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <ApperIcon name="ChevronLeft" className="w-4 h-4 mr-1" />
                Projects
              </Button>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {project.name}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  {project.priority && (
                    <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                      {project.priority} Priority
                    </span>
                  )}
                  {client && (
                    <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                      <ApperIcon name="Building" className="w-4 h-4" />
                      {client.company || client.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {project.description && (
              <p className="text-slate-600 dark:text-slate-400 mt-4">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleEditProject}>
              <ApperIcon name="Edit" className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="danger" onClick={handleDeleteProject}>
              <ApperIcon name="Trash2" className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Budget Progress"
            value={`$${metrics.budget.spent.toLocaleString()}`}
            subtitle={`of $${metrics.budget.planned.toLocaleString()}`}
            icon="DollarSign"
            trend={metrics.budget.utilization > 100 ? "down" : "up"}
            trendValue={`${metrics.budget.utilization.toFixed(1)}%`}
          />
          <MetricCard
            title="Time Tracking"
            value={`${metrics.time.actual}h`}
            subtitle={`of ${metrics.time.estimated}h`}
            icon="Clock"
            trend={metrics.time.utilization > 100 ? "down" : "up"}
            trendValue={`${metrics.time.utilization.toFixed(1)}%`}
          />
          <MetricCard
            title="Completion"
            value={`${metrics.progress}%`}
            icon="TrendingUp"
            trend="up"
            trendValue="On track"
          />
          <MetricCard
            title="Profit Margin"
            value={`${metrics.profitMargin.toFixed(1)}%`}
            icon="PieChart"
            trend={metrics.profitMargin > 20 ? "up" : "down"}
            trendValue={metrics.profitMargin > 20 ? "Healthy" : "Monitor"}
          />
        </div>
      )}

      {/* Project Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Project Timeline
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Start Date</div>
            <div className="text-lg font-medium text-slate-900 dark:text-slate-100">
              {project.startDate ? format(new Date(project.startDate), "MMM dd, yyyy") : "Not set"}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Deadline</div>
            <div className="text-lg font-medium text-slate-900 dark:text-slate-100">
              {project.deadline ? format(new Date(project.deadline), "MMM dd, yyyy") : "Not set"}
            </div>
            {daysUntilDeadline !== null && (
              <div className={`text-sm mt-1 ${
                daysUntilDeadline < 0 
                  ? "text-red-600" 
                  : daysUntilDeadline <= 7 
                    ? "text-amber-600" 
                    : "text-green-600"
              }`}>
                {daysUntilDeadline < 0 
                  ? `${Math.abs(daysUntilDeadline)} days overdue`
                  : daysUntilDeadline === 0
                    ? "Due today"
                    : `${daysUntilDeadline} days remaining`
                }
              </div>
            )}
          </div>
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Duration</div>
            <div className="text-lg font-medium text-slate-900 dark:text-slate-100">
              {project.startDate && project.deadline
                ? `${differenceInDays(new Date(project.deadline), new Date(project.startDate))} days`
                : "Not calculated"}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Progress Overview
        </h3>
        
        <div className="space-y-6">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Overall Progress
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {project.progress || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
          </div>

          {/* Budget Progress */}
          {metrics && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Budget Utilization
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {metrics.budget.utilization.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metrics.budget.utilization > 100 ? "bg-red-500" : 
                    metrics.budget.utilization > 80 ? "bg-amber-500" : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(metrics.budget.utilization, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Time Progress */}
          {metrics && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Time Utilization
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {metrics.time.utilization.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metrics.time.utilization > 100 ? "bg-red-500" : 
                    metrics.time.utilization > 80 ? "bg-amber-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(metrics.time.utilization, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Information */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Project Information
          </h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Project Type</div>
              <div className="text-slate-900 dark:text-slate-100">
                {project.projectType || "Not specified"}
              </div>
            </div>
            {project.projectCode && (
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Project Code</div>
                <div className="text-slate-900 dark:text-slate-100 font-mono">
                  {project.projectCode}
                </div>
              </div>
            )}
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Budget</div>
              <div className="text-slate-900 dark:text-slate-100">
                ${project.budget?.toLocaleString() || "0"}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Estimated Hours</div>
              <div className="text-slate-900 dark:text-slate-100">
                {project.totalHours || 0} hours
              </div>
            </div>
            {project.billingType && (
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Billing Type</div>
                <div className="text-slate-900 dark:text-slate-100">
                  {project.billingType}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Team & Client */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Team & Client
          </h3>
          <div className="space-y-4">
            {client && (
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Client</div>
                <div className="text-slate-900 dark:text-slate-100">
                  {client.company || client.name}
                </div>
                {client.email && (
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {client.email}
                  </div>
                )}
              </div>
            )}
            {project.projectManager && (
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Project Manager</div>
                <div className="text-slate-900 dark:text-slate-100">
                  {project.projectManager}
                </div>
              </div>
            )}
            {project.teamMembers && project.teamMembers.length > 0 && (
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Team Members</div>
                <div className="text-slate-900 dark:text-slate-100">
                  {project.teamMembers.join(", ")}
                </div>
              </div>
            )}
            {project.tags && project.tags.length > 0 && (
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Project Form Modal */}
      {showEditForm && (
        <ProjectForm
          project={project}
          isOpen={showEditForm}
          onClose={() => setShowEditForm(false)}
          onSave={handleSaveProject}
          clients={clients}
        />
      )}
    </div>
  )
}

export default ProjectDetail