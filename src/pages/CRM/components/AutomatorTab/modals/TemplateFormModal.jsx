import React from 'react';
import { Save, Plus, Eye, Sparkles } from 'lucide-react';
import { Modal, Input, Button, Typography, Select } from 'antd';

const { TextArea } = Input;
const { Text } = Typography;

const TemplateFormModal = ({
  showForm,
  onCancel,
  onSave,
  editingTemplate,
  saving,
  formData,
  onInputChange,
  onPreviewAIContent,
  onOpenAIModal,
  aiGenerating,
  senders = []
}) => {
  return (
    <Modal
      title={editingTemplate ? 'Chỉnh sửa Template' : 'Thêm Template Mới'}
      open={showForm}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={saving}>
          Hủy
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={onSave}
          disabled={saving || !formData.name.trim() || !formData.subject.trim()}
          loading={saving}
          icon={<Save size={16} />}
        >
          {saving ? 'Đang lưu...' : (editingTemplate ? 'Cập nhật' : 'Tạo Template')}
        </Button>
      ]}
      width={800}
      style={{ top: 20 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Tên Template <span style={{ color: 'red' }}>*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              placeholder="Nhập tên template..."
              maxLength={100}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Tiêu đề Email <span style={{ color: 'red' }}>*</span>
            </label>
            <Input
              value={formData.subject}
              onChange={(e) => onInputChange('subject', e.target.value)}
              placeholder="Nhập tiêu đề email..."
              maxLength={200}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Tên rút gọn (Short Name)
            </label>
            <Input
              value={formData.short_name}
              onChange={(e) => onInputChange('short_name', e.target.value)}
              placeholder="Nhập tên rút gọn (ví dụ: Welcome, Follow-up, etc.)..."
              maxLength={50}
            />
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
              Tên rút gọn sẽ hiển thị trong Email History thay vì thời gian
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Email Sender
            </label>
            <Select
              value={formData.sender_email}
              onChange={(value) => onInputChange('sender_email', value)}
              placeholder="Chọn sender email..."
              style={{ width: '100%' }}
              allowClear
            >
              {senders
                .filter(sender => sender.email && sender.app_password)
                .map(sender => (
                  <Select.Option key={sender.id} value={sender.email}>
                    {sender.email}
                  </Select.Option>
                ))}
            </Select>
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
              Chọn sender email để gửi template này
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontWeight: '500' }}>Nội dung Email</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                onClick={onPreviewAIContent}
                type="default"
                icon={<Eye size={16} />}
                disabled={!formData.content?.trim()}
                size="small"
              >
                Xem trước
              </Button>
              <Button
                onClick={onOpenAIModal}
                type="dashed"
                icon={aiGenerating ? <Sparkles size={16} /> : <Sparkles size={16} />}
                size="small"
                style={{ 
                  opacity: aiGenerating ? 0.7 : 1,
                  cursor: 'pointer'
                }}
              >
                {aiGenerating ? 'Đang tạo cấu hình' : 'Cấu hình'}
              </Button>
            </div>
          </div>
          <TextArea
            value={formData.content}
            onChange={(e) => onInputChange('content', e.target.value)}
            placeholder="Nhập nội dung email... (có thể sử dụng {{name}}, {{company}} để thay thế)"
            rows={18}
          />
        </div>
      </div>
    </Modal>
  );
};

export default TemplateFormModal;
