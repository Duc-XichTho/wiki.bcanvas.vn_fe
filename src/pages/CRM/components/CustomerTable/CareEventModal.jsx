import { Button, Input, Modal, Select } from 'antd';
import React from 'react';
import CareEventEditor from './CareEventEditor';

const { Option } = Select;

const CareEventModal = ({
  open,
  onCancel,
  careEventForm,
  onFormChange,
  onSave,
  creatingCareEvent,
  onSaveContent,
  showEditor
}) => {
  return (
    <Modal
      title={`Tạo Event Chăm Sóc`}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button
          key="cancel"
          onClick={onCancel}
        >
          Hủy
        </Button>,
        <Button
          key="create"
          type="primary"
          onClick={onSave}
          disabled={!careEventForm.title.trim() || creatingCareEvent}
          loading={creatingCareEvent}
          style={{ background: '#10b981', borderColor: '#10b981' }}
        >
          {creatingCareEvent ? 'Đang tạo...' : 'Tạo Event'}
        </Button>
      ]}
      width={1200}
    >
      <div style={{ display: 'flex', gap: '20px', height: '70vh' }}>
        {/* Left Panel - Form Info */}
        <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Tiêu đề Event:
            </label>
            <Input
              value={careEventForm.title}
              onChange={(e) => onFormChange('title', e.target.value)}
              placeholder="Ví dụ: Gọi điện chăm sóc, Chat Zalo..."
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
              <Option value="other">Khác</Option>
            </Select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', height: '100%', flexDirection: 'column', overflow: 'auto', width: '100%' }}>
          <div style={{ fontWeight: '500', color: '#374151' }}>Nội dung:</div>
          <CareEventEditor
            initialContent={careEventForm.content}
            onSave={onSaveContent}
            onCancel={() => showEditor(false)}
            isVisible={true}
            loading={false}
            showToolbar={true}
            editable={open}
          />
        </div>
      </div>
    </Modal>
  );
};

export default CareEventModal;
