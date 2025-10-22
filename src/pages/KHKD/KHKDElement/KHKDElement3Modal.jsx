import React from 'react';
import { Modal, Button, Input, Select, Checkbox } from 'antd';

const { Option } = Select;

export default function KHKDElement3Modal({
  isVisible,
  onClose,
  formData,
  onInputChange,
  onSave,
  isEditing,
  boPhanOptions = []
}) {
  return (
    <Modal
      title={isEditing ? 'Sửa chỉ tiêu' : 'Thêm chỉ tiêu'}
      open={isVisible}
      onCancel={onClose}
      footer={null}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label>Bộ phận:</label>
          <Select
            placeholder="Chọn bộ phận"
            style={{ width: '100%' }}
            value={formData.boPhan}
            onChange={value => onInputChange('boPhan', value)}
            allowClear
          >
            {boPhanOptions.map((option, idx) => (
              <Option key={idx} value={option}>{option}</Option>
            ))}
          </Select>
        </div>
        <div>
          <label>Chỉ số:</label>
          <Input
            placeholder="Nhập chỉ số đo lường"
            value={formData.labelSoLuong}
            onChange={e => onInputChange('labelSoLuong', e.target.value)}
          />
        </div>
        <div>
          <Checkbox
            checked={formData.theoDoi}
            onChange={e => onInputChange('theoDoi', e.target.checked)}
          >
            Theo dõi
          </Checkbox>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button type="primary" onClick={onSave}>Lưu</Button>
          <Button onClick={onClose}>Hủy</Button>
        </div>
      </div>
    </Modal>
  );
} 