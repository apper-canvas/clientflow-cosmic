import expensesData from "@/services/mockData/expenses.json"

let expenses = [...expensesData]

const expenseService = {
  async getAll() {
    await new Promise(resolve => setTimeout(resolve, 300))
    return [...expenses]
  },

  async getById(id) {
    await new Promise(resolve => setTimeout(resolve, 200))
    const expense = expenses.find(e => e.Id === parseInt(id))
    if (!expense) {
      throw new Error("Expense not found")
    }
    return { ...expense }
  },

  async create(expenseData) {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const newId = Math.max(...expenses.map(e => e.Id), 0) + 1
    const newExpense = {
      Id: newId,
      ...expenseData,
      createdAt: new Date().toISOString()
    }
    
    expenses.unshift(newExpense)
    return { ...newExpense }
  },

  async update(id, expenseData) {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const index = expenses.findIndex(e => e.Id === parseInt(id))
    if (index === -1) {
      throw new Error("Expense not found")
    }
    
    const updatedExpense = {
      ...expenses[index],
      ...expenseData,
      Id: parseInt(id)
    }
    
    expenses[index] = updatedExpense
    return { ...updatedExpense }
  },

  async delete(id) {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const index = expenses.findIndex(e => e.Id === parseInt(id))
    if (index === -1) {
      throw new Error("Expense not found")
    }
    
    expenses.splice(index, 1)
    return true
  },

  async getByCategory(category) {
    await new Promise(resolve => setTimeout(resolve, 200))
    return expenses.filter(e => e.category === category).map(e => ({ ...e }))
  },

  async getByStatus(status) {
    await new Promise(resolve => setTimeout(resolve, 200))
    return expenses.filter(e => e.status === status).map(e => ({ ...e }))
  },

  async getByDateRange(startDate, endDate) {
    await new Promise(resolve => setTimeout(resolve, 200))
    return expenses.filter(e => {
      const expenseDate = new Date(e.date)
      return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate)
    }).map(e => ({ ...e }))
  }
}

export default expenseService