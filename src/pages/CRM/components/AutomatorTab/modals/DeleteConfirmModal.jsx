import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal, Button } from 'antd';

const DeleteConfirmModal = ({
  showDeleteConfirm,
  onCancel,
  onConfirm,
  templateToDelete,
  saving
}) => {
  return (
    <Modal
      title="Xác nhận xóa"
      open={showDeleteConfirm}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={saving}>
          Hủy
        </Button>,
        <Button
          key="delete"
          type="primary"
          danger
          onClick={onConfirm}
          disabled={saving}
          loading={saving}
        >
          {saving ? 'Đang xóa...' : 'Xóa'}
        </Button>
      ]}
      width={400}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <AlertCircle size={48} style={{ color: '#ff4d4f', marginBottom: '16px' }} />
        <p>Bạn có chắc muốn xóa template <strong>"{templateToDelete?.name}"</strong>?</p>
        <p style={{ color: '#666', fontSize: '14px' }}>Hành động này không thể hoàn tác.</p>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;
