import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import Button from '@/components/atoms/Button'
import Input from '@/components/atoms/Input'
import Select from '@/components/atoms/Select'
import Label from '@/components/atoms/Label'
import FormField from '@/components/molecules/FormField'
import ApperIcon from '@/components/ApperIcon'
import clientService from '@/services/api/clientService'

const CLIENT_TYPES = [
  { value: 'Individual', label: 'Individual' },
  { value: 'Company', label: 'Company' },
  { value: 'Agency', label: 'Agency' }
]

const CLIENT_STATUSES = [
  { value: 'Prospect', label: 'Prospect' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Archived', label: 'Archived' }
]

const PAYMENT_TERMS = [
  { value: 'Due on receipt', label: 'Due on receipt' },
  { value: 'Net 15', label: 'Net 15' },
  { value: 'Net 30', label: 'Net 30' },
  { value: 'Net 60', label: 'Net 60' }
]

const PAYMENT_METHODS = [
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Credit Card', label: 'Credit Card' },
  { value: 'Check', label: 'Check' },
  { value: 'PayPal', label: 'PayPal' },
  { value: 'Cash', label: 'Cash' }
]

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' }
]

function ClientForm({ client, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    mobilePhone: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    },
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    },
    useSameAddress: true,
    taxId: '',
    paymentTerms: 'Net 30',
    paymentMethod: 'Bank Transfer',
    currency: 'USD',
    status: 'Prospect',
    clientType: 'Company',
    industry: '',
    companySize: '',
    referralSource: '',
    clientSince: '',
    tags: [],
    internalNotes: '',
    contacts: []
  })
  
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

useEffect(() => {
    if (client) {
      setFormData({
        company: client.company || '',
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        mobilePhone: client.mobilePhone || '',
        website: client.website || '',
        address: {
          street: client.address?.street || '',
          city: client.address?.city || '',
          state: client.address?.state || '',
          zip: client.address?.zip || '',
          country: client.address?.country || 'US'
        },
        billingAddress: client.billingAddress || {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: 'US'
        },
        useSameAddress: client.useSameAddress !== false,
        taxId: client.taxId || '',
        paymentTerms: client.paymentTerms || 'Net 30',
        paymentMethod: client.paymentMethod || 'Bank Transfer',
        currency: client.currency || 'USD',
        status: client.status || 'Prospect',
        clientType: client.clientType || 'Company',
        industry: client.industry || '',
        companySize: client.companySize || '',
        referralSource: client.referralSource || '',
        clientSince: client.clientSince || '',
        tags: client.tags || [],
        internalNotes: client.internalNotes || '',
        contacts: client.contacts || []
      })
    } else {
      setFormData({
        company: '',
        name: '',
        email: '',
        phone: '',
        mobilePhone: '',
        website: '',
        address: {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: 'US'
        },
        billingAddress: {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: 'US'
        },
        useSameAddress: true,
        taxId: '',
        paymentTerms: 'Net 30',
        paymentMethod: 'Bank Transfer',
        currency: 'USD',
        status: 'Prospect',
        clientType: 'Company',
        industry: '',
        companySize: '',
        referralSource: '',
        clientSince: '',
        tags: [],
        internalNotes: '',
        contacts: []
      })
    }
    setErrors({})
  }, [client, isOpen])

  const handleTagsChange = (value) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
    handleChange('tags', tags)
  }

  const addContact = () => {
    const newContacts = [...formData.contacts, {
      name: '',
      title: '',
      email: '',
      phone: '',
      mobile: '',
      isPrimary: formData.contacts.length === 0
    }]
    handleChange('contacts', newContacts)
  }

  const updateContact = (index, field, value) => {
    const updatedContacts = [...formData.contacts]
    updatedContacts[index] = { ...updatedContacts[index], [field]: value }
    handleChange('contacts', updatedContacts)
  }

  const removeContact = (index) => {
    const updatedContacts = formData.contacts.filter((_, i) => i !== index)
    // If removing primary contact and others exist, make first one primary
    if (updatedContacts.length > 0 && formData.contacts[index].isPrimary) {
      updatedContacts[0].isPrimary = true
    }
    handleChange('contacts', updatedContacts)
  }

  const setPrimaryContact = (index) => {
    const updatedContacts = formData.contacts.map((contact, i) => ({
      ...contact,
      isPrimary: i === index
    }))
    handleChange('contacts', updatedContacts)
  }

