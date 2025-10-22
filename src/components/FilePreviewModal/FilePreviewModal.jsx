import React from 'react';
import { Modal } from 'antd';
import styles from './FilePreviewModal.module.css';
import { getFileTypeCategory, getFileIcon } from './fileUtils';

const FilePreviewModal = ({ 
  isVisible, 
  selectedFile, 
  onCancel,
  modalStyle,
  modalClassName,
  width = "80%"
}) => {
  if (!selectedFile) return null;

  const renderFilePreview = () => {
    const fileType = getFileTypeCategory(selectedFile.fileExtension);
    
    switch (fileType) {
      case 'pdf':
        return (
          <iframe
            src={selectedFile.fileURL}
            className={styles.iframePreview}
            title={selectedFile.fileName}
          />
        );
      
      case 'image':
        return (
          <div className={styles.imagePreview}>
            <img
              src={selectedFile.fileURL}
              alt={selectedFile.fileName}
            />
          </div>
        );
      
      case 'document':
        return (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedFile.fileURL)}`}
            className={styles.iframePreview}
            title={selectedFile.fileName}
            frameBorder="0"
          />
        );
      
      default:
        return (
          <div className={styles.unsupportedFile}>
            <div className={styles.unsupportedFileIcon}>{getFileIcon(selectedFile.fileExtension)}</div>
            <div className={styles.unsupportedFileText}>
              Không thể xem trước loại file này
            </div>
            <div className={styles.unsupportedFileExtension}>
              {selectedFile.fileExtension.toUpperCase()}
            </div>
          </div>
        );
    }
  };

  return (
    <Modal
      title={selectedFile.fileName || 'Xem trước file'}
      open={isVisible}
      onCancel={onCancel}
      footer={null}
      width={width}
      style={{ top: 20, ...modalStyle }}
      className={modalClassName}
      bodyStyle={{ padding: 0, height: '80vh' }}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* File Info Header */}
        <div className={styles.fileInfoHeader}>
          <div className={styles.fileInfoText}>
            {getFileIcon(selectedFile.fileExtension)} {selectedFile.fileName} • {selectedFile.fileExtension.toUpperCase()}
          </div>
        </div>
        
        {/* File Preview Content */}
        <div className={styles.filePreviewContent}>
          {renderFilePreview()}
        </div>
      </div>
    </Modal>
  );
};

export default FilePreviewModal;
