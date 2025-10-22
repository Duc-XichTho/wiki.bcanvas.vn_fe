import { Button, DatePicker, Input, Modal, Select, Popconfirm, InputNumber, TimePicker } from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';

const { Option } = Select;

const ScriptDetailModal = ({
  open,
  onCancel,
  selectedScript,
  scriptTemplates,
  setScriptTemplates,
  emailTemplates,
  onAddTemplate,
  onRemoveTemplate,
  onUpdateTemplateTime,
  onUpdateTemplateDelayDays,
  onUpdateTemplateSendTime,
  scriptType = 'scheduled' // Thêm prop để biết loại script
}) => {
  const [newTemplate, setNewTemplate] = useState({
    template_id: '',
    scheduled_time: null,
    delay_days: null, // Thêm cho loại "Delay"
    send_time: null // Thêm cho loại "Delay"
  });


  // Add template to script
  const handleAddTemplateToScript = async () => {
    if (!newTemplate.template_id) {
      return;
    }

    // Kiểm tra điều kiện dựa trên loại script
    if (scriptType === 'scheduled' && !newTemplate.scheduled_time) {
      return;
    }
    
    if (scriptType === 'delay' && (!newTemplate.delay_days || !newTemplate.send_time)) {
      return;
    }

    const template = emailTemplates.find(t => t.id == newTemplate.template_id);
    if (!template) {
      return;
    }

    // Gọi API để thêm template mới với cấu hình phù hợp
    if (scriptType === 'scheduled') {
      await onAddTemplate(newTemplate.template_id, newTemplate.scheduled_time);
    } else {
      // Cho loại "Delay", gửi delay_days và send_time
      await onAddTemplate(newTemplate.template_id, null, newTemplate.delay_days, newTemplate.send_time);
    }

    setNewTemplate({
      template_id: '',
      scheduled_time: null,
      delay_days: null,
      send_time: null
    });
  };

  // Remove template from script
  const handleRemoveTemplateFromScript = async (templateUniqueId) => {
    // Gọi API để xóa template
    await onRemoveTemplate(templateUniqueId);
  };

  // Update template scheduled time
  const handleUpdateTemplateTime = async (templateUniqueId, scheduledTime) => {
    if (!scheduledTime) return;

    // Gọi API để cập nhật thời gian
    await onUpdateTemplateTime(templateUniqueId, scheduledTime);
  };

  // Update template delay days
  const handleUpdateTemplateDelayDays = async (templateUniqueId, delayDays) => {
    if (!delayDays) return;

    // Gọi API để cập nhật delay days
    await onUpdateTemplateDelayDays(templateUniqueId, delayDays);
  };

  // Update template send time
  const handleUpdateTemplateSendTime = async (templateUniqueId, sendTime) => {
    if (!sendTime) return;

    // Gọi API để cập nhật send time
    await onUpdateTemplateSendTime(templateUniqueId, sendTime);
  };

  return (
    <Modal
      title={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '8px 0'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
          }}></div>
          <div>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0
            }}>
              Cấu hình kịch bản
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              {selectedScript}
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button
          key="cancel"
          onClick={onCancel}
          style={{
            border: '1px solid #d1d5db',
            color: '#6b7280',
            fontWeight: '500'
          }}
        >
          Đóng
        </Button>
      ]}
      width={1400}
      style={{ top: 20 }}
    >
      <div style={{ display: 'flex', gap: '24px', height: '70vh' }}>
        {/* Left Panel - Add Templates */}
        <div style={{
          flex: '0 0 400px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '16px',
                color: '#374151',
                fontWeight: '600'
              }}>
                📧 Chọn email template:
              </label>
              <Select
                value={newTemplate.template_id}
                onChange={(value) => setNewTemplate(prev => ({ ...prev, template_id: value }))}
                placeholder="Chọn template email..."
                style={{ width: '100%' }}
                size="large"
              >
                {emailTemplates.map(template => (
                  <Option key={template.id} value={template.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600', fontSize: '15px' }}>
                        {template.name}
                      </span>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>
                        ({template.short_name})
                      </span>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>

            {/* Cấu hình cho loại "Schedule" */}
            {scriptType === 'scheduled' && (
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '16px',
                  color: '#374151',
                  fontWeight: '600'
                }}>
                  ⏰ Thời gian gửi email:
                </label>
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  value={newTemplate.scheduled_time}
                  onChange={(date) => setNewTemplate(prev => ({ ...prev, scheduled_time: date }))}
                  placeholder="Chọn thời gian gửi"
                  style={{ width: '100%' }}
                  size="large"
                />
              </div>
            )}

            {/* Cấu hình cho loại "Delay" */}
            {scriptType === 'delay' && (
              <>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '16px',
                    color: '#374151',
                    fontWeight: '600'
                  }}>
                    📅 Gửi sau bao nhiêu ngày (T+):
                  </label>
                  <InputNumber
                    value={newTemplate.delay_days}
                    onChange={(value) => setNewTemplate(prev => ({ ...prev, delay_days: value }))}
                    placeholder="Nhập số ngày..."
                    style={{ width: '100%' }}
                    size="large"
                    min={1}
                    max={365}
                    addonAfter="ngày"
                    controls={false}
                    keyboard={false}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '16px',
                    color: '#374151',
                    fontWeight: '600'
                  }}>
                    🕐 Giờ gửi:
                  </label>
                  <TimePicker
                    format="HH:mm"
                    value={newTemplate.send_time}
                    onChange={(date) => setNewTemplate(prev => ({ ...prev, send_time: date }))}
                    placeholder="Chọn giờ gửi"
                    style={{ width: '100%' }}
                    size="large"
                  />
                </div>
              </>
            )}

            <Button
              type="primary"
              onClick={handleAddTemplateToScript}
              disabled={
                !newTemplate.template_id || 
                (scriptType === 'scheduled' && !newTemplate.scheduled_time) ||
                (scriptType === 'delay' && (!newTemplate.delay_days || !newTemplate.send_time))
              }
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                borderColor: '#3b82f6',
                height: '44px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
              size="large"
              block
            >
              ➕ Thêm vào kịch bản
            </Button>

            {newTemplate.template_id && (
              <div style={{
                padding: '12px',
                background: '#ecfdf5',
                borderRadius: '8px',
                border: '1px solid #d1fae5'
              }}>
                <div style={{ fontSize: '14px', color: '#065f46', fontWeight: '600' }}>
                  💡 Preview: {
                    scriptType === 'scheduled' && newTemplate.scheduled_time 
                      ? `Template sẽ được gửi vào ${newTemplate.scheduled_time.format('DD/MM/YYYY HH:mm')}`
                      : scriptType === 'delay' && newTemplate.delay_days && newTemplate.send_time
                      ? `Template sẽ được gửi sau T+${newTemplate.delay_days} ngày lúc ${newTemplate.send_time.format('HH:mm')}`
                      : 'Chọn cấu hình để xem preview'
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Active Templates */}
        <div style={{
          flex: 1,
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          overflow: 'auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981'
              }}></div>
              <h3 style={{
                margin: 0,
                color: '#1f2937',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                📧 Templates trong kịch bản
              </h3>
              {scriptTemplates.length > 0 && (
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  background: '#f3f4f6',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontWeight: '600'
                }}>
                  {scriptTemplates.length} template{scriptTemplates.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {scriptTemplates.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '2px dashed #d1d5db'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
              <h4 style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                Chưa có template nào
              </h4>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: '16px' }}>
                Thêm template từ panel bên trái để bắt đầu
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               {scriptTemplates.map((template, index) => (
                <div
                  key={template.id}
                 style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: '20px',
                   padding: '24px',
                   background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                   borderRadius: '12px',
                   border: '1px solid #e2e8f0',
                   boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                   transition: 'all 0.2s',
                   minHeight: '80px'
                 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  {/* Template Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}>

                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '18px' }}>
                        <span>  {template.template_name} </span>
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>({template.template_short_name})</span>
                      </div>
                    </div>
                  </div>

                  {/* Time Settings - Different for each script type */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'white',
                    padding: '16px 20px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    minWidth: '300px',
                    flexWrap: 'wrap'
                  }}>
                    {scriptType === 'scheduled' ? (
                      <>
                        <span style={{ fontSize: '15px', color: '#475569', fontWeight: '600' }}>
                          ⏰ Fixed Time:
                        </span>
                        <DatePicker
                          showTime
                          format="DD/MM/YYYY HH:mm"
                          value={template.scheduled_time ? dayjs(template.scheduled_time) : null}
                          onChange={(date) => handleUpdateTemplateTime(template.id, date)}
                          placeholder="Chọn thời gian"
                          style={{ width: '180px' }}
                          size="small"
                        />
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '15px', color: '#475569', fontWeight: '600' }}>
                          📅 Auto Delay:
                        </span>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <InputNumber
                            value={template.delay_days}
                            onChange={(value) => handleUpdateTemplateDelayDays(template.id, value)}
                            style={{ width: '200px' }}
                            size="small"
                            min={1}
                            max={365}
                            addonBefore="T+"
                            addonAfter="ngày"
                            controls={false}
                            keyboard={false}
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                                e.preventDefault();
                              }
                            }}
                          />
                          <span style={{ fontSize: '14px', color: '#6b7280', whiteSpace: 'nowrap' }}>lúc</span>
                          <TimePicker
                            format="HH:mm"
                            value={template.send_time ? (() => {
                              const parsed = dayjs(`1970-01-01 ${template.send_time}`);
                              return parsed;
                            })() : null}
                            onChange={(date) => handleUpdateTemplateSendTime(template.id, date)}
                            placeholder="Giờ"
                            style={{ width: '120px' }}
                            size="small"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Remove Button */}
                  <Popconfirm
                    title="Xác nhận xóa"
                    description="Bạn có chắc chắn muốn xóa template này khỏi kịch bản?"
                    onConfirm={() => handleRemoveTemplateFromScript(template.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{
                      danger: true,
                      style: { background: '#dc2626', borderColor: '#dc2626' }
                    }}
                  >
                    <button
                      style={{
                        background: '#fee2e2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        minWidth: '44px',
                        height: '44px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#fecaca';
                        e.target.style.borderColor = '#f87171';
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#fee2e2';
                        e.target.style.borderColor = '#fecaca';
                        e.target.style.transform = 'scale(1)';
                      }}
                      title="Xóa template khỏi kịch bản"
                    >
                      🗑️
                    </button>
                  </Popconfirm>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ScriptDetailModal;
