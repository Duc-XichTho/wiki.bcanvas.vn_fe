import React from 'react';
import { Paperclip, Upload, Eye, Trash2, Link, Copy } from 'lucide-react';
import { Modal, Button, Typography, List, Tag, message } from 'antd';

const { Text } = Typography;

const AttachmentModal = ({
  showAttachmentModal,
  onClose,
  attachments,
  uploading,
  onFileUpload,
  onDeleteAttachment,
  onPreviewFile
}) => {
  // Copy URL to clipboard
  const handleCopyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      message.success('Đã copy URL vào clipboard!');
    } catch (error) {
      console.error('Lỗi khi copy:', error);
      message.error('Không thể copy URL');
    }
  };
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Paperclip size={20} style={{ color: '#52c41a' }} />
          Quản lý File Đính kèm
        </div>
      }
      open={showAttachmentModal}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>
      ]}
      width={1200}
      style={{ top: 20 }}
    >
      <div>
        <div style={{ marginBottom: '24px' }}>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>
            📤 Upload file mới:
          </Text>
          <div>
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
              onChange={(e) => {
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                  onFileUpload(files[0], files);
                }
              }}
              style={{ display: 'none' }}
              id="file-upload-input"
              disabled={uploading}
            />
            <Button
              icon={<Upload size={16} />}
              style={{ width: '100%' }}
              loading={uploading}
              disabled={uploading}
              onClick={() => document.getElementById('file-upload-input').click()}
            >
              {uploading ? 'Đang upload...' : 'Chọn file để upload'}
            </Button>
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            Hỗ trợ: Ảnh, PDF, Word, Text, Zip, Rar (Tối đa 10MB mỗi file)
          </div>
        </div>

        <div>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>
            📁 Danh sách file đã upload ({attachments.length}):
          </Text>
          {attachments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#999',
              border: '2px dashed #d9d9d9',
              borderRadius: '6px'
            }}>
              <Paperclip size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <div>Chưa có file nào được upload</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Hãy upload file để sử dụng trong AI tạo content
              </div>
            </div>
          ) : (
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              padding: '8px'
            }}>
              <List
                dataSource={attachments}
                renderItem={(attachment) => (
                <List.Item
                  actions={[
                    <Button
                      key="preview"
                      type="text"
                      size="small"
                      onClick={() => onPreviewFile(attachment)}
                      icon={<Eye size={14} />}
                    >
                      Xem
                    </Button>,
                    <Button
                      key="copy"
                      type="text"
                      size="small"
                      onClick={() => handleCopyUrl(attachment.url)}
                      icon={<Copy size={14} />}
                    >
                      Copy
                    </Button>,
                    <Button
                      key="delete"
                      type="text"
                      danger
                      size="small"
                      onClick={() => onDeleteAttachment(attachment.id)}
                      icon={<Trash2 size={14} />}
                    >
                      Xóa
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Paperclip size={20} style={{ color: '#1890ff' }} />}
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '500' }}>{attachment.name}</span>
                        <Tag 
                          color={(() => {
                            const ext = attachment.name.split('.').pop()?.toLowerCase() || '';
                            if (ext === 'pdf') return 'red';
                            if (['jpg', 'png', 'svg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return 'green';
                            if (['doc', 'docx', 'xls', 'xlsx'].includes(ext)) return 'blue';
                            if (['txt', 'csv', 'md'].includes(ext)) return 'orange';
                            if (['zip', 'rar', '7z'].includes(ext)) return 'purple';
                            return 'default';
                          })()} 
                          size="small"
                        >
                          {(() => {
                            const ext = attachment.name.split('.').pop()?.toLowerCase() || '';
                            if (ext === 'pdf') return '📄 PDF';
                            if (['jpg', 'png', 'svg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return '🖼️ Ảnh';
                            if (['doc', 'docx', 'xls', 'xlsx'].includes(ext)) return '📝 Document';
                            if (['txt', 'csv', 'md'].includes(ext)) return '📃 Text';
                            if (['zip', 'rar', '7z'].includes(ext)) return '🗜️ Nén';
                            return `📎 ${ext.toUpperCase()}`;
                          })()}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Kích thước: {(attachment.size / 1024).toFixed(1)} KB
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Upload: {new Date(attachment.uploadedAt).toLocaleString('vi-VN')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#1890ff', marginTop: '4px' }}>
                          <Link size={12} style={{ marginRight: '4px' }} />
                          {attachment.url}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AttachmentModal;
