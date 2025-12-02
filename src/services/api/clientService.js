import clientsData from "@/services/mockData/clients.json"

let clients = [...clientsData]

const clientService = {
  async getAll() {
    await new Promise(resolve => setTimeout(resolve, 300))
    return [...clients]
  },

  async getById(id) {
    await new Promise(resolve => setTimeout(resolve, 200))
    const client = clients.find(c => c.Id === parseInt(id))
    if (!client) {
      throw new Error("Client not found")
    }
    return { ...client }
  },

  async create(clientData) {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const newId = Math.max(...clients.map(c => c.Id), 0) + 1
    const newClient = {
      Id: newId,
      ...clientData,
      createdAt: new Date().toISOString()
    }
    
    clients.push(newClient)
    return { ...newClient }
  },

  async update(id, clientData) {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const index = clients.findIndex(c => c.Id === parseInt(id))
    if (index === -1) {
      throw new Error("Client not found")
    }
    
    const updatedClient = {
      ...clients[index],
      ...clientData,
      Id: parseInt(id)
    }
    
    clients[index] = updatedClient
    return { ...updatedClient }
  },

  async delete(id) {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const index = clients.findIndex(c => c.Id === parseInt(id))
    if (index === -1) {
      throw new Error("Client not found")
    }
    
    clients.splice(index, 1)
    return true
  }
}

export default clientService