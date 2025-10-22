import React, { useState } from 'react';
import { Flex, Space, message, Form } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import components
import Header from './Header.jsx';
import JobTabs from './JobTabs.jsx';
import StoreFilter from './StoreFilter.jsx';
import SimpleChart from './SimpleChart.jsx';
import AnalysisNotes from './AnalysisNotes.jsx';
import ResultsTable from './ResultsTable.jsx';
import ForecastModal from './ForecastModal.jsx';
import ParameterLogModal from './ParameterLogModal.jsx';
import CampaignModal from './CampaignModal.jsx';
import DataPage from './DataPage.jsx';
import DataDetail from './DataDetail.jsx';

// Import utils
import { 
  generateForecastDates, 
  generateTableData, 
  chartData, 
  stores, 
  tags, 
  campaigns 
} from './utils.js';

const ForecastingApp = () => {
  const [activeJob, setActiveJob] = useState('total-sales');
  const [editingJob, setEditingJob] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStores, setSelectedStores] = useState(['store-1', 'store-2', 'store-3']);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showRunModal, setShowRunModal] = useState(false);
  const [showParameterLog, setShowParameterLog] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [lastRunTime, setLastRunTime] = useState('22/07/2025 14:30');
  const [lastRunParameters, setLastRunParameters] = useState(null);
  const [form] = Form.useForm();

  const [newCampaign, setNewCampaign] = useState({
    type: 'promotion',
    name: '',
    category: '',
    impact: '',
    budget: '',
    target: ''
  });

  const [forecastingJobs, setForecastingJobs] = useState([
    { id: 'total-sales', name: 'Total Sales' },
    { id: 'total-visitor', name: 'Total Visitor' },
    { id: 'total-order', name: 'Total Order' }
  ]);

  const [campaignsState, setCampaignsState] = useState(campaigns);
  const [forecastParameters, setForecastParameters] = useState(generateForecastDates());
  const tableData = generateTableData();

  const promotionTypes = campaignsState.promotions;
  const brandingTypes = campaignsState.branding;

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTags.length === 0 || selectedTags.includes(store.tag);
    return matchesSearch && matchesTag;
  });

  const handleJobEdit = (job) => {
    setEditingJob({ ...job });
  };

  const handleJobSave = () => {
    setForecastingJobs(jobs => jobs.map(job => 
      job.id === editingJob.id ? editingJob : job
    ));
    setEditingJob(null);
  };

  const handleJobCancel = () => {
    setEditingJob(null);
  };

  const handleStoreToggle = (storeId) => {
    setSelectedStores(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  const handleSelectAll = () => {
    const filteredIds = filteredStores.map(store => store.id);
    setSelectedStores(filteredIds);
  };

  const handleUnselectAll = () => {
    setSelectedStores([]);
  };

  const handleRunForecast = () => {
    setLastRunParameters({
      timestamp: new Date().toLocaleString('en-GB'),
      parameters: JSON.parse(JSON.stringify(forecastParameters))
    });
    setLastRunTime(new Date().toLocaleString('en-GB'));
    setShowRunModal(false);
    message.success('Forecast completed successfully!');
  };

  const handleParameterChange = (id, section, field, value) => {
    setForecastParameters(prev => prev.map(param => 
      param.id === id ? { 
        ...param, 
        [section]: {
          ...param[section],
          [field]: value
        }
      } : param
    ));
  };

  const handlePromotionChange = (id, promotionIndex, field, value) => {
    setForecastParameters(prev => prev.map(param => 
      param.id === id ? {
        ...param,
        [`promotion${promotionIndex}`]: {
          ...param[`promotion${promotionIndex}`],
          [field]: value
        }
      } : param
    ));
  };

  const handleCreateCampaign = () => {
    form.validateFields().then(values => {
      if (values.name.trim()) {
        if (values.type === 'promotion') {
          setCampaignsState(prev => ({
            ...prev,
            promotions: [...prev.promotions, values.name]
          }));
        } else {
          setCampaignsState(prev => ({
            ...prev,
            branding: [...prev.branding, values.name]
          }));
        }
        
        form.resetFields();
        setShowCampaignModal(false);
        message.success('Campaign created successfully!');
      }
    });
  };

  const getSelectionState = () => {
    const filteredIds = filteredStores.map(store => store.id);
    const selectedFromFiltered = selectedStores.filter(id => filteredIds.includes(id));
    
    if (selectedFromFiltered.length === 0) return 'none';
    if (selectedFromFiltered.length === filteredIds.length) return 'all';
    return 'partial';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            {/* Header */}
      <Header
        onRunForecast={() => setShowRunModal(true)}
      />

      {/* Main Content */}
      <Routes>
        <Route path="/" element={<Navigate to="results" replace />} />
        <Route path="results" element={
          <>
            {/* Job Tabs */}
            <JobTabs
              forecastingJobs={forecastingJobs}
              activeJob={activeJob}
              setActiveJob={setActiveJob}
              editingJob={editingJob}
              setEditingJob={setEditingJob}
              handleJobEdit={handleJobEdit}
              handleJobSave={handleJobSave}
              handleJobCancel={handleJobCancel}
            />

            <div style={{ padding: '0 24px 24px' }}>
              <Flex gap={24}>
                {/* Store Filter Sidebar */}
                <StoreFilter
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedTags={selectedTags}
                  setSelectedTags={setSelectedTags}
                  selectedStores={selectedStores}
                  handleStoreToggle={handleStoreToggle}
                  handleSelectAll={handleSelectAll}
                  handleUnselectAll={handleUnselectAll}
                  getSelectionState={getSelectionState}
                  filteredStores={filteredStores}
                  tags={tags}
                  lastRunTime={lastRunTime}
                />

                {/* Main Results */}
                <div style={{ flex: 1 }}>
                  <Space direction="vertical" size={24} style={{ width: '100%' }}>
                    {/* Chart and Summary */}
                    <Flex gap={24}>
                      <div style={{ flex: 2 }}>
                        <SimpleChart data={chartData} />
                      </div>
                      <AnalysisNotes />
                    </Flex>

                    {/* Results Table */}
                    <ResultsTable
                      tableData={tableData}
                      lastRunTime={lastRunTime}
                      lastRunParameters={lastRunParameters}
                      onViewParameters={() => setShowParameterLog(true)}
                    />
                  </Space>
                </div>
              </Flex>
            </div>
          </>
        } />
        <Route path="data" element={<DataPage />}>
          <Route path=":id" element={<DataDetail />} />
        </Route>
      </Routes>

      {/* Modals */}
      <ForecastModal
        showRunModal={showRunModal}
        setShowRunModal={setShowRunModal}
        forecastParameters={forecastParameters}
        handleParameterChange={handleParameterChange}
        handlePromotionChange={handlePromotionChange}
        promotionTypes={promotionTypes}
        brandingTypes={brandingTypes}
        onRunForecast={handleRunForecast}
        onCreateCampaign={() => setShowCampaignModal(true)}
      />

      <ParameterLogModal
        showParameterLog={showParameterLog}
        setShowParameterLog={setShowParameterLog}
        lastRunParameters={lastRunParameters}
      />

      <CampaignModal
        showCampaignModal={showCampaignModal}
        setShowCampaignModal={setShowCampaignModal}
        form={form}
        handleCreateCampaign={handleCreateCampaign}
      />

      <style jsx>{`
        .ant-table-row-forecast {
          background-color: #e6f7ff !important;
        }
      `}</style>
    </div>
  );
};

export default ForecastingApp; 