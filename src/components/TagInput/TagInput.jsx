import React, { useState } from 'react';
import styles from './TagInput.module.css';

const TagInput = ({ 
  tags = [], 
  onTagsChange, 
  placeholder = "Nhập tag và nhấn Enter", 
  maxTags = 10,
  disabled = false 
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue.trim());
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Xóa tag cuối cùng nếu input trống và nhấn Backspace
      removeTag(tags.length - 1);
    }
  };

  const addTag = (tag) => {
    if (tag && !tags.includes(tag) && tags.length < maxTags) {
      onTagsChange([...tags, tag]);
      setInputValue('');
    }
  };

  const removeTag = (index) => {
    const newTags = tags.filter((_, i) => i !== index);
    onTagsChange(newTags);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <div className={styles.tagInputContainer}>
      <div className={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <div key={index} className={styles.tag}>
            <span className={styles.tagText}>{tag}</span>
            {!disabled && (
              <button
                type="button"
                className={styles.tagRemove}
                onClick={() => removeTag(index)}
                title="Xóa tag"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {!disabled && tags.length < maxTags && (
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ""}
            className={styles.tagInput}
            disabled={disabled}
          />
        )}
      </div>
      {tags.length >= maxTags && (
        <div className={styles.maxTagsMessage}>
          Đã đạt tối đa {maxTags} tags
        </div>
      )}
    </div>
  );
};

export default TagInput;
