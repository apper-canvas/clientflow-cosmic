import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import Button from '@/components/atoms/Button'
import Input from '@/components/atoms/Input'
import Select from '@/components/atoms/Select'
import SearchBar from '@/components/molecules/SearchBar'
import StatusBadge from '@/components/molecules/StatusBadge'
import ClientForm from '@/components/organisms/ClientForm'
import Loading from '@/components/ui/Loading'
import ErrorView from '@/components/ui/ErrorView'
import Empty from '@/components/ui/Empty'
import ApperIcon from '@/components/ApperIcon'
import clientService from '@/services/api/clientService'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Prospect', label: 'Prospect' },
  { value: 'Archived', label: 'Archived' }
]

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'Individual', label: 'Individual' },
  { value: 'Company', label: 'Company' },
  { value: 'Agency', label: 'Agency' }
]

function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
const [typeFilter, setTypeFilter] = useState('')
  const [billingFilter, setBillingFilter] = useState('all')
  const [sortField, setSortField] = useState('company')
  const [sortOrder, setSortOrder] = useState('asc')
  const [showForm, setShowForm] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedClients, setSelectedClients] = useState([])
  const [bulkLoading, setBulkLoading] = useState(false)
  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    filterAndSortClients()
  }, [clients, searchQuery, statusFilter, typeFilter, sortField, sortOrder])

  async function loadClients() {
    try {
      setLoading(true)
      setError(null)
      const data = await clientService.getAll()
      setClients(data)
    } catch (err) {
      setError(err.message || 'Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  function filterAndSortClients() {
    let filtered = [...clients]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(client =>
        client.company?.toLowerCase().includes(query) ||
        client.name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.industry?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(client => client.status === statusFilter)
    }

    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter(client => client.clientType === typeFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField] || ''
      let bValue = b[sortField] || ''

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredClients(filtered)
  }

  function handleAddClient() {
    setSelectedClient(null)
    setShowForm(true)
  }

  function handleEditClient(client) {
    setSelectedClient(client)
    setShowForm(true)
  }

  async function handleDeleteClient(client) {
    if (!confirm(`Are you sure you want to delete ${client.company}? This action cannot be undone.`)) {
      return
    }

    try {
      await clientService.delete(client.Id)
      toast.success('Client deleted successfully')
      await loadClients()
    } catch (error) {
      toast.error(error.message || 'Failed to delete client')
    }
  }

  async function handleSaveClient(savedClient) {
    await loadClients()
  }

function handleCloseForm() {
    setShowForm(false)
    setSelectedClient(null)
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  function getSortIcon(field) {
    if (sortField !== field) {
      return 'ArrowUpDown'
    }
    return sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown'
  }

  function handleClientClick(client) {
    navigate(`/clients/${client.Id}`)
  }

  function handleSelectClient(clientId) {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    )
  }

  function handleSelectAll() {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([])
    } else {
      setSelectedClients(filteredClients.map(client => client.Id))
    }
  }

  async function handleBulkExport() {
    try {
      setBulkLoading(true)
      const csvData = await clientService.exportToCsv(selectedClients.length > 0 ? selectedClients : null)
      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clients_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success(`Exported ${selectedClients.length || clients.length} clients`)
    } catch (error) {
      toast.error('Failed to export clients')
      console.error('Export error:', error)
    } finally {
      setBulkLoading(false)
    }
  }

  async function handleBulkTag() {
    const availableTags = ['Priority', 'VIP', 'New Business', 'Renewal', 'At Risk']
    const tag = window.prompt(`Select tag to apply:\n${availableTags.join(', ')}`)
    
    if (tag && availableTags.includes(tag)) {
      try {
        setBulkLoading(true)
        await clientService.updateMultiple(selectedClients, { tags: [tag] })
        await loadClients()
        setSelectedClients([])
        toast.success(`Tagged ${selectedClients.length} clients with "${tag}"`)
      } catch (error) {
        toast.error('Failed to tag clients')
        console.error('Tag error:', error)
      } finally {
        setBulkLoading(false)
      }
    }
  }

  async function handleBulkArchive() {
    if (!confirm(`Are you sure you want to archive ${selectedClients.length} clients?`)) {
      return
    }

    try {
      setBulkLoading(true)
      await clientService.updateMultiple(selectedClients, { status: 'archived' })
      await loadClients()
      setSelectedClients([])
      toast.success(`Archived ${selectedClients.length} clients`)
    } catch (error) {
      toast.error('Failed to archive clients')
      console.error('Archive error:', error)
    } finally {
      setBulkLoading(false)
    }
  }

  if (loading) {
    return <Loading />
  }

  if (error) {
    return <ErrorView message={error} onRetry={loadClients} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Clients
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your client relationships and information
          </p>
        </div>
        <Button onClick={handleAddClient}>
          <ApperIcon name="Plus" className="w-4 h-4" />
          Add Client
        </Button>
</div>

      {/* Bulk Actions Toolbar */}
      {selectedClients.length > 0 && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                {selectedClients.length} client{selectedClients.length > 1 ? 's' : ''} selected
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedClients([])}
              >
                Clear Selection
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkExport}
                disabled={bulkLoading}
              >
                <ApperIcon name="Download" className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkTag}
                disabled={bulkLoading}
              >
                <ApperIcon name="Tag" className="w-4 h-4 mr-1" />
                Tag
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkArchive}
                disabled={bulkLoading}
              >
                <ApperIcon name="Archive" className="w-4 h-4 mr-1" />
                Archive
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <SearchBar
              placeholder="Search clients..."
              onSearch={setSearchQuery}
              value={searchQuery}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
            placeholder="Filter by status"
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={TYPE_OPTIONS}
            placeholder="Filter by type"
          />
        </div>
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {filteredClients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
<thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-primary-600 bg-slate-100 border-slate-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                    />
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('company')}
                      className="flex items-center gap-2 font-medium text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      Company
                      <ApperIcon name={getSortIcon('company')} className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-2 font-medium text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      Contact
                      <ApperIcon name={getSortIcon('name')} className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('email')}
                      className="flex items-center gap-2 font-medium text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      Email
                      <ApperIcon name={getSortIcon('email')} className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-2 font-medium text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      Status
                      <ApperIcon name={getSortIcon('status')} className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('clientType')}
                      className="flex items-center gap-2 font-medium text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      Type
                      <ApperIcon name={getSortIcon('clientType')} className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center gap-2 font-medium text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      Created
                      <ApperIcon name={getSortIcon('createdAt')} className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="text-right p-4 font-medium text-slate-900 dark:text-white">
                    Actions
