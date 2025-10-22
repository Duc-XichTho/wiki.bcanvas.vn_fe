import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AnalysisReview from './AnalysisReview';
import DataTab from './components/tabs/DataTab';
import ReportsTab from './components/tabs/ReportsTab';
import ReportBuilderTab from './components/tabs/ReportBuilderTab';
import DataDetail from './components/tabs/DataDetail';
import ReportDetail from './components/tabs/ReportDetail';

const AnalysisReviewRoutes = () => {
  // Sample data - in real app this would come from props or context
  const dataItems = [
    { id: 1, name: 'Sales Q1 2025', type: 'CSV', size: '2.5MB', lastModified: '2 hours ago' },
    { id: 2, name: 'Customer Database', type: 'Excel', size: '4.1MB', lastModified: '1 day ago' },
    { id: 3, name: 'Product Inventory', type: 'JSON', size: '1.2MB', lastModified: '3 days ago' },
    { id: 4, name: 'Marketing Metrics', type: 'CSV', size: '856KB', lastModified: '1 week ago' }
  ];

  const reports = [
    { id: 1, name: 'Sales Performance Report', type: 'Analytics', created: '2024-07-15', status: 'Published' },
    { id: 2, name: 'Customer Segmentation', type: 'ML Analysis', created: '2024-07-14', status: 'Draft' },
    { id: 3, name: 'Inventory Forecast', type: 'Prediction', created: '2024-07-12', status: 'Published' },
    { id: 4, name: 'Marketing ROI Analysis', type: 'Analytics', created: '2024-07-10', status: 'Processing' }
  ];

  return (
    <Routes>
      <Route path="/" element={<AnalysisReview />}>
        <Route index element={<DataTab dataItems={dataItems} />} />
        <Route path="data" element={<DataTab dataItems={dataItems} />} />
        <Route path="data/:id" element={<DataDetail dataItems={dataItems} />} />
        <Route path="reports" element={<ReportsTab reports={reports} />} />
        <Route path="reports/:id" element={<ReportDetail reports={reports} />} />
        <Route path="builder" element={<ReportBuilderTab />} />
      </Route>
    </Routes>
  );
};

export default AnalysisReviewRoutes; 