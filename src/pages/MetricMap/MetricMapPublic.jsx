import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MainContent from './components/MainContent/MainContent';
import { getCategoryDataByIdPublic } from '../../apis/public/publicService';
import styles from './MetricMapPublic.module.css';
import { message } from 'antd';
import { updateBusinessCategory } from '../../apis/businessCategoryService.jsx';
import { updateKpiMetric, deleteKpiMetric, deleteMultipleKpiMetrics } from '../../apis/kpiMetricService.jsx';
import { updateMeasure, deleteMeasure, deleteMultipleMeasures } from '../../apis/measureService.jsx';
import { Monitor, Smartphone } from 'lucide-react';

const MetricMapPublic = () => {
    const { id } = useParams();
    const [businessCategories, setBusinessCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [currentData, setCurrentData] = useState(null);
    const [selectedKPI, setSelectedKPI] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isLocked, setIsLocked] = useState(false);
    const [hasPassword, setHasPassword] = useState(false);
    const [categoryPassword, setCategoryPassword] = useState('');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authPassword, setAuthPassword] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
          setIsMobile(window.innerWidth < 1024);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
      }, []);

    
    const loadPublicData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getCategoryDataByIdPublic(id);
            setBusinessCategories([data.category]);
            setSelectedCategory(data.category.id);
            setCurrentData({ kpis: data.kpis, measures: data.measures });
            setIsLocked(Boolean(data.category.isLock));
            const pwd = String(data.category.password ?? '');
            setCategoryPassword(pwd);
            setHasPassword(Boolean(pwd.trim()));
            setIsAuthorized(false);
            setIsEditing(false);
        } catch (err) {
            console.error('Error loading public data:', err);
            setError(err.message || 'Không tìm thấy dữ liệu');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {

        if (id) {
            loadPublicData();
        }
    }, [id]);

    // Control auth modal visibility
    useEffect(() => {
        if (!isLocked && hasPassword && !isAuthorized) {
            setShowAuthModal(true);
        } else {
            setShowAuthModal(false);
        }
    }, [isLocked, hasPassword, isAuthorized, selectedCategory]);

    // Disable page scroll when blocking
    useEffect(() => {
        const blocking = isLocked || (hasPassword && !isAuthorized);
        document.body.style.overflow = blocking ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isLocked, hasPassword, isAuthorized]);

    const handleImportData = async (importResult) => {
        try {
            setError(null);

            // importResult đã được xử lý ở frontend, chỉ cần refresh data
            if (importResult.success) {
                // Refresh current category data nếu có category được chọn
                if (selectedCategory) {
                    await loadPublicData(selectedCategory);
                }
                return { success: true, message: importResult.message };
            } else {
                throw new Error(importResult.error || 'Failed to import data');
            }
        } catch (err) {
            console.error('Error importing data:', err);
            setError(err.message || 'Failed to import data');
            return { success: false, error: err.message };
        }
    };

    // Real update handlers for public view
    const handleUpdateCategory = async (updatedCategory) => {
        try {
            const saved = await updateBusinessCategory(updatedCategory);
            setBusinessCategories(prev => prev.map(c => c.id === saved.id ? saved : c));
            // sync gating state
            setIsLocked(Boolean(saved.isLock));
            const pwd = String(saved.password ?? '');
            setCategoryPassword(pwd);
            setHasPassword(Boolean(pwd.trim()));
            message.success('Đã cập nhật danh mục');
            return saved;
        } catch (e) {
            console.error('Lỗi cập nhật danh mục:', e);
            message.error('Cập nhật danh mục thất bại');
        }
    };

    const handleEditKPI = async (kpiOrId, dataMaybe) => {
        try {
            const payload = typeof kpiOrId === 'object' ? kpiOrId : { id: kpiOrId, ...dataMaybe };
            const updated = await updateKpiMetric(payload);
            setCurrentData(prev => ({
                ...prev,
                kpis: (prev?.kpis || []).map(k => k.id === updated.id ? updated : k)
            }));
            message.success('Đã lưu chỉ số');
        } catch (e) {
            console.error('Lỗi cập nhật KPI:', e);
            message.error('Cập nhật chỉ số thất bại');
        }
    };

    const handleEditMeasure = async (measureOrId, dataMaybe) => {
        try {
            const payload = typeof measureOrId === 'object' ? measureOrId : { id: measureOrId, ...dataMaybe };
            const updated = await updateMeasure(payload);
            setCurrentData(prev => ({
                ...prev,
                measures: (prev?.measures || []).map(m => m.id === updated.id ? updated : m)
            }));
            message.success('Đã lưu đo lường');
        } catch (e) {
            console.error('Lỗi cập nhật đo lường:', e);
            message.error('Cập nhật đo lường thất bại');
        }
    };

    const handleDeleteKPI = async (kpiId) => {
        try {
            await deleteKpiMetric(kpiId);
            setCurrentData(prev => ({ ...prev, kpis: (prev?.kpis || []).filter(k => k.id !== kpiId) }));
            message.success('Đã xóa chỉ số');
        } catch (e) {
            console.error('Lỗi xóa KPI:', e);
            message.error('Xóa chỉ số thất bại');
        }
    };

    const handleDeleteMeasure = async (measureId) => {
        try {
            await deleteMeasure(measureId);
            setCurrentData(prev => ({ ...prev, measures: (prev?.measures || []).filter(m => m.id !== measureId) }));
            message.success('Đã xóa đo lường');
        } catch (e) {
            console.error('Lỗi xóa đo lường:', e);
            message.error('Xóa đo lường thất bại');
        }
    };

    const handleDeleteMultipleKPIs = async (ids) => {
        try {
            await deleteMultipleKpiMetrics(ids);
            setCurrentData(prev => ({ ...prev, kpis: (prev?.kpis || []).filter(k => !ids.includes(k.id)) }));
            message.success('Đã xóa các chỉ số đã chọn');
        } catch (e) {
            console.error('Lỗi xóa nhiều KPI:', e);
            message.error('Xóa nhiều chỉ số thất bại');
        }
    };

    const handleDeleteMultipleMeasures = async (ids) => {
        try {
            await deleteMultipleMeasures(ids);
            setCurrentData(prev => ({ ...prev, measures: (prev?.measures || []).filter(m => !ids.includes(m.id)) }));
            message.success('Đã xóa các đo lường đã chọn');
        } catch (e) {
            console.error('Lỗi xóa nhiều đo lường:', e);
            message.error('Xóa nhiều đo lường thất bại');
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <h2>Lỗi</h2>
                <p>{error}</p>
            </div>
        );
    }

    if (!selectedCategory || !currentData) {
        return (
            <div className={styles.errorContainer}>
                <h2>Không tìm thấy dữ liệu</h2>
                <p>Danh mục này không tồn tại hoặc đã bị xóa.</p>
            </div>
        );
    }

    // If locked: show full-screen lock overlay
    if (isLocked) {
        return (
            <div className={styles.errorContainer}>
                <h2>Truy cập bị hạn chế</h2>
                <p>Danh mục này hiện đang bị khóa. Vui lòng liên hệ quản trị viên để mở khóa.</p>
            </div>
        );
    }

    const handleAuthenticate = () => {
        if (authPassword.trim() && authPassword.trim() === String(categoryPassword).trim()) {
            setIsAuthorized(true);
            setShowAuthModal(false);
            setAuthPassword('');
            setIsEditing(false);
        } else {
            message.error('Sai mật khẩu. Vui lòng thử lại.');
        }
    };

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

    return (
        <div className={styles.publicContainer}>
            <div style={hasPassword && !isAuthorized ? { pointerEvents: 'none', userSelect: 'none' } : undefined}>
                <MainContent
                    unPublic={true}
                    businessCategories={businessCategories}
                    selectedCategory={selectedCategory}
                    currentData={currentData}
                    selectedKPI={selectedKPI}
                    setSelectedKPI={setSelectedKPI}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    onAddKPI={() => { }}
                    onAddMeasure={() => { }}
                    onEditKPI={handleEditKPI}
                    onEditMeasure={handleEditMeasure}
                    onDeleteKPI={handleDeleteKPI}
                    onDeleteMeasure={handleDeleteMeasure}
                    onDeleteMultipleKPIs={handleDeleteMultipleKPIs}
                    onDeleteMultipleMeasures={handleDeleteMultipleMeasures}

                    onImportData={handleImportData}
                    onUpdateCategory={handleUpdateCategory}
                    loadCategoryData={loadPublicData}
                />
            </div>

            {/* Password Modal for public access when not locked but requires password */}
            {hasPassword && !isAuthorized && showAuthModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                    <div style={{ background: '#ffffff', borderRadius: 12, padding: 24, maxWidth: 420, width: '92%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid #e5e7eb' }}>
                        <h3 style={{ margin: 0, marginBottom: 10, fontWeight: 700, fontSize: 18, color: '#111827' }}>Xác thực truy cập</h3>
                        <p style={{ marginTop: 0, color: '#4b5563' }}>Danh mục này yêu cầu mật khẩu để truy cập.</p>
                        <input
                            type="password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            placeholder="Nhập mật khẩu..."
                            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', marginTop: 8 }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAuthenticate(); }}
                            autoFocus
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button
                                onClick={handleAuthenticate}
                                disabled={!authPassword.trim()}
                                style={{ flex: 1, background: authPassword.trim() ? '#2563eb' : '#9ca3af', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 12px', cursor: authPassword.trim() ? 'pointer' : 'not-allowed' }}
                            >
                                Truy cập
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MetricMapPublic;
