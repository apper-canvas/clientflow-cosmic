import clientsData from "@/services/mockData/clients.json"
import projectsData from "@/services/mockData/projects.json"
import invoicesData from "@/services/mockData/invoices.json"
import expensesData from "@/services/mockData/expenses.json"
import activitiesData from "@/services/mockData/activities.json"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"

const dashboardService = {
  async getMetrics() {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Calculate total revenue this month
    const currentMonth = new Date()
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    
    const monthlyRevenue = invoicesData
      .filter(invoice => {
        const paidDate = invoice.paidDate ? new Date(invoice.paidDate) : null
        return paidDate && paidDate >= monthStart && paidDate <= monthEnd && invoice.status === "paid"
      })
      .reduce((total, invoice) => total + invoice.amount, 0)
    
    // Outstanding invoices
    const outstandingInvoices = invoicesData
      .filter(invoice => invoice.status === "sent" || invoice.status === "overdue")
      .reduce((total, invoice) => total + invoice.amount, 0)
    
// Active projects count
    const activeProjects = projectsData.filter(project => 
      project.status === "In Progress" || project.status === "Planning"
    ).length
    
    // Hours logged this week (mock calculation)
    const hoursThisWeek = 42.5
    
    return [
      {
        title: "Revenue This Month",
        value: `$${monthlyRevenue.toLocaleString()}`,
        icon: "DollarSign",
        trend: "up",
        trendValue: "+12.5%"
      },
      {
        title: "Outstanding Invoices",
        value: `$${outstandingInvoices.toLocaleString()}`,
        icon: "FileText",
        trend: "down",
        trendValue: "-5.2%"
      },
{
        title: "Active Projects",
        value: activeProjects.toString(),
        icon: "Folder",
        trend: "up",
        trendValue: "+3"
      },
      {
        title: "Hours This Week",
        value: hoursThisWeek.toString(),
        icon: "Clock",
        trend: "up",
        trendValue: "+8.5h"
      }
    ]
  },

  async getRecentActivities() {
    await new Promise(resolve => setTimeout(resolve, 200))
    return activitiesData.slice(0, 8)
  },

  async getUpcomingDeadlines() {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const deadlines = []
    const currentDate = new Date()
    
    // Add project deadlines
    projectsData
      .filter(project => project.deadline && new Date(project.deadline) > currentDate)
      .forEach(project => {
        const client = clientsData.find(c => c.Id === project.clientId)
        deadlines.push({
          id: project.Id,
          type: "project",
          name: project.name,
          deadline: project.deadline,
          client: client ? client.name : null
        })
      })
    
    // Add invoice due dates
    invoicesData
      .filter(invoice => invoice.dueDate && new Date(invoice.dueDate) > currentDate && invoice.status !== "paid")
      .forEach(invoice => {
        const client = clientsData.find(c => c.Id === invoice.clientId)
        deadlines.push({
          id: invoice.Id,
          type: "invoice",
          name: `Invoice ${invoice.invoiceNumber}`,
          deadline: invoice.dueDate,
          client: client ? client.name : null
        })
      })
    
    return deadlines
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 6)
  },

  async getRevenueChart() {
    await new Promise(resolve => setTimeout(resolve, 250))
    
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)
      
      const monthlyRevenue = invoicesData
        .filter(invoice => {
          const paidDate = invoice.paidDate ? new Date(invoice.paidDate) : null
          return paidDate && paidDate >= monthStart && paidDate <= monthEnd && invoice.status === "paid"
        })
        .reduce((total, invoice) => total + invoice.amount, 0)
      
      months.push({
        month: format(date, "MMM yyyy"),
        amount: monthlyRevenue
      })
    }
    
    return months
  },

async getProjectStatusChart() {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const statusCounts = {}
    projectsData.forEach(project => {
      statusCounts[project.status] = (statusCounts[project.status] || 0) + 1
    })
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count
    }))
  },

  async getTopClientsChart() {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const clientRevenue = {}
    
    // Calculate revenue by client from paid invoices
    invoicesData
      .filter(invoice => invoice.status === "paid")
      .forEach(invoice => {
        clientRevenue[invoice.clientId] = (clientRevenue[invoice.clientId] || 0) + invoice.amount
      })
    
    // Get top 5 clients
    const topClients = Object.entries(clientRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([clientId, revenue]) => {
        const client = clientsData.find(c => c.Id === clientId)
        return {
          name: client ? client.name : "Unknown Client",
          revenue
        }
      })
    
    return topClients
  }
}

export default dashboardService