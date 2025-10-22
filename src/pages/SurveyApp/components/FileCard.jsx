import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Trash2, CheckCircle } from 'lucide-react';
import styles from '../CustomerSurveyApp.module.css';

const FileCard = ({ 
  file, 
  selectedFile, 
  onFileClick, 
  onUpdateTags, 
  onUpdateSalesInfo,
  onDeleteSurvey
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleDeleteClick = () => {
    setShowContextMenu(false);
    onDeleteSurvey(file);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowContextMenu(false);
    };

    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  const getStatusLabel = (status) => {
    switch (status) {
      case 'progressing': return 'Đang triển khai bước tiếp';
      case 'waiting': return 'Đang chờ';
      case 'frozen': return 'Đóng băng';
      default: return 'Chưa xác định';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      // Format as DD/MM/YYYY
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const getActionDateStatus = (actionDate) => {
    if (!actionDate) return { status: 'none', color: '#9ca3af' };
    
    try {
      const actionDateTime = new Date(actionDate);
      if (isNaN(actionDateTime.getTime())) return { status: 'none', color: '#9ca3af' };
      
      const now = new Date();
      const diffTime = actionDateTime.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        return { status: 'future', color: '#10b981' }; // Green
      } else if (diffDays === 1) {
        return { status: 'today', color: '#f59e0b' }; // Yellow
      } else {
        return { status: 'overdue', color: '#ef4444' }; // Red
      }
    } catch (error) {
      return { status: 'none', color: '#9ca3af' };
    }
  };

  return (
    <div
      ref={cardRef}
      className={`${styles.fileCard} ${
        selectedFile?.id === file.id ? styles.selected : ''
      }`}
      onClick={() => onFileClick(file)}
      onContextMenu={handleContextMenu}
    >
      <div className={styles.fileCardHeader}>
        <div className={styles.fileCardContent}>
          <div className={styles.fileCardTitleRow}>
            <h3 className={styles.fileCardTitle}>
              {file.name}
            </h3>
            
            {/* Success Score */}
            <div className={styles.scoreIndicator}>
              {file.successScore > 0 ? (
                <>
                  <div className={`${styles.scoreDot} ${styles[`score${file.successScore}`]}`} title={`Điểm: ${file.successScore}/5`} />
                  <span className={styles.scoreText}>{file.successScore}/5</span>
                </>
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>No score</span>
              )}
            </div>
          </div>
          
          {/* Tags */}
          <div className={styles.fileTags}>
            <div className={styles.fileTagsList}>
              {file.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className={styles.fileTag}
                >
                  {tag}
                </span>
              ))}
              {file.tags.length > 3 && (
                <span className={styles.fileTagMore}>
                  ...
                </span>
              )}
            </div>
          </div>
          
          {/* Sections */}
          {file.sections && file.sections.length > 0 && (
            <div className={styles.fileSections}>
              <div className={styles.fileSectionsList}>
                {file.sections.map((section, index) => (
                  <div 
                    key={section.id || index}
                    className={`${styles.fileSection} ${section.completed ? styles.sectionCompleted : styles.sectionIncomplete}`}
                  >
                    <span className={styles.sectionTitle}>
                      {section.title}
                    </span>
                    <span className={styles.sectionProgress}>
                      {section.completedItems}/{section.totalItems}
                    </span>
                    {section.completed && (
                      <CheckCircle className={styles.sectionCompletedIcon} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Next Action and Action Date */}
          {(file.nextAction || file.actionDate) && (
            <div className={styles.fileActionInfo}>
              <span 
                className={styles.actionText}
                style={{ color: getActionDateStatus(file.actionDate).color }}
              >
                {file.nextAction && `${file.nextAction}`}
                {file.nextAction && file.actionDate && ' | '}
                {file.actionDate && `ngày ${formatDate(file.actionDate)}`}
              </span>
            </div>
          )}
          
          <div className={styles.fileCardFooter}>
            <span>{formatDate(file.createdAt)}</span>
            <span className={`${styles.statusBadge} ${styles[file.status]}`}>
              {getStatusLabel(file.status)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Context Menu */}
      {showContextMenu && (
        <div 
          className={styles.contextMenu}
          style={{
            position: 'fixed',
            top: contextMenuPosition.y,
            left: contextMenuPosition.x,
            zIndex: 1000
          }}
        >
          <button
            onClick={handleDeleteClick}
            className={styles.contextMenuItem}
          >
            <Trash2 className={styles.contextMenuIcon} />
            Xóa Survey
          </button>
        </div>
      )}
    </div>
  );
};

export default FileCard;
