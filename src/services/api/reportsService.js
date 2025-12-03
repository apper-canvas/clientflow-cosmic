import clientsData from "@/services/mockData/clients.json";
import projectsData from "@/services/mockData/projects.json";
import invoicesData from "@/services/mockData/invoices.json";
import expensesData from "@/services/mockData/expenses.json";
import activitiesData from "@/services/mockData/activities.json";
import { differenceInDays, endOfMonth, format, isWithinInterval, parseISO, startOfMonth, subMonths } from "date-fns";
import React from "react";

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
// Profit & Loss Report
  async getProfitLossReport(dateRange) {
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
    
    // Import projects data for breakdown
    const { default: projectsData } = await import('@/services/mockData/projects.json')
    
    // Revenue vs Expenses chart data (monthly)
    const revenueVsExpensesChart = this.generateRevenueVsExpensesChart(periodInvoices, periodExpenses, startDate, endDate)
    
    // Breakdown by project
    const projectBreakdown = this.getProjectProfitBreakdown(periodInvoices, periodExpenses, projectsData)
    
    // Breakdown by category
    const categoryBreakdown = this.getCategoryProfitBreakdown(periodExpenses)
    
    return {
      totalRevenue,
      totalExpenses,
      grossProfit,
      profitMargin,
      netProfitMargin: profitMargin, // Same as gross for now
      revenueVsExpensesChart,
      projectBreakdown,
      categoryBreakdown,
      invoiceBreakdown: {
        paid: periodInvoices.filter(inv => inv.status === 'paid').length,
        pending: periodInvoices.filter(inv => ['sent', 'viewed'].includes(inv.status)).length,
        overdue: periodInvoices.filter(inv => inv.status === 'overdue').length
      },
      expenseBreakdown: this.getExpensesByCategory(periodExpenses)
    }
  },

  // Generate Revenue vs Expenses Chart Data
  generateRevenueVsExpensesChart(invoices, expenses, startDate, endDate) {
    const months = []
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    
    while (current <= end) {
      months.push(new Date(current))
      current.setMonth(current.getMonth() + 1)
    }
    
    const chartData = months.map(month => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      
      const monthlyRevenue = invoices
        .filter(inv => inv.status === 'paid' && new Date(inv.issueDate) >= monthStart && new Date(inv.issueDate) <= monthEnd)
        .reduce((sum, inv) => sum + inv.amount, 0)
      
      const monthlyExpenses = expenses
        .filter(exp => new Date(exp.date) >= monthStart && new Date(exp.date) <= monthEnd)
        .reduce((sum, exp) => sum + exp.amount, 0)
      
      return {
        period: format(month, 'MMM yyyy'),
        revenue: monthlyRevenue,
        expenses: monthlyExpenses,
        profit: monthlyRevenue - monthlyExpenses
      }
    })
    
    return chartData
  },

  // Project Profit Breakdown
  getProjectProfitBreakdown(invoices, expenses, projectsData) {
    const paidInvoices = invoices.filter(inv => inv.status === 'paid')
    
    const projectRevenue = {}
    const projectExpenses = {}
    
    // Calculate revenue by project
    paidInvoices.forEach(invoice => {
      if (invoice.projectId) {
        projectRevenue[invoice.projectId] = (projectRevenue[invoice.projectId] || 0) + invoice.amount
      }
    })
    
    // Calculate expenses by project
    expenses.forEach(expense => {
      if (expense.projectId) {
        projectExpenses[expense.projectId] = (projectExpenses[expense.projectId] || 0) + expense.amount
      }
    })
    
    // Combine all project IDs
    const allProjectIds = new Set([...Object.keys(projectRevenue), ...Object.keys(projectExpenses)])
    
    return Array.from(allProjectIds)
      .map(projectId => {
        const id = parseInt(projectId)
        const project = projectsData.find(p => p.Id === id)
        const revenue = projectRevenue[projectId] || 0
        const expenses = projectExpenses[projectId] || 0
        const profit = revenue - expenses
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0
        
        return {
          projectId: id,
          projectName: project ? project.name : 'Unknown Project',
          revenue,
          expenses,
          profit,
          margin
        }
      })
      .sort((a, b) => b.profit - a.profit)
  },

  // Category Profit Breakdown
  getCategoryProfitBreakdown(expenses) {
    const categoryExpenses = {}
    
    expenses.forEach(expense => {
      const category = expense.category || 'Uncategorized'
      categoryExpenses[category] = (categoryExpenses[category] || 0) + expense.amount
    })
    
    return Object.entries(categoryExpenses)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: expenses.length > 0 ? (amount / expenses.reduce((sum, exp) => sum + exp.amount, 0)) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
  },

  // Revenue Analysis
// Monthly Comparison for P&L
  async getMonthlyComparison(dateRange) {
    await delay(700)
    
    const { startDate, endDate } = dateRange
    const periodInvoices = filterByDateRange(invoicesData, startDate, endDate, 'issueDate')
    const periodExpenses = filterByDateRange(expensesData, startDate, endDate, 'date')
    
    const months = []
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    
    while (current <= end) {
      months.push(new Date(current))
      current.setMonth(current.getMonth() + 1)
    }
    
    const monthlyData = months.map(month => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      
      const monthInvoices = periodInvoices.filter(inv => 
        new Date(inv.issueDate) >= monthStart && new Date(inv.issueDate) <= monthEnd
      )
      const monthExpenses = periodExpenses.filter(exp => 
        new Date(exp.date) >= monthStart && new Date(exp.date) <= monthEnd
      )
      
      const revenue = monthInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0)
      const expenses = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      const profit = revenue - expenses
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0
      
      return {
        period: format(month, 'MMM yyyy'),
        month: format(month, 'MMM'),
        year: month.getFullYear(),
        revenue,
        expenses,
        profit,
        margin,
        invoiceCount: monthInvoices.filter(inv => inv.status === 'paid').length,
        expenseCount: monthExpenses.length
      }
    })
    
    // Calculate trends
    const currentMonth = monthlyData[monthlyData.length - 1] || {}
    const previousMonth = monthlyData[monthlyData.length - 2] || {}
    
    const revenueTrend = previousMonth.revenue ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100 : 0
    const expenseTrend = previousMonth.expenses ? ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100 : 0
    const profitTrend = previousMonth.profit ? ((currentMonth.profit - previousMonth.profit) / Math.abs(previousMonth.profit)) * 100 : 0
    
    return {
      monthlyData,
      trends: {
        revenue: revenueTrend,
        expenses: expenseTrend,
        profit: profitTrend
      },
      totals: {
        revenue: monthlyData.reduce((sum, month) => sum + month.revenue, 0),
        expenses: monthlyData.reduce((sum, month) => sum + month.expenses, 0),
        profit: monthlyData.reduce((sum, month) => sum + month.profit, 0)
      }
    }
  },

  // Year-to-Date Summary
  async getYearToDateSummary() {
    await delay(500)
    
    const currentYear = new Date().getFullYear()
    const ytdStart = new Date(currentYear, 0, 1)
    const ytdEnd = new Date()
    
    const ytdInvoices = filterByDateRange(invoicesData, ytdStart, ytdEnd, 'issueDate')
    const ytdExpenses = filterByDateRange(expensesData, ytdStart, ytdEnd, 'date')
    
    const ytdRevenue = ytdInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0)
    const ytdExpenseTotal = ytdExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    const ytdProfit = ytdRevenue - ytdExpenseTotal
    const ytdMargin = ytdRevenue > 0 ? (ytdProfit / ytdRevenue) * 100 : 0
    
    // Previous year comparison
    const prevYearStart = new Date(currentYear - 1, 0, 1)
    const prevYearEnd = new Date(currentYear - 1, ytdEnd.getMonth(), ytdEnd.getDate())
    
    const prevYearInvoices = filterByDateRange(invoicesData, prevYearStart, prevYearEnd, 'issueDate')
    const prevYearExpenses = filterByDateRange(expensesData, prevYearStart, prevYearEnd, 'date')
    
    const prevYearRevenue = prevYearInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0)
    const prevYearExpenseTotal = prevYearExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    const prevYearProfit = prevYearRevenue - prevYearExpenseTotal
    
    const revenueGrowth = prevYearRevenue > 0 ? ((ytdRevenue - prevYearRevenue) / prevYearRevenue) * 100 : 0
    const expenseGrowth = prevYearExpenseTotal > 0 ? ((ytdExpenseTotal - prevYearExpenseTotal) / prevYearExpenseTotal) * 100 : 0
    const profitGrowth = prevYearProfit !== 0 ? ((ytdProfit - prevYearProfit) / Math.abs(prevYearProfit)) * 100 : 0
    
    return {
      currentYear: {
        revenue: ytdRevenue,
        expenses: ytdExpenseTotal,
        profit: ytdProfit,
        margin: ytdMargin
      },
      previousYear: {
        revenue: prevYearRevenue,
        expenses: prevYearExpenseTotal,
        profit: prevYearProfit,
        margin: prevYearRevenue > 0 ? (prevYearProfit / prevYearRevenue) * 100 : 0
      },
      growth: {
        revenue: revenueGrowth,
        expenses: expenseGrowth,
        profit: profitGrowth
      },
      averageMonthly: {
        revenue: ytdRevenue / (ytdEnd.getMonth() + 1),
        expenses: ytdExpenseTotal / (ytdEnd.getMonth() + 1),
        profit: ytdProfit / (ytdEnd.getMonth() + 1)
      }
    }
  },

  // Revenue Analysis (kept for compatibility)
  async getRevenueAnalysis(dateRange, period = 'monthly') {
    await delay(800)
    
    const { startDate, endDate } = dateRange
    const periodInvoices = filterByDateRange(invoicesData, startDate, endDate, 'issueDate')
    
    const paidInvoices = periodInvoices.filter(inv => inv.status === 'paid')
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0)
    const totalInvoiced = periodInvoices.reduce((sum, inv) => sum + inv.amount, 0)
    const outstanding = totalInvoiced - totalRevenue
    
    // Group by period
    const revenueByPeriod = this.groupRevenueByPeriod(paidInvoices, period, startDate, endDate)
    
    return {
      totalRevenue,
      totalInvoiced,
      outstanding,
      averageInvoiceValue: paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0,
      collectionRate: totalInvoiced > 0 ? (totalRevenue / totalInvoiced) * 100 : 0,
      revenueBreakdown: {
        paid: totalRevenue,
        invoiced: totalInvoiced,
        outstanding: outstanding
      },
      trendData: revenueByPeriod,
      invoiceCount: {
        total: periodInvoices.length,
        paid: paidInvoices.length,
        pending: periodInvoices.filter(inv => ['sent', 'viewed'].includes(inv.status)).length,
        overdue: periodInvoices.filter(inv => inv.status === 'overdue').length
      }
    }
  },

  // Revenue by Client
  async getRevenueByClient(dateRange) {
    await delay(700)
    
    const { startDate, endDate } = dateRange
    const periodInvoices = filterByDateRange(invoicesData, startDate, endDate, 'issueDate')
    const paidInvoices = periodInvoices.filter(inv => inv.status === 'paid')
    
    // Import clients data
    const { default: clientsData } = await import('@/services/mockData/clients.json')
    
    const revenueByClient = {}
    paidInvoices.forEach(invoice => {
      const clientId = invoice.clientId
      revenueByClient[clientId] = (revenueByClient[clientId] || 0) + invoice.amount
    })
    
    return Object.entries(revenueByClient)
      .map(([clientId, revenue]) => {
        const client = clientsData.find(c => c.Id === parseInt(clientId))
        return {
          clientId: parseInt(clientId),
          clientName: client ? client.company : 'Unknown Client',
          revenue,
          invoiceCount: paidInvoices.filter(inv => inv.clientId === parseInt(clientId)).length
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
  },

  // Revenue by Project
  async getRevenueByProject(dateRange) {
    await delay(700)
    
    const { startDate, endDate } = dateRange
    const periodInvoices = filterByDateRange(invoicesData, startDate, endDate, 'issueDate')
    const paidInvoices = periodInvoices.filter(inv => inv.status === 'paid')
    
    // Import projects data
    const { default: projectsData } = await import('@/services/mockData/projects.json')
    
    const revenueByProject = {}
    paidInvoices.forEach(invoice => {
      if (invoice.projectId) {
        revenueByProject[invoice.projectId] = (revenueByProject[invoice.projectId] || 0) + invoice.amount
      }
    })
    
    return Object.entries(revenueByProject)
      .map(([projectId, revenue]) => {
        const project = projectsData.find(p => p.Id === parseInt(projectId))
        return {
          projectId: parseInt(projectId),
          projectName: project ? project.name : 'Unknown Project',
          revenue,
          invoiceCount: paidInvoices.filter(inv => inv.projectId === parseInt(projectId)).length
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
  },

  // Revenue Forecast
  async getRevenueForecast(months = 6) {
    await delay(900)
    
    const now = new Date()
    const pastMonths = 12
    const pastStartDate = subMonths(startOfMonth(now), pastMonths)
    
    const historicalInvoices = filterByDateRange(invoicesData, pastStartDate, now, 'issueDate')
    const paidInvoices = historicalInvoices.filter(inv => inv.status === 'paid')
    
    // Calculate monthly average
    const monthlyRevenues = this.groupRevenueByPeriod(paidInvoices, 'monthly', pastStartDate, now)
    const averageMonthlyRevenue = monthlyRevenues.reduce((sum, month) => sum + month.value, 0) / monthlyRevenues.length
    
    // Simple growth trend calculation
    const recentMonths = monthlyRevenues.slice(-6)
    const olderMonths = monthlyRevenues.slice(-12, -6)
    const recentAvg = recentMonths.reduce((sum, month) => sum + month.value, 0) / recentMonths.length
    const olderAvg = olderMonths.reduce((sum, month) => sum + month.value, 0) / olderMonths.length
    const growthRate = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) : 0
    
    // Generate forecast
    const forecast = []
    for (let i = 1; i <= months; i++) {
      const forecastMonth = format(new Date(now.getFullYear(), now.getMonth() + i, 1), 'MMM yyyy')
      const forecastValue = averageMonthlyRevenue * (1 + (growthRate * i * 0.1))
      forecast.push({
        period: forecastMonth,
        value: Math.max(0, forecastValue)
      })
    }
    
    return {
      forecast,
      averageMonthlyRevenue,
      growthRate: growthRate * 100,
      confidenceLevel: Math.max(50, 90 - (Math.abs(growthRate) * 100))
    }
}
  },

  // Helper method for grouping revenue by period
  groupRevenueByPeriod(invoices, period, startDate, endDate) {
    const periods = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // Generate period labels and calculate revenue for each
    if (period === 'daily') {
      let current = start
      while (current <= end) {
        const dayInvoices = invoices.filter(inv => {
          const invDate = parseISO(inv.issueDate)
          return invDate.toDateString() === current.toDateString()
        })
        periods.push({
          period: format(current, 'MMM dd'),
          value: dayInvoices.reduce((sum, inv) => sum + inv.amount, 0)
        })
        current = new Date(current.getTime() + 24 * 60 * 60 * 1000)
      }
    } else if (period === 'weekly') {
      // Weekly grouping logic
      let current = start
      let weekNum = 1
      while (current <= end) {
        const weekEnd = new Date(Math.min(current.getTime() + 6 * 24 * 60 * 60 * 1000, end.getTime()))
        const weekInvoices = invoices.filter(inv => {
          const invDate = parseISO(inv.issueDate)
          return invDate >= current && invDate <= weekEnd
        })
        periods.push({
          period: `Week ${weekNum}`,
          value: weekInvoices.reduce((sum, inv) => sum + inv.amount, 0)
        })
        current = new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000)
        weekNum++
      }
    } else if (period === 'monthly') {
      let current = startOfMonth(start)
      while (current <= end) {
        const monthEnd = endOfMonth(current)
        const monthInvoices = invoices.filter(inv => {
          const invDate = parseISO(inv.issueDate)
          return invDate >= current && invDate <= monthEnd
        })
        periods.push({
          period: format(current, 'MMM yyyy'),
          value: monthInvoices.reduce((sum, inv) => sum + inv.amount, 0)
        })
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
      }
    } else if (period === 'yearly') {
      const startYear = start.getFullYear()
      const endYear = end.getFullYear()
      for (let year = startYear; year <= endYear; year++) {
        const yearInvoices = invoices.filter(inv => {
          const invDate = parseISO(inv.issueDate)
          return invDate.getFullYear() === year
        })
        periods.push({
          period: year.toString(),
          value: yearInvoices.reduce((sum, inv) => sum + inv.amount, 0)
        })
      }
    }
    
    return periods
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