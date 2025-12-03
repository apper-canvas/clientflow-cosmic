import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { format, addDays } from 'date-fns';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Label from '@/components/atoms/Label';
import FormField from '@/components/molecules/FormField';
import ApperIcon from '@/components/ApperIcon';
import invoiceService, { PAYMENT_TERMS, CURRENCIES } from '@/services/api/invoiceService';
import clientService from '@/services/api/clientService';
import projectService from '@/services/api/projectService';

const InvoiceForm = ({ invoice, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    clientId: '',
    projectId: '',
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    paymentTerms: 'net_30',
    currency: 'USD',
    items: [
      { 
        description: '', 
        quantity: 1, 
        rate: 0, 
        amount: 0,
        taxApplicable: true 
      }
    ],
    taxRate: 0,
    discountAmount: 0,
    discountType: 'fixed',
    notes: '',
    termsAndConditions: '',
    thankYouMessage: 'Thank you for your business!',
    status: 'draft'
  });
  
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [totals, setTotals] = useState({
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0
  });

  // Load form data
  useEffect(() => {
    loadFormData();
  }, []);

  // Load existing invoice data
  useEffect(() => {
    if (invoice) {
      setFormData({
        clientId: invoice.clientId || '',
        projectId: invoice.projectId || '',
        issueDate: invoice.issueDate || format(new Date(), 'yyyy-MM-dd'),
        dueDate: invoice.dueDate || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        paymentTerms: invoice.paymentTerms || 'net_30',
        currency: invoice.currency || 'USD',
        items: invoice.items?.length > 0 ? invoice.items : [
          { 
            description: '', 
            quantity: 1, 
            rate: 0, 
            amount: 0,
            taxApplicable: true 
          }
        ],
        taxRate: invoice.taxRate || 0,
        discountAmount: invoice.discountAmount || 0,
        discountType: invoice.discountType || 'fixed',
        notes: invoice.notes || '',
        termsAndConditions: invoice.termsAndConditions || '',
        thankYouMessage: invoice.thankYouMessage || 'Thank you for your business!',
        status: invoice.status || 'draft'
      });
    }
  }, [invoice]);

  // Update projects when client changes
  useEffect(() => {
    if (formData.clientId) {
      const clientProjects = allProjects.filter(p => p.clientId === parseInt(formData.clientId));
      setProjects(clientProjects);
    } else {
      setProjects([]);
      setFormData(prev => ({ ...prev, projectId: '' }));
    }
  }, [formData.clientId, allProjects]);

  // Calculate totals when items, tax, or discount change
  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.taxRate, formData.discountAmount, formData.discountType]);

  // Update due date when payment terms change
  useEffect(() => {
    if (formData.issueDate && formData.paymentTerms !== 'due_on_receipt') {
      const days = parseInt(formData.paymentTerms.replace('net_', ''));
      const newDueDate = format(addDays(new Date(formData.issueDate), days), 'yyyy-MM-dd');
      setFormData(prev => ({ ...prev, dueDate: newDueDate }));
    }
  }, [formData.paymentTerms, formData.issueDate]);

  const loadFormData = async () => {
    try {
      const [clientsResponse, projectsResponse] = await Promise.all([
        clientService.getAll(),
        projectService.getAll()
      ]);
      
      setClients(clientsResponse);
      setAllProjects(projectsResponse);
    } catch (error) {
      console.error('Error loading form data:', error);
      toast.error('Failed to load form data');
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    
    let discount = 0;
    if (formData.discountType === 'percentage') {
      discount = (subtotal * formData.discountAmount) / 100;
    } else {
      discount = formData.discountAmount;
    }
    
    const discountedSubtotal = subtotal - discount;
    const tax = (discountedSubtotal * formData.taxRate) / 100;
    const total = discountedSubtotal + tax;
    
    setTotals({ subtotal, discount, tax, total });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    
    // Calculate amount for quantity and rate changes
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate;
    }
    
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { 
          description: '', 
          quantity: 1, 
          rate: 0, 
          amount: 0,
          taxApplicable: true 
        }
      ]
    }));
  };

  const removeLineItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: updatedItems }));
    }
  };

  const moveLineItem = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.items.length) return;
    
    const updatedItems = [...formData.items];
    [updatedItems[index], updatedItems[newIndex]] = [updatedItems[newIndex], updatedItems[index]];
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }
    
    if (!formData.issueDate) {
      newErrors.issueDate = 'Issue date is required';
    }
    
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    
    if (formData.dueDate && formData.issueDate && new Date(formData.dueDate) <= new Date(formData.issueDate)) {
      newErrors.dueDate = 'Due date must be after issue date';
    }
    
    // Validate line items
    const itemErrors = [];
    formData.items.forEach((item, index) => {
      const itemError = {};
      if (!item.description.trim()) {
        itemError.description = 'Description is required';
      }
      if (item.quantity <= 0) {
        itemError.quantity = 'Quantity must be greater than 0';
      }
      if (item.rate < 0) {
        itemError.rate = 'Rate cannot be negative';
      }
      if (Object.keys(itemError).length > 0) {
        itemErrors[index] = itemError;
      }
    });
    
    if (itemErrors.length > 0 || Object.keys(itemErrors).length > 0) {
      newErrors.items = itemErrors;
    }
    
    if (formData.taxRate < 0 || formData.taxRate > 100) {
      newErrors.taxRate = 'Tax rate must be between 0 and 100';
    }
    
    if (formData.discountAmount < 0) {
      newErrors.discountAmount = 'Discount cannot be negative';
    }
    
    if (formData.discountType === 'percentage' && formData.discountAmount > 100) {
      newErrors.discountAmount = 'Percentage discount cannot exceed 100%';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }
    
    setLoading(true);
    
    try {
      const invoiceData = {
        ...formData,
        items: formData.items.filter(item => item.description.trim())
      };
      
      let savedInvoice;
      if (invoice) {
        savedInvoice = await invoiceService.update(invoice.Id, invoiceData);
        toast.success('Invoice updated successfully');
      } else {
        savedInvoice = await invoiceService.create(invoiceData);
        toast.success('Invoice created successfully');
      }
      
      onSave(savedInvoice);
      onClose();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error(error.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const getClientOptions = () => {
    return clients.map(client => ({
      value: client.Id,
      label: client.name
    }));
  };

  const getProjectOptions = () => {
    return [
      { value: '', label: 'No project' },
      ...projects.map(project => ({
        value: project.Id,
        label: project.name
      }))
    ];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {invoice ? 'Edit Invoice' : 'New Invoice'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <ApperIcon name="X" size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(90vh-80px)]">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Client and Project Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Client *"
                error={errors.clientId}
                input={
                  <Select
                    value={formData.clientId}
                    onChange={(value) => handleInputChange('clientId', value)}
                    options={getClientOptions()}
                    placeholder="Select client"
                  />
                }
              />
              
              <FormField
                label="Project"
                input={
                  <Select
                    value={formData.projectId}
                    onChange={(value) => handleInputChange('projectId', value)}
                    options={getProjectOptions()}
                    placeholder="Select project (optional)"
                    disabled={!formData.clientId}
                  />
                }
              />
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Issue Date *"
                error={errors.issueDate}
                input={
                  <Input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => handleInputChange('issueDate', e.target.value)}
                  />
                }
              />
              
              <FormField
                label="Due Date *"
                error={errors.dueDate}
                input={
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  />
                }
              />
              
              <FormField
                label="Payment Terms"
                input={
                  <Select
                    value={formData.paymentTerms}
                    onChange={(value) => handleInputChange('paymentTerms', value)}
                    options={PAYMENT_TERMS}
                  />
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Currency"
                input={
                  <Select
                    value={formData.currency}
                    onChange={(value) => handleInputChange('currency', value)}
                    options={CURRENCIES}
                  />
                }
              />
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Line Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                >
                  <ApperIcon name="Plus" size={16} className="mr-2" />
                  Add Item
                </Button>
              </div>
              
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Item {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveLineItem(index, 'up')}
                          disabled={index === 0}
                        >
                          <ApperIcon name="ChevronUp" size={16} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveLineItem(index, 'down')}
                          disabled={index === formData.items.length - 1}
                        >
                          <ApperIcon name="ChevronDown" size={16} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                          disabled={formData.items.length === 1}
                          className="text-red-600 hover:text-red-700"
                        >
                          <ApperIcon name="Trash2" size={16} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-6">
                        <Label>Description *</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Service or product description"
                          error={errors.items?.[index]?.description}
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label>Qty *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          error={errors.items?.[index]?.quantity}
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label>Rate *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          error={errors.items?.[index]?.rate}
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          value={item.amount.toFixed(2)}
                          readOnly
                          className="bg-slate-50 dark:bg-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax and Discount */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Tax Rate (%)"
                error={errors.taxRate}
                input={
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                  />
                }
              />
              
              <FormField
                label="Discount Type"
                input={
                  <Select
                    value={formData.discountType}
                    onChange={(value) => handleInputChange('discountType', value)}
                    options={[
                      { value: 'fixed', label: 'Fixed Amount' },
                      { value: 'percentage', label: 'Percentage' }
                    ]}
                  />
                }
              />
              
              <FormField
                label={`Discount ${formData.discountType === 'percentage' ? '(%)' : `(${CURRENCIES.find(c => c.value === formData.currency)?.symbol || '$'})`}`}
                error={errors.discountAmount}
                input={
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discountAmount}
                    onChange={(e) => handleInputChange('discountAmount', parseFloat(e.target.value) || 0)}
                  />
                }
              />
            </div>

            {/* Invoice Totals */}
            <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Invoice Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{CURRENCIES.find(c => c.value === formData.currency)?.symbol || '$'}{totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{CURRENCIES.find(c => c.value === formData.currency)?.symbol || '$'}{totals.discount.toFixed(2)}</span>
                  </div>
                )}
                {totals.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({formData.taxRate}%):</span>
                    <span>{CURRENCIES.find(c => c.value === formData.currency)?.symbol || '$'}{totals.tax.toFixed(2)}</span>
                  </div>
                )}
                <hr className="border-slate-300 dark:border-slate-600" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>{CURRENCIES.find(c => c.value === formData.currency)?.symbol || '$'}{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Additional Fields */}
            <div className="space-y-4">
              <FormField
                label="Internal Notes"
                input={
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Internal notes (not shown on invoice)"
                  />
                }
              />
              
              <FormField
                label="Terms and Conditions"
                input={
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    value={formData.termsAndConditions}
                    onChange={(e) => handleInputChange('termsAndConditions', e.target.value)}
                    placeholder="Payment terms, late fees, etc."
                  />
                }
              />
              
              <FormField
                label="Thank You Message"
                input={
                  <Input
                    value={formData.thankYouMessage}
                    onChange={(e) => handleInputChange('thankYouMessage', e.target.value)}
                    placeholder="Thank you message"
                  />
                }
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
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
              loading={loading}
            >
              {invoice ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;