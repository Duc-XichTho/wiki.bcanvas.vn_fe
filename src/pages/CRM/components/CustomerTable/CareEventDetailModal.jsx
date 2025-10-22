import { Button, Input, Modal, Select } from 'antd';
import React from 'react';
import CareEventEditor from './CareEventEditor';

const { Option } = Select;

const CareEventDetailModal = ({
  open,
  onCancel,
  selectedCareEvent,
  isEditingCareEvent,
  careEventForm,
  onFormChange,
  onUpdate,
  onDelete,
  onOpenEdit,
  updatingCareEvent,
  onSaveContent,
  currentUser
}) => {
  const formatDateISO = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <Modal
      title={isEditingCareEvent ? "Sửa Event Chăm Sóc" : "Chi tiết Event Chăm Sóc"}
      open={open}
      onCancel={onCancel}
      footer={isEditingCareEvent ? [
        // Footer khi đang sửa
        <Button
          key="cancel"
          onClick={() => {
            onCancel();
          }}
        >
          Hủy
        </Button>,
        <Button
          key="update"
          type="primary"
          onClick={onUpdate}
          disabled={!careEventForm.title.trim() || updatingCareEvent}
          loading={updatingCareEvent}
          style={{ background: '#10b981', borderColor: '#10b981' }}
        >
          {updatingCareEvent ? 'Đang cập nhật...' : 'Cập nhật Event'}
        </Button>
      ] : [
        // Footer khi đang xem
        <Button
          key="close"
          onClick={onCancel}
        >
          Đóng
        </Button>,
        // Chỉ hiển thị nút sửa và xóa nếu user hiện tại là người tạo event
        selectedCareEvent?.user_create === currentUser.email && (
          <>
            <Button
              key="edit"
              onClick={() => onOpenEdit(selectedCareEvent)}
            >
              Sửa Event
            </Button>
            <Button
              key="delete"
              type="primary"
              danger
              onClick={() => onDelete(selectedCareEvent?.id, selectedCareEvent?.customer_id)}
            >
              Xóa Event
            </Button>
          </>
        )
      ].filter(Boolean)}
      width={1200}
    >
      {selectedCareEvent && (
        <div style={{ display: 'flex', gap: '20px', height: '70vh' }}>
          {/* Left Panel - Form Info/Details */}
          <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isEditingCareEvent ? (
              // Form sửa
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Tiêu đề Event *
                  </label>
                  <Input
                    value={careEventForm.title}
                    onChange={(e) => onFormChange('title', e.target.value)}
                    placeholder="Nhập tiêu đề event..."
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Loại Event:
                  </label>
                  <Select
                    value={careEventForm.event_type}
                    onChange={(value) => onFormChange('event_type', value)}
                    style={{ width: '100%' }}
                  >
                    <Option value="call">Gọi điện</Option>
                    <Option value="zalo">Zalo</Option>
                    <Option value="meeting">Gặp mặt</Option>
                    <Option value="email">Email</Option>
                    <Option value="other">Khác</Option>
                  </Select>
                </div>
              </>
            ) : (
              // Hiển thị chi tiết
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                    Tiêu đề:
                  </label>
                  <span style={{ color: '#111827', fontSize: '14px' }}>{selectedCareEvent.title}</span>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                    Loại:
                  </label>
                  <span style={{ color: '#111827', fontSize: '14px' }}>
                    {selectedCareEvent.event_type === 'call' && 'Gọi điện'}
                    {selectedCareEvent.event_type === 'zalo' && 'Zalo'}
                    {selectedCareEvent.event_type === 'meeting' && 'Gặp mặt'}
                    {selectedCareEvent.event_type === 'email' && 'Email'}
                    {selectedCareEvent.event_type === 'other' && 'Khác'}
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                    Ngày tạo:
                  </label>
                  <span style={{ color: '#111827', fontSize: '14px' }}>
                    {formatDateISO(selectedCareEvent.created_at)}
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>
                    Người tạo:
                  </label>
                  <div style={{
                    color: '#111827',
                    fontSize: '14px',
                    padding: '8px 12px',
                    background: '#f9fafb',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {selectedCareEvent.user_create}
                    {selectedCareEvent.user_create === currentUser.email && (
                      <span style={{
                        marginLeft: '8px',
                        color: '#059669',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        (Bạn)
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Panel - Content Editor/Display */}
          <div style={{ display: 'flex', gap: '12px', height: '100%', flexDirection: 'column', overflow: 'auto', width: '100%' }}>
            <div style={{ fontWeight: '500', color: '#374151' }}>Nội dung:</div>

            <CareEventEditor
              initialContent={careEventForm.content || selectedCareEvent.content}
              onSave={onSaveContent}
              onCancel={() => {}}
              isVisible={true}
              loading={false}
              showToolbar={isEditingCareEvent}
              editable={isEditingCareEvent}
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CareEventDetailModal;
