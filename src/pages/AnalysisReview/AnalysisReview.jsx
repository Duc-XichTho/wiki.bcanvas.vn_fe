import React, { useEffect, useState, useContext } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styles from './AnalysisReview.module.css';
import { checkMobile } from '../../generalFunction/checkMobile.js';
// Import components
import Header from './components/Header';
import { Button, Dropdown, Modal, Form, Input, message } from 'antd';
import ProcessingBar from './components/ProcessingBar';
import { MyContext } from '../../MyContext.jsx';
import { getSettingByType, createSetting, updateSetting } from '../../apis/settingService.jsx';
import AccessDenied from './components/AccessDenied';
import UnifiedKPIInterface from './components/UnifiedKPIInterface';

export default function AnalysisReview() {
  const [activeTab, setActiveTab] = useState('data');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hdsdLinks, setHdsdLinks] = useState({
    statistics: '/process-guide/1/22',
    measurement: '/process-guide/1/23'
  });

  const [headerSettings, setHeaderSettings] = useState({
    tableAnalysisEnabled: false,
    dashboardEnabled: true,
    statisticsEnabled: true,
    tableReportEnabled: true,
    defaultTab: 'data'
  });

  const [selectedColors, setSelectedColors] = useState([
    { id: 1, color: '#13C2C2' },
    { id: 2, color: '#3196D1' },
    { id: 3, color: '#6DB8EA' },
    { id: 4, color: '#87D2EA' },
    { id: 5, color: '#9BAED7' },
    { id: 6, color: '#C695B7' },
    { id: 7, color: '#EDCCA1' },
    { id: 8, color: '#A4CA9C' }
  ]);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useContext(MyContext);

  // Check mobile and tablet on mount and resize
  useEffect(() => {
    const checkDeviceStatus = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width <= 1024);
    };

    checkDeviceStatus();
    window.addEventListener('resize', checkDeviceStatus);

    return () => window.removeEventListener('resize', checkDeviceStatus);
  }, []);

  // Load header settings  
  const loadHeaderSettings = async () => {
    try {
      const path = location.pathname;
      const setting = await getSettingByType('SettingHeaderAnalysisReview');
      const settingData = setting?.setting || {
        tableAnalysisEnabled: false,
        dashboardEnabled: true,
        statisticsEnabled: true,
        tableReportEnabled: true,
        defaultTab: 'data'
      };
      setHeaderSettings(settingData);
      if (path.includes('/data')) {
        setActiveTab('data');
        return;
      } else if (path.includes('/reports')) {
        setActiveTab('reports');
        return;
      } else if (path.includes('/builder')) {
        setActiveTab('builder');
        return;
      } else if (path.includes('/statistics')) {
        setActiveTab('statistics');
        return;
      } else if (path.includes('/measurement')) {
        setActiveTab('measurement');
        return;
      } else if (path.includes('/business')) {
        setActiveTab('business');
        return;
      } else if (path.includes('/table-analysis')) {
        setActiveTab('table-analysis');
        return;
      } else if (path.includes('/table-report')) {
        setActiveTab('table-report');
        return;
      } else {
        if (window.innerWidth < 768) {
          setActiveTab('business');
          navigate(`/analysis-review/business`);
        } else {
          setActiveTab(settingData?.defaultTab || 'data');
          navigate(`/analysis-review/${settingData?.defaultTab || 'data'}`);
        }
      }
    } catch (error) {
      console.error('Error loading header settings:', error);
    }
  };

  useEffect(() => {
    loadHeaderSettings();
  }, []);

  // Load HDSD links from settings
  useEffect(() => {
    const loadHdsdLinks = async () => {
      try {
        const setting = await getSettingByType('HDSD_Link');
        if (setting && setting.setting) {
          setHdsdLinks(setting.setting);
        }
      } catch (error) {
        console.error('Error loading HDSD links:', error);
      }
    };

    loadHdsdLinks();
  }, []);

  // Load color settings
  useEffect(() => {
    const loadColorSettings = async () => {
      try {
        const existing = await getSettingByType('SettingColor');

        if (existing && existing.setting && Array.isArray(existing.setting)) {
          const isValidColorArray = existing.setting.every(item =>
            item && typeof item === 'object' &&
            typeof item.id === 'number' &&
            typeof item.color === 'string'
          );

          if (isValidColorArray) {
            setSelectedColors(existing.setting);
          }
        }
      } catch (error) {
        console.error('Error loading initial color settings:', error);
      }
    };

    loadColorSettings();
  }, []);

  // Handle right-click context menu
  const handleContextMenu = (e) => {
    console.log('Right-click detected:', e);
    console.log('Current user:', currentUser);
    console.log('Is super admin:', currentUser?.isSuperAdmin);

    if (currentUser?.isSuperAdmin) {
      console.log('Preventing default context menu');
      e.preventDefault();
    }
  };

  // Handle modal open
  const handleOpenModal = () => {
    console.log('Opening modal for HDSD link configuration');
    form.setFieldsValue({
      statisticsLink: hdsdLinks.statistics,
      measurementLink: hdsdLinks.measurement
    });
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  // Handle save settings
  const handleSaveSettings = async () => {
    try {
      const values = await form.validateFields();
      const newLinks = {
        statistics: values.statisticsLink,
        measurement: values.measurementLink
      };

      // Check if setting already exists
      try {
        const existingSetting = await getSettingByType('HDSD_Link');
        if (existingSetting && existingSetting.id) {
          // Update existing setting
          await updateSetting({
            id: existingSetting.id,
            type: 'HDSD_Link',
            setting: newLinks
          });
        } else {
          // Create new setting
          await createSetting({
            type: 'HDSD_Link',
            setting: newLinks
          });
        }
      } catch (error) {
        // If getSettingByType fails, create new setting
        await createSetting({
          type: 'HDSD_Link',
          setting: newLinks
        });
      }

      setHdsdLinks(newLinks);
      setIsModalOpen(false);
      message.success('Đã lưu cấu hình thành công');
    } catch (error) {
      console.error('Error saving HDSD links:', error);
      message.error('Có lỗi xảy ra khi lưu cấu hình');
    }
  };

  // Get navigation URL based on activeTab
  const getNavigationUrl = () => {
    const url = activeTab === 'statistics' ? hdsdLinks.statistics : hdsdLinks.measurement;
    return normalizeUrl(url);
  };

  // Normalize URL to always return relative path
  const normalizeUrl = (url) => {
    if (!url) return '/process-guide/1/22'; // fallback

    // Remove any @ symbol at the beginning
    let cleanUrl = url.replace(/^@/, '');

    // If it's a full URL, extract the pathname
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      try {
        const urlObj = new URL(cleanUrl);
        cleanUrl = urlObj.pathname;
      } catch (error) {
        console.error('Invalid URL:', cleanUrl);
        return '/process-guide/1/22'; // fallback
      }
    }

    // Ensure it starts with /
    if (!cleanUrl.startsWith('/')) {
      cleanUrl = '/' + cleanUrl;
    }

    return cleanUrl;
  };


  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <>
      <div className={styles.container}>
        {/* Header */}
        <Header
          setActiveTab={setActiveTab}
          headerSettings={headerSettings}
          setHeaderSettings={setHeaderSettings}
          activeTab={activeTab}
          onBackToDashboard={handleBackToDashboard}
          isMobile={isMobile}
        />
        {/* Main Content */}
        <div className={styles.mainContent} style={{ padding: (location.pathname.includes('business') || location.pathname.includes('table-analysis') || location.pathname.includes('table-report')) ? '0px' : '1rem' }}>
          {/* Kiểm tra tab bị tắt */}
          {activeTab === 'business' && !headerSettings.dashboardEnabled && (
            <AccessDenied
              message="Tab Dashboard đã bị tắt. Vui lòng liên hệ Admin để kích hoạt lại."
              icon="lock"
            />
          )}

          {activeTab === 'statistics' && !headerSettings.statisticsEnabled && (
            <AccessDenied
              message="Tab Xây chỉ số đã bị tắt. Vui lòng liên hệ Admin để kích hoạt lại."
              icon="lock"
            />
          )}

          {activeTab === 'table-report' && !headerSettings.tableReportEnabled && (
            <AccessDenied
              message="Tab Table Analytics đã bị tắt. Vui lòng liên hệ Admin để kích hoạt lại."
              icon="lock"
            />
          )}

          {/* Hiển thị nội dung nếu tab được bật */}
          {!((activeTab === 'business' && !headerSettings.dashboardEnabled) ||
            (activeTab === 'statistics' && !headerSettings.statisticsEnabled) ||
            (activeTab === 'table-report' && !headerSettings.tableReportEnabled)) && (
              <>
                {/* Hiển thị UnifiedKPIInterface cho tab statistics hoặc measurement */}
                {(activeTab === 'statistics' || activeTab === 'measurement') ? (
                  <UnifiedKPIInterface />
                ) : (
                  <Outlet />
                )}
              </>
            )}
        </div>
        {/* Processing Bar - Fixed at bottom */}
        <ProcessingBar />
      </div>

      {/* Modal for changing HDSD links */}
      <Modal
        title="Cấu hình đường link HDSD Chức năng"
        open={isModalOpen}
        onOk={handleSaveSettings}
        onCancel={handleCloseModal}
        okText="Lưu"
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            statisticsLink: hdsdLinks.statistics,
            measurementLink: hdsdLinks.measurement
          }}
        >
          <Form.Item
            label="Đường link cho tab Đo lường (Statistics)"
            name="statisticsLink"
            rules={[
              { required: true, message: 'Vui lòng nhập đường link cho tab Đo lường' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();

                  // Remove @ symbol if present
                  const cleanValue = value.replace(/^@/, '');

                  // Check if it's a valid relative path or full URL
                  if (cleanValue.startsWith('/') ||
                    cleanValue.startsWith('http://') ||
                    cleanValue.startsWith('https://')) {
                    return Promise.resolve();
                  }

                  return Promise.reject(new Error('Vui lòng nhập đường link hợp lệ (bắt đầu bằng / hoặc http/https)'));
                }
              }
            ]}
          >
            <Input placeholder="/process-guide/1/22 hoặc @https://app.bcanvas.vn/process-guide/1/22" />
          </Form.Item>

          <Form.Item
            label="Đường link cho tab Chỉ số (Measurement)"
            name="measurementLink"
            rules={[
              { required: true, message: 'Vui lòng nhập đường link cho tab Chỉ số' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();

                  // Remove @ symbol if present
                  const cleanValue = value.replace(/^@/, '');

                  // Check if it's a valid relative path or full URL
                  if (cleanValue.startsWith('/') ||
                    cleanValue.startsWith('http://') ||
                    cleanValue.startsWith('https://')) {
                    return Promise.resolve();
                  }

                  return Promise.reject(new Error('Vui lòng nhập đường link hợp lệ (bắt đầu bằng / hoặc http/https)'));
                }
              }
            ]}
          >
            <Input placeholder="/process-guide/1/23 hoặc @https://app.bcanvas.vn/process-guide/1/23" />
          </Form.Item>
        </Form>
      </Modal>

    </>
  );
};

