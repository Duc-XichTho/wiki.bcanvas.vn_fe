import React from 'react';
import TipTapProposalMaker from '../Tiptap/TipTapProposalMaker.jsx';
import styles from './MiddleEditor.module.css';

const MiddleEditor = ({
  selectedDocument,
  handleEditorChange,
  headerActionsRight
}) => {
  return (
    <div className={styles.panel}>
      <div className={styles.panelSectionBorder}>
        <div className={styles.headerActionsBetween}>
          <h3 className={styles.h3TitleDark}>
            {(selectedDocument ? selectedDocument.name : 'Chọn document để bắt đầu')}
          </h3>
          <div className={styles.actionsRow}>{headerActionsRight}</div>
        </div>
      </div>

      {selectedDocument ? (
        <>

          <div className={`${styles.formatBar} ${selectedDocument.isLocked ? styles.disabled : ''}`}>
            <div className={styles.editorContainer}>
              {selectedDocument.isLocked && (
                <div className={styles.lockedBadge}>
                  <span className={styles.iconXs}>🔒</span>
                  <span>Locked</span>
                </div>
              )}
            </div>
            <div className={`${styles.editorArea} ${selectedDocument.isLocked ? styles.editorLockedBorder : ''}`} style={{ minHeight: '450px', lineHeight: '1.6' }}>
              <TipTapProposalMaker
                selectedDocument={selectedDocument}
                showToolbar={true}
                onUpdate={handleEditorChange}
              />
            </div>
          </div>


        </>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateInner}>
            <div className={styles.emptyIcon}>📝</div>
            <p>Chọn document từ sidebar để bắt đầu chỉnh sửa</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiddleEditor;


