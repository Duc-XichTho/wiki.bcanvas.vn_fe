import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Clock, User, FileText, Trash2 , Wrench} from 'lucide-react';
import { Spin, message, Dropdown, Popconfirm, Button, Typography } from 'antd';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import styles from './ReportsTab.module.css';
import { Outlet, useParams } from 'react-router-dom';
import { getAllChatExport, deleteChatExport } from '../../../../apis/aiChatExportService';
import { MyContext } from '../../../../MyContext.jsx';
import { getUserClassByEmail } from '../../../../apis/userClassService.jsx';
import Loading3DTower from '../../../../components/Loading3DTower.jsx';
const ReportsTab = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserClasses, setCurrentUserClasses] = useState([]);
  const { currentUser } = useContext(MyContext);
  
  // Fetch current user's user classes
  useEffect(() => {
    async function fetchCurrentUserClasses() {
      try {
        const userClasses = await getUserClassByEmail();
        console.log('👤 [ReportsTab] Fetched current user classes:', {
          userClassesCount: userClasses.length,
          userClasses: userClasses.map(uc => ({ id: uc.id, name: uc.name }))
        });
        setCurrentUserClasses(userClasses);
      } catch (error) {
        console.error('Error fetching current user classes:', error);
        setCurrentUserClasses([]);
      }
    }
    fetchCurrentUserClasses();
  }, []);

  // Load published reports from aiChatExport
  const loadPublishedReports = async () => {
    try {
      setLoading(true);
      const allReports = await getAllChatExport();
      // Filter only visible reports (show = true)
      let publishedReports = allReports.filter(item => item.show === true);
      
      console.log('📊 [ReportsTab] Loading reports:', {
        totalReports: allReports.length,
        visibleReports: publishedReports.length,
        reportsWithUserClass: publishedReports.filter(r => r.userClass && r.userClass.length > 0).length,
        reportsWithoutUserClass: publishedReports.filter(r => !r.userClass || r.userClass.length === 0).length,
        currentUser: {
          email: currentUser?.email,
          isAdmin: currentUser?.isAdmin,
          isEditor: currentUser?.isEditor,
          isSuperAdmin: currentUser?.isSuperAdmin
        },
        userClassIds: currentUserClasses.map(uc => uc.id),
        userClassNames: currentUserClasses.map(uc => uc.name)
      });
      
      // Filter reports based on user permissions
      if (!(currentUser?.isAdmin || currentUser?.isEditor || currentUser?.isSuperAdmin)) {
        const userClassIds = currentUserClasses.map(uc => uc.id);
        const beforeFilterCount = publishedReports.length;
        
        publishedReports = publishedReports.filter(report => {
          // If report has no userClass restriction, allow access
          if (!report.userClass || report.userClass.length === 0) {
            console.log(`📊 [ReportsTab] Report "${report.more_info?.title || report.id}" - no userClass restriction, allowing access`);
            return true;
          }
          // Check if user's userClass matches report's userClass
          const hasAccess = report.userClass.some(reportUserClassId => userClassIds.includes(reportUserClassId));
          
          console.log(`📊 [ReportsTab] Report "${report.more_info?.title || report.id}" access check:`, {
            reportUserClassIds: report.userClass,
            userUserClassIds: userClassIds,
            hasAccess,
            reportId: report.id
          });
          
          return hasAccess;
        });
        
        console.log('📊 [ReportsTab] Reports filtering result:', {
          beforeFilter: beforeFilterCount,
          afterFilter: publishedReports.length,
          filteredOut: beforeFilterCount - publishedReports.length
        });
      } else {
        console.log('📊 [ReportsTab] Admin user - showing all reports');
      }
      
      setReports(publishedReports);
    } catch (error) {
      console.error('Error loading published reports:', error);
      message.error('Lỗi khi tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadPublishedReports();
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);
  useEffect(() => {
    console.log('🔄 [ReportsTab] currentUserClasses changed:', {
      userClassesCount: currentUserClasses.length,
      userClassIds: currentUserClasses.map(uc => uc.id)
    });
    
    if (currentUserClasses.length > 0) {
      loadPublishedReports();
    } else {
      console.log('⚠️ [ReportsTab] No user classes loaded yet, skipping reports load');
    }
  }, [currentUserClasses]);

  const handleReportClick = (reportId) => {
    navigate(`/analysis-review/reports/${reportId}`);
  };

  const handleDeleteReport = async (reportId) => {
    try {
      await deleteChatExport(reportId);
      message.success('Đã xóa báo cáo thành công');
      
      // Reload reports list
      loadPublishedReports();
      
      // If currently viewing deleted report, navigate away
      if (id == reportId) {
        navigate('/analysis-review/reports');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      message.error('Có lỗi khi xóa báo cáo');
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';

    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      const diffInMs = now - date;
      
      // If date is in the future, show as "recently"
      if (diffInMs < 0) {
        return 'Vừa tạo';
      }
      
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) {
        return 'Vừa xong';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} phút trước`;
      } else if (diffInHours < 24) {
        return `${diffInHours} giờ trước`;
      } else if (diffInDays < 30) {
        return `${diffInDays} ngày trước`;
      } else {
        // For very old dates, show actual date
        return date.toLocaleDateString('vi-VN');
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <div className={styles.layout} style={{ position: 'relative' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
        }}>
          <Loading3DTower />
        </div>
      )}
      <div className={styles.leftPanel}>
        
        <h3 className={styles.panelHeader}>Danh sách xuất bản từ Trợ lý báo cáo</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="small" />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              Đang tải báo cáo...
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className={styles.emptyState}>
            <BarChart3 className={styles.emptyStateIcon} />
            <p className={styles.emptyStateText}>Chưa có báo cáo nào được xuất bản</p>
          </div>
        ) : (
          <div className={styles.spaceY2}>
            {reports.map((report) => {
              const hasCharts = report.chart_data || (report.more_info?.multipleCharts && report.more_info.multipleCharts.length > 0);
              const hasTables = (report.tables && report.tables.length > 0) || (report.more_info?.tables && report.more_info.tables.length > 0);
              const title = report.more_info?.title || report.more_info?.quest || 'Báo cáo phân tích';
              
              return (
                <Dropdown
                  key={report.id}
                  menu={{
                    items: [
                      {
                        key: 'delete',
                        danger: true,
                        label: (
                          <Popconfirm
                            title='Xóa báo cáo'
                            description={`Bạn có chắc chắn muốn xóa báo cáo "${title}"?`}
                            onConfirm={() => handleDeleteReport(report.id)}
                            okText='Xóa'
                            cancelText='Hủy'
                            okButtonProps={{ danger: true }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Trash2 size={16} />
                              <span>Xóa báo cáo</span>
                            </div>
                          </Popconfirm>
                        ),
                      }
                    ]
                  }}
                  trigger={['contextMenu']}
                >
                  <div
                    onClick={() => handleReportClick(report.id)}
                    className={`${styles.dataItem} ${id == report.id ? styles.selected : ''}`}
                  >
                    <div className={styles.dataItemName}>
                      {hasCharts && (
                        <span style={{
                          color: '#1890ff',
                          marginRight: 4,
                          fontSize: '12px'
                        }}>
                          📊
                        </span>
                      )}
                      {hasTables && (
                        <span style={{
                          color: '#52c41a',
                          marginRight: 4,
                          fontSize: '12px'
                        }}>
                          📋
                        </span>
                      )}
                      {title}
                    </div>
                    <div className={styles.dataItemMeta}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <User size={12} style={{ color: '#666' }} />
                        <span style={{ fontSize: '11px', color: '#666' }}>
                          {report.user_create || 'Unknown'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={12} style={{ color: '#666' }} />
                        <span style={{ fontSize: '11px', color: '#666' }}>
                          {formatTimeAgo(report.create_at)}
                        </span>
                        {hasCharts && (
                          <span style={{
                            color: '#1890ff',
                            fontSize: '10px',
                            marginLeft: '4px'
                          }}>
                            Biểu đồ
                          </span>
                        )}
                        {hasTables && (
                          <span style={{
                            color: '#52c41a',
                            fontSize: '10px',
                            marginLeft: '4px'
                          }}>
                            Bảng
                          </span>
                        )}
                      </div>
                    </div>
                
                  </div>
                </Dropdown>
              );
            })}
          </div>
        )}
      </div>
      
      <div className={styles.mainPanel}>
        {id ? (
          <Outlet />
        ) : (
          <div className={styles.emptyState}>
            <div style={{height: 300 ,width: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',}}>  
            <div style={{ padding: 20, borderRadius: 10, fontSize: 16,}}>  
              Vui lòng chọn một báo cáo trong danh sách bên trái hoặc xuất bản báo cáo mới từ 
              <span onClick={() => navigate('/analysis-review/builder')} 
              style={{cursor: 'pointer',
                 color: '#4b5563',
                 marginLeft: 5,
                  backgroundColor: '#e7e7e7',
                   padding: 5,
                    borderRadius: 5,
                     display: 'inline-flex',
                      alignItems: 'center',
                       gap: 5, 
                       height: 30,
                       width: 'fit-content',
                       fontSize: 16
                      }}
                ><Wrench size={16} /> Trợ lý báo cáo</span>
            </div>
            {/* <img src={'/moireportpic.png'} alt="Empty State" style={{ width: '30%' }}/> */}
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsTab; 