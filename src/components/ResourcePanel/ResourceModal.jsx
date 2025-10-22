import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { ICON_RESOURCE_LIST } from '../../icon/svg/IconSvg.jsx';
import styles from './ResourcePanel.module.css';

const ResourceModal = ({ resource, onClose }) => {
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
        maxHeight: '80vh',
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
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          paddingRight: '40px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            flexShrink: 0
          }}>
            {resource.logo ? (
              <img
                src={resource.logo}
                alt="Resource logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '12px'
                }}
              />
            ) : resource.icon ? (
              (() => {
                const iconSrc = getIconSrcById(resource.icon);
                return iconSrc ? (
                  <img
                    src={iconSrc}
                    alt="Resource icon"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: '12px'
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '24px' }}>{resource.icon}</span>
                );
              })()
            ) : (
              <span>📄</span>
            )}
          </div>
          
          <div style={{ flex: 1 }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: '0 0 4px 0',
              lineHeight: '1.2'
            }}>
              {resource.name}
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: '1.4'
            }}>
              {resource.description}
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Content 1 */}
          {resource.content1 && (
            <div>
              <div 
                className={styles.markdownContent}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  padding: '16px',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  lineHeight: '1.5'
                }} 
                dangerouslySetInnerHTML={{ __html: renderMarkdown(resource.content1) }} 
              />
            </div>
          )}

          {/* Content 2 */}
          {resource.content2 && (
            <div>
              <div 
                className={styles.markdownContent}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  padding: '16px',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  lineHeight: '1.5'
                }} 
                dangerouslySetInnerHTML={{ __html: renderMarkdown(resource.content2) }} 
              />
            </div>
          )}

          {/* Additional Info
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '16px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ID:</span>
              <span style={{ fontFamily: 'monospace' }}>{resource.id}</span>
            </div>
            {resource.createdAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Created:</span>
                <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
              </div>
            )}
            {resource.updatedAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Updated:</span>
                <span>{new Date(resource.updatedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div> */}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--input-border)',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceModal;
