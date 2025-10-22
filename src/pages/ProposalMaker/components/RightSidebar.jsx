import React from 'react';
import styles from './RightSidebar.module.css';

const RightSidebar = ({
  selectedDocument,
  documentInfo,
  updateDocumentInfo,
  referenceLinks,
  addReferenceLink,
  updateReferenceLink,
  removeReferenceLink,
  parseVariables,
  variableValues,
  handleVariableChange,
  isEditingTags,
  setIsEditingTags,
  tagTypes,
  tagIds,
  updateDocumentTags,
  newTagType,
  setNewTagType,
  addNewTagType,
  newTagId,
  setNewTagId,
  addNewTagId,
  toggleDocumentLock,
  toggleDocumentShare
}) => {
  return (
    <div className={styles.panel}>
      <div className={styles.panelSectionBorder}>
        <h3 className={styles.h3TitleDark}>Thông tin document</h3>
        {selectedDocument ? (
          <div className={styles.vSpace3}>
            <div>
              <label className={styles.labelXs}>PIC</label>
              <input
                type="text"
                value={documentInfo.pic}
                onChange={(e) => updateDocumentInfo('pic', e.target.value)}
                className={styles.inputText}
                placeholder="Người phụ trách..."
              />
            </div>

            <div>
              <label className={styles.labelXs}>Ghi chú</label>
              <textarea
                value={documentInfo.note}
                onChange={(e) => updateDocumentInfo('note', e.target.value)}
                className={styles.textarea}
                rows="2"
                placeholder="Ghi chú thêm..."
              />
            </div>

            <div className={styles.refBox}>
              <div className={styles.betweenRowMb3}>
                <span className={styles.labelMutedXs}>Liên kết tham khảo</span>
                <button onClick={addReferenceLink} className={styles.btnXsPrimary}>Add</button>
              </div>

              {referenceLinks.length > 0 ? (
                <div className={styles.vSpace3}>
                  {referenceLinks.map((link) => (
                    <div key={link.id} className={styles.refItem}>
                      <div className={styles.betweenRowMb2}>
                        <span className={styles.refIndex}>Link #{referenceLinks.indexOf(link) + 1}</span>
                        <button onClick={() => removeReferenceLink(link.id)} className={styles.btnIconDanger} title="Remove link">X</button>
                      </div>
                      <input
                        type="text"
                        value={link.title}
                        onChange={(e) => updateReferenceLink(link.id, 'title', e.target.value)}
                        className={`${styles.inputText} ${styles.mb2}`}
                        placeholder="Tiêu đề liên kết..."
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateReferenceLink(link.id, 'url', e.target.value)}
                        className={styles.inputText}
                        placeholder="https://example.com"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyRef}>Chưa có liên kết nào</div>
              )}
            </div>

            <div className={styles.vSpace2}>
              <div className={styles.betweenRow}>
                <span className={styles.labelXsEm}>Tags</span>
                {/* <button onClick={() => setIsEditingTags(!isEditingTags)} className={styles.btnXsGhostBlue}>
                  {isEditingTags ? 'Done' : 'Edit'}
                </button> */}
              </div>

              <div>
                <label className={styles.labelXs}>Type Tag</label>
                <div className={styles.inlineGap2}>
                  <select
                    value={selectedDocument.tagType}
                    onChange={(e) => updateDocumentTags(selectedDocument.id, e.target.value, selectedDocument.tagId)}
                    className={`${styles.inputText} ${styles.flex1}`}
                  >
                    {tagTypes.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
                {isEditingTags && (
                  <div className={styles.mt2}>
                    <input
                      type="text"
                      value={newTagType}
                      onChange={(e) => setNewTagType(e.target.value)}
                      placeholder="New tag type..."
                      className={styles.inputText}
                      onKeyDown={(e) => { if (e.key === 'Enter') addNewTagType(); }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className={styles.labelXs}>ID Tag</label>
                <div className={styles.inlineGap2}>
                  <select
                    value={selectedDocument.tagId}
                    onChange={(e) => updateDocumentTags(selectedDocument.id, selectedDocument.tagType, e.target.value)}
                    className={`${styles.inputText} ${styles.flex1}`}
                  >
                    {tagIds.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
                {isEditingTags && (
                  <div className={styles.mt2}>
                    <input
                      type="text"
                      value={newTagId}
                      onChange={(e) => setNewTagId(e.target.value)}
                      placeholder="New tag ID..."
                      className={styles.inputText}
                      onKeyDown={(e) => { if (e.key === 'Enter') addNewTagId(); }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className={styles.controlsBox}>
              <div className={styles.betweenRow}>
                <span className={styles.textSm}>Lock editing</span>
                <button onClick={() => toggleDocumentLock(selectedDocument.id)} className={`${styles.toggle} ${selectedDocument.isLocked ? styles.toggleOnBlue : styles.toggleOff}`}>
                  <span className={`${styles.toggleThumb} ${selectedDocument.isLocked ? styles.toggleThumbOn : styles.toggleThumbOff}`}/>
                </button>
              </div>
              <div className={styles.betweenRow}>
                <span className={styles.textSm}>Share document</span>
                <button onClick={() => toggleDocumentShare(selectedDocument.id)} className={`${styles.toggle} ${selectedDocument.isShared ? styles.toggleOnGreen : styles.toggleOff}`}>
                  <span className={`${styles.toggleThumb} ${selectedDocument.isShared ? styles.toggleThumbOn : styles.toggleThumbOff}`}/>
                </button>
              </div>

              {selectedDocument.isShared && (
                <div>
                  <label className={styles.labelXs}>Password bảo vệ (tùy chọn)</label>
                  <input
                    type="password"
                    value={documentInfo.password}
                    onChange={(e) => updateDocumentInfo('password', e.target.value)}
                    className={styles.inputText}
                    placeholder="Nhập mật khẩu..."
                  />
                  <p className={styles.helpTextXs}>Để trống nếu không cần mật khẩu</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className={styles.textSmMuted}>Chọn document để xem thông tin</p>
        )}
      </div>

      <div className={styles.variablesBox}>
        <h3 className={styles.h3TitleDark}>Variables</h3>
        {selectedDocument && parseVariables(selectedDocument.variables).length > 0 ? (
          <div className={styles.vSpace3}>
            {parseVariables(selectedDocument.variables).map((variable) => (
              <div key={variable}>
                <label className={styles.labelXs}>{variable}</label>
                <input
                  type="text"
                  value={variableValues[variable] || ''}
                  onChange={(e) => handleVariableChange(variable, e.target.value)}
                  disabled={selectedDocument.isLocked}
                  className={styles.inputText}
                  placeholder={`Giá trị cho ${variable}...`}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyVars}>Chưa có variables nào</p>
        )}
      </div>
    </div>
  );
};

export default RightSidebar;


