import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import SearchBar from '@/components/molecules/SearchBar';
import StatusBadge from '@/components/molecules/StatusBadge';
import InvoiceForm from '@/components/organisms/InvoiceForm';
import PaymentForm from '@/components/organisms/PaymentForm';
import Loading from '@/components/ui/Loading';
import ErrorView from '@/components/ui/ErrorView';
import Empty from '@/components/ui/Empty';
import ApperIcon from '@/components/ApperIcon';
import invoiceService, { INVOICE_STATUSES } from '@/services/api/invoiceService';
import clientService from '@/services/api/clientService';
import { cn } from '@/utils/cn';

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form states
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    clientId: '',
    dateRange: 'all'
  });
  
  // Sort and pagination
  const [sortField, setSortField] = useState('issueDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [viewMode, setViewMode] = useState('table'); // table or cards

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [invoicesResponse, clientsResponse] = await Promise.all([
        invoiceService.getAll(),
        clientService.getAll()
      ]);
      
      setInvoices(invoicesResponse);
      setClients(clientsResponse);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort invoices
  const filteredInvoices = invoices
    .filter(invoice => {
      // Text search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const client = clients.find(c => c.Id === invoice.clientId);
        const clientName = client?.name || '';
        
        if (
          !invoice.invoiceNumber.toLowerCase().includes(searchLower) &&
          !clientName.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
      
      // Status filter
      if (filters.status && invoice.status !== filters.status) {
        return false;
      }
      
      // Client filter
      if (filters.clientId && invoice.clientId !== parseInt(filters.clientId)) {
        return false;
      }
      
      // Date range filter
      if (filters.dateRange !== 'all') {
        const invoiceDate = new Date(invoice.issueDate);
        const now = new Date();
        
        switch (filters.dateRange) {
          case 'this_month':
            if (
              invoiceDate.getMonth() !== now.getMonth() ||
              invoiceDate.getFullYear() !== now.getFullYear()
            ) return false;
            break;
          case 'last_30_days':
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (invoiceDate < thirtyDaysAgo) return false;
            break;
          case 'this_year':
            if (invoiceDate.getFullYear() !== now.getFullYear()) return false;
            break;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'invoiceNumber':
          aValue = a.invoiceNumber;
          bValue = b.invoiceNumber;
          break;
        case 'client':
          const clientA = clients.find(c => c.Id === a.clientId);
          const clientB = clients.find(c => c.Id === b.clientId);
          aValue = clientA?.name || '';
          bValue = clientB?.name || '';
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        default:
          aValue = new Date(a.issueDate);
          bValue = new Date(b.issueDate);
      }
      
      if (sortDirection === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ApperIcon name="ArrowUpDown" size={16} className="text-slate-400" />;
    }
    
    return sortDirection === 'asc' 
      ? <ApperIcon name="ArrowUp" size={16} className="text-primary-600" />
      : <ApperIcon name="ArrowDown" size={16} className="text-primary-600" />;
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.Id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getStatusColor = (status) => {
    const colors = {
      [INVOICE_STATUSES.DRAFT]: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
      [INVOICE_STATUSES.SENT]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
      [INVOICE_STATUSES.VIEWED]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
      [INVOICE_STATUSES.PAID]: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
      [INVOICE_STATUSES.OVERDUE]: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
      [INVOICE_STATUSES.CANCELLED]: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 line-through'
    };
    
    return colors[status] || colors[INVOICE_STATUSES.DRAFT];
  };

  const handleNewInvoice = () => {
    setSelectedInvoice(null);
    setShowInvoiceForm(true);
  };

  const handleEditInvoice = (invoice) => {
    if (invoice.status !== INVOICE_STATUSES.DRAFT && invoice.status !== INVOICE_STATUSES.SENT) {
      toast.warning('Only draft and sent invoices can be edited');
      return;
    }
    setSelectedInvoice(invoice);
    setShowInvoiceForm(true);
  };

  const handleViewInvoice = (invoice) => {
    navigate(`/invoices/${invoice.Id}`);
  };

  const handleDuplicateInvoice = async (invoice) => {
    try {
      const duplicated = await invoiceService.duplicate(invoice.Id);
      setInvoices(prev => [duplicated, ...prev]);
      toast.success('Invoice duplicated successfully');
    } catch (error) {
      console.error('Error duplicating invoice:', error);
      toast.error(error.message || 'Failed to duplicate invoice');
    }
  };

  const handleDeleteInvoice = async (invoice) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
      return;
    }
    
    try {
      await invoiceService.delete(invoice.Id);
      setInvoices(prev => prev.filter(inv => inv.Id !== invoice.Id));
      toast.success('Invoice deleted successfully');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error(error.message || 'Failed to delete invoice');
    }
  };

  const handleRecordPayment = (invoice) => {
    if (invoice.status === INVOICE_STATUSES.PAID) {
      toast.info('This invoice is already fully paid');
      return;
    }
    if (invoice.status === INVOICE_STATUSES.CANCELLED) {
      toast.warning('Cannot record payment for cancelled invoice');
      return;
    }
    
    setSelectedInvoice(invoice);
    setShowPaymentForm(true);
  };

  const handleSendInvoice = async (invoice) => {
    try {
      await invoiceService.sendInvoice(invoice.Id, {
        to: 'client@example.com', // In real app, get from client data
        subject: `Invoice ${invoice.invoiceNumber}`,
        message: 'Please find attached your invoice.'
      });
      
      // Update invoice status locally
      setInvoices(prev => prev.map(inv => 
        inv.Id === invoice.Id 
          ? { ...inv, status: INVOICE_STATUSES.SENT }
          : inv
      ));
      
      toast.success('Invoice sent successfully');
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error(error.message || 'Failed to send invoice');
    }
  };

  const handleSaveInvoice = (savedInvoice) => {
    if (selectedInvoice) {
      // Update existing
      setInvoices(prev => prev.map(inv => 
        inv.Id === savedInvoice.Id ? savedInvoice : inv
      ));
    } else {
      // Add new
      setInvoices(prev => [savedInvoice, ...prev]);
    }
    
    setShowInvoiceForm(false);
    setSelectedInvoice(null);
  };

  const handleSavePayment = async (paymentData) => {
    try {
      const updatedInvoice = await invoiceService.recordPayment(selectedInvoice.Id, paymentData);
      
      setInvoices(prev => prev.map(inv => 
        inv.Id === updatedInvoice.Id ? updatedInvoice : inv
      ));
      
      setShowPaymentForm(false);
      setSelectedInvoice(null);
    } catch (error) {
      throw error; // Re-throw to be handled by PaymentForm
    }
  };

  const handleSelectInvoice = (invoiceId) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map(inv => inv.Id));
    }
  };

  if (loading) {
    return <Loading className="h-96" />;
  }

  if (error) {
    return <ErrorView error={error} onRetry={loadData} />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Invoices</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your invoices and track payments
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
          >
            <ApperIcon name={viewMode === 'table' ? 'Grid3X3' : 'List'} size={16} />
          </Button>
          
          <Button onClick={handleNewInvoice}>
            <ApperIcon name="Plus" size={16} className="mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <SearchBar
              placeholder="Search invoices..."
              onSearch={(value) => handleFilterChange('search', value)}
              className="w-full"
            />
          </div>
          
          <div>
            <Select
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: INVOICE_STATUSES.DRAFT, label: 'Draft' },
                { value: INVOICE_STATUSES.SENT, label: 'Sent' },
                { value: INVOICE_STATUSES.VIEWED, label: 'Viewed' },
                { value: INVOICE_STATUSES.PAID, label: 'Paid' },
                { value: INVOICE_STATUSES.OVERDUE, label: 'Overdue' },
                { value: INVOICE_STATUSES.CANCELLED, label: 'Cancelled' }
              ]}
              placeholder="Filter by status"
            />
          </div>
          
          <div>
            <Select
              value={filters.clientId}
              onChange={(value) => handleFilterChange('clientId', value)}
              options={[
                { value: '', label: 'All Clients' },
                ...clients.map(client => ({
                  value: client.Id,
                  label: client.name
                }))
              ]}
              placeholder="Filter by client"
            />
          </div>
          
          <div>
            <Select
              value={filters.dateRange}
              onChange={(value) => handleFilterChange('dateRange', value)}
              options={[
                { value: 'all', label: 'All Time' },
                { value: 'this_month', label: 'This Month' },
                { value: 'last_30_days', label: 'Last 30 Days' },
                { value: 'this_year', label: 'This Year' }
              ]}
            />
          </div>
        </div>
        
        {(filters.search || filters.status || filters.clientId || filters.dateRange !== 'all') && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ search: '', status: '', clientId: '', dateRange: 'all' })}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary-700 dark:text-primary-300">
              {selectedInvoices.length} invoice{selectedInvoices.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <ApperIcon name="Mail" size={16} className="mr-2" />
                Send Bulk
              </Button>
              <Button variant="outline" size="sm">
                <ApperIcon name="Download" size={16} className="mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <Empty
          title="No invoices found"
          description="Create your first invoice to get started"
          actionLabel="New Invoice"
          onAction={handleNewInvoice}
        />
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 dark:border-slate-600"
                    />
                  </th>
                  <th className="p-4 text-left">
                    <button
                      className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                      onClick={() => handleSort('invoiceNumber')}
                    >
                      Invoice #
                      {getSortIcon('invoiceNumber')}
                    </button>
                  </th>
                  <th className="p-4 text-left">
                    <button
                      className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                      onClick={() => handleSort('client')}
                    >
                      Client
                      {getSortIcon('client')}
                    </button>
                  </th>
                  <th className="p-4 text-left">
                    <button
                      className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                      onClick={() => handleSort('issueDate')}
                    >
                      Issue Date
                      {getSortIcon('issueDate')}
                    </button>
                  </th>
                  <th className="p-4 text-left">
                    <button
                      className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                      onClick={() => handleSort('dueDate')}
                    >
                      Due Date
                      {getSortIcon('dueDate')}
                    </button>
                  </th>
                  <th className="p-4 text-left">
                    <button
                      className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                      onClick={() => handleSort('total')}
                    >
                      Amount
                      {getSortIcon('total')}
                    </button>
                  </th>
                  <th className="p-4 text-left">
                    <button
                      className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      {getSortIcon('status')}
                    </button>
                  </th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredInvoices.map((invoice) => (
                  <tr 
                    key={invoice.Id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.Id)}
                        onChange={() => handleSelectInvoice(invoice.Id)}
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleViewInvoice(invoice)}
                        className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        {invoice.invoiceNumber}
                      </button>
                    </td>
                    <td className="p-4 text-slate-900 dark:text-slate-100">
                      {getClientName(invoice.clientId)}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      {format(new Date(invoice.issueDate), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 text-slate-900 dark:text-slate-100 font-medium">
                      ${invoice.total?.toFixed(2)}
                      {invoice.balanceDue > 0 && invoice.balanceDue < invoice.total && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          ${invoice.balanceDue.toFixed(2)} due
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getStatusColor(invoice.status)
                      )}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewInvoice(invoice)}
                          title="View invoice"
                        >
                          <ApperIcon name="Eye" size={16} />
                        </Button>
                        
                        {(invoice.status === INVOICE_STATUSES.DRAFT || invoice.status === INVOICE_STATUSES.SENT) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditInvoice(invoice)}
                            title="Edit invoice"
                          >
                            <ApperIcon name="Edit" size={16} />
                          </Button>
                        )}
                        
                        {invoice.status === INVOICE_STATUSES.DRAFT && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendInvoice(invoice)}
                            title="Send invoice"
                          >
                            <ApperIcon name="Send" size={16} />
                          </Button>
                        )}
                        
                        {invoice.status !== INVOICE_STATUSES.PAID && invoice.status !== INVOICE_STATUSES.CANCELLED && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRecordPayment(invoice)}
                            title="Record payment"
                          >
                            <ApperIcon name="CreditCard" size={16} />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateInvoice(invoice)}
                          title="Duplicate invoice"
                        >
                          <ApperIcon name="Copy" size={16} />
                        </Button>
                        
                        {invoice.status === INVOICE_STATUSES.DRAFT && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInvoice(invoice)}
                            title="Delete invoice"
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <ApperIcon name="Trash2" size={16} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.Id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {invoice.invoiceNumber}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {getClientName(invoice.clientId)}
                  </p>
                </div>
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  getStatusColor(invoice.status)
                )}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Amount:</span>
                  <span className="font-medium">${invoice.total?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Due Date:</span>
                  <span>{format(new Date(invoice.dueDate), 'MMM d, yyyy')}</span>
                </div>
                {invoice.balanceDue > 0 && invoice.balanceDue < invoice.total && (
                  <div className="flex justify-between text-orange-600">
                    <span>Balance Due:</span>
                    <span className="font-medium">${invoice.balanceDue.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewInvoice(invoice)}
                >
                  View
                </Button>
                
                {invoice.status !== INVOICE_STATUSES.PAID && invoice.status !== INVOICE_STATUSES.CANCELLED && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRecordPayment(invoice)}
                  >
                    Payment
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicateInvoice(invoice)}
                >
                  <ApperIcon name="Copy" size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Forms */}
      <InvoiceForm
        invoice={selectedInvoice}
        isOpen={showInvoiceForm}
        onClose={() => {
          setShowInvoiceForm(false);
          setSelectedInvoice(null);
        }}
        onSave={handleSaveInvoice}
      />
      
      <PaymentForm
        invoice={selectedInvoice}
        isOpen={showPaymentForm}
        onClose={() => {
          setShowPaymentForm(false);
          setSelectedInvoice(null);
        }}
        onSave={handleSavePayment}
      />
    </div>
  );
};

export default InvoiceList;