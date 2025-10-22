import React from 'react';
import styles from '../../ProposalMaker.module.css';
import { X, MessageCircle } from 'lucide-react';

const DiscussionFormModal = ({
  open,
  selectedText,
  discussionText,
  setDiscussionText,
  onAddDiscussion,
  onClose
}) => {
  if (!open) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.modalCardSm}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Thêm nhận xét</h3>
          <button
            onClick={() => {
              onClose();
              setDiscussionText('');
            }}
            className={styles.modalClose}
          >
            <X className={styles.iconMd} />
          </button>
        </div>

        <div className={styles.p6}>
          <div className={styles.mb4}>
            <label className={styles.labelSm}>
              {selectedText ? 'Đoạn văn bản được chọn:' : 'Thảo luận chung:'}
            </label>
            {selectedText ? (
              <div className={styles.selectedTextBox}>
                "{selectedText}"
              </div>
            ) : (
              <div className={styles.generalBox}>
                <div className={`${styles.inlineRowGap2} ${styles.textBlue700}`}>
                  <MessageCircle className={styles.iconSm} />
                  <span>Thảo luận chung về document</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.mb4}>
            <label className={styles.labelSm}>Nhận xét của bạn:</label>
            <textarea
              value={discussionText}
              onChange={(e) => setDiscussionText(e.target.value)}
              className={styles.textareaLg}
              rows="4"
              placeholder="Viết nhận xét..."
              autoFocus
            />
          </div>

          <div className={styles.inlineGap2}>
            <button onClick={onAddDiscussion} disabled={!discussionText.trim()} className={styles.btnPrimary}>
              Thêm nhận xét
            </button>
            <button
              onClick={() => {
                onClose();
                setDiscussionText('');
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

export default DiscussionFormModal;