function validateForm() {
    const newErrors = {}

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required'
    }

    // Validate primary contact or legacy email field
    const primaryContact = formData.contacts.find(c => c.isPrimary)
    if (!primaryContact && !formData.email.trim()) {
      newErrors.email = 'Email is required (either in contacts or main email field)'
    } else if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid URL (include http:// or https://)'
    }

    // Validate contacts
    formData.contacts.forEach((contact, index) => {
      if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        newErrors[`contact_${index}_email`] = 'Please enter a valid email address'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleChange(field, value) {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  function handleUseSameAddressChange(checked) {
    setFormData(prev => ({
      ...prev,
      useSameAddress: checked,
      billingAddress: checked ? { ...prev.address } : prev.billingAddress
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setLoading(true)

    try {
      const submitData = {
        ...formData,
        billingAddress: formData.useSameAddress ? formData.address : formData.billingAddress
      }

      let savedClient
      if (client) {
        savedClient = await clientService.update(client.Id, submitData)
        toast.success('Client updated successfully')
      } else {
        savedClient = await clientService.create(submitData)
        toast.success('Client created successfully')
      }
      
      onSave(savedClient)
      onClose()
    } catch (error) {
      toast.error(error.message || 'Failed to save client')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {client ? 'Edit Client' : 'Create New Client'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ApperIcon name="X" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Company Name"
                  required
                  error={errors.company}
                >
                  <Input
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    placeholder="Enter company name"
                  />
                </FormField>

                <FormField
                  label="Contact Person"
                  error={errors.name}
                >
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter contact person name"
                  />
                </FormField>

                <FormField
                  label="Email"
                  required
                  error={errors.email}
                >
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </FormField>

                <FormField
                  label="Phone"
                  error={errors.phone}
                >
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </FormField>

                <FormField
                  label="Mobile Phone"
                  error={errors.mobilePhone}
                >
                  <Input
                    value={formData.mobilePhone}
                    onChange={(e) => handleChange('mobilePhone', e.target.value)}
                    placeholder="Enter mobile phone number"
                  />
                </FormField>

                <FormField
                  label="Website"
                  error={errors.website}
                >
                  <Input
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </FormField>

                <FormField
                  label="Industry"
                  error={errors.industry}
                >
                  <Input
                    value={formData.industry}
                    onChange={(e) => handleChange('industry', e.target.value)}
                    placeholder="Enter industry"
                  />
                </FormField>

                <FormField
                  label="Tax ID / VAT Number"
                  error={errors.taxId}
                >
                  <Input
                    value={formData.taxId}
                    onChange={(e) => handleChange('taxId', e.target.value)}
                    placeholder="Enter tax ID or VAT number"
                  />
                </FormField>
              </div>
            </div>

            {/* Classification */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                Classification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  label="Client Type"
                  error={errors.clientType}
                >
                  <Select
                    value={formData.clientType}
                    onChange={(e) => handleChange('clientType', e.target.value)}
                    options={CLIENT_TYPES}
                  />
                </FormField>

                <FormField
                  label="Status"
                  error={errors.status}
                >
                  <Select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    options={CLIENT_STATUSES}
                  />
                </FormField>
              </div>
            </div>

            {/* Physical Address */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                Physical Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <FormField
                    label="Street Address"
                    error={errors['address.street']}
                  >
                    <Input
                      value={formData.address.street}
                      onChange={(e) => handleChange('address.street', e.target.value)}
                      placeholder="Enter street address"
                    />
                  </FormField>
                </div>

                <FormField
                  label="City"
                  error={errors['address.city']}
                >
                  <Input
                    value={formData.address.city}
                    onChange={(e) => handleChange('address.city', e.target.value)}
                    placeholder="Enter city"
                  />
                </FormField>

                <FormField
                  label="State/Province"
                  error={errors['address.state']}
                >
                  <Input
                    value={formData.address.state}
                    onChange={(e) => handleChange('address.state', e.target.value)}
                    placeholder="Enter state or province"
                  />
                </FormField>

                <FormField
                  label="ZIP/Postal Code"
                  error={errors['address.zip']}
                >
                  <Input
                    value={formData.address.zip}
                    onChange={(e) => handleChange('address.zip', e.target.value)}
                    placeholder="Enter ZIP or postal code"
                  />
                </FormField>

                <FormField
                  label="Country"
                  error={errors['address.country']}
                >
                  <Input
                    value={formData.address.country}
                    onChange={(e) => handleChange('address.country', e.target.value)}
                    placeholder="Enter country"
                  />
                </FormField>
              </div>
            </div>

            {/* Billing Address */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                  Billing Address
                </h3>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={formData.useSameAddress}
                    onChange={(e) => handleUseSameAddressChange(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Same as physical address
                </label>
              </div>
              
              {!formData.useSameAddress && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      label="Street Address"
                      error={errors['billingAddress.street']}
                    >
                      <Input
                        value={formData.billingAddress.street}
                        onChange={(e) => handleChange('billingAddress.street', e.target.value)}
                        placeholder="Enter billing street address"
                      />
                    </FormField>
                  </div>

                  <FormField
                    label="City"
                    error={errors['billingAddress.city']}
                  >
                    <Input
                      value={formData.billingAddress.city}
                      onChange={(e) => handleChange('billingAddress.city', e.target.value)}
                      placeholder="Enter billing city"
                    />
                  </FormField>

                  <FormField
                    label="State/Province"
                    error={errors['billingAddress.state']}
                  >
                    <Input
                      value={formData.billingAddress.state}
                      onChange={(e) => handleChange('billingAddress.state', e.target.value)}
                      placeholder="Enter billing state or province"
                    />
                  </FormField>

                  <FormField
                    label="ZIP/Postal Code"
                    error={errors['billingAddress.zip']}
                  >
                    <Input
                      value={formData.billingAddress.zip}
                      onChange={(e) => handleChange('billingAddress.zip', e.target.value)}
                      placeholder="Enter billing ZIP or postal code"
                    />
                  </FormField>

                  <FormField
                    label="Country"
                    error={errors['billingAddress.country']}
                  >
                    <Input
                      value={formData.billingAddress.country}
                      onChange={(e) => handleChange('billingAddress.country', e.target.value)}
                      placeholder="Enter billing country"
                    />
                  </FormField>
                </div>
              )}
            </div>

            {/* Payment Information */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                Payment Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  label="Payment Terms"
                  error={errors.paymentTerms}
                >
                  <Select
                    value={formData.paymentTerms}
                    onChange={(e) => handleChange('paymentTerms', e.target.value)}
                    options={PAYMENT_TERMS}
                  />
                </FormField>

                <FormField
                  label="Preferred Payment Method"
                  error={errors.paymentMethod}
                >
                  <Select
                    value={formData.paymentMethod}
                    onChange={(e) => handleChange('paymentMethod', e.target.value)}
                    options={PAYMENT_METHODS}
                  />
                </FormField>

                <FormField
                  label="Currency"
                  error={errors.currency}
                >
                  <Select
                    value={formData.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    options={CURRENCIES}
                  />
                </FormField>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 p-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
            >
              {client ? 'Update Client' : 'Create Client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClientForm