import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import Button from "@/components/atoms/Button"
import Input from "@/components/atoms/Input"
import Select from "@/components/atoms/Select"
import SearchBar from "@/components/molecules/SearchBar"
import StatusBadge from "@/components/molecules/StatusBadge"
import ProjectCard from "@/components/organisms/ProjectCard"
import ProjectForm from "@/components/organisms/ProjectForm"
import Loading from "@/components/ui/Loading"
import ErrorView from "@/components/ui/ErrorView"
import Empty from "@/components/ui/Empty"
import ApperIcon from "@/components/ApperIcon"
import projectService from "@/services/api/projectService"
import clientService from "@/services/api/clientService"

const Projects = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [clientFilter, setClientFilter] = useState("all")
  const [sortBy, setSortBy] = useState("updatedAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [selectedProject, setSelectedProject] = useState(null)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [viewMode, setViewMode] = useState("grid")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")
      const [projectsData, clientsData] = await Promise.all([
        projectService.getAll(),
        clientService.getAll()
      ])
      setProjects(projectsData)
      setClients(clientsData)
    } catch (err) {
      setError("Failed to load projects")
      console.error("Error loading projects:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProject = () => {
    setSelectedProject(null)
    setShowProjectForm(true)
  }

  const handleEditProject = (project) => {
    setSelectedProject(project)
    setShowProjectForm(true)
  }

  const handleDeleteProject = async (project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await projectService.delete(project.Id)
      setProjects(prev => prev.filter(p => p.Id !== project.Id))
      toast.success("Project deleted successfully")
    } catch (err) {
      toast.error("Failed to delete project")
      console.error("Error deleting project:", err)
    }
  }

  const handleSaveProject = async (savedProject) => {
    try {
      if (selectedProject) {
        setProjects(prev => prev.map(p => 
          p.Id === savedProject.Id ? savedProject : p
        ))
        toast.success("Project updated successfully")
      } else {
        setProjects(prev => [savedProject, ...prev])
        toast.success("Project created successfully")
      }
      setShowProjectForm(false)
      setSelectedProject(null)
    } catch (err) {
      toast.error("Failed to save project")
    }
  }

  const handleCloseForm = () => {
    setShowProjectForm(false)
    setSelectedProject(null)
  }

  const getClientName = (clientId) => {
    const client = clients.find(c => c.Id === clientId)
    return client ? client.company || client.name : "Unknown Client"
  }

  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          getClientName(project.clientId).toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || project.status === statusFilter
      const matchesClient = clientFilter === "all" || project.clientId === parseInt(clientFilter)
      return matchesSearch && matchesStatus && matchesClient
    })
    .sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === "client") {
        aValue = getClientName(a.clientId)
        bValue = getClientName(b.clientId)
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const projectStats = {
    total: projects.length,
    planning: projects.filter(p => p.status === "Planning").length,
    inProgress: projects.filter(p => p.status === "In Progress").length,
    completed: projects.filter(p => p.status === "Completed").length,
    onHold: projects.filter(p => p.status === "On Hold").length
  }

  if (loading) return <Loading />
  if (error) return <ErrorView error={error} onRetry={loadData} />

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Projects
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage and track your projects
          </p>
        </div>
        <Button onClick={handleAddProject} className="shrink-0">
          <ApperIcon name="Plus" className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

{/* Stats Cards */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Project Overview
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Summary of your project portfolio
            </p>
          </div>
          <Button 
            variant="secondary"
            onClick={() => navigate('/reports')}
            className="shrink-0"
          >
            <ApperIcon name="BarChart3" className="w-4 h-4 mr-2" />
            View Reports
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {projectStats.total}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Total Projects
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {projectStats.planning}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Planning
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-600">
              {projectStats.inProgress}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              In Progress
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {projectStats.completed}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Completed
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-slate-600">
              {projectStats.onHold}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              On Hold
            </div>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {Math.round((projectStats.completed / (projectStats.total || 1)) * 100)}%
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                Completion Rate
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {Math.round((projectStats.inProgress / (projectStats.total || 1)) * 100)}%
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                Active Projects
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {clients.length}
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                Active Clients
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {projectStats.onHold > 0 ? projectStats.onHold : '-'}
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                On Hold
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
          <div className="lg:col-span-2">
            <SearchBar
              placeholder="Search projects..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Client
            </label>
            <Select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            >
              <option value="all">All Clients</option>
              {clients.map(client => (
                <option key={client.Id} value={client.Id}>
                  {client.company || client.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Sort By
            </label>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="updatedAt">Last Updated</option>
              <option value="name">Name</option>
              <option value="startDate">Start Date</option>
              <option value="deadline">Deadline</option>
              <option value="status">Status</option>
              <option value="client">Client</option>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <ApperIcon name="Grid3X3" className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <ApperIcon name="List" className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
            >
              <ApperIcon 
                name={sortOrder === "asc" ? "ArrowUp" : "ArrowDown"} 
                className="w-4 h-4" 
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredAndSortedProjects.length === 0 ? (
        <Empty 
          title="No projects found" 
          description="Create your first project or adjust your filters to see existing projects."
          icon="Folder"
          actionLabel="Create Project"
          onAction={handleAddProject}
        />
      ) : (
        <div className={
          viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }>
          {filteredAndSortedProjects.map(project => (
            <ProjectCard
              key={project.Id}
              project={project}
              client={clients.find(c => c.Id === project.clientId)}
              viewMode={viewMode}
              onView={(project) => navigate(`/projects/${project.Id}`)}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      )}

      {/* Project Form Modal */}
      {showProjectForm && (
        <ProjectForm
          project={selectedProject}
          isOpen={showProjectForm}
          onClose={handleCloseForm}
          onSave={handleSaveProject}
          clients={clients}
        />
      )}
    </div>
  )
}

export default Projects