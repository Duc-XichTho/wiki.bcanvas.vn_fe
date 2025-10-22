import React, { useState } from 'react';
import { Square, CheckSquare, StickyNote, ChevronDown, ChevronRight, FileText, Edit3, CheckCircle } from 'lucide-react';
import styles from '../CustomerSurveyApp.module.css';

// Title/Description Item Component
export const TitleDescItem = ({ 
  item, 
  expandedNotes, 
  onToggleCompleted, 
  onToggleNote, 
  onUpdateNoteValue 
}) => (
  <div className={styles.surveyItem}>
    <div className={styles.surveyItemContent}>
      <button
        onClick={() => onToggleCompleted(item.id)}
        className={styles.checkboxButton}
      >
        {item.completed ? (
          <CheckSquare className={`${styles.checkboxIcon} ${styles.checked}`} />
        ) : (
          <Square className={`${styles.checkboxIcon} ${styles.unchecked}`} />
        )}
      </button>
      
      <div className={styles.itemContent}>
        <h3 className={`${styles.itemTitle} ${item.completed ? styles.completed : ''}`}>
          {item.title}
        </h3>
        {item.description && (
          <div className={`${styles.itemDescription} ${item.completed ? styles.completed : ''}`}>
            {item.description.split('\n').map((line, index) => (
              <div key={index} className={styles.itemDescriptionLine}>
                {line}
              </div>
            ))}
          </div>
        )}
        
        {item.note && (
          <div className={styles.noteSection}>
            <button
              onClick={() => onToggleNote(item.id)}
              className={styles.noteButton}
            >
              <StickyNote className={styles.noteIcon} />
              Ghi chú
              {expandedNotes[item.id] ? (
                <ChevronDown className={styles.noteIcon} />
              ) : (
                <ChevronRight className={styles.noteIcon} />
              )}
            </button>
            
            {expandedNotes[item.id] && (
              <div className={styles.noteContent}>
                <div className={styles.noteGuide}>
                  <div className={styles.noteGuideTitle}>Hướng dẫn:</div>
                  <div className={styles.noteGuideContent}>
                    {item.note.split('\n').map((line, index) => (
                      <div key={index} className={styles.noteGuideLine}>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className={styles.noteInputSection}>
                  <label className={styles.noteInputLabel}>
                    Ghi chú của bạn:
                  </label>
                  <textarea
                    value={item.noteValue || ''}
                    onChange={(e) => onUpdateNoteValue(item.id, e.target.value)}
                    placeholder="Nhập ghi chú..."
                    className={`${styles.noteTextarea} ${item.completed ? styles.completed : ''}`}
                    rows="3"
                    disabled={item.completed}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);

// MCQ Item Component
export const MCQItem = ({ 
  item, 
  onToggleCompleted, 
  onUpdateMCQSelection,
  onUpdateChoiceNote
}) => {
  const [expandedChoiceNotes, setExpandedChoiceNotes] = useState({});
  const [editingNotes, setEditingNotes] = useState({});
  const [tempNotes, setTempNotes] = useState({});

  const toggleChoiceNote = (option) => {
    setExpandedChoiceNotes(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const startEditingNote = (option) => {
    const currentNote = item.choiceNotes?.[option] || '';
    setTempNotes(prev => ({ ...prev, [option]: currentNote }));
    setEditingNotes(prev => ({ ...prev, [option]: true }));
  };

  const saveNote = (option) => {
    onUpdateChoiceNote(item.id, option, tempNotes[option] || '');
    setEditingNotes(prev => ({ ...prev, [option]: false }));
  };

  const cancelEditNote = (option) => {
    setEditingNotes(prev => ({ ...prev, [option]: false }));
    setTempNotes(prev => ({ ...prev, [option]: item.choiceNotes?.[option] || '' }));
  };

  return (
    <div className={styles.surveyItem}>
      <div className={styles.surveyItemContent}>
        <button
          onClick={() => onToggleCompleted(item.id)}
          className={styles.checkboxButton}
        >
          {item.completed ? (
            <CheckSquare className={`${styles.checkboxIcon} ${styles.checked}`} />
          ) : (
            <Square className={`${styles.checkboxIcon} ${styles.unchecked}`} />
          )}
        </button>
        
        <div className={styles.itemContent}>
          <h3 className={`${styles.itemTitle} ${item.completed ? styles.completed : ''}`}>
            {item.title}
          </h3>
          
          <div className={styles.mcqOptions}>
            {item.options?.map((option, index) => {
              const isSelected = item.selectedOptions?.includes(option);
              const choiceNote = item.choiceNotes?.[option] || '';
              const isNoteExpanded = expandedChoiceNotes[option];
              return (
                <div key={index} className={styles.mcqOptionContainer}>
                  <div className={styles.mcqOptionRow}>
                    <label className={styles.mcqOption}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onUpdateMCQSelection(item.id, option)}
                        className={styles.mcqCheckbox}
                        disabled={item.completed}
                      />
                      <span className={`${styles.mcqOptionText} ${item.completed ? styles.completed : ''}`}>
                        {option}
                      </span>
                    </label>
                    <button
                      onClick={() => toggleChoiceNote(option)}
                      className={styles.choiceNoteToggleButton}
                      title="Ghi chú"
                      disabled={item.completed}
                    >
                      <FileText className={styles.choiceNoteIcon} />
                    </button>
                  </div>
                                     {isNoteExpanded && (
                     <div className={styles.choiceNoteSection}>
                       {editingNotes[option] ? (
                         <div className={styles.choiceNoteEditContainer}>
                           <input
                             type="text"
                             value={tempNotes[option] || ''}
                             onChange={(e) => setTempNotes(prev => ({ ...prev, [option]: e.target.value }))}
                             placeholder="Ghi chú cho lựa chọn này..."
                             className={`${styles.choiceNoteInput} ${item.completed ? styles.completed : ''}`}
                             disabled={item.completed}
                             autoFocus
                           />
                           <div className={styles.choiceNoteEditButtons}>
                             <button
                               onClick={() => saveNote(option)}
                               className={styles.choiceNoteSaveButton}
                               disabled={item.completed}
                             >
                               Lưu
                             </button>
                             <button
                               onClick={() => cancelEditNote(option)}
                               className={styles.choiceNoteCancelButton}
                               disabled={item.completed}
                             >
                               Hủy
                             </button>
                           </div>
                         </div>
                       ) : (
                         <>
                           {choiceNote ? (
                             <span className={styles.choiceNoteText}>
                               {choiceNote}
                             </span>
                           ) : (
                             <span className={styles.choiceNotePlaceholder}>
                               Chưa có ghi chú
                             </span>
                           )}
                           <button
                             onClick={() => startEditingNote(option)}
                             className={styles.choiceNoteEditButton}
                             title="Chỉnh sửa ghi chú"
                             disabled={item.completed}
                           >
                             <Edit3 className={styles.choiceNoteEditIcon} />
                           </button>
                         </>
                       )}
                     </div>
                   )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Q&A Item Component
export const QAItem = ({ 
  item, 
  onToggleCompleted, 
  onUpdateQAAnswer 
}) => (
  <div className={styles.surveyItem}>
    <div className={styles.surveyItemContent}>
      <button
        onClick={() => onToggleCompleted(item.id)}
        className={styles.checkboxButton}
      >
        {item.completed ? (
          <CheckSquare className={`${styles.checkboxIcon} ${styles.checked}`} />
        ) : (
          <Square className={`${styles.checkboxIcon} ${styles.unchecked}`} />
        )}
      </button>
      
      <div className={styles.itemContent}>
        <h3 className={`${styles.itemTitle} ${item.completed ? styles.completed : ''}`}>
          {item.title}
        </h3>
        
        <textarea
          value={item.answer || ''}
          onChange={(e) => onUpdateQAAnswer(item.id, e.target.value)}
          placeholder="Nhập câu trả lời..."
          className={`${styles.qaTextarea} ${item.completed ? styles.completed : ''}`}
          rows="4"
          disabled={item.completed}
        />
      </div>
    </div>
  </div>
);

// Section Header Component
export const SectionHeaderItem = ({ item, isExpanded, onToggle, isCompleted }) => {
  return (
    <div className={styles.sectionHeaderItem}>
      <div className={styles.sectionHeaderContent}>
        <div className={styles.sectionHeaderTitleRow}>
          <h2 className={styles.sectionHeaderTitle}>
            {item.title}
            {isCompleted && (
              <CheckCircle className={styles.sectionCompletedIcon} />
            )}
          </h2>
          <button
            onClick={onToggle}
            className={styles.sectionHeaderToggleButton}
          >
            <ChevronDown className={`${styles.sectionHeaderToggleIcon} ${isExpanded ? styles.expanded : ''}`} />
          </button>
        </div>
        {item.description && isExpanded && (
          <div className={styles.sectionHeaderDescriptionContainer}>
            <p className={styles.sectionHeaderDescription}>{item.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Survey Items Component
const SurveyItems = ({ 
  surveyItems, 
  surveyItemsLoading, 
  expandedNotes,
  onToggleCompleted, 
  onToggleNote, 
  onUpdateMCQSelection, 
  onUpdateQAAnswer, 
  onUpdateNoteValue,
  onUpdateChoiceNote,
  sectionCompletion = {}
}) => {
  const [collapsedSections, setCollapsedSections] = useState(new Set());

  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const isSectionCollapsed = (sectionId) => {
    return collapsedSections.has(sectionId);
  };

  const renderSurveyItems = () => {
    const items = [];

    surveyItems.forEach(item => {
      if (item.type === 'section_header') {
        // Render section header
        items.push(
          <SectionHeaderItem 
            key={item.id} 
            item={item}
            isExpanded={!isSectionCollapsed(item.sectionId)}
            onToggle={() => toggleSection(item.sectionId)}
            isCompleted={sectionCompletion[item.sectionId]?.completed || false}
          />
        );
      } else {
        // Check if this item's section is collapsed
        if (item.sectionId && isSectionCollapsed(item.sectionId)) {
          // Skip items in collapsed sections
          return;
        }
        
        // Render regular items
        switch (item.type) {
          case 'title_desc':
            items.push(
              <TitleDescItem 
                key={item.id} 
                item={item}
                expandedNotes={expandedNotes}
                onToggleCompleted={onToggleCompleted}
                onToggleNote={onToggleNote}
                onUpdateNoteValue={onUpdateNoteValue}
              />
            );
            break;
          case 'mcq':
            items.push(
              <MCQItem 
                key={item.id} 
                item={item}
                onToggleCompleted={onToggleCompleted}
                onUpdateMCQSelection={onUpdateMCQSelection}
                onUpdateChoiceNote={onUpdateChoiceNote}
              />
            );
            break;
          case 'qa':
            items.push(
              <QAItem 
                key={item.id} 
                item={item}
                onToggleCompleted={onToggleCompleted}
                onUpdateQAAnswer={onUpdateQAAnswer}
              />
            );
            break;
          default:
            break;
        }
      }
    });

    return items;
  };

  if (surveyItemsLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner}></div>
        <p>Đang tải nội dung survey...</p>
      </div>
    );
  }

  if (surveyItems.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateContent}>
          <p className={styles.emptyStateText}>Không có câu hỏi nào trong survey này</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.surveyItems}>
      {renderSurveyItems()}
    </div>
  );
};

export default SurveyItems;
