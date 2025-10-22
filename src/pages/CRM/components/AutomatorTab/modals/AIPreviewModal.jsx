import React from 'react';
import { Eye } from 'lucide-react';
import { Modal, Button } from 'antd';
import { marked } from 'marked';

const AIPreviewModal = ({
  showAIPreviewModal,
  onClose,
  formData
}) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={20} style={{ color: '#1890ff' }} />
          Xem trước nội dung Email
        </div>
      }
      open={showAIPreviewModal}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>
      ]}
      width={900}
      style={{ top: 20 }}
    >
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        padding: '16px 0'
      }}>
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '6px',
          border: '1px solid #d9d9d9'
        }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
            Tên Template:
          </label>
          <p style={{ margin: 0, color: '#333' }}>{formData.name || 'Chưa có tên'}</p>
        </div>
        
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '6px',
          border: '1px solid #d9d9d9'
        }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
            Tiêu đề Email:
          </label>
          <p style={{ margin: 0, color: '#333' }}>{formData.subject || 'Chưa có tiêu đề'}</p>
        </div>
        
        {formData.short_name && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '6px',
            border: '1px solid #d9d9d9'
          }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
              Tên rút gọn:
            </label>
            <p style={{ margin: 0, color: '#1890ff', fontWeight: '500' }}>{formData.short_name}</p>
          </div>
        )}
        
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '6px',
          border: '1px solid #d9d9d9'
        }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
            Nội dung Email:
          </label>
          <div
            style={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '4px',
              border: '1px solid #e8e8e8',
              minHeight: '200px'
            }}
          >
            <iframe
              srcDoc={formData?.content?.includes('<')
                ? formData.content
                : marked(formData?.content || '')}
              style={{
                width: '100%',
                height: '400px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: 'white'
              }}
              title="AI Template Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AIPreviewModal;
