import React from 'react';
import styles from '../../ProposalMaker.module.css';
import { X, Check } from 'lucide-react';

const NewDocumentModal = ({
  open,
  newDocumentName,
  setNewDocumentName,
  onCreate,
  onClose
}) => {
  if (!open) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.modalCardSm}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Tạo document mới</h3>
          <button
            onClick={() => {
              onClose();
              setNewDocumentName('');
            }}
            className={styles.modalClose}
          >
            <X className={styles.iconMd} />
          </button>
        </div>

        <div className={styles.p6}>
          <div className={styles.mb4}>
            <label className={styles.labelSm}>
              Tên document
            </label>
            <input
              type="text"
              value={newDocumentName}
              onChange={(e) => setNewDocumentName(e.target.value)}
              className={styles.inputText}
              placeholder="Nhập tên document..."
              autoFocus
            />
          </div>

          <div className={styles.inlineGap2}>
            <button
              onClick={onCreate}
              disabled={!newDocumentName.trim()}
              className={`${styles.btnPrimary} ${styles.btnFull}`}
            >
              <Check className={styles.iconSm} />
              Tạo document
            </button>
            <button
              onClick={() => {
                onClose();
                setNewDocumentName('');
              }}
              className={styles.btnOutline}
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewDocumentModal;


