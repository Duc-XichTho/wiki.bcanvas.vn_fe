import React from 'react';
import { X } from 'lucide-react';
import styles from './TaskChecklistModal.module.css';

const InfoViewerModal = ({ isOpen, onClose, content }) => {
  if (!isOpen || !content) return null;
  
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.infoViewerOverlay} onClick={handleOverlayClick}>
        <button className={styles.infoViewerCloseButton} onClick={onClose}>
          <X size={20} color="white" />
        </button>
        <div 
          className={styles.infoViewerContentInner}
          dangerouslySetInnerHTML={{ __html: content }}
        />
    </div>
  );
};

export default InfoViewerModal;
