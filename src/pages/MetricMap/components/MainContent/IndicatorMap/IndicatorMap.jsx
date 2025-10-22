import React, { useMemo, useRef, useState } from 'react';
import { ArrowUpDown, Check, Edit3, Plus, Search as SearchIcon, Trash2, X } from 'lucide-react';
import AntdDropdown from '../../AntdDropdown/AntdDropdown';
import ConfirmDialog from '../../ConfirmDialog/ConfirmDialog';
import ConnectionLines from './ConnectionLines';
import TipTapEditor from './TipTapEditor';
import styles from './IndicatorMap.module.css';
// ag-Grid imports
import TableView from './TableView.jsx';

const IndicatorMap = ({
  viewMode,
  currentData,
  selectedCategory,
  businessCategories,
  selectedKPI,
  setSelectedKPI,
  isEditing,
  isKPISelected,
  isMeasureRelated,
  getCategoryColor,
  onAddKPI,
  onAddMeasure,
  onEditKPI,
  onEditMeasure,
  onDeleteKPI,
  onDeleteMeasure,
  onDeleteMultipleKPIs,
  onDeleteMultipleMeasures,
  onUpdateCategory
}) => {
  const [isEditingKeyFactors, setIsEditingKeyFactors] = useState(false);
  const [keyFactorsContent, setKeyFactorsContent] = useState('');
  const [deletingKPI, setDeletingKPI] = useState(null);
  const [deletingMeasure, setDeletingMeasure] = useState(null);
  const [selectedKPIs, setSelectedKPIs] = useState([]);
  const [selectedMeasures, setSelectedMeasures] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [deletingMultipleKPIs, setDeletingMultipleKPIs] = useState(false);
  const [deletingMultipleMeasures, setDeletingMultipleMeasures] = useState(false);
  const [kpiQuery, setKpiQuery] = useState('');
  const [measureQuery, setMeasureQuery] = useState('');
  const [isMeasuresSorted, setIsMeasuresSorted] = useState(true);

  // Description modal and grid state moved into TableView

  // Refs for connection lines
  const containerRef = useRef(null);
  const kpiRefs = useRef({});
  const measureRefs = useRef({});

  // Handled by TableView

  const getCategoryStyle = (category) => {
    const categoryMap = {
      'Tài chính': styles.categoryFinance,
      'Vận hành': styles.categoryOperation,
      'Khách hàng': styles.categoryCustomer,
      'Nhân sự': styles.categoryHR,
      'Finance': styles.categoryFinance,
      'Operation': styles.categoryOperation,
      'Customer': styles.categoryCustomer,
      'HR': styles.categoryHR
    };
    return categoryMap[category] || '';
  };

  const handleKPIClick = (kpiId) => {
    if (!isEditing) {
      setSelectedKPI(selectedKPI === kpiId ? null : kpiId);
      // Don't reset sort state - let it persist across KPI selections
    }
  };

  const handleEditKeyFactors = () => {
    const currentCategory = businessCategories.find(cat => cat.id == selectedCategory);
    setKeyFactorsContent(currentCategory?.key_factors || '');
    setIsEditingKeyFactors(true);
  };

  const handleSaveKeyFactors = async (htmlContent) => {
    try {
      const currentCategory = businessCategories.find(cat => cat.id == selectedCategory);
      if (currentCategory) {
        await onUpdateCategory({
          ...currentCategory,
          key_factors: htmlContent
        });
        setIsEditingKeyFactors(false);
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật yếu tố thành công:', error);
    }
  };

  const handleCancelEditKeyFactors = () => {
    setIsEditingKeyFactors(false);
    setKeyFactorsContent('');
  };

  const handleDeleteKPI = (kpi) => {
    setDeletingKPI(kpi);
  };

  const confirmDeleteKPI = async () => {
    try {
      await onDeleteKPI(deletingKPI.id);
      setDeletingKPI(null);
      if (selectedKPI === deletingKPI.id) {
        setSelectedKPI(null);
      }
    } catch (error) {
      console.error('Error deleting KPI:', error);
    }
  };

  const handleDeleteMeasure = (measure) => {
    setDeletingMeasure(measure);
  };

  const confirmDeleteMeasure = async () => {
    try {
      await onDeleteMeasure(deletingMeasure.id);
      setDeletingMeasure(null);
    } catch (error) {
      console.error('Error deleting measure:', error);
    }
  };

  const handleSelectKPI = (kpiId, checked) => {
    if (checked) {
      setSelectedKPIs(prev => [...prev, kpiId]);
    } else {
      setSelectedKPIs(prev => prev.filter(id => id !== kpiId));
    }
  };

  const handleSelectMeasure = (measureId, checked) => {
    if (checked) {
      setSelectedMeasures(prev => [...prev, measureId]);
    } else {
      setSelectedMeasures(prev => prev.filter(id => id !== measureId));
    }
  };

  const handleSelectAllKPIs = (checked) => {
    if (checked) {
      setSelectedKPIs(currentData.kpis?.map(kpi => kpi.id) || []);
    } else {
      setSelectedKPIs([]);
    }
  };

  const handleSelectAllMeasures = (checked) => {
    if (checked) {
      setSelectedMeasures(currentData.measures?.map(measure => measure.id) || []);
    } else {
      setSelectedMeasures([]);
    }
  };

  const handleToggleMeasuresSort = () => {
    setIsMeasuresSorted(!isMeasuresSorted);
  };

  const handleDeleteMultiple = async () => {
    const hasSelectedKPIs = selectedKPIs.length > 0;
    const hasSelectedMeasures = selectedMeasures.length > 0;

    if (!hasSelectedKPIs && !hasSelectedMeasures) return;

    if (hasSelectedKPIs && hasSelectedMeasures) {
      setDeletingMultipleKPIs(true);
      setDeletingMultipleMeasures(true);
    } else if (hasSelectedKPIs) {
      setDeletingMultipleKPIs(true);
    } else {
      setDeletingMultipleMeasures(true);
    }
  };

  const confirmDeleteMultiple = async () => {
    try {
      const promises = [];
      if (selectedKPIs.length > 0) {
        promises.push(onDeleteMultipleKPIs(selectedKPIs));
      }
      if (selectedMeasures.length > 0) {
        promises.push(onDeleteMultipleMeasures(selectedMeasures));
      }
      await Promise.all(promises);
      setSelectedKPIs([]);
      setSelectedMeasures([]);
      if (selectedKPI && selectedKPIs.includes(selectedKPI)) {
        setSelectedKPI(null);
      }
    } catch (error) {
      console.error('Error deleting multiple items:', error);
    } finally {
      setDeletingMultipleKPIs(false);
      setDeletingMultipleMeasures(false);
    }
  };

  const currentCategory = businessCategories.find(cat => cat.id == selectedCategory);

  const filteredKpis = useMemo(() => {
    const term = kpiQuery.trim().toLowerCase();
    if (!term) return currentData.kpis || [];
    return (currentData.kpis || []).filter(k =>
      (k.name || '').toLowerCase().includes(term) ||
      (k.description || '').toLowerCase().includes(term) ||
      (k.category || '').toLowerCase().includes(term)
    );
  }, [currentData.kpis, kpiQuery]);

  const filteredMeasures = useMemo(() => {
    const term = measureQuery.trim().toLowerCase();
    let measures = currentData.measures || [];
    
    // Filter by search term
    if (term) {
      measures = measures.filter(m =>
        (m.name || '').toLowerCase().includes(term) ||
        (m.description || '').toLowerCase().includes(term) ||
        (m.source || '').toLowerCase().includes(term)
      );
    }
    
    // Sort measures if sorting is enabled and there's a selected KPI
    // This will automatically sort for any selected KPI when sorting is enabled
    if (isMeasuresSorted && selectedKPI) {
      const selectedKPIObject = currentData.kpis?.find(k => k.id === selectedKPI);
      if (selectedKPIObject && Array.isArray(selectedKPIObject.measures)) {
        const connectedMeasureIds = selectedKPIObject.measures;
        measures.sort((a, b) => {
          const aConnected = connectedMeasureIds.includes(a.id);
          const bConnected = connectedMeasureIds.includes(b.id);
          
          if (aConnected && !bConnected) return -1;
          if (!aConnected && bConnected) return 1;
          return 0;
        });
      }
    }
    
    return measures;
  }, [currentData.measures, measureQuery, isMeasuresSorted, selectedKPI, currentData.kpis]);

  // Row draft saving handled by TableView


  const renderMarkdown = (content) => {
    if (!content) return '';
    try {
      const htmlContent = marked(content);
      console.log(htmlContent);
      const sanitizedHtml = DOMPurify.sanitize(htmlContent);
      return sanitizedHtml;
    } catch (error) {
      console.error('Error rendering markdown:', error);
      return content; // Fallback to plain text
    }
  };
  return (
    <div className={styles.container} ref={containerRef}>


      {viewMode === 'cards' && (
        <ConnectionLines
          selectedKPI={selectedKPI}
          currentData={currentData}
          containerRef={containerRef}
          kpiRefs={kpiRefs}
          measureRefs={measureRefs}
          visibleKpiIds={filteredKpis.map(k => k.id)}
          visibleMeasureIds={filteredMeasures.map(m => m.id)}
        />
      )}

      <div className={`${styles.flexContainer} ${viewMode === 'cards' && isEditing && (selectedKPIs.length > 0 || selectedMeasures.length > 0) ? styles.hasBulkHeader : ''}`} style={{ height: isEditing ? '98%' : '100%' }}>
        {viewMode === 'cards' && isEditing && (selectedKPIs.length > 0 || selectedMeasures.length > 0) && (
          <div className={styles.bulkDeleteHeader}>
            <div className={styles.bulkDeleteInfo}>
              <span>Đã chọn: {selectedKPIs.length} chỉ số, {selectedMeasures.length} đo lường</span>
            </div>
            <button onClick={handleDeleteMultiple} className={styles.deleteMultipleButton} title={`Xóa ${selectedKPIs.length + selectedMeasures.length} mục đã chọn`}>
              <Trash2 className={styles.deleteIcon} /> Xóa ({selectedKPIs.length + selectedMeasures.length})
            </button>
          </div>
        )}

        {viewMode === 'cards' && (
          <>
            {/* Key Success Factors Column */}
            <div className={styles.column}>
              <div className={styles.columnHeader}>
                <h4 className={styles.columnTitle}>
                  Phân tích mô hình kinh doanh
                </h4>
                {isEditing && !isEditingKeyFactors && (
                  <button
                    onClick={handleEditKeyFactors}
                    className={styles.addButton}
                  >
                    <Edit3 className={styles.addIcon} />
                  </button>
                )}
              </div>
              <div className={styles.scrollableContainer}>
                <div className={styles.successFactors}>
                  <div className={styles.successFactorsContent}>
                    {isEditingKeyFactors ? (
                      <TipTapEditor
                        content={keyFactorsContent}
                        onSave={handleSaveKeyFactors}
                        onCancel={handleCancelEditKeyFactors}
                        placeholder="Nhập phân tích mô hình kinh doanh..."
                      />
                    ) : (
                      <div className={styles.successFactorsText}>
                        {currentCategory?.key_factors ? (
                          <div 
                            className={styles.htmlContent}
                            dangerouslySetInnerHTML={{ __html: currentCategory.key_factors }}
                          />
                        ) : (
                          <p>Chưa có dữ liệu yếu tố thành công</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* KPIs and Measures Column (cards) */}
            <div className={styles.column}>
              <div className={styles.columnHeader}>
                <div className={styles.dualHeader}>
                  <div className={styles.headerSection}>
                    <div className={styles.headerActions}>
                      <h4 className={styles.columnTitle}>Chỉ số</h4>
                      <div className={styles.quickFilterWrap} title="Tìm kiếm chỉ số (KPI)">
                        <SearchIcon size={14} />
                        <input
                          value={kpiQuery}
                          onChange={(e) => setKpiQuery(e.target.value)}
                          className={styles.quickFilterInput}
                          placeholder="Tìm KPI..."
                        />
                      </div>
                      {isEditing && (
                        <>
                          {currentData.kpis?.length > 0 && (
                            <div className={styles.bulkActions}>
                              <label className={styles.selectAllLabel}>
                                <input
                                  type="checkbox"
                                  checked={selectedKPIs.length === currentData.kpis?.length && currentData.kpis?.length > 0}
                                  onChange={(e) => handleSelectAllKPIs(e.target.checked)}
                                  className={styles.selectAllCheckbox}
                                />
                                Tất cả
                              </label>
                            </div>
                          )}
                          <button onClick={onAddKPI} className={styles.addButton}>
                            <Plus className={styles.addIcon} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={styles.headerSection}>
                    <div className={styles.headerActions}>
                      <h4 className={styles.columnTitle}>Đo lường</h4>

                      <div className={styles.quickFilterWrap} title="Tìm kiếm đo lường (Measure)">
                        <SearchIcon size={14} />
                        <input
                          value={measureQuery}
                          onChange={(e) => setMeasureQuery(e.target.value)}
                          className={styles.quickFilterInput}
                          placeholder="Tìm Measure..."
                        />
                      </div>
                      
                      {/* Sort button - only show when a KPI is selected */}
                      {selectedKPI && (
                        <button 
                          onClick={handleToggleMeasuresSort} 
                          className={`${styles.sortButton} ${isMeasuresSorted ? styles.sortButtonActive : ''}`}
                          title={isMeasuresSorted ? "Tắt sắp xếp tự động" : "Sắp xếp theo chỉ số được chọn"}
                        >
                          <ArrowUpDown size={14} />
                          {isMeasuresSorted ? "Đã sắp xếp" : "Sắp xếp"}
                        </button>
                      )}
                      
                      {isEditing && (
                        <>
                          {currentData.measures?.length > 0 && (
                            <div className={styles.bulkActions}>
                              <label className={styles.selectAllLabel}>
                                <input
                                  type="checkbox"
                                  checked={selectedMeasures.length === currentData.measures?.length && currentData.measures?.length > 0}
                                  onChange={(e) => handleSelectAllMeasures(e.target.checked)}
                                  className={styles.selectAllCheckbox}
                                />
                                Tất cả
                              </label>
                            </div>
                          )}
                          <button onClick={onAddMeasure} className={styles.addButton}>
                            <Plus className={styles.addIcon} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.scrollableContainer}>
                <div className={styles.combinedList}>
                  {/* KPIs Section */}
                  <div className={styles.kpiSection}>
                    <div className={styles.kpiList}>
                      {filteredKpis.map((kpi) => (
                        <div
                          key={kpi.id}
                          ref={(el) => { if (el) { kpiRefs.current[kpi.id] = el; } else { delete kpiRefs.current[kpi.id]; } }}
                          onClick={() => handleKPIClick(kpi.id)}
                          className={`${styles.kpiItem} ${isKPISelected(kpi.id) ? styles.kpiSelected : styles.kpiDefault} ${!isEditing ? styles.kpiClickable : ''}`}
                        >
                          {isEditing && (
                            <div className={styles.itemActions}>
                              <input
                                type="checkbox"
                                checked={selectedKPIs.includes(kpi.id)}
                                onChange={(e) => { e.stopPropagation(); handleSelectKPI(kpi.id, e.target.checked); }}
                                className={styles.itemCheckbox}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <AntdDropdown onEdit={() => onEditKPI(kpi)} onDelete={() => handleDeleteKPI(kpi)} itemName="chỉ số" />
                            </div>
                          )}
                          <div className={styles.kpiContent}>
                            <div className={styles.kpiHeader}>
                              <h5 className={styles.kpiName}>{kpi.name}</h5>
                              <span className={`${styles.kpiCategory} ${styles.categoryFinance}`}>{kpi.category}</span>
                            </div>
                            <p className={styles.kpiDescription}>{kpi.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Measures Section */}
                  <div className={styles.measureSection}>
                    <div className={styles.measureList}>
                      {filteredMeasures.map((measure) => (
                        <div
                          key={measure.id}
                          ref={(el) => { if (el) { measureRefs.current[measure.id] = el; } else { delete measureRefs.current[measure.id]; } }}
                          className={`${styles.measureItem} ${isMeasureRelated(measure.id) ? styles.measureRelated : styles.measureDefault}`}
                        >
                          {isEditing && (
                            <div className={styles.itemActions}>
                              <input
                                type="checkbox"
                                checked={selectedMeasures.includes(measure.id)}
                                onChange={(e) => handleSelectMeasure(measure.id, e.target.checked)}
                                className={styles.itemCheckbox}
                              />
                              <AntdDropdown onEdit={() => onEditMeasure(measure)} onDelete={() => handleDeleteMeasure(measure)} itemName="đo lường" />
                            </div>
                          )}
                          <div className={styles.measureContent}>
                            <div className={styles.measureHeader}>
                              <h5 className={styles.measureName}>{measure.name}</h5>
                              {isMeasureRelated(measure.id) && (
                                <span className={styles.connectionIndicator}>← Kết nối</span>
                              )}
                            </div>
                            <div className={styles.measureDetails}>
                              <p className={styles.measureDescription}>{measure.description}</p>
                              <span className={styles.measureSource} title={measure.source}>{measure.source}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {viewMode === 'table' && (
          <TableView
            isEditing={isEditing}
            currentData={currentData}
            onAddKPI={onAddKPI}
            onAddMeasure={onAddMeasure}
            // updates handled inside TableView
            onRequestDeleteKPI={handleDeleteKPI}
            onRequestDeleteMeasure={handleDeleteMeasure}
          />
        )}
      </div>

      {/* Description modal handled by TableView */}

      <ConfirmDialog isOpen={!!deletingKPI} onClose={() => setDeletingKPI(null)} onConfirm={confirmDeleteKPI} title="Xác nhận xóa chỉ số" message={`Bạn có chắc chắn muốn xóa chỉ số "${deletingKPI?.name}" không?`} />
      <ConfirmDialog isOpen={!!deletingMeasure} onClose={() => setDeletingMeasure(null)} onConfirm={confirmDeleteMeasure} title="Xác nhận xóa đo lường" message={`Bạn có chắc chắn muốn xóa đo lường "${deletingMeasure?.name}" không?`} />
      <ConfirmDialog isOpen={deletingMultipleKPIs || deletingMultipleMeasures} onClose={() => { setDeletingMultipleKPIs(false); setDeletingMultipleMeasures(false); }} onConfirm={confirmDeleteMultiple} title="Xác nhận xóa nhiều mục" message={`Bạn có chắc chắn muốn xóa ${selectedKPIs.length} chỉ số và ${selectedMeasures.length} đo lường đã chọn không? Hành động này không thể hoàn tác.`} />
    </div>
  );
};

export default IndicatorMap;
