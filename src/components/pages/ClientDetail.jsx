import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import Button from '@/components/atoms/Button'
import StatusBadge from '@/components/molecules/StatusBadge'
import ClientForm from '@/components/organisms/ClientForm'
import Loading from '@/components/ui/Loading'
import ErrorView from '@/components/ui/ErrorView'
import ApperIcon from '@/components/ApperIcon'
import clientService from '@/services/api/clientService'

function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)

  useEffect(() => {
    loadClient()
  }, [id])

  async function loadClient() {
    try {
      setLoading(true)
      setError(null)
      const data = await clientService.getById(id)
      setClient(data)
    } catch (err) {
      setError(err.message || 'Failed to load client')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteClient() {
    if (!confirm(`Are you sure you want to delete ${client.company}? This action cannot be undone.`)) {
      return
    }

    try {
      await clientService.delete(client.Id)
      toast.success('Client deleted successfully')
      navigate('/clients')
    } catch (error) {
      toast.error(error.message || 'Failed to delete client')
    }
  }

  async function handleSaveClient(savedClient) {
    setClient(savedClient)
    setShowEditForm(false)
    toast.success('Client updated successfully')
  }

  function formatAddress(address) {
    if (!address) return '—'
    
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zip,
      address.country
    ].filter(Boolean)
    
    return parts.length > 0 ? parts.join(', ') : '—'
  }

  if (loading) {
    return <Loading />
  }

  if (error) {
    return <ErrorView message={error} onRetry={loadClient} />
  }

  if (!client) {
    return <ErrorView message="Client not found" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/clients')}
          >
            <ApperIcon name="ArrowLeft" className="w-4 h-4" />
            Back to Clients
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {client.company || 'Unnamed Company'}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={client.status} type="client" />
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                {client.clientType}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowEditForm(true)}
          >
            <ApperIcon name="Edit2" className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleDeleteClient}
            className="text-error-600 hover:text-error-700 hover:bg-error-50 border-error-200"
          >
            <ApperIcon name="Trash2" className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Client Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Company Name
                </label>
                <p className="text-slate-900 dark:text-white">
                  {client.company || '—'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Contact Person
                </label>
                <p className="text-slate-900 dark:text-white">
                  {client.name || '—'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <p className="text-slate-900 dark:text-white">
                  {client.email ? (
                    <a
                      href={`mailto:${client.email}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      {client.email}
                    </a>
                  ) : '—'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone
                </label>
                <p className="text-slate-900 dark:text-white">
                  {client.phone ? (
                    <a
                      href={`tel:${client.phone}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      {client.phone}
                    </a>
                  ) : '—'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Phone
                </label>
                <p className="text-slate-900 dark:text-white">
                  {client.mobilePhone ? (
                    <a
                      href={`tel:${client.mobilePhone}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      {client.mobilePhone}
                    </a>
                  ) : '—'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Website
                </label>
                <p className="text-slate-900 dark:text-white">
                  {client.website ? (
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      {client.website}
                    </a>
                  ) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Address Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Physical Address
                </label>
                <p className="text-slate-900 dark:text-white whitespace-pre-line">
                  {formatAddress(client.address)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Billing Address
                </label>
                <p className="text-slate-900 dark:text-white whitespace-pre-line">
                  {client.useSameAddress 
                    ? 'Same as physical address'
                    : formatAddress(client.billingAddress)
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Business Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Industry
                </label>
                <p className="text-slate-900 dark:text-white">
                  {client.industry || '—'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tax ID / VAT Number
                </label>
                <p className="text-slate-900 dark:text-white">
                  {client.taxId || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Quick Stats
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Total Revenue</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  ${client.totalRevenue?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Client Since</span>
                <span className="text-slate-900 dark:text-white">
                  {client.createdAt ? format(new Date(client.createdAt), 'MMM yyyy') : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Payment Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Payment Terms
                </label>
                <p className="text-slate-900 dark:text-white">
                  {client.paymentTerms || '—'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Payment Method
                </label>
                <p className="text-slate-900 dark:text-white">
                  {client.paymentMethod || '—'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Currency
                </label>
                <p className="text-slate-900 dark:text-white">
                  {client.currency || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Timeline
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Client created
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {client.createdAt ? format(new Date(client.createdAt), 'MMM dd, yyyy') : '—'}
                  </p>
                </div>
              </div>
              {client.updatedAt && client.updatedAt !== client.createdAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-accent-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Last updated
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {format(new Date(client.updatedAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ClientForm
        client={client}
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSave={handleSaveClient}
      />
    </div>
  )
}

export default ClientDetail