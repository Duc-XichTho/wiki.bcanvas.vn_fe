import React from 'react';
import { Sparkles, Paperclip, Eye } from 'lucide-react';
import { Modal, Button, Tabs, Select, Typography, Space, Tag, Input } from 'antd';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AIModal = ({
  showAIModal,
  onClose,
  activeTab,
  onTabChange,
  aiPrompt,
  onPromptChange,
  attachments,
  selectedAttachments,
  onToggleAttachment,
  onGenerate,
  aiGenerating,
  aiSettings,
  onSettingsChange,
  onSaveSettings,
  onPreviewFile
}) => {
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={20} style={{ color: '#8b5cf6' }} />
          AI Tạo Content Email
        </div>
      }
      open={showAIModal}
      onCancel={onClose}
      width={800}
      footer={activeTab === 'prompt' ? [
        <div key="footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button key="cancel" onClick={onClose} disabled={aiGenerating}>
            Hủy
          </Button>
          <Button
            key="generate"
            type="primary"
            onClick={onGenerate}
            disabled={aiGenerating || !aiPrompt.trim()}
            loading={aiGenerating}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'white'
            }}
          >
            {!aiGenerating && <Sparkles size={16} />}
            {aiGenerating ? 'AI đang tạo...' : 'Tạo Content'}
          </Button>
        </div>
      ] : null}
    >
      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        items={[
          {
            key: 'prompt',
            label: '🎯 Prompt & Model',
            children: (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                    Mô tả yêu cầu của bạn:
                  </Text>
                  <TextArea
                    value={aiPrompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    placeholder="Ví dụ: Tạo email chào mừng khách hàng mới với logo công ty và ảnh sản phẩm nổi bật..."
                    rows={6}
                    style={{ marginBottom: '16px', fontSize: '13px' }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    📎 Chọn file đính kèm (tùy chọn):
                  </Text>
                  <div style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    padding: '12px',
                    backgroundColor: '#fafafa',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {attachments.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                        Chưa có file đính kèm nào. Hãy upload file trong tab "Quản lý Đính kèm".
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {attachments.map(attachment => (
                          <div
                            key={attachment.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '8px',
                              border: selectedAttachments.includes(attachment.id)
                                ? '2px solid #1890ff'
                                : '1px solid #e8e8e8',
                              borderRadius: '4px',
                              backgroundColor: selectedAttachments.includes(attachment.id)
                                ? '#e6f7ff'
                                : 'white',
                              cursor: 'pointer'
                            }}
                            onClick={() => onToggleAttachment(attachment.id)}
                          >
                        
                            <Paperclip size={14} style={{ marginRight: '8px', color: '#1890ff' }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '500', fontSize: '13px' }}>
                                {attachment.name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#666' }}>
                                {attachment.type} • {(attachment.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Button
                                type="text"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPreviewFile(attachment);
                                }}
                                icon={<Eye size={12} />}
                                style={{ padding: '2px 6px', height: '24px' }}
                              >
                                Xem
                              </Button>
                              <Tag color="blue" size="small">
                                {attachment.type.split('/')[0]}
                              </Tag>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedAttachments.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#1890ff' }}>
                      ✅ Đã chọn {selectedAttachments.length} file đính kèm
                    </div>
                  )}
                </div>

                
              </div>
            )
          },
          {
            key: 'system',
            label: '⚙️ AI Settings',
            children: (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    🤖 AI Model:
                  </Text>
                  <Select
                    value={aiSettings?.model}
                    onChange={(value) => onSettingsChange({ ...aiSettings, model: value })}
                    style={{ width: '100%' }}
                    placeholder="Chọn AI model"
                  >
                    <Option value="gemini-2.5-flash">Gemini 2.5 Flash (Nhanh)</Option>
                    <Option value="gemini-2.5-pro">Gemini 2.5 Pro (Chất lượng cao)</Option>
                    <Option value="gpt-4o">GPT-4o</Option>
                    <Option value="gpt-4o-mini">GPT-4o Mini</Option>
                    <Option value="claude-3-5-sonnet">Claude 3.5 Sonnet</Option>
                  </Select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    System Message (Hướng dẫn AI):
                  </Text>
                  <TextArea
                    value={aiSettings?.systemMessage}
                    onChange={(e) => onSettingsChange({ ...aiSettings, systemMessage: e.target.value })}
                    rows={10}
                    placeholder="Nhập system message để hướng dẫn AI..."
                  />
                  <div style={{ marginTop: '8px', padding: '8px', background: '#f0f9ff', borderRadius: '4px', fontSize: '12px' }}>
                    <Text type="secondary">
                      <strong>📝 Template Variables có thể sử dụng:</strong><br />
                      <code>{'{customer_name}'}</code> <code>{'{customer_email}'}</code> <code>{'{customer_phone}'}</code>
                      <code>{'{customer_company}'}</code> <code>{'{customer_address}'}</code> <br />
                    </Text>
                  </div>
                </div>

                <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    💡 <strong>Gợi ý:</strong> System message này sẽ hướng dẫn AI cách tạo email.
                    Bạn có thể tùy chỉnh để AI tạo theo style, tone, hoặc format mong muốn.
                  </Text>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Button onClick={onSaveSettings} type="primary">
                    💾 Lưu Settings
                  </Button>
                </div>
              </div>
            )
          }
        ]}
      />
    </Modal>
  );
};

export default AIModal;
