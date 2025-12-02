import clientsData from "@/services/mockData/clients.json";

let clients = [...clientsData];
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
      company: clientData.company || '',
      name: clientData.name || '',
      email: clientData.email || '',
      phone: clientData.phone || '',
      mobilePhone: clientData.mobilePhone || '',
      website: clientData.website || '',
      address: {
        street: clientData.address?.street || '',
        city: clientData.address?.city || '',
        state: clientData.address?.state || '',
        zip: clientData.address?.zip || '',
        country: clientData.address?.country || 'US'
      },
      billingAddress: clientData.billingAddress || null,
      useSameAddress: clientData.useSameAddress !== false,
      taxId: clientData.taxId || '',
      paymentTerms: clientData.paymentTerms || 'Net 30',
      paymentMethod: clientData.paymentMethod || 'Bank Transfer',
      currency: clientData.currency || 'USD',
      status: clientData.status || 'Prospect',
      clientType: clientData.clientType || 'Company',
      industry: clientData.industry || '',
      totalRevenue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
      Id: parseInt(id),
      updatedAt: new Date().toISOString()
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
  },

  async search(query) {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    if (!query) return [...clients]
    
    const searchTerm = query.toLowerCase()
    return clients.filter(client => 
      client.company?.toLowerCase().includes(searchTerm) ||
      client.name?.toLowerCase().includes(searchTerm) ||
      client.email?.toLowerCase().includes(searchTerm) ||
      client.industry?.toLowerCase().includes(searchTerm)
    )
  },

  async getByStatus(status) {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    if (!status) return [...clients]
    
return clients.filter(client => client.status === status)
  },
// Bulk operations
  async getByIds(ids) {
    await new Promise(resolve => setTimeout(resolve, 200))
    return clients.filter(client => ids.includes(client.Id)).map(client => ({ ...client }))
  },

  async updateMultiple(ids, updateData) {
    await new Promise(resolve => setTimeout(resolve, 400))
    const updatedClients = []
    
    for (const id of ids) {
      const index = clients.findIndex(c => c.Id === parseInt(id))
      if (index !== -1) {
        const updatedClient = {
          ...clients[index],
          ...updateData,
          Id: parseInt(id),
          updatedAt: new Date().toISOString()
        }
        clients[index] = updatedClient
        updatedClients.push({ ...updatedClient })
      }
    }
    
    return updatedClients
  },

  async exportToCsv(ids = null) {
    await new Promise(resolve => setTimeout(resolve, 300))
    const clientsToExport = ids ? clients.filter(c => ids.includes(c.Id)) : clients
    
    const headers = ['Id', 'Name', 'Company', 'Email', 'Phone', 'Industry', 'Status', 'Total Revenue', 'Created At']
    const csvContent = [
      headers.join(','),
      ...clientsToExport.map(client => [
        client.Id,
        `"${client.name}"`,
        `"${client.company || ''}"`,
        client.email,
        client.phone || '',
        client.industry || '',
        client.status,
        client.totalRevenue || 0,
        client.createdAt
      ].join(','))
    ].join('\n')
    
    return csvContent
  }
}

export default clientService