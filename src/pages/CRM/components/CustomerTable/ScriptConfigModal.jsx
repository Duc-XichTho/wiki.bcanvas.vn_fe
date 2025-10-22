import { Button, Input, Modal, message, Table, Popconfirm, Space, Tag, Select } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { 
  createNewEmailSchedulerScript, 
  updateEmailSchedulerScript, 
  deleteEmailSchedulerScript 
} from '../../../../apis/emailSchedulerScriptService';

const ScriptConfigModal = ({
  open,
  onCancel,
  onOpenScriptDetail,
  scriptOptions = [],
  onRefreshScripts
}) => {
  const [newScriptName, setNewScriptName] = useState('');
  const [newScriptType, setNewScriptType] = useState('scheduled');
  const [editingScript, setEditingScript] = useState(null);
  const [editScriptName, setEditScriptName] = useState('');
  const [editScriptType, setEditScriptType] = useState('schedule');

  const handleAddScript = async () => {
    if (!newScriptName.trim()) {
      message.warning('Vui lòng nhập tên kịch bản');
      return;
    }

    try {
      const newScript = {
        name: newScriptName.trim(),
        type: newScriptType,
        description: '',
        is_active: true
      };
      
      await createNewEmailSchedulerScript(newScript);
      message.success('Thêm kịch bản thành công');
      setNewScriptName('');
      setNewScriptType('scheduled');
      // Refresh scripts in parent component
      if (onRefreshScripts) {
        await onRefreshScripts();
      }
    } catch (error) {
      console.error('Error creating script:', error);
      message.error('Lỗi khi tạo kịch bản');
    }
  };

  const handleEditScript = (script) => {
    setEditingScript(script);
    setEditScriptName(script.name);
    setEditScriptType(script.type || 'scheduled');
  };

  const handleUpdateScript = async () => {
    if (!editScriptName.trim()) {
      message.warning('Vui lòng nhập tên kịch bản');
      return;
    }

    try {
      const updatedScript = {
        ...editingScript,
        name: editScriptName.trim(),
        type: editScriptType
      };
      
      await updateEmailSchedulerScript(updatedScript);
      
      message.success('Cập nhật kịch bản thành công');
      setEditingScript(null);
      setEditScriptName('');
      setEditScriptType('scheduled');
      // Refresh scripts in parent component
      if (onRefreshScripts) {
        await onRefreshScripts();
      }
    } catch (error) {
      console.error('Error updating script:', error);
      message.error('Lỗi khi cập nhật kịch bản');
    }
  };

  const handleCancelEdit = () => {
    setEditingScript(null);
    setEditScriptName('');
    setEditScriptType('scheduled');
  };

  const handleDeleteScript = async (scriptId) => {
    try {
      await deleteEmailSchedulerScript(scriptId);
      message.success('Xóa kịch bản thành công');
      // Refresh scripts in parent component
      if (onRefreshScripts) {
        await onRefreshScripts();
      }
    } catch (error) {
      console.error('Error deleting script:', error);
      message.error('Lỗi khi xóa kịch bản');
    }
  };

  const handleConfigureScript = (script) => {
    onOpenScriptDetail(script);
  };

  const columns = [
    {
      title: 'Tên kịch bản',
      dataIndex: 'name',
      width: '60%',
      key: 'name',
      render: (text, record) => {
        if (editingScript && editingScript.id === record.id) {
          return (
            <Input
              value={editScriptName}
              onChange={(e) => setEditScriptName(e.target.value)}
              onPressEnter={handleUpdateScript}
              // onBlur={handleCancelEdit}
              autoFocus
            />
          );
        }
        return <span>{text}</span>;
      }
    },
    {
      title: 'Loại kịch bản',
      dataIndex: 'type',
      width: '20%',
      key: 'type',
      render: (text, record) => {
        if (editingScript && editingScript.id === record.id) {
          return (
            <Select
              value={editScriptType}
              onChange={setEditScriptType}
              style={{ width: '100%' }}
              options={[
                { value: 'scheduled', label: 'Fixed Time' },
                { value: 'delay', label: 'Auto Delay' }
              ]}
            />
          );
        }
        const typeLabels = {
          'scheduled': 'Fixed Time',
          'delay': 'Auto Delay'
        };
        return <span>{typeLabels[record.type] || 'Chưa xác định'}</span>;
      }
    },
   

    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {editingScript && editingScript.id === record.id ? (
            <Space>
              <Button 
                type="primary" 
                size="small"
                onClick={handleUpdateScript}
              >
                Lưu
              </Button>
              <Button 
                size="small"
                onClick={handleCancelEdit}
              >
                Hủy
              </Button>
            </Space>
          ) : (
            <>
              <Button 
                type="link" 
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditScript(record)}
              >
                Sửa
              </Button>
              <Button 
                type="link" 
                size="small"
                icon={<SettingOutlined />}
                onClick={() => handleConfigureScript(record)}
              >
                Cấu hình Email
              </Button>
              <Popconfirm
                title="Xác nhận xóa"
                description="Bạn có chắc chắn muốn xóa kịch bản này?"
                onConfirm={() => handleDeleteScript(record.id)}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button 
                  type="link" 
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                >
                  Xóa
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <Modal
      title="Cấu hình Kịch bản Chăm sóc Khách hàng"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button
          key="cancel"
          onClick={onCancel}
        >
          Đóng
        </Button>
      ]}
      width={800}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Add New Script */}
        <div>
          <h4 style={{ marginBottom: '12px', color: '#374151' }}>Thêm kịch bản mới:</h4>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Input
              value={newScriptName}
              onChange={(e) => setNewScriptName(e.target.value)}
              placeholder="Nhập tên kịch bản chăm sóc mới..."
              onPressEnter={handleAddScript}
              style={{ flex: 1 }}
            />
            <Select
              value={newScriptType}
              onChange={setNewScriptType}
              style={{ width: '150px' }}
              options={[
                { value: 'scheduled', label: 'Fixed Time' },
                { value: 'delay', label: 'Auto Delay' }
              ]}
            />
            <Button
              type="primary"
              onClick={handleAddScript}
              disabled={!newScriptName.trim()}
              style={{ background: '#0ea5e9', borderColor: '#0ea5e9' }}
            >
              Thêm
            </Button>
          </div>
        </div>

        {/* Scripts Table */}
        <div>
          <h4 style={{ marginBottom: '12px', color: '#374151' }}>Danh sách kịch bản:</h4>
          <Table
            columns={columns}
            dataSource={scriptOptions}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </div>
      </div>
    </Modal>
  );
};

export default ScriptConfigModal;
