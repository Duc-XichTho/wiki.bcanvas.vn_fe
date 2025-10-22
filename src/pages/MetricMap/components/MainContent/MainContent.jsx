import { FileText, LayoutGrid, TableIcon, Upload } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ImportModal from '../ImportModal/ImportModal';
import KPIForm from '../KPIForm/KPIForm';
import MeasureForm from '../MeasureForm/MeasureForm';
import Header from './Header/Header';
import IndicatorMap from './IndicatorMap/IndicatorMap';
import styles from './MainContent.module.css';
import { Alert } from 'antd';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { createNewKpiBenchmark, getAllKpiBenchmark, updateKpiBenchmark } from '../../../../apis/kpiBenchmarkService';
import BulkBenchmarkModal from '../BulkBenchmark/BulkBenchmarkModal';

const MainContent = ({
  unPublic,
  selectedCategory,
  businessCategories,
  currentData,
  selectedKPI,
  setSelectedKPI,
  isEditing,
  setIsEditing,
  onAddKPI,
  onAddMeasure,
  onEditKPI,
  onEditMeasure,
  onDeleteKPI,
  onDeleteMeasure,
  onDeleteMultipleKPIs,
  onDeleteMultipleMeasures,
  onImportData,
  onUpdateCategory,
  loadCategoryData
}) => {
  const [showKPIForm, setShowKPIForm] = useState(false);
  const [showMeasureForm, setShowMeasureForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingKPI, setEditingKPI] = useState(null);
  const [editingMeasure, setEditingMeasure] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showBulkBenchmark, setShowBulkBenchmark] = useState(false);

  // Load KPI data when category changes
  useEffect(() => {
    if (selectedCategory && !currentData.kpis) {
      // This would trigger loading data for the category
      // For now, we'll assume data is already loaded
    }
  }, [selectedCategory, currentData]);

  const handleAddMeasure = async (measureData) => {
    try {
      await onAddMeasure(measureData);
      setShowMeasureForm(false);
    } catch (error) {
      console.error('Error adding measure:', error);
    }
  };

  const handleAddKPI = async (kpiData) => {
    try {
      const created = await onAddKPI(kpiData); // expect created KPI or success
      // Tạo KPI Benchmark nếu có payload và có id KPI
      if (kpiData?.kpiBenchmarkPayload && (created?.id || created?.data?.id)) {
        const kpiId = created?.id || created?.data?.id;
        const payload = {
          ...kpiData.kpiBenchmarkPayload,
          info: {
            ...(kpiData.kpiBenchmarkPayload.info || {}),
            kpiId,
            business_category_id: selectedCategory
          }
        };
        try {
          await createNewKpiBenchmark(payload);
        } catch (err) {
          console.error('Failed to create KPI Benchmark:', err);
        }
      }
      setShowKPIForm(false);
    } catch (error) {
      console.error('Error adding KPI:', error);
    }
  };

  const handleEditKPI = async (kpi) => {
    // Load benchmark theo info.kpiId
    try {
      const all = await getAllKpiBenchmark();
      const found = all?.find(b => (b?.info?.kpiId) === kpi.id);
      if (found) {
        setEditingKPI({
          ...kpi,
          kpiBenchmarkPayload: {
            name: found.name,
            description: found.description,
            category: found.category,
            data: found.data,
            info: found.info,
            id: found.id
          }
        });
      } else {
        setEditingKPI(kpi);
      }
    } catch (e) {
      console.error('Failed to load KPI Benchmark for KPI:', e);
      setEditingKPI(kpi);
    }
  };

  const handleSaveKPI = async (kpiData) => {
    try {
      const updated = await onEditKPI(editingKPI.id, kpiData);
      // Cập nhật hoặc tạo KPI Benchmark
      if (kpiData?.kpiBenchmarkPayload) {
        try {
          const all = await getAllKpiBenchmark();
          const existing = all?.find(b => (b?.info?.kpiId) === (editingKPI?.id));
          const payloadBase = {
            ...kpiData.kpiBenchmarkPayload,
            info: {
              ...(kpiData.kpiBenchmarkPayload.info || {}),
              kpiId: editingKPI?.id,
              business_category_id: selectedCategory
            }
          };
          if (existing) {
            await updateKpiBenchmark({ id: existing.id, ...payloadBase });
          } else {
            await createNewKpiBenchmark(payloadBase);
          }
        } catch (err) {
          console.error('Failed to upsert KPI Benchmark:', err);
        }
      }
      setEditingKPI(null);
    } catch (error) {
      console.error('Error saving KPI:', error);
    }
  };

  const handleEditMeasure = (measure) => {
    setEditingMeasure(measure);
  };

  const handleSaveMeasure = async (measureData) => {
    try {
      await onEditMeasure(editingMeasure.id, measureData);
      setEditingMeasure(null);
    } catch (error) {
      console.error('Error saving measure:', error);
    }
  };

  const handleImportData = async (jsonData) => {
    try {
      const result = await onImportData(jsonData);

      // Reload category data after import
      if (selectedCategory && result.success) {
        // Trigger reload of current category data
        // This will be handled by the parent component
        await loadCategoryData(selectedCategory);
      }

      return result;
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  };


  const getCategoryColor = (category) => {
    const colors = {
      'Tài chính': 'bg-green-100 text-green-800 border-green-300',
      'Vận hành': 'bg-orange-100 text-orange-800 border-orange-300',
      'Khách hàng': 'bg-purple-100 text-purple-800 border-purple-300',
      'Nhân sự': 'bg-pink-100 text-pink-800 border-pink-300',
      Finance: 'bg-green-100 text-green-800 border-green-300',
      Operation: 'bg-orange-100 text-orange-800 border-orange-300',
      Customer: 'bg-purple-100 text-purple-800 border-purple-300',
      HR: 'bg-pink-100 text-pink-800 border-pink-300'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const isKPISelected = (kpiId) => selectedKPI == kpiId;
  const isMeasureRelated = (measureId) => {
    if (!selectedKPI) return false;
    const kpi = currentData.kpis?.find(k => k.id === selectedKPI);
    if (Array.isArray(kpi?.measures)) {
      const isRelated = kpi.measures.includes(measureId);
      return isRelated;
    }
    return false;
  };

  const currentCategory = useMemo(() => {
    return businessCategories?.find(cat => cat.id == selectedCategory);
  }, [businessCategories, selectedCategory]);

  const analysisHtml = useMemo(() => {
    const content = currentCategory?.key_factors || '';
    if (!content) return '';
    try {
      const html = marked(content);
      return DOMPurify.sanitize(html);
    } catch (e) {
      return content;
    }
  }, [currentCategory?.key_factors]);

  const analysisHeadings = useMemo(() => {
    const md = currentCategory?.key_factors || '';
    const lines = md.split(/\r?\n/);
    const headings = [];
    lines.forEach((line, idx) => {
      const hMatch = line.match(/^(#{1,6})\s+(.+)/);
      if (hMatch) {
        const level = hMatch[1].length;
        const text = hMatch[2].trim();
        const id = `h-${level}-${idx}`;
        headings.push({ id, level, text });
      }
    });
    return headings;
  }, [currentCategory?.key_factors]);

  const markdownRef = useRef(null);
  const [activeHeadingId, setActiveHeadingId] = useState(null);

  useEffect(() => {
    if (!showAnalysis) return;
    const wrap = markdownRef.current;
    if (!wrap) return;
    const headingEls = wrap.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headingEls.forEach((el, idx) => {
      const h = analysisHeadings[idx];
      if (h) {
        el.setAttribute('data-anchor-id', h.id);
      }
    });
  }, [analysisHtml, analysisHeadings, showAnalysis]);

  const handleTocClick = useCallback((id) => {
    const wrap = markdownRef.current;
    if (!wrap) return;
    const target = wrap.querySelector(`[data-anchor-id="${id}"]`);
    if (!target) return;
    try {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      // Fallback for older browsers
      const container = wrap.parentElement; // .analysisContent
      const top = target.getBoundingClientRect().top - wrap.getBoundingClientRect().top + container.scrollTop;
      container.scrollTo({ top, behavior: 'smooth' });
    }
    setActiveHeadingId(id);
  }, []);

  return (
    <div className={styles.container}>
      {/* Header */}
      <Header
        unPublic={unPublic}
        selectedCategory={selectedCategory}
        businessCategories={businessCategories}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onUpdateCategory={onUpdateCategory}
      />

      {/* Indicator Map */}
      {
        selectedCategory && (
          <div className={styles.content}>
            <div className={styles.contentHeader}>
              <div className={styles.contentHeaderLeft}>
                <h3 className={styles.contentTitle}>
                  Bản đồ chỉ số phân tích kinh doanh
                </h3>
                <div className={styles.viewSwitch}>
                  <button className={`${styles.viewBtn} ${!showAnalysis && viewMode === 'cards' ? styles.viewBtnActive : ''}`} onClick={() => { setShowAnalysis(false); setViewMode('cards'); }} title="Xem dạng thẻ">
                    <LayoutGrid size={14} /> Thẻ
                  </button>
                  <button className={`${styles.viewBtn} ${!showAnalysis && viewMode === 'table' ? styles.viewBtnActive : ''}`} onClick={() => { setShowAnalysis(false); setViewMode('table'); }} title="Xem dạng bảng">
                    <TableIcon size={14} /> Bảng
                  </button>
                  <button className={`${styles.viewBtn} ${showAnalysis ? styles.viewBtnActive : ''}`} onClick={() => setShowAnalysis(true)} title="Phân tích mở rộng">
                    <FileText size={14} />  Phân tích mô hình
                  </button>
                  {isEditing && (
                    <Alert type="warning" message="Sau khi thêm/ sửa chỉ số, chọn đo lường liên quan để thiết lập liên kết" />
                  )}
                </div>
              </div>

              {isEditing && (
                <div className={styles.headerActions}>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className={styles.importButton}
                  >
                    <Upload className={styles.importIcon} />
                    Import dữ liệu
                  </button>
                  <button
                    onClick={() => setShowBulkBenchmark(true)}
                    className={styles.exportButton}
                    title="Nhập benchmark hàng loạt"
                  >
                    <TableIcon size={14} /> Nhập benchmark
                  </button>
                </div>
              )}
            </div>

            {!showAnalysis && (
              <IndicatorMap
                viewMode={viewMode}
                currentData={currentData}
                selectedCategory={selectedCategory}
                businessCategories={businessCategories}
                selectedKPI={selectedKPI}
                setSelectedKPI={setSelectedKPI}
                isEditing={isEditing}
                isKPISelected={isKPISelected}
                isMeasureRelated={isMeasureRelated}
                getCategoryColor={getCategoryColor}
                onAddKPI={() => setShowKPIForm(true)}
                onAddMeasure={() => setShowMeasureForm(true)}
                onEditKPI={handleEditKPI}
                onEditMeasure={handleEditMeasure}
                onDeleteKPI={onDeleteKPI}
                onDeleteMeasure={onDeleteMeasure}
                onUpdateCategory={onUpdateCategory}
                onDeleteMultipleKPIs={onDeleteMultipleKPIs}
                onDeleteMultipleMeasures={onDeleteMultipleMeasures}
              />
            )}

            {showAnalysis && (
              <div className={styles.analysisContainer}>
                <div className={styles.analysisSidebar}>
                  <div className={styles.analysisSidebarTitle}>Mục lục</div>
                  <div className={styles.analysisSidebarList}>
                    {analysisHeadings.length === 0 && (
                      <div className={styles.analysisEmpty}>Chưa có tiêu đề để hiển thị</div>
                    )}
                    {analysisHeadings.map(h => (
                      <button
                        key={h.id}
                        className={`${styles.analysisSidebarItem} ${styles[`level${h.level}`]} ${activeHeadingId === h.id ? styles.analysisSidebarItemActive : ''}`}
                        type="button"
                        onClick={() => handleTocClick(h.id)}
                        style={{ paddingLeft: Math.min(h.level - 1, 4) * 12 + 8 }}
                      >
                        {h.text}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.analysisContent}>
                  {analysisHtml ? (
                    <div
                      className={styles.markdownWrap}
                      ref={markdownRef}
                      // Inject anchor ids into headings by wrapping after render
                      dangerouslySetInnerHTML={{ __html: analysisHtml }}
                    />
                  ) : (
                    <div className={styles.analysisEmpty}>Chưa có nội dung phân tích mô hình kinh doanh</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      }


      {/* Forms */}
      {showMeasureForm && (
        <MeasureForm
          onSave={handleAddMeasure}
          onCancel={() => setShowMeasureForm(false)}
          selectedCategory={selectedCategory}
        />
      )}

      {showKPIForm && (
        <KPIForm
          onSave={handleAddKPI}
          onCancel={() => setShowKPIForm(false)}
          selectedCategory={selectedCategory}
          currentData={currentData}
        />
      )}

      {editingKPI && (
        <KPIForm
          initialData={editingKPI}
          onSave={handleSaveKPI}
          onCancel={() => setEditingKPI(null)}
          selectedCategory={selectedCategory}
          currentData={currentData}
        />
      )}

      {editingMeasure && (
        <MeasureForm
          initialData={editingMeasure}
          onSave={handleSaveMeasure}
          onCancel={() => setEditingMeasure(null)}
          selectedCategory={selectedCategory}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportData}
          selectedCategory={selectedCategory}
        />
      )}

      {showBulkBenchmark && (
        <BulkBenchmarkModal
          onClose={() => setShowBulkBenchmark(false)}
          selectedCategory={selectedCategory}
          currentData={currentData}
        />
      )}
    </div>
  );
};

export default MainContent;
