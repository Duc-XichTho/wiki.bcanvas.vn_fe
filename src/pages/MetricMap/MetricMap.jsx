import React, { useEffect, useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import CategorySidebar from './components/CategorySidebar/CategorySidebar';
import MainContent from './components/MainContent/MainContent';
import { useMetricMapData } from './hooks/useMetricMapData';
import styles from './MetricMap.module.css';

const MetricMap = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const {
    businessCategories,
    currentKpis,
    currentMeasures,
    loading,
    error,
    selectedCategory,
    setSelectedCategory,
    loadCategoryData,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleAddKPI,
    handleAddMeasure,
    handleEditKPI,
    handleEditMeasure,
    handleDeleteKPI,
    handleDeleteMeasure,
    handleDeleteMultipleKPIs,
    handleDeleteMultipleMeasures,
    handleExportData,
    handleImportData
  } = useMetricMapData();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load category data when category changes
  useEffect(() => {
    if (selectedCategory) {
      loadCategoryData(selectedCategory);
    }
  }, [selectedCategory]);

  // Set first category as default when data loads
  useEffect(() => {
    if (businessCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(businessCategories[0].id);
    }
  }, [businessCategories.length, selectedCategory]);

  if (isMobile) {
    return (
      <div className={styles.mobileWarning}>
        <div className={styles.mobileWarningContent}>
          <Smartphone className={styles.mobileWarningIcon} />
          <h2 className={styles.mobileWarningTitle}>Chỉ dành cho Desktop</h2>
          <p className={styles.mobileWarningText}>
            Dashboard bản đồ chỉ số này được tối ưu hóa chỉ để xem trên desktop. 
            Vui lòng truy cập ứng dụng này từ máy tính desktop hoặc laptop để có trải nghiệm tốt nhất.
          </p>
          <div className={styles.mobileWarningAction}>
            <Monitor className={styles.mobileWarningActionIcon} />
            <span className={styles.mobileWarningActionText}>Chuyển sang desktop để tiếp tục</span>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <p>Lỗi: {error}</p>
        </div>
      </div>
    );
  }

  const currentData = {
    kpis: currentKpis,
    measures: currentMeasures
  };
  
  // Overlay gating for lock

  return (
    <div className={styles.container}>
      {/* Left Sidebar - Categories */}
      <CategorySidebar
        businessCategories={businessCategories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        setSelectedKPI={setSelectedKPI}
        isEditing={isEditing}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* Main Content */}
      
      <MainContent
        selectedCategory={selectedCategory}
        businessCategories={businessCategories}
        currentData={currentData}
        selectedKPI={selectedKPI}
        setSelectedKPI={setSelectedKPI}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onAddKPI={handleAddKPI}
        onAddMeasure={handleAddMeasure}
        onEditKPI={handleEditKPI}
        onEditMeasure={handleEditMeasure}
        onDeleteKPI={handleDeleteKPI}
        onDeleteMeasure={handleDeleteMeasure}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onUpdateCategory={handleUpdateCategory}
        loadCategoryData={loadCategoryData}
        onDeleteMultipleKPIs={handleDeleteMultipleKPIs}
        onDeleteMultipleMeasures={handleDeleteMultipleMeasures}
      />

  
    </div>
  );
};

export default MetricMap;
