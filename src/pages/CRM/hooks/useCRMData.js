import { useEffect, useState } from 'react';
import {
  getAllCustomers,
} from '../../../apis/customerCRMService.jsx';
import {
  getAllTransactions
} from '../../../apis/transactionCRMService.jsx';
import { getAllEmailTemplate } from '../../../apis/emailTemplateService.jsx';
export const useCRMData = () => {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [emailHistory, setEmailHistory] = useState({}); // State để chứa email history
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);


  const loadEmailTemplates = async () => {
    try {
      const data = await getAllEmailTemplate();
      setEmailTemplates(data || []);
    } catch (error) {
      console.error('Error loading email templates:', error);
      setEmailTemplates([]);
    }
  }
   const loadData = async () => {
      try {
        setLoading(true);
        
        const [customersData, transactionsData, ] = await Promise.all([
          getAllCustomers(),
          getAllTransactions(),
        ]);
        
        setCustomers(customersData);
        setTransactions(transactionsData);
      } catch (err) {
        setError(err.message);
        console.error('Error loading CRM data:', err);
      } finally {
        setLoading(false);
      }
    };

  // Load initial data
  useEffect(() => {
    loadEmailTemplates()
    loadData();
  }, []);

  // Refresh email templates when trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadEmailTemplates();
    }
  }, [refreshTrigger]);

  // Filter customers based on criteria
  const getFilteredCustomers = (filters, customersData = customers) => {
    return customersData.filter(customer => {
      if (filters.status && customer.status !== filters.status) return false;
      if (filters.company && !customer.company?.toLowerCase()?.includes(filters.company?.toLowerCase())) return false;
      if (filters.minSpent && customer.total_spent < parseInt(filters?.minSpent)) return false;
      if (filters.lastContactDays) {
        // Kiểm tra nếu không có last_contact thì bỏ qua filter này
        if (!customer.last_contact) return true;
        
        const daysSinceContact = Math.floor((new Date() - new Date(customer.last_contact)) / (1000 * 60 * 60 * 24));
        if (daysSinceContact < parseInt(filters?.lastContactDays)) return false;
      }
      return true;
    });
  };

  // Get email history from customer data (no API call needed)
  const getEmailHistory = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.emailHistory || [];
  };

  // Calculate days since last contact
  const getDaysSinceContact = (lastContactDate) => {
    if (!lastContactDate) return 0; // Trả về 0 nếu không có ngày contact
    
    const today = new Date();
    const contactDate = new Date(lastContactDate);
    const diffTime = Math.abs(today - contactDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get color class based on days since contact
  const getContactStatusColor = (days) => {
    if (days > 30) return 'text-red-600 bg-red-50';
    if (days > 20) return 'text-orange-600 bg-orange-50';
    if (days > 7) return 'text-pink-600 bg-pink-50';
    return 'text-green-600 bg-green-50';
  };

  // Format email history for display from customer data
  const getEmailHistoryDisplay = (customerId) => {
    const history = getEmailHistory(customerId);
    const today = new Date();
    
    return history.map(email => {
      const emailDate = new Date(email.email_date);
      const daysAgo = Math.ceil((today - emailDate) / (1000 * 60 * 60 * 24));
      return { ...email, daysAgo };
    }).sort((a, b) => a.daysAgo - b.daysAgo);
  };

  // Function to trigger email templates refresh
  const refreshEmailTemplates = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return {
    customers,
    transactions,
    emailTemplates,
    loading,
    error,
    getFilteredCustomers,
    getEmailHistory,
    getDaysSinceContact,
    getContactStatusColor,
    getEmailHistoryDisplay,
    refreshEmailTemplates
  };
};
