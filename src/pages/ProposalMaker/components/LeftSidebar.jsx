import React from 'react';
import styles from './LeftSidebar.module.css';
import { Dropdown, Modal, Input , message } from 'antd';
import { Plus, Copy, Search, Share, Lock, Unlock, Edit3, Trash2, Check, X as XIcon,  } from 'lucide-react';
import { updateProposalDocument as updateProposalDocumentApi, deleteProposalDocument as deleteProposalDocumentApi } from '../../../apis/proposalDocumentService.jsx';
import { log } from 'mathjs';

const LeftSidebar = ({
  documents,
  setDocuments,
  tagTypes,
  tagIds,
  selectedTagTypes,
  setSelectedTagTypes,
  selectedTagIds,
  setSelectedTagIds,
  searchQuery,
  setSearchQuery,
  filteredDocuments,
  selectedDocument,
  setSelectedDocument,
  handleDuplicate,
  onNewDocument,
  formatDateTimestamp,
  onRenameDocument,
  onDeleteDocument
}) => {
  const typeTagsContainerRef = React.useRef(null);
  const idTagsContainerRef = React.useRef(null);
  const [typeVisibleCount, setTypeVisibleCount] = React.useState(tagTypes.length);
  const [idVisibleCount, setIdVisibleCount] = React.useState(tagIds.length);
  const [showAllTypeTags, setShowAllTypeTags] = React.useState(false);
  const [showAllIdTags, setShowAllIdTags] = React.useState(false);
  const [typeMoreOpen, setTypeMoreOpen] = React.useState(false);
  const [idMoreOpen, setIdMoreOpen] = React.useState(false);

  const [pendingIds, setPendingIds] = React.useState(new Set());
  const [confirmDoc, setConfirmDoc] = React.useState(null);
  const [renameDoc, setRenameDoc] = React.useState(null);
  const [renameName, setRenameName] = React.useState('');

  const computeVisibleCountFromButtons = (buttons, maxRows = 2) => {
    if (!buttons || buttons.length === 0) return 0;
    const rowTops = [];
    let count = 0;
    for (let i = 0; i < buttons.length; i++) {
      const top = buttons[i].offsetTop;
      if (rowTops.length === 0 || top !== rowTops[rowTops.length - 1]) {
        rowTops.push(top);
        if (rowTops.length > maxRows) break;
      }
      if (rowTops.length <= maxRows) count++;
    }
    return count;
  };

  const measureTypeTags = React.useCallback(() => {
    if (!typeTagsContainerRef.current || showAllTypeTags) return;
    const container = typeTagsContainerRef.current;
    const buttons = Array.from(container.querySelectorAll('.' + styles.tagButton));
    const prevDisplay = buttons.map(b => b.style.display);
    buttons.forEach(b => { b.style.display = 'inline-flex'; });
    const count = computeVisibleCountFromButtons(buttons, 2);
    setTypeVisibleCount(Math.min(count, tagTypes.length));
    buttons.forEach((b, i) => { b.style.display = prevDisplay[i] || ''; });
  }, [showAllTypeTags, tagTypes.length]);

  const measureIdTags = React.useCallback(() => {
    if (!idTagsContainerRef.current || showAllIdTags) return;
    const container = idTagsContainerRef.current;
    const buttons = Array.from(container.querySelectorAll('.' + styles.tagButton));
    const prevDisplay = buttons.map(b => b.style.display);
    buttons.forEach(b => { b.style.display = 'inline-flex'; });
    const count = computeVisibleCountFromButtons(buttons, 2);
    setIdVisibleCount(Math.min(count, tagIds.length));
    buttons.forEach((b, i) => { b.style.display = prevDisplay[i] || ''; });
  }, [showAllIdTags, tagIds.length]);

  React.useEffect(() => {
    measureTypeTags();
    measureIdTags();
    const onResize = () => { measureTypeTags(); measureIdTags(); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [measureTypeTags, measureIdTags]);

  const startRename = (doc) => {
    setRenameDoc(doc);
    setRenameName(doc.name || '');
  };

  const submitRename = async (doc) => {
    const name = renameName.trim();
    if (!name || name === doc.name) {
      setRenameDoc(null);
      setRenameName('');
      return;
    }
    try {
      setPendingIds(prev => new Set(prev).add(doc.id));
      if (typeof onRenameDocument === 'function') {
        await onRenameDocument(doc.id, name);
        setDocuments(documents.map(d => d.id === doc.id ? { ...d, name } : d));
      } else {
        await updateProposalDocumentApi({ id: doc.id, name });
        setDocuments(documents.map(d => d.id === doc.id ? { ...d, name } : d));
      }
      if (selectedDocument?.id === doc.id) {
        setSelectedDocument({ ...selectedDocument, name });
      }
    } catch (e) {
      console.error('Rename failed:', e);
      message.error('Đổi tên thất bại');
    } finally {
      setPendingIds(prev => { const n = new Set(prev); n.delete(doc.id); return n; });
      setRenameDoc(null);
      setRenameName('');
    }
  };

  const deleteDoc = (doc) => {
    setConfirmDoc(doc);
  };

  const confirmDelete = async () => {
    const doc = confirmDoc;
    if (!doc) return;
    try {
      setPendingIds(prev => new Set(prev).add(doc.id));
      if (typeof onDeleteDocument === 'function') {
        await onDeleteDocument(doc.id);
        setDocuments(documents.filter(d => d.id !== doc.id));
      } else {
        await deleteProposalDocumentApi(doc.id);
        setDocuments(documents.filter(d => d.id !== doc.id));
      }
      if (selectedDocument?.id === doc.id) {
        setSelectedDocument(null);
      }
    } catch (e) {
      console.error('Delete failed:', e);
      message.error('Xóa thất bại');
    } finally {
      setPendingIds(prev => { const n = new Set(prev); n.delete(doc.id); return n; });
      setConfirmDoc(null);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelSectionBorder}>
        <div className={styles.headerActionsRow}>
          <h3 className={styles.h3Title}>Documents</h3>
          <button onClick={onNewDocument} className={styles.btnNew}>
            <Plus className={styles.iconXs} />
            New
          </button>
        </div>

        <div className={styles.searchWrapRelative}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.vSpace2}>
          <div>
            <label className={styles.tagLabel}>Type Tags</label>
            <div className={styles.tagsWrap} ref={typeTagsContainerRef}>
              {(showAllTypeTags ? tagTypes : tagTypes.slice(0, typeVisibleCount)).map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTagTypes(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                  }}
                  className={`${styles.tagButton} ${selectedTagTypes.includes(tag) ? styles.tagButtonActive : ''}`}
                >
                  {tag}
                </button>
              ))}
              {!showAllTypeTags && typeVisibleCount < tagTypes.length && (
                <Dropdown
                  open={typeMoreOpen}
                  onOpenChange={(v) => setTypeMoreOpen(v)}
                  placement="bottomRight"
                  dropdownRender={() => (
                    <div
                      style={{
                        maxHeight: 300,
                        overflowY: 'auto',
                        padding: 8,
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        boxShadow: '0 12px 24px rgba(0,0,0,0.14)',
                        minWidth: 220
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8 }}>Chọn Type Tags</div>
                      <div style={{ display: 'grid', gap: 6 }}>
                        {tagTypes.slice(typeVisibleCount).map(tag => (
                          <button
                            key={tag}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTagTypes(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                            }}
                            className={styles.moreDropdownItem}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 6, fontSize: 12, color: '#111827', background: selectedTagTypes.includes(tag) ? '#eff6ff' : 'transparent' }}
                          >
                            <span style={{ width: 14, height: 14, borderRadius: 4, border: '1px solid #cbd5e1', background: selectedTagTypes.includes(tag) ? '#3b82f6' : '#fff' }}/>
                            <span>{tag}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                >
                  <button
                    className={styles.moreButtonBlue}
                    onClick={(e) => { e.stopPropagation(); setTypeMoreOpen(true); }}
                    title={`Chọn thêm (${tagTypes.length - typeVisibleCount})`}
                  >
                    +{tagTypes.length - typeVisibleCount} more
                  </button>
                </Dropdown>
              )}
            </div>
          </div>

          <div>
            <label className={styles.tagLabel}>ID Tags</label>
            <div className={styles.tagsWrap} ref={idTagsContainerRef}>
              {(showAllIdTags ? tagIds : tagIds.slice(0, idVisibleCount)).map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTagIds(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                  }}
                  className={`${styles.tagButton} ${selectedTagIds.includes(tag) ? styles.idTagButtonActive : ''}`}
                >
                  {tag}
                </button>
              ))}
              {!showAllIdTags && idVisibleCount < tagIds.length && (
                <Dropdown
                  open={idMoreOpen}
                  onOpenChange={(v) => setIdMoreOpen(v)}
                  placement="bottomRight"
                  dropdownRender={() => (
                    <div
                      style={{
                        maxHeight: 300,
                        overflowY: 'auto',
                        padding: 8,
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        boxShadow: '0 12px 24px rgba(0,0,0,0.14)',
                        minWidth: 220
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8 }}>Chọn ID Tags</div>
                      <div style={{ display: 'grid', gap: 6 }}>
                        {tagIds.slice(idVisibleCount).map(tag => (
                          <button
                            key={tag}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTagIds(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                            }}
                            className={styles.moreDropdownItem}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 6, fontSize: 12, color: '#111827', background: selectedTagIds.includes(tag) ? '#ecfdf5' : 'transparent' }}
                          >
                            <span style={{ width: 14, height: 14, borderRadius: 4, border: '1px solid #cbd5e1', background: selectedTagIds.includes(tag) ? '#10b981' : '#fff' }}/>
                            <span>{tag}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                >
                  <button
                    className={styles.moreButtonGreen}
                    onClick={(e) => { e.stopPropagation(); setIdMoreOpen(true); }}
                    title={`Chọn thêm (${tagIds.length - idVisibleCount})`}
                  >
                    +{tagIds.length - idVisibleCount} more
                  </button>
                </Dropdown>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.docList}>
        {filteredDocuments.map((document) => (
          <div
            key={document.id}
            className={`${styles.docItem} ${selectedDocument?.id === document.id ? styles.docItemActive : ''}`}
            onClick={() => {
              setSelectedDocument(document);
            }}
          >
            <div className={styles.docItemHeader}>
              <div className={styles.docItemHeaderLeft}>
                <h4 className={styles.docItemTitle}>{document.name}</h4>
                <div className={styles.badgesRow}>
                  <span className={styles.badgeType}>{document.tagType}</span>
                  <span className={styles.badgeId}>{document.tagId}</span>
                </div>
                <p className={styles.meta}>PIC: {document.pic || 'Chưa assign'} • {formatDateTimestamp ? formatDateTimestamp(document.createdAt) : document.createdAt}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => startRename(document)} className={styles.dupBtn} title="Đổi tên">
                  <Edit3 className={styles.dupIcon} />
                </button>
                <button
                  onClick={() => handleDuplicate(document)}
                  className={styles.dupBtn}
                  title="Duplicate"
                >
                  <Copy className={styles.dupIcon} />
                </button>
                <button
                  onClick={() => deleteDoc(document)}
                  className={styles.dupBtn}
                  title="Xóa"
                >
                  <Trash2 className={styles.dupIcon} />
                </button>
              </div>
            </div>
            <div className={styles.statusRow}>
              <div className={styles.statusItem}>
                {document.isLocked ? (
                  <Lock className={styles.lockIcon} />
                ) : (
                  <Unlock className={styles.unlockIcon} />
                )}
                <span className={document.isLocked ? styles.lockText : styles.editableText}>
                  {document.isLocked ? 'Locked' : 'Editable'}
                </span>
              </div>
              {document.isShared && (
                <div className={styles.sharedRow}>
                  <Share className={styles.shareIcon} />
                  <span className={styles.shareText}>Shared</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!confirmDoc}
        title="Xác nhận xóa"
        onOk={confirmDelete}
        okText="Xóa"
        okButtonProps={{ danger: true, disabled: !!(confirmDoc && pendingIds.has(confirmDoc.id)) }}
        confirmLoading={!!(confirmDoc && pendingIds.has(confirmDoc.id))}
        onCancel={() => setConfirmDoc(null)}
        cancelText="Hủy"
      >
        {confirmDoc ? (
          <div>
            Bạn có chắc chắn muốn xóa document "{confirmDoc.name}"?
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!renameDoc}
        title="Đổi tên document"
        onOk={() => submitRename(renameDoc)}
        okText="Lưu"
        confirmLoading={!!(renameDoc && pendingIds.has(renameDoc.id))}
        onCancel={() => { setRenameDoc(null); setRenameName(''); }}
        cancelText="Hủy"
      >
        {renameDoc ? (
          <div>
            <div style={{ marginBottom: 8, fontSize: 12, color: '#6b7280' }}>Tên hiện tại: {renameDoc.name}</div>
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              placeholder="Nhập tên mới"
              onKeyDown={(e) => { if (e.key === 'Enter') submitRename(renameDoc); }}
              autoFocus
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default LeftSidebar;


