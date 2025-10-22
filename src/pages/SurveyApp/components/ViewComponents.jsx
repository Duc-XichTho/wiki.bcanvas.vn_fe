import React, { useState, useRef, useMemo } from 'react';
import { ChevronLeft, Edit3, ArrowUp, ArrowDown, Trash2, Save, X, Check, Table, ChevronDown, CheckCircle } from 'lucide-react';
import SurveyItems from './SurveyItems';
import SalesActionSection from './SalesActionSection';
import styles from '../CustomerSurveyApp.module.css';
import { TemplateItemEditor } from './TemplateComponents.jsx';
import TableViewModal from './TableViewModal.jsx';

// Survey View Component
export const SurveyView = ({ 
  selectedFile, 
  surveyItems, 
  surveyItemsLoading, 
  expandedNotes,
  isSaving,
  onBackToFiles, 
  onToggleCompleted, 
  onToggleNote, 
  onUpdateMCQSelection, 
  onUpdateChoiceNote,
  onUpdateQAAnswer, 
  onUpdateNoteValue,
  onUpdateSalesInfo,
  onRefetchSurveyData,
  onUpdateTitle,
  onUpdateTags
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [showTableView, setShowTableView] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tempTags, setTempTags] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const titleInputRef = useRef(null);

  if (!selectedFile) return null;

  const completedCount = surveyItems.filter(item => item.completed && item.type !== 'section_header').length;

  // Calculate section completion status
  const calculateSectionCompletion = (items) => {
    const sectionStatus = {};
    
    items.forEach(item => {
      if (item.sectionId && item.type !== 'section_header') {
        if (!sectionStatus[item.sectionId]) {
          sectionStatus[item.sectionId] = {
            totalItems: 0,
            completedItems: 0,
            completed: false
          };
        }
        sectionStatus[item.sectionId].totalItems++;
        if (item.completed) {
          sectionStatus[item.sectionId].completedItems++;
        }
      }
    });
    
    // Calculate completion for each section
    Object.keys(sectionStatus).forEach(sectionId => {
      const section = sectionStatus[sectionId];
      section.completed = section.totalItems > 0 && section.completedItems === section.totalItems;
    });
    
    return sectionStatus;
  };

  // Extract sections from survey items with completion status
  const sections = useMemo(() => {
    const sectionHeaders = surveyItems.filter(item => item.type === 'section_header');
    const nonSectionItems = surveyItems.filter(item => item.type !== 'section_header');
    const sectionCompletion = calculateSectionCompletion(surveyItems);
    
    return [
      { id: 'all', title: 'Tất cả', count: nonSectionItems.length, completed: false },
      ...sectionHeaders.map(header => ({
        id: header.sectionId,
        title: header.title,
        count: surveyItems.filter(item => item.sectionId === header.sectionId && item.type !== 'section_header').length,
        completed: sectionCompletion[header.sectionId]?.completed || false
      }))
    ];
  }, [surveyItems]);

  // Filter survey items based on selected section
  const filteredSurveyItems = useMemo(() => {
    if (selectedSection === 'all') {
      return surveyItems;
    }
    return surveyItems.filter(item => item.sectionId === selectedSection);
  }, [surveyItems, selectedSection]);

  const handleTitleEdit = () => {
    setTempTitle(selectedFile.name);
    setIsEditingTitle(true);
    
    // Focus vào input sau khi state đã được cập nhật
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        // Đặt con trỏ về cuối text
        titleInputRef.current.setSelectionRange(
          titleInputRef.current.value.length,
          titleInputRef.current.value.length
        );
      }
    }, 0);
  };

  const handleTitleSave = async () => {
    if (tempTitle.trim()) {
      try {
        await onUpdateTitle(tempTitle.trim());
        setIsEditingTitle(false);
      } catch (error) {
        console.error('Error updating title:', error);
        // Keep editing mode on if there's an error
      }
    }
  };

  const handleTitleCancel = () => {
    setTempTitle('');
    setIsEditingTitle(false);
    if (titleInputRef.current) {
      titleInputRef.current.blur();
    }
  };

  // Tag editing functions
  const handleStartEditTags = () => {
    setTempTags(selectedFile.tags.join(', '));
    setIsEditingTags(true);
  };

  const handleSaveTags = async () => {
    const newTags = tempTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    await onUpdateTags(selectedFile.id, newTags);
    setIsEditingTags(false);
  };

  const handleCancelTags = () => {
    setTempTags('');
    setIsEditingTags(false);
  };

  return (
    <div className={styles.surveyView}>
      <div className={styles.surveyHeader}>
        <div className={styles.surveyHeaderContent}>
          {/* Back button hidden - not working */}
          <div>
                         {isEditingTitle ? (
               <div className={styles.titleEditContainer}>
                 <input
                   ref={titleInputRef}
                   type="text"
                   value={tempTitle}
                                       onChange={(e) => {
                      const cursorPosition = e.target.selectionStart;
                      const newValue = e.target.value;
                      setTempTitle(newValue);
                      // Khôi phục vị trí con trỏ sau khi state được cập nhật
                      setTimeout(() => {
                        if (titleInputRef.current) {
                          titleInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
                        }
                      }, 0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTitleSave();
                      } else if (e.key === 'Escape') {
                        handleTitleCancel();
                      }
                    }}
                   className={styles.titleEditInput}
                 />
                <div className={styles.titleEditButtons}>
                  <button
                    onClick={handleTitleSave}
                    className={styles.titleSaveButton}
                  >
                    Lưu
                  </button>
                  <button
                    onClick={handleTitleCancel}
                    className={styles.titleCancelButton}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.titleDisplayContainer}>
                                                   <h1 
                    className={styles.surveyTitle}
                    onClick={handleTitleEdit}
                    title="Click để chỉnh sửa tiêu đề"
                  >
                   {selectedFile.name}
                 </h1>
                                                   <button
                    onClick={handleTitleEdit}
                    className={styles.titleEditIcon}
                  >
                   <Edit3 className="w-4 h-4" />
                 </button>
              </div>
            )}
            <p className={styles.surveyProgress}>
              {completedCount}/{surveyItems.filter(item => item.type !== 'section_header').length} hoàn thành
              {isSaving && (
                <span className={styles.savingIndicator}>
                  <div className={styles.savingSpinner}></div>
                  Đang lưu...
                </span>
              )}
            </p>
          </div>
        </div>

        <div className={styles.surveyHeaderActions}>
          {/* Table view button hidden */}
        </div>
      </div>

      <div className={styles.surveyTags}>
        {isEditingTags ? (
          <div className={styles.editTagsContainer}>
            <input
              type="text"
              value={tempTags}
              onChange={(e) => setTempTags(e.target.value)}
              placeholder="Tag1, Tag2, Tag3..."
              className={styles.editTagsInput}
            />
            <div className={styles.editTagsButtons}>
              <button
                onClick={handleSaveTags}
                className={styles.saveTagsButton}
              >
                Lưu
              </button>
              <button
                onClick={handleCancelTags}
                className={styles.cancelTagsButton}
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <>
            {selectedFile.tags.map((tag, index) => (
              <span 
                key={index}
                className={styles.surveyTag}
              >
                {tag}
              </span>
            ))}
            <button
              onClick={handleStartEditTags}
              className={styles.editTagsButton}
            >
              <Edit3 className="w-4 h-4" />
              Chỉnh sửa Tag
            </button>
          </>
        )}
      </div>

      {/* Section Navigation */}
      {sections.length > 1 && (
        <div className={styles.sectionNavigationButtons}>
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section.id)}
              className={`${styles.sectionNavigationButton} ${
                selectedSection === section.id ? styles.sectionNavigationButtonActive : ''
              }`}
            >
              <span className={styles.sectionNavigationButtonContent}>
                {section.title}
                {section.completed && (
                  <CheckCircle className={styles.sectionCompletedIcon} />
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      <SurveyItems 
        surveyItems={filteredSurveyItems}
        surveyItemsLoading={surveyItemsLoading}
        expandedNotes={expandedNotes}
        onToggleCompleted={onToggleCompleted}
        onToggleNote={onToggleNote}
        onUpdateMCQSelection={onUpdateMCQSelection}
        onUpdateChoiceNote={onUpdateChoiceNote}
        onUpdateQAAnswer={onUpdateQAAnswer}
        onUpdateNoteValue={onUpdateNoteValue}
        sectionCompletion={calculateSectionCompletion(surveyItems)}
      />

      {/* Sales Action Section */}
      <SalesActionSection 
        file={selectedFile} 
        onUpdate={onUpdateSalesInfo}
        onRefetch={onRefetchSurveyData}
      />

      {/* Table View Modal */}
      <TableViewModal
        isOpen={showTableView}
        onClose={() => setShowTableView(false)}
        surveyItems={surveyItems}
        surveyTitle={selectedFile.name}
      />
    </div>
  );
};

// Template Settings View Component
export const TemplateSettingsView = ({ 
  templates, 
  templatesLoading, 
  templateItems,
  templateSections,
  editingTemplate,
  showCreateTemplateModal,
  newTemplateData,
  onShowCreateTemplateModal,
  onCreateTemplate,
  onUpdateTemplateData,
  onEditTemplate,
  onAddTemplateSection,
  onAddTemplateItem,
  onUpdateTemplateItem,
  onDeleteTemplateItem,
  onMoveTemplateItem,
  onUpdateTemplateSection,
  onDeleteTemplateSection,
  onDeleteTemplate,
  onUpdateTemplate
}) => {
  const [editingFields, setEditingFields] = useState({});
  const [tempValues, setTempValues] = useState({});

  const getTemplateItems = (templateId) => {
    return templateItems.filter(item => item.templateId === templateId).sort((a, b) => a.order - b.order);
  };

  const getTemplateSections = (templateId) => {
    return templateSections.filter(section => section.templateId === templateId).sort((a, b) => a.order - b.order);
  };

  const handleStartEdit = (templateId, field) => {
    setEditingFields(prev => ({ ...prev, [`${templateId}-${field}`]: true }));
    setTempValues(prev => ({ 
      ...prev, 
      [`${templateId}-${field}`]: templates.find(t => t.id === templateId)[field] 
    }));
  };

  const handleSaveEdit = (templateId, field) => {
    const template = templates.find(t => t.id === templateId);
    const newValue = tempValues[`${templateId}-${field}`];
    
    if (newValue !== template[field]) {
      onUpdateTemplate(templateId, { ...template, [field]: newValue });
    }
    
    setEditingFields(prev => ({ ...prev, [`${templateId}-${field}`]: false }));
    setTempValues(prev => ({ ...prev, [`${templateId}-${field}`]: '' }));
  };

  const handleCancelEdit = (templateId, field) => {
    setEditingFields(prev => ({ ...prev, [`${templateId}-${field}`]: false }));
    setTempValues(prev => ({ ...prev, [`${templateId}-${field}`]: '' }));
  };

  return (
    <div className={styles.templateSettings}>
      <div className={styles.templateSettingsHeader}>
        <h1 className={styles.templateSettingsTitle}>Template Settings</h1>
        <p className={styles.templateSettingsSubtitle}>Cấu hình template cho các file khảo sát</p>
        <button
          onClick={onShowCreateTemplateModal}
          className={styles.createTemplateButton}
        >
          <span>+</span>
          Tạo Template Mới
        </button>
      </div>

      <div className={styles.templateCards}>
        {templatesLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Đang tải templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Không có templates nào được tìm thấy.</p>
          </div>
        ) : (
          templates.map(template => {
            const sections = getTemplateSections(template.id);
            const totalItems = sections.reduce((total, section) => total + (section.items?.length || 0), 0);
            const isEditing = editingTemplate === template.id;
            
            return (
              <div key={template.id} className={styles.templateCard}>
                <div className={styles.templateCardHeader}>
                  <div className={styles.templateCardHeaderContent}>
                    <div className={styles.templateCardInfo}>
                      {isEditing ? (
                        <div className={styles.templateEditForm}>
                          <div className={styles.templateEditField}>
                            {editingFields[`${template.id}-name`] ? (
                              <div className={styles.templateEditInputGroup}>
                                <input
                                  type="text"
                                  value={tempValues[`${template.id}-name`] || ''}
                                  onChange={(e) => setTempValues(prev => ({ 
                                    ...prev, 
                                    [`${template.id}-name`]: e.target.value 
                                  }))}
                                  className={styles.templateEditTitle}
                                  placeholder="Template name"
                                  autoFocus
                                />
                                <div className={styles.templateEditActions}>
                                  <button
                                    onClick={() => handleSaveEdit(template.id, 'name')}
                                    className={styles.templateEditSaveButton}
                                    title="Lưu"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCancelEdit(template.id, 'name')}
                                    className={styles.templateEditCancelButton}
                                    title="Hủy"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className={styles.templateEditDisplay}>
                                <div className={styles.templateEditTextGroup}>
                                  <h3 className={styles.templateCardTitle}>{template.name}</h3>
                                  <button
                                    onClick={() => handleStartEdit(template.id, 'name')}
                                    className={styles.templateEditIcon}
                                    title="Chỉnh sửa tên"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className={styles.templateEditField}>
                            {editingFields[`${template.id}-description`] ? (
                              <div className={styles.templateEditInputGroup}>
                                <textarea
                                  value={tempValues[`${template.id}-description`] || ''}
                                  onChange={(e) => setTempValues(prev => ({ 
                                    ...prev, 
                                    [`${template.id}-description`]: e.target.value 
                                  }))}
                                  className={styles.templateEditDescription}
                                  placeholder="Template description"
                                  rows={2}
                                  autoFocus
                                />
                                <div className={styles.templateEditActions}>
                                  <button
                                    onClick={() => handleSaveEdit(template.id, 'description')}
                                    className={styles.templateEditSaveButton}
                                    title="Lưu"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCancelEdit(template.id, 'description')}
                                    className={styles.templateEditCancelButton}
                                    title="Hủy"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className={styles.templateEditDisplay}>
                                <div className={styles.templateEditTextGroup}>
                                  <p className={styles.templateCardDescription}>{template.description}</p>
                                  <button
                                    onClick={() => handleStartEdit(template.id, 'description')}
                                    className={styles.templateEditIcon}
                                    title="Chỉnh sửa mô tả"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <p className={styles.templateCardCount}>{sections.length} sections, {totalItems} items</p>
                        </div>
                      ) : (
                        <>
                          <h3 className={styles.templateCardTitle}>{template.name}</h3>
                          <p className={styles.templateCardDescription}>{template.description}</p>
                          <p className={styles.templateCardCount}>{sections.length} sections, {totalItems} items</p>
                        </>
                      )}
                    </div>
                    <div className={styles.templateCardActions}>
                      <button
                        onClick={() => onEditTemplate(template.id)}
                        className={styles.editButton}
                      >
                        {isEditing ? 'Đóng' : 'Chỉnh sửa'}
                      </button>
                      <button
                        onClick={() => onDeleteTemplate(template.id)}
                        className={styles.deleteButton}
                        title="Xoá template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {!isEditing && (
                  <div className={styles.templateCardBody}>
                    <div className={styles.templateSectionsGrid}>
                      {sections.slice(0, 3).map(section => (
                        <div key={section.id} className={styles.templateSectionPreview}>
                          <div className={styles.templateSectionHeader}>
                            <h4 className={styles.templateSectionTitle}>{section.title}</h4>
                            <span className={styles.templateSectionBadge}>
                              {section.items?.length || 0} items
                            </span>
                          </div>
                          <p className={styles.templateSectionDescription}>{section.description}</p>
                          {section.items && section.items.slice(0, 2).map(item => (
                            <div key={item.id} className={styles.templateItemPreview}>
                              <div className={`${styles.templateItemDot} ${styles[item.type]}`} />
                              <span className={styles.templateItemTitle}>{item.title}</span>
                              <span className={`${styles.templateItemBadge} ${styles[item.type]}`}>
                                {item.type === 'title_desc' ? 'Title/Desc' : 
                                 item.type === 'mcq' ? 'MCQ' : 'Q&A'}
                              </span>
                            </div>
                          ))}
                          {section.items && section.items.length > 2 && (
                            <div className={styles.templateMoreItems}>
                              +{section.items.length - 2} items khác
                            </div>
                          )}
                        </div>
                      ))}
                      {sections.length > 3 && (
                        <div className={styles.templateMoreSections}>
                          +{sections.length - 3} sections khác
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className={styles.templateEditor}>
                    <div className={styles.templateEditorHeader}>
                      <h4 className={styles.templateEditorTitle}>Chỉnh sửa Sections</h4>
                      <div className={styles.templateEditorButtons}>
                        <button
                          onClick={async () => await onAddTemplateSection(template.id)}
                          className={styles.addSectionButton}
                        >
                          + Section mới
                        </button>
                      </div>
                    </div>

                    <div className={styles.templateSectionsList}>
                      {sections.map(section => (
                        <TemplateSectionEditor
                          key={section.id}
                          section={section}
                          onUpdateSection={onUpdateTemplateSection}
                          onDeleteSection={onDeleteTemplateSection}
                          onAddItem={onAddTemplateItem}
                          onUpdateItem={onUpdateTemplateItem}
                          onDeleteItem={onDeleteTemplateItem}
                          onMoveItem={onMoveTemplateItem}
                        />
                      ))}
                      
                      {sections.length === 0 && (
                        <div className={styles.templateEmptyState}>
                          <p className={styles.templateEmptyStateText}>Chưa có sections nào</p>
                          <p className={styles.templateEmptyStateSubtext}>Bấm nút bên trên để thêm section mới</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Template Section Editor Component
const TemplateSectionEditor = ({ 
  section, 
  onUpdateSection, 
  onDeleteSection,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onMoveItem
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState(section.title);
  const [tempDescription, setTempDescription] = useState(section.description);

  const handleSaveTitle = () => {
    if (tempTitle.trim() !== section.title) {
      onUpdateSection(section.id, { title: tempTitle.trim() });
    }
    setEditingTitle(false);
  };

  const handleSaveDescription = () => {
    if (tempDescription.trim() !== section.description) {
      onUpdateSection(section.id, { description: tempDescription.trim() });
    }
    setEditingDescription(false);
  };

  const handleCancelEdit = () => {
    setTempTitle(section.title);
    setTempDescription(section.description);
    setEditingTitle(false);
    setEditingDescription(false);
  };

  return (
    <div className={styles.templateSectionEditor}>
      <div className={styles.templateSectionEditorHeader}>
        <div className={styles.templateSectionEditorInfo}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.templateSectionToggle}
          >
            <ChevronDown className={`w-4 h-4 ${isExpanded ? styles.expanded : ''}`} />
          </button>
          
          <div className={styles.templateSectionTitleGroup}>
            {editingTitle ? (
              <div className={styles.templateSectionEditInputGroup}>
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className={styles.templateSectionEditTitle}
                  placeholder="Section title"
                  autoFocus
                />
                <div className={styles.templateSectionEditActions}>
                  <button
                    onClick={handleSaveTitle}
                    className={styles.templateSectionEditSaveButton}
                    title="Lưu"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className={styles.templateSectionEditCancelButton}
                    title="Hủy"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.templateSectionEditDisplay}>
                <h5 className={styles.templateSectionEditorTitle}>{section.title}</h5>
                <button
                  onClick={() => setEditingTitle(true)}
                  className={styles.templateSectionEditIcon}
                  title="Chỉnh sửa tên"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className={styles.templateSectionDescriptionGroup}>
            {editingDescription ? (
              <div className={styles.templateSectionEditInputGroup}>
                <textarea
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  className={styles.templateSectionEditDescription}
                  placeholder="Section description"
                  rows={2}
                  autoFocus
                />
                <div className={styles.templateSectionEditActions}>
                  <button
                    onClick={handleSaveDescription}
                    className={styles.templateSectionEditSaveButton}
                    title="Lưu"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className={styles.templateSectionEditCancelButton}
                    title="Hủy"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.templateSectionEditDisplay}>
                <p className={styles.templateSectionEditorDescription}>{section.description}</p>
                <button
                  onClick={() => setEditingDescription(true)}
                  className={styles.templateSectionEditIcon}
                  title="Chỉnh sửa mô tả"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.templateSectionEditorActions}>
          <button
            onClick={() => onDeleteSection(section.id)}
            className={styles.templateSectionDeleteButton}
            title="Xóa section"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.templateSectionEditorBody}>
          <div className={styles.templateSectionItemsHeader}>
            <h6 className={styles.templateSectionItemsTitle}>Items ({section.items?.length || 0})</h6>
            <div className={styles.templateSectionItemsButtons}>
              <button
                onClick={async () => await onAddItem(section.templateId, section.id, 'title_desc')}
                className={`${styles.addItemButton} ${styles.titleDesc}`}
              >
                + Mục trao đổi
              </button>
              <button
                onClick={async () => await onAddItem(section.templateId, section.id, 'mcq')}
                className={`${styles.addItemButton} ${styles.mcq}`}
              >
                + Danh sách
              </button>
              <button
                onClick={async () => await onAddItem(section.templateId, section.id, 'qa')}
                className={`${styles.addItemButton} ${styles.qa}`}
              >
                + Q&A
              </button>
            </div>
          </div>

          <div className={styles.templateSectionItemsList}>
            {section.items && section.items.map(item => (
              <TemplateItemEditor
                key={item.id}
                item={item}
                onUpdate={onUpdateItem}
                onDelete={onDeleteItem}
                onMove={onMoveItem}
              />
            ))}
            
            {(!section.items || section.items.length === 0) && (
              <div className={styles.templateSectionEmptyState}>
                <p className={styles.templateSectionEmptyStateText}>Chưa có items nào trong section này</p>
                <p className={styles.templateSectionEmptyStateSubtext}>Bấm nút bên trên để thêm items mới</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
