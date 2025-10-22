import React, { useState, useEffect } from 'react';
import { X, Check, Eye, Edit3 } from 'lucide-react';
import { ICON_RESOURCE_LIST } from '../../icon/svg/IconSvg.jsx';
import { Input, Checkbox } from 'antd';
import styles from './ResourcePanel.module.css';

const EditResourceModal = ({ resource, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content1: '',
    content2: '',
    icon: ''
  });

  const [previewMode, setPreviewMode] = useState({
    content1: false,
    content2: false
  });

  // Helper function to get icon source by ID
  const getIconSrcById = (iconId) => {
    const found = ICON_RESOURCE_LIST.find(item => item.id === iconId);
    return found ? found.icon : undefined;
  };

  // Simple markdown renderer
  const renderMarkdown = (text) => {
    if (!text) return '';
    
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br>');
  };

  const togglePreview = (field) => {
    setPreviewMode(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  useEffect(() => {
    if (resource) {
      setFormData({
        name: resource.name || '',
        description: resource.description || '',
        content1: resource.content1 || '',
        content2: resource.content2 || '',
        icon: resource.icon || ''
      });
    }
  }, [resource]);

  const handleSave = () => {
    const updatedResource = {
      ...resource,
      ...formData,
      updatedAt: new Date().toISOString()
    };
    onSave(updatedResource);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'var(--card-bg)',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            color: 'var(--text-secondary)',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'var(--bg-tertiary)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
        >
          <X style={{ width: '20px', height: '20px' }} />
        </button>

        {/* Header */}
        <div style={{
          marginBottom: '24px',
          paddingRight: '40px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0 0 4px 0'
          }}>
            Edit Resource
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            Update the resource information
          </p>
        </div>

        {/* Form - Matching Dashboard Edit Tool Modal */}
        <div style={{ padding: '20px 0' }}>
          {/* Icon Selector */}
          <div className={styles.iconSelectorWrapper}>
            <div className={styles.iconSelectorList}>
              {ICON_RESOURCE_LIST.map(icon => (
                <button
                  key={icon.id}
                  onClick={() => setFormData({ ...formData, icon: icon.id })}
                  className={styles.iconSelectorBtn + ' ' + (formData.icon === icon.id ? styles.iconSelectorBtnActive : '')}
                >
                  {icon.icon ? (
                    <img src={icon.icon} alt="icon" width={32} height={32} />
                  ) : icon.id}
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={styles.toolTitleInput}
            placeholder="Resource Name"
            autoFocus
          />

          {/* Description Input */}
          <textarea
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
            }}
            className={styles.toolDescInput}
            rows="3"
            placeholder="Enter description"
          />

          {/* Extra fields below */}
          <div className={styles.formGridOne}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                Content 1 (Markdown)
              </label>
              <button
                type="button"
                onClick={() => togglePreview('content1')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  backgroundColor: previewMode.content1 ? 'var(--accent-primary)' : 'transparent',
                  color: previewMode.content1 ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                {previewMode.content1 ? <Edit3 style={{ width: '12px', height: '12px' }} /> : <Eye style={{ width: '12px', height: '12px' }} />}
                {previewMode.content1 ? 'Edit' : 'Preview'}
              </button>
            </div>
            {previewMode.content1 ? (
              <div 
                className={styles.markdownContent}
                style={{
                  minHeight: '120px',
                  padding: '12px',
                  border: '1px solid var(--input-border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  lineHeight: '1.5'
                }} 
                dangerouslySetInnerHTML={{ __html: renderMarkdown(formData.content1) }} 
              />
            ) : (
              <Input.TextArea
                placeholder="Enter markdown content..."
                value={formData.content1 || ''}
                onChange={(e) => setFormData({ ...formData, content1: e.target.value })}
                rows={4}
                className={styles.dashboardInput}
              />
            )}
          </div>
          <div className={styles.formGridOne}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                Content 2 (Markdown)
              </label>
              <button
                type="button"
                onClick={() => togglePreview('content2')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  backgroundColor: previewMode.content2 ? 'var(--accent-primary)' : 'transparent',
                  color: previewMode.content2 ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                {previewMode.content2 ? <Edit3 style={{ width: '12px', height: '12px' }} /> : <Eye style={{ width: '12px', height: '12px' }} />}
                {previewMode.content2 ? 'Edit' : 'Preview'}
              </button>
            </div>
            {previewMode.content2 ? (
              <div 
                className={styles.markdownContent}
                style={{
                  minHeight: '120px',
                  padding: '12px',
                  border: '1px solid var(--input-border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  lineHeight: '1.5'
                }} 
                dangerouslySetInnerHTML={{ __html: renderMarkdown(formData.content2) }} 
              />
            ) : (
              <Input.TextArea
                placeholder="Enter markdown content..."
                value={formData.content2 || ''}
                onChange={(e) => setFormData({ ...formData, content2: e.target.value })}
                rows={4}
                className={styles.dashboardInput}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className={styles.toolActionRow}>
            <button
              onClick={handleSave}
              className={styles.saveBtn}
            >
              <Check className={styles.iconCheckSmall} />
              Save
            </button>
            <button
              onClick={onClose}
              className={styles.cancelBtn}
            >
              <X className={styles.iconCancelSmall} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditResourceModal;
