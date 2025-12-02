import projectsData from "@/services/mockData/projects.json"

let projects = [...projectsData]

const projectService = {
  async getAll() {
    await new Promise(resolve => setTimeout(resolve, 300))
    return [...projects]
  },

  async getById(id) {
    await new Promise(resolve => setTimeout(resolve, 200))
    const project = projects.find(p => p.Id === parseInt(id))
    if (!project) {
      throw new Error("Project not found")
    }
    return { ...project }
  },

  async create(projectData) {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const newId = Math.max(...projects.map(p => p.Id), 0) + 1
    const newProject = {
      Id: newId,
      ...projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    projects.push(newProject)
    return { ...newProject }
  },

  async update(id, projectData) {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const index = projects.findIndex(p => p.Id === parseInt(id))
    if (index === -1) {
      throw new Error("Project not found")
    }
    
    const updatedProject = {
      ...projects[index],
      ...projectData,
      Id: parseInt(id),
      updatedAt: new Date().toISOString()
    }
    
    projects[index] = updatedProject
    return { ...updatedProject }
  },

  async delete(id) {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const index = projects.findIndex(p => p.Id === parseInt(id))
    if (index === -1) {
      throw new Error("Project not found")
    }
    
    projects.splice(index, 1)
    return true
  },

  async getByClient(clientId) {
    await new Promise(resolve => setTimeout(resolve, 200))
    return projects.filter(p => p.clientId === clientId).map(p => ({ ...p }))
  },

  async getByStatus(status) {
    await new Promise(resolve => setTimeout(resolve, 200))
    return projects.filter(p => p.status === status).map(p => ({ ...p }))
  },

  async getProjectMetrics(id) {
    await new Promise(resolve => setTimeout(resolve, 200))
    const project = projects.find(p => p.Id === parseInt(id))
    if (!project) {
      throw new Error("Project not found")
    }

    // Calculate metrics based on project data
    const totalBudget = project.budget || 0
    const spentAmount = (project.spentAmount || 0)
    const remainingBudget = totalBudget - spentAmount
    const budgetUtilization = totalBudget > 0 ? (spentAmount / totalBudget) * 100 : 0

    const estimatedHours = project.totalHours || 0
    const actualHours = project.actualHours || 0
    const timeUtilization = estimatedHours > 0 ? (actualHours / estimatedHours) * 100 : 0

    const progress = project.progress || 0
    const profitMargin = totalBudget > 0 ? ((totalBudget - spentAmount) / totalBudget) * 100 : 0

    return {
      budget: {
        planned: totalBudget,
        spent: spentAmount,
        remaining: remainingBudget,
        utilization: budgetUtilization
      },
      time: {
        estimated: estimatedHours,
        actual: actualHours,
        utilization: timeUtilization
      },
      progress: progress,
      profitMargin: profitMargin,
      tasksCount: {
        total: project.totalTasks || 0,
        completed: project.completedTasks || 0,
        inProgress: project.inProgressTasks || 0,
        todo: project.todoTasks || 0
      }
    }
  }
}

export default projectService