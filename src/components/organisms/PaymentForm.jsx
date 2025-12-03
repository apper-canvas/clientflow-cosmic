import { useState } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Label from '@/components/atoms/Label';
import FormField from '@/components/molecules/FormField';
import ApperIcon from '@/components/ApperIcon';
import { PAYMENT_METHODS, CURRENCIES } from '@/services/api/invoiceService';

const PaymentForm = ({ invoice, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    amount: invoice?.balanceDue || 0,
    method: 'bank_transfer',
    reference: '',
    notes: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Payment amount is required and must be greater than 0';
    }
    
    if (formData.amount > invoice.balanceDue) {
      newErrors.amount = `Payment amount cannot exceed balance due (${getCurrencySymbol()}${invoice.balanceDue.toFixed(2)})`;
    }
    
    if (!formData.method) {
      newErrors.method = 'Payment method is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Payment date is required';
    }
    
    if (formData.date && new Date(formData.date) > new Date()) {
      newErrors.date = 'Payment date cannot be in the future';
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
      await onSave({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      
      toast.success('Payment recorded successfully');
      onClose();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = () => {
    return CURRENCIES.find(c => c.value === invoice?.currency)?.symbol || '$';
  };

  const handleQuickAmount = (percentage) => {
    const amount = (invoice.balanceDue * percentage / 100).toFixed(2);
    handleInputChange('amount', parseFloat(amount));
  };

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Record Payment
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <ApperIcon name="X" size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Invoice Summary */}
          <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Invoice:</span>
              <span className="font-medium">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Total Amount:</span>
              <span>{getCurrencySymbol()}{invoice.total?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Amount Paid:</span>
              <span>{getCurrencySymbol()}{invoice.amountPaid?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t border-slate-300 dark:border-slate-600 pt-2">
              <span>Balance Due:</span>
              <span className="text-primary-600">{getCurrencySymbol()}{invoice.balanceDue?.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Amount */}
          <FormField
            label="Payment Amount *"
            error={errors.amount}
            input={
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                    {getCurrencySymbol()}
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
                
                {/* Quick Amount Buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(25)}
                    className="text-xs"
                  >
                    25%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(50)}
                    className="text-xs"
                  >
                    50%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(100)}
                    className="text-xs"
                  >
                    Full
                  </Button>
                </div>
              </div>
            }
          />

          {/* Payment Method */}
          <FormField
            label="Payment Method *"
            error={errors.method}
            input={
              <Select
                value={formData.method}
                onChange={(value) => handleInputChange('method', value)}
                options={PAYMENT_METHODS}
              />
            }
          />

          {/* Payment Date */}
          <FormField
            label="Payment Date *"
            error={errors.date}
            input={
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            }
          />

          {/* Reference/Transaction ID */}
          <FormField
            label="Reference/Transaction ID"
            input={
              <Input
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                placeholder="Check number, transaction ID, etc."
              />
            }
          />

          {/* Notes */}
          <FormField
            label="Payment Notes"
            input={
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional payment notes..."
              />
            }
          />

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
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
              Record Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;