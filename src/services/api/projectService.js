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
      ...projectData
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
      Id: parseInt(id)
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
  }
}

export default projectService