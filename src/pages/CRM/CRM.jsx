import React, { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';

// Import components
import AutomatorTab from './components/AutomatorTab/AutomatorTab';
import EmailPanel from './components/EmailPanel/EmailPanel';
import EmailReportDashboard from './components/EmailReportDashboard/EmailReportDashboard';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';

// Import hooks
import { useCRMData } from './hooks/useCRMData';
import { useEmailCampaign } from './hooks/useEmailCampaign';

// Import styles
import styles from './CRM.module.css';

export default function CRM() {
  const [activeTab, setActiveTab] = useState('Data');
  const [activeTable, setActiveTable] = useState('Customer');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [showEmailHistory, setShowEmailHistory] = useState({});
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    company: '',
    minSpent: '',
    lastContactDays: ''
  });

  // CustomerTable states
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [showCareEventPanel, setShowCareEventPanel] = useState(false);

  // Load CRM data
  const {
    customers,
    transactions,
    emailTemplates,
    emailHistory,
    loading,
    error,
    getFilteredCustomers,
    loadEmailHistory,
    getEmailHistory,
    getDaysSinceContact,
    getContactStatusColor,
    getEmailHistoryDisplay,
    refreshEmailTemplates
  } = useCRMData();


  // Email campaign functionality
  const {
    emailSettings,
    showEmailPanel: showEmailCampaignPanel,
    sending,
    scheduledJobs,
    jobStatus,
    updateEmailSettings,
    handleTemplateChange,
    sendEmailCampaign,
    toggleEmailPanel: toggleEmailCampaignPanel,
    checkJobStatus,
    monitorScheduledJobs
  } = useEmailCampaign(emailTemplates);

  // Get filtered customers (for other components that need it)
  const filteredCustomers = useMemo(() => {
    return getFilteredCustomers(filters);
  }, [customers, filters, getFilteredCustomers]);

  // Customer selection handlers
  const handleSelectionChange = (selectedCustormer) => {
    setSelectedCustomers(selectedCustormer);
  };

  const handleSelectAll = () => {
    // This will be handled by CustomerTable internally
    // We just need to sync the selection state
  };

  // Email history handlers
  const toggleEmailHistory = (customerId) => {
    setShowEmailHistory(prev => ({
      ...prev,
      [customerId]: !prev[customerId]
    }));
  };

  // Panel handlers
  const handleToggleEmailPanel = () => {
    setShowEmailPanel(prev => !prev);
  };

  const handleToggleCareEventPanel = () => {
    setShowCareEventPanel(prev => !prev);
  };

  // Filter handlers
  const handleFiltersChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Email campaign handlers
  const handleSendEmail = async () => {
    try {
      await sendEmailCampaign(selectedCustomers);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  // Tab change handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);  
    // if (tab === 'Email Template') {
    //   // Auto-select customers if none selected
    //   if (selectedCustomers.length === 0 && customers.length > 0) {
    //     setSelectedCustomers(customers.map(c => c.id));
    //   }
    // }
  };

  // Table change handler
  const handleTableChange = (table) => {
    setActiveTable(table);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.crmContainer}>
      {/* Header */}
      <Header 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />

      <div className={styles.mainContent}>
        {/* Sidebar - only show in Data tab */}
        {activeTab === 'Data' && (
          <Sidebar 
            activeTable={activeTable} 
            onTableChange={handleTableChange} 
          />
        )}

        {/* Main Content Area */}
        <div className={styles.contentArea}>
          {activeTab === 'Email Template' ? (
            <AutomatorTab refreshEmailTemplates={refreshEmailTemplates} />
          ) : activeTab === 'Báo cáo' ? (
            <EmailReportDashboard />
          ) : (
            <Outlet context={{
              // CRM data
              customers,
              transactions,
              emailTemplates,
              emailHistory,
              loading,
              error,
              filteredCustomers,
              
              // Functions
              getEmailHistory,
              getEmailHistoryDisplay,
              getDaysSinceContact,
              getContactStatusColor,
              loadEmailHistory,
              refreshEmailTemplates,
              
              // States
              showEmailHistory,
              selectedCustomers,
              filters,
              
              // Handlers
              onSelectionChange: handleSelectionChange,
              onToggleEmailHistory: toggleEmailHistory,
              onToggleEmailPanel: handleToggleEmailPanel,
              onToggleCareEventPanel: handleToggleCareEventPanel,
              onFiltersChange: handleFiltersChange,
              
              // Panel states
              showEmailPanel,
              showCareEventPanel
            }} />
          )}
        </div>
      </div>

      {/* Email Panel Modal */}
      <EmailPanel
        isVisible={showEmailPanel}
        onClose={handleToggleEmailPanel}
        emailSettings={emailSettings}
        onTemplateChange={handleTemplateChange}
        onEmailSettingsChange={updateEmailSettings}
        onSendEmail={handleSendEmail}
        selectedCustomers={selectedCustomers}
      />

    </div>
  );
}