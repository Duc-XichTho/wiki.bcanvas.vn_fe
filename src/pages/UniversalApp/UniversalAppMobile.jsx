import React, { useState, useEffect } from 'react';
import { Button, Drawer, Tooltip, Select } from 'antd';
import { MenuOutlined, UnorderedListOutlined, EditOutlined } from '@ant-design/icons';
import { NewSearchIcon, NewBookmarkIcon, NewBookmarkedIcon, BackCanvas, ICON_SIDEBAR_LIST } from '../../icon/svg/IconSvg';
import { EditorContent } from '@tiptap/react';
import FilePreviewModal from '../../components/FilePreviewModal';
import { useNavigate } from 'react-router-dom';
import { getAllProcessTabs } from '../../apis/processTabService';
import styles from './DataRubikProcessGuideMobile.module.css';

const DataRubikProcessGuideMobile = ({
  // Main content props
  selectedProcessItem,
  modifiedContent,
  contentRef,
  isEditing,
  editor,
  handleSave,
  handleCancel,
  handleBookmarkProcessItem,
  currentUser,
  startEditing,
  ProcessItemToolbar,
  contentHeadings,
  scrollToContentHeading,
  activeHeading,
  highlightSearchTerm,
  
  // Tab-related props
  activeTabId,
  activeProcessTab,
  handleTabChange,
  
  // Sidebar props
  sidebarContent,
  
  // Content headings sidebar props
  contentHeadingsSidebar,
  
  // Search modal props
  setIsSearchModalVisible,
  
  // File preview props
  showFilePreview,
  isFilePreviewable,
  isFilePreviewModalVisible,
  selectedFileForPreview,
  handleFilePreviewCancel,
  
  // Video management props
  handleRemoveVideo,
  
  // Loading state
  loading
}) => {
  const navigate = useNavigate();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [contentHeadingsVisible, setContentHeadingsVisible] = useState(false);
  const [tabs, setTabs] = useState([]);

  // Helper function to get icon for processItem
  const getProcessItemIcon = (metadataIcon) => {
    if (!metadataIcon) return ICON_SIDEBAR_LIST[0].icon;
    const found = ICON_SIDEBAR_LIST.find(item => item.name === metadataIcon);
    return found ? found.icon : ICON_SIDEBAR_LIST[0].icon;
  };

  // Fetch tabs on component mount
  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const tabsData = await getAllProcessTabs();
        const visibleTabs = tabsData.filter(tab => tab.show !== false);
        setTabs(visibleTabs);
      } catch (error) {
        console.error('Error fetching tabs:', error);
      }
    };

    fetchTabs();
  }, []);

  // Handle tab selection
  const handleTabSelect = (tabId) => {
    const selectedTab = tabs.find(tab => tab.id === tabId);
    if (selectedTab && handleTabChange) {
      handleTabChange(selectedTab);
    }
  };

  const handleSidebarOpen = () => {
    setSidebarVisible(true);
  };

  const handleSidebarClose = () => {
    setSidebarVisible(false);
  };

  const handleContentHeadingsOpen = () => {
    setContentHeadingsVisible(true);
  };

  const handleContentHeadingsClose = () => {
    setContentHeadingsVisible(false);
  };

  return (
    <div className={styles.mobileContainer}>
      {/* Mobile Header */}
      <div className={styles.mobileHeader}>
        <div className={styles.mobileHeaderLeft}>
          <div 
            className={styles.backCanvas}
            onClick={() => navigate('/dashboard')}
            title="Back to Dashboard"
          >
            <BackCanvas height={20} width={20} />
          </div>
          <Tooltip title="Mở menu">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={handleSidebarOpen}
              className={styles.mobileHeaderButton}
            />
          </Tooltip>
        </div>
        
        {/* <div className={styles.mobileHeaderCenter}>
          <Tooltip title="Tìm kiếm tất cả (Ctrl+Shift+F)">
            <Button
              type="primary"
              icon={<NewSearchIcon />}
              onClick={() => setIsSearchModalVisible(true)}
              size="middle"
              className={styles.searchButton}
            >
              Tìm kiếm tất cả
            </Button>
          </Tooltip>
        </div> */}
        
        <div className={styles.mobileHeaderRight}>
          <Tooltip title="Mở mục lục">
            <Button
              type="text"
              icon={<UnorderedListOutlined />}
              onClick={handleContentHeadingsOpen}
              className={styles.mobileHeaderButton}
            >
              Mục lục
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mobileMainContent}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div>Đang tải...</div>
          </div>
        ) : selectedProcessItem ? (
          <div className={styles.mobileContentWrapper}>
            {/* Process Item Header */}
            <div className={styles.mobileProcessItemHeader}>
              {/* Icon Display */}
              {selectedProcessItem.metadata?.icon && (
                <div style={{
                  display: 'flex',
                  marginBottom: '16px'
                }}>
                  <img 
                    src={getProcessItemIcon(selectedProcessItem.metadata.icon)} 
                    alt={selectedProcessItem.metadata.icon}
                    style={{ 
                      width: '48px', 
                      height: '48px'
                    }} 
                  />
                </div>
              )}
              
              <h1 className={styles.mobileProcessItemTitle}>
                {selectedProcessItem.title || selectedProcessItem.text}
              </h1>
              
              {/* Metadata */}
              <div style={{ 
                fontSize: '14px', 
                color: '#666',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '12px'
              }}>
                {selectedProcessItem.metadata?.author || 'BCanvas Series'} - {selectedProcessItem.metadata?.series || 'Ngày 24 tháng 10 năm 2025'}
              </div>
              
              {/* Action Buttons */}
              <div className={styles.mobileActionButtons}>
                {currentUser?.isSuperAdmin && (
                  <Button 
                    type="text" 
                    icon={<EditOutlined />}
                    onClick={() => startEditing(selectedProcessItem)}
                    title="Chỉnh sửa nội dung"
                    className={styles.mobileActionButton}
                  />
                )}
                {/* <Button 
                  type="text" 
                  icon={
                    currentUser?.info?.bookmarks?.some(
                      bookmark => bookmark.id === selectedProcessItem?.id && bookmark.type === 'processItem'
                    ) ? <NewBookmarkedIcon /> : <NewBookmarkIcon />
                  }
                  onClick={() => handleBookmarkProcessItem(selectedProcessItem)}
                  title="Bookmark document này"
                  className={styles.mobileActionButton}
                  style={{ 
                    color: currentUser?.info?.bookmarks?.some(
                      bookmark => bookmark.id === selectedProcessItem?.id && bookmark.type === 'processItem'
                    ) ? '#1890ff' : '#666'
                  }}
                /> */}
              </div>
            </div>

            {/* Video Preview Section */}
            {selectedProcessItem?.metadata?.videoUrl && (
              <div style={{ marginBottom: '20px', position: 'relative' }}>
                <video 
                  controls 
                  style={{ width: '100%', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  src={selectedProcessItem.metadata.videoUrl}
                >
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
                {isEditing && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid #ff4d4f',
                      borderRadius: '4px'
                    }}
                    onClick={() => handleRemoveVideo()}
                    title="Xóa video"
                  >
                    ✕
                  </Button>
                )}
              </div>
            )}

            {/* Process Item Content */}
            {selectedProcessItem?.metadata?.haveMobileView === true ? (
              selectedProcessItem.content ? (
                <div 
                  ref={contentRef}
                  className={styles.mobileProcessItemContent}
                  dangerouslySetInnerHTML={{ __html: modifiedContent || selectedProcessItem.content }}
                />
              ) : (
                <div className={styles.mobileEmptyContent}>
                  <p>Chưa có nội dung cho document này.</p>
                </div>
              )
            ) : (
              <div className={styles.mobileEmptyContent}>
                <p>File không khả dụng ở chế độ Mobile.</p>
              </div>
            )}

            {/* Editor (when editing) */}
            {isEditing && (
              <div className={styles.mobileEditorContainer}>
                <ProcessItemToolbar editor={editor} />
                <EditorContent editor={editor} className={styles.mobileEditor} />
                <div className={styles.mobileEditorActions}>
                  <Button onClick={handleSave} type="primary">
                    Lưu
                  </Button>
                  <Button onClick={handleCancel}>
                    Hủy
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.mobileEmptyState}>
            <h2>Chọn một document để xem nội dung</h2>
            <p>Sử dụng menu bên trái để chọn document bạn muốn xem.</p>
          </div>
        )}
      </div>

      {/* Sidebar Drawer */}
      <Drawer
        title="Menu"
        placement="left"
        onClose={handleSidebarClose}
        open={sidebarVisible}
        width={280}
        className={styles.mobileDrawer}
      >
        {/* Tab Selection Dropdown */}
        {/* <div className={styles.mobileTabSelector}>
          <label className={styles.mobileTabLabel}>Chọn Tab:</label>
          <Select
            value={activeTabId}
            onChange={handleTabSelect}
            placeholder="Chọn tab..."
            className={styles.mobileTabSelect}
            size="middle"
            style={{ width: '100%' }}
          >
            {tabs.map(tab => (
              <Select.Option key={tab.id} value={tab.id}>
                {tab.title}
              </Select.Option>
            ))}
          </Select>
        </div> */}
        
        {sidebarContent}
      </Drawer>

      {/* Content Headings Drawer */}
      <Drawer
        title="Mục lục"
        placement="right"
        onClose={handleContentHeadingsClose}
        open={contentHeadingsVisible}
        width={300}
        className={styles.mobileDrawer}
      >
        {contentHeadingsSidebar}
      </Drawer>

      {/* File Preview Modal */}
      <FilePreviewModal
        isVisible={isFilePreviewModalVisible}
        selectedFile={selectedFileForPreview}
        onCancel={handleFilePreviewCancel}
        width="100%"
        modalStyle={{
          '--ant-modal-content-padding': '0px'
        }}
        modalClassName={styles.mobileFilePreviewModal}
      />
    </div>
  );
};

export default DataRubikProcessGuideMobile;
