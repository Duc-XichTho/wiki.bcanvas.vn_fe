import React from 'react';
import { FileText } from 'lucide-react';
import styles from '../CustomerSurveyApp.module.css';

// Template Selector Modal
export const TemplateSelector = ({ 
  showTemplateSelector, 
  templates, 
  templatesLoading, 
  onCreateFileWithTemplate 
}) => {
  return (
    <div className={`${styles.templateSelector} ${showTemplateSelector ? '' : styles.hidden}`}>
      <div className={styles.templateSelectorContent}>
        <div className={styles.templateSelectorHeader}>
          <h3 className={styles.templateSelectorTitle}>Chọn Template</h3>
          <p className={styles.templateSelectorSubtitle}>Chọn template để tạo file khảo sát mới</p>
        </div>
        
        <div className={styles.templateSelectorBody}>
          {templatesLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner}></div>
              <p>Đang tải templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Không có templates nào được tìm thấy.</p>
            </div>
          ) : (
            <div className={styles.templateOptions}>
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => onCreateFileWithTemplate(template.id)}
                  className={styles.templateOption}
                >
                  <h4 className={styles.templateOptionTitle}>{template.name}</h4>
                  <p className={styles.templateOptionDescription}>{template.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.templateSelectorFooter}>
          <button
            onClick={() => onCreateFileWithTemplate(null)}
            className={styles.cancelButton}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

// Mobile Menu Component
export const MobileMenu = ({ 
  showMobileMenu, 
  currentView, 
  onToggleMobileMenu, 
  onViewChange,
  onAddNewFile,
  onOpenSidebar,
  sidebarOpen,
  children 
}) => {
  return (
    <div className={`${styles.mobileMenu} ${showMobileMenu ? '' : styles.hidden}`}>
      <div className={styles.mobileMenuContent}>
        <div className={styles.mobileMenuHeader}>
          <div className={styles.mobileMenuHeaderContent}>
            <h2 className={styles.mobileMenuTitle}>Menu</h2>
            <button 
              onClick={onToggleMobileMenu}
              className={styles.closeButton}
            >
              <span>←</span>
            </button>
          </div>
          
          <div className={styles.sidebarMenu}>
            {/* <button
              onClick={() => {
                // Only open sidebar, don't change currentView if we're viewing a survey
                onOpenSidebar();
              }}
              className={`${styles.sidebarButton} ${
                sidebarOpen ? styles.active : ''
              }`}
            >
              <span>📋</span>
              Danh sách Form
            </button> */}
            <button
              onClick={onAddNewFile}
              className={`${styles.sidebarButton} ${
                currentView === 'create' ? styles.active : ''
              }`}
            >
              <span>➕</span>
              Tạo mới Form
            </button>
            <button
              onClick={() => onViewChange('templates')}
              className={`${styles.sidebarButton} ${
                currentView === 'templates' ? styles.active : ''
              }`}
            >
              <span>⚙️</span>
              Cài Template
            </button>
          </div>
        </div>
        
        {children}
      </div>
    </div>
  );
};

// Loading State Component
export const LoadingState = ({ message = "Đang tải..." }) => (
  <div className={styles.loadingState}>
    <div className={styles.loadingSpinner}></div>
    <p>{message}</p>
  </div>
);

// Empty State Component
export const EmptyState = ({ 
  icon: Icon = FileText, 
  text = "Không có dữ liệu", 
  subtext = "" 
}) => (
  <div className={styles.emptyState}>
    <div className={styles.emptyStateContent}>
      <Icon className={styles.emptyStateIcon} />
      <p className={styles.emptyStateText}>{text}</p>
      {subtext && <p className={styles.emptyStateSubtext}>{subtext}</p>}
    </div>
  </div>
);
