import React, { useState } from 'react';
import { Plus, Edit3, Save, X, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import styles from '../CustomerSurveyApp.module.css';

// Template Card Component
export const TemplateCard = ({ 
  template, 
  items, 
  isEditing, 
  onEditClick, 
  onAddItem 
}) => {
  return (
    <div className={styles.templateCard}>
      <div className={styles.templateCardHeader}>
        <div className={styles.templateCardHeaderContent}>
          <div className={styles.templateCardInfo}>
            <h3 className={styles.templateCardTitle}>{template.name}</h3>
            <p className={styles.templateCardDescription}>{template.description}</p>
            <p className={styles.templateCardCount}>{items.length} items</p>
          </div>
          <button
            onClick={onEditClick}
            className={styles.editButton}
          >
            {isEditing ? 'Đóng' : 'Chỉnh sửa'}
          </button>
        </div>
      </div>

      {!isEditing && (
        <div className={styles.templateCardBody}>
          <div className={styles.templateItemsGrid}>
            {items.slice(0, 3).map(item => (
              <div key={item.id} className={styles.templateItemPreview}>
                <div className={`${styles.templateItemDot} ${styles[item.type]}`} />
                <span className={styles.templateItemTitle}>{item.title}</span>
                <span className={`${styles.templateItemBadge} ${styles[item.type]}`}>
                  {item.type === 'title_desc' ? 'Title/Desc' : 
                   item.type === 'mcq' ? 'MCQ' : 'Q&A'}
                </span>
              </div>
            ))}
            {items.length > 3 && (
              <div className={styles.templateMoreItems}>
                +{items.length - 3} items khác
              </div>
            )}
          </div>
        </div>
      )}

      {isEditing && (
        <TemplateEditor 
          templateId={template.id} 
          items={items}
          onAddItem={onAddItem}
        />
      )}
    </div>
  );
};

// Template Editor Component
const TemplateEditor = ({ templateId, items, onAddItem }) => {
  return (
    <div className={styles.templateEditor}>
      <div className={styles.templateEditorHeader}>
        <h4 className={styles.templateEditorTitle}>Chỉnh sửa Items</h4>
        <div className={styles.templateEditorButtons}>
          <button
            onClick={async () => await onAddItem(templateId, 'title_desc')}
            className={`${styles.addItemButton} ${styles.titleDesc}`}
          >
            + Mục trao đổi
          </button>
          <button
            onClick={async () => await onAddItem(templateId, 'mcq')}
            className={`${styles.addItemButton} ${styles.mcq}`}
          >
            + Danh sách
          </button>
          <button
            onClick={async () => await onAddItem(templateId, 'qa')}
            className={`${styles.addItemButton} ${styles.qa}`}
          >
            + Q&A
          </button>
        </div>
      </div>

      <div className={styles.templateItemsList}>
        {items.map(item => (
          <TemplateItemEditor 
            key={item.id} 
            item={item} 
            isNew={false}
          />
        ))}
        
        {items.length === 0 && (
          <div className={styles.templateEmptyState}>
            <p className={styles.templateEmptyStateText}>Chưa có items nào</p>
            <p className={styles.templateEmptyStateSubtext}>Bấm nút bên trên để thêm items mới</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Template Item Editor Component
export const TemplateItemEditor = ({ 
  item, 
  onUpdate, 
  onDelete, 
  onMove, 
  isNew = false 
}) => {
  const [isEditing, setIsEditing] = useState(isNew);
  const [editData, setEditData] = useState(item);

  const handleSave = async () => {
    if (onUpdate) {
      await onUpdate(item.id, editData);
    }
    setIsEditing(false);
  };

  const handleCancel = async () => {
    if (isNew && onDelete) {
      await onDelete(item.id);
    } else {
      setEditData(item);
      setIsEditing(false);
    }
  };

  const addOption = () => {
    const newOptions = [...(editData.options || []), `Tùy chọn ${(editData.options?.length || 0) + 1}`];
    setEditData({ ...editData, options: newOptions });
  };

  const updateOption = (index, value) => {
    const newOptions = [...(editData.options || [])];
    newOptions[index] = value;
    setEditData({ ...editData, options: newOptions });
  };

  const removeOption = (index) => {
    const newOptions = editData.options?.filter((_, i) => i !== index) || [];
    setEditData({ ...editData, options: newOptions });
  };

  const updateOptionNote = (index, note) => {
    const optionNotes = editData.optionNotes || {};
    const option = editData.options?.[index];
    if (option) {
      const newOptionNotes = {
        ...optionNotes,
        [option]: note
      };
      setEditData({ ...editData, optionNotes: newOptionNotes });
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'title_desc': return 'Mục trao đổi';
      case 'mcq': return 'Danh sách';
      case 'qa': return 'Q&A';
      default: return type;
    }
  };

  return (
    <div className={`${styles.templateItemEditor} ${styles[item.type]}`}>
      <div className={styles.templateItemHeader}>
        <div className={styles.templateItemInfo}>
          <span className={styles.templateItemNumber}>
            #{item.order}
          </span>
          <span className={styles.templateItemType}>
            {getTypeLabel(item.type)}
          </span>
        </div>
        
        <div className={styles.templateItemActions}>
          {onMove && (
            <>
              <button
                onClick={async () => await onMove(item.id, 'up')}
                className={styles.actionButton}
                title="Di chuyển lên"
              >
                <ArrowUp className={styles.actionIcon} />
              </button>
              <button
                onClick={async () => await onMove(item.id, 'down')}
                className={styles.actionButton}
                title="Di chuyển xuống"
              >
                <ArrowDown className={styles.actionIcon} />
              </button>
            </>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={styles.actionButton}
            title="Chỉnh sửa"
          >
            <Edit3 className={styles.actionIcon} />
          </button>
          {onDelete && (
            <button
              onClick={async () => await onDelete(item.id)}
              className={`${styles.actionButton} ${styles.delete}`}
              title="Xóa"
            >
              <Trash2 className={styles.actionIcon} />
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className={styles.templateItemForm}>
          <input
            type="text"
            value={editData.title || ''}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            placeholder="Tiêu đề"
            className={styles.formInput}
          />

          {item.type === 'title_desc' && (
            <>
              <div className={styles.textareaWithFormatting}>
                <div className={styles.textareaHeader}>
                  <label className={styles.textareaLabel}>Mô tả:</label>
                  <div className={styles.formattingButtons}>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById(`description-${item.id}`);
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = editData.description || '';
                        const before = text.substring(0, start);
                        const selected = text.substring(start, end);
                        const after = text.substring(end);
                        const newText = before + '• ' + selected + after;
                        setEditData({ ...editData, description: newText });
                        setTimeout(() => {
                          textarea.focus();
                          textarea.setSelectionRange(start + 2, start + 2 + selected.length);
                        }, 0);
                      }}
                      className={styles.formatButton}
                      title="Thêm gạch đầu dòng"
                    >
                      •
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById(`description-${item.id}`);
                        const start = textarea.selectionStart;
                        const text = editData.description || '';
                        const before = text.substring(0, start);
                        const after = text.substring(start);
                        const newText = before + '\n' + after;
                        setEditData({ ...editData, description: newText });
                        setTimeout(() => {
                          textarea.focus();
                          textarea.setSelectionRange(start + 1, start + 1);
                        }, 0);
                      }}
                      className={styles.formatButton}
                      title="Xuống dòng"
                    >
                      ↵
                    </button>
                  </div>
                </div>
                <textarea
                  id={`description-${item.id}`}
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  placeholder="Mô tả (có thể dùng • để tạo gạch đầu dòng, ↵ để xuống dòng)"
                  rows="4"
                  className={styles.formTextarea}
                />
              </div>
              
              <div className={styles.textareaWithFormatting}>
                <div className={styles.textareaHeader}>
                  <label className={styles.textareaLabel}>Ghi chú (tùy chọn):</label>
                  <div className={styles.formattingButtons}>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById(`note-${item.id}`);
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = editData.note || '';
                        const before = text.substring(0, start);
                        const selected = text.substring(start, end);
                        const after = text.substring(end);
                        const newText = before + '• ' + selected + after;
                        setEditData({ ...editData, note: newText });
                        setTimeout(() => {
                          textarea.focus();
                          textarea.setSelectionRange(start + 2, start + 2 + selected.length);
                        }, 0);
                      }}
                      className={styles.formatButton}
                      title="Thêm gạch đầu dòng"
                    >
                      •
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById(`note-${item.id}`);
                        const start = textarea.selectionStart;
                        const text = editData.note || '';
                        const before = text.substring(0, start);
                        const after = text.substring(start);
                        const newText = before + '\n' + after;
                        setEditData({ ...editData, note: newText });
                        setTimeout(() => {
                          textarea.focus();
                          textarea.setSelectionRange(start + 1, start + 1);
                        }, 0);
                      }}
                      className={styles.formatButton}
                      title="Xuống dòng"
                    >
                      ↵
                    </button>
                  </div>
                </div>
                <textarea
                  id={`note-${item.id}`}
                  value={editData.note || ''}
                  onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                  placeholder="Ghi chú (có thể dùng • để tạo gạch đầu dòng, ↵ để xuống dòng)"
                  rows="3"
                  className={styles.formTextarea}
                />
              </div>
            </>
          )}

          {item.type === 'mcq' && (
            <div className={styles.optionsSection}>
              <label className={styles.optionsLabel}>Các tùy chọn:</label>
              <div className={styles.optionsList}>
                {editData.options?.map((option, index) => {
                  const optionNote = editData.optionNotes?.[option] || '';
                  return (
                    <div key={index} className={styles.optionItem}>
                      <div className={styles.optionInputContainer}>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className={styles.optionInput}
                          placeholder={`Tùy chọn ${index + 1}`}
                        />
                        <button
                          onClick={() => removeOption(index)}
                          className={styles.removeOptionButton}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className={styles.optionNoteContainer}>
                        <input
                          type="text"
                          value={optionNote}
                          onChange={(e) => updateOptionNote(index, e.target.value)}
                          className={styles.optionNoteInput}
                          placeholder="Ghi chú cho tùy chọn này..."
                        />
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={addOption}
                  className={styles.addOptionButton}
                >
                  + Thêm tùy chọn
                </button>
              </div>
            </div>
          )}

          <div className={styles.formButtons}>
            <button
              onClick={handleSave}
              className={styles.saveFormButton}
            >
              <Save className="w-4 h-4" />
              Lưu
            </button>
            <button
              onClick={handleCancel}
              className={styles.cancelFormButton}
            >
              <X className="w-4 h-4" />
              Hủy
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.templateItemDisplay}>
          <h5 className={styles.templateItemDisplayTitle}>{item.title}</h5>
          {item.description && (
            <div className={styles.templateItemDisplayDescription}>
              {item.description.split('\n').map((line, index) => (
                <div key={index} className={styles.templateItemDisplayDescriptionLine}>
                  {line}
                </div>
              ))}
            </div>
          )}
          {item.note && (
            <div className={styles.templateItemDisplayNote}>
              <span className={styles.templateItemDisplayNoteIcon}>📝</span>
              <div className={styles.templateItemDisplayNoteContent}>
                {item.note.split('\n').map((line, index) => (
                  <div key={index} className={styles.templateItemDisplayNoteLine}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
          {item.options && item.options.length > 0 && (
            <div className={styles.templateItemDisplayOptions}>
              <p className={styles.templateItemDisplayOptionsLabel}>Tùy chọn:</p>
              <div className={styles.templateItemDisplayOptionsList}>
                {item.options.map((option, index) => {
                  const optionNote = item.optionNotes?.[option];
                  return (
                    <div key={index} className={styles.templateItemDisplayOptionContainer}>
                      <span className={styles.templateItemDisplayOption}>
                        {option}
                      </span>
                      {optionNote && (
                        <span className={styles.templateItemDisplayOptionNote}>
                          📝 {optionNote}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Create Template Modal Component
export const CreateTemplateModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  data, 
  onChange 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (data.title.trim() && data.descriptions.trim()) {
      onSubmit(data);
      onClose();
      // Reset form
      onChange({ title: '', descriptions: '' });
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form
    onChange({ title: '', descriptions: '' });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Tạo Template Mới</h2>
          <button onClick={handleClose} className={styles.modalCloseButton}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.formLabel}>
              Tiêu đề *
            </label>
            <input
              type="text"
              id="title"
              value={data.title}
              onChange={(e) => onChange({ ...data, title: e.target.value })}
              className={styles.formInput}
              placeholder="Nhập tiêu đề template..."
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="descriptions" className={styles.formLabel}>
              Mô tả *
            </label>
            <textarea
              id="descriptions"
              value={data.descriptions}
              onChange={(e) => onChange({ ...data, descriptions: e.target.value })}
              className={styles.formTextarea}
              placeholder="Nhập mô tả template..."
              rows={4}
              required
            />
          </div>
          
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!data.title.trim() || !data.descriptions.trim()}
            >
              Tạo Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
