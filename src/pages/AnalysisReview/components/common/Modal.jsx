import React from 'react';
import { X, Check } from 'lucide-react';
import styles from '../../AnalysisReview.module.css';

const Modal = ({ 
  isOpen, 
  title, 
  onClose, 
  onSave, 
  onCancel, 
  children, 
  saveText = 'Save',
  cancelText = 'Cancel',
  saveDisabled = false
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button
            onClick={onClose}
            className={styles.modalCloseButton}
          >
            <X className={`${styles.h5} ${styles.w5}`} />
          </button>
        </div>
        
        <div className={styles.modalForm}>
          {children}
        </div>
        
        <div className={styles.modalActions}>
          <button
            onClick={onSave}
            disabled={saveDisabled}
            className={`${styles.modalButton} ${styles.primary}`}
          >
            <Check className={`${styles.h4} ${styles.w4}`} />
            {saveText}
          </button>
          <button
            onClick={onCancel}
            className={`${styles.modalButton} ${styles.secondary}`}
          >
            <X className={`${styles.h4} ${styles.w4}`} />
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal; 