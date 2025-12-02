import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { format, formatDistanceToNow } from "date-fns";
import clientService from "@/services/api/clientService";
import documentService from "@/services/api/documentService";
import ApperIcon from "@/components/ApperIcon";
import Loading from "@/components/ui/Loading";
import ErrorView from "@/components/ui/ErrorView";
import Empty from "@/components/ui/Empty";
import Button from "@/components/atoms/Button";
import ClientForm from "@/components/organisms/ClientForm";
import Clients from "@/components/pages/Clients";
import Projects from "@/components/pages/Projects";
import StatusBadge from "@/components/molecules/StatusBadge";

function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'User' },
    { key: 'contacts', label: 'Contacts', icon: 'Users' },
    { key: 'projects', label: 'Projects', icon: 'Briefcase' },
    { key: 'invoices', label: 'Invoices', icon: 'FileText' },
    { key: 'documents', label: 'Documents', icon: 'Folder' },
    { key: 'activity', label: 'Activity', icon: 'Activity' },
    { key: 'notes', label: 'Notes', icon: 'MessageSquare' }
  ]
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

const getPrimaryContact = () => {
    return client.contacts?.find(contact => contact.isPrimary) || client.contacts?.[0]
  }

  const getSecondaryContacts = () => {
    return client.contacts?.filter(contact => !contact.isPrimary) || []
  }

  const formatTags = (tags) => {
    if (!tags || tags.length === 0) return '—'
    return tags.map(tag => (
      <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 mr-2 mb-1">
        {tag}
      </span>
    ))
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
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
                      Primary Contact
                    </label>
                    <p className="text-slate-900 dark:text-white">
                      {getPrimaryContact()?.name || client.name || '—'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email
                    </label>
                    <p className="text-slate-900 dark:text-white">
                      {(getPrimaryContact()?.email || client.email) ? (
                        <a
                          href={`mailto:${getPrimaryContact()?.email || client.email}`}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          {getPrimaryContact()?.email || client.email}
                        </a>
                      ) : '—'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Phone
                    </label>
                    <p className="text-slate-900 dark:text-white">
                      {(getPrimaryContact()?.phone || client.phone) ? (
                        <a
                          href={`tel:${getPrimaryContact()?.phone || client.phone}`}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          {getPrimaryContact()?.phone || client.phone}
                        </a>
                      ) : '—'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Phone
                    </label>
                    <p className="text-slate-900 dark:text-white">
                      {(getPrimaryContact()?.mobile || client.mobilePhone) ? (
                        <a
                          href={`tel:${getPrimaryContact()?.mobile || client.mobilePhone}`}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          {getPrimaryContact()?.mobile || client.mobilePhone}
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
                      Company Size
                    </label>
                    <p className="text-slate-900 dark:text-white">
                      {client.companySize || '—'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Referral Source
                    </label>
                    <p className="text-slate-900 dark:text-white">
                      {client.referralSource || '—'}
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

              {/* Tags */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Tags
                </h2>
                <div className="flex flex-wrap">
                  {formatTags(client.tags)}
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
                      {client.clientSince ? format(new Date(client.clientSince), 'MMM yyyy') : 
                       client.createdAt ? format(new Date(client.createdAt), 'MMM yyyy') : '—'}
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
        )

      case 'contacts':
        return (
          <div className="space-y-6">
            {/* Primary Contact */}
            {getPrimaryContact() && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Primary Contact
                  </h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                    Primary
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Name
                    </label>
                    <p className="text-slate-900 dark:text-white">
                      {getPrimaryContact().name || '—'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Title
                    </label>
                    <p className="text-slate-900 dark:text-white">
                      {getPrimaryContact().title || '—'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email
                    </label>
                    <p className="text-slate-900 dark:text-white">
                      {getPrimaryContact().email ? (
                        <a
                          href={`mailto:${getPrimaryContact().email}`}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          {getPrimaryContact().email}
                        </a>
                      ) : '—'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Phone
                    </label>
                    <p className="text-slate-900 dark:text-white">
                      {getPrimaryContact().phone ? (
                        <a
                          href={`tel:${getPrimaryContact().phone}`}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          {getPrimaryContact().phone}
                        </a>
                      ) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Secondary Contacts */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Secondary Contacts
                </h2>
                <Button variant="outline" size="sm">
                  <ApperIcon name="Plus" className="w-4 h-4" />
                  Add Contact
                </Button>
              </div>
              {getSecondaryContacts().length > 0 ? (
                <div className="space-y-4">
                  {getSecondaryContacts().map((contact, index) => (
                    <div key={index} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Name
                          </label>
                          <p className="text-slate-900 dark:text-white">
                            {contact.name || '—'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Title
                          </label>
                          <p className="text-slate-900 dark:text-white">
                            {contact.title || '—'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Email
                          </label>
                          <p className="text-slate-900 dark:text-white">
                            {contact.email ? (
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                              >
                                {contact.email}
                              </a>
                            ) : '—'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Phone
                          </label>
                          <p className="text-slate-900 dark:text-white">
                            {contact.phone ? (
                              <a
                                href={`tel:${contact.phone}`}
                                className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                              >
                                {contact.phone}
                              </a>
                            ) : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  title="No secondary contacts"
                  message="Add additional contacts for this client to keep track of all stakeholders."
                  actionLabel="Add Contact"
                  onAction={() => {}}
                />
              )}
            </div>
          </div>
        )

      case 'projects':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Projects
              </h2>
              <Button variant="outline" size="sm">
                <ApperIcon name="Plus" className="w-4 h-4" />
                New Project
              </Button>
            </div>
            <Empty
              title="No projects yet"
              message="Create your first project for this client to start tracking work and progress."
              actionLabel="Create Project"
              onAction={() => navigate('/projects')}
            />
          </div>
        )

      case 'invoices':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Invoices
              </h2>
              <Button variant="outline" size="sm">
                <ApperIcon name="Plus" className="w-4 h-4" />
                New Invoice
              </Button>
            </div>
            <Empty
              title="No invoices yet"
              message="Create your first invoice for this client to start billing for your services."
              actionLabel="Create Invoice"
              onAction={() => {}}
            />
          </div>
        )
case 'documents':
        return <ClientDocuments clientId={id} />
      case 'activity':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              Activity Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Client created
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {client.createdAt ? format(new Date(client.createdAt), 'MMM dd, yyyy \'at\' h:mm a') : '—'}
                  </p>
                </div>
              </div>
              {client.updatedAt && client.updatedAt !== client.createdAt && (
                <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="w-2 h-2 bg-accent-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Client information updated
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {format(new Date(client.updatedAt), 'MMM dd, yyyy \'at\' h:mm a')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 'notes':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Internal Notes
              </h2>
              <Button variant="outline" size="sm">
                <ApperIcon name="Plus" className="w-4 h-4" />
                Add Note
              </Button>
            </div>
            {client.internalNotes ? (
              <div className="prose dark:prose-invert max-w-none">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <p className="text-slate-900 dark:text-white whitespace-pre-wrap">
                    {client.internalNotes}
                  </p>
                </div>
              </div>
            ) : (
              <Empty
                title="No notes added"
                message="Add internal notes about this client that are only visible to your team."
                actionLabel="Add Note"
                onAction={() => {}}
              />
            )}
          </div>
        )

      default:
        return null
    }
  }

  // Client Documents Component
  function ClientDocuments({ clientId }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
      loadDocuments();
    }, [clientId]);

    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const clientDocuments = await documentService.getByClientId(clientId);
        setDocuments(clientDocuments);
      } catch (err) {
        setError('Failed to load documents');
        console.error('Error loading documents:', err);
      } finally {
        setLoading(false);
      }
    };

    const handleFileUpload = async (event) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      try {
        setUploading(true);
        
        const documentData = {
          name: file.name,
          clientId: parseInt(clientId),
          size: file.size,
          uploadedBy: 'Current User'
        };

        await documentService.create(documentData);
        toast.success('Document uploaded successfully');
        loadDocuments(); // Reload documents
        
        // Reset file input
        event.target.value = '';
      } catch (error) {
        toast.error(error.message || 'Failed to upload document');
      } finally {
        setUploading(false);
      }
    };

    const handleDelete = async (documentId, documentName) => {
      if (!confirm(`Are you sure you want to delete "${documentName}"?`)) {
        return;
      }

      try {
        await documentService.delete(documentId);
        toast.success('Document deleted successfully');
        setDocuments(prev => prev.filter(doc => doc.Id !== documentId));
      } catch (error) {
        toast.error('Failed to delete document');
      }
    };

    const handleDownload = (document) => {
      // Simulate document download
      toast.info(`Downloading ${document.name}...`);
      
      // In a real app, this would trigger actual file download
      setTimeout(() => {
        toast.success('Document downloaded successfully');
      }, 1000);
    };

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getDocumentIcon = (type) => {
      const iconMap = {
        'Contract': 'FileText',
        'Invoice': 'Receipt',
        'Proposal': 'FileText',
        'Document': 'File',
        'Image': 'Image',
        'Spreadsheet': 'Sheet',
        'Presentation': 'Presentation'
      };
      return iconMap[type] || 'File';
    };

    if (loading) {
      return (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-slate-600 dark:text-slate-400">Loading documents...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Documents ({documents.length})
          </h2>
          <div className="flex gap-2">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xlsx,.ppt,.pptx"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => document.getElementById('file-upload').click()}
              disabled={uploading}
            >
              <ApperIcon name="Upload" className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
            <div className="flex items-center">
              <ApperIcon name="AlertCircle" className="w-4 h-4 text-error-600 dark:text-error-400 mr-2" />
              <span className="text-error-700 dark:text-error-300">{error}</span>
            </div>
          </div>
        )}

        {documents.length === 0 ? (
          <Empty
            title="No documents uploaded"
            message="Upload contracts, proposals, and other important documents related to this client."
            actionLabel="Upload Document"
            onAction={() => document.getElementById('file-upload').click()}
          />
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <div
                key={document.Id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <ApperIcon 
                      name={getDocumentIcon(document.type)} 
                      className="w-8 h-8 text-primary-600 dark:text-primary-400" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {document.name}
                    </h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatFileSize(document.size)}
                      </span>
                      <StatusBadge status={document.type.toLowerCase()} variant="secondary">
                        {document.type}
                      </StatusBadge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Uploaded {formatDistanceToNow(new Date(document.uploadDate), { addSuffix: true })}
                      </span>
                    </div>
                    {document.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {document.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(document)}
                    className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <ApperIcon name="Download" className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(document.Id, document.name)}
                    className="text-slate-600 dark:text-slate-400 hover:text-error-600 dark:hover:text-error-400"
                  >
                    <ApperIcon name="Trash2" className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
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

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                ${activeTab === tab.key
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                }
              `}
            >
              <ApperIcon name={tab.icon} className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

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