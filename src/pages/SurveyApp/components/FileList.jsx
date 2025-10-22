import React from 'react';
import { FileText } from 'lucide-react';
import FileCard from './FileCard';
import styles from '../CustomerSurveyApp.module.css';

const FileList = ({ 
  surveyFiles, 
  allSurveyFiles, // Add this prop for unfiltered files
  selectedFile, 
  searchQuery, 
  selectedTags, 
  selectedActionStatus,
  surveyFilesLoading,
  onFileClick, 
  onUpdateTags, 
  onUpdateSalesInfo,
  onSearchChange,
  onTagFilter,
  onClearTags,
  onActionStatusFilter,
  onDeleteSurvey
}) => {
  const getAllTags = () => {
    // Use allSurveyFiles (unfiltered) instead of surveyFiles (filtered)
    const allTags = allSurveyFiles.flatMap(file => file.tags);
    return [...new Set(allTags)].sort();
  };

  const filteredFiles = surveyFiles;
  const allTags = getAllTags();

  return (
    <div className={styles.fileList}>
      <div className={styles.filterSection}>
        <input
          type="text"
          placeholder="Tìm kiếm file theo tên hoặc tag..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.filterSection}>
        <label className={styles.filterLabel}>Lọc theo tag:</label>
        <div className={styles.filterTags}>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => onTagFilter(tag)}
              className={`${styles.filterTag} ${
                selectedTags.includes(tag) ? styles.active : ''
              }`}
            >
              {tag}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button
              onClick={onClearTags}
              className={styles.clearButton}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className={styles.filterSection}>
        <label className={styles.filterLabel}>Lọc theo trạng thái hành động:</label>
        <div className={styles.filterTags}>
          <button
            onClick={() => onActionStatusFilter('all')}
            className={`${styles.filterTag} ${
              selectedActionStatus === 'all' ? styles.active : ''
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => onActionStatusFilter('future')}
            className={`${styles.filterTag} ${
              selectedActionStatus === 'future' ? styles.active : ''
            }`}
            style={{ borderColor: '#10b981', color: '#10b981' }}
          >
            Còn thời gian
          </button>
          <button
            onClick={() => onActionStatusFilter('today')}
            className={`${styles.filterTag} ${
              selectedActionStatus === 'today' ? styles.active : ''
            }`}
            style={{ borderColor: '#f59e0b', color: '#f59e0b' }}
          >
            Còn 1 ngày
          </button>
          <button
            onClick={() => onActionStatusFilter('overdue')}
            className={`${styles.filterTag} ${
              selectedActionStatus === 'overdue' ? styles.active : ''
            }`}
            style={{ borderColor: '#ef4444', color: '#ef4444' }}
          >
            Đến hạn/Quá hạn
          </button>
          <button
            onClick={() => onActionStatusFilter('none')}
            className={`${styles.filterTag} ${
              selectedActionStatus === 'none' ? styles.active : ''
            }`}
            style={{ borderColor: '#9ca3af', color: '#9ca3af' }}
          >
            Không có ngày
          </button>
        </div>
      </div>

      <div className={styles.fileListItems}>
        {surveyFilesLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Đang tải surveys...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateContent}>
              <FileText className={styles.emptyStateIcon} />
              <p className={styles.emptyStateText}>Không tìm thấy survey nào</p>
            </div>
          </div>
        ) : (
          filteredFiles.map(file => (
            <FileCard 
              key={file.id} 
              file={file}
              selectedFile={selectedFile}
              onFileClick={onFileClick}
              onUpdateTags={onUpdateTags}
              onUpdateSalesInfo={onUpdateSalesInfo}
              onDeleteSurvey={onDeleteSurvey}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default FileList;
