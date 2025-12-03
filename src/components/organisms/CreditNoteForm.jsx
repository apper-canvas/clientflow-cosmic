import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

import invoiceService from '@/services/api/invoiceService';
import clientService from '@/services/api/clientService';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Label from '@/components/atoms/Label';
import Select from '@/components/atoms/Select';
import ApperIcon from '@/components/ApperIcon';

const CreditNoteForm = ({ onClose, onSave, clientId = null }) => {
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const [formData, setFormData] = useState({
    clientId: clientId || '',
    amount: '',
    reason: '',
    notes: '',
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    invoiceId: '', // Optional - for applying immediately
    applyToInvoice: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (formData.clientId && formData.applyToInvoice) {
      loadClientInvoices(formData.clientId);
    } else {
      setInvoices([]);
      setFormData(prev => ({ ...prev, invoiceId: '' }));
    }
  }, [formData.clientId, formData.applyToInvoice]);

  const loadClients = async () => {
    try {
      const clientsData = await clientService.getAll();
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Failed to load clients');
    }
  };

  const loadClientInvoices = async (clientId) => {
    try {
      setLoadingInvoices(true);
      const allInvoices = await invoiceService.getAll();
      const clientInvoices = allInvoices.filter(invoice => 
        invoice.clientId === parseInt(clientId) && 
        invoice.balanceDue > 0 &&
        (invoice.status === 'sent' || invoice.status === 'viewed' || invoice.status === 'overdue')
      );
      setInvoices(clientInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Create credit note
      const creditNote = await invoiceService.createCreditNote({
        clientId: parseInt(formData.clientId),
        amount: parseFloat(formData.amount),
        reason: formData.reason,
        notes: formData.notes,
        issueDate: formData.issueDate
      });

      // Apply to invoice if specified
      if (formData.applyToInvoice && formData.invoiceId) {
        await invoiceService.applyCreditNote(
          creditNote.Id,
          parseInt(formData.invoiceId),
          parseFloat(formData.amount)
        );
        toast.success('Credit note created and applied to invoice successfully');
      } else {
        toast.success('Credit note created successfully');
      }

      onSave?.(creditNote);
      onClose();
    } catch (error) {
      console.error('Error creating credit note:', error);
      toast.error(error.message || 'Failed to create credit note');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    if (formData.applyToInvoice && !formData.invoiceId) {
      newErrors.invoiceId = 'Please select an invoice to apply credit to';
    }

    if (formData.applyToInvoice && formData.invoiceId) {
      const selectedInvoice = invoices.find(inv => inv.Id === parseInt(formData.invoiceId));
      if (selectedInvoice && parseFloat(formData.amount) > selectedInvoice.balanceDue) {
        newErrors.amount = 'Credit amount cannot exceed invoice balance';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const selectedInvoice = invoices.find(inv => inv.Id === parseInt(formData.invoiceId));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Create Credit Note
          </h2>
          <Button variant="outline" onClick={onClose}>
            <ApperIcon name="X" size={16} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Selection */}
          <div>
            <Label htmlFor="clientId">Client *</Label>
            <Select
              id="clientId"
              value={formData.clientId}
              onChange={(value) => handleInputChange('clientId', value)}
              options={[
                { value: '', label: 'Select client...' },
                ...clients.map(client => ({
                  value: client.Id.toString(),
                  label: client.name
                }))
              ]}
              disabled={clientId !== null}
              className={errors.clientId ? 'border-red-300' : ''}
            />
            {errors.clientId && (
              <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount">Credit Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className={errors.amount ? 'border-red-300' : ''}
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Reason *</Label>
            <Input
              id="reason"
              placeholder="e.g., Service adjustment, Overpayment refund..."
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              className={errors.reason ? 'border-red-300' : ''}
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
            )}
          </div>

          {/* Issue Date */}
          <div>
            <Label htmlFor="issueDate">Issue Date</Label>
            <Input
              id="issueDate"
              type="date"
              value={formData.issueDate}
              onChange={(e) => handleInputChange('issueDate', e.target.value)}
            />
          </div>

          {/* Apply to Invoice Toggle */}
          {formData.clientId && (
            <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-700/50">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.applyToInvoice}
                  onChange={(e) => handleInputChange('applyToInvoice', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Apply credit to an existing invoice immediately
                </span>
              </label>

              {formData.applyToInvoice && (
                <div className="mt-4">
                  <Label htmlFor="invoiceId">Select Invoice</Label>
                  {loadingInvoices ? (
                    <div className="text-sm text-slate-500 py-2">Loading invoices...</div>
                  ) : (
                    <Select
                      id="invoiceId"
                      value={formData.invoiceId}
                      onChange={(value) => handleInputChange('invoiceId', value)}
                      options={[
                        { value: '', label: 'Select invoice...' },
                        ...invoices.map(invoice => ({
                          value: invoice.Id.toString(),
                          label: `${invoice.invoiceNumber} - $${invoice.balanceDue.toFixed(2)} due`
                        }))
                      ]}
                      className={errors.invoiceId ? 'border-red-300' : ''}
                    />
                  )}
                  {errors.invoiceId && (
                    <p className="mt-1 text-sm text-red-600">{errors.invoiceId}</p>
                  )}

                  {selectedInvoice && (
                    <div className="mt-2 p-3 bg-white dark:bg-slate-800 rounded border text-sm">
                      <div className="font-medium">Invoice: {selectedInvoice.invoiceNumber}</div>
                      <div className="text-slate-600 dark:text-slate-400">
                        Balance Due: ${selectedInvoice.balanceDue.toFixed(2)}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">
                        Due Date: {format(new Date(selectedInvoice.dueDate), 'MMM d, yyyy')}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <ApperIcon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <ApperIcon name="Plus" size={16} className="mr-2" />
                  Create Credit Note
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreditNoteForm;