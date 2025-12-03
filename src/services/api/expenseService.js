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
  },

// Expense Reports Methods
  async getExpenseReports(startDate, endDate) {
    await new Promise(resolve => setTimeout(resolve, 300))
    const filteredExpenses = startDate && endDate 
      ? await this.getByDateRange(startDate, endDate)
      : expenses.map(e => ({ ...e }))

    return {
      totalExpenses: filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
      expenseCount: filteredExpenses.length,
      byCategory: this.groupExpensesByCategory(filteredExpenses),
      byProject: this.groupExpensesByProject(filteredExpenses),
      byPeriod: this.groupExpensesByPeriod(filteredExpenses),
      billableVsNonBillable: this.getBillableBreakdown(filteredExpenses),
      approvalStatus: this.getApprovalBreakdown(filteredExpenses)
    }
  },

  async getExpensesByProject(projectId) {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    if (!projectId) {
      return []
    }
    
    const projectExpenses = expenses.filter(expense => 
      expense.projectId === parseInt(projectId)
    ).map(expense => ({ ...expense }))
    
    return projectExpenses
  },

  async getProjectExpenseReport(projectId) {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const projectExpenses = await this.getExpensesByProject(projectId)
    
    if (projectExpenses.length === 0) {
      return {
        projectId: parseInt(projectId),
        totalAmount: 0,
        expenseCount: 0,
        byCategory: {},
        byTeamMember: {},
        billableBreakdown: { billable: 0, nonBillable: 0 },
        statusBreakdown: { pending: 0, approved: 0, reimbursed: 0, rejected: 0 },
        expenses: []
      }
    }

    // Calculate totals
    const totalAmount = projectExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    // Group by category
    const byCategory = projectExpenses.reduce((groups, expense) => {
      const category = expense.category
      if (!groups[category]) {
        groups[category] = { count: 0, amount: 0 }
      }
      groups[category].count++
      groups[category].amount += expense.amount
      return groups
    }, {})
    
    // Group by team member (using clientId)
    const byTeamMember = projectExpenses.reduce((groups, expense) => {
      const clientId = expense.clientId || 'unassigned'
      if (!groups[clientId]) {
        groups[clientId] = { count: 0, amount: 0, expenses: [] }
      }
      groups[clientId].count++
      groups[clientId].amount += expense.amount
      groups[clientId].expenses.push(expense)
      return groups
    }, {})
    
    // Calculate billable breakdown
    const billableBreakdown = projectExpenses.reduce((breakdown, expense) => {
      // Assume expenses for projects are billable unless marked as "office" or "utilities" categories
      const isBillable = !['office', 'utilities'].includes(expense.category)
      
      if (isBillable) {
        breakdown.billable += expense.amount
      } else {
        breakdown.nonBillable += expense.amount
      }
      return breakdown
    }, { billable: 0, nonBillable: 0 })
    
    // Group by status
    const statusBreakdown = projectExpenses.reduce((breakdown, expense) => {
      const status = expense.status
      if (!breakdown[status]) {
        breakdown[status] = 0
      }
      breakdown[status] += expense.amount
      return breakdown
    }, { pending: 0, approved: 0, reimbursed: 0, rejected: 0 })

    return {
      projectId: parseInt(projectId),
      totalAmount,
      expenseCount: projectExpenses.length,
      byCategory,
      byTeamMember,
      billableBreakdown,
      statusBreakdown,
      expenses: projectExpenses
    }
  },

  async getExpensesByPeriod(startDate, endDate, periodType = 'month') {
    await new Promise(resolve => setTimeout(resolve, 200))
    const filteredExpenses = startDate && endDate 
      ? await this.getByDateRange(startDate, endDate)
      : expenses.map(e => ({ ...e }))

    return this.groupExpensesByPeriod(filteredExpenses, periodType)
  },

  groupExpensesByPeriod(expenseList, periodType = 'month') {
    const grouped = {}
    expenseList.forEach(expense => {
      const date = new Date(expense.date)
      let key
      
      if (periodType === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      } else if (periodType === 'week') {
        const startOfWeek = new Date(date)
        startOfWeek.setDate(date.getDate() - date.getDay())
        key = `${startOfWeek.getFullYear()}-W${Math.ceil((startOfWeek - new Date(startOfWeek.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000))}`
      } else {
        key = date.getFullYear().toString()
      }

      if (!grouped[key]) {
        grouped[key] = { period: key, amount: 0, count: 0 }
      }
      grouped[key].amount += expense.amount
      grouped[key].count += 1
    })

    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period))
  },

  groupExpensesByCategory(expenseList) {
    const grouped = {}
    expenseList.forEach(expense => {
      const category = expense.category
      if (!grouped[category]) {
        grouped[category] = { category, amount: 0, count: 0 }
      }
      grouped[category].amount += expense.amount
      grouped[category].count += 1
    })

    return Object.values(grouped).sort((a, b) => b.amount - a.amount)
  },

  groupExpensesByProject(expenseList) {
    const grouped = {}
    expenseList.forEach(expense => {
      const projectId = expense.projectId || 'unassigned'
      if (!grouped[projectId]) {
        grouped[projectId] = { projectId, amount: 0, count: 0 }
      }
      grouped[projectId].amount += expense.amount
      grouped[projectId].count += 1
    })

    return Object.values(grouped).sort((a, b) => b.amount - a.amount)
  },

  getBillableBreakdown(expenseList) {
    const billable = expenseList.filter(e => e.billable).reduce((sum, e) => sum + e.amount, 0)
    const nonBillable = expenseList.filter(e => !e.billable).reduce((sum, e) => sum + e.amount, 0)
    
    return [
      { type: 'Billable', amount: billable, count: expenseList.filter(e => e.billable).length },
      { type: 'Non-Billable', amount: nonBillable, count: expenseList.filter(e => !e.billable).length }
    ]
  },

  getApprovalBreakdown(expenseList) {
    const statusMap = {
      pending: { status: 'Pending', amount: 0, count: 0 },
      approved: { status: 'Approved', amount: 0, count: 0 },
      reimbursed: { status: 'Reimbursed', amount: 0, count: 0 },
      rejected: { status: 'Rejected', amount: 0, count: 0 }
    }

    expenseList.forEach(expense => {
      if (statusMap[expense.status]) {
        statusMap[expense.status].amount += expense.amount
        statusMap[expense.status].count += 1
      }
    })

    return Object.values(statusMap).filter(item => item.count > 0)
  }
}

export default expenseService