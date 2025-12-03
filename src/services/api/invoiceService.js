import invoicesData from '@/services/mockData/invoices.json';
import { format, isAfter, isBefore, parseISO, differenceInDays } from 'date-fns';

// In-memory storage for mock data
let invoices = [...invoicesData];
let nextId = Math.max(...invoices.map(inv => inv.Id)) + 1;
let invoiceCounter = invoices.length + 1;

// Credit notes storage
let creditNotes = [];
let nextCreditId = 1;
let creditCounter = 1;

// Invoice statuses and their workflow
export const INVOICE_STATUSES = {
  DRAFT: 'draft',
  SENT: 'sent', 
  VIEWED: 'viewed',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

// Credit note statuses
export const CREDIT_NOTE_STATUSES = {
  DRAFT: 'draft',
  APPLIED: 'applied',
  CANCELLED: 'cancelled'
};

export const PAYMENT_TERMS = [
  { value: 'due_on_receipt', label: 'Due on receipt' },
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_60', label: 'Net 60' }
];

export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'other', label: 'Other' }
];

export const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' }
];

// Delay function for realistic API simulation
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate invoice number
function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const number = String(invoiceCounter++).padStart(3, '0');
  return `INV-${year}-${number}`;
}

// Generate credit note number
function generateCreditNoteNumber() {
  const year = new Date().getFullYear();
  const number = String(creditCounter++).padStart(3, '0');
  return `CN-${year}-${number}`;
}

// Calculate invoice totals
function calculateTotals(lineItems, taxRate = 0, discountAmount = 0, discountType = 'fixed') {
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  
  let discount = 0;
  if (discountType === 'percentage') {
    discount = (subtotal * discountAmount) / 100;
  } else {
    discount = discountAmount;
  }
  
  const discountedSubtotal = subtotal - discount;
  const tax = (discountedSubtotal * taxRate) / 100;
  const total = discountedSubtotal + tax;
  
  return {
    subtotal,
    discount,
    tax,
    total
  };
}

// Check if invoice is overdue
function isInvoiceOverdue(invoice) {
  if (invoice.status === INVOICE_STATUSES.PAID || invoice.status === INVOICE_STATUSES.CANCELLED) {
    return false;
  }
  return isAfter(new Date(), parseISO(invoice.dueDate));
}

// Update invoice status based on conditions
function updateInvoiceStatus(invoice) {
  if (isInvoiceOverdue(invoice) && invoice.status === INVOICE_STATUSES.SENT) {
    invoice.status = INVOICE_STATUSES.OVERDUE;
  }
  
  // Check if fully paid
  if (invoice.amountPaid >= invoice.total && invoice.status !== INVOICE_STATUSES.PAID) {
    invoice.status = INVOICE_STATUSES.PAID;
    if (!invoice.paidDate) {
      invoice.paidDate = format(new Date(), 'yyyy-MM-dd');
    }
  }
  
  return invoice;
}

const invoiceService = {
  // Get all invoices
  async getAll() {
    await delay(300);
    
    // Update statuses for all invoices
    const updatedInvoices = invoices.map(invoice => updateInvoiceStatus({ ...invoice }));
    
    return updatedInvoices.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
  },

  // Get invoice by ID
  async getById(id) {
    await delay(200);
    const invoice = invoices.find(inv => inv.Id === parseInt(id));
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    return updateInvoiceStatus({ ...invoice });
  },

  // Create new invoice
  async create(invoiceData) {
    await delay(400);
    
    const totals = calculateTotals(
      invoiceData.items || [],
      invoiceData.taxRate || 0,
      invoiceData.discountAmount || 0,
      invoiceData.discountType || 'fixed'
    );
    
    const newInvoice = {
      Id: nextId++,
      invoiceNumber: generateInvoiceNumber(),
      clientId: invoiceData.clientId,
      projectId: invoiceData.projectId || null,
      status: invoiceData.status || INVOICE_STATUSES.DRAFT,
      issueDate: invoiceData.issueDate || format(new Date(), 'yyyy-MM-dd'),
      dueDate: invoiceData.dueDate,
      currency: invoiceData.currency || 'USD',
      paymentTerms: invoiceData.paymentTerms || 'net_30',
      items: invoiceData.items || [],
      subtotal: totals.subtotal,
      taxRate: invoiceData.taxRate || 0,
      taxAmount: totals.tax,
      discountAmount: invoiceData.discountAmount || 0,
      discountType: invoiceData.discountType || 'fixed',
      discountValue: totals.discount,
      total: totals.total,
      amountPaid: 0,
      balanceDue: totals.total,
      notes: invoiceData.notes || '',
      termsAndConditions: invoiceData.termsAndConditions || '',
      thankYouMessage: invoiceData.thankYouMessage || 'Thank you for your business!',
      paidDate: null,
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    invoices.push(newInvoice);
    return { ...newInvoice };
  },

  // Update invoice
  async update(id, updates) {
    await delay(300);
    
    const index = invoices.findIndex(inv => inv.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Invoice not found');
    }
    
    const currentInvoice = invoices[index];
    
    // Don't allow editing sent invoices unless changing status
    if (currentInvoice.status !== INVOICE_STATUSES.DRAFT && 
        !updates.status && 
        Object.keys(updates).some(key => key !== 'status')) {
      throw new Error('Cannot edit invoice that has been sent');
    }
    
    // Recalculate totals if line items changed
    let totals = {};
    if (updates.items) {
      totals = calculateTotals(
        updates.items,
        updates.taxRate ?? currentInvoice.taxRate,
        updates.discountAmount ?? currentInvoice.discountAmount,
        updates.discountType ?? currentInvoice.discountType
      );
    }
    
    const updatedInvoice = {
      ...currentInvoice,
      ...updates,
      ...totals,
      balanceDue: (totals.total ?? currentInvoice.total) - currentInvoice.amountPaid,
      updatedAt: new Date().toISOString()
    };
    
    invoices[index] = updateInvoiceStatus(updatedInvoice);
    return { ...invoices[index] };
  },

  // Delete invoice
  async delete(id) {
    await delay(200);
    
    const index = invoices.findIndex(inv => inv.Id === parseInt(id));
    if (index === -1) {
      throw new Error('Invoice not found');
    }
    
    const invoice = invoices[index];
    if (invoice.status === INVOICE_STATUSES.PAID) {
      throw new Error('Cannot delete paid invoice');
    }
    
    invoices.splice(index, 1);
    return true;
  },

  // Record payment
  async recordPayment(invoiceId, paymentData) {
    await delay(300);
    
    const index = invoices.findIndex(inv => inv.Id === parseInt(invoiceId));
    if (index === -1) {
      throw new Error('Invoice not found');
    }
    
    const invoice = invoices[index];
    const remainingBalance = invoice.total - invoice.amountPaid;
    
    if (paymentData.amount > remainingBalance) {
      throw new Error('Payment amount cannot exceed remaining balance');
    }
    
    const payment = {
      Id: Date.now(),
      amount: paymentData.amount,
      method: paymentData.method,
      reference: paymentData.reference || '',
      notes: paymentData.notes || '',
      date: paymentData.date || format(new Date(), 'yyyy-MM-dd'),
      createdAt: new Date().toISOString()
    };
    
    invoice.payments = invoice.payments || [];
    invoice.payments.push(payment);
    invoice.amountPaid += paymentData.amount;
    invoice.balanceDue = invoice.total - invoice.amountPaid;
    
    // Update status if fully paid
    if (invoice.amountPaid >= invoice.total) {
      invoice.status = INVOICE_STATUSES.PAID;
      if (!invoice.paidDate) {
        invoice.paidDate = payment.date;
      }
    }
    
    invoice.updatedAt = new Date().toISOString();
    invoices[index] = invoice;
    
    return { ...invoice };
  },

  // Duplicate invoice
  async duplicate(id) {
    await delay(300);
    
    const original = invoices.find(inv => inv.Id === parseInt(id));
    if (!original) {
      throw new Error('Invoice not found');
    }
    
    const duplicated = {
      ...original,
      Id: nextId++,
      invoiceNumber: generateInvoiceNumber(),
      status: INVOICE_STATUSES.DRAFT,
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 30 days from now
      amountPaid: 0,
      balanceDue: original.total,
      paidDate: null,
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    invoices.push(duplicated);
    return { ...duplicated };
  },

  // Get outstanding invoices
  async getOutstanding() {
    await delay(200);
    
    const outstanding = invoices
      .map(invoice => updateInvoiceStatus({ ...invoice }))
      .filter(invoice => 
        invoice.status !== INVOICE_STATUSES.PAID && 
        invoice.status !== INVOICE_STATUSES.CANCELLED &&
        invoice.status !== INVOICE_STATUSES.DRAFT
      )
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    return outstanding;
  },

  // Get dashboard stats
  async getDashboardStats() {
    await delay(200);
    
    const allInvoices = invoices.map(invoice => updateInvoiceStatus({ ...invoice }));
    
    const stats = {
      totalInvoices: allInvoices.length,
      totalOutstanding: allInvoices
        .filter(inv => inv.status !== INVOICE_STATUSES.PAID && inv.status !== INVOICE_STATUSES.CANCELLED)
        .reduce((sum, inv) => sum + inv.balanceDue, 0),
      totalPaid: allInvoices
        .filter(inv => inv.status === INVOICE_STATUSES.PAID)
        .reduce((sum, inv) => sum + inv.total, 0),
      overdueCount: allInvoices.filter(inv => inv.status === INVOICE_STATUSES.OVERDUE).length,
      recentInvoices: allInvoices
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    };
    
    return stats;
  },

  // Send invoice (mock)
  async sendInvoice(invoiceId, emailData) {
    await delay(500);
    
    const index = invoices.findIndex(inv => inv.Id === parseInt(invoiceId));
    if (index === -1) {
      throw new Error('Invoice not found');
    }
    
    const invoice = invoices[index];
    if (invoice.status === INVOICE_STATUSES.PAID || invoice.status === INVOICE_STATUSES.CANCELLED) {
      throw new Error('Cannot send paid or cancelled invoice');
    }
    
    // Update status to sent
    invoice.status = INVOICE_STATUSES.SENT;
    invoice.sentDate = format(new Date(), 'yyyy-MM-dd');
    invoice.updatedAt = new Date().toISOString();
    
    invoices[index] = invoice;
    
    // Mock email sending
    return {
      success: true,
      message: `Invoice ${invoice.invoiceNumber} sent successfully to ${emailData.to}`,
      sentAt: new Date().toISOString()
};
  },

  // Send reminder
  async sendReminder(invoiceId, reminderData) {
    await delay(500);
    
    const index = invoices.findIndex(inv => inv.Id === parseInt(invoiceId));
    if (index === -1) {
      throw new Error('Invoice not found');
    }
    
    const invoice = invoices[index];
    if (invoice.status === INVOICE_STATUSES.PAID || invoice.status === INVOICE_STATUSES.CANCELLED) {
      throw new Error('Cannot send reminder for paid or cancelled invoice');
    }
    
    // Initialize reminders array if not exists
    if (!invoice.reminders) {
      invoice.reminders = [];
    }
    
    const reminder = {
      Id: Date.now(),
      type: reminderData.type || 'manual',
      message: reminderData.message || 'Payment reminder',
      sentDate: format(new Date(), 'yyyy-MM-dd'),
      sentBy: reminderData.sentBy || 'System',
      createdAt: new Date().toISOString()
    };
    
    invoice.reminders.push(reminder);
    invoice.lastReminderDate = reminder.sentDate;
    invoice.updatedAt = new Date().toISOString();
    
    invoices[index] = invoice;
    
    return {
      success: true,
      message: `Reminder sent successfully for invoice ${invoice.invoiceNumber}`,
      reminderSent: reminder
    };
  },

  // Get aging report
  async getAgingReport() {
    await delay(300);
    
    const today = new Date();
    const outstandingInvoices = invoices
      .map(invoice => updateInvoiceStatus({ ...invoice }))
      .filter(invoice => 
        invoice.status !== INVOICE_STATUSES.PAID && 
        invoice.status !== INVOICE_STATUSES.CANCELLED &&
        invoice.status !== INVOICE_STATUSES.DRAFT
      );
    
    const agingBuckets = {
      current: [], // 0-30 days
      thirtyToSixty: [], // 31-60 days
      sixtyToNinety: [], // 61-90 days
      overNinety: [] // 90+ days
    };
    
    outstandingInvoices.forEach(invoice => {
      const daysPastDue = differenceInDays(today, parseISO(invoice.dueDate));
      
      if (daysPastDue <= 30) {
        agingBuckets.current.push(invoice);
      } else if (daysPastDue <= 60) {
        agingBuckets.thirtyToSixty.push(invoice);
      } else if (daysPastDue <= 90) {
        agingBuckets.sixtyToNinety.push(invoice);
      } else {
        agingBuckets.overNinety.push(invoice);
      }
    });
    
    // Calculate totals
    const totals = {
      current: agingBuckets.current.reduce((sum, inv) => sum + inv.balanceDue, 0),
      thirtyToSixty: agingBuckets.thirtyToSixty.reduce((sum, inv) => sum + inv.balanceDue, 0),
      sixtyToNinety: agingBuckets.sixtyToNinety.reduce((sum, inv) => sum + inv.balanceDue, 0),
      overNinety: agingBuckets.overNinety.reduce((sum, inv) => sum + inv.balanceDue, 0)
    };
    
    totals.total = totals.current + totals.thirtyToSixty + totals.sixtyToNinety + totals.overNinety;
    
    // Group by client
    const clientBreakdown = {};
    outstandingInvoices.forEach(invoice => {
      if (!clientBreakdown[invoice.clientId]) {
        clientBreakdown[invoice.clientId] = {
          current: 0,
          thirtyToSixty: 0,
          sixtyToNinety: 0,
          overNinety: 0,
          total: 0
        };
      }
      
      const daysPastDue = differenceInDays(today, parseISO(invoice.dueDate));
      const clientData = clientBreakdown[invoice.clientId];
      
      if (daysPastDue <= 30) {
        clientData.current += invoice.balanceDue;
      } else if (daysPastDue <= 60) {
        clientData.thirtyToSixty += invoice.balanceDue;
      } else if (daysPastDue <= 90) {
        clientData.sixtyToNinety += invoice.balanceDue;
      } else {
        clientData.overNinety += invoice.balanceDue;
      }
      
      clientData.total += invoice.balanceDue;
    });
    
    return {
      agingBuckets,
      totals,
      clientBreakdown,
      totalReceivables: totals.total,
      generatedAt: new Date().toISOString()
    };
  },

  // Create credit note
  async createCreditNote(creditNoteData) {
    await delay(400);
    
    const newCreditNote = {
      Id: nextCreditId++,
      creditNumber: generateCreditNoteNumber(),
      clientId: creditNoteData.clientId,
      invoiceId: creditNoteData.invoiceId || null,
      amount: creditNoteData.amount,
      reason: creditNoteData.reason || '',
      notes: creditNoteData.notes || '',
      status: CREDIT_NOTE_STATUSES.DRAFT,
      issueDate: creditNoteData.issueDate || format(new Date(), 'yyyy-MM-dd'),
      appliedAmount: 0,
      remainingAmount: creditNoteData.amount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    creditNotes.push(newCreditNote);
    return { ...newCreditNote };
  },

  // Get credit notes
  async getCreditNotes() {
    await delay(200);
    return [...creditNotes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Get credit notes by client
  async getCreditNotesByClient(clientId) {
    await delay(200);
    return creditNotes
      .filter(cn => cn.clientId === parseInt(clientId) && cn.remainingAmount > 0)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Apply credit note to invoice
  async applyCreditNote(creditNoteId, invoiceId, amount) {
    await delay(300);
    
    const creditNote = creditNotes.find(cn => cn.Id === parseInt(creditNoteId));
    if (!creditNote) {
      throw new Error('Credit note not found');
    }
    
    if (amount > creditNote.remainingAmount) {
      throw new Error('Amount cannot exceed remaining credit balance');
    }
    
    const invoiceIndex = invoices.findIndex(inv => inv.Id === parseInt(invoiceId));
    if (invoiceIndex === -1) {
      throw new Error('Invoice not found');
    }
    
    const invoice = invoices[invoiceIndex];
    if (amount > invoice.balanceDue) {
      throw new Error('Credit amount cannot exceed invoice balance');
    }
    
    // Update credit note
    creditNote.appliedAmount += amount;
    creditNote.remainingAmount -= amount;
    if (creditNote.remainingAmount <= 0) {
      creditNote.status = CREDIT_NOTE_STATUSES.APPLIED;
    }
    creditNote.updatedAt = new Date().toISOString();
    
    // Update invoice
    invoice.amountPaid += amount;
    invoice.balanceDue -= amount;
    
    // Add credit application record
    if (!invoice.creditApplications) {
      invoice.creditApplications = [];
    }
    
    invoice.creditApplications.push({
      Id: Date.now(),
      creditNoteId: creditNoteId,
      creditNumber: creditNote.creditNumber,
      amount: amount,
      appliedDate: format(new Date(), 'yyyy-MM-dd'),
      createdAt: new Date().toISOString()
    });
    
    // Update status if fully paid
    if (invoice.balanceDue <= 0) {
      invoice.status = INVOICE_STATUSES.PAID;
      if (!invoice.paidDate) {
        invoice.paidDate = format(new Date(), 'yyyy-MM-dd');
      }
    }
    
    invoice.updatedAt = new Date().toISOString();
    invoices[invoiceIndex] = invoice;
    
    return {
      invoice: { ...invoice },
      creditNote: { ...creditNote },
      applicationAmount: amount
    };
  }
};

export default invoiceService;