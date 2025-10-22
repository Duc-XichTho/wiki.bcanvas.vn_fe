import React from 'react';
import styles from '../../ProposalMaker.module.css';
import { X, Copy } from 'lucide-react';

const DuplicateDocumentModal = ({
  open,
  newDocumentName,
  setNewDocumentName,
  onConfirm,
  onClose
}) => {
  if (!open) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.modalCardSm}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Duplicate document</h3>
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
              Tên document mới
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
              onClick={onConfirm}
              disabled={!newDocumentName.trim()}
              className={`${styles.btnPrimary} ${styles.btnFull}`}
            >
              <Copy className={styles.iconSm} />
              Duplicate
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

export default DuplicateDocumentModal;


