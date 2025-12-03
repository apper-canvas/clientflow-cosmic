import clientsData from '@/services/mockData/clients.json'
import projectsData from '@/services/mockData/projects.json'
import invoicesData from '@/services/mockData/invoices.json'
import expensesData from '@/services/mockData/expenses.json'
import activitiesData from '@/services/mockData/activities.json'
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, differenceInDays } from 'date-fns'

// Utility functions
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

function getDateRange(months = 6) {
  const endDate = new Date()
  const startDate = subMonths(startOfMonth(endDate), months - 1)
  return { startDate, endDate }
}

function filterByDateRange(items, startDate, endDate, dateField = 'createdAt') {
  return items.filter(item => {
    const itemDate = new Date(item[dateField])
    return isWithinInterval(itemDate, { start: startDate, end: endDate })
  })
}

// Main service object
const reportsService = {
  // Overview Dashboard Data
  async getOverviewDashboard(dateRange = null) {
    await delay(800)
    
    const range = dateRange || getDateRange(6)
    const currentMonth = new Date()
    const previousMonth = subMonths(currentMonth, 1)
    
    // Current month data
    const currentMonthInvoices = filterByDateRange(
      invoicesData, 
      startOfMonth(currentMonth), 
      endOfMonth(currentMonth),
      'issueDate'
    )
    
    // Previous month data for comparison
    const previousMonthInvoices = filterByDateRange(
      invoicesData,
      startOfMonth(previousMonth), 
      endOfMonth(previousMonth),
      'issueDate'
    )
    
    // Calculate metrics
    const currentRevenue = currentMonthInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0)
    
    const previousRevenue = previousMonthInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0)
    
    const outstandingInvoices = invoicesData
      .filter(inv => ['sent', 'viewed', 'overdue'].includes(inv.status))
      .reduce((sum, inv) => sum + inv.amount, 0)
    
    const activeProjects = projectsData.filter(p => 
      ['in-progress', 'planning'].includes(p.status)
    ).length
    
    const hoursThisMonth = projectsData.reduce((sum, p) => sum + (p.totalHours || 0), 0)
    
    return {
      totalRevenue: {
        current: currentRevenue,
        previous: previousRevenue,
        trend: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100) : 0
      },
      outstandingInvoices: outstandingInvoices,
      activeProjects: activeProjects,
      hoursLogged: hoursThisMonth,
      revenueChart: await this.getRevenueChart(range),
      topClients: await this.getTopClientsByRevenue(),
      projectStatusDistribution: await this.getProjectStatusDistribution(),
      teamProductivity: await this.getTeamProductivity(),
      recentActivities: activitiesData.slice(0, 10),
      upcomingDeadlines: await this.getUpcomingDeadlines(30)
    }
  },

  // Revenue trend chart data
  async getRevenueChart(dateRange = null) {
    await delay(500)
    
    const range = dateRange || getDateRange(6)
    const months = []
    const revenue = []
    
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i)
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      
      const monthInvoices = filterByDateRange(
        invoicesData,
        monthStart,
        monthEnd,
        'issueDate'
      ).filter(inv => inv.status === 'paid')
      
      const monthRevenue = monthInvoices.reduce((sum, inv) => sum + inv.amount, 0)
      
      months.push(format(month, 'MMM yyyy'))
      revenue.push(monthRevenue)
    }
    
    return { months, revenue }
  },

  // Top clients by revenue
  async getTopClientsByRevenue(limit = 5) {
    await delay(400)
    
    const clientRevenue = clientsData.map(client => {
      const clientInvoices = invoicesData.filter(inv => 
        inv.clientId === client.Id && inv.status === 'paid'
      )
      const totalRevenue = clientInvoices.reduce((sum, inv) => sum + inv.amount, 0)
      
      return {
        id: client.Id,
        name: client.name,
        company: client.company,
        revenue: totalRevenue
      }
    })
    
    return clientRevenue
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
  },

  // Project status distribution
  async getProjectStatusDistribution() {
    await delay(300)
    
    const statusCounts = {}
    projectsData.forEach(project => {
      const status = project.status || 'unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count
    }))
  },

  // Team productivity data
  async getTeamProductivity() {
    await delay(400)
    
    // Mock team member data based on activities and projects
    const teamMembers = [
      { name: 'John Smith', hours: 42, efficiency: 95 },
      { name: 'Sarah Johnson', hours: 38, efficiency: 88 },
      { name: 'Mike Chen', hours: 35, efficiency: 92 },
      { name: 'Emma Davis', hours: 40, efficiency: 90 },
      { name: 'Alex Rodriguez', hours: 36, efficiency: 87 }
    ]
    
    return teamMembers.sort((a, b) => b.hours - a.hours)
  },

  // Upcoming deadlines
  async getUpcomingDeadlines(days = 30) {
    await delay(300)
    
    const now = new Date()
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000))
    
    const upcomingProjects = projectsData
      .filter(project => {
        if (!project.deadline) return false
        const deadline = new Date(project.deadline)
        return deadline >= now && deadline <= futureDate
      })
      .map(project => ({
        id: project.Id,
        name: project.name,
        type: 'project',
        deadline: project.deadline,
        client: clientsData.find(c => c.Id === project.clientId)?.name || 'Unknown',
        daysUntil: differenceInDays(new Date(project.deadline), now)
      }))
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    
    return upcomingProjects.slice(0, 10)
  },

  // Financial reports data
  async getFinancialSummary(dateRange) {
    await delay(600)
    
    const { startDate, endDate } = dateRange
    
    const periodInvoices = filterByDateRange(invoicesData, startDate, endDate, 'issueDate')
    const periodExpenses = filterByDateRange(expensesData, startDate, endDate, 'date')
    
    const totalRevenue = periodInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0)
    
    const totalExpenses = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    
    const grossProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
    
    return {
      totalRevenue,
      totalExpenses,
      grossProfit,
      profitMargin,
      invoiceBreakdown: {
        paid: periodInvoices.filter(inv => inv.status === 'paid').length,
        pending: periodInvoices.filter(inv => ['sent', 'viewed'].includes(inv.status)).length,
        overdue: periodInvoices.filter(inv => inv.status === 'overdue').length
      },
      expenseBreakdown: this.getExpensesByCategory(periodExpenses)
    }
  },

  // Expense breakdown by category
  getExpensesByCategory(expenses) {
    const categories = {}
    expenses.forEach(expense => {
      const category = expense.category || 'other'
      categories[category] = (categories[category] || 0) + expense.amount
    })
    
    return Object.entries(categories).map(([category, amount]) => ({
      category: category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      amount
    }))
  },

  // Export data functionality
  async exportReportData(reportType, format = 'csv', dateRange = null) {
    await delay(1000)
    
    // This would typically generate and download files
    // For now, we'll return a success message
    return {
      success: true,
      message: `${reportType} report exported as ${format.toUpperCase()}`,
      filename: `${reportType}-${format(new Date(), 'yyyy-MM-dd')}.${format}`
    }
  }
}

export default reportsService