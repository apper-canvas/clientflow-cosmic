import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import Button from '@/components/atoms/Button';
import StatusBadge from '@/components/molecules/StatusBadge';
import PaymentForm from '@/components/organisms/PaymentForm';
import Loading from '@/components/ui/Loading';
import ErrorView from '@/components/ui/ErrorView';
import ApperIcon from '@/components/ApperIcon';
import invoiceService, { INVOICE_STATUSES, CURRENCIES } from '@/services/api/invoiceService';
import clientService from '@/services/api/clientService';
import projectService from '@/services/api/projectService';
import { cn } from '@/utils/cn';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [invoice, setInvoice] = useState(null);
  const [client, setClient] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    loadInvoiceData();
  }, [id]);

  const loadInvoiceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const invoiceResponse = await invoiceService.getById(id);
      setInvoice(invoiceResponse);
      
      // Load related data
      const clientResponse = await clientService.getById(invoiceResponse.clientId);
      setClient(clientResponse);
      
      if (invoiceResponse.projectId) {
        const projectResponse = await projectService.getById(invoiceResponse.projectId);
        setProject(projectResponse);
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = () => {
    return CURRENCIES.find(c => c.value === invoice?.currency)?.symbol || '$';
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

  const handleEdit = () => {
    navigate(`/invoices/edit/${invoice.Id}`);
  };

  const handleDuplicate = async () => {
    try {
      const duplicated = await invoiceService.duplicate(invoice.Id);
      navigate(`/invoices/edit/${duplicated.Id}`);
      toast.success('Invoice duplicated successfully');
    } catch (error) {
      console.error('Error duplicating invoice:', error);
      toast.error(error.message || 'Failed to duplicate invoice');
    }
  };

  const handleSend = async () => {
    if (!client?.email) {
      toast.error('Client email is required to send invoice');
      return;
    }
    
    try {
      await invoiceService.sendInvoice(invoice.Id, {
        to: client.email,
        subject: `Invoice ${invoice.invoiceNumber}`,
        message: 'Please find attached your invoice.'
      });
      
      setInvoice(prev => ({ ...prev, status: INVOICE_STATUSES.SENT }));
      toast.success('Invoice sent successfully');
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error(error.message || 'Failed to send invoice');
    }
  };

  const handleRecordPayment = () => {
    if (invoice.status === INVOICE_STATUSES.PAID) {
      toast.info('This invoice is already fully paid');
      return;
    }
    if (invoice.status === INVOICE_STATUSES.CANCELLED) {
      toast.warning('Cannot record payment for cancelled invoice');
      return;
    }
    
    setShowPaymentForm(true);
  };

  const handleSavePayment = async (paymentData) => {
    try {
      const updatedInvoice = await invoiceService.recordPayment(invoice.Id, paymentData);
      setInvoice(updatedInvoice);
      setShowPaymentForm(false);
    } catch (error) {
      throw error; // Re-throw to be handled by PaymentForm
    }
  };

  const handleMarkAsSent = async () => {
    try {
      const updatedInvoice = await invoiceService.update(invoice.Id, { 
        status: INVOICE_STATUSES.SENT 
      });
      setInvoice(updatedInvoice);
      toast.success('Invoice marked as sent');
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error(error.message || 'Failed to update invoice');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this invoice? This action cannot be undone.')) {
      return;
    }
    
    try {
      const updatedInvoice = await invoiceService.update(invoice.Id, { 
        status: INVOICE_STATUSES.CANCELLED 
      });
      setInvoice(updatedInvoice);
      toast.success('Invoice cancelled');
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      toast.error(error.message || 'Failed to cancel invoice');
    }
  };

  if (loading) {
    return <Loading className="h-96" />;
  }

  if (error) {
    return <ErrorView error={error} onRetry={loadInvoiceData} />;
  }

  if (!invoice) {
    return <ErrorView error="Invoice not found" />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/invoices')}
          >
            <ApperIcon name="ArrowLeft" size={16} className="mr-2" />
            Back to Invoices
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          {invoice.status === INVOICE_STATUSES.DRAFT && (
            <>
              <Button variant="outline" onClick={handleMarkAsSent}>
                <ApperIcon name="Send" size={16} className="mr-2" />
                Mark as Sent
              </Button>
              <Button variant="outline" onClick={handleEdit}>
                <ApperIcon name="Edit" size={16} className="mr-2" />
                Edit
              </Button>
            </>
          )}
          
          {invoice.status === INVOICE_STATUSES.DRAFT && client?.email && (
            <Button onClick={handleSend}>
              <ApperIcon name="Mail" size={16} className="mr-2" />
              Send Invoice
            </Button>
          )}
          
          {(invoice.status === INVOICE_STATUSES.SENT || invoice.status === INVOICE_STATUSES.VIEWED || invoice.status === INVOICE_STATUSES.OVERDUE) && (
            <Button onClick={handleRecordPayment}>
              <ApperIcon name="CreditCard" size={16} className="mr-2" />
              Record Payment
            </Button>
          )}
          
          <Button variant="outline" onClick={handleDuplicate}>
            <ApperIcon name="Copy" size={16} className="mr-2" />
            Duplicate
          </Button>
          
          <Button variant="outline">
            <ApperIcon name="Download" size={16} className="mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Invoice Header */}
        <div className="p-8 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {invoice.invoiceNumber}
              </h1>
              <div className="space-y-1 text-slate-600 dark:text-slate-400">
                <p>Issue Date: {format(new Date(invoice.issueDate), 'MMMM d, yyyy')}</p>
                <p>Due Date: {format(new Date(invoice.dueDate), 'MMMM d, yyyy')}</p>
              </div>
            </div>
            
            <div className="text-right">
              <span className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4',
                getStatusColor(invoice.status)
              )}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
              
              <div className="text-right">
                <p className="text-sm text-slate-600 dark:text-slate-400">Amount Due</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {getCurrencySymbol()}{invoice.balanceDue?.toFixed(2)}
                </p>
                {invoice.balanceDue !== invoice.total && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    of {getCurrencySymbol()}{invoice.total?.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="p-8 border-b border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                Bill To
              </h3>
              <div className="text-slate-900 dark:text-slate-100">
                <p className="font-semibold">{client?.name}</p>
                {client?.email && <p>{client.email}</p>}
                {client?.phone && <p>{client.phone}</p>}
                {client?.address && (
                  <div className="mt-2">
                    <p>{client.address.street}</p>
                    <p>{client.address.city}, {client.address.state} {client.address.zip}</p>
                    <p>{client.address.country}</p>
                  </div>
                )}
              </div>
            </div>
            
            {project && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                  Project
                </h3>
                <div className="text-slate-900 dark:text-slate-100">
                  <p className="font-semibold">{project.name}</p>
                  {project.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="p-8 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Items
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-0 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Description
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Qty
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Rate
                  </th>
                  <th className="text-right py-3 px-0 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {invoice.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="py-4 px-0">
                      <p className="text-slate-900 dark:text-slate-100 font-medium">
                        {item.description}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-4 text-right text-slate-600 dark:text-slate-400">
                      {getCurrencySymbol()}{item.rate?.toFixed(2)}
                    </td>
                    <td className="py-4 px-0 text-right text-slate-900 dark:text-slate-100 font-medium">
                      {getCurrencySymbol()}{item.amount?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Totals */}
        <div className="p-8 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-sm ml-auto space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
              <span className="text-slate-900 dark:text-slate-100">
                {getCurrencySymbol()}{invoice.subtotal?.toFixed(2)}
              </span>
            </div>
            
            {invoice.discountValue > 0 && (
              <div className="flex justify-between text-green-600">
                <span>
                  Discount {invoice.discountType === 'percentage' ? `(${invoice.discountAmount}%)` : ''}:
                </span>
                <span>-{getCurrencySymbol()}{invoice.discountValue?.toFixed(2)}</span>
              </div>
            )}
            
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Tax ({invoice.taxRate}%):
                </span>
                <span className="text-slate-900 dark:text-slate-100">
                  {getCurrencySymbol()}{invoice.taxAmount?.toFixed(2)}
                </span>
              </div>
            )}
            
            <hr className="border-slate-300 dark:border-slate-600" />
            
            <div className="flex justify-between text-lg font-semibold">
              <span className="text-slate-900 dark:text-slate-100">Total:</span>
              <span className="text-slate-900 dark:text-slate-100">
                {getCurrencySymbol()}{invoice.total?.toFixed(2)}
              </span>
            </div>
            
            {invoice.amountPaid > 0 && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>Amount Paid:</span>
                  <span>{getCurrencySymbol()}{invoice.amountPaid?.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-lg font-semibold text-primary-600">
                  <span>Balance Due:</span>
                  <span>{getCurrencySymbol()}{invoice.balanceDue?.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="p-8 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Payment History
            </h3>
            
            <div className="space-y-3">
              {invoice.payments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {getCurrencySymbol()}{payment.amount?.toFixed(2)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {format(new Date(payment.date), 'MMM d, yyyy')} • {payment.method}
                      {payment.reference && ` • ${payment.reference}`}
                    </p>
                    {payment.notes && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {payment.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                      Paid
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes and Terms */}
        <div className="p-8">
          {invoice.termsAndConditions && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                Terms & Conditions
              </h3>
              <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                {invoice.termsAndConditions}
              </p>
            </div>
          )}
          
          {invoice.thankYouMessage && (
            <div>
              <p className="text-center text-lg text-slate-700 dark:text-slate-300 italic">
                {invoice.thankYouMessage}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {invoice.status !== INVOICE_STATUSES.CANCELLED && (
          <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-end gap-3">
              {invoice.status !== INVOICE_STATUSES.PAID && (
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
                >
                  Cancel Invoice
                </Button>
              )}
              
              <Button variant="outline">
                <ApperIcon name="Printer" size={16} className="mr-2" />
                Print
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Form */}
      <PaymentForm
        invoice={invoice}
        isOpen={showPaymentForm}
        onClose={() => setShowPaymentForm(false)}
        onSave={handleSavePayment}
      />
    </div>
  );
};

export default InvoiceDetail;