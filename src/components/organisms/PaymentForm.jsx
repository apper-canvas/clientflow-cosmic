import React, { useState } from "react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { CURRENCIES, PAYMENT_METHODS } from "@/services/api/invoiceService";
import ApperIcon from "@/components/ApperIcon";
import Select from "@/components/atoms/Select";
import Label from "@/components/atoms/Label";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import FormField from "@/components/molecules/FormField";

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-sm sm:max-w-md lg:max-w-lg max-h-[90vh] sm:max-h-[85vh] mx-2 sm:mx-4 flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
            Record Payment
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex-shrink-0 min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto"
          >
            <ApperIcon name="X" size={20} />
          </Button>
        </div>

<div className="flex-1 overflow-y-auto min-h-0">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Invoice Summary */}
            <div className="bg-slate-50 dark:bg-slate-700 p-3 sm:p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between items-start">
                <span className="text-slate-600 dark:text-slate-400">Invoice:</span>
                <span className="font-medium text-right">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-600 dark:text-slate-400">Total Amount:</span>
                <span className="text-right">{getCurrencySymbol()}{invoice.total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-600 dark:text-slate-400">Amount Paid:</span>
                <span className="text-right">{getCurrencySymbol()}{invoice.amountPaid?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-start font-semibold text-base border-t border-slate-300 dark:border-slate-600 pt-2">
                <span>Balance Due:</span>
                <span className="text-primary-600 text-right">{getCurrencySymbol()}{invoice.balanceDue?.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Amount */}
            <FormField
              label="Payment Amount *"
              error={errors.amount}
              input={
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 z-10">
                      {getCurrencySymbol()}
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                      className="pl-8 min-h-[44px]"
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
                      className="text-xs flex-1 min-h-[44px]"
                    >
                      25%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAmount(50)}
                      className="text-xs flex-1 min-h-[44px]"
                    >
                      50%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAmount(100)}
                      className="text-xs flex-1 min-h-[44px]"
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
                  className="min-h-[44px]"
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
                  className="min-h-[44px]"
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
                  className="min-h-[44px]"
                />
              }
            />

            {/* Notes */}
            <FormField
              label="Payment Notes"
              input={
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 min-h-[88px] resize-none"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional payment notes..."
                />
              }
            />
          </form>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="min-h-[44px] px-4 sm:px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            onClick={handleSubmit}
            className="min-h-[44px] px-4 sm:px-6"
          >
            Record Payment
          </Button>
        </div>
</div>
    </div>
  );
};

export default PaymentForm;