</th>
                  <th className="p-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Billing Address
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Payment Terms
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tax ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {filteredClients.map((client) => (
                  <tr
                    key={client.Id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                    onClick={() => handleClientClick(client)}
>
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client.Id)}
                        onChange={() => handleSelectClient(client.Id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-primary-600 bg-slate-100 border-slate-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {client.company || 'Unnamed Company'}
                      </div>
                      {client.industry && (
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {client.industry}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-slate-900 dark:text-white">
                        {client.name || '—'}
                      </div>
                      {client.phone && (
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {client.phone}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-slate-900 dark:text-white">
                        {client.email}
                      </div>
                      {client.website && (
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          <a
                            href={client.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary-600 dark:hover:text-primary-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {client.website}
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={client.status} type="client" />
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                        {client.clientType}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {client.createdAt ? format(new Date(client.createdAt), 'MMM dd, yyyy') : '—'}
                    </td>
                    <td className="p-4">
</td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {client.billingAddress ? (
                        <div className="max-w-32 truncate" title={client.billingAddress}>
                          {client.billingAddress}
                        </div>
                      ) : (
                        <span className="text-slate-400">Not set</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {client.paymentTerms || 'Net 30'}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {client.taxId || client.vatNumber ? (
                        <span>{client.taxId || client.vatNumber}</span>
                      ) : (
                        <span className="text-slate-400">Not set</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditClient(client)}
className="text-slate-600 hover:text-primary-600"
                        >
                          <ApperIcon name="Eye" className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClient(client)}
                          className="text-slate-600 hover:text-primary-600"
                        >
                          <ApperIcon name="Edit2" className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClient(client)}
                          className="text-slate-600 hover:text-error-600"
                        >
                          <ApperIcon name="Trash2" className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No clients found"
            description={searchQuery || statusFilter || typeFilter 
              ? "No clients match your current filters. Try adjusting your search criteria."
              : "You haven't created any clients yet. Create your first client to get started."
            }
            action={
              <Button onClick={handleAddClient}>
                <ApperIcon name="Plus" className="w-4 h-4" />
                Add Your First Client
              </Button>
            }
          />
        )}
      </div>

      <ClientForm
        client={selectedClient}
        isOpen={showForm}
        onClose={handleCloseForm}
        onSave={handleSaveClient}
      />
    </div>
  )
}

export default Clients