import React, { useEffect } from 'react';
import { Settings } from 'lucide-react';
import styles from './ContentManagement.module.css';

const ContentManagement = ({ 
  sheetTabs = [], 
  setSheetTabs, 
  activeTabId, 
  setActiveTabId, 
  sheetSettingId, 
  setSheetSettingId,
  tabMenu,
  setTabMenu,
  onAddNewTab,
  onRenameTab,
  onDeleteTab,
  onOpenTabMenu,
  onSaveSheetTabs
}) => {




  // Close context menu on outside click
  useEffect(() => {
    const onDocClick = () => setTabMenu({ visible: false, x: 0, y: 0, tabId: null });
    if (tabMenu.visible) {
      document.addEventListener('click', onDocClick);
    }
    return () => document.removeEventListener('click', onDocClick);
  }, [tabMenu.visible]);


  const handleActiveTabUrlChange = async (url) => {
    if (!activeTabId) return;
    const next = (sheetTabs || []).map(t => t.id === activeTabId ? { ...t, url } : t);
    setSheetTabs(next);
    await onSaveSheetTabs(next);
  };



  return (
    <div className={styles.sheetTabsContainer}>
      <div className={styles.activeTabContent}>
        {activeTabId ? (
          <>
            <div className={styles.sheetUrlBar}>
              <input
                type="url"
                className={styles.urlInput}
                value={(sheetTabs.find(t => t.id === activeTabId)?.url) || ''}
                onChange={(e) => handleActiveTabUrlChange(e.target.value)}
                placeholder="Dán link Google Sheets vào đây..."
              />
            </div>
            <div className={styles.sheetFullContainer}>
              {(() => {
                const url = (sheetTabs.find(t => t.id === activeTabId)?.url) || '';
                return url ? (
                  <iframe
                    key={activeTabId}
                    src={url}
                    className={styles.sheetFrameFull}
                    title={`Google Sheet ${activeTabId}`}
                    allowFullScreen
                  />
                ) : (
                  <div className={styles.sheetPlaceholder}>
                    <Settings size={48} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
                    <p>Nhập URL Google Sheets để xem dữ liệu</p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Dán liên kết chia sẻ của Google Sheet lên trên</p>
                  </div>
                );
              })()}
            </div>
          </>
        ) : (
          <div className={styles.sheetPlaceholder}>
            <Settings size={48} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
            <p>Chưa có tab nào. Thêm tab để bắt đầu.</p>
          </div>
        )}
      </div>
      {tabMenu.visible && (
        <div
          className={styles.contextMenu}
          style={{ left: `${tabMenu.x}px`, top: `${tabMenu.y}px` }}
        >
          <button className={styles.contextMenuItem} onClick={() => onRenameTab(tabMenu.tabId)}>Đổi tên</button>
          <div className={styles.contextMenuDivider}></div>
          <button className={`${styles.contextMenuItem} ${styles.danger}`} onClick={() => onDeleteTab(tabMenu.tabId)}>Xóa tab</button>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;